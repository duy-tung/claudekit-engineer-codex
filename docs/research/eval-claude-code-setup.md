# Eval Claude Code setup — giải pháp tốt nhất hiện tại (2025–2026)

> **Loại tài liệu:** Báo cáo deep-research (fan-out 5 angle + verify chéo).
> **Ngày:** 2026-06-13
> **Câu hỏi:** Đâu là giải pháp tốt nhất hiện tại để *đánh giá (eval)* một **setup/cấu hình Claude Code** (skills/hooks/agents/rules) — nhằm A/B kiểm chứng xem một thay đổi cấu hình có **thực sự cải thiện đầu ra** của agent trên **task software-engineering thật** (đo outcome end-to-end), trước khi bắt tay vào improve?
> **Ràng buộc người dùng:** cân bằng *công cụ có sẵn* + *phương pháp luận*; ưu tiên **local / open-source**, tránh khóa SaaS; đo **end-to-end trên task thật**.
> **Bối cảnh:** repo `claudekit-engineer` (~43 skills + 11 agents + hooks). Một eval harness 3-tầng cũ (bun/TS) vừa bị gỡ; skill `skill-creator` còn giữ `run_eval.py` + `eval-schemas`.

---

## TL;DR — Khuyến nghị

**Đừng khôi phục harness bun/TS cũ.** Tier 2 của nó (`claude -p` rồi check chuỗi con "acknowledged") là **smoke test**: không đo outcome, không dùng `--output-format json`, còn cấm chạy tool (`Do not execute any tools`).

**Giải pháp tốt nhất = HYBRID, nghiêng build-new, local-first:**

- Một **task-suite SWE nhỏ kiểu SWE-bench** (checkout repo fixture → agent sửa → **chạy test thật**) làm **gate chính bằng execution-based grading**.
- Lái qua **`claude -p --output-format json`** để **A/B từng thay đổi config** (đổi đúng 1 biến mỗi lần).
- Metric **khách quan**: test pass / pass^k, `num_turns`, `total_cost_usd`, `duration_ms`.
- Chạy **nhiều lần + paired test** (McNemar / bootstrap) để xử lý tính ngẫu nhiên.
- **LLM-judge (pointwise/binary, model khác họ)** chỉ cho phần *non-functional*.
- Giữ **validator Python** đang sống làm **Tier 0 tĩnh**.
- Orchestration: tự viết runner mỏng, hoặc bọc bằng **Inspect (MIT)** / **promptfoo (MIT)**; **tránh Braintrust/LangSmith (SaaS)**.

Cơ sở hội tụ: Anthropic (chính chủ Claude Code) khuyên *"đánh giá harness + model cùng nhau, chấm **outcome** chứ không chấm đường đi"* — đúng mục tiêu đo end-to-end.

---

## 1. Phát hiện then chốt — Claude Code đã có sẵn primitives để eval

Headless mode cho ra **record metrics máy-đọc-được** mỗi lần chạy (nguồn fetch trực tiếp từ `code.claude.com`):

`claude -p "<task>" --output-format json` → 1 object JSON:

| Field | Metric |
|---|---|
| `subtype` (`success` / `error_max_turns` / `error_max_budget_usd` / `error_during_execution`) | pass/fail, phát hiện non-termination |
| `result` (chỉ có khi `success`) | output cuối để chấm |
| `is_error`, `stop_reason` (`refusal`…) | lỗi / từ chối |
| `num_turns` | hiệu quả (số vòng agentic) |
| `total_cost_usd`, `usage{input/output/cache_*}`, `modelUsage[*]` | chi phí/token (⚠️ **ước lượng client-side**, không phải billing thật) |
| `duration_ms` | latency |

**Vặn từng biến config để A/B "trước/sau" sạch** (giữ nguyên phần còn lại):

- `--settings <json>` + `--setting-sources user,project,local` — override/pin config theo run
- `--append-system-prompt` / `--system-prompt-file` — đổi rule/prompt
- `--allowedTools` / `--tools "Bash,Edit,Read"` — đổi bộ tool
- `--agents <json>` — test cấu hình subagent
- `--mcp-config` + `--strict-mcp-config` — cô lập MCP
- `--bare` — baseline sạch (bỏ auto-load hooks/skills/CLAUDE.md) để đo đúng tác động 1 thay đổi
- `--max-turns`, `--max-budget-usd` — chặn trần chi phí mỗi run
- `--output-format stream-json` + `--include-hook-events` — bắt **toàn bộ transcript + tool calls**

**Hooks chạy trong tiến trình của bạn, không tốn context của agent** → gắn grader vào hook `Stop` / `PostToolUse` / `SubagentStop` để chấm + log tool-selection deterministic. Agent SDK lưu **transcript JSONL trên đĩa** để parse offline.

*Nguồn (fetch trực tiếp):* `code.claude.com/docs/en/cli-reference`, `/agent-sdk/agent-loop`, `/agent-sdk/cost-tracking`, `/agent-sdk/overview`; `github.com/anthropics/claude-agent-sdk-python`.

---

## 2. Bốn trụ cột phương pháp (hội tụ từ nhiều nguồn độc lập)

### ① Chấm OUTCOME, không chấm trajectory
Anthropic *Demystifying evals for AI agents* (~01/2026): *"Đừng chấm con đường agent đi, chấm thứ nó tạo ra"* — đừng ép thứ tự tool cố định. Ví dụ coding của họ chấm bằng **unit test**. Cookbook `building_evals.ipynb` (fetch trực tiếp): eval = input + output + **golden answer** + score; **tách generation khỏi evaluation** vì *"agent có xu hướng tự khen công việc của mình"*.
*Nguồn:* `anthropic.com/engineering/demystifying-evals-for-ai-agents` (page 403 — secondhand, corroborate bởi cookbook đã fetch + `github.com/TribeAI/claude-evals`); `github.com/anthropics/claude-cookbooks` `misc/building_evals.ipynb`.

### ② Ưu tiên execution-based (test pass) hơn LLM-judge khi có ground truth
SWE-bench chấm bằng 2 bất biến: **`FAIL_TO_PASS`** (test của bug giờ pass) + **`PASS_TO_PASS`** (test cũ vẫn pass — chống regression). CodeJudgeBench: với code, **độ chính xác bằng test là chuẩn vàng deterministic**; chỉ để LLM-judge cho phần test không bắt được (readability, conciseness).
*Nguồn:* `github.com/SWE-bench/SWE-bench`; CodeJudgeBench arXiv:2507.10535.

### ③ Agent ngẫu nhiên → chạy nhiều lần + thống kê paired
Một run đơn gây hiểu lầm. Chạy mỗi task **N lần**; phân biệt **pass@k** (≥1 thành công trong k) vs **pass^k** (cả k đều thành công) — agent 70%/task cho pass@3≈97% nhưng pass^3≈34% → gate nên nhìn pass^k. Dùng **paired design** (chạy cả A và B trên cùng task — giảm variance "miễn phí"); test ý nghĩa bằng **McNemar** (pass/fail) hoặc **bootstrap CI** (~10k resamples). Anthropic: resample nhiều đáp án + trung bình giảm ~2/3 variance; SE phân cụm có thể >3× SE ngây thơ. **Không có số task cố định** — làm power analysis; khởi đầu thực dụng **20–30 task** cho ca quan trọng, mở rộng **100–200**.
*Nguồn:* Anthropic *"Adding Error Bars to Evals"* arXiv:2411.00640 (+ blog `anthropic.com/research/statistical-approach-to-model-evals`); pass@k (HumanEval/Chen et al.); Hamel Husain `hamel.dev/blog/posts/evals-faq`.

### ④ Nếu phải dùng LLM-judge — thiết kế để giảm bias
- **Pointwise/binary** cho CI-gate & monitoring (robust hơn với distractor: ~9% lật vs ~35% ở pairwise); **pairwise** cho xếp hạng/chọn model.
- Bias đã ghi nhận → mitigation: **position bias** (swap thứ tự, chỉ tính thắng khi nhất quán 2 chiều); **verbosity** (length-control + rubric); **self-preference** (~+10% với output của chính mình → **dùng model khác họ làm judge**); **stochastic** (multi-sample + majority vote).
- **Panel of LLM judges (PoLL)**: nhiều model nhỏ đa dạng → tương quan với người tốt hơn 1 GPT-4 mà rẻ hơn >7×. Dùng rubric + reference-guided + cho judge xuất reasoning + có nhãn "Unknown".
*Nguồn:* MT-Bench arXiv:2306.05685; *"Pairwise or Pointwise?"* arXiv:2504.14716; self-preference arXiv:2404.13076; PoLL arXiv:2404.18796; G-Eval arXiv:2303.16634.

---

## 3. Bối cảnh công cụ (local-first vs SaaS)

### Framework eval (lớp orchestration/report)

| Tool | License / Local | Hợp agentic+coding | LLM-judge | Active 25–26 |
|---|---|---|---|---|
| **Inspect** (UK AISI) | **MIT**, local + Docker sandbox | mạnh (Solver/Tool/multi-turn) | ✅ | ✅ |
| **promptfoo** | **MIT**, 100% local; có provider Claude Agent SDK | ✅ | ✅ | ✅ (rất active, ~22k★) |
| **DeepEval** | **Apache-2.0**, local | ✅ (Task Completion, Tool Correctness) | ✅ G-Eval | ✅ |
| **Langfuse** (self-host) | **MIT core**, Docker+Postgres | observability+eval | ✅ | ✅ |
| **Arize Phoenix** (self-host) | ELv2, free self-host | ✅ | ✅ | ✅ |
| **Braintrust / LangSmith** | **SaaS** (không self-host) | ✅ | ✅ | ✅ |

*Nguồn:* `github.com/UKGovernmentBEIS/inspect_ai`, `github.com/promptfoo/promptfoo`, `pypi.org/project/deepeval`, `langfuse.com/self-hosting`, `github.com/Arize-ai/phoenix`.

### Harness benchmark/task (mẫu để bắt chước, KHÔNG phải để "đậu điểm")

| Benchmark | Cách chấm | Local/OSS | Eval agent (BYO)? |
|---|---|---|---|
| **SWE-bench** (+Verified/Lite) | apply patch → run repo tests | MIT, Docker (~120GB) | ✅ bạn cấp predictions |
| **Terminal-Bench** | test script pass/fail trong container | OSS | ✅ `tb run --agent ... --model ...` |
| **Aider polyglot** | chạy unit test (2 lượt, có feedback) | OSS, Docker | ✅ (model + harness Aider) |
| **SWE-smith** | **tự sinh** task kiểu SWE-bench cho repo Python | OSS, Docker | công cụ tạo golden tasks |
| **Commit0 / LiveCodeBench / RepoBench** | test/lint/type-check; completion | OSS | model chủ yếu |

→ Đáng mượn nhất cho mục tiêu này: **terminal-bench** (BYO-agent) và **SWE-smith** (tự sinh task). Layout task của terminal-bench `(instruction, tests/, oracle solution)` là template sạch nhất để copy.
*Nguồn:* `github.com/SWE-bench/SWE-bench`, `tbench.ai`, `aider.chat/docs/leaderboards`, `github.com/SWE-bench/SWE-smith`, `github.com/livecodebench/livecodebench`.

---

## 4. Khôi phục / Build mới / Hybrid → kiến trúc đề xuất cho repo này

**Quyết định: Hybrid, nghiêng build-new.** Bỏ Tier 2/3 cũ (nông). Giữ tinh thần Tier 1 cũ (validator) vì nó vẫn sống. Tận dụng eval scaffold còn sót trong skill `skill-creator` (`run_eval.py` + `eval-schemas.md`) làm khởi điểm lớp schema/judge.

```
Tier 0 — Static  (~$0, <5s, mỗi commit)
  validate-skill-frontmatter.py  +  validate-skill-crossrefs.py   (đã có sẵn)
  → fail nhanh khi frontmatter/cross-ref hỏng

Tier 1 — Task-suite, EXECUTION-GRADED   (gate chính, đo end-to-end)
  • N golden SWE task (mỗi task = repo fixture pin commit, trong git worktree/Docker)
      layout: { prompt, tests/ (FAIL_TO_PASS + PASS_TO_PASS), oracle }
  • runner: claude -p "<task>" --output-format json
      A (baseline) vs B (sau cải tiến) — đổi đúng 1 biến qua --settings / --append-system-prompt / --bare
  • chấm: chạy tests/ thật → pass/fail; thu num_turns, total_cost_usd, duration_ms từ JSON
  • M lần / task, PAIRED A/B; báo pass-rate + pass^k + mean(turns, cost, latency)
  • significance: McNemar (pass/fail) hoặc bootstrap CI; gate regression khi B < A có ý nghĩa

Tier 2 — LLM-judge  (TÙY CHỌN, chỉ cho non-functional)
  • pointwise/binary, rubric, model KHÁC HỌ (giảm self-preference)
  • multi-sample + majority vote; chỉ chấm thứ test không bắt được
```

- **Orchestration:** viết runner mỏng quanh `claude -p` (hợp phong cách bun/TS sẵn có; grading = chạy test repo của bạn — generic tool không làm sẵn). Muốn dashboard/report không SaaS → bọc bằng **Inspect** hoặc **promptfoo** (có provider Claude Agent SDK).
- **Blueprint tham khảo gần nhất:** `github.com/TribeAI/claude-evals` (community) — hiện thực đúng pattern "Demystifying evals": graders deterministic + LLM-judge rubric + hook `PreToolUse/PostToolUse/SubagentStop` chấm hành vi agentic + cost guardrails + phân loại regression + GitHub Actions.
- **Gate increment:** mỗi cải tiến → 1 commit trên branch → chạy Tier 0→1 (→2 nếu cần) trước/sau → chỉ merge khi Tier 1 không tụt có ý nghĩa.

---

## 5. Độ tin cậy & caveats

- **Cao (fetch nguồn gốc):** flags/JSON Claude Code (`code.claude.com`), harness SWE-bench, license Inspect/promptfoo/DeepEval, cookbook Anthropic, MT-Bench/G-Eval/PoLL/Arena-Hard/self-preference.
- **Thấp hơn / gắn cờ:**
  - `anthropic.com/engineering` bị **HTTP 403** → các trích từ *"Demystifying evals…"* là **secondhand** (nhưng khớp cookbook đã fetch + TribeAI).
  - **WebFetch bị chặn 403** trong angle methodology + judge → nhiều số rút từ **search-summary**, cần verify lại decimals (vd 66%/85% MT-Bench, ~35%/9% flip-rate) trước khi trích xuất bản.
  - **Một số arXiv "26xx / 2512 / 2601"** là **future-dated, chưa mở được** → coi là *lead*, không phải citation chắc. Các nguồn kinh điển dùng trong báo cáo (2306.05685, 2303.16634, 2406.11939, 2404.18796, 2404.13076, 2411.00640) là real.
  - `total_cost_usd` là **ước lượng client-side**, không phải billing thật.
  - Điểm leaderboard **biến động** theo thời gian; SWE-bench Multimodal số task không nhất quán giữa nguồn.

---

## Nguồn chính (đã verify mức fetch trực tiếp = ✅, secondhand/snippet = ⚠️)

**Claude Code / Agent SDK**
- ✅ `code.claude.com/docs/en/cli-reference`
- ✅ `code.claude.com/docs/en/agent-sdk/agent-loop`, `/cost-tracking`, `/overview`
- ✅ `github.com/anthropics/claude-agent-sdk-python`
- ✅ `github.com/anthropics/claude-cookbooks` — `misc/building_evals.ipynb`, `patterns/agents/evaluator_optimizer.ipynb`
- ⚠️ `anthropic.com/engineering/demystifying-evals-for-ai-agents` (403, secondhand)
- ⚠️ `github.com/TribeAI/claude-evals` (community blueprint)

**Frameworks**
- ✅ `github.com/UKGovernmentBEIS/inspect_ai` (MIT) · `github.com/promptfoo/promptfoo` (MIT) · `pypi.org/project/deepeval` (Apache-2.0)
- ✅ `langfuse.com/self-hosting` (MIT core) · `github.com/Arize-ai/phoenix` (ELv2)

**Benchmarks / task harness**
- ✅ `github.com/SWE-bench/SWE-bench` · `github.com/SWE-bench/SWE-smith`
- ✅ `github.com/livecodebench/livecodebench` · `aider.chat/docs/leaderboards`
- ⚠️ `tbench.ai` (403, snippet) · `scale.com/blog/swe-bench-pro` · `openai.com/index/swe-lancer`

**Methodology (judge + thống kê)**
- ✅ MT-Bench/Chatbot Arena arXiv:2306.05685 · G-Eval arXiv:2303.16634 · Arena-Hard arXiv:2406.11939
- ✅ PoLL arXiv:2404.18796 · self-preference arXiv:2404.13076 · "Pairwise or Pointwise?" arXiv:2504.14716 · CodeJudgeBench arXiv:2507.10535
- ✅ Anthropic "Adding Error Bars to Evals" arXiv:2411.00640
- ✅ Hamel Husain `hamel.dev/blog/posts/evals-faq` · Eugene Yan `eugeneyan.com/writing/llm-evaluators` · EvidentlyAI `evidentlyai.com/llm-guide`
- ⚠️ arXiv 2510.27106, 2507.21504 (chưa fetch full) và các ID "26xx/2512/2601" (future-dated, unverified)

---

## Postscript — kết quả thực nghiệm khi CHẠY harness này trên kit (2026-06-13)

Đã dựng harness (`eval/`) và thử A/B một rule "harness-discipline" (verify-before-done). Kết quả:

- **Harness chạy đúng end-to-end** với `claude -p` thật: ~20–95s/run, 5–7 turns, sửa file, chấm bằng test thật.
- **Chính eval bắt 2 lỗi đo:** (1) `--bare` khiến headless bỏ qua auth → "Not logged in" (floor giả); (2) task có test **trong fixture** ⇒ agent **hill-climb** chính bộ test đó ⇒ ceiling.
- **4/4 task ceiling** — baseline solve 8/8 mọi lần: `string-utils-multi`, `calc-engine` (đa-file, recursive-descent), `discount-refactor`, và `roman-hidden` (**kiểu SWE-bench, giấu bộ test chấm**). Opus suy luận đúng + tự verify trên mọi task đủ nhỏ để dựng ở đây.
- **Kết luận:** một rule hành vi tinh tế **không có headroom đo được trên micro-task**. Muốn đo loại rule này cần task **khó/dài/đa-file thật (quy mô SWE-bench)** nơi model base fail ở tỉ lệ thực — đầu tư lớn.
- **Hệ quả chiến lược cho việc improve kit:** ưu tiên cải tiến có giá trị **hiển nhiên/cấu trúc** (capability, sửa thứ hỏng, discoverability — vd R3 primitives, R5 `ck:harness`) hơn là "nudge" hành vi tinh tế vốn không thể kiểm chứng rẻ. Dành A/B cho thay đổi đủ lớn để phát hiện, trên task khó, với n đủ + power analysis.
- **Tài sản để lại:** eval harness (Tier 0/1 + audit + coverage + hidden-tests), bài học `--bare`/headroom/hill-climbing, và flow "đo candidate trước khi ship" (`eval/candidates/`).

