# Spec Delta

## Purpose

Suppresses redundant work by detecting when recognized dialogue is the same line the camera is still showing, so the same text is not repeatedly OCR-processed, translated, or spoken.

## ADDED Requirements

### Requirement: Duplicate dialogue suppression

The system SHALL detect when newly recognized dialogue is equivalent to recently processed dialogue and SHALL suppress re-translation and re-speech of equivalent lines while they remain on screen.

#### Scenario: Same line stays on screen

- **WHEN** the camera shows the same dialogue line across many sampled frames
- **THEN** the line is translated and spoken once, not repeatedly, for as long as it remains unchanged

#### Scenario: New line is processed

- **WHEN** the recognized dialogue changes to a different line
- **THEN** the new line is treated as new and is translated and spoken

### Requirement: Normalized matching

Duplicate detection SHALL compare normalized text (accounting for whitespace and punctuation) and MAY use fuzzy matching and OCR confidence so minor OCR variation of the same line is treated as a duplicate.

#### Scenario: Minor OCR variation

- **WHEN** two sampled frames of the same on-screen line differ only by whitespace, punctuation, or a small OCR error
- **THEN** the second is treated as a duplicate and not re-spoken

### Requirement: Minimum repeat interval

The system SHALL enforce a configurable minimum time before the same line may be spoken again, so brief flicker or re-detection does not cause repeated speech.

#### Scenario: Suppress rapid repeat

- **WHEN** a previously spoken line is re-detected within the minimum repeat interval
- **THEN** it is not spoken again until the interval has elapsed

### Requirement: Recognition stability gate

Before a live OCR reading enters deduplication, the system SHALL require a configurable number of consecutive similar readings (default 3, similarity ≥ 0.8 over normalized text) and SHALL emit the settled line only once while it stays on screen. An empty or rejected reading SHALL reset the gate.

#### Scenario: Jittery readings are held back

- **WHEN** consecutive OCR readings of the region differ substantially from each other
- **THEN** no line is emitted to the pipeline

#### Scenario: Settled line is emitted once

- **WHEN** the same on-screen line is read similarly for the required number of consecutive samples
- **THEN** the line is emitted to the pipeline once, and further similar readings are not emitted again

#### Scenario: Minor OCR slip still settles

- **WHEN** consecutive readings of the same line differ only by a small OCR error
- **THEN** they count toward the same candidate and the line still settles

### Requirement: Low-confidence rejection

The system SHALL discard live OCR readings whose confidence is below a configurable minimum (default 0.35) or that are shorter than 2 characters, and SHALL reset the stability gate when doing so.

#### Scenario: Low-confidence noise

- **WHEN** OCR returns a reading below the minimum confidence or shorter than 2 characters
- **THEN** the reading is not processed and the stability gate is reset
