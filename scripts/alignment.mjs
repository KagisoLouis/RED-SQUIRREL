const spoken=ch=>/[\p{L}\p{N}]/u.test(ch);
export function alignSentences(lines,alignment){
 if(!alignment?.characters||!alignment.character_start_times_seconds||!alignment.character_end_times_seconds)throw new Error('The narration provider did not return character timings.');
 const {characters:chars,character_start_times_seconds:starts,character_end_times_seconds:ends}=alignment;
 if(chars.length!==starts.length||chars.length!==ends.length)throw new Error('Narration timing arrays have different lengths.');
 for(let i=0;i<starts.length;i++)if(!Number.isFinite(starts[i])||!Number.isFinite(ends[i])||starts[i]<0||ends[i]<starts[i]||(i&&starts[i]<starts[i-1]))throw new Error('Narration timing values are invalid.');
 const expected=lines.map(l=>Array.from(l.text).filter(spoken).join('')).join('');
 const indices=[];chars.forEach((s,i)=>{for(const ch of s)if(spoken(ch))indices.push({ch,i})});
 if(indices.map(x=>x.ch).join('')!==expected)throw new Error('Audio alignment differs from the story text. Refusing to publish incorrectly timed pages.');
 let pos=0;
 return lines.map(l=>{
  const count=Array.from(l.text).filter(spoken).length;
  if(!count)throw new Error('A story sentence contains no spoken characters.');
  const start=starts[indices[pos].i],end=ends[indices[pos+count-1].i];pos+=count;
  return {page:l.page,line:l.line,start,end};
 });
}
