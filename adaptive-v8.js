'use strict';
/* V8: adaptive practice and cautious CEFR reporting, not official psychometric scoring. */
if(Array.isArray(window.EVALANG_EXTRA_ITEMS)){
 const all=window.EVALANG_EXTRA_ITEMS.filter(q=>q&&TYPES[q.d]&&q.o?.length===4&&q.a>=0&&q.a<4&&q.l>=0&&q.l<=5);
 bank.push(...all);
}
const v8OriginalAnswer=answer;
const v8LastKey='evalang_quest_question_history_v8';
let v8Recent=[];
try{const stored=JSON.parse(localStorage.getItem(v8LastKey)||'[]');if(Array.isArray(stored))v8Recent=stored.filter(x=>Number.isInteger(x)).slice(-180);}catch(_){}
function v8Count(d){return state.history.filter(h=>h.d===d).length;}
function v8Tier(d){
 const items=state.history.filter(h=>h.d===d).slice(-32);
 if(items.length<8)return null;
 const successful=items.filter(h=>h.ok);
 if(successful.length<4)return 0;
 const sorted=successful.map(h=>h.l).sort((a,b)=>a-b);
 // Conservative: prefer the lower-middle supported successful challenge tier.
 const achieved=sorted[Math.max(0,Math.floor(sorted.length*.4)-1)];
 const hard=items.filter(h=>h.l>=achieved),accuracy=hard.filter(h=>h.ok).length/Math.max(1,hard.length);
 return Math.max(0,Math.min(5,achieved-(accuracy<.45?1:0)));
}
function v8DomainReport(d){
 const count=v8Count(d),tier=v8Tier(d);
 if(tier===null)return {tier:null,text:'En cours de diagnostic',count,certainty:'Données insuffisantes'};
 const recent=state.history.filter(h=>h.d===d).slice(-24);
 const bands=new Set(recent.map(x=>x.l)).size;
 return {tier,text:LEVELS[tier],count,certainty:count>=18&&bands>=3?'Estimation à consolider':'Premiers repères'};
}
function v8Overall(){
 const ds=['listening','reading','grammar','vocabulary'].map(v8DomainReport);
 if(ds.some(d=>d.tier===null))return null;
 const sorted=ds.map(d=>d.tier).sort((a,b)=>a-b);
 return Math.round((sorted[1]+sorted[2])/2);
}
start=function(mode){
 if(typeof v7Stop==='function')v7Stop();
 session={mode,step:0,max:mode==='mixed'?24:12,seen:[],done:false,targets:{},streaks:{}};
 for(const d of Object.keys(TYPES)){
  const established=v8Tier(d);
  session.targets[d]=established===null?2:Math.max(0,Math.min(5,established));
  session.streaks[d]=0;
 }
 nextQuestion();
};
pick=function(){
 const domains=Object.keys(TYPES);
 const d=session.mode==='mixed'?domains[session.step%domains.length]:session.mode;
 const target=session.targets[d];
 const available=bank.map((q,i)=>({q,i})).filter(x=>x.q.d===d&&!session.seen.includes(x.i));
 let pool=available.filter(x=>!v8Recent.includes(x.i));
 if(!pool.length)pool=available;
 if(!pool.length)pool=bank.map((q,i)=>({q,i})).filter(x=>x.q.d===d);
 if(!pool.length)throw new Error('No question available for '+d);
 let best=Infinity;
 for(const x of pool){const diff=Math.abs(x.q.l-target);if(diff<best)best=diff;}
 const close=pool.filter(x=>Math.abs(x.q.l-target)===best);
 // Shuffle correct answer position to avoid option-order memorization.
 const chosen=close[Math.floor(Math.random()*close.length)],q=chosen.q;
 const newQ=q;
 const answerText=newQ.o[newQ.a];
 for(let i=newQ.o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[newQ.o[i],newQ.o[j]]=[newQ.o[j],newQ.o[i]];}
 newQ.a=newQ.o.indexOf(answerText);
 session.seen.push(chosen.i);
 v8Recent.push(chosen.i);v8Recent=v8Recent.slice(-170);
 try{localStorage.setItem(v8LastKey,JSON.stringify(v8Recent));}catch(_){}
 // Source index is retained to support per-question MP3 files and remediations.
 return newQ;
};
// Audio should use the original index because V8 shuffles answer options.
const v8OldNextQuestion=nextQuestion;
answer=function(chosen){
 const q=session?.q;
 if(!q)return;
 const d=q.d,ok=chosen===q.a,target=session.targets[d],streak=session.streaks[d]||0;
 // Original response handler awards XP, stores history and opens learning journal.
 v8OriginalAnswer(chosen);
 if(!session)return;
 session.streaks[d]=ok?streak+1:0;
 if(ok&&session.streaks[d]>=2){
  session.targets[d]=Math.min(5,target+1);session.streaks[d]=0;
 }else if(!ok){
  session.targets[d]=Math.max(0,target-1);
 }
 const el=document.getElementById('feedback');
 if(el){
  const note=document.createElement('p');note.className='small';
  note.textContent=ok?'📈 Prochaine difficulté dans cette compétence : '+LEVELS[session.targets[d]]+'.':'🧩 Prochaine question dans cette compétence : '+LEVELS[session.targets[d]]+' pour consolider.';
  el.appendChild(note);
 }
};
function v8Panel(){
 const ds=Object.keys(TYPES),overall=v8Overall();
 return '<div class="panel" style="margin-top:20px"><h2>Mon positionnement CECRL (indicatif)</h2><p>Ce bilan porte sur la compréhension orale, la compréhension écrite, la grammaire et le lexique. Il ne mesure pas la production orale ni écrite.</p>'+
 '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">'+
 ds.map(d=>{const s=v8DomainReport(d);return '<div class="card" style="min-height:154px"><strong>'+TYPES[d].title+'</strong><h2 style="margin:12px 0">'+s.text+'</h2><span class="small">'+s.count+' réponses · '+s.certainty+'</span></div>';}).join('')+'</div>'+
 '<h3 style="margin-top:20px">Attendus de fin de 3e</h3><p><strong>Anglais LVA : B1</strong> · <strong>Anglais LVB : A2</strong>, objectifs de référence du programme. Le test Ev@lang se concentre sur la réception et les connaissances linguistiques.</p>'+
 '<p><strong>Synthèse :</strong> '+(overall===null?'Diagnostic encore incomplet : travaille chacun des quatre domaines au moins huit fois.':'Repère transversal actuel : '+LEVELS[overall]+'. Ce repère ne vaut pas une certification.')+'</p>'+
 '<p class="small">Les niveaux sont déduits des réussites et difficultés sur des questions originales non étalonnées. L'adaptation est un mécanisme d'entraînement ; seule une évaluation calibrée et validée permettrait une estimation de niveau fiable.</p></div>';
}
const v8OriginalPassport=passport;
passport=function(){v8OriginalPassport();document.getElementById('app').insertAdjacentHTML('beforeend',v8Panel());};
endSession=function(){
 const mode=session?.mode||'mixed';
 if(typeof v7Stop==='function')v7Stop();
 session=null;
 mount('<div class="panel" style="text-align:center"><h1>🎯 Mission terminée !</h1><p>Tu as terminé '+(mode==='mixed'?'un parcours adaptatif mixte':'une mission ciblée')+'. Tes prochaines questions évolueront en fonction de tes réponses.</p><button class="btn primary" id="v8Again">Nouvelle mission</button> <button class="btn" id="v8Passport">Mon passeport CECRL</button></div>'+v8Panel());
 document.getElementById('v8Again').onclick=()=>start(mode);
 document.getElementById('v8Passport').onclick=()=>nav('passport');
};
