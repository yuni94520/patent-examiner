# v3.10 安全審查獨立第二意見

日期：2026-09-05

## 結論

本次只驗收 `harness-kit/evidence/SECURITY-REVIEW.md` 對附件前端 `harness-kit/sources/v3.10.html` 的描述，並以 `harness-kit/evidence/REPOSITORY-IDENTITY.md` 限定版本身分。`node harness-kit/evidence/diagnose-v310.cjs` 已在本機重跑；未對網站或遠端服務發出請求，也未執行其他程式。

狀態定義：`PASS` 表示文件敘述有原始碼或允許的離線診斷支持；`FAIL` 表示文件文字需修正後才精確；`NOT_VERIFIED` 表示現有附件或測試不足以證明。

| 查核項目 | 狀態 | 第二意見 |
|---|---|---|
| 審查標的與 repository 邊界 | PASS | `sources/v3.10.html:6,752` 是 v3.10.0；候選 repo main 是 v3.8.2，附件與遠端 commit 的對應仍未證明。`SECURITY-REVIEW.md:5` 沒有把附件結論擴張成整個 repo 或部署結論。 |
| 匯入資料到危險 DOM sink 的可達性 | PASS | `sources/v3.10.html:2061` 解析後未做 schema 驗證即保存並呼叫 `renderDB()`；`:2057` 將 `raw_score`、`calibrated_score`、`elem_min`、日期值放入 `innerHTML`，只有 `id` 使用 `esc()`。允許的 stub 也確認 marker 原樣抵達 `innerHTML` 字串。 |
| 持久化與重新觸發 | PASS | 污染資料寫入 `pat_sim_v35_db`；`sources/v3.10.html:1257-1258,2090-2097` 會在重新載入時讀取並重畫。文件稱為持久化風險正確。 |
| 瀏覽器中事件處理器實際執行 | NOT_VERIFIED | `diagnose-v310.cjs:8` 使用只有 `innerHTML` 字串屬性的 stub element，不會解析 DOM，也不會執行 SVG `onload`。診斷輸出也明載 `browserExecution: NOT TESTED`。這不推翻靜態 DOM XSS 判定，但不能當成動態 exploit 證據。 |
| 觸發前提與部署控制 | PASS | 文件正確指出主要入口是使用者匯入第三方或已污染 JSON，並把事件處理器是否可執行繫於實際 CSP 等部署控制。附件沒有 CSP meta；HTTP response header 與實際 origin 未提供，故部署面的可利用性不能再升級為已證實。 |
| 最高前端風險排序 | PASS | 在所給 v3.10 前端附件中，若事件處理器可執行，任意同源 JavaScript 的機密性與完整性影響高於已列的 label carry-over 與 stale embedding cache。此排序只適用附件可見前端；完整 repo、後端與部署最高風險仍是 `NOT_VERIFIED`。 |
| 影響界線 | PASS | 同源 JavaScript 可讀寫此頁可存取的 localStorage，包括驗證庫、audit 內容與 endpoint 設定；可修改頁面、結果及後續狀態。文件沒有聲稱已完成外傳。若部署另有登入後端，腳本可能利用符合條件的同源 credentials 發請求，但後端存在與權限影響均為 `NOT_VERIFIED`。 |
| auth request / credential 說明 | PASS（需精確化文字） | `sources/v3.10.html:839-843` 只設定 `Content-Type: application/json`，未設定 `Authorization` 或 `credentials`。依 Fetch Standard，credentials mode 預設 `same-origin`：符合條件的同源 HTTP cookies、HTTP authentication entries 或 TLS client certificates 可附帶；跨源 credentials 不會因這段程式自動附帶。`application/json` 不是 CORS-safelisted Content-Type，跨源通常先 preflight。CORS 不是使用者認證。後端 auth、cookie 屬性、session、角色權限均未附，狀態是 `NOT_VERIFIED`。 |
| 產品分數尺度 | PASS | UI 顯示 `/100`（`sources/v3.10.html:510-511`）；raw score clamp 到 0–100（`:1241-1255`），element/coverage/structure 等特徵也以百分尺度產生，isotonic 將 0/1 block 值乘 100（`:1285-1291`）。匯入時要求相關 score 是有限 number 且 0–100，尺度正確。 |
| 漏洞嚴重度數值尺度 | NOT_VERIFIED | 文件只作「首要／最高風險」的定性排序，未提供 CVSS 或其他嚴重度分數；沒有數值可驗收。不得把產品的 0–100 技術相關度當成安全嚴重度。 |
| 建議修法方向 | PASS | 邊界 schema 驗證、載入舊資料也驗證、用 `textContent`／DOM API 建立資料節點、用 `addEventListener` 綁事件，以及限制筆數與大小，均直接切斷或降低已見鏈條。 |
| 目前修復是否通過驗收 | NOT_VERIFIED | 沒有修補後程式。現有診斷刻意斷言缺陷存在，exit 0 只代表 baseline 重現。真實 DOM 測試、修補後 reload 測試及 CSP 下測試均未完成。 |
| 文件目前的修復驗收條件是否足夠 | FAIL | `SECURITY-REVIEW.md:16` 的方向正確，但需明定逐一覆蓋四個 sink 欄位、實際 DOM 節點與事件 sentinel、重新載入、既有髒資料、原子匯入及 schema 全欄位範圍；否則只檢查 innerHTML 字串或單一 marker 仍可能誤判通過。 |

## 最高 DOM XSS 風險核對

完整可達鏈如下：

1. 使用者於 `sources/v3.10.html:715` 選擇 JSON；`:2061` 的 `importDB()` 取 `d.cases` 或陣列本身。
2. 每個 case 只以 `id` 尋找覆蓋位置；沒有驗證 `cases`、case object、欄位型別、長度或值域。
3. 同一行先 `dbSave(db)`，再 `renderDB()`。因此即使後續 render 因惡意型別拋錯，髒資料可能已持久化，catch 卻顯示「JSON 格式錯誤」。
4. `sources/v3.10.html:2057` 對 `raw_score`、`calibrated_score` 與 `elem_min` 做 template interpolation；非 null 值會被字串化，沒有 escaping。日期 expression 也不安全：JSON 可把日期設成陣列，陣列 `.slice(0,10)` 後在 template 中仍可把其完整字串元素串入 HTML，不能以表面上的 10 字元 slice 視為安全措施。
5. `sources/v3.10.html:2095` 初始化時會再次呼叫 `renderDB()`，所以關閉或重新整理頁面不會移除污染資料。

允許的診斷在此次重跑得到：`unescapedPayloadReachesHtmlSink: true`、`persistsInStorage: true`、`browserExecution: NOT TESTED`。這組結果足以證明來源到危險 sink 與持久性，不足以聲稱 browser exploit 已動態成功。CSP Level 3 將 inline event handler 交由 `script-src-attr` 控制；實際 response policy 未提供。靜態缺陷仍應在資料邊界與 DOM 建構處修掉，不應以 CSP 作唯一修補。

影響敘述保持條件式是正確的。任意同源腳本可直接存取此頁的 localStorage 與 DOM。HttpOnly cookie 本身不可由腳本讀取，但 Fetch 預設仍可在符合條件的同源請求附帶 credentials；因後端及 session 未附，不能把帳戶接管、特定 server action 或資料外傳寫成已證實影響。

## auth request 與 credential 核對

附件可見的唯一 embedding request 是 `sources/v3.10.html:828-853`：向使用者指定且會持久化的 endpoint 發送 `POST`，header 只有 `Content-Type: application/json`，body 是 `{"texts": missing}`。`missing` 包含 query expansion 文字與 shortlist passage，因此可能含請求項或引證片段。這是資料揭露邊界，並不是登入或 token flow。

文件所說「沒有顯式 Authorization、API key、login、refresh、expiry、revocation、RBAC」與全文搜尋一致。精確的 credential 說法應採 Fetch 的 `same-origin` 預設，而不是籠統寫「沒有 credentials」：同源 cookie／HTTP auth 等可能隱式附帶，跨源則不會由本段程式附帶 credentials。若 adapter 需要供應商 key，建議改成同源且受控的後端 adapter；供應商 secret 不得放進 endpoint query、HTML、localStorage、audit 或 Git。若選擇跨源自有 adapter，還必須明確設計 credentials mode、CORS allowlist 與 CSRF／session 邊界，不能由現有程式推定已具備。

規範依據：

- WHATWG Fetch Standard，request credentials mode 預設及定義：<https://fetch.spec.whatwg.org/#concept-request-credentials-mode>
- WHATWG Fetch Standard，CORS-safelisted request-header／Content-Type：<https://fetch.spec.whatwg.org/#cors-safelisted-request-header>
- W3C Content Security Policy Level 3，`script-src-attr`：<https://www.w3.org/TR/CSP3/#directive-script-src-attr>

## 分數尺度與修復驗收

產品 score 的 0–100 驗證範圍正確，但 strict schema 不應只列三個目前會直接進 DB table 的欄位。所有會保存、校準、排序、render 或 export 的數字也應有明確型別與值域：至少 `element_avg`、`structure_score`、`coverage`、`semantic`，以及 `feature_vector` 的各欄位與 `sims` 的元素；陣列長度、字串長度、日期格式、`id` 型別、`label`／`reviewer_label` 一致性也要定義。未知欄位應明定拒絕或移除，避免「strict schema」只有名稱而沒有可測契約。

修補後的最低驗收集合應是：

1. 分別把無害 marker 放入 `raw_score`、`calibrated_score`、`elem_min`、`verified_at`／`detected_at`，每個案例都必須在匯入當下與頁面重新載入後被拒絕或只成為文字；不得產生 `svg`、`img` 等注入節點，event sentinel 必須保持未設定。
2. 直接預置舊版 localStorage 髒資料後啟動頁面，必須拒絕、隔離或安全文字化；不能只修 `importDB()`。
3. 驗證所有 case 完成後才一次 commit。任一筆或任一欄位失敗時，DB、calibration 與目前畫面保持匯入前狀態，並給出「schema 驗證失敗」而非誤稱 JSON syntax error。
4. 合法資料 round-trip 後，所有文件化欄位、型別與值相同；未知欄位的拒絕／移除行為符合 schema。
5. 筆數、單檔 bytes、單欄字串長度、陣列長度與巢狀深度均有上限；邊界值及超限值都有測試。
6. 真實瀏覽器或可解析 DOM 並執行相關事件模型的環境執行測試。現有 fake DOM VM 可保留為快速 baseline，但不能單獨簽核 XSS 修復。

## 需修文字（給整合者）

1. `harness-kit/evidence/SECURITY-REVIEW.md:11-12`：把 `已貼上文字 (1)(5).txt:2061` 與裸 `:2057`、`:2095` 改成可直接查核的 `sources/v3.10.html:2061`、`sources/v3.10.html:2057`、`sources/v3.10.html:2095`；全文其餘裸行號也建議同樣處理。
2. `harness-kit/evidence/SECURITY-REVIEW.md:15`：在三個直接 HTML sink 分數後補上：「其餘所有保存／校準／排序／render／export 的 numeric 與 nested fields 亦依文件化尺度驗證；`cases` 必須是有筆數上限的 array，case 必須是 plain object，未知欄位明定拒絕或移除。」
3. `harness-kit/evidence/SECURITY-REVIEW.md:16`：補上：「marker 要逐一覆蓋 raw_score、calibrated_score、elem_min 與日期欄；真實 DOM 中不得形成注入節點，事件 sentinel 不得觸發；同一組檢查須在 reload 與預置 legacy localStorage 後重跑。」
4. `harness-kit/evidence/SECURITY-REVIEW.md:17`：將「Node VM 執行原函式驗證」精確化為：「Node VM 搭配不解析 DOM 的 stub element 執行原函式，證實 source→localStorage→innerHTML 字串；未證實 DOM parsing 或 JavaScript execution。」
5. `harness-kit/evidence/SECURITY-REVIEW.md:44`：建議整句改為：「`fetch` 未設定 `credentials`，依 Fetch Standard 預設為 `same-origin`：符合條件的同源 HTTP cookies、HTTP authentication entries 或 TLS client certificates 可隱式附帶；跨源 credentials 不會由此程式自動附帶。`Content-Type: application/json` 非 CORS-safelisted，跨源通常會 preflight；CORS 不是使用者認證。」
6. `harness-kit/evidence/SECURITY-REVIEW.md:46`：把「自有後端 adapter」精確化為「優先使用同源且受控的後端 adapter」；若允許跨源 adapter，另列 credentials mode、CORS allowlist、CSRF／session 設計為必要條件。
7. `harness-kit/evidence/SECURITY-REVIEW.md:54`：在「瀏覽器驗收仍待」後加上：「因此 browser execution 與修補後驗收均為 `NOT_VERIFIED`；現有 exit 0 不得作為修復 gate。」

在以上文字補正後，這份安全報告可作為 v3.10 附件前端的 baseline 缺陷證據；它仍不能作為候選遠端 repo、後端、部署 auth/CSP 或修補完成的簽核。
