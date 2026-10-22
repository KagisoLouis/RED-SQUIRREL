import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {alignSentences} from './alignment.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicDir=path.join(root,'public'),audioDir=path.join(publicDir,'audio');
const ctx={window:{}};vm.runInNewContext(await fs.readFile(path.join(publicDir,'book.js'),'utf8'),ctx);const book=ctx.window.BOOK;
await fs.mkdir(audioDir,{recursive:true});
const key=process.env.ELEVENLABS_API_KEY,voice=process.env.ELEVENLABS_VOICE_ID,model=process.env.ELEVENLABS_MODEL||'eleven_multilingual_v2';
const cacheFile=path.join(audioDir,'generation-cache.json');let cache={};try{cache=JSON.parse(await fs.readFile(cacheFile,'utf8'))}catch{}
const chapters=[];
async function request(text){
 for(let attempt=0;attempt<4;attempt++){
  const res=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/with-timestamps?output_format=mp3_44100_128`,{
   method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({text,model_id:model}),signal:AbortSignal.timeout(180000)
  });
  if(res.ok)return res.json();
  if((res.status===429||res.status>=500)&&attempt<3){const raw=Number(res.headers.get('retry-after'));await new Promise(r=>setTimeout(r,Math.min(30,raw>0?raw:2**attempt)*1000));continue}
  throw new Error(`Narration service returned HTTP ${res.status}. Check the API key, voice access and available credits. No key is written to the website.`);
 }
}
for(let ci=0;ci<book.chapters.length;ci++){
 const lines=[];book.pages.forEach((p,page)=>{if(p.chapter===ci)p.lines.forEach((l,line)=>lines.push({page,line,text:l.cn}))});
 const text=lines.map(l=>l.text).join('\n'),name=`chapter-${String(ci+1).padStart(2,'0')}.mp3`,file=path.join(audioDir,name);
 const textHash=crypto.createHash('sha256').update(text).digest('hex');
 const prior=cache[name];let bytes=null;try{bytes=await fs.readFile(file)}catch{}
 const voiceMatches=!voice||prior?.voice===voice;const audioHash=bytes?crypto.createHash('sha256').update(bytes).digest('hex'):null;
 if(bytes?.length>128&&prior?.textHash===textHash&&prior?.audioHash===audioHash&&prior?.model===model&&voiceMatches&&prior?.segments?.length===lines.length){
  chapters.push({src:`audio/${name}`,segments:prior.segments});console.log(`Using existing recording ${ci+1}/${book.chapters.length}`);continue;
 }
 if(!key||!voice)throw new Error('Recordings have not been generated. Add ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID as build environment variables, or generate audio locally and commit the public/audio folder. This build stops rather than publishing silent playback.');
 console.log(`Generating chapter ${ci+1}/${book.chapters.length} (${Array.from(text).length} characters)`);
 const result=await request(text);
 const segments=alignSentences(lines,result.alignment);
 if(typeof result.audio_base64!=='string')throw new Error('The narration response contains no audio.');
 bytes=Buffer.from(result.audio_base64,'base64');
 const mp3=bytes.subarray(0,3).toString()==='ID3'||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0);
 if(!mp3||bytes.length<128)throw new Error('The narration response is not a valid MP3 file.');
 await fs.writeFile(file,bytes);
 cache[name]={textHash,audioHash:crypto.createHash('sha256').update(bytes).digest('hex'),voice,model,segments};
 await fs.writeFile(cacheFile,JSON.stringify(cache,null,2));
 chapters.push({src:`audio/${name}`,segments});
}
const manifest={version:1,chapters,chapterCount:chapters.length,pageCount:book.pages.length,narration:'AI-generated Mandarin narration'};
await fs.writeFile(path.join(publicDir,'audio-manifest.js'),'window.AUDIO_MANIFEST='+JSON.stringify(manifest)+';');
await fs.writeFile(path.join(audioDir,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(`Ready: ${chapters.length} recorded chapters, ${book.pages.length} synchronized pages. No phone text-to-speech is used.`);
