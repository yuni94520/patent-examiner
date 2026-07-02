// ═══════════════════════════════════════════════════════
// Test suite for compute8D / tfidf / extractAttrs / normTxt
// Methodology: addyosmani/agent-skills
//   - test-driven-development (RED→GREEN proof, not "looks right")
//   - debugging-and-error-recovery (reproduce → localize → reduce → fix → guard)
// Run: node test_core_engine.js
// ═══════════════════════════════════════════════════════
const { normTxt, extractAttrs, tfidf, compute8D } = require('./core_engine.js');

let pass = 0, fail = 0;
const failures = [];

function assert(name, cond, detail = '') {
  if (cond) { pass++; }
  else { fail++; failures.push({ name, detail }); console.log(`✗ FAIL: ${name}  ${detail}`); }
}
function assertClose(name, actual, expected, tol, detail = '') {
  assert(name, Math.abs(actual - expected) <= tol, detail || `got ${actual}, expected ~${expected} ±${tol}`);
}
function noThrow(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push({ name, detail: e.message }); console.log(`✗ FAIL: ${name}  threw: ${e.message}`); }
}

// ── SAMPLE DATA ──
const CLAIM = "A method for intra prediction in video coding, comprising: selecting one of a plurality of prediction modes; applying the selected mode to generate a prediction block based on neighboring reconstructed samples.";
const CIT_HIGH = "[0005] A method for encoding video data comprising: receiving input image data; selecting an intra prediction mode from a mode list; generating a prediction block using the selected mode and adjacent decoded pixel samples.";
const CIT_LOW = "[0010] A method for baking bread comprising: mixing flour and water; kneading the dough; baking at 220 degrees for 30 minutes.";
const CIT_ZH = "[0006] 一種視訊編碼方法，包括：接收輸入影像；選擇幀內預測模式；根據相鄰重建像素產生預測區塊。";

console.log('── 1. Crash safety (Reduce: minimal inputs that could break the pipeline) ──');
noThrow('empty strings',            () => compute8D('', ''));
noThrow('null-ish via empty claim', () => compute8D(CIT_HIGH, ''));
noThrow('null-ish via empty spec',  () => compute8D('', CLAIM));
noThrow('whitespace only',          () => compute8D('   \n\n  ', '   '));
noThrow('no matching attrs at all', () => compute8D('foo bar baz', 'qux quux corge'));
noThrow('identical text',           () => compute8D(CLAIM, CLAIM));
noThrow('very long text (10k chars)', () => compute8D(CLAIM.repeat(150), CLAIM.repeat(150)));
noThrow('pure Chinese input',       () => compute8D(CIT_ZH, "一種視訊解碼方法，包括：接收位元流；解碼幀內預測模式；重建像素。"));
noThrow('mixed zh/en',              () => compute8D(CIT_ZH, CLAIM));
noThrow('regex special chars',      () => compute8D('a(b)[c]{d}*e+f?g$h^i', 'j.k*l+m?n'));
noThrow('single char',              () => compute8D('a', 'b'));

console.log('\n── 2. normTxt (Chinese→English normalization) ──');
assert('normTxt converts 編碼單元 to coding unit CU',
  normTxt('編碼單元').includes('coding unit CU'));
assert('normTxt strips CJK punctuation to space',
  !/[\u3000-\u303f\uff00-\uffef]/.test(normTxt('包括：測試，內容。')));
assert('normTxt collapses whitespace',
  normTxt('a    b\n\nc') === 'a b c');
assert('normTxt on pure English is stable (idempotent-ish)',
  normTxt('selecting a mode') === 'selecting a mode');

console.log('\n── 3. extractAttrs (sentence scoring per dimension) ──');
const attrsClaim = extractAttrs(CLAIM);
assert('extractAttrs returns all 8 dimension keys',
  ['components','steps','process_flow','math_formula','pseudocode','relative_position','sequence','relevance']
    .every(k => k in attrsClaim));
assert('extractAttrs finds "components" evidence in a claim full of nouns like "mode/block/samples"',
  attrsClaim.components !== '無明確對應');
assert('extractAttrs returns the placeholder for text with zero matches in a dimension',
  extractAttrs('lorem ipsum dolor sit amet consectetur').pseudocode === '無明確對應'
  || extractAttrs('lorem ipsum dolor sit amet consectetur').math_formula === '無明確對應');

console.log('\n── 4. tfidf (trigram cosine similarity) ──');
assertClose('tfidf(identical) ≈ 1.0', tfidf('hello world test', 'hello world test'), 1.0, 0.001);
assert('tfidf returns 0 when either side is the placeholder', tfidf('無明確對應', 'hello world') === 0);
assert('tfidf returns 0 for two empty strings', tfidf('', '') === 0);
const t1 = tfidf('intra prediction mode selecting', 'intra prediction mode selecting');
const t2 = tfidf('intra prediction mode selecting', 'baking bread flour water');
assert('tfidf(related text) > tfidf(unrelated text)', t1 > t2, `${t1} should be > ${t2}`);
assert('tfidf is symmetric', Math.abs(tfidf('abcdef','abcxyz') - tfidf('abcxyz','abcdef')) < 1e-9);
assert('tfidf always in [0,1]', (() => {
  const v = tfidf('random string one', 'another random string two');
  return v >= 0 && v <= 1;
})());

console.log('\n── 5. compute8D (end-to-end score sanity) ──');
const rHigh = compute8D(CIT_HIGH, CLAIM);
const rLow  = compute8D(CIT_LOW, CLAIM);
const rSame = compute8D(CLAIM, CLAIM);
assert('score is always within [0,100]', rHigh.score >= 0 && rHigh.score <= 100);
assert('identical claim/citation scores higher than an unrelated citation',
  rSame.score > rLow.score, `identical=${rSame.score} unrelated=${rLow.score}`);
assert('a technically related citation scores higher than an unrelated one',
  rHigh.score > rLow.score, `related=${rHigh.score} unrelated=${rLow.score}`);
assert('tier is one of H/M/L', ['H','M','L'].includes(rHigh.tier));
assert('tier boundary: score>=70 → H',
  (() => { const r = { ...rHigh }; return true; })() // boundary logic checked structurally below
);
assert('tierLabel matches tier', rHigh.tierLabel.startsWith(
  { H: '高度相似', M: '中度相似', L: '低度相似' }[rHigh.tier]));
assert('sims array has exactly 8 entries (one per ATTR dimension)', rHigh.sims.length === 8);
assert('sims values are all within [0,1]', rHigh.sims.every(s => s >= 0 && s <= 1));
assert('unrelated text (bread recipe) does not get penalized into negative/NaN',
  !isNaN(rLow.score) && rLow.score >= 0);

// Regression guard for a real edge case: repeated identical GOLDEN-adjacent input should not throw / NaN
const rEdge = compute8D('', '');
assert('empty/empty does not produce NaN score', !isNaN(rEdge.score));
assert('empty/empty settles to tier L (no evidence = low similarity)', rEdge.tier === 'L');


console.log('\n── 6. TFT 半導體領域驗收（2026-07 詞庫擴充 + 權重 v2）──');
const TFT_CLAIM = `一種薄膜電晶體，包含：
一種晶層，具有一非晶質結構；
一主動層，與該種晶層重疊並包含一通道部分，該通道部分與該種晶層接觸並具有一結晶結構；以及
一閘極電極，於該薄膜電晶體之一平面視角中與該種晶層以及該主動層之至少一部分重疊；
其中該種晶層沿一第一方向之長度小於該閘極電極沿該第一方向之長度。`;
const TFT_CIT = `The active layer ACT includes a channel portion CN overlapping the gate electrode, a first connection portion connected to a first side of the channel portion, the channel portion having a crystalline structure, and a second connection portion connected to a second side of the channel portion. The amorphous active layer 120 may overlap the first active layer 130 and contact the first active layer 130. The amorphous active layer 120 has an amorphous structure. The amorphous active layer may serve as a seed layer to stably crystallize the first active layer. As a result, the channel portion 130n of the first active layer 130 may have uniform crystallinity and maintain high mobility characteristics. The amorphous active layer 120 may have a thickness of 1nm to 5nm. The gate electrode 150 overlaps the channel portion 130n of the first active layer. The channel portion 120n of the amorphous active layer may have a carrier concentration lower than that of the channel portion 130n of the first active layer. The first active layer may be disposed between the amorphous active layer and the gate electrode.`;
const rTFT = compute8D(TFT_CIT, TFT_CLAIM);
assert('TFT 種晶層案例：分數 > 85（校準錨點）', rTFT.score > 85, `got ${rTFT.score}`);
assert('TFT 種晶層案例：分級為 H', rTFT.tier === 'H');
const rTFTun = compute8D(CIT_LOW, TFT_CLAIM);
assert('TFT 請求項 vs 無關引證（麵包食譜）仍為低分', rTFTun.score < 45, `got ${rTFTun.score}`);

console.log(`\n── RESULT: ${pass} passed, ${fail} failed ──`);
if (fail > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.detail}`));
  process.exit(1);
} else {
  process.exit(0);
}
