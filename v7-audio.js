'use strict';
/* Ev@lang Quest V7 — English audio player.
   Pre-recorded audio is used when assets/audio/<id>.mp3 is present.
   Otherwise uses local platform speech synthesis: NOT neural AI audio.
   To add premium AI recordings, upload verified MP3 files and a manifest.
*/
const v7Personas={
 oliver:{lang:'en-GB',gender:'male'},
 emily:{lang:'en-GB',gender:'female'},
 james:{lang:'en-GB',gender:'male'},
 sarah:{lang:'en-GB',gender:'female'},
 us:{lang:'en-US',gender:'any'}
};
const v7Audio=new Audio();
let v7Utterance=null,v7Generation=0,v7PlayingMode='none';
v7Audio.preload='none';
function v7Stop(){
 v7Generation++;
 try{v7Audio.pause();v7Audio.currentTime=0;}catch(e){}
 if('speechSynthesis' in window)window.speechSynthesis.cancel();
 v7PlayingMode='none';v7Utterance=null;
}
function v7AvailableVoices(){
 if(!('speechSynthesis' in window))return [];
 return window.speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang));
}
function v7PickVoice(persona){
 const p=v7Personas[persona]||v7Personas.oliver;
 const vs=v7AvailableVoices();
 const matches=vs.filter(v=>v.lang.toLowerCase().startsWith(p.lang.toLowerCase()));
 const pool=matches.length?matches:vs;
 const preferred=p.gender==='female'
   ? pool.find(v=>/female|samantha|serena|susan|victoria|zira|aria|hazel|kate|libby|emma|moira/i.test(v.name))
   : pool.find(v=>/male|daniel|george|oliver|ryan|david|mark|james|arthur/i.test(v.name));
 return preferred||pool[0]||null;
}
function v7Speak(text,{rate=1,persona='oliver'}={}){
 v7Stop();
 if(!('speechSynthesis' in window)){return false;}
 const synth=window.speechSynthesis;
 const u=new SpeechSynthesisUtterance(text);
 u.lang=(v7Personas[persona]||v7Personas.oliver).lang;
 u.rate=Math.max(0.7,Math.min(1.2,rate));
 u.pitch=persona==='emily'||persona==='sarah'?1.05:0.95;
 const voice=v7PickVoice(persona);
 if(voice)u.voice=voice;
 v7PlayingMode='speech';v7Utterance=u;synth.speak(u);
 return true;
}
function setupV7Audio(q){
 v7Stop();
 const play=document.getElementById('playAudio');
 const pause=document.getElementById('pauseAudio');
 const restart=document.getElementById('restartAudio');
 const speed=document.getElementById('audioSpeed');
 const persona=document.getElementById('audioPersona');
 const status=document.getElementById('audioStatus');
 const statusText=t=>{if(status&&status.isConnected)status.textContent=t;};
 const audioId='q'+(typeof bank!=='undefined'?bank.indexOf(q):-1);
 const prerecorded='assets/audio/'+audioId+'.mp3';
 let isPaused=false,canUseMP3=false;
 const tryFile=async()=>{
  try{
   const response=await fetch(prerecorded,{method:'HEAD'});
   canUseMP3=response.ok&&/audio|octet-stream/i.test(response.headers.get('content-type')||'audio');
  }catch(e){canUseMP3=false;}
  statusText(canUseMP3?'Enregistrement disponible. Tu peux écouter, mettre en pause et reprendre.':'Voix de ton appareil : qualité variable selon le navigateur. Les enregistrements IA pourront être ajoutés ultérieurement.');
 };
 void tryFile();
 const begin=async(restartFromStart=false)=>{
   if(canUseMP3){
     if(restartFromStart){v7Stop();v7Audio.src=prerecorded;}
     if(v7Audio.src!==new URL(prerecorded,location.href).href){v7Stop();v7Audio.src=prerecorded;}
     v7Audio.playbackRate=Number(speed.value)||1;
     try{await v7Audio.play();v7PlayingMode='file';isPaused=false;statusText('Lecture de l’enregistrement en cours…');return;}
     catch(e){canUseMP3=false;}
   }
   if(!restartFromStart&&isPaused&&v7PlayingMode==='speech'&&'speechSynthesis' in window){
      speechSynthesis.resume();isPaused=false;statusText('Lecture reprise.');return;
   }
   isPaused=false;
   const ok=v7Speak(q.t,{rate:Number(speed.value),persona:persona.value});
   statusText(ok?'Lecture de la voix disponible sur ton appareil…':'La synthèse vocale est indisponible sur cet appareil.');
 };
 play.onclick=()=>begin(false);
 pause.onclick=()=>{
   if(v7PlayingMode==='file'){v7Audio.pause();isPaused=true;statusText('Lecture en pause.');}
   else if(v7PlayingMode==='speech'&&'speechSynthesis' in window){speechSynthesis.pause();isPaused=true;statusText('Lecture en pause.');}
 };
 restart.onclick=()=>begin(true);
 speed.onchange=()=>{if(v7PlayingMode==='file')v7Audio.playbackRate=Number(speed.value);};
 persona.onchange=()=>{if(v7PlayingMode==='speech'){v7Stop();statusText('Voix modifiée. Appuie sur Écouter pour recommencer.');}};
}
