# Proposal

## Why

People playing Japanese RPGs on TVs, monitors, handhelds, and retro/modern consoles frequently cannot read the dialogue and have no practical way to extract the game's text — there is no API, capture card, emulator hook, or mod available for most of these games. The only universally available input is a camera pointed at the screen. This change establishes a mobile-first PWA that lets a user point an iPhone at any Japanese RPG screen and get a natural English translation displayed and spoken aloud, with an architecture that can evolve toward fully local, privacy-preserving, offline processing.

This first change delivers the **Phase 1 MVP vertical slice** (camera → text → translation → English speech) on top of replaceable processing stages, so later phases can swap in on-device OCR, local translation models, and neural TTS without reworking the application.

## What Changes

- Introduce a mobile-first, installable PWA (TypeScript + Vite) whose primary surface is a live camera preview with an adjustable region-of-interest.
- Provide camera access via `getUserMedia()` with a frame-sampling loop (not per-frame OCR) tuned for latency, CPU/GPU, and battery.
- Define an **OCR abstraction** with a swappable MVP implementation (manual/mock text entry or a temporary provider) so real Japanese OCR can be dropped in later.
- Define a **translation abstraction** (JA→EN) with a swappable MVP implementation (temporary translation API), designed to preserve names, terminology, tone, and personality, and to return only English dialogue.
- Add **dialogue deduplication** based on normalized OCR output so unchanged text is not re-OCR'd, re-translated, or re-spoken.
- Define a **speech abstraction** with a Web Speech API (`SpeechSynthesis`) MVP that speaks **only English**, with enable/disable, replay, rate, and voice selection.
- Add a **pipeline orchestrator** wiring the stages together with a processing indicator and a speech queue.
- Add an **optional ASP.NET Core backend** that provides a cloud translation fallback; the core experience must not require it.
- Establish explicit **Local vs Cloud privacy modes** — camera-derived data must never leave the device silently.

Non-goals for this change: game knowledge base, character/terminology database, on-device ML models, native iOS app, accounts/payments/persistent databases.

## Capabilities

### New Capabilities
- `app-shell`: Installable mobile-first PWA shell, offline app caching, camera-forward layout (portrait/landscape), settings, and the Local/Cloud privacy mode switch.
- `camera-capture`: `getUserMedia()` camera preview, frame sampling strategy, and an adjustable region-of-interest / crop area feeding downstream stages.
- `ocr`: OCR service interface for turning a captured region into Japanese text, with an MVP implementation and normalization hooks; implementation is replaceable without touching callers.
- `translation`: JA→EN translation service interface with a rolling-context hook, MVP implementation, and rules that preserve names/terminology/tone and return only English.
- `dialogue-deduplication`: Normalization and matching of recognized dialogue lines to suppress redundant OCR, translation, and speech.
- `speech`: English text-to-speech service interface with a Web Speech API MVP, plus enable/disable, replay, rate, and voice controls.
- `translation-pipeline`: Orchestration that connects capture → OCR → dedup → translation → speech, exposing processing state and a speech queue.
- `backend-api`: Optional ASP.NET Core service exposing a translation fallback endpoint, kept fully optional to the client.

### Modified Capabilities
<!-- None. This is a greenfield project with no existing specs. -->

## Impact

- New frontend project: TypeScript + Vite PWA (camera, pipeline, service abstractions, UI, service worker/manifest).
- New optional backend project: ASP.NET Core minimal API for translation fallback.
- New browser API dependencies: `getUserMedia`, `SpeechSynthesis`, Service Worker/Cache, plus a temporary external translation provider for the MVP.
- No authentication, database, or account systems introduced.
- Establishes the dependency-inversion contracts (OCR/translation/speech) that all later phases (local OCR, local LLM translation, local neural TTS) must satisfy.
