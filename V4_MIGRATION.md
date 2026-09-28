# v4 靜態規則評分遷移

## Phase 1 — Shadow A/B（本分支）

- 保留 v3.10 正式分數與既有 H/M/L 門檻。
- 每次單篇比對同步計算 v4 靜態規則分數。
- 畫面顯示 v3.10 與 v4 shadow；資料庫及 Audit Trail 保存兩者。
- 使用 `0.4 × element average + 0.6 × element minimum` 作為 v4 公式。
- 功能等效、多文獻組合、衝突及第 26 條旗標各自輸出，不混成不可解釋的單一推論。

## Phase 2 — Examiner-labelled calibration

以相同案件記錄：v3.10 分數、v4 分數、審查官標籤、False High、False Low。新增規則必須通過既有教師標籤回歸測試；候選規則不得自行升格。

## Phase 3 — Controlled promotion

只有在 A/B 結果證明 v4 降低錯誤率，且審查官另外核准後，才把 v4 設為正式分數。正式切換時另行決定 UI 門檻，不在 Phase 1 擅自改動。

## 執行測試

```powershell
node backend-tests\test_core_engine.js
node backend-tests\test_rule_engine_v4.js
node backend-tests\test_index_syntax.js
```
