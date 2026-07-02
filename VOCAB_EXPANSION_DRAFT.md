# 詞庫擴充草稿 — 半導體 / 通訊(5G) / 區塊鏈 / SEP 常見詞彙 → 8 維度分類

## 為什麼要做這個

現有 `PATS`（8 維度規則詞庫）幾乎完全是 HEVC/視訊編碼詞彙。用你實際會遇到的
案件類型實測 `compute8D`（技術上完全相關的一對請求項/引證）：

| 領域 | 目前分數 | 目前分級 | 8 維度命中情況 |
|---|---|---|---|
| 半導體（GAA nanosheet 電晶體，兩段技術上高度相關） | **0** | L | 8 維度只有 `process_flow` 命中 52%，其餘全 0 |
| 5G/通訊（beam management，技術相關） | 58.7 | M | 只有靠通用專利語言（comprising/based on/transmit/receiv/select）碰巧命中，跟技術本身無關 |
| 區塊鏈/SEP（transaction validation，技術高度相關） | **0** | L | **8 維度全部是 0，完全沒有任何命中** |

半導體、區塊鏈這兩類目前是**完全失能**的——不是「判斷為不相似」，是規則詞庫
根本認不出這些字，所以連 tfidf 比較的材料都沒有。5G 那組分數看似正常，其實
是巧合（英文專利語言的通用連接詞剛好命中，不是真的辨識出技術特徵）。

## 分類原則

沿用現有 8 維度定義，不新增維度（避免動到 `ATTRS` 權重與 `compute8D` 的
其他計算邏輯）。以下只擴充 `PATS`（英文正規表示式）與 `ZH_EN`（中譯英）
兩張表的內容，`compute8D`/`tfidf`/`extractAttrs` 的計算邏輯完全不動。

---

## 1. `components`（元件，權重 0.25 — 影響最大，優先處理）

**半導體：**
`transistor|substrate|channel|gate(?:\s*electrode)?|nanosheet|nanowire|fin|source|drain|epitax\w+|dielectric|oxide layer|metal layer|via|interconnect|contact plug|spacer|well|doping|dopant|silicide|barrier layer|capacitor|MIM|DRAM|NAND|memory cell|bit\s*line|word\s*line|die|wafer|package|solder|bump|through[- ]silicon via|TSV`

**5G/通訊：**
`base station|user equipment|UE|antenna(?:\s*panel)?|beam(?:forming)?|carrier|subframe|resource block|reference signal|synchronization signal|network node|core network|gNB|eNB|RF front[- ]end|modem|transceiver|codebook|MIMO|waveform|spectrum`

**區塊鏈：**
`block(?:chain)?|ledger|node|transaction|smart contract|consensus|hash|Merkle (?:tree|root)|wallet|public key|private key|digital signature|token|miner|validator|peer`

**SEP 常見結構詞（跨領域通用）：**
`standard|specification|protocol|interoperab\w+|essential patent|implementation|compliant device`

## 2. `steps`（步驟，權重 0.15）

現有詞庫（determine/calculate/generate/select/apply...）本身是通用動詞，
半導體/通訊/區塊鏈都用得到，**建議只小幅補充領域特有動詞**：

`fabricat\w+|deposit\w+|etch\w+|anneal\w+|implant\w+|polish\w+|grow\w+|form\w+ (?:a|the)|broadcast\w+|validat\w+|verify\w+|sign\w+|hash\w+|mine\w+|append\w+|handover\w+|schedul\w+`

## 3. `process_flow`（流程，權重 0.15）

現有詞庫已是通用連接詞（first/then/based on/wherein...），**不需要動**，
本身就是領域無關的。

## 4. `math_formula`（數學式，權重 0.15）

**半導体/通訊常見符號詞：** `SNR|BER|voltage|current|frequency|bandwidth|gain|resistance|capacitance|nanometer|nm|angstrom|Å`
**區塊鏈：** `nonce|difficulty|gas (?:limit|fee)|block height|hash rate`

## 5. `pseudocode`（程式碼，權重 0.10）

`smart contract` 常涉及狀態機/條件語法，可補：
`function\s*\(|require\(|mapping\(|struct\b|event\b|modifier\b|state\s*variable`

## 6. `relative_position`（相對位置，權重 0.08）

半導體結構描述常用：`overlying|underlying|stacked|vertical\w*|planar|sidewall|top surface|bottom surface`
（現有 left/right/above/below 已部分適用，這裡補半導體慣用語）

## 7. `sequence`（順序，權重 0.07）／ 8. `relevance`（關聯性，權重 0.05）

現有通用詞（first/second/depend/correlat...）跨領域適用，**不需要動**。

## 8. `ZH_EN`（中文→英文對照，供中文請求項使用）

```
半導體/半导体 → semiconductor
電晶體/晶體管 → transistor
基板 → substrate
閘極 → gate electrode
通道層 → channel layer
磊晶 → epitaxial
介電層 → dielectric layer
金屬層 → metal layer
穿孔/導通孔 → via interconnect

基地台 → base station
用戶設備 → user equipment UE
波束/波束成形 → beam beamforming
參考訊號 → reference signal
資源區塊 → resource block
天線陣列 → antenna array

區塊鏈 → blockchain
分散式帳本 → distributed ledger
交易 → transaction
共識機制 → consensus
數位簽章 → digital signature
智能合約 → smart contract
雜湊/哈希 → hash
節點 → node
```

---

## 建議的導入方式（不是全有全無）

1. 先只加 `components`（影響最大、目前最失能）+ `ZH_EN` 對照，跑一次
   `test_core_engine.js` 的回歸測試確認 HEVC 案件分數不受影響
   （因為是「新增」regex 選項，不是替換，理論上舊案件分數應該完全不變）
2. 用你手上 2-3 個真實半導體/通訊案例的請求項+引證組實測，看分數方向
   是否符合你的專業判斷
3. 確認沒問題後，再視情況擴充區塊鏈/SEP 專屬詞彙

我先不會自己把這份草稿直接合併進 `index.html`——因為這是領域判斷（哪些詞算
「元件」、該不該收），需要你確認清單本身picture正確，不是我能單方面決定的
產品範圍。你看過這份草稿沒問題、或想增刪詞彙之後，跟我說一聲我就把它變成
實際的 code diff、跑測試、（等 token 生效後）一起 push。
