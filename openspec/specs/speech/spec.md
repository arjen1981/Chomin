# speech Specification

## Purpose

Defines the contract for speaking the English translation aloud, with a Web Speech API MVP and user controls, independent of any particular speech engine so a local neural TTS can replace it later.

## Requirements

### Requirement: Speech service abstraction

The system SHALL define a text-to-speech service contract that speaks provided English text. Callers SHALL depend only on this contract and never on a specific engine, and the engine SHALL be replaceable (e.g. Web Speech API today, local neural TTS later).

#### Scenario: Speak English text

- **WHEN** English text is submitted to the speech service with speech enabled
- **THEN** the service speaks the English text aloud

#### Scenario: English only

- **WHEN** any text is submitted for speech
- **THEN** only the English translation is ever spoken; the Japanese source text is never spoken aloud

### Requirement: Web Speech API MVP

The system SHALL provide an MVP speech implementation using the browser `SpeechSynthesis` / Web Speech API that satisfies the speech contract.

#### Scenario: Speak via browser synthesis

- **WHEN** the MVP speech implementation is active and English text is queued
- **THEN** the browser speech synthesizer voices the text using an available English voice

### Requirement: Speech controls

The system SHALL let the user enable or disable speech, replay the current translation, adjust speech rate where supported, and select an available English voice where supported.

#### Scenario: Disable speech

- **WHEN** the user disables speech
- **THEN** new translations are displayed but not spoken

#### Scenario: Replay current translation

- **WHEN** the user activates replay
- **THEN** the current English translation is spoken again

#### Scenario: Adjust rate and voice

- **WHEN** the user changes speech rate or selects a different English voice where the browser supports it
- **THEN** subsequent speech uses the chosen rate and voice
