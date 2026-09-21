# 專利檢索競賽 Gemini 備援版

開啟 [competition.html](./competition.html) 使用六階段備援流程，原有 [index.html](./index.html) 不變。

## 啟動
在此資料夾執行 `python -m http.server 8765`，瀏覽 `http://localhost:8765/competition.html`。本機輸入新的 Gemini API Key；僅保留在目前分頁記憶體，重新整理後須再次輸入。請勿將 Key 寫入程式、URL、commit 或匯出 JSON。先前透過聊天或公開管道分享過的 Key 請撤銷重建。

## 流程
1. 題目照片辨識與草稿；人工校正必要。
2. 英文忠實翻譯及 PQAI 語意描述。
3. 匯入 PQAI TSV 或以三個等號分隔的引證。
4. 全語意反推多路檢索式。
5. 分批每次最多十件引證評分；新增引證可繼續評分。
6. 完成競賽作答草稿。

每階段完成後需按確認才進下一階段。可匯出 JSON 工作紀錄，JSON 不含 API Key。引證摘要的評分僅為初評，未驗證的全文段落和實際檢索筆數不可視為已證實。若題目、摘要或全文屬非公開資訊，請先確認有權上傳至 Gemini API。

## 限制
需要網路連線與有效 Gemini API Key；不是離線模型。瀏覽器直接呼叫 Gemini API，請勿將這個網頁部署到公開網站供他人輸入 Key。引證數量過多時，模型的 context window 和單次輸出上限可能截斷資料；建議分批檢索並人工檢查結果。