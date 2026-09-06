# 維護與安全更新

## 權限分界
可自主：補來源、修錯字/壞連結、加入已重現教訓、修正明顯 schema 名稱錯誤、將長規則抽檔且不改語義；均需備份、diff、read-back。當本次使用者已授權對應更大範圍，就依該授權執行，不重問。
需新授權（除非本次已明確含此動作）：刪除或降低安全/驗收底線、改目標 repo、引入新付費/外部資料傳送、改分享/存取權、部署或刪生產資料。請求前先完成可逆準備並给具体可審差異。不得以「制度要求」擴張權限。
不可自行宣稱：已安裝自動記憶、已切模型、已讀未提供後端、未測即安全。

## 每次修改流程
1. 確認實際根目錄、版本/hash、git 狀態（若存在）。讀當前適用指令。輸出安裝包不是已安裝。
2. **修改前**複製每個既有目標到 `backups/{UTC時間或遞增批次}/{原相對路徑}`，產生 SHA-256。新檔記 create，無舊檔不得捏造備份。若檔案可能含密鑰，先確認資料分類；不得將秘密複製到一般交付備份，敏感原檔不在本制度任務改動範圍。
3. 備份失敗就停止該檔修改；其他獨立安全工作可繼續。只改自己的檔案範圍。禁止覆寫使用者未提交工作。
4. 維持一條規則一個權威位置；入口只路由。改規則時同步更新引用與例子，記錄被取代規則 ID。
5. 用 read-back 比對新檔，檢查相對連結；代理作者不可兼任最後驗收者。高風險另查獨立證據。
6. 更新 `governance/06-LESSONS.md` 與交接狀態；未驗部分保留 NOT_VERIFIED。確保持久保存；有 git 的專案走其既有 review/commit流程，非 git 交付保存檔案與版本。

備份示例（安裝前人工確認根目錄；用環境當前 shell，不把此段當跨平台保證）：
```python
from pathlib import Path
from datetime import datetime, timezone
import hashlib, shutil
root = Path('/ABSOLUTE/CONFIRMED/PROJECT')
target = root / 'CLAUDE.md'
if not root.is_dir():
    raise RuntimeError('根目錄未確認')
if target.exists():
    batch = root / 'backups' / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    batch.mkdir(parents=True, exist_ok=False)
    saved = batch / 'CLAUDE.md'
    shutil.copy2(target, saved)
    assert target.read_bytes() == saved.read_bytes()
    (batch / 'SHA256.txt').write_text(hashlib.sha256(saved.read_bytes()).hexdigest() + '  CLAUDE.md\n')
# 到此只完成備份，尚未覆盖原檔；先保留原規則語義再合併路由。
```

## 踩坑回寫與精簡
格式：`ID｜日期｜觸發輸入/版本｜可觀察失敗｜根因(已證實/假設)｜最小防線｜正反例/測試｜證據路徑｜已更新規則｜狀態`。
不要寫成「以後小心」；例：同一 patent_id 更換 claim 後 label 被保留 → 身份 key 加 claim/citation hash → 以換文仍同 id 的反例驗證。
每累積 10 條未歸納教訓或正文超過 150 行，將原檔先備份，將重複項合成可執行規則、保留 ID 對照；历史移 `governance/archive/`，入口不指向全部歷史。CLAUDE.md 超過 60 行即抽長文，不刪安全約束只為壓字數。
每次確實新增工具或更換執行平台時才更新環境快照；新 session 先快速確認 schema 還有效，不反覆全文掃描。遇矛盾以來源版本、當前 schema、當次授權判定，不以新檔時間自動覆蓋高優先級指令。
