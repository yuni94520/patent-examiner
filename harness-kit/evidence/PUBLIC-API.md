# Public API 選型附錄：v3.10 專利相似度工具

查核日期：2026-09-05 UTC。範圍：上傳的 v3.10 HTML 程式與「我的優化路線.odt」；未取得遠端 repo 對應版本證明。以下是文件查核，不是已登入帳號、已付費、已實際調用成功的宣稱。

## 先做正確分類

v3.10 的 `fetchEmbeddings()`（原 txt 第 827–855 行）向使用者填入的 URL POST `{texts:[...]}`，只有 JSON Content-Type；沒有供應商 token header。現有 parser 接收 embeddings / vectors / data[].embedding / 二維陣列。**找到 public API 不表示把網址貼進輸入框就能用**。搜尋 API 回傳專利候選，embedding API 回傳向量，必須分別設計 adapter。

ODT 是優化建議兼舊版程式，提到 PatentSBERTa、Ollama、校準與元件拆解；不是證明 v3.10 已實作這些功能的依據。建議的選型次序：先維持可驗證的本地向量服務；需要外部推論才驗 Hugging Face；需要引證檢索再用 PQAI / EPO；有機構權限時評估 Lens。

## 已查官方文件的四個候選

| API | 用途與實際入口 | 認證與配額證據 | 適用／不適用 |
|---|---|---|---|
| Hugging Face Inference Providers — Feature Extraction | 文字轉向量；[官方任務文件](https://huggingface.co/docs/inference-providers/en/tasks/feature-extraction)、[HF Inference 呼叫範例](https://huggingface.co/docs/inference-providers/en/providers/hf-inference)。REST 路由族為 `https://router.huggingface.co/hf-inference/models/{model_id}`；須選 provider 確實支援的 model ID | HF fine-grained token，需 Inference Providers 呼叫權限；[認證文件](https://huggingface.co/docs/inference-providers/en/index)。[價格文件](https://huggingface.co/docs/inference-providers/en/pricing)列 Free Users 每月 $0.10 credits 並註明會變；不等於無限免費。本次未驗帳戶或即時剩餘額度 | 最接近現有 embedding 缺口。輸入是 `inputs`，非現有 `texts`；需後端 adapter。不可宣稱 PatentSBERTa 已有 serverless provider，尚未驗該模型供應狀態；也不提供專利全文搜尋 |
| PQAI | 語意先前技術搜尋、snippet、元件 mapping；`https://api.projectpq.ai/search/102/`、`https://api.projectpq.ai/mappings/`；[官方 API 規格](https://api.projectpq.ai/docs) | 多數路由用 query `token`；圖檔路由有例外。[申請說明](https://search.projectpq.ai/api-docs)列訂閱與學術／非商業申請途徑，免費 token 需申請核准，不是保證。[API 價格](https://projectpq.ai/api-pricing/)列 Starter 每月 $20 / 50 queries；不推定每分鐘上限 | 用來產生候選；mapping 仍需全文人工或可追溯驗證。文件導言稱 patent data 目前 US，但搜尋參數又列 `US,EP,WO`，因此跨國涵蓋待實測／業者確認；不能保證台日同族完整。不是可直接替換的任意文字 embedding API |
| EPO Open Patent Services | XML REST，書目、法律事件、全文、圖像；[官方入口與 OpenAPI 下載連結](https://www.epo.org/en/searching-for-patents/data/web-services/ops)，[開發者入口](https://developers.epo.org/) | 官方要求註冊 app 並使用 OAuth。非付費額度目前每週 4 GB，仍受 fair use；不是每分鐘不限流。精確 token URL／有效期需依該頁連結的現行 OpenAPI 重新查，不在此猜寫 | 適合作為引證資料／全文來源與核對來源；單一文獻的 claims / description 是否可取得仍須實測。不是模型推論或必然完整的台日全文庫 |
| Lens Patent API | `https://api.lens.org/patent/search`、`https://api.lens.org/patent/{lens_id}`；[官方入門](https://docs.api.lens.org/getting-started.html)。[Response schema](https://docs.api.lens.org/response-patent.html)有 claims、description、families | 先核准存取，再建立 token；POST 用 `Authorization: Bearer …`。額度由 plan 與 response rate-limit headers 驗證；[使用條款](https://about.lens.org/lens-api-terms-of-use/)目前表示需機構訂閱，不能寫免費。實際帳戶額度未驗 | 適合跨文獻整合、家族及全文欄位；schema 有欄位不代表每件文獻有值。法律狀態是衍生資訊，官方明示可能不準確；不能直接当正式法律結論 |

## 後續模型必須照做的接入驗收

1. 先記用途 `embedding` 或 `patent_search/fulltext`；禁止混接。做一個公開／合成文字最小請求，記 HTTP 狀態、去識別化 schema、模型／資料庫版本、查核日期；未執行就寫「文件確認、未實測」。
2. 複查現行官方 auth / pricing / coverage；需要新付費或機構申請時列為依賴。不得使用文件範例 token，也不得聲稱 token 已具備。
3. 付費或共享 token 留在後端 secret store / process environment，禁止 HTML、localStorage、git、截圖、稽核 JSON。PQAI 文件使用 URL token，若該路由確實只支援此方式，僅由後端發送並遮蔽 URL query 日誌；不得把完整 URL 回傳前端。
4. 自有後端須限制目的 host / 路由、請求大小、並行與每日預算；不能把「任意 endpoint」變成代持 token 的開放代理。TLS、401、403、429、timeout 要各自顯示原因，遵循供應商 retry headers；最多两輪重試，避免費用失控。
5. 向量驗收：筆數與輸入一致、同維、全部 finite number、非零 norm；cache key 含 provider + model + revision + preprocessing + input hash。換模型必須失效舊 cache，不混算不同向量空間。
6. 引證驗收：保留 publication number、kind code、公開日期、來源 URL、擷取日期、段落或 claim 定位；正文缺失必須標「缺失」，不得拿 snippet 冒充全文。自動分數不是新穎性／進步性的判斷替代品。
7. 以至少一筆中文、一筆英文、已知不相似與同義表述的固定 fixture 驗證；不能因 HTTP 200 就宣稱語意模型有效。ODT「同義詞問題天然消失」是過度承諾，應用錯例集測召回與假陽性。

## 尚未完成／不應猜測

- 未調用付費 API、未申請帳戶、未傳送使用者案件文字、未做程式整合。
- 台灣／日本逐件全文涵蓋、各帳戶可用配額、PatentSBERTa 的即時 hosted provider 與原 repo 部署設定仍未知。
- USPTO 官方已有 [PatentsView 轉移說明](https://data.uspto.gov/support/transition-guide/patentsview)；查詢結果表示舊 key 不相容 ODP。本文不把舊 PatentsView 範例當新整合保證，之後如採用須另查當前 ODP 規格與帳戶要求。
- 不把 Google Patents 網頁 URL 宣稱為官方公開搜尋 API；本次未找到足以驗證這種宣稱的官方 API 規格。

完成判準：四個候選有官方入口、auth／費用邊界、適用性、接入驗收；實測接入屬下一個明確授權的開發任務，不在本次立制度範圍。
