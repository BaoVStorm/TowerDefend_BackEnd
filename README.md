# TowerDefend_BackEnd

> ⚠️ **ĐÃ ARCHIVE (2026-09-28) — không phát triển tiếp ở repo này.**
>
> Chủ dự án đã chốt backend là **Nakama** và giữ **bản Go**. Bản đang phát triển tiếp:
> **[BaoVStorm/TowerDefend_BackEnd_Go](https://github.com/BaoVStorm/TowerDefend_BackEnd_Go)**.
> Lý do và bằng chứng: `docs/unified/16_BACKEND_NAKAMA_AUDIT.md` §10 trong repo game (BaoVStorm/TowerDefend).
>
> Repo này chỉ giữ lại để tham khảo lịch sử. Lưu ý khi đọc code:
> - `src/main.ts` + `src/modules/*.ts` là bản TS gốc (10 RPC) mà bản Go port 1-1 sang.
> - `src/main.js` là **prototype thứ ba, khác hẳn** — không được `main.ts` import, đăng ký 5 RPC khác, model 1 blob
>   `Profile/MetaSaveData` có ghi `version`. Để nguyên để tham khảo (xem audit 16 §4.7), không phải code đang chạy.
> - Pipeline build (`tsc` CommonJS / rollup) **chưa từng được chứng minh chạy được** trên Nakama (audit 16 §4.6).
> - `node_modules/` từng bị commit nhầm vì `.gitignore` mã hoá UTF-16; đã gỡ khỏi index (Task 9.2). Chạy
>   `npm install` để có lại.
