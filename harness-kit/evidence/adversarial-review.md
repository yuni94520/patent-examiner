# 獨立對抗初審 — FAIL

日期：2026-09-05。僅讀現有交付，未修改 harness-kit。以 A–G、附件認證/安全及官方 API 要求驗收；FINAL-REVIEW.md、SECURITY-SECOND-OPINION.md 與 READBACK.json 尚待收尾，依派工要求不列失敗。

## 需修正

| ID / 嚴重性 | 位置 | 失敗場景 | 最小修法 |
|---|---|---|---|
| R1 / 重要 | README.md:7–8 | 安裝清單漏 CLAUDE.md、README.md；照清單複製至新 repo 後，根入口引用的 harness-kit/CLAUDE.md 不存在，且治理文件要求的 README 無法回讀 | 明列兩檔，或明確要求完整 harness-kit 保留結構複製；保留先備份、比較差異要求 |
| R2 / 重要（規則歧義） | CLAUDE.md:12；governance/02-DISPATCH.md:41 | 入口要求無獨立驗證一律待驗收，但無代理退路只特別要求高風險待第二人；弱模型可誤把低風險自驗當完成 | 調度退路明列所有未獨立驗收交付均待驗收；高風險另需第二人/獨立意見 |
| R3 / 輕微（就地提示） | governance/02-DISPATCH.md:24；governance/01-ENVIRONMENT.md:32 | 調度步驟無條件要求 model/effort，環境快照另說 override 須當前授權。跨 session 只讀調度時容易漏授權條件 | 步驟24就地寫有當前 override 授權才明確指定；否則省略並繼承 |

## 通過與覆蓋

- A–G 結構完整；判準各有正反例；五種派工模板、備份前置、教訓精簡、退化與未完交接均存在。模型/effort 枚舉與本次公開 schema 相符，並正確區分 schema 可指定與實際模型遙測。
- 完整 read-back 原17件交付的全部非HTML內容；追加完整讀 evidence/verify-kit.py。HTML核對432–447、719–770、804–855、1080–1110、1258–1352、2038–2118相關區段，另搜尋 auth/credentials/token/API-key/innerHTML。Markdown相對連結現存且可解。
- 三附件實際 SHA-256 均符合 SOURCE-MANIFEST；HTML副本與原 txt 同為130150 bytes，SHA-256 fb7f9f6217e3d680be803feaf2baef76f08cb0c11db69cffadb26cb1fc934361。
- 實跑：在 harness-kit 執行 `node evidence/diagnose-v310.cjs`，exit 0；未跳脫 payload 到 innerHTML 且持久化、A→B只請求一次、改claim/citation保留label=1，結果與 BASELINE-RESULTS.json 一致。這是原缺陷重現，絕非修復通過。
- 認證元件、request flow、credentials同源邊界與最高可見漏洞的前提相符；原碼未修、browser未驗、缺後端/vocab.js的限制均清楚。
- API子審獨立查官方文件，HF、PQAI、EPO OPS、Lens之入口/auth/費用敘述通過；原文已保留帳戶額度、coverage與hosted模型未知。

限制：不含完整HTML安全審計、真瀏覽器DOM執行、部署CSP/後端auth、遠端版本獨立取證或付費API實測。verify-kit.py僅核對程式內容；待預告收尾檔生成後由主代理執行結構驗收。初審FAIL僅針對上列制度交付問題，不表示附件安全分析失實。
