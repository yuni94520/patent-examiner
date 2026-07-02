# SPEC — 8D 相似度比對後台引擎 (compute8D)

> 依 `addyosmani/agent-skills` 的 **spec-driven-development** 補寫的規格文件。
> 因原專案沒有既有 spec，此文件先描述「現況行為」（reverse-spec），
> 再列出上市前必須決策的開放問題。不是重寫，是把隱性邏輯顯性化。

## 1. Objective

給定「本案請求項」與「引證/規格段落」兩段文字，輸出 0–100 分的相似度分數與
H/M/L 三級分類，作為 SEP（標準必要專利）初篩與進步性比對的輔助依據。
使用者：TIPO 專利審查官。成功標準：分數/分級與人工判斷方向一致，且對任何輸入
都不會產生 crash 或無法解釋的 NaN 結果。

## 2. 現有演算法（as-built）

```
extractAttrs(text) → 依 8 個維度的正規表示式，從句子中抓「證據句」
tfidf(a, b)         → 對兩段證據句做 3-gram cosine 相似度
compute8D(spec, claim):
  1. sims[8]  = 各維度 tfidf 相似度
  2. raw      = 加權 L2 範數 → 0-100
  3. inf      = raw^0.45 膨脹校正（拉開低分區間）
  4. xgb      = 對 10 筆 GOLDEN 標記樣本做 cosine 比對，
                算「像正樣本」vs「像負樣本」的相對強度 → 0-40
  5. pen      = 核心維度（元件/步驟/流程/數學式）過低時的懲罰分
  6. score    = clamp(inf + xgb − pen, 0, 100)
  7. tier     = score≥70 → H，≥45 → M，其餘 → L
```

## 3. 已知限制（上市前必須決策，非本次自動修復範圍）

### ⚠️ P0 — 詞彙庫為 HEVC/視訊編碼領域鎖定
`ZH_EN` / `SYN` / `PATS` 三張表（`index.html` 第 ~630–697 行）目前只收錄
視訊編碼詞彙（CTU/CABAC/deblocking filter…）。用半導體或通訊類請求項測試：

```
輸入：GAA nanosheet transistor 相關請求項
結果：components/steps/math_formula 等 5/8 維度直接 0（規則詞庫沒收錄
      transistor / substrate / channel / gate 等詞）
```

**這代表對非視訊編碼案件，分數系統性偏低，不是「不相似」而是「詞庫沒看懂」。**
這是產品決策，不是我能單方面猜規則補上去的——需要你依實際案件領域（半導體/
5G/區塊鏈/SEP 常見詞彙）決定要不要擴充 PATS/SYN，或者把詞庫改成可配置。

### P1 — 句子切分只認半形句點/分號
`extractAttrs` 用 `(?<=[.;])\s+` 切句，中文全形句號在 `normTxt` 階段已被
轉成空白，等於整段中文文字會被當成「一個大句子」處理，長文本時準確度會下降。

### P2 — GOLDEN 樣本硬編碼且非常小 (n=10)
`xgb` 這個 0-40 分的子分數完全基於 10 筆寫死在程式碼裡的向量樣本
（`GOLDEN` 陣列），驗證資料庫（`rebuildGolden()`）雖然會把你手動標記過的
案例加進去，但初始只有 6 正 4 反——樣本太小，分數的統計意義有限。

## 4. 本次已修復（P0 級 bug，已驗證）

**Bug**：`compute8D` 在輸入文字與全部 10 筆 GOLDEN 樣本相似度皆為 0 時
（例如：空白輸入、或文字完全不含任何 8 維度規則詞彙），`xgb` 計算會產生
`0/0 = NaN`，導致最終 `score` 變成 `NaN`（畫面上會顯示 `NaN` 或空白，
且該筆結果無法被 `autoSave` 正確存進驗證庫）。

**修復**：把 `(sS/sN)/((sS/sN)+(nS/nN))` 改成先算 `posAvg`/`negAvg`，
分母為 0 時 fallback 回中性值 20（跟「無 GOLDEN 資料」時的既有預設值一致），
不再產生 NaN。單行 diff，其餘邏輯完全不變（見 `test_core_engine.js` 驗證）。

## 5. 驗收標準 (Definition of Done for this pass)

- [x] `compute8D` 對空字串 / 純空白 / 純中文 / 純英文 / 超長文字 / 特殊字元 皆不 crash
- [x] `compute8D('','')` 不再產生 NaN，退化為 tier L、score 0
- [x] 相同文字比對分數 > 無關文字比對分數（單調性）
- [x] 所有既有 DOM id / class / onclick 契約未變動（見 `Ship` 章節）
- [ ] （待你決策）詞彙庫是否擴充至半導體/通訊領域 — P0 開放問題，未修復
- [ ] （待你決策）GOLDEN 樣本是否需要擴充到更大的標記集
