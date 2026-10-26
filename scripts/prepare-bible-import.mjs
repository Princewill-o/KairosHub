import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
export function validateBibleImport(books,questions,source){
 if(books.length!==66||source.books?.length!==66)throw Error('Expected 66 Bible books.');
 const verses=[],ids=new Set();
 for(let i=0;i<66;i++){
  const book=source.books[i],expected=books[i];
  if(expected.id!==i+1||book.englishName!==expected.name||book.testament!==expected.testament)throw Error(`Book order mismatch at ${i+1}`);
  for(let c=0;c<book.chapters.length;c++){
   const chapter=book.chapters[c];if(chapter.chapter!==c+1)throw Error('Non-contiguous chapter numbers.');
   for(let n=0;n<chapter.verses.length;n++){
    const v=chapter.verses[n];if(v.number!==n+1||typeof v.text!=='string'||!v.text.trim())throw Error('Invalid or missing verse.');
    verses.push({translation_code:'KJV',book_id:i+1,chapter:c+1,verse:n+1,text:v.text});
   }
  }
 }
 if(verses.length!==31102)throw Error(`Expected 31,102 verses; found ${verses.length}`);
 const normalized=questions.map(q=>{
  const answer=q.correct_answer??q.correctAnswer;
  if(!q.id||ids.has(q.id)||!Array.isArray(q.options)||q.options.length!==4||new Set(q.options).size!==4||!q.options.includes(answer)||!q.reference||!['easy','medium','hard'].includes(q.difficulty)||!Number.isInteger(q.points)||q.points<1)throw Error('Invalid quiz question: '+q.id);
  ids.add(q.id);return {id:q.id,question:q.question,options:q.options,correct_answer:answer,reference:q.reference,difficulty:q.difficulty,category:q.category,points:q.points,explanation:q.explanation||''};
 });
 return {books,questions:normalized,verses};
}
const literal=value=>"'"+JSON.stringify(value).replaceAll("'","''")+"'::jsonb";
export function importSql(table,records,columns){
 const types={id:table==='bible_books'?'integer':'text',options:'jsonb',points:'integer',book_id:'integer',chapter:'integer',verse:'integer'};
 return `INSERT INTO public.${table} (${columns.join(',')}) SELECT ${columns.join(',')} FROM jsonb_to_recordset(${literal(records)}) AS r(${columns.map(c=>c+' '+(types[c]||'text')).join(',')}) ON CONFLICT DO NOTHING;`;
}
if(process.argv[1]?.endsWith('prepare-bible-import.mjs')){
 const sourceFile=process.argv[2],output=process.argv[3];if(!sourceFile||!output)throw Error('Usage: node scripts/prepare-bible-import.mjs <kjv-source.json> <output-directory>');
 const sourceText=await fs.readFile(sourceFile,'utf8');const source=JSON.parse(sourceText);
 const books=JSON.parse(await fs.readFile('supabase/imports/bible-kit/books.json','utf8')),questions=JSON.parse(await fs.readFile('supabase/imports/bible-kit/questions.json','utf8'));
 const data=validateBibleImport(books,questions,source);await fs.mkdir(output,{recursive:true});
 await fs.writeFile(path.join(output,'metadata.sql'),importSql('bible_books',books,['id','name','testament'])+'\n'+importSql('bible_quiz_questions',data.questions,['id','question','options','correct_answer','reference','difficulty','category','points','explanation']));
 for(let i=0;i<data.verses.length;i+=400)await fs.writeFile(path.join(output,`verses-${String(i/400).padStart(3,'0')}.sql`),importSql('bible_verses',data.verses.slice(i,i+400),['translation_code','book_id','chapter','verse','text']));
 const manifest={source:'https://raw.githubusercontent.com/midvash/bible-data/main/versions/en/kjv/kjv.json',sha256:createHash('sha256').update(sourceText).digest('hex'),books:books.length,verses:data.verses.length,questions:questions.length,chapters:new Set(data.verses.map(v=>v.book_id+':'+v.chapter)).size,batches:Math.ceil(data.verses.length/400)};
 await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest));
}
