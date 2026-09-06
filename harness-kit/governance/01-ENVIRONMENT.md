# Harness 現況證據（2026-09-05）

## 已證實

- 工作目錄：`/workspace/scratch/8bd7256539ff`；初次檢查包含 upload 與 review-evidence。附件由平台提供於 upload。
- 從工作目錄到 `/` 的適用層级，以及 `/workspace` 內檔案搜尋，未找到 AGENTS.md 或 CLAUDE.md；這不代表使用者其他電腦或 GitHub repository 沒有此檔。
- `git rev-parse --show-toplevel` 失敗，cwd 不是可辨識 Git checkout；不能聲稱已在使用者專案安裝規則。
- `command -v` 與 `type -a` 沒有找到 `claude` 或 `codex`，因此無可報告的本地 CLI 版本。不得把目前聊天平台的工具等同 Claude Code CLI。
- 有可呼叫 GitHub connector。`github_search_installed_repositories_v2(query="3.10")` 結果為空；以 `patent` 搜尋得到下列候選，均未建立與使用者「3.10」的版本關聯。

| 候選 repository | 可見性 | 預設 branch | 搜尋索引 |
|---|---|---|---|
| yuni94520/patent-examiner | public | main | 未索引 |
| yuni94520/Patent-data-cleanse | public | main | 未索引 |
| yuni94520/- | private | main | 未索引 |

- 搜尋空結果或未索引不代表程式碼不存在。後續應根據附件中的專案識別、版本文字與 repository 內容交叉確認；不得直接拿候選 main 取代 3.10。
- 此平台提供 `collaboration.spawn_agent`、`send_message`、`followup_task`、`interrupt_agent`、`list_agents`、`wait_agent`；共有 7 個並行席位，包含主 agent。
- 此平台提供 personal_context search、skills read/list 與 Library 工具能力；工具存在不代表已建立使用者可控制的永久規則記憶或會自動載入本次 CLAUDE.md。
- 使用者要求子 agent 與 fresh-context 審查，已符合本回合 delegation 授權；工具 `fork_turns="none"` 可建立 fresh context。

## 當前工具 schema 公告的模型與 effort（不是未來平台保證）

| model 字串 | 支援 effort |
|---|---|
| gpt-6-astra | low, medium, high, xhigh, max, ultra |
| gpt-5.6-sol | low, medium, high, xhigh, max, ultra |
| gpt-5.6-terra | low, medium, high, xhigh, max, ultra |
| gpt-5.6-luna | low, medium, high, xhigh, max |
| gpt-5.5 | low, medium, high, xhigh |

以上模型均由工具 schema 公告 priority service tier。這是可指定的合法枚舉，不是每個模型均實際試跑的紀錄。完整歷史 fork 繼承模型及 effort，不能 override；要 override 必須 `fork_turns="none"` 或正整數字串。模型 override 亦須使用者或適用規則授權。本回合使用者要求依實際環境指定 model/effort，且允許最高 effort。

## 未確認／不可宣稱

- 未取得 Claude Code 安裝、設定檔或可用 Sonnet/Opus/Haiku 模型 ID；不得填入猜測的 ID 或 effort 參數。
- 「STRA-6」屬使用者稱呼；無工具回傳證明此主對話實際模型、推理強度或內部額度，不能宣稱已切換。
- 未確認 3.10 的 exact repository、branch/tag/commit、實際部署拓樸、部署環境 secret 設定與 public API 曝露範圍。
- 無持續服務或永久讀取規則的證據；Library 保存是交付保存，需將規則檔安裝到未來 session 實際 checkout 並驗證讀取，才有執行效力。

## 重現檢查（不讀取憑證）

1. 記錄 cwd，對 cwd 及父層找 AGENTS.md/CLAUDE.md。
2. `git rev-parse --show-toplevel`；成功才讀 repository metadata。
3. `command -v claude`、`command -v codex`；存在才執行對應 `--version`。
4. 讀當次提供的 agent/tool schema，列合法模型字串及 effort；記錄實際派工成功／失敗，不將 schema 宣告寫成全數已測。
5. 只輸出憑證設定的名稱、所在檔案與是否存在，不輸出其值。
