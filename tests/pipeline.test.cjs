const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
function app(){
  const nodes=new Map(),storage=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',style:{},disabled:false,classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},replaceChildren(){},setAttribute(){},addEventListener(){},scrollIntoView(){}});return nodes.get(id)};
  const document={getElementById:node,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({...node('new'+nodes.size),remove(){}}),head:{appendChild(){}},body:{appendChild(){}},addEventListener(){}};
  const ctx=vm.createContext({console,document,window:{},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},crypto:webcrypto,TextEncoder,URL,AbortController,setTimeout,clearTimeout,fetch:async()=>{throw Error('offline')},location:{href:'http://localhost:8080/'},confirm:()=>true});
  vm.runInContext(fs.readFileSync('pipeline.js','utf8'),ctx);
  vm.runInContext(fs.readFileSync('vocab.js','utf8'),ctx);
  const src=[...fs.readFileSync('index.html','utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n').replace(/^init\(\);/m,'');
  vm.runInContext(src,ctx);ctx.toast=()=>{};ctx.sleep=async()=>{};
  node('qeMode').value='off';node('qeLimit').value='4';node('rrfK').value='60';node('extractionMode').value='rules';
  return {ctx,node,storage,run:s=>vm.runInContext(s,ctx)};
}
const claim='A network controller receives reference signals; selecting a preferred beam based on measured signal quality.';
const unrelated='Bread is made by mixing flour with water and baking the resulting dough in an oven.';
test('cosine is zero for orthogonal vectors, rejects malformed vectors',()=>{
 const a=app();assert.equal(a.ctx.cosineVector([1,0],[0,1]),0);
 for(const v of [[[0,0],[1,0]],[[1,NaN],[1,0]],[[1,0],[1]],[[1,'2'],[1,0]]])assert.throws(()=>a.ctx.cosineVector(...v));
});
test('PAVA groups equal raw scores independently of input order; output monotone',()=>{
 const {ctx}=app(),p=[{x:20,y:1},{x:20,y:0},{x:80,y:1}];
 assert.equal(JSON.stringify(ctx.pava(p)),JSON.stringify(ctx.pava([...p].reverse())));
 const m={blocks:ctx.pava(p)};let prev=-1;for(let x=0;x<=100;x++){const y=ctx.calibrate(x,m);assert.ok(y>=prev&&y<=100);prev=y;}
});
test('live pipeline deterministic; identical evidence outranks unrelated evidence',async()=>{
 const {ctx}=app(),a=await ctx.evaluatePair(claim,claim),b=await ctx.evaluatePair(claim,unrelated),c=await ctx.evaluatePair(claim,claim);
 assert.ok(a.final_score>b.final_score);assert.equal(a.final_score,c.final_score);assert.equal(a.semantic_source,'fallback');assert.equal(a.calibration,null);
});
test('no 24-element truncation and short limitations are kept',async()=>{
 const {ctx}=app();const xs=await ctx.extractClaimElements(Array.from({length:30},(_,i)=>'e'+i).join(';'));
 assert.equal(xs.length,30);assert.equal(xs[29],'e29');
});
test('embedding failures restart the entire pair in fallback mode',async()=>{
 const {ctx,node}=app();node('semanticEndpoint').value='http://model/embed';let calls=0;
 ctx.fetch=async()=>{calls++;return {ok:true,json:async()=>({model:'m',revision:'r',embeddings:[[0,0]]})}};
 const r=await ctx.evaluatePair(claim,claim);assert.ok(calls>0);assert.equal(r.semantic_source,'fallback');assert.ok(r.elements.every(e=>e.semantic_source==='fallback'));assert.ok(r.warnings.length);
 assert.equal(r.final_score,(await app().ctx.evaluatePair(claim,claim)).final_score);
});
test('all passages reach dense retrieval including passages outside lexical top 48',async()=>{
 const {ctx,node}=app();node('semanticEndpoint').value='http://model/embed';const seen=[];
 ctx.fetch=async(url,opts)=>{const ts=JSON.parse(opts.body).texts;seen.push(...ts);return {ok:true,json:async()=>({model:'m',revision:'r',embeddings:ts.map(t=>t.includes('TAIL_TARGET')||t.startsWith('A network controller')||t.startsWith('selecting a preferred')?[1,0]:[0,1])})}};
 const citation=Array.from({length:60},(_,i)=>`[${i}] network controller receives reference signals with ordinary configuration ${i}.`).join('\n\n')+'\n\nTAIL_TARGET radically reworded beam selection disclosure.';
 const r=await ctx.evaluatePair(claim,citation);assert.equal(r.semantic_source,'embedding');assert.ok(seen.some(t=>t.includes('TAIL_TARGET')));assert.ok(r.elements.some(e=>e.evidence.includes('TAIL_TARGET')));
});
test('a zero semantic score is not replaced by a lexical fallback',async()=>{
 const {ctx,node}=app();node('semanticEndpoint').value='http://model/embed';
 ctx.fetch=async(u,o)=>({ok:true,json:async()=>({model:'m',revision:'r',embeddings:JSON.parse(o.body).texts.map(t=>t==='unique claim'?[1,0]:[0,1])})});
 const r=await ctx.evaluatePair('unique claim','unique claim embedded in a different passage.');assert.equal(r.elements[0].semantic,0);
});
test('cache cannot survive endpoint changes or repeat runs at same URL',async()=>{
 const {ctx,node}=app();let calls=[];
 ctx.fetch=async(u,o)=>{calls.push(u);return {ok:true,json:async()=>({model:u,revision:'r',embeddings:JSON.parse(o.body).texts.map(()=>[1,0])})}};
 node('semanticEndpoint').value='http://a/embed';await ctx.evaluatePair(claim,claim);const n=calls.length;await ctx.evaluatePair(claim,claim);assert.ok(calls.length>n);
 node('semanticEndpoint').value='http://b/embed';const r=await ctx.evaluatePair(claim,claim);assert.equal(r.profile.embedding.endpoint,'http://b/embed');assert.ok(calls.includes('http://b/embed'));
});
test('model revision changes during a pair cause whole-pair fallback',async()=>{
 const {ctx,node}=app();node('semanticEndpoint').value='http://a/embed';let n=0;
 ctx.fetch=async(u,o)=>({ok:true,json:async()=>({model:'m',revision:String(n++),embeddings:JSON.parse(o.body).texts.map(()=>[1,0])})});
 const r=await ctx.evaluatePair(claim,unrelated);assert.equal(r.semantic_source,'fallback');assert.match(r.warnings.join(' '),/model\/dimension/);
});
test('immutable input snapshot prevents old score/new text verification and label transplant',async()=>{
 const a=app();a.node('claimTxt').value=claim;a.node('citTxt').value=claim;a.node('patId').value='TW1';
 await a.ctx.runCompare();a.ctx.doVerify(1);assert.equal(a.ctx.dbLoad().cases[0].label,1);
 a.node('citTxt').value=unrelated;a.ctx.doVerify(0);assert.equal(a.ctx.dbLoad().cases[0].label,1);
 await a.ctx.runCompare();assert.equal(a.ctx.dbLoad().cases.length,2);assert.equal(a.ctx.dbLoad().cases[1].label,null);
 a.node('citTxt').value=claim;await a.ctx.runCompare();assert.equal(a.ctx.dbLoad().cases[0].label,null);
 const audit=a.ctx.auditLoad();assert.equal(audit.length,3);assert.ok(audit[0].elements[0].top3.length);assert.ok(audit[0].profile);assert.ok(audit[0].input.claim);
});
test('edits while requests are pending do not change saved inputs',async()=>{
 const a=app();a.node('semanticEndpoint').value='http://model/embed';a.node('claimTxt').value=claim;a.node('citTxt').value=unrelated;
 a.ctx.fetch=async(u,o)=>{a.node('claimTxt').value='EDITED';return {ok:true,json:async()=>({model:'m',revision:'r',embeddings:JSON.parse(o.body).texts.map(()=>[1,0])})}};
 await a.ctx.runCompare();assert.equal(a.ctx.dbLoad().cases[0].claim,claim);a.ctx.doVerify(1);assert.equal(a.ctx.dbLoad().cases[0].label,null);
});
test('calibration excludes legacy, wrong profile, pending and current pair',()=>{
 const a=app(),P=a.ctx.PatentPipeline;
 const rows=Array.from({length:20},(_,i)=>({id:'P'+i,claim:'claim'+i,citation:'citation',pair_key:i.toString(16).padStart(64,'0'),profile_key:'p',scoring_version:P.VERSION,raw_score:i*5,label:i<10?0:1,reviewer_label:i<10?'low_relevance':'highly_relevant',verified_at:'2026-09-18T00:00:00Z'}));
 a.ctx.dbSave({cases:rows});assert.equal(a.ctx.calibrationModel('p').n,20);assert.equal(a.ctx.calibrationModel('wrong'),null);assert.equal(a.ctx.calibrationModel('p',{claim:'claim0',citation:'citation'}),null);
 rows[0].scoring_version='old';a.ctx.dbSave({cases:rows});assert.equal(a.ctx.calibrationModel('p'),null);
});
test('invalid DB import data is rejected atomically; valid export fields round-trip',()=>{
 const a=app();a.ctx.dbSave({cases:[{id:'good',label:null,raw_score:35}]});const before=a.storage.get('pat_sim_v35_db');
 for(const field of ['raw_score','calibrated_score','elem_min','verified_at']){assert.throws(()=>a.ctx.dbSave({cases:[{id:'bad',[field]:'<img src=x onerror=alert(1)>'}]}));assert.equal(a.storage.get('pat_sim_v35_db'),before);}
 assert.equal(a.ctx.dbLoad().cases[0].raw_score,35);
});
test('structured extraction rejects omitted text and preserves source limitations',async()=>{
 const a=app();a.node('semanticEndpoint').value='http://model/embed';a.node('extractionMode').value='llm';
 a.ctx.fetch=async()=>({ok:true,json:async()=>({elements:[{start:0,end:2}],model:'mock'})});
 const xs=await a.ctx.extractClaimElements('short;tail');assert.deepEqual(Array.from(xs),['short','tail']);
});
test('UI buttons and overlay released after storage failure',async()=>{
 const a=app();a.node('claimTxt').value=claim;a.node('citTxt').value=claim;a.ctx.localStorage.setItem=()=>{throw Error('quota')};
 await a.ctx.runCompare();assert.equal(a.node('runBtn').disabled,false);assert.equal(a.node('mBtn').disabled,false);
});
test('dynamic expansion contributes retrieval hints and records model metadata',async()=>{
 const a=app();a.node('qeMode').value='auto';a.node('semanticEndpoint').value='http://model/embed';
 a.ctx.fetch=async(u,o)=>u.endsWith('/expand')?{ok:true,json:async()=>({model:'m',revision:'r',vocabulary_revision:'v',neighbors:['alternate predictor']})}:{ok:true,json:async()=>({model:'m',revision:'r',embeddings:JSON.parse(o.body).texts.map(()=>[1,0])})};
 const r=await a.ctx.evaluatePair('estimating a prediction block','An alternate predictor provides a reference block.');
 assert.ok(r.elements[0].query_expansions.some(x=>x.includes('alternate predictor')));assert.equal(r.profile.expansion.vocabulary_revision,'v');
});
test('batch uses same scoring pipeline and records full claim results',async()=>{
 const a=app(),single=await a.ctx.evaluatePair(claim,claim),batch=await a.ctx.runScreeningEvaluation(claim,claim);
 assert.equal(batch.final_score,single.final_score);a.ctx.recordScreeningAudit('P',claim,claim,batch,'test');
 const log=a.ctx.auditLoad()[0];assert.ok(log.claim_results[0].calibration===null);assert.ok(log.claim_results[0].element_matches.length);assert.equal(log.raw_score,batch.raw_score);
});
test('search formula validator accepts four valid formulas and rejects structural errors',()=>{
 const {ctx}=app();
 const valid=['A標準式：IC=(H04L OR H04W) AND (資源分配 OR resource allocation) AND (觸發回報 OR triggered reporting) AND (參考信號 OR reference signal)','A放寬式：IC=(H04L OR H04W) AND (資源分配 OR resource allocation) AND (參考信號 OR reference signal)','B標準式：IC=(H04L OR H04W) AND (使用者設備 OR user equipment OR UE) AND (基地台 OR base station OR gNB) AND (控制訊息 OR control message)','B放寬式：IC=(H04L OR H04W) AND (使用者設備 OR user equipment OR UE) AND (控制訊息 OR control message)'].join('\n');
 const result=ctx.PatentPipeline.validateSearchFormula(valid);assert.equal(result.text,valid);assert.equal(result.formulas['A標準式'].keywords.length,3);
 assert.throws(()=>ctx.PatentPipeline.validateSearchFormula(valid.replace('IC=(H04L OR H04W) AND ','',1)),/IPC/);
 assert.throws(()=>ctx.PatentPipeline.validateSearchFormula(valid.replace('IC=(H04L OR H04W)','IC=(IPC1 OR nonsense)',1)),/IPC/);
 assert.throws(()=>ctx.PatentPipeline.validateSearchFormula(valid.replace('(資源分配 OR resource allocation)','(a OR b OR c OR d OR e OR f)',1)),/1–5/);
 assert.throws(()=>ctx.PatentPipeline.validateSearchFormula(valid+'\n說明：完成'),/四條/);
});
test('search generator calls configured AI adapter and renders validated output',async()=>{
 const a=app();a.node('kwTxt').value=claim;a.node('kwIpc').value='H04L';a.node('kwCount').value='8';a.node('searchAiEndpoint').value='http://adapter/search-formula';
 const valid=['A標準式：IC=(H04L) AND (訊號 OR signal) AND (波束 OR beam) AND (選擇 OR selection)','A放寬式：IC=(H04L) AND (波束 OR beam) AND (選擇 OR selection)','B標準式：IC=(H04L) AND (控制器 OR controller) AND (參考信號 OR reference signal) AND (量測 OR measurement)','B放寬式：IC=(H04L) AND (控制器 OR controller) AND (量測 OR measurement)'].join('\n');
 let request;
 a.ctx.fetch=async(u,o)=>{request={u,body:JSON.parse(o.body)};return {ok:true,json:async()=>({result:valid,model:'gpt-test',prompt_version:'search-formula-v1'})}};
 await a.ctx.runKeywordAI();assert.equal(request.u,'http://adapter/search-formula');assert.equal(request.body.claim,claim);assert.equal(a.node('kwBody').textContent,valid);assert.match(a.node('searchAiStatus').textContent,/gpt-test/);assert.equal(a.node('kwAiBtn').disabled,false);
});
test('invalid AI search output falls back to the existing copyable prompt',async()=>{
 const a=app();a.node('kwTxt').value=claim;a.node('searchAiEndpoint').value='http://adapter/search-formula';
 a.ctx.fetch=async()=>({ok:true,json:async()=>({result:'not four formulas'})});await a.ctx.runKeywordAI();
 assert.match(a.node('kwBody').textContent,/核心規則與語法約束/);assert.match(a.node('searchAiStatus').textContent,/失敗/);
});
