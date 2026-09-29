import test from 'node:test';import assert from 'node:assert/strict';
import {bibleGames,questions,crossword} from './public/bible/content.mjs';
import {bibleAnswer,bibleWordLine,bibleBingo,bibleCrossword,bibleShuffle} from './public/learning-engine.mjs';
test('sixteen unique games and answerable questions with references',()=>{
 assert.equal(new Set(bibleGames.map(g=>g.id)).size,16);
 for(const q of questions){assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,4);assert.ok(q.ref);}
});
test('answer normalization accepts punctuation and aliases without partial matches',()=>{
 assert.ok(bibleAnswer('  NOAH! ','Noah'));assert.ok(bibleAnswer('Saul','Paul',['Saul']));assert.ok(!bibleAnswer('no','Noah'));
});
test('word search selects straight lines only and supports reverse direction',()=>{
 const grid=['NOAH','ABCD','EFGH','IJKL'];
 assert.equal(bibleWordLine(grid,0,3),'NOAH');assert.equal(bibleWordLine(grid,3,0),'HAON');assert.equal(bibleWordLine(grid,0,6),'');
});
test('bingo needs a full row, column or diagonal',()=>{
 assert.ok(bibleBingo([0,1,2]));assert.ok(bibleBingo([0,4,8]));assert.ok(!bibleBingo([0,1,8]));
});
test('crossword intersections agree and shuffle preserves each item',()=>{
 const board=bibleCrossword(crossword);assert.equal(board[0].join(''),'JERUSALEM');
 assert.equal(board[4][0],'H');assert.equal(board[4][8],'S');
 assert.deepEqual(bibleShuffle([1,2,3,4],()=>.2).sort(),[1,2,3,4]);
});
