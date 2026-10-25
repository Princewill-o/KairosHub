export function scopedStorage(original,prefix){
 const memory=new Map();
 const keys=()=>{const result=new Set(memory.keys());try{for(let i=0;i<original.length;i++){const k=original.key(i);if(k?.startsWith(prefix))result.add(k.slice(prefix.length));}}catch{}return [...result];};
 const api={getItem(key){try{return original?.getItem(prefix+key)??memory.get(String(key))??null;}catch{return memory.get(String(key))??null;}},setItem(key,value){memory.set(String(key),String(value));try{original?.setItem(prefix+key,String(value));}catch{}},removeItem(key){memory.delete(String(key));try{original?.removeItem(prefix+key);}catch{}},key(index){return keys()[index]??null;},clear(){for(const key of keys())api.removeItem(key);},get length(){return keys().length;}};
 return new Proxy(api,{ownKeys:keys,getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});
}
