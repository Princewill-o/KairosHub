import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateBibleImport,importSql} from './scripts/prepare-bible-import.mjs';
const books=JSON.parse(await readFile('supabase/imports/bible-kit/books.json','utf8'));
const questions=JSON.parse(await readFile('supabase/imports/bible-kit/questions.json','utf8'));
test('import kit has 66 ordered books and 170 valid, unique four-choice questions',()=>{
 assert.equal(books.length,66);assert.deepEqual(books.map(b=>b.id),Array.from({length:66},(_,i)=>i+1));assert.equal(questions.length,170);assert.equal(new Set(questions.map(q=>q.id)).size,170);
 for(const q of questions){assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.correctAnswer));assert.ok(q.reference);}
});
test('validator rejects an incomplete corpus and a mismatched book order',()=>{
 assert.throws(()=>validateBibleImport(books,questions,{books:[]}),/66/);
 assert.throws(()=>validateBibleImport(books,questions,{books:books.map(b=>({englishName:b.name==='Genesis'?'Gen':b.name,testament:b.testament,chapters:[]}))}),/mismatch/);
});
test('generated imports escape apostrophes and preserve existing records',()=>{
 const sql=importSql('bible_verses',[{text:"God's word"}],['text']);assert.match(sql,/God''s word/);assert.match(sql,/ON CONFLICT DO NOTHING/);assert.match(sql,/jsonb_to_recordset/);assert.doesNotMatch(sql,/DELETE|TRUNCATE/);
});
test('Bible import grants read-only text access and keeps answer keys private',async()=>{
 const sql=await readFile('supabase/migrations/20261026001616_import_bible_kit.sql','utf8');
 assert.equal((sql.match(/ENABLE ROW LEVEL SECURITY/g)||[]).length,4);
 assert.match(sql,/GRANT SELECT ON public.bible_translations,public.bible_books,public.bible_verses TO anon,authenticated/);
 assert.doesNotMatch(sql,/GRANT SELECT ON[^;]*bible_quiz_questions[^;]*TO anon/);
 assert.match(sql,/'KJV','King James Version','pending_import'/);
});
