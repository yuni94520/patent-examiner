# 已證實教訓

| ID / 日期 | 觸發與失敗 | 最小防線與驗證 | 狀態 / 規則 |
|---|---|---|---|
| L001 / 2026-09-05 | GitHub candidate main v3.8.2，附件 v3.10.0 | pin附件hash與remote commit各自列；禁止混稱版本 | 已確認；03-RUBRIC版本定位；evidence/REPOSITORY-IDENTITY.md |
| L002 / 2026-09-05 | 工具索引一次回太多造成截斷 | 先名稱後單一schema；輸出被截斷時縮小查詢 | 本次已觀察；00-DIAGNOSIS.md |
| L003 / 2026-09-05 | 匯入字串持久化後進innerHTML | schema + textContent +舊資料驗證；測匯入及重新載入 | 資料流已重現，browser執行未驗；evidence/SECURITY-REVIEW.md |
| L004 / 2026-09-05 | 同專利id換claim/citation仍沿用label | pair hash與不可變結果snapshot；換文負例不得繼承已驗狀態 | 已離線重現、產品未修；evidence/SECURITY-REVIEW.md |
| L005 / 2026-09-05 | endpoint改變而文字相同，回用舊向量 | cache包含provider/model/revision/preprocessing；A→B需重新請求 | 已離線重現、產品未修；evidence/SECURITY-REVIEW.md |

下一條從 L006 開始。新增時使用 05-MAINTENANCE 的完整格式，勿只抄本表摘要。
