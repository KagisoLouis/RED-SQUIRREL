(()=>{
'use strict';
const book=window.BOOK,$=id=>document.getElementById(id),key='shadow-ledger-easy-v1';
let stored={};try{stored=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
const queryPage=Number(new URLSearchParams(location.search).get('page'));
let index=Math.max(0,Math.min(book.pages.length-1,queryPage>0?queryPage-1:Number(stored.index)||0));
const glossary={
 '路易':['Lù Yì','Louis · the main character'], '影门':['Yǐng Mén','Shadow Gate · the assassin cult'], '黑川':['Hēi Chuān','Kurokawa · leader of Shadow Gate'], '莎拉':['Shā Lā','Sarah · the intelligence officer'], '伊万':['Yī Wàn','Ivan · the old intelligence contact'], '马克':['Mǎ Kè','Mark · the middleman'], '小雪':['Xiǎo Xuě','Xiaoxue · the computer specialist'], '阿卜杜拉':['Ā Bǔ Dù Lā','Abdullah · the oil tycoon'],
 '摩萨德':['Mó Sà Dé','Mossad · Israeli intelligence agency'], '中情局':['Zhōngqíngjú','CIA · American intelligence agency'], '克格勃':['Kè Gē Bó','KGB · former Soviet intelligence agency'], '账本':['zhàngběn','ledger · a book recording financial accounts'], '账房':['zhàngfáng','counting room · where the accounts are kept'], '首领':['shǒulǐng','leader of a group'], '叛徒':['pàntú','traitor · someone who betrays their group'], '背叛':['bèipàn','to betray'], '保镖':['bǎobiāo','bodyguard'], '徽章':['huīzhāng','badge · here, a mark of cult membership'], '弟子':['dìzǐ','disciple · someone trained by a master'], '游艇':['yóutǐng','yacht · a private pleasure boat'], '甲板':['jiǎbǎn','deck of a ship'], '救生艇':['jiùshēngtǐng','lifeboat'], '开曼群岛':['Kāimàn Qúndǎo','Cayman Islands'], '石油大亨':['shíyóu dàhēng','oil tycoon · a very wealthy oil businessman'], '枪':['qiāng','gun'], '刀':['dāo','knife; blade'], '血':['xuè','blood'], '枪响':['qiāngxiǎng','gunshot'], '暗杀':['ànshā','assassination'], '报仇':['bàochóu','to avenge someone'], '证人':['zhèngrén','witness'], '加密货币':['jiāmì huòbì','cryptocurrency'], '三亿':['sān yì','three hundred million · 亿 means 100 million'], '十三亿':['shísān yì','1.3 billion · thirteen times 100 million'], '证据':['zhèngjù','evidence'], '亲生父亲':['qīnshēng fùqin','biological father'], '被捕':['bèibǔ','to be arrested']
};
const glossaryKeys=Object.keys(glossary).sort((a,b)=>b.length-a.length);
function showWord(word){$('word').textContent=word.cn;$('wordPy').textContent=word.py;$('wordEn').textContent=word.en.replace(/; extra story (word|term)/,'');$('extra').textContent=word.en.includes('; extra story')?'Story word':'';requestAnimationFrame(fit)}
const settings={pinyin:stored.pinyin!==false,meaning:stored.meaning!==false,groups:stored.groups!==false};
function fit(){
 const app=$('app');app.classList.remove('tight','tighter','minimal');
 function fits(){const r=$('reading').getBoundingClientRect(),a=$('reading').firstElementChild?.getBoundingClientRect(),b=$('reading').lastElementChild?.getBoundingClientRect();return a&&a.top>=r.top-1&&b.bottom<=r.bottom+1}
 for(const cls of ['tight','tighter','minimal']){if(fits())break;app.classList.add(cls)}
}
function save(){try{localStorage.setItem(key,JSON.stringify({index,...settings}))}catch{}}
function render(keepPlayback=false){
 if(!keepPlayback)player.stop();$('status').textContent='';
 const p=book.pages[index],ch=book.chapters[p.chapter];
 $('chapterCount').textContent=`Chapter ${String(p.chapter+1).padStart(2,'0')} / ${book.chapters.length}`;
 $('chapterTitle').textContent=ch.cn;$('chapterName').textContent=ch.en;
 $('pageNumber').textContent=`${index+1} / ${book.pages.length}`;
 $('reading').replaceChildren();
 for(const line of p.lines){
  const el=document.createElement('article');el.className='sentence';
  const cn=document.createElement('div');cn.className='cn';cn.lang='zh-CN';
  for(const c of line.chunks){const term=glossaryKeys.find(k=>c.cn.includes(k));const token=document.createElement(term?'button':'span');token.className='chunk';if(term){token.setAttribute('aria-label','Explain '+term);token.onclick=()=>showWord({cn:term,py:glossary[term][0],en:glossary[term][1]+'; extra story word'})}const h=document.createElement('span');h.className='han';h.textContent=c.cn;const py=document.createElement('span');py.className='py';py.lang='zh-Latn';py.textContent=c.py;token.append(h,py);cn.append(token)}
  const en=document.createElement('div');en.className='english';en.textContent=line.en;
  el.append(cn,en);$('reading').append(el);
 }
 showWord(p.word);
 $('prev').disabled=index===0;$('next').textContent=index===book.pages.length-1?'↺':'→';$('next').setAttribute('aria-label',index===book.pages.length-1?'Read again from the beginning':'Next page');
 $('progress').style.width=((index+1)/book.pages.length*100)+'%';
 const chapterStart=ch.start,chapterEnd=book.chapters[p.chapter+1]?.start??book.pages.length;
 $('progressText').textContent=index===book.pages.length-1?'The end · 故事结束':`Chapter page ${index-chapterStart+1} of ${chapterEnd-chapterStart}`;
 $('chapterSelect').value=String(p.chapter);$('jumpPage').value=index+1;$('jumpPage').max=book.pages.length;$('jumpLabel').textContent=`Or go to a page (1–${book.pages.length})`;
 document.title=`${index+1} · ${ch.en} — Shadow Ledger`;
 save();
}
for(const name of ['pinyin','meaning','groups']){
 function update(){ $('app').classList.toggle('no-'+({pinyin:'pinyin',meaning:'english',groups:'groups'}[name]),!settings[name]);$(name).setAttribute('aria-pressed',String(settings[name]));}
 update();$(name).onclick=()=>{settings[name]=!settings[name];update();save();requestAnimationFrame(fit)};
}
function move(n){const next=Math.max(0,Math.min(book.pages.length-1,index+n));if(next!==index){index=next;render()}}
$('prev').onclick=()=>move(-1);$('next').onclick=()=>{if(index===book.pages.length-1){index=0;render()}else move(1)};
book.chapters.forEach((c,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${String(i+1).padStart(2,'0')} · ${c.cn} / ${c.en}`;$('chapterSelect').append(o)});
$('menu').onclick=()=>{player.pause();$('chapterSelect').value=book.pages[index].chapter;$('jumpPage').value=index+1;$('dialog').showModal()};$('close').onclick=()=>$('dialog').close();
$('chapterSelect').onchange=()=>{index=book.chapters[Number($('chapterSelect').value)].start;$('dialog').close();render()};
$('jump').onclick=()=>{const n=Number($('jumpPage').value);if(!Number.isInteger(n)||n<1||n>book.pages.length){$('jumpPage').reportValidity();return}index=n-1;$('dialog').close();render()};
$('dialog').onclick=e=>{if(e.target===$('dialog')){const r=$('dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('dialog').close()}};
$('notes').onclick=()=>{
 player.pause();
 const text=book.pages[index].lines.map(l=>l.cn).join(' ');let title='Read in meaning groups',help='Start with who, then what happens. A group can contain several characters. Read each whole group before moving to the next.',sample=book.pages[index].lines[0].chunks.map(c=>c.cn).join(' / ');
 if(text.includes('把')){title='把 · what happens to something';help='把 introduces the thing being acted on. Read: person + 把 + object + what happens to it. In this passage, follow the object after 把.';sample=book.pages[index].lines.find(l=>l.cn.includes('把')).cn}
 else if(text.includes('被')){title='被 · receiving the action';help='被 marks the person or thing that receives an action. It often corresponds to “was” or “is” + an action in English. The receiver comes before 被.';sample=book.pages[index].lines.find(l=>l.cn.includes('被')).cn}
 else if(/(?:去|见|问|赚|做|教)过/.test(text)){title='过 · something experienced before';help='过 after a verb can show that someone has done or experienced something before. Here it is part of the verb group, not a separate event.';sample=book.pages[index].lines.find(l=>/(?:去|见|问|赚|做|教)过/.test(l.cn)).cn}
 else if(text.includes('了')){title='了 · notice the change';help='了 can mark a completed action or a new situation. Use this passage’s English to see what has happened or changed. It is not a word you need to translate separately.';sample=book.pages[index].lines.find(l=>l.cn.includes('了')).cn}
 else if(text.includes('的')){title='的 · connect a description to a noun';help='的 links the words before it to a noun after it. It can show ownership (“his father”) or describe which person or thing we mean. Read the whole group together.';sample=book.pages[index].lines.find(l=>l.cn.includes('的')).cn}
 $('noteTitle').textContent=title;$('noteText').textContent=help;$('noteExample').textContent=sample;$('noteDialog').showModal();
};$('noteClose').onclick=()=>$('noteDialog').close();
document.addEventListener('keydown',e=>{if($('dialog').open||$('noteDialog').open||['INPUT','SELECT','BUTTON'].includes(document.activeElement.tagName))return;if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}});
let touch=null;$('reading').addEventListener('touchstart',e=>{touch={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY}},{passive:true});$('reading').addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);touch=null},{passive:true});
const player=new window.ReaderAudioController({
 manifest:window.AUDIO_MANIFEST,
 getPage:()=>index,getLines:page=>book.pages[page].lines.map(l=>l.cn),totalPages:book.pages.length,
 onPage:page=>{index=page;render(true)},
 onHighlight:line=>{Array.from($('reading').children).forEach((el,i)=>el.classList.toggle('speaking',i===line))},
 onState:(state,message)=>{
  $('listen').textContent=({playing:'Ⅱ Pause',loading:'Ⅱ Wait',paused:'▶ Resume',idle:'▶ Play'})[state];
  $('listen').setAttribute('aria-label',({playing:'Pause continuous reading',loading:'Cancel loading audio',paused:'Resume continuous reading',idle:'Play continuously'})[state]);
  $('listen').setAttribute('aria-pressed',String(state==='playing'||state==='loading'));
  $('status').textContent=message;
  $('playHint').textContent=state==='playing'?'Reading Chinese · pages turn automatically':state==='paused'?'Paused · resumes where you stopped':'Tap Play once · automatic page turns';
  requestAnimationFrame(fit);
 }
});
$('listen').onclick=()=>player.toggle();
window.addEventListener('pagehide',()=>player.stop());
render();
window.addEventListener('resize',()=>requestAnimationFrame(fit));if(document.fonts)document.fonts.ready.then(fit);
})();
