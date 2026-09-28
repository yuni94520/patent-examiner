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

score('motorcycle storage box directionally covers vehicle compartment','車輛包括具有槽的隔室','機車具有置物箱，置物箱的固定件形成開口。',95,100);
score('OBD connector maps to communication coupler','通信耦合器被放置在槽內並與 ECU 通信','車載診斷接頭 OBD connector 穿過開口並耦合至動力系統 ECU 以通信。',95,100);
score('bridge retainer is only an obvious spatial substitution without identity guard','蓋上具有接納單元','電瓶蓋覆蓋開口，固定件位於橋接件上。',80,90);
score('bridge retainer reaches exact score with cover-structure guard','蓋上具有接納單元','電瓶蓋覆蓋開口；固定件位於橋接件上，且橋接件屬於蓋並隨蓋移動，形成相同蓋側空間關係。',95,100);
score('snap-fit supports detachable attachment','耦合器殼體可拆卸地附接到接納單元','OBD 接頭殼體具有卡合部 snap-fit，卡合該固定件並可拆卸。',95,100);
const fastener=score('specific hinge is an obviousness-only substitution','該蓋藉由鉸鏈支承','引證以卡扣形成可拆卸結構，具有相同固持功能。',80,90);
ok('fastener substitution is not direct disclosure',fastener.triggered_rules.some(r=>r.channel==='obviousness_only'));
score('fastener substitution requires functional guard','該蓋藉由鉸鏈支承','引證只有卡扣。',0,65);
const obdClaim='車輛，包括具備槽的隔室；蓋覆蓋該槽且第一側具有接納單元；通信耦合器放置在槽內並與ECU通信；耦合器殼體可拆卸地附接到接納單元';
const obdCitation='機車具有置物箱，固定件形成開口；電瓶蓋覆蓋開口，固定件位於橋接件上，且橋接件屬於蓋並隨蓋移動形成相同蓋側空間關係；車載診斷接頭 OBD connector 穿過開口並耦合至動力系統 ECU 以通信；OBD 接頭殼體具有卡合部 snap-fit，卡合該固定件並可拆卸。';
score('111138806 exact four-element teacher scenario reaches HIGH',obdClaim,obdCitation,99,100);

const candidateOff=engine.scorePair('由節點指紋產生軟鎖定白箱','設備 unique identifier is derived from the device; a binding string modifies the white-box implementation and only a legal device produces correct output.');
ok('candidate rules do not auto-promote',candidateOff.triggered_rules.every(r=>!r.id.startsWith('WB_')));
const candidateOn=score('white-box device binding candidate runs only in shadow','由節點指紋產生軟鎖定白箱','設備 unique identifier is derived from the device; a binding string modifies the white-box implementation and only a legal device produces correct output.',95,100,{includeCandidateRules:true});
ok('candidate shadow audit is explicit',candidateOn.candidate_rules_enabled===true&&candidateOn.triggered_rules.some(r=>r.approvalStatus==='candidate_ai_distilled'&&r.id==='WB_DEVICE_ID_TO_NODE_FINGERPRINT_001'));
const representativeProvisional=score('representative-event combination is capped before approval','基於累積回饋選擇代表性事件','為降低回饋開銷，依業務類型及可靠性確定回饋模式。',70,80,{includeCandidateRules:true});
ok('wireless combination gate remains visible',representativeProvisional.combination_gate==='needs_examiner_confirmation');
const representativeApproved=score('representative-event combination reaches 85 after approval','基於累積回饋選擇代表性事件','為降低回饋開銷，依業務類型及可靠性確定回饋模式。',80,90,{includeCandidateRules:true,combinationApproved:true});
ok('wireless bridge stays obviousness-only',representativeApproved.triggered_rules.some(r=>r.channel==='obviousness_only'));
ok('obviousness bridge does not inflate direct score',representativeApproved.direct_final_score<70&&representativeApproved.obviousness_final_score>=80);
const selectionConflict=engine.scorePair('基於累積回饋選擇代表性事件','選擇明示與回饋無關，僅依業務類型。',{includeCandidateRules:true,combinationApproved:true});
ok('selection-basis conflict penalizes direct mismatch',selectionConflict.conflict_penalty===20);
score('DCI codebook maps only with explicit resource-position context','辨識對應於該代表性事件的資源到累積回饋事件映射','DCI carries CBG-DAI; the HARQ碼本 mapping structure identifies the resource position.',80,90,{includeCandidateRules:true});
score('DCI bit count alone cannot imply event mapping','辨識對應於該代表性事件的資源到累積回饋事件映射','DCI only states a bit count.',0,65,{includeCandidateRules:true});

const pagingOff=engine.scorePair('辨識參考PF','PEI is transmitted with a timing offset over multiple paging frames.');
ok('batch-g candidate rules do not auto-promote',pagingOff.triggered_rules.every(r=>!r.id.startsWith('PAGING_')));
const pagingOn=score('reference-PF timing anchor runs only in candidate shadow','辨識參考PF','An early paging indicator PEI is transmitted in advance with a timing offset over multiple paging frames in a paging cycle.',80,90,{includeCandidateRules:true});
ok('reference-PF bridge remains obviousness-only',pagingOn.triggered_rules.some(r=>r.id==='PAGING_REFERENCE_PF_TIMING_ANCHOR_001'&&r.channel==='obviousness_only'));
ok('reference-PF inference is separated from direct disclosure',pagingOn.inference_only_gap_count>=1&&pagingOn.direct_final_score<pagingOn.obviousness_final_score);
score('sync-header low bits directly support validation condition','基於測試塊的特徵值判斷是否滿足驗證條件','For each 64B/66B 66-bit block, the low two bits are tested; unequal two header bits indicate a valid sync header.',95,100,{includeCandidateRules:true});
const checksumConflict=engine.scorePair('特徵值包括校驗序列','The evidence has sync-header bits only and expressly has no checksum or CRC.',{includeCandidateRules:true});
ok('checksum absence is a separate conflict',checksumConflict.conflict_penalty===35);
const numberedConflict=engine.scorePair('第七碼字驗證子狀態使用第六碼字計數器','The citation provides a 一般未編號狀態機 with a counter and threshold.',{includeCandidateRules:true});
ok('generic state machine cannot directly disclose numbered state',numberedConflict.conflict_penalty===25&&numberedConflict.final_score<=50);

ok('version is explicit',engine.version==='v4.1.0-prompt-aligned.1');

console.log(`RESULT: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
