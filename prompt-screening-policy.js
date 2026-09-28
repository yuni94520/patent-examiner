// Prompt-aligned patent screening policy (browser + Node).
// Converts evidence scores into the same hard-cap and penalty logic used by the AI screening prompt.
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.PromptScreeningPolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const version='v4.1.0-prompt-aligned-screening';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
  const round1=v=>+clamp(v).toFixed(1);
  function tier(score){return score>=85?'H':score>=70?'M':'L';}
  function score(input={}){
    const elementScores=(input.elementScores||[]).map(x=>clamp(x));
    const component=clamp(input.componentScore==null?mean(elementScores):input.componentScore);
    const ruleDirect=clamp(input.directRuleScore||0);
    const effectiveComponent=input.directRuleTriggeredCount>0?Math.max(component,ruleDirect):component;
    const process=clamp(input.processScore);
    const base=0.5*effectiveComponent+0.5*process;
    const missing=elementScores.filter(x=>x<45).length;
    const weak=elementScores.filter(x=>x>=45&&x<70).length;
    const penalties=[];
    const weakPenalty=Math.min(15,weak*5);
    if(weakPenalty)penalties.push({id:'WEAK_NONCORE_ELEMENTS',amount:weakPenalty,count:weak});
    const penalty=penalties.reduce((s,x)=>s+x.amount,0);
    let cap=100;
    const capReasons=[];
    const setCap=(value,id)=>{if(value<cap)cap=value;capReasons.push({id,cap:value});};
    if(missing>=2)setCap(55,'TWO_OR_MORE_CORE_ELEMENTS_MISSING');
    else if(missing===1)setCap(69,'ONE_CORE_ELEMENT_MISSING');
    const conflicts=input.conflicts||[];
    if(conflicts.length)setCap(49,'TECHNICAL_CONFLICT');
    if(input.sameDomainOnly)setCap(35,'SAME_DOMAIN_OR_PURPOSE_ONLY');
    if((input.obviousnessGapCount||0)>0||input.requiresCombination)setCap(65,'CORE_GAP_REQUIRES_INFERENCE_OR_COMBINATION');
    const final=round1(Math.min(cap,Math.max(0,base-penalty)));
    return {
      version,formula:'min(hard cap, 0.5 * component + 0.5 * process - penalties)',
      final_score:final,tier:tier(final),base_score:round1(base),component_score:round1(effectiveComponent),
      process_score:round1(process),hard_cap:cap,penalty_total:penalty,penalties,cap_reasons:capReasons,
      missing_core_count:missing,weak_element_count:weak,
      obviousness_candidate_score:round1(input.obviousnessScore||0),
      detailed_analysis_required:final>=70,
      summary_only:final<70
    };
  }
  function combineIndependentDependent(independentScore,dependentScores=[],weights={independent:0.75,dependent:0.25}){
    const ind=clamp(independentScore),deps=(dependentScores||[]).map(x=>clamp(x));
    if(!deps.length)return round1(ind);
    return round1(weights.independent*ind+weights.dependent*mean(deps));
  }
  return {version,score,tier,combineIndependentDependent};
});
