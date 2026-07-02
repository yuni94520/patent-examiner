const VOCAB = require('../vocab.js');
const ZH_EN = VOCAB.ZH_EN;
const SYN = VOCAB.SYN;
const PATS = VOCAB.PATS;

const ATTRS=[
  {name:"元件",    key:"components",        weight:0.28,color:"#818cf8"},
  {name:"步驟",    key:"steps",             weight:0.18,color:"#818cf8"},
  {name:"流程",    key:"process_flow",      weight:0.18,color:"#818cf8"},
  {name:"數學式",  key:"math_formula",      weight:0.10,color:"#818cf8"},
  {name:"程式碼",  key:"pseudocode",        weight:0.06,color:"#67e8f9"},
  {name:"相對位置",key:"relative_position", weight:0.08,color:"#34d399"},
  {name:"順序",    key:"sequence",          weight:0.07,color:"#34d399"},
  {name:"關聯性",  key:"relevance",         weight:0.05,color:"#34d399"},
];

let GOLDEN=[
  {s:[0.36,0.31,0.26,0.15,0.10,0.40,0.25,0.35],l:1},
  {s:[0.85,0.80,0.75,0.70,0.65,0.72,0.60,0.55],l:1},
  {s:[0.78,0.72,0.68,0.55,0.50,0.65,0.45,0.40],l:1},
  {s:[0.70,0.65,0.70,0.60,0.55,0.58,0.50,0.45],l:1},
  {s:[0.65,0.60,0.55,0.50,0.45,0.50,0.40,0.35],l:1},
  {s:[0.40,0.35,0.30,0.20,0.15,0.38,0.30,0.25],l:1},
  {s:[0.15,0.10,0.12,0.05,0.08,0.10,0.05,0.03],l:0},
  {s:[0.10,0.08,0.05,0.03,0.02,0.06,0.02,0.01],l:0},
  {s:[0.20,0.15,0.10,0.08,0.05,0.12,0.05,0.03],l:0},
  {s:[0.30,0.20,0.15,0.10,0.08,0.18,0.08,0.05],l:0},
];

function normTxt(text){
  let t=text;
  if(/[\u4e00-\u9fff]/.test(t))for(const[p,r]of ZH_EN)t=t.replace(p,' '+r+' ');
  for(const[p,r]of SYN)t=t.replace(p,' '+r+' ');
  return t.replace(/\s+/g,' ').trim();
}
function extractAttrs(text){
  const n=normTxt(text);
  const sents=n.replace(/\n+/g,' ').split(/(?<=[.;])\s+/).map(s=>s.trim()).filter(s=>s.length>12);
  const res={};
  for(const[key,pats]of Object.entries(PATS)){
    const scored=sents.map(s=>{let h=0;for(const p of pats){const m=s.match(new RegExp(p.source,p.flags));h+=m?m.length:0;}return{s,h};});
    const top=scored.filter(x=>x.h>0).sort((a,b)=>b.h-a.h).slice(0,2).map(x=>x.s);
    res[key]=top.length?top.join(' '):'無明確對應';
  }
  return res;
}
function tfidf(a,b){
  if(!a||!b||a.includes('無明確對應')||b.includes('無明確對應'))return 0;
  const ng=(s,n)=>{const r={};for(let i=0;i<=s.length-n;i++){const g=s.slice(i,i+n);r[g]=(r[g]||0)+1;}return r;};
  const ga=ng(a.toLowerCase(),3),gb=ng(b.toLowerCase(),3);
  const ks=new Set([...Object.keys(ga),...Object.keys(gb)]);
  let dot=0,na=0,nb=0;
  for(const k of ks){const va=ga[k]||0,vb=gb[k]||0;dot+=va*vb;na+=va*va;nb+=vb*vb;}
  return na&&nb?Math.max(0,Math.min(1,dot/(Math.sqrt(na)*Math.sqrt(nb)))):0;
}
function compute8D(specText,claimText){
  const sA=extractAttrs(specText),cA=extractAttrs(claimText);
  const sims=ATTRS.map(a=>tfidf(sA[a.key]||'',cA[a.key]||''));
  const ws=ATTRS.map(a=>a.weight);
  const wS=sims.map((s,i)=>s*Math.sqrt(ws[i]));
  const raw=Math.sqrt(ws.reduce((a,w)=>a+w,0))>0?Math.sqrt(wS.reduce((a,v)=>a+v*v,0))/Math.sqrt(ws.reduce((a,w)=>a+w,0))*100:0;
  const inf=Math.pow(raw/100,0.45)*100;
  let sS=0,sN=0,nS=0,nN=0;
  for(const d of GOLDEN){
    const dot=d.s.reduce((a,v,i)=>a+v*sims[i],0);
    const nx=Math.sqrt(d.s.reduce((a,v)=>a+v*v,0)),ns=Math.sqrt(sims.reduce((a,v)=>a+v*v,0));
    const sim=nx&&ns?dot/(nx*ns):0;
    if(d.l===1){sS+=sim;sN++;}else{nS+=sim;nN++;}
  }
  const posAvg=sN?sS/sN:0,negAvg=nN?nS/nN:0;
  const xgb=(sN&&nN)?((posAvg+negAvg)>0?(posAvg/(posAvg+negAvg))*40:20):20;
  const core=(sims[0]+sims[1]+sims[2]+sims[3])/4;
  let pen=0,penR=[];
  if(core<0.20){const p=(0.20-core)*250;pen+=p;penR.push(`核心均值${(core*100).toFixed(1)}%極低`);}
  else if(core<0.35){const p=(0.35-core)*120;pen+=p;penR.push(`核心均值${(core*100).toFixed(1)}%偏低`);}
  if(sims[0]<0.15)pen+=(0.15-sims[0])*200;else if(sims[0]<0.25)pen+=(0.25-sims[0])*80;
  const lowC=sims.slice(0,4).filter(s=>s<0.25).length;
  if(lowC>=3){pen+=lowC*8;penR.push(`${lowC}/4核心<25%`);}
  const score=Math.max(0,Math.min(100,inf+xgb-pen));
  const tier=score>=70?'H':score>=45?'M':'L';
  return{
    score:Math.round(score*10)/10,raw:Math.round(raw*10)/10,inf:Math.round(inf*10)/10,
    pen:Math.round(pen*10)/10,penR:penR.join(' | '),tier,sims,core:Math.round(core*1000)/1000,
    tierLabel:{H:'高度相似 (HIGH)',M:'中度相似 (MID)',L:'低度相似 (LOW)'}[tier],
    tierDesc:{H:'技術特徵高度重疊，可能為標準必要專利',M:'部分技術特徵吻合，需進一步人工確認',L:'技術關聯性較低'}[tier],
  };
}

module.exports={normTxt,extractAttrs,tfidf,compute8D,ATTRS,GOLDEN};
