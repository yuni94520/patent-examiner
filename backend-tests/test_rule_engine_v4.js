const engine=require('../rule-engine-v4.js');
let pass=0,fail=0;
function ok(name,value,detail=''){if(value)pass++;else{fail++;console.error(`FAIL ${name}: ${detail}`);}}
function score(name,claim,citation,min,max=100,options={}){const r=engine.scorePair(claim,citation,options);ok(name,r.final_score>=min&&r.final_score<=max,`got ${r.final_score}, expected ${min}..${max}`);return r;}

const redundancy=score('redundancy composite maps to selector','一種 column line selection circuit','repair control circuit receives a column address; a column decoder changes a column selection signal to replace a defective line with a redundancy bit-line.',90);
ok('audit names redundancy rule',redundancy.triggered_rules.some(r=>r.id==='MEM_REDUNDANCY_COMPOSITE_SELECTOR_001'));

score('dummy line only partially supports physical identity','該導線與供電導線相同','A dummy wire mimics matched length, resistance and capacitance loading.',70,80);
score('NAND substitution requires polarity guard','第一邏輯閘為 NAND','primary sense amplifier only',0,65);
score('NAND substitution with polarity guard','第一邏輯閘為 NAND','primary sense amplifier has complemented inputs and asserted output polarity equivalent to the inverter stage.',80,90);
score('independent ports cannot imply differential without guard','兩個埠形成互補差動對','two independent ports are disclosed.',0,65);
score('independent ports map with differential guard','兩個埠形成互補差動對','two independent ports carry complementary values for differential sensing.',80,90);

const gated=score('combination remains provisional until approved','寫入埠透過傳輸閘耦接','dual read-port SRAM; write port DLT is coupled by a transmission gate.',70,80);
ok('combination gate is visible',gated.combination_gate==='needs_examiner_confirmation');
score('approved combination can reach direct rule score','寫入埠透過傳輸閘耦接','dual read-port SRAM; write port DLT is coupled by a transmission gate.',95,100,{combinationApproved:true});

score('AI-as-controller requires same-purpose guard','使用預訓練機器學習模型特徵提取器','a conventional analysis tool is used.',0,65);
const ai=score('AI-as-controller is obviousness-only','使用預訓練機器學習模型特徵提取器','a conventional analysis tool produces the same decision for the same technical purpose.',85,95);
ok('AI rule is not direct disclosure',ai.triggered_rules.some(r=>r.channel==='obviousness_only'));

const art26=engine.scorePair('模型判定移除通孔','引證揭露傳統分析工具',{specification:'說明書僅識別候選通孔'});
ok('Article 26 flag is separate',art26.article26_flags.length===1&&art26.article26_flags[0].separateFromSimilarity===true);

const conflict=engine.scorePair('increase power to the modem','the controller will decrease power');
ok('direction conflict penalizes score',conflict.conflict_penalty===20);
ok('raw corpus remains immutable',conflict.raw_corpus_modified===false);
ok('version is explicit',engine.version==='v4.0.0-shadow.1');

console.log(`RESULT: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
