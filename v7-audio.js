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
 const play=document.getElementById('playAudio'),pause=document.getElementById('pauseAudio'),
 restart=document.getElementById('restartAudio'),speed=document.getElementById('audioSpeed'),
 persona=document.getElementById('audioPersona'),status=document.getElementById('audioStatus');
 const say=t=>{if(status?.isConnected)status.textContent=t;};
 const index=typeof bank!=='undefined'?bank.indexOf(q):-1;
 // Use absolute repo-root URL to avoid relative path resolution.
 const prerecorded='/Evalang-Quest/assets/audio/q'+index+'.mp3';
 let isPaused=false,loadedMP3=false;
 const listVoices=()=>{
  const previous=persona.value,voices=v7Voices();
  persona.replaceChildren();
  if(!voices.length){persona.add(new Option('Voix par défaut du navigateur',''));persona.disabled=true;return;}
  persona.disabled=false;
  for(const v of voices)persona.add(new Option(v.name+' · '+v.lang,v.voiceURI));
  if(voices.some(v=>v.voiceURI===previous))persona.value=previous;
  else persona.selectedIndex=Math.max(0,voices.findIndex(v=>/^en-GB$/i.test(v.lang)));
 };
 listVoices();
 if('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged',()=>{if(persona.isConnected&&!loadedMP3)listVoices();},{once:true});
 v7Audio.onended=()=>say('Enregistrement terminé. Clique sur Recommencer pour réécouter.');
 const fallback=()=>{
  // The uploaded q0 recording should NOT silently switch to the browser voice.
  if(index===0){say('⚠ Impossible de lire q0.mp3. Vérifie le lien du fichier audio et recharge la page.');return;}
  loadedMP3=false;persona.disabled=false;listVoices();
  const ok=v7Speak(q.t,{rate:speed.value,persona:persona.value});
  say(ok?'Aucun MP3 pour cette question : lecture avec la voix du navigateur.':'Aucun audio disponible.');
 };
 const begin=async(restartFromStart=false)=>{
  if(!restartFromStart&&isPaused&&v7PlayingMode==='file'){
   try{await v7Audio.play();isPaused=false;say('Lecture du MP3 reprise.');return;}catch(_){}
  }
  if(!restartFromStart&&isPaused&&v7PlayingMode==='speech'&&'speechSynthesis' in window){
   speechSynthesis.resume();isPaused=false;say('Lecture reprise.');return;
  }
  v7Stop();isPaused=false;
  v7Audio.src=prerecorded;
  v7Audio.playbackRate=Number(speed.value)||1;
  try{
    await v7Audio.play();
    loadedMP3=true;persona.disabled=true;v7PlayingMode='file';
    say('🎙 Enregistrement MP3 ElevenLabs en cours (pas la voix Firefox).');
  }catch(err){fallback();}
 };
 play.onclick=()=>begin(false);
 pause.onclick=()=>{
  if(v7PlayingMode==='file'){v7Audio.pause();isPaused=true;say('MP3 en pause.');}
  else if(v7PlayingMode==='speech'&&'speechSynthesis' in window){speechSynthesis.pause();isPaused=true;say('Lecture en pause.');}
 };
 restart.onclick=()=>begin(true);
 speed.onchange=()=>{if(v7PlayingMode==='file')v7Audio.playbackRate=Number(speed.value);};
 persona.onchange=()=>{if(v7PlayingMode==='speech')v7Stop();say('Voix du navigateur sélectionnée.');};
 say(index===0?'🎙 MP3 ElevenLabs q0.mp3 : clique sur Écouter.':'Recherche du MP3 à la lecture ; voix Firefox uniquement en secours.');
}
