# Repository 與附件版本識別

檢查日期：2026-09-05；read-only GitHub connector。

## 明確結論

3.10 審查基準應使用本次附件 `upload/已貼上文字 (1)(5).txt`，第 6 行標題為 `專利相似度比對 v3.10.0`，第 752 行 SCORING_VERSION 為 `v3.10.0-synonym-aware-hybrid-retrieval`。

可存取的候選 `yuni94520/patent-examiner` 外觀開頭相似，但 main 是 v3.8.2；無證據證明附件已推送該 repo，不能將候選 main 宣稱為已審查 3.10，亦不能把附件認定為某遠端 commit。

## GitHub 取證

- main commit/tree：`3d487f35de30223dab27721e0c648adef6e57dd8`。
- [index.html](https://github.com/yuni94520/patent-examiner/blob/3d487f35de30223dab27721e0c648adef6e57dd8/index.html) 第 6 行：`<title>專利相似度比對 v3.8.2</title>`；blob SHA `488bfa3c82929907672315baa17e879f7937f2eb`。
- [README.md](https://github.com/yuni94520/patent-examiner/blob/3d487f35de30223dab27721e0c648adef6e57dd8/README.md) 只有 `# patent-examiner`，無 authentication docs。
- recursive tree 回傳 `truncated:false`。共 README.md、SPEC.md、VOCAB_EXPANSION_DRAFT.md、backend-tests/core_engine.js、backend-tests/test_core_engine.js、index.html、vocab.js、vocal.md 與 backend-tests 目錄；無 AGENTS.md 或 CLAUDE.md。
- branches 回傳 main 一筆。
- tags GET endpoint 被 GitHub connector URL allowlist 拒絕；不可將此結果當成「没有 tags」。

## 未確認及後續判準

- 未確認實際部署、使用者指定 repository、3.10 commit SHA、是否另有 API backend。
- 若要遠端安裝制度或修改程式：先由使用者或其他明確來源確認 repo；再 pin branch/commit，核對版本標記及功能，不以 repository 名稱相似代替版本確認。
- 目前只建立本地交付與研究證據，未修改任何 remote。
