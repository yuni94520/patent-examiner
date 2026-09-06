# 最終收斂驗收

日期：2026-09-06

## 結論

**PASS（制度交付範圍）**。已完整回讀最終制度文件、README 交付對照、兩輪審查紀錄、安全第二意見、來源證據與 closure 前 `READBACK.json`；未發現仍阻塞制度包收斂的內容缺陷。先前 `FINAL-REVIEW.md` 僅作歷程證據，本結論來自本輪重新核對與實跑。

狀態定義：`PASS` 為本輪有檔案或實跑證據支持；`FAIL` 為阻塞交付且尚未修正；`NOT_VERIFIED` 為本輪輸入或環境不足以證實。**FAIL：0 項。**

| 驗收面向 | 狀態 | 本輪結果 |
|---|---|---|
| 制度文件完整回讀與交付入口 | PASS | A–G、證據、來源與交接內容一致；README 指向本檔及 `READBACK.json`，closure 前快照為 27 檔、errors 空陣列。 |
| 第二意見 7 項文字修正 | PASS | 現行 `SECURITY-REVIEW.md` 已逐項吸收，見下表。 |
| 結構、UTF-8/JSON、來源 hash、Markdown 本地連結 | PASS | `python3 evidence/verify-kit.py` exit 0，輸出 `status: PASS`、`errors: []`；其自述範圍不是安全測試。 |
| 原始缺陷離線重現 | PASS | `node evidence/diagnose-v310.cjs` exit 0；重現未跳脫資料到 HTML sink 並持久化、endpoint stale cache、label carry-over。此 PASS 只代表 baseline 重現。 |
| 產品安全修復 | NOT_VERIFIED | 產品原碼未修改，沒有修補後反向安全測試。 |
| 真實瀏覽器 DOM／事件執行 | NOT_VERIFIED | Node 使用不解析 DOM 的 stub；輸出明載 `browserExecution: NOT TESTED: Chromium binary unavailable`。 |
| repo 安裝、後端與部署 | NOT_VERIFIED | 未確認 v3.10 repo commit，制度包未安裝；後端、auth、CSP、`vocab.js` 與 lockfile 未提供。 |

## 安全第二意見的 7 項修正對照

| # | 第二意見要求 | 現行位置與判定 |
|---:|---|---|
| 1 | 引用改為可查核來源路徑 | PASS — `SECURITY-REVIEW.md:11–12` 使用 `sources/v3.10.html:2061`、`:2057`、`:2095`，並聲明其餘裸行號同源。 |
| 2 | schema 擴至所有保存／校準／排序／render／export 欄位及容器限制 | PASS — `SECURITY-REVIEW.md:15–17` 區分 0–100、0–1 與 embedding，要求有限筆數 array、plain object、nested numeric、未知欄位策略及大小上限。 |
| 3 | 四類 sink marker、真實 DOM、reload 與 legacy localStorage 驗收 | PASS — `SECURITY-REVIEW.md:18` 逐列 `raw_score`、`calibrated_score`、`elem_min`、日期欄、注入節點、event sentinel、reload 與預置舊資料。 |
| 4 | 精確限定 Node VM stub 的證明力 | PASS — `SECURITY-REVIEW.md:19` 明載只證實 source→localStorage→innerHTML 字串，未證實 DOM parsing 或 JavaScript execution。 |
| 5 | Fetch credentials 與 CORS 精確化 | PASS — `SECURITY-REVIEW.md:46` 說明預設 `same-origin`、同源隱式 credentials、跨源邊界、JSON preflight，且 CORS 不是認證。 |
| 6 | adapter 邊界 | PASS — `SECURITY-REVIEW.md:48` 優先同源受控後端；跨源時另要求 credentials mode、CORS allowlist、CSRF／session 邊界。 |
| 7 | browser 與修補驗收不得由 exit 0 代替 | PASS — `SECURITY-REVIEW.md:56–58` 將兩者標為 `NOT_VERIFIED`，並明定現有 exit 0 不得作修復 gate。 |

## 實跑證據與限制

- `python3 /workspace/scratch/8bd7256539ff/harness-kit/evidence/verify-kit.py`：exit 0；完整逐位元讀取、required files、來源 SHA-256、UTF-8/JSON 與本地 Markdown 連結檢查通過。
- `node /workspace/scratch/8bd7256539ff/harness-kit/evidence/diagnose-v310.cjs`：exit 0；`unescapedPayloadReachesHtmlSink: true`、`persistsInStorage: true`、`staleEndpointCache: true`、換 claim/citation 後 `label: 1`；不含真實瀏覽器執行。
- 原始 `sources/v3.10.html` 為 130150 bytes，SHA-256 `fb7f9f6217e3d680be803feaf2baef76f08cb0c11db69cffadb26cb1fc934361`，與 manifest 及本輪重算一致。
- 本 PASS 不涵蓋產品已修、安全部署、browser exploit 成功或失敗、完整 repo／後端認證、API 實際付費調用，也不表示制度已安裝到目標 repository。

