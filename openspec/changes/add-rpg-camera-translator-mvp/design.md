# Design

## Context

See proposal.md — Why. This is a greenfield project; the repository currently contains only OpenSpec scaffolding. The product is a mobile-first PWA whose only guaranteed input is an iPhone camera pointed at an arbitrary game screen. The dominant constraint is **iPhone Safari**: WebGPU/WASM ML is possible but memory-, thermal-, and latency-limited, and Safari restricts background execution, autoplay audio, and install affordances. The architecture must therefore prove the end-to-end UX with cheap MVP implementations while committing to abstractions that on-device models can satisfy later.

The specs in this change define the behavioral contracts for eight capabilities: `app-shell`, `camera-capture`, `ocr`, `translation`, `dialogue-deduplication`, `speech`, `translation-pipeline`, and `backend-api`. This design covers how they fit together.

## Goals / Non-Goals

**Goals:**
- Deliver a working Phase 1 vertical slice: camera → text → English translation → English speech.
- Establish dependency-inverted contracts for OCR, translation, and speech so implementations swap without touching callers or the pipeline.
- Keep the client fully functional with no backend and no network in Local mode.
- Make the perceived experience feel real-time even though only sampled frames are processed.
- Provide a measurable path (benchmarks, model candidates) toward fully local, offline processing.

**Non-Goals (design-level):**
- No on-device ML models shipped in this change (Phase 5).
- No automatic text-region detection in this change; the user positions a region-of-interest (Phase 3 automates it).
- No game knowledge base, terminology DB, accounts, payments, or persistent server storage.
- No native iOS app.

## Decisions

### D1. Frontend: TypeScript + Vite PWA, native browser APIs
Vite gives fast dev/build and first-class PWA support (`vite-plugin-pwa` for manifest + service worker). We use native `getUserMedia`, `SpeechSynthesis`, Canvas, and Cache/Service Worker APIs directly rather than a heavy framework, keeping dependencies minimal and bundle size small for mobile. A lightweight UI layer (vanilla + small reactive utility, or a minimal framework) is acceptable; business logic must stay framework-agnostic so it is testable in isolation.
- *Alternative considered:* React/Vue full app — rejected for the MVP as unnecessary weight; the UI is a single camera surface with a few controls. Processing logic stays decoupled so a framework can be adopted later without touching it.

### D2. Replaceable stages via dependency inversion
Each stage is an interface consumed by the pipeline orchestrator:
- `OcrService: recognize(region: CapturedRegion) -> { text: string; confidence: number }`
- `TranslationService: translate(japanese: string, context?: RollingContext) -> { english: string }`
- `SpeechService: speak(english: string, opts) / cancel() / getVoices()`
Implementations are selected at composition root (a small factory keyed by mode/config). The orchestrator and UI depend only on interfaces. This is the core architectural commitment — no engine (Qwen, a specific OCR model, Web Speech) may appear in business logic.
- *Alternative considered:* direct calls to concrete services — rejected; it would block the whole local-AI roadmap.

### D3. Camera pipeline: sample, diff, crop, then OCR
Loop: `requestAnimationFrame` preview, but a separate sampling timer (configurable, e.g. ~2–4 fps) draws the region-of-interest to an offscreen canvas. A cheap frame-difference check (downscaled luma hash / mean-absolute-difference) skips submission when the ROI is visually unchanged, so OCR only runs on candidate changes. The ROI is user-positioned in the MVP.
- *Rationale:* OCR/translation are the expensive stages; gating them on visual change is the main lever for latency, CPU, and battery. Frame-diff before OCR complements text-level dedup after OCR.

### D4. Deduplication in two layers
1. **Pre-OCR frame diff** (D3) avoids re-running OCR on a static screen.
2. **Post-OCR text dedup** normalizes text (whitespace + punctuation), compares against a short recent-history buffer with fuzzy matching (e.g. normalized Levenshtein ratio threshold), and enforces a minimum repeat interval before the same line may be spoken again.
- *Rationale:* OCR jitter produces slightly different strings for the same on-screen line; normalization + fuzzy match prevents re-translation/re-speech while genuinely new lines still pass.

### D5. Translation prompt/contract for natural RPG dialogue
For LLM-backed implementations the contract sends an instruction equivalent to: *translate this Japanese RPG dialogue into natural English; preserve character personality, tone, names, and terminology; do not explain; return only the English dialogue.* The `TranslationService` interface accepts optional `RollingContext` (recent lines + known terms). The MVP implementation may use a temporary translation API; the interface is identical for a future local LLM (e.g. quantized Qwen3-4B-Instruct) or a dedicated JA→EN MT model.
- *Rationale:* keeping the prompt/context inside the implementation (not the pipeline) preserves swap-ability.

### D6. Rolling context is optional and bounded
A small ring buffer of the last N translated lines plus an optional term map. The pipeline works when context is empty. No persistence, no full game knowledge base in this change.

### D7. Speech: Web Speech API MVP, queue-managed, English-only
`SpeechService` wraps `SpeechSynthesis`. A single-consumer queue guarantees ordered, non-overlapping playback and drops duplicate consecutive lines. The service exposes enable/disable, replay, rate, and voice selection. Only English is ever spoken. iOS requires a user gesture to unlock audio; the app performs a one-time unlock on first interaction.
- *Trade-off:* Web Speech voice quality/latency varies by device; the interface allows a later local neural TTS swap.

### D8. Optional ASP.NET Core backend
A minimal API (`POST /api/translate`) implementing the same translation contract, used only in Cloud mode. No auth, no DB. Only text crosses the network — never camera frames. The client never hard-depends on it; Local mode has no backend calls at all.
- *Rationale:* keeps the differentiator (no capture card / integration / server required) intact while allowing a higher-quality cloud fallback.

### D9. Privacy modes as a first-class switch
A single mode flag gates all network egress. Local mode: OCR/translation/TTS resolve to on-device (MVP: manual/mock/Web Speech; future: local models) and no fetch to translation endpoints occurs. Cloud mode: shows a disclosure before first remote request. Default to the most private mode that can produce output.

### Model evaluation strategy
On-device models are **not** selected in this change; the design commits to evaluating candidates against iPhone-real constraints (size, RAM, startup, latency, power, JA accuracy, license, offline) before Phase 5. Candidates to benchmark, per stage:

| Stage | Candidate(s) | Inference tech | Approx size | Offline | License | Notes to validate on iPhone |
|-------|-------------|----------------|-------------|---------|---------|------------------------------|
| OCR | PaddleOCR (JP) / manga-ocr / ONNX detector+recognizer | ONNX Runtime Web (WASM/WebGPU) | 10–100+ MB | Yes | Apache/MIT (verify per model) | Game-font & low-res robustness, vertical text, startup time, RAM |
| Translation | Quantized Qwen3-4B-Instruct; dedicated JA→EN MT (e.g. small MT model) | WebGPU (LLM) / WASM (MT) | ~2–3 GB (4B q) vs <100 MB (MT) | Yes | Verify (Qwen license terms) | 4B likely too heavy for Safari RAM — MT model may be the realistic local path |
| TTS | Web Speech (MVP); local neural TTS (e.g. small VITS/Piper-style) | Browser API; WASM/WebGPU | n/a; 10s–100s MB | MVP: OS-dependent | n/a / verify | Latency to first audio, voice naturalness, iOS audio unlock |

Do not select on benchmark accuracy alone; the deliverable of the evaluation is a per-stage recommendation optimized for real-iPhone UX.

### Performance targets (to benchmark, not assumed)
- Frame handling latency < ~500 ms; OCR < ~500 ms; translation < ~1 s; speech starting within ~1–2 s of a new line. These are hypotheses to measure on a recent iPhone; perceived responsiveness (via sampling + dedup) is prioritized over processing every frame.

### Testing strategy
- Unit tests for pure logic: normalization, dedup/fuzzy matching, speech queue ordering, frame-diff gating, mode/egress gating.
- Contract tests: each `OcrService`/`TranslationService`/`SpeechService` implementation verified against a shared contract test suite so swaps stay safe.
- Pipeline integration tests with fake stage implementations covering the end-to-end and deduped-line paths.
- Backend: endpoint tests for the translate contract and the "no camera frames" guarantee.
- Manual device validation on iPhone Safari for camera, install, audio unlock, and latency.

## Risks / Trade-offs

- **On-device LLM (4B) may not fit iPhone Safari RAM/thermal budget** → treat a lightweight dedicated JA→EN MT model as the primary local candidate; keep Cloud mode as fallback; decide via benchmarks.
- **Camera OCR of stylized/retro/low-res game fonts is hard** → MVP uses user-positioned ROI and normalization; frame-diff + fuzzy dedup reduce jitter impact; automatic region detection deferred to Phase 3.
- **iOS audio autoplay restrictions** → one-time user-gesture unlock; expose explicit replay control.
- **Web Speech voice quality/availability varies** → abstraction allows neural TTS later; voice selection exposed where supported.
- **Frame-diff false negatives (missed new line) or false positives (re-processing)** → thresholds are configurable and covered by unit tests; tune during Phase 3.
- **Bundle/model size on mobile networks** → keep MVP dependencies minimal; models are lazy-loaded and cached only in later phases.

## Migration Plan

Greenfield — no data or existing system to migrate. Deployment: static PWA hosting for the frontend; the ASP.NET Core backend deploys independently and is optional. Rollback is trivial (revert static deploy); removing the backend degrades only Cloud mode, never Local mode.

## Open Questions

- Which temporary translation provider backs the MVP `TranslationService` (self-hosted via the ASP.NET backend vs. a direct provider) — deferrable; does not change the contract or task breakdown.
- Exact frame-diff and fuzzy-match thresholds — to be tuned empirically in Phase 3; defaults are sufficient for the MVP.
