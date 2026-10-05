import test from 'node:test';import assert from 'node:assert/strict';
import {AGE,bandFor,canSelfRegister,checkEmails,checkName,createAccounts} from './public/accounts.mjs';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};

test('16 and over can sign up alone; 18 and over get KairosGames, everyone younger gets Kids',()=>{
 assert.equal(AGE.self,16);assert.equal(AGE.adult,18);
 assert.equal(canSelfRegister(15),false);assert.equal(canSelfRegister(16),true);
 assert.equal(bandFor(17),'kids');assert.equal(bandFor(18),'adult');assert.equal(bandFor(8),'kids');
});
test('emails must be valid and match, ignoring case and spaces',()=>{
 assert.equal(checkEmails('a@b.co',' A@B.co ').ok,true);
 assert.match(checkEmails('a@b.co','a@b.com').error,/match/);
 assert.match(checkEmails('not-an-email','not-an-email').error,/valid/);
});
test('names are first names or nicknames only',()=>{
 assert.equal(checkName('Ama').ok,true);assert.equal(checkName("Mary-Jo O'Neil").ok,true);
 assert.equal(checkName('').ok,false);assert.equal(checkName('x'.repeat(30)).ok,false);assert.equal(checkName('ama@mail.com').ok,false);
});
test('a 16-year-old signs up alone and plays Kids; an 18-year-old plays KairosGames',()=>{
 const a=createAccounts(memory());
 const teen=a.signUpSelf({name:'Leo',age:16,email:'leo@x.co',emailConfirm:'leo@x.co',agreed:true,character:'leo'});
 assert.equal(teen.band,'kids');assert.equal(a.active().id,teen.id);
 const adult=a.signUpSelf({name:'Sam',age:19,email:'sam@x.co',emailConfirm:'sam@x.co',agreed:true});
 assert.equal(adult.band,'adult');
 assert.throws(()=>a.signUpSelf({name:'Tia',age:12,email:'t@x.co',emailConfirm:'t@x.co',agreed:true}),/parent/);
 assert.throws(()=>a.signUpSelf({name:'Tia',age:17,email:'t@x.co',emailConfirm:'t@x.co',agreed:false}),/agree/);
});
test('under-16s are added by a parent who is 18+, with matching emails and consent',()=>{
 const store=memory(),a=createAccounts(store);
 assert.throws(()=>a.signUpParent({name:'Kofi',age:17,email:'k@x.co',emailConfirm:'k@x.co',consent:true}),/18/);
 assert.throws(()=>a.signUpParent({name:'Kofi',age:40,email:'k@x.co',emailConfirm:'k@y.co',consent:true}),/match/);
 assert.throws(()=>a.signUpParent({name:'Kofi',age:40,email:'k@x.co',emailConfirm:'k@x.co',consent:false}),/consent/);
 const parent=a.signUpParent({name:'Kofi',age:40,email:'k@x.co',emailConfirm:'k@x.co',consent:true});
 const child=a.addChild(parent.id,{name:'Ama',age:9,character:'ama'});
 assert.equal(child.band,'kids');assert.equal(child.parentId,parent.id);assert.equal(child.email,undefined);
 assert.equal(a.active().id,child.id);
 const me=a.playAsParent(parent.id);assert.equal(me.band,'adult');assert.equal(a.playAsParent(parent.id).id,me.id,'reuses the same profile');
 assert.equal(createAccounts(store).players().length,2,'saved on the device');
 assert.ok(!JSON.stringify(JSON.parse(store.getItem('kairos-accounts-v1'))).match(/password/i),'no passwords are stored');
});
test('existing progress moves to the first player, and progress keys are per player',()=>{
 const store=memory();store.setItem('kairos-bible-v1','{"quiz":{"runs":1,"best":80}}');
 const a=createAccounts(store);const p=a.signUpSelf({name:'Leo',age:16,email:'l@x.co',emailConfirm:'l@x.co',agreed:true});
 assert.equal(a.progressKey('kairos-bible-v1'),'kairos-bible-v1:'+p.id);
 assert.equal(store.getItem('kairos-bible-v1:'+p.id),'{"quiz":{"runs":1,"best":80}}');
 a.signOut();assert.equal(a.active(),null);assert.equal(a.progressKey('kairos-bible-v1'),'kairos-bible-v1');
});
test('storage failures do not break sign-up',()=>{
 const broken={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){}};
 const a=createAccounts(broken);const p=a.signUpSelf({name:'Leo',age:20,email:'l@x.co',emailConfirm:'l@x.co',agreed:true});
 assert.equal(a.active().id,p.id);assert.equal(a.saved,false);
});
