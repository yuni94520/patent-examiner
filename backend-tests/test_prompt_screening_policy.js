const policy=require('../prompt-screening-policy.js');
let pass=0,fail=0;
function ok(name,value,detail=''){if(value)pass++;else{fail++;console.error(`FAIL ${name}: ${detail}`);}}
function eq(name,actual,expected){ok(name,actual===expected,`got ${actual}, expected ${expected}`);}

const high=policy.score({elementScores:[92,90,88],componentScore:90,processScore:90});
eq('complete direct evidence stays high',high.final_score,90);
eq('high threshold matches prompt',high.tier,'H');

const oneMissing=policy.score({elementScores:[95,92,30],componentScore:72.3,processScore:85});
eq('one core missing caps below detail threshold',oneMissing.final_score,69);
eq('one core missing stays summary-only',oneMissing.summary_only,true);

const twoMissing=policy.score({elementScores:[95,30,25],componentScore:50,processScore:80});
eq('two core missing cap',twoMissing.final_score,55);

const inference=policy.score({elementScores:[90,85,80],componentScore:85,processScore:90,obviousnessGapCount:1,obviousnessScore:88});
eq('inference-only core gap cannot cross 70',inference.final_score,65);
eq('obviousness candidate is preserved separately',inference.obviousness_candidate_score,88);

const conflict=policy.score({elementScores:[96,94],componentScore:95,processScore:95,conflicts:[{id:'DIRECTION'}]});
eq('technical conflict hard cap',conflict.final_score,49);

eq('independent dependent prompt weighting',policy.combineIndependentDependent(80,[60,70]),76.3);
eq('no dependents leaves independent score unchanged',policy.combineIndependentDependent(81,[]),81);
ok('version is explicit',policy.version==='v4.1.0-prompt-aligned-screening');

console.log(`RESULT: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
