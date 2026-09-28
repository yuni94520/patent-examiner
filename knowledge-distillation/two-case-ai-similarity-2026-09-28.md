# 兩案 AI 相似度與靜態規則蒸餾報告

## 評分方法

本報告使用 EXAMINER v4 影子公式：`0.4 × 元素平均分 + 0.6 × 最低元素分`。A 僅計直接揭露或已具完整功能等效證據的元素；B 才加入審查意見所採用的進步性橋接。B 分數不等於單一引證的新穎性分數，也不直接等於法律結論。

## 結果

| 案號 | 代表請求項 | A 直接揭露 | B 進步性橋接後 | AI 判讀 |
|---|---:|---:|---:|---|
| 111148239 白箱軟鎖定 | 1 | 72.0 | 87.3 | 設備綁定與正確輸出高度相似；LUT 分工、基底檔案及獨立節點轉換主要靠通常知識補足 |
| 111150352 壓縮上行鏈路控制資訊 | 1 | 60.5 | 88.5 | 引證 1 未揭露依累積回饋選代表性事件；結合引證 2 並確認組合動機後才升至中高相似 |

白箱案三個代表情境的 B 平均為 85.8。無線案五個代表情境的 B 平均為 84.7。這些平均值只用於規則校準；沒有逐一重新評分所有附屬項，因此不應稱為全案可專利性的百分比。

## 重要邊界

- 白箱案的 `unique identifier -> node fingerprint` 可視為直接功能等效；`first/second function -> node/global LUT partition` 只能是進步性推論。
- 無線案的 `service type/reliability selected feedback mode -> cumulative-feedback selected representative event` 有選擇依據差異，必須保留組合守門；未確認組合時規則最高 75。
- 兩份審查意見均未提出專利法第 26 條問題。第 26 條旗標維持獨立且本批為 `not_raised_in_supplied_oa`。
- 候選規則標記為 `candidate_ai_distilled`，預設不參與正式或既有影子分數；僅在明確設定 `includeCandidateRules: true` 時執行。
