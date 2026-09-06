// BASELINE DIAGNOSTIC: exit 0 means original defects reproduced, NOT a repaired product.
// No browser execution claim: verifies source->storage->HTML sink and actual computational functions.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const path=require('path');
const source=fs.readFileSync(process.argv[2] || path.join(__dirname,'../sources/v3.10.html'),'utf8');
const script=source.match(/<script>([\s\S]*)<\/script>/)[1].replace(/^init\(\);$/m,'');
const storage=new Map(),elements=new Map();
const element=()=>({value:'',style:{},innerHTML:'',textContent:'',remove(){},appendChild(){},addEventListener(){}});
const ctx={console,Map,Date,JSON,setTimeout(){},window:{},document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,querySelector(){return null},head:{appendChild(){}},body:{appendChild(){}},addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},FileReader:class{readAsText(f){this.onload({target:{result:f.contents}})}}};
vm.createContext(ctx);vm.runInContext(script,ctx);
(async()=>{
const marker='<svg onload="window.__audit_marker=1"></svg>';
ctx.fixture={target:{files:[{contents:JSON.stringify({cases:[{id:'offline-marker',raw_score:marker,label:null}]})}],value:''}};
vm.runInContext('importDB(fixture)',ctx);
assert(elements.get('dbBody').innerHTML.includes(marker));
const xss={unescapedPayloadReachesHtmlSink:true,persistsInStorage:storage.get('pat_sim_v35_db').includes('onload'),browserExecution:'NOT TESTED: Chromium binary unavailable'};
let calls=0;ctx.fetch=async()=>({ok:true,json:async()=>({embeddings:[[++calls,0]]})});
elements.get('semanticEndpoint')||ctx.document.getElementById('semanticEndpoint');
elements.get('semanticEndpoint').value='https://endpoint-a.invalid/embed';
const a=await vm.runInContext("fetchEmbeddings(['cache-test'])",ctx);
elements.get('semanticEndpoint').value='https://endpoint-b.invalid/embed';
const b=await vm.runInContext("fetchEmbeddings(['cache-test'])",ctx);
assert.equal(calls,1);
storage.set('pat_sim_v35_db',JSON.stringify({cases:[{id:'same-patent',claim:'first claim',citation:'first citation',label:1,verified_at:'old'}]}));
ctx.document.getElementById('claimTxt').value='different claim';ctx.document.getElementById('citTxt').value='different citation';
vm.runInContext("autoSave('same-patent',{raw_score:5,final_score:5,sims:[]})",ctx);
const row=JSON.parse(storage.get('pat_sim_v35_db')).cases[0];assert.equal(row.label,1);assert.equal(row.claim,'different claim');
const result={xss,endpointCache:{calls,a,b,staleEndpointCache:true},labelCarryover:{label:row.label,claim:row.claim,citation:row.citation}};
console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
