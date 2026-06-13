# Harness Engineering (walkinglabs/learn-harness-engineering) — đọc & áp dụng cho kit

> **Loại:** Deep-research resource #1 cho giai đoạn improve.
> **Ngày:** 2026-06-13 · **Nguồn chính:** https://github.com/walkinglabs/learn-harness-engineering (branch main)
> **Mục tiêu:** hiểu "harness engineering" và rút pattern áp dụng để cải thiện `claudekit-engineer` (kit skills/hooks/agents/rules trên Claude Code) + eval harness Tier 0/1.

## 1. "Harness engineering" là gì

Discipline thiết kế **môi trường quanh model** để nó cho kết quả tin cậy — *không* phải prompt tuning. Định nghĩa course:

> *"building a complete working environment around the model so it produces reliable results. It's not about writing better prompts. It's about designing the system the model operates inside."*

Nguồn gốc: OpenAI *"Harness engineering: leveraging Codex in an agent-first world"* (thí nghiệm 5 tháng, ship beta ~1M LOC, 0 dòng người viết tay); Anthropic có bài song song về harness cho long-running agents. walkinglabs cũng maintain `awesome-harness-engineering`.

**→ Kit `claudekit-engineer` chính là một harness.** Resource này cho khung lý thuyết + công cụ chấm điểm để đánh giá/cải thiện đúng thứ đang làm.

**5 subsystem:** Instructions · State · Verification · Scope · Lifecycle.

## 2. Curriculum

12 lectures (L01–L12) + 6 projects (capstone Electron knowledge-base) + resources 14 ngôn ngữ. Artifact harness chuẩn: `AGENTS.md`/`CLAUDE.md`, `feature_list.json`, `progress.md`, `init.sh`, `session-handoff.md`. Lectures đáng chú ý: L08 (feature-list là primitive), L09 (đừng tuyên bố thắng sớm), L10 (e2e testing đổi kết quả), L11 (observability thuộc harness), L12 (clean state mỗi phiên).

*Nguồn:* `docs/en/lectures/lecture-01-why-capable-agents-still-fail` … `lecture-12-why-every-session-must-leave-a-clean-state`; `docs/en/projects/project-01…06`.

## 3. Skill `harness-creator` (MIT) — tài sản dùng/port được

`skills/harness-creator/`: create / **audit** / **benchmark** harness.

### Rubric `scoreHarness()` (mỗi subsystem 5 check, 25 → /100, min 70, bottleneck = thấp nhất)

| Subsystem | 5 check |
|---|---|
| **Instructions** | có AGENTS.md/CLAUDE.md · "Startup Workflow"/"Before writing code" · "Definition of Done" · verify discoverable (`./init.sh`/test/verify) · route tới state (feature_list.json/progress.md) |
| **State** | có feature_list.json · JSON hợp lệ (id/name/description/status) · có progress.md · progress hỗ trợ restart ("Current State"/"What"/"Next") · handoff bắt blockers/files/next |
| **Verification** | có init.sh · **`set -e`** fail-fast · test command documented · static/build check · ghi **Evidence** (command + output) |
| **Scope** | "one-feature-at-a-time" · dependency trong feature_list · status field · "Stay in scope" · "Definition of Done" gate |
| **Lifecycle** | init.sh startup · "End of Session" procedure · session-handoff.md · restart markers (Last Updated/Current Objective/Next Step) · clean restart path |

Công thức: per-subsystem `max(1, round(passed/5*5))`; overall `round(sum/25*100)`.

### `run-benchmark.mjs` — *structural benchmark, KHÔNG phải LLM judge*
Chấm (a) harness score + (b) **eval coverage**: đòi ≥10 eval case trải các nhóm (minimal creation, session continuity, assessment, verification, memory taxonomy, tool safety, multi-agent), mỗi case có `prompt`/`expected_output`/`expectations[]` (≥3 check). Ngưỡng: harness <70 → sửa subsystem yếu; eval <80 → mở rộng coverage; ≥85/90 → proceed.

### Templates
`feature-list.schema.json` (id `feat-\d+`, name, description, status `not-started|in-progress|blocked|done`, dependencies[], evidence) · `AGENTS.md` (Startup Workflow / Working Rules / Required Artifacts / Definition of Done / End of Session) · `init.sh` (`set -e`) · `progress.md` · `session-handoff.md`.

*Nguồn:* `skills/harness-creator/{SKILL.md, scripts/lib/harness-utils.mjs, scripts/run-benchmark.mjs, scripts/validate-harness.mjs, templates/*}`.

## 4. Gap analysis vs `claudekit-engineer`

| Subsystem | Kit hiện có | Gap |
|---|---|---|
| Instructions | `rules/CLAUDE.md` + rules/* (mạnh) | "Definition of Done"/"Startup Workflow" chưa chuẩn hoá tường minh |
| **State** | plans/ + plan format + `session-state.cjs` | **Thiếu `feature_list.json`** máy-đọc-được (status+deps+evidence) |
| **Verification** | eval/ (mới) + validators + `ck:test` | Thiếu **1 entrypoint `init.sh`/`npm run verify`** + quy ước Evidence |
| Scope | skills · `scout-block` · `workflow-artifact-gate` | Thiếu dependency-tracking + "one-feature" tường minh |
| **Lifecycle** | `ck:watzup` · `session-init` · `ck:retro` | Thiếu artifact chuẩn `session-handoff.md` |

→ Kit mạnh Instructions/Lifecycle; **yếu State (primitive máy-đọc) + Verification entrypoint** — đúng 2 chỗ harness engineering nhấn mạnh nhất.

## 5. Khuyến nghị (relevance-rated, eval-gated)

- **R1 🟢** Port `scoreHarness()` thành **kit self-audit** (`eval/audit_harness.py`) — điểm sức khỏe harness khách quan, lặp lại. *(Instrumentation: không tự đổi eval task score.)*
- **R2 🟢** Thêm primitive **State/Verification** (feature_list + verification-evidence discipline) như **rule shipped** → đổi hành vi Claude, đo A/B được.
- **R3 🟢** 1 verify entrypoint (`init.sh`/`npm run verify`).
- **R4 🟢** Áp chuẩn **eval-coverage** của `run-benchmark.mjs` vào `eval/` (đang chỉ có 2 task).
- **R5 🟡** Port `harness-creator` thành `ck:` skill (product capability) — optional.
- **R6 ✅** L10/L11 **củng cố** lựa chọn execution-graded + observability của eval harness ta vừa dựng.

## 6. Caveat
- **Fetch được (raw GitHub):** README, CLAUDE.md, tree `skills/harness-creator` + `docs/en/lectures`, SKILL.md, `harness-utils.mjs` (rubric đầy đủ), `run-benchmark.mjs`, templates.
- **Chưa đọc full:** `api.github.com` tree (403, lấy cây qua HTML); toàn văn 12 lectures/projects (mới README + slug + concept); thư mục `evals/` (chưa liệt kê case). Bài OpenAI/Anthropic là secondary qua README + search.

**Sources:** [OpenAI — Harness engineering](https://openai.com/index/harness-engineering/) · [walkinglabs/awesome-harness-engineering](https://github.com/walkinglabs/awesome-harness-engineering) · [Milvus — Harness Engineering for AI Agents](https://milvus.io/blog/harness-engineering-ai-agents.md) · repo files tại `raw.githubusercontent.com/walkinglabs/learn-harness-engineering/main/...`
