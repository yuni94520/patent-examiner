// ═══════════════════════════════════════════════════════════════
// vocab.js — 詞庫外掛檔（v1.0）
// 主程式 index.html 只做比對運算，所有領域詞彙都在這裡維護。
//
// ┌─ 如何擴充 ──────────────────────────────────────────────┐
// │ 1. 新增中譯英：在對應領域的 ZH_EN_XXX 陣列加一行            │
// │      [/中文詞/g, 'english term'],                          │
// │    ※ 越長的詞放越前面（例：「通道部分」要在「通道」前）      │
// │ 2. 新增英文特徵詞：在 PATS_XXX 對應維度的 regex 加關鍵字     │
// │    （用 | 分隔，\w+ 表示接受字尾變化，如 crystalliz\w+）     │
// │ 3. 新增整個領域：複製一組 ZH_EN_XXX + PATS_XXX，            │
// │    在 ENABLED_DOMAINS 加開關，並在最下方合併區塊加進去        │
// │ 4. 開/關領域：改 ENABLED_DOMAINS 的 true/false 即可          │
// └─────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════

// ── 領域開關 ──────────────────────────────────────────────
const ENABLED_DOMAINS = {
  hevc:          true,   // 視訊編碼（原有詞庫）
  semiconductor: true,   // 半導體 / TFT / 顯示（2026-07 新增，已用實際案例驗證）
  telecom:       false,  // 5G / 通訊（草稿，啟用前建議先用實際案例驗證）
  blockchain:    false,  // 區塊鏈（草稿，啟用前建議先用實際案例驗證）
};

// ═══ 中譯英對照 ═══════════════════════════════════════════

// 通用專利語言（永遠啟用）
const ZH_EN_COMMON = [
  [/包括[：:]?/g,'comprising'],[/包含[：:]?/g,'comprising'],[/其中/g,'wherein'],[/所述/g,'the'],
  [/確定/g,'determining'],[/選擇/g,'selecting'],[/使用/g,'using'],
  [/接收/g,'receiving'],[/傳輸/g,'transmitting'],[/產生/g,'generating'],
];

// HEVC / 視訊編碼（原有）
const ZH_EN_HEVC = [
  [/編碼單元/g,'coding unit CU'],[/編碼樹單元/g,'coding tree unit CTU'],
  [/預測單元/g,'prediction unit PU'],[/轉換單元/g,'transform unit TU'],
  [/四叉樹/g,'quadtree'],[/分割/g,'partition'],
  [/運動向量/g,'motion vector'],[/運動補償/g,'motion compensation inter prediction'],
  [/幀間預測/g,'inter prediction'],[/幀內預測/g,'intra prediction'],
  [/去方塊濾波器?/g,'deblocking filter loop filter'],
  [/取樣自適應偏移/g,'sample adaptive offset SAO'],
  [/熵編碼/g,'entropy coding CABAC'],[/量化參數/g,'quantization parameter QP'],
  [/離散餘弦轉換/g,'discrete cosine transform DCT'],
  [/位元流/g,'bitstream'],[/亮度/g,'luma'],[/色度/g,'chroma'],
  [/像素/g,'pixel sample'],[/解碼/g,'decoding'],[/編碼/g,'encoding'],
];

// 半導體 / TFT / 顯示
const ZH_EN_SEMICONDUCTOR = [
  [/薄膜電晶體/g,'TFT'],[/電晶體/g,'transistor'],
  [/種晶層/g,'seed layer'],[/主動層/g,'active layer'],
  [/閘極電極/g,'gate electrode'],[/閘極/g,'gate'],
  [/源極/g,'source electrode'],[/汲極/g,'drain electrode'],
  [/通道部分/g,'channel portion'],[/通道/g,'channel'],
  [/非晶質結構/g,'amorphous structure'],[/非晶質/g,'amorphous'],[/非晶/g,'amorphous'],
  [/結晶結構/g,'crystalline structure'],[/結晶化/g,'crystallize'],[/結晶/g,'crystalline'],
  [/連接部分/g,'connection portion'],
  [/載子濃度/g,'carrier concentration'],
  [/氧化物半導體/g,'oxide semiconductor'],[/半導體/g,'semiconductor'],
  [/基板/g,'substrate'],[/介電層/g,'dielectric layer'],[/絕緣層/g,'insulating layer'],
  [/緩衝層/g,'buffer layer'],[/遮光層/g,'light blocking layer'],
  [/重疊/g,'overlapping'],[/接觸/g,'contacting contact'],
  [/厚度/g,'thickness'],[/奈米/g,'nm nanometer'],
  [/熱處理/g,'heat treatment anneal'],[/退火/g,'anneal'],
  [/磊晶/g,'epitaxial'],[/蝕刻/g,'etching'],[/沉積/g,'deposition'],
  [/摻雜/g,'doping dopant'],[/離子佈植/g,'ion implantation'],
  [/晶粒尺寸/g,'grain size'],[/晶體/g,'crystal'],[/晶面/g,'crystal plane'],
  [/顯示裝置/g,'display device'],[/平面視角/g,'plan view'],
  [/導通孔/g,'via'],[/通孔/g,'via hole'],
  [/形成/g,'forming'],[/位於/g,'disposed'],[/設置/g,'disposed'],
];

// 5G / 通訊（草稿，預設關閉）
const ZH_EN_TELECOM = [
  [/基地台/g,'base station'],[/用戶設備/g,'user equipment UE'],
  [/波束成形/g,'beamforming'],[/波束/g,'beam'],
  [/參考訊號/g,'reference signal'],[/資源區塊/g,'resource block'],
  [/天線陣列/g,'antenna array'],[/載波/g,'carrier'],
  [/通道狀態資訊/g,'channel state information CSI'],
  [/同步訊號/g,'synchronization signal'],
];

// 區塊鏈（草稿，預設關閉）
const ZH_EN_BLOCKCHAIN = [
  [/區塊鏈/g,'blockchain'],[/分散式帳本/g,'distributed ledger'],
  [/共識機制/g,'consensus'],[/共識/g,'consensus'],
  [/數位簽章/g,'digital signature'],[/智能合約/g,'smart contract'],
  [/雜湊/g,'hash'],[/哈希/g,'hash'],[/節點/g,'node'],
  [/交易/g,'transaction'],[/礦工/g,'miner'],[/錢包/g,'wallet'],
];

// 通用結構語言（在領域詞之後、CJK 清除之前套用，避免搶先拆掉「種晶層」等長詞）
const ZH_EN_STRUCTURAL = [
  [/至少/g,'at least'],[/第一/g,'first'],[/第二/g,'second'],[/第三/g,'third'],
  [/複數個/g,'plurality'],[/多個/g,'plurality'],
  [/上表面/g,'upper surface'],[/側表面/g,'side surface'],[/表面/g,'surface'],
  [/部分/g,'portion'],[/方向/g,'direction'],[/長度/g,'length'],[/寬度/g,'width'],
];

// CJK 清除（必須永遠放在 ZH_EN 最後一項）
const ZH_EN_CATCHALL = [
  [/[\u4e00-\u9fff\uff00-\uffef（）【】、，。：；！？「」]+/g,' '],
];

// ═══ 英文同義詞正規化（SYN）═══════════════════════════════
const SYN_HEVC = [
  [/\bFIR\b/gi,'interp-filter FIR'],[/\bDCT\b/gi,'discrete cosine transform DCT'],
  [/\bCABAC\b/gi,'context-adaptive binary arithmetic coding CABAC'],
  [/\bMVD\b/gi,'motion vector difference'],[/\bMVP\b/gi,'motion vector predictor AMVP'],
  [/\bsub-?pixel\b/gi,'fractional sample'],[/\bmacroblock\b/gi,'coding unit CU'],
  [/\bdeblocking filter\b/gi,'deblocking filter loop filter'],
  [/\bSAO\b/gi,'sample adaptive offset SAO'],
  [/\breference frame\b/gi,'reference picture'],
  [/\bmotion compensat\w+/gi,'motion compensation inter prediction'],
  [/\bcandidate list\b/gi,'merge candidate list MVP candidate'],
  [/\bfilter tap[s]?\b/gi,'interp-filter tap coefficient'],
  [/\bhalf-?pixel\b/gi,'half-pel fractional sample'],
  [/\bquarter-?pixel\b/gi,'1/4-pel fractional sample'],
  [/\bMPM\b/gi,'most probable mode MPM intra prediction'],
  [/\bprediction error\b/gi,'prediction residual'],
];
const SYN_SEMICONDUCTOR = [
  [/\bTFT\b/g,'thin film transistor TFT'],
  [/\ba-?Si\b/g,'amorphous silicon'],
  [/\bpoly-?Si\b/gi,'polycrystalline silicon polysilicon'],
  [/\bIGZO\b/g,'InGaZnO oxide semiconductor'],
  [/\bLTPS\b/g,'low temperature polysilicon'],
];

// ═══ 8 維度特徵詞（PATS）═══════════════════════════════════
// 每個維度是「regex 陣列」，新增領域＝往陣列 push 新的 regex，
// 注意：新 regex 的字不要跟既有 regex 重複，避免重複計分。

// 基底（原有，通用+HEVC）
const PATS_BASE = {
  components:[/\b(filter|unit|block|module|encoder|decoder|buffer|coefficient|parameter|flag|index|value|mode|frame|slice|CTU|CU|PU|TU|luma|chroma|pixel|sample|bit|rate|level|signal|output|input|reference|candidate|list|vector|transform|quantiz\w+|predict\w+|interpolat\w+|motion|intra|inter|deblock\w+|SAO|CABAC|entropy|syntax|partition|codeword|bitstream|structure|layer)\b/gi],
  steps:[/\b(determin\w+|calculat\w+|comput\w+|deriv\w+|generat\w+|select\w+|apply\w+|perform\w+|obtain\w+|process\w+|encod\w+|decod\w+|estimat\w+|initializ\w+|predict\w+|reconstruct\w+|transform\w+|quantiz\w+|filter\w+|signal\w+|receiv\w+|transmit\w+|convert\w+)\b/gi],
  process_flow:[/\b(first|then|next|after|before|when|if|else|while|until|based on|according to|in order to|such that|wherein|whereby|step|phase|stage|procedure|process|method|algorithm|equal to|greater than|less than|corresponds|disabled|enabled|subsequently|prior to)\b/gi],
  math_formula:[/([A-Z][a-z]?\s*[=<>≤≥]\s*[\w\s\+\-\*\/\(\)\.]+)|(\b\d+[\-\/]\w+\b)|(\b(formula|equation|threshold|coefficient|ratio|offset|QP|lambda|alpha|beta|delta|max|min|abs|log|floor|ceil|clip|shift|round)\b)/gi],
  pseudocode:[/\b(if\s*\(|for\s*\(|while\s*\(|else\b|return\b|true|false|bool|int|flag|syntax|condition|loop|iterate|assign|\w+\[\w+\]|pStateIdx|valMps|enabled_flag|disabled|partMode|predMode)\b/gi],
  relative_position:[/\b(left|right|above|below|top|bottom|adjacent|neighbor\w*|boundary|inside|outside|between|within|upper|lower|horizontal|vertical|diagonal|position\w*|spatial|region|area|edge|corner|center|collocat\w*)\b/gi],
  sequence:[/\b(first|second|third|1st|2nd|3rd|\d+th|initial\w*|final\w*|last|previous|next|current|prior|subsequent|following|order|sequen\w*|consecutive|successive|temporal|timing|earlier|later)\b/gi],
  relevance:[/\b(depend\w*|based on|correlat\w*|associat\w*|relat\w*|connect\w*|function\w*|correspond\w*|affect\w*|contribut\w*|enable\w*|allow\w*|support\w*|requir\w*|link\w*|interact\w*)\b/gi],
};

// 半導體 / TFT 擴充
const PATS_SEMICONDUCTOR = {
  components:[/\b(transistor|TFT|substrate|channel|gate|electrode|seed|amorphous|crystall\w+|semiconductor|oxide|dopant|carrier|concentration|grain|source|drain|dielectric|insulat\w+|portion|pattern|via|thickness|silicon|capacitor|pixel\s*circuit)\b/gi],
  steps:[/\b(form\w+|deposit\w+|anneal\w+|crystalliz\w+|dop\w+|implant\w+|etch\w+|pattern\w+|overlap\w+|contact\w+|dispos\w+|fabricat\w+|grow\w+|sputter\w+|polish\w+)\b/gi],
  math_formula:[/\b(nm|nanometer|angstrom|at%|atomic\s*percent|°C|degrees?\s*C|mobility|cm2\/?[Vv]?\W?s)\b/g],
  relative_position:[/\b(overlying|underlying|stack\w*|sidewall|surface|planar|cross[- ]section\w*)\b/gi],
};

// 5G / 通訊擴充（草稿）
const PATS_TELECOM = {
  components:[/\b(base\s*station|user\s*equipment|UE|gNB|eNB|antenna|beam(?:forming)?|subframe|resource\s*block|synchronization|network\s*node|core\s*network|transceiver|codebook|MIMO|waveform|spectrum|CSI)\b/gi],
  steps:[/\b(handover\w*|schedul\w+|allocat\w+|measur\w+|report\w+|configur\w+|synchroniz\w+)\b/gi],
};

// 區塊鏈擴充（草稿）
const PATS_BLOCKCHAIN = {
  components:[/\b(blockchain|ledger|node|transaction|smart\s*contract|consensus|hash|Merkle|wallet|public\s*key|private\s*key|signature|token|miner|validator|peer|nonce)\b/gi],
  steps:[/\b(broadcast\w+|validat\w+|verify\w*|verif\w+|sign\w+|hash\w+|min\w+e|append\w+|propagat\w+)\b/gi],
};

// ═══ 合併（依 ENABLED_DOMAINS 組裝，勿改動此區塊順序）═══════
function _mergePats(base, extra){
  const out = {};
  for (const k of Object.keys(base)) out[k] = base[k].slice();
  for (const [k, arr] of Object.entries(extra || {})) {
    if (!out[k]) out[k] = [];
    out[k].push(...arr);
  }
  return out;
}

let _zh = [...ZH_EN_COMMON];
let _syn = [];
let _pats = _mergePats(PATS_BASE, null);

if (ENABLED_DOMAINS.hevc)          { _zh.push(...ZH_EN_HEVC); _syn.push(...SYN_HEVC); }
if (ENABLED_DOMAINS.semiconductor) { _zh.push(...ZH_EN_SEMICONDUCTOR); _syn.push(...SYN_SEMICONDUCTOR); _pats = _mergePats(_pats, PATS_SEMICONDUCTOR); }
if (ENABLED_DOMAINS.telecom)       { _zh.push(...ZH_EN_TELECOM); _pats = _mergePats(_pats, PATS_TELECOM); }
if (ENABLED_DOMAINS.blockchain)    { _zh.push(...ZH_EN_BLOCKCHAIN); _pats = _mergePats(_pats, PATS_BLOCKCHAIN); }

_zh.push(...ZH_EN_STRUCTURAL); // 通用結構語言（域內長詞優先於此）
_zh.push(...ZH_EN_CATCHALL); // CJK 清除永遠最後

const VOCAB = { ZH_EN: _zh, SYN: _syn, PATS: _pats, ENABLED_DOMAINS };

// 瀏覽器 / Node 雙環境輸出
if (typeof module !== 'undefined' && module.exports) module.exports = VOCAB;
else if (typeof window !== 'undefined') window.VOCAB = VOCAB;
