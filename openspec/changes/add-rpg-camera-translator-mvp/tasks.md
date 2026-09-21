# Tasks

## 1. Project setup

- [x] 1.1 Scaffold a TypeScript + Vite frontend project (mobile-first) and verify `npm run dev` serves a blank app in the browser
- [x] 1.2 Add and configure `vite-plugin-pwa` with a web app manifest (name, icons, theme, standalone display) and verify the build emits a manifest and service worker
- [x] 1.3 Set up a unit test runner (e.g. Vitest) and verify a sample test runs with `npm test`
- [x] 1.4 Create the folder structure separating framework-agnostic core logic (`core/`), service implementations (`services/`), and UI, and verify core has no UI/framework imports

## 2. Service contracts (dependency inversion)

- [x] 2.1 Define the `OcrService` interface (`recognize(region) -> { text, confidence }`) and verify it compiles with no engine dependency
- [x] 2.2 Define the `TranslationService` interface (`translate(japanese, context?) -> { english }`) and verify it compiles with no engine dependency
- [x] 2.3 Define the `SpeechService` interface (speak/cancel/getVoices, enable/disable, rate, voice) and verify it compiles with no engine dependency
- [x] 2.4 Define shared types (`CapturedRegion`, `RollingContext`, processing state) and a composition-root factory selecting implementations by mode/config; verify a unit test resolves each service via the factory

## 3. Text normalization and deduplication

- [x] 3.1 Implement text normalization (whitespace + punctuation) and verify unit tests: equivalent readings normalize equal
- [x] 3.2 Implement fuzzy duplicate matching over a recent-history buffer with a configurable threshold and verify unit tests: minor OCR variation is a duplicate, a new line is not
- [x] 3.3 Implement minimum-repeat-interval gating and verify a unit test suppresses a re-detected line within the interval

## 4. MVP OCR implementation

- [x] 4.1 Implement an MVP `OcrService` using manual/mock text input that satisfies the contract, and verify a unit test returns text + confidence
- [x] 4.2 Wire OCR output through normalization and verify a unit test shows normalized text reaches the caller

## 5. MVP translation implementation

- [x] 5.1 Implement an MVP `TranslationService` (temporary provider or backend-backed) returning English-only dialogue, and verify a contract test: response contains no Japanese or explanations
- [x] 5.2 Implement an optional bounded rolling-context buffer and verify translation succeeds both with and without context

## 6. MVP speech implementation

- [x] 6.1 Implement `SpeechService` over the Web Speech API (English voice), with a one-time iOS audio-unlock on first user gesture, and verify speech plays on tap
- [x] 6.2 Implement the single-consumer speech queue (ordered, non-overlapping, drops duplicate consecutive lines) and verify unit tests for ordering and dedup
- [x] 6.3 Implement enable/disable, replay, rate, and voice selection and verify each control changes observable behavior

## 7. Camera capture

- [x] 7.1 Implement `getUserMedia()` rear-camera preview with graceful permission-denied handling and verify both grant and deny paths render correctly
- [x] 7.2 Implement a configurable frame-sampling timer drawing the ROI to an offscreen canvas and verify sampling never exceeds the configured rate while preview stays smooth
- [x] 7.3 Implement pre-OCR frame-difference gating and verify a unit test skips submission for an unchanged ROI
- [x] 7.4 Implement an adjustable region-of-interest with a sensible default and verify the OCR input contains only the selected region

## 8. Pipeline orchestration

- [x] 8.1 Implement the orchestrator wiring capture → OCR → dedup → translation → speech using only interfaces, and verify an integration test with fake services runs the end-to-end path
- [x] 8.2 Verify the deduped-line path short-circuits (no re-translate/re-speak) via an integration test
- [x] 8.3 Expose processing state (idle/recognizing/translating/speaking) and verify the UI can read state transitions in a test

## 9. UI

- [x] 9.1 Build the camera-forward layout showing preview, ROI, Japanese text, English translation, processing indicator, and controls; verify it renders in portrait and landscape without overflow
- [x] 9.2 Wire controls (speech toggle, replay, rate, voice, settings) to the services and verify each control affects behavior in the running app

## 10. Privacy modes

- [x] 10.1 Implement the Local/Cloud mode switch gating all network egress, defaulting to the most private working mode, and verify a test asserts no fetch occurs in Local mode
- [x] 10.2 Implement the Cloud-mode disclosure shown before the first remote request and verify it appears prior to any network call

## 11. Optional backend

- [x] 11.1 Scaffold an ASP.NET Core minimal API with `POST /api/translate` implementing the translation contract (English-only, no auth/DB) and verify an endpoint test returns English for Japanese input
- [x] 11.2 Verify the client operates fully in Local mode with the backend absent (integration test / manual check) and that only text — never camera frames — is sent in Cloud mode

## 12. End-to-end validation

- [x] 12.1 Run the full unit and integration suite and verify all tests pass with `npm test`
- [ ] 12.2 Manually validate on iPhone Safari: install to home screen, grant camera, point at a Japanese RPG line, see Japanese + English, hear English spoken, and confirm the same line is not re-spoken while on screen
