# v3.10 附件程式碼：認證、最高風險與回歸證據

## 範圍與可信度

2026-09-05。主來源為 `sources/v3.10.html`（原附件已貼上文字 (1)(5).txt 的逐位元副本）：完整 HTML 包裝，共 2118 行、title 與 SCORING_VERSION 標示 v3.10.0。`vocab.js` 在第 719 行引用但未附。未確認附件對應的 Git commit、後端或部署設定；已找到的候選遠端是 v3.8.2，見 REPOSITORY-IDENTITY.md。故結論是「附件前端已證實」，不能宣稱完成整個 repo 的認證審計。

ODT 另含舊 v3 程式與規劃（只作輔助參考）；流程圖是期望架構，不代表 v3.10 已實作 LLM、BM25 或最弱元件硬閘。三附件文字未找到 GitHub URL。原檔未修改。

## 首要安全風險：匯入驗證庫 → 持久化 DOM XSS

- 入口：`sources/v3.10.html:2061` 的 importDB 僅 JSON.parse，不驗證 case 欄位型別、有限數值、範圍、長度；整筆保存至 localStorage，且同 ID 覆蓋。本頁其餘裸行號均指同一來源副本。
- sink：`sources/v3.10.html:2057` renderDB 直接把 raw_score、calibrated_score、elem_min、日期片段插進 innerHTML；只有 id 經 esc。`sources/v3.10.html:2095` init 重新 renderDB，使問題有持久性。
- 觸發條件：使用者匯入第三方或被污染的 JSON。若部署未以 CSP 等阻擋事件處理器，可在該頁 origin 執行 JavaScript。CSP 部署狀態未知；不把「未看到 CSP header」當作「確定沒有 CSP」。
- 實際影響：同 origin 可讀寫本工具驗證庫、稽核案件全文與 endpoint 設定，並污染之後分數或輸出。對外傳送是否成功取決於網路與 CSP，未做外傳測試。
- 優先修正：匯入邊界嚴格 schema；raw_score/calibrated_score/elem_min 僅允許有限 number 且 0–100，label 限 0/1/null；日期解析及長度限制；所有資料欄位用 textContent 建 DOM，事件 addEventListener 綁定；載入舊 DB 也同樣驗證，拒絕/隔離既有髒資料而非只有修新匯入。
- 尺度不可混用：上述 DB 三個分數是 0–100；elements[].score/semantic/lexical/concept 與 sims[] 是 0–1；embedding 可為負值，不套分數範圍。
- 完整 schema：cases 必須是有限筆數 array，每筆為 plain object；所有保存、校準、排序、render、export 的 numeric 與 nested fields 均按文件化尺度驗證，不能只驗三個表格欄位。未知欄位明定拒絕或移除；id、日期、陣列、巢狀深度、單欄長度與檔案 bytes 均需上限。先完整驗證全部資料，再一次 commit；任一失敗保持原 DB、校準及畫面，不部分覆蓋。
- 驗收：無害 marker 逐一放入 raw_score、calibrated_score、elem_min、verified_at、detected_at，含錯誤陣列型別日期；匯入當下、reload、預置 legacy localStorage 三種情境都須拒絕或純文字化。真實 DOM 不得形成注入的 svg/img 節點，事件 sentinel 不得觸發。合法資料 round-trip 保持文件化欄位、型別與值；未知欄位依 schema 處理；每個大小限制有邊界及超限測試。只用字串 stub 不能簽核修復。
- 已執行：Node VM 搭配不解析 DOM 的 stub element 執行原函式，證實 source→localStorage→innerHTML 字串；未證實 DOM parsing 或 JavaScript execution。Playwright 可載入但 Chromium binary 不存在。`BASELINE-RESULTS.json` 詳列。未下載瀏覽器、未發真實網路請求。

## 對評分可信度影響最大的已證實缺陷：驗證標記移植到不同 claim/citation

`:2046` autoSave 只以 patent id 找舊紀錄，將新 claim/citation 與分數寫入，保留 old.label / verified_at。同專利換請求項或換引證後，舊 SEP 標記仍套在不同文字。`:2050–2051` doVerify 又取目前輸入配 _lastR，使用者評分後改文字再驗證，會存「新文字＋舊分數」。`:1271` refitCalib 不依 scoring_version、模型、語料或 pair identity 篩選，污染可進校準。

修正：不可變 result snapshot；case key 使用 patent_id + claim_number + normalized claim hash + citation identity/content hash + scoring/model版本。未評分的新輸入不得綁舊 result。重算或變更輸入使 review label 失效，除非人工明確再審。校準訓練只接同 target/task、版本相容且身份一致的樣本，訓練與獨立驗證集分離。

離線測試確證：同 id 舊 label=1，換不同 claim/citation 後仍 label=1。驗收需同時覆蓋同專利多請求項、多引證、同分異文、改輸入後按驗證。不能把相關性標記直接稱為 SEP 法律必要性結論；UI 在 `:2052` 稱 SEP，資料 reviewer_label 在 `:2051` 卻是 highly_relevant。

## 另一項已實跑缺陷：切 endpoint 後繼續使用舊 embedding

`:833–850` cache key 只有 normTxt(text)，未含 endpoint、model/revision、維度、前處理版本；`:811–814` 更換 endpoint 不清 cache。離線 stub 計數確證 A→B 同文字只發一次請求，B 回用 A 向量。不同模型向量不可混算。修正 cache key 組成上述身份；endpoint/model變更清空；API 必須回傳模型版本並檢查每個向量 finite number、相同維度、非零範數；測同文字兩 endpoint 必須兩請求。

## 認證元件、request flow 與 token handling（僅可見前端）

| 元件 | 證據 | 行為 / 邊界 |
|---|---|---|
| HTML UI | 432–447 | 使用者填 embedding endpoint，可空白；範例 localhost /embed |
| endpoint 設定 | 804–814, 2109 | URL 存 localStorage 並重載；不是帳號/認證機制 |
| 本地預處理 | 759–770, 1110 起 | vocab.js 可選 fallback；shortlist/query expansion 於瀏覽器 |
| embedding client | 828–853 | POST endpoint，Content-Type application/json，body {texts:missing}；請求內容含需計算的 query/文字片段 |
| response adapter | 821–826, 844–850 | 接 embeddings、vectors、OpenAI-style data、裸二維 array；只有基本 shape/length 檢查 |
| 計分與資料庫 | 1300–1349, 2043–2065 | 瀏覽器算分；案件全文/結果/標記/稽核存 localStorage，可匯出 JSON |

流程：選 endpoint → localStorage 保存 → 本地拆解/候選選取 → POST {texts} → response shape 檢查/cache → cosine 與加权評分 → isotonic → render/save/audit。API 失敗在 `:1097–1104` fallback 本地分數；fetch 無 timeout/AbortSignal，可能長時間等待。

可見程式没有顯式 Authorization、API-key header、login、access-token refresh、token expiry、revocation 或角色權限程式；不能因此判定未附後端沒有 auth。fetch 未設定 credentials，依 Fetch Standard 預設 same-origin：符合條件的同源 cookie、HTTP authentication entries 或 TLS client certificates 可隱式附帶；跨源 credentials 不會由此程式自動附帶。application/json 非 CORS-safelisted Content-Type，跨源通常會 preflight；CORS 不是使用者認證。依據：[Fetch credentials 定義](https://fetch.spec.whatwg.org/#concept-request-credentials-mode)、[CORS safelist](https://fetch.spec.whatwg.org/#cors-safelisted-request-header)。

如要接付費/需 key 的公開 API：優先使用同源且受控的後端 adapter，供應商 key 留伺服器 secret store/env（不進 HTML、localStorage、Git、audit），前端以自身登入 session 存取受控 adapter；server 驗證 session/授權、allowlist 上游、配額/timeout/大小限制、記錄去敏 metadata。若選跨源 adapter，必須另設 credentials mode、CORS allowlist、CSRF 與 session 邊界；這些目前未實作驗證。現在 {texts} 非各家統一格式；「可讀 OpenAI-style response」不代表可直接呼叫 OpenAI request API。不應把 key 放 endpoint query，因為完整 URL 會持久化。

## 架構圖與實作不能等同

現有 MIN_CALIB_SAMPLES=8 (`:757`)，不同於 ODT 每20筆說法；只有8筆且正負各至少1筆便擬合，未見 holdout 驗證。不能保證分數已校準成機率。最弱元件在 raw model 中為加權項，UI warning 為提示，不能稱硬性 min gate；實際 gate 回傳空字串 (`:1331`)。LLM 拆解與 BM25 見流程圖，不可當作已證實實作。ODT「同義詞問題天然消失」「min決定進步性」是過度簡化，後續制度須禁止照抄。

## 重跑

browser execution 與修補後驗收均為 NOT_VERIFIED；現有 exit 0 不得作為修復 gate。CSP 是額外防線而非資料驗證與安全 DOM 建構的替代品。

解壓後於包根目錄：`node evidence/diagnose-v310.cjs`。此測試刻意斷言原版缺陷存在，成功只代表重現，不能當修復驗收通過。fixture 僅包含無害 marker，fetch 全 stub，不讀 credentials。瀏覽器驗收仍待另建真實DOM測試；現在未成功，不可在交付標記通過。未修改應用原碼。完整 repo 後續門檻：先確認 URL/commit、取得 vocab.js/後端/部署與鎖檔，然後 fresh agent 核對上述漏洞與修補，不重掃已證實的附件全文。
