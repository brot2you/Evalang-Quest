'use strict';
/* Ev@lang Quest V7.1
 * Voice selection lists REAL speech synthesis voices installed in Firefox/system.
 * Named AI personas are not simulated. MP3 recordings, when supplied, are fixed.
 */
const v7Audio=new Audio();
v7Audio.preload='none';
let v7PlayingMode='none',v7Utterance=null;
function v7Stop(){
 try{v7Audio.pause();v7Audio.currentTime=0;}catch(_){}
 if('speechSynthesis' in window)speechSynthesis.cancel();
 v7PlayingMode='none';v7Utterance=null;
}
function v7Voices(){
 if(!('speechSynthesis' in window))return [];
 return speechSynthesis.getVoices().filter(v=>/^en([-_]|$)/i.test(v.lang));
}
function v7Speak(text,{rate=1,persona=''}={}){
 v7Stop();
 if(!('speechSynthesis' in window))return false;
 const voices=v7Voices(),picked=voices.find(v=>v.voiceURI===persona);
 const u=new SpeechSynthesisUtterance(text);
 u.lang=picked?.lang||'en-GB';
 if(picked)u.voice=picked;
 u.rate=Math.max(.7,Math.min(1.2,Number(rate)||1));
 u.pitch=1;
 v7Utterance=u;v7PlayingMode='speech';
 speechSynthesis.speak(u);return true;
}
function setupV7Audio(q){
 v7Stop();
 const play=document.getElementById('playAudio'),pause=document.getElementById('pauseAudio'),restart=document.getElementById('restartAudio'),speed=document.getElementById('audioSpeed'),persona=document.getElementById('audioPersona'),status=document.getElementById('audioStatus');
 const say=t=>{if(status?.isConnected)status.textContent=t;};
 const index=typeof bank!=='undefined'?bank.indexOf(q):-1;
 const prerecorded='assets/audio/q'+index+'.mp3';
 let hasRecording=false,isPaused=false,token=0;
 const listVoices=()=>{
  const previous=persona.value,voices=v7Voices();
  persona.replaceChildren();
  if(!voices.length){persona.add(new Option('Voix anglaise par défaut (navigateur)',''));persona.disabled=true;return;}
  persona.disabled=false;
  for(const v of voices)persona.add(new Option(v.name+' · '+v.lang+(v.localService?' · locale':''),v.voiceURI));
  if(voices.some(v=>v.voiceURI===previous))persona.value=previous;
  else persona.selectedIndex=Math.max(0,voices.findIndex(v=>/^en-GB$/i.test(v.lang)));
  if(!hasRecording)say(voices.length+' voix anglaise'+(voices.length>1?'s':'')+' détectée'+(voices.length>1?'s':'')+'. Choisis une voix et appuie sur Écouter.');
 };
 listVoices();
 if('speechSynthesis' in window){
  const previous=speechSynthesis.onvoiceschanged;
  speechSynthesis.onvoiceschanged=e=>{if(typeof previous==='function')previous.call(speechSynthesis,e);if(persona.isConnected)listVoices();};
 }
 (async()=>{
  try{const res=await fetch(prerecorded,{method:'HEAD'});hasRecording=res.ok;}catch(_){hasRecording=false;}
  if(!persona.isConnected)return;
  if(hasRecording){
   persona.disabled=true;
   say('Un fichier MP3 est disponible : sa voix est fixe. Le sélecteur n’agit que sur la synthèse vocale, en l’absence de MP3.');
  }else{listVoices();}
 })();
 const begin=async(restartFromStart=false)=>{
  const myToken=++token;
  if(hasRecording){
   if(restartFromStart || v7Audio.src!==new URL(prerecorded,location.href).href){v7Stop();v7Audio.src=prerecorded;}
   v7Audio.playbackRate=Number(speed.value)||1;
   try{await v7Audio.play();if(myToken!==token){v7Audio.pause();return;}v7PlayingMode='file';isPaused=false;say('Lecture MP3 en cours (voix fixe).');return;}
   catch(_){hasRecording=false;persona.disabled=false;listVoices();}
  }
  if(!restartFromStart&&isPaused&&v7PlayingMode==='speech'&&'speechSynthesis' in window){speechSynthesis.resume();isPaused=false;say('Lecture reprise.');return;}
  const selected=persona.value;
  isPaused=false;
  const ok=v7Speak(q.t,{rate:speed.value,persona:selected});
  say(ok?'Lecture par la voix sélectionnée dans ton navigateur.':'Synthèse vocale indisponible sur cet appareil.');
 };
 play.onclick=()=>begin(false);
 pause.onclick=()=>{
  if(v7PlayingMode==='file'){v7Audio.pause();isPaused=true;say('Lecture en pause.');}
  else if(v7PlayingMode==='speech'&&'speechSynthesis' in window){speechSynthesis.pause();isPaused=true;say('Lecture en pause.');}
 };
 restart.onclick=()=>begin(true);
 speed.onchange=()=>{if(v7PlayingMode==='file')v7Audio.playbackRate=Number(speed.value);};
 persona.onchange=()=>{if(v7PlayingMode==='speech')v7Stop();say('Voix sélectionnée : '+persona.options[persona.selectedIndex]?.text+'. Appuie sur Écouter.');};
}
