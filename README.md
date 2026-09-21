# Chomin

A mobile-first PWA that translates Japanese RPG dialogue in real time. Point your phone's camera at any screen (TV, monitor, handheld, console) and get a natural English translation shown on screen and spoken aloud — no capture card, emulator, or game mod required.

## Why

Most Japanese RPGs offer no API or text hook. The only universal input is a camera pointed at the screen. Chomin turns that camera feed into readable, spoken English.

## Pipeline

```
Camera → OCR → Deduplication → Translation (JA→EN) → English speech
```

Each stage is a swappable abstraction, so cloud MVP implementations can be replaced later with on-device OCR, local translation models, and neural TTS — without reworking the app.

## Tech Stack

- **Frontend:** TypeScript + Vite, installable PWA (`getUserMedia`, `SpeechSynthesis`, Service Worker)
- **Backend (optional):** ASP.NET Core minimal API for a cloud translation fallback
- **Spec-driven:** planning managed with [OpenSpec](https://github.com/Fission-AI/OpenSpec) under `openspec/`

## Privacy

Explicit **Local vs Cloud** modes. Camera-derived data never leaves the device without consent.

## Status

Phase 1 MVP — vertical slice (camera → text → translation → English speech). See `openspec/changes/` for the current change proposal, design, and tasks.
