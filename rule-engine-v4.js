// Deterministic, offline EXAMINER v4 shadow scorer (browser + Node).
(function(root,factory){
  const rules=typeof module!=='undefined'&&module.exports?require('./rules/examiner-rules-v4.js'):root.EXAMINER_RULES_V4;
  const api=factory(rules);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.RuleEngineV4=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(RULESET){
  'use strict';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
  const norm=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/[\s\u3000]+/g,' ').trim();
  const has=(text,term)=>norm(text).includes(norm(term));
  const any=(text,terms=[])=>terms.some(t=>has(text,t));
  const allGroups=(text,groups=[])=>groups.every(g=>any(text,g));
  const grams=(text,n=2)=>{const s=norm(text).replace(/\s+/g,'');const out=new Set();for(let i=0;i<=s.length-n;i++)out.add(s.slice(i,i+n));return out;};
  function dice(a,b){
    const A=grams(a),B=grams(b);if(!A.size||!B.size)return 0;
    let hit=0;for(const x of A)if(B.has(x))hit++;
    return 2*hit/(A.size+B.size);
  }
  function splitElements(claim){
    const parts=String(claim??'').split(/(?:\r?\n|[；;]|(?<=[。.!?])\s+)/).map(x=>x.trim()).filter(x=>x.length>=2);
    return parts.length?parts:[String(claim??'').trim()].filter(Boolean);
  }
  function directScore(element,citation){
    const e=norm(element),c=norm(citation);if(!e||!c)return 0;
    const containment=c.includes(e)?1:0;
    const tokens=[...new Set(e.split(/[^a-z0-9\u4e00-\u9fff-]+/).filter(x=>x.length>1))];
    const tokenCoverage=tokens.length?tokens.filter(t=>c.includes(t)).length/tokens.length:0;
    return clamp(100*Math.max(containment,0.62*dice(e,c)+0.38*tokenCoverage));
  }
  function ruleMatch(rule,element,citation,options){
    const joined=element+' '+citation;
    if(rule.approvalStatus==='candidate_ai_distilled'&&!options.includeCandidateRules)return null;
    if(rule.claimAny&&!any(element,rule.claimAny))return null;
    if(rule.evidenceAny&&!any(citation,rule.evidenceAny))return null;
    if(rule.evidenceAll&&!allGroups(citation,rule.evidenceAll))return null;
    if(rule.guardsAny&&!any(joined,rule.guardsAny))return null;
    if(rule.rejectIfAny&&any(joined,rule.rejectIfAny))return null;
    let score=rule.score*100,status='applied';
    if(rule.requiresCombinationGate&&!options.combinationApproved){score=Math.min(score,75);status='provisional_combination_gate';}
    return {id:rule.id,sourceCase:rule.sourceCase,approvalStatus:rule.approvalStatus||'teacher_approved',channel:rule.channel,score:+score.toFixed(1),status};
  }
  function conflictMatches(claim,citation){
    return RULESET.conflicts.filter(r=>any(claim,r.claimAny)&&any(citation,r.evidenceAny)).map(r=>({id:r.id,penalty:r.penalty,maxDistance:r.maxDistance}));
  }
  function teacherBand(score){return score>=90?'HIGH':score>=80?'MID_HIGH':score>=65?'MID':'LOW';}
  function scorePair(claim,citation,options={}){
    const elements=splitElements(claim);
    const scored=elements.map((element,index)=>{
      const direct=directScore(element,citation);
      const matches=RULESET.rules.map(r=>ruleMatch(r,element,citation,options)).filter(Boolean);
      const directMatches=matches.filter(m=>m.channel!=='obviousness_only');
      const inferenceMatches=matches.filter(m=>m.channel==='obviousness_only');
      const directFunctional=directMatches.length?Math.max(...directMatches.map(m=>m.score)):0;
      const inferenceFunctional=inferenceMatches.length?Math.max(...inferenceMatches.map(m=>m.score)):0;
      const directElement=Math.max(direct,directFunctional);
      const score=Math.max(directElement,inferenceFunctional);
      return {index:index+1,text:element,direct:+direct.toFixed(1),functional:+directFunctional.toFixed(1),inference:+inferenceFunctional.toFixed(1),direct_score:+directElement.toFixed(1),obviousness_score:+score.toFixed(1),score:+score.toFixed(1),triggeredRules:matches};
    });
    const values=scored.map(x=>x.score);
    const directValues=scored.map(x=>x.direct_score);
    const mean=values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
    const min=values.length?Math.min(...values):0;
    const directMean=directValues.length?directValues.reduce((a,b)=>a+b,0)/directValues.length:0;
    const directMin=directValues.length?Math.min(...directValues):0;
    const conflicts=conflictMatches(claim,citation);
    const penalty=conflicts.reduce((s,x)=>s+x.penalty,0);
    const fused=clamp(RULESET.scoring.elementMeanWeight*mean+RULESET.scoring.elementMinWeight*min-penalty);
    const directFused=clamp(RULESET.scoring.elementMeanWeight*directMean+RULESET.scoring.elementMinWeight*directMin-penalty);
    // Article 26 compares the claim with the specification, never with prior-art
    // citation text. A caller must pass options.specification explicitly.
    const specification=options.specification||'';
    const legalSignals=specification
      ? RULESET.article26Flags.filter(r=>any(claim,r.claimAny)&&any(specification,r.specAny)).map(r=>({id:r.id,message:r.message,separateFromSimilarity:true}))
      : [];
    const triggeredRules=scored.flatMap(x=>x.triggeredRules.map(r=>({...r,element:x.index})));
    return {
      version:RULESET.version,mode:'static-rule-shadow',formula:RULESET.scoring.formula,
      final_score:+fused.toFixed(1),element_avg:+mean.toFixed(1),element_min:+min.toFixed(1),teacher_band:teacherBand(fused),
      direct_final_score:+directFused.toFixed(1),direct_element_avg:+directMean.toFixed(1),direct_element_min:+directMin.toFixed(1),
      obviousness_final_score:+fused.toFixed(1),inference_only_gap_count:scored.filter(x=>x.inference>x.direct_score).length,
      elements:scored,triggered_rules:triggeredRules,conflicts,conflict_penalty:penalty,
      article26_flags:legalSignals,prior_art_eligibility:'unchecked',
      candidate_rules_enabled:options.includeCandidateRules===true,
      combination_gate:triggeredRules.some(r=>r.status==='provisional_combination_gate')?'needs_examiner_confirmation':'not_triggered_or_satisfied',
      raw_corpus_modified:false
    };
  }
  return {version:RULESET.version,scorePair,splitElements,directScore,teacherBand};
});
