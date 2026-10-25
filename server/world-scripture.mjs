export async function handleWorldScripture(request,env={},fetcher=fetch){
 const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean);
 const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':status===200?'public, max-age=86400':'no-store'}});
 if(request.method!=='GET')return json({error:'Use GET.'},405);
 const catalogue=parts.length===3&&parts[2]==='books';
 const book=parts[2]?.toUpperCase(),chapter=Number(parts[3]),version=url.searchParams.get('version')?.toUpperCase()||'KJV';
 if(!['KJV','NKJV'].includes(version))return json({error:'Only KJV and NKJV are available.'},400);
 if(!catalogue&&(parts.length!==4||!/^[A-Z0-9]{2,5}$/.test(book)||!Number.isInteger(chapter)||chapter<1||chapter>150))return json({error:'Invalid Bible reference.'},400);
 if(!catalogue&&version==='NKJV')return json({error:'NKJV is not configured in this reader. Use the NKJV publisher reader below.'},503);
 try{
  const response=await fetcher(`https://bible.helloao.org/api/eng_kjv/${catalogue?'books':`${book}/${chapter}`}.json`,{headers:{accept:'application/json'},signal:AbortSignal.timeout(8000)});
  if(!response.ok)return json({error:'Bible source unavailable.'},response.status===404?404:502);
  const data=await response.json();return json(catalogue?{books:data.books||[],translations:['KJV','NKJV']}:{...data,translation:'KJV'});
 }catch{return json({error:'Bible source unavailable. Please try again when connected.'},503);}
}
