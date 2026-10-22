(function(root){
'use strict';
class RecordedAudioController{
 constructor(o){
  this.o=o;this.audio=o.audio||new Audio();this.manifest=o.manifest;
  this.state='idle';this.generation=0;this.chapter=-1;this.currentSegment=-1;this.pendingSeek=null;
  this.audio.preload='auto';this.audio.playbackRate=.85;
 }
 notify(state,message=''){this.state=state;this.o.onState(state,message)}
 stop(){this.generation++;this.audio.onended=null;this.audio.onerror=null;this.audio.onplaying=null;this.audio.ontimeupdate=null;this.audio.onwaiting=null;this.audio.pause();this.o.onHighlight(-1);this.notify('idle')}
 pause(){if(!['playing','loading'].includes(this.state))return;this.generation++;this.audio.pause();this.o.onHighlight(-1);this.notify('paused')}
 toggle(){return ['playing','loading'].includes(this.state)?this.pause():this.play()}
 play(){
  if(['playing','loading'].includes(this.state))return;
  if(!this.manifest?.chapters?.length){this.notify('idle','The narration files are not available for this edition yet.');return}
  const resuming=this.state==='paused',token=++this.generation;
  if(!resuming){
   const page=this.o.getPage();this.chapter=this.manifest.chapters.findIndex(c=>c.segments.some(s=>s.page===page));
   if(this.chapter<0){this.notify('idle','This page has no recorded narration.');return}
   this.currentSegment=this.manifest.chapters[this.chapter].segments.findIndex(s=>s.page===page);
  }
  this.loadChapter(token,resuming);
 }
 loadChapter(token,resuming=false){
  const chapter=this.manifest.chapters[this.chapter],audio=this.audio;
  if(!chapter){this.notify('idle','Book finished.');return}
  const first=chapter.segments[this.currentSegment];
  if(!first){this.notify('idle','The narration timing is incomplete.');return}
  const target=new URL(chapter.src,this.o.baseUrl||document.baseURI).href;
  const changed=audio.src!==target;
  this.notify('loading');
  if(first.page!==this.o.getPage())this.o.onPage(first.page);
  audio.onplaying=()=>{if(token!==this.generation)return;this.notify('playing');this.sync(token)};
  audio.onwaiting=()=>{if(token===this.generation&&this.state==='playing')this.notify('loading')};
  audio.ontimeupdate=()=>this.sync(token);
  audio.onerror=()=>{
   if(token!==this.generation)return;
   this.generation++;audio.pause();this.o.onHighlight(-1);
   this.notify('paused','This audio file could not load. Check your connection, then tap Resume.');
  };
  audio.onended=()=>{
   if(token!==this.generation||!['playing','loading'].includes(this.state))return;
   this.o.onHighlight(-1);
   if(this.chapter+1>=this.manifest.chapters.length){this.notify('idle','Book finished.');return}
   this.chapter++;this.currentSegment=0;this.loadChapter(token);
  };
  if(changed){audio.src=target;audio.load()}
  if(!resuming||changed)this.pendingSeek=first.start;
  if(this.pendingSeek!==null){
   const seek=()=>{if(token===this.generation){audio.currentTime=this.pendingSeek;this.pendingSeek=null}};
   if(audio.readyState>=1)seek();else audio.addEventListener('loadedmetadata',seek,{once:true});
  }
  audio.playbackRate=.85;
  try{
   const promise=audio.play();
   promise?.catch(()=>{if(token!==this.generation)return;this.generation++;audio.pause();this.o.onHighlight(-1);this.notify('paused','Playback was interrupted. Tap Resume to continue.');});
  }catch{audio.onerror()}
 }
 sync(token){
  if(token!==this.generation||!['playing','loading'].includes(this.state))return;
  const segments=this.manifest.chapters[this.chapter].segments,t=this.audio.currentTime;
  let i=0;while(i+1<segments.length&&segments[i+1].start<=t+.025)i++;
  const segment=segments[i];this.currentSegment=i;
  if(segment.page!==this.o.getPage())this.o.onPage(segment.page);
  this.o.onHighlight(t<=segment.end+.1?segment.line:-1);
 }
}
if(typeof module!=='undefined'&&module.exports)module.exports=RecordedAudioController;
else root.ReaderAudioController=RecordedAudioController;
})(typeof window!=='undefined'?window:globalThis);
