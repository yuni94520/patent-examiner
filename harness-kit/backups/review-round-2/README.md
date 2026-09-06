# 3.10 長期運作制度包

建立日期：2026-09-05。核心制度 A–G 已寫入；新 CLAUDE.md 是待安裝入口，沒有假裝改過不存在的舊檔。候選 GitHub main 是 v3.8.2，3.10 以附件副本與 hash 為基準。原始附件與遠端均未修改。

## 明天如何開始
1. 解壓此包，讀 00-DIAGNOSIS.md，再讀 CLAUDE.md。將「長期執行模型」的實際能力與 governance/01-ENVIRONMENT.md 核對；Sonnet/Opus/Haiku 的可用 ID 本次未取得。
2. 確認目標 repo 後，將完整 `harness-kit/` 資料夾保留目錄結構複製到 repo：必須包含 `README.md`、`CLAUDE.md`、`00-DIAGNOSIS.md`、`governance/`、`templates/`、`evidence/`、`sources/` 與 `backups/`。若既有同名路徑先備份，再比較差異，禁止整包覆蓋未知檔案。
3. repo 根的既有 CLAUDE.md 先依維護協議備份，再保留原有有效專案規則，加入一句路由：「本專案任務開始請讀 harness-kit/CLAUDE.md，按任務讀需要的模組。」若根目錄無 CLAUDE.md，建立只含這句的檔案。不要直接複製本包入口到根目錄造成相對路徑失效。
4. 新 session 的第一個指令可用：「請讀根目錄 CLAUDE.md 與其路由，回報本次版本來源、模型工具能力與未完事項；本次只做〔任務〕，先列驗收條件。」若讀不到路由，先修安裝，不假設記憶已生效。

## 交付對照
| 要求 | 交付 | 狀態 |
|---|---|---|
| A 快速診斷 | 00-DIAGNOSIS.md | 完成；風險診斷非token量測 |
| B CLAUDE.md | CLAUDE.md | 新入口完成；未安裝到未確認repo，無舊檔可重寫 |
| C 模型調度 | governance/02-DISPATCH.md | 完成；記錄本回合schema與跨平台限制 |
| D 判斷外化 | governance/03-RUBRIC.md | 完成；逐條正反例 |
| E 五類模板 | templates/04-DELEGATION.md | 完成 |
| F 維護協議 | governance/05-MAINTENANCE.md、06-LESSONS.md | 完成 |
| G 給未來的信 | governance/07-NEXT-SESSION.md | 完成；包含未完成產品工作 |
| 認證與漏洞 | evidence/SECURITY-REVIEW.md | 附件前端完成；後端與browser執行待驗 |
| public API | evidence/PUBLIC-API.md | 官方文件查核完成；未整合或調用付費API |
| 獨立審查及read-back | evidence/FINAL-REVIEW.md、evidence/READBACK.json | 以實際檔案結果為準 |

## 最重要的工程結論
本次可見範圍最高安全風險為未驗證 JSON 匯入後持久化進入 innerHTML；條件是使用者匯入污染資料。另有標籤移到不同 claim/citation，以及切 endpoint 不更新向量快取的已重現問題。原產品未修，不能把此制度包當成修復版。

前端 POST `{texts}` 到自填 endpoint，没有顯式供應商 token 管理；它不是登入系統。未知後端認證不能由前端推斷。API 候選是 Hugging Face（向量）、PQAI（檢索）、EPO OPS（專利資料）、Lens（檢索/家族資料），都需分清用途與認證、經 adapter 接入。

## 離線重現
有 Node.js 時，從任何工作目錄執行 `node /完整解壓路徑/harness-kit/evidence/diagnose-v310.cjs`；不發外部請求，只在 VM stub 內用假資料驗證缺陷。來源副本保留作診斷，不應部署。
預期退出 0 並輸出三項已存在缺陷；**退出 0 不是已修安全**。BASELINE-RESULTS.json 是本次原版結果。修復必須另設相反的安全預期測試，並完成瀏覽器層驗證。
