# Spec Delta

## Purpose

Defines the contract for translating recognized Japanese RPG dialogue into natural English, with an optional rolling-context hook and rules that preserve names, terminology, and tone, independent of any particular translation engine.

## ADDED Requirements

### Requirement: Translation service abstraction

The system SHALL define a translation service contract that accepts Japanese text (and optional context) and returns English dialogue text. Callers SHALL depend only on this contract and never on a specific engine (cloud API, ONNX model, or local LLM).

#### Scenario: Translate Japanese to English

- **WHEN** Japanese dialogue is submitted to the translation service
- **THEN** the service returns natural English dialogue and nothing else (no explanations, notes, or the original Japanese)

#### Scenario: Replaceable implementation

- **WHEN** the translation implementation is replaced with a different engine that satisfies the contract
- **THEN** no changes are required in the calling pipeline code

### Requirement: Natural RPG dialogue translation

The translation SHALL aim for natural English RPG dialogue rather than literal machine translation, and SHALL preserve character names, locations, items, terminology, formality, tone, and personality as much as the underlying engine allows.

#### Scenario: Preserve names and tone

- **WHEN** dialogue contains a character name and a distinctive tone (e.g. rough, formal, playful)
- **THEN** the returned English retains the name and conveys a comparable tone rather than a flattened literal rendering

#### Scenario: Output is dialogue only

- **WHEN** a translation is requested
- **THEN** the response contains only the English dialogue with no added commentary or explanation

### Requirement: Rolling context hook

The system SHALL provide an optional, replaceable rolling-context mechanism that can supply recent prior dialogue and known terminology to the translation service; the pipeline SHALL function correctly when context is absent.

#### Scenario: Context improves consistency

- **WHEN** rolling context containing recent dialogue is supplied with a translation request
- **THEN** the translation service receives that context and the pipeline still returns English dialogue

#### Scenario: Context is optional

- **WHEN** no rolling context is available
- **THEN** translation still succeeds using only the current Japanese text
