import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const file=path.join(here,'..','knowledge-distillation','candidate','ai_labels_batch_2026-09-28_g.json');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
let failed=0;
const band=s=>s>=90?'HIGH':s>=80?'MID_HIGH':s>=65?'MID':'LOW';
for(const row of data.labels){
  const mean=row.elementScores.reduce((a,b)=>a+b,0)/row.elementScores.length;
  const min=Math.min(...row.elementScores);
  const fused=0.4*mean+0.6*min;
  const pass=Math.abs(mean-row.expectedMean)<0.001&&min===row.expectedMin&&Math.abs(fused-row.expectedFused)<0.001&&band(fused)===row.expectedBand;
  if(!pass)failed++;
  console.log(JSON.stringify({caseId:row.caseId,claim:row.claim,scenario:row.scenario,mean,min,fused,band:band(fused),pass}));
}
if(data.sourceConsistency.some(x=>x.separateFromSimilarity!==true||x.requiresHumanReview!==true))failed++;
if(data.article26.some(x=>x.separateFromSimilarity!==true))failed++;
if(failed)process.exit(1);
console.log('All batch-g AI-candidate regressions passed.');
