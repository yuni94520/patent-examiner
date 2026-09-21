/* Shared, dependency-free scoring/data invariants. Used by the browser and tests. */
(function(root){
'use strict';
const VERSION='v3.11.0-semantic-primary';
const MAX_CASES=2000, MAX_TEXT=500000;
function finite(x,lo=0,hi=100){return typeof x==='number'&&Number.isFinite(x)&&x>=lo&&x<=hi;}
function validateVectors(vectors,count){
  if(!Array.isArray(vectors)||vectors.length!==count||!count)throw Error('embedding count mismatch');
  const dim=vectors[0]?.length;
  if(!dim||dim>65536)throw Error('invalid embedding dimension');
  for(const v of vectors){
    if(!Array.isArray(v)||v.length!==dim||!v.every(x=>typeof x==='number'&&Number.isFinite(x)))throw Error('invalid embedding vector');
    const norm=Math.hypot(...v);if(!Number.isFinite(norm)||norm===0)throw Error('zero/non-finite vector norm');
  }
  return vectors;
}
function cosine(a,b){
  validateVectors([a,b],2);const na=Math.hypot(...a),nb=Math.hypot(...b);
  return Math.max(-1,Math.min(1,a.reduce((s,x,i)=>s+(x/na)*(b[i]/nb),0)));
}
function isotonic(points){
  const groups=[];
  for(const p of [...points].sort((a,b)=>a.x-b.x)){
    if(!finite(p.x)||!finite(p.y,0,1))throw Error('invalid calibration point');
    const prev=groups.at(-1);
    if(prev&&prev.x===p.x){prev.sum+=p.y;prev.w++;}else groups.push({x:p.x,sum:p.y,w:1});
  }
  const blocks=[];
  for(const g of groups){
    blocks.push({x0:g.x,x1:g.x,sum:g.sum,w:g.w,y:g.sum/g.w});
    while(blocks.length>1&&blocks.at(-2).y>blocks.at(-1).y){
      const b=blocks.pop(),a=blocks.pop(),w=a.w+b.w,sum=a.sum+b.sum;
      blocks.push({x0:a.x0,x1:b.x1,sum,w,y:sum/w});
    }
  }
  return blocks.map(b=>({...b,x:(b.x0+b.x1)/2}));
}
function predict(raw,model){
  if(!finite(raw))throw Error('invalid raw score');
  const bs=model?.blocks;if(!bs?.length)return raw;
  if(raw<=bs[0].x)return bs[0].y*100;
  for(let i=1;i<bs.length;i++)if(raw<=bs[i].x){const a=bs[i-1],b=bs[i];return 100*(a.y+(b.y-a.y)*(raw-a.x)/(b.x-a.x));}
  return bs.at(-1).y*100;
}
function normalizeInput(x){return String(x).normalize('NFC').replace(/\r\n?/g,'\n').trim();}
async function digest(value){
  const bytes=await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
async function pairKey(input,profile){return digest([input.id,input.claim_number,input.citation_id,normalizeInput(input.claim),normalizeInput(input.citation),profile]);}
function validateCases(data){
  const cases=Array.isArray(data)?data:data?.cases;
  if(!Array.isArray(cases)||cases.length>MAX_CASES)throw Error('cases 必須是陣列，最多 2000 筆');
  return {cases:cases.map(c=>{
    if(!c||typeof c!=='object'||Array.isArray(c))throw Error('invalid case');
    const out={};
    const strings=['id','claim','citation','claim_number','citation_id','pair_key','profile_key','scoring_version','reviewer_label','detected_at','verified_at','run_id'];
    for(const k of strings)if(c[k]!=null){if(typeof c[k]!=='string'||c[k].length>(['claim','citation'].includes(k)?MAX_TEXT:2000))throw Error('invalid '+k);out[k]=c[k];}
    if(!out.id)throw Error('missing id');
    for(const k of ['detected_at','verified_at'])if(out[k]&&!Number.isFinite(Date.parse(out[k])))throw Error('invalid '+k);
    if(c.label!=null&&c.label!==0&&c.label!==1)throw Error('invalid label');out.label=c.label??null;
    for(const k of ['raw_score','calibrated_score','elem_min','element_avg','structure_score','coverage','semantic'])if(c[k]!=null){if(!finite(c[k]))throw Error('invalid '+k);out[k]=c[k];}
    if(c.sims!=null){if(!Array.isArray(c.sims)||c.sims.length!==8||!c.sims.every(x=>finite(x,0,1)))throw Error('invalid sims');out.sims=[...c.sims];}
    if(c.feature_vector!=null){out.feature_vector={};for(const k of ['element_avg','element_min','structure','coverage','semantic']){if(!finite(c.feature_vector[k]))throw Error('invalid feature vector');out.feature_vector[k]=c.feature_vector[k];}}
    return out;
  })};
}
const SEARCH_LABELS=['A標準式','A放寬式','B標準式','B放寬式'];
function splitTopLevel(text,separator){
  const out=[];let depth=0,quote='',start=0;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quote){if(c===quote&&text[i-1]!=='\\')quote='';continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='(')depth++;else if(c===')'){depth--;if(depth<0)throw Error('括號不完整');}
    if(depth===0&&text.startsWith(separator,i)){out.push(text.slice(start,i).trim());start=i+separator.length;i+=separator.length-1;}
  }
  if(depth!==0||quote)throw Error('括號或引號不完整');out.push(text.slice(start).trim());return out;
}
function validateSearchFormula(output){
  if(typeof output!=='string'||output.length>20000)throw Error('AI 輸出不是有效文字');
  const clean=output.trim().replace(/^```[^\n]*\n?|```$/g,'').trim();
  const lines=clean.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(lines.length!==4)throw Error('必須恰好輸出四條檢索式');
  const formulas={};
  lines.forEach((line,index)=>{
    const mark=line.indexOf('：');if(mark<0)throw Error('缺少全形冒號');
    const label=line.slice(0,mark),query=line.slice(mark+1).trim();
    if(label!==SEARCH_LABELS[index])throw Error('標籤或順序錯誤：'+label);
    const groups=splitTopLevel(query,' AND ');
    if(!/^IC=\([^()]+\)$/.test(groups[0]||''))throw Error(label+' 的 IPC 必須置於最前端');
    const ipcs=groups[0].slice(4,-1).split(/\s+OR\s+/).map(x=>x.trim()).filter(Boolean);
    if(ipcs.length<1||ipcs.length>4||ipcs.some(x=>!/^([A-HY]\d{2}[A-Z])(?:\s*\d{1,4}\/\d{1,6})?$/i.test(x)))throw Error(label+' 的 IPC 必須為 1–4 個有效分類號');
    let keywords=groups.slice(1),date='';
    if(keywords.length&&/^\(UD=:[^()]+\s+OR\s+GD=:[^()]+\)$/.test(keywords.at(-1))){date=keywords.pop();}
    const standard=label.includes('標準');
    if(keywords.length<(standard?3:2)||keywords.length>(standard?4:3))throw Error(label+' 的關鍵字組數不符');
    for(const group of keywords){
      if(!/^\([^()]+\)$/.test(group))throw Error(label+' 有未完整包覆的關鍵字組');
      const terms=group.slice(1,-1).split(/\s+OR\s+/).map(x=>x.trim()).filter(Boolean);
      if(!terms.length||terms.length>5)throw Error(label+' 每組同義詞必須為 1–5 個');
      if(terms.some(t=>/\s+AND\s+/.test(t)))throw Error(label+' 的關鍵字組內不可使用 AND');
    }
    formulas[label]={query,ipc:groups[0],keywords,date};
  });
  return {text:SEARCH_LABELS.map(x=>x+'：'+formulas[x].query).join('\n'),formulas};
}
function eligible(c,profile){return c.scoring_version===VERSION&&c.profile_key===profile&&/^[a-f0-9]{64}$/.test(c.pair_key||'')&&!!c.verified_at&&(c.label===0||c.label===1)&&c.reviewer_label===(c.label===1?'highly_relevant':'low_relevance')&&finite(c.raw_score);}
const api={VERSION,MAX_CASES,MAX_TEXT,finite,validateVectors,cosine,isotonic,predict,normalizeInput,digest,pairKey,validateCases,eligible,splitTopLevel,validateSearchFormula};
root.PatentPipeline=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
