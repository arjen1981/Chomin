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
