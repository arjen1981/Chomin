# Spec Delta

## Purpose

Orchestrates the processing stages — capture, OCR, deduplication, translation, and speech — into a single flow, exposing processing state to the UI and managing an ordered speech queue.

## ADDED Requirements

### Requirement: Staged pipeline orchestration

The system SHALL connect the stages in order — camera capture → OCR → deduplication → translation → speech — such that each stage depends only on the abstract contract of the next, and any stage implementation can be replaced without changing the orchestration.

#### Scenario: End-to-end flow

- **WHEN** a new dialogue line is captured and recognized
- **THEN** it flows through deduplication, is translated, is displayed, and is queued for speech

#### Scenario: Deduped line short-circuits

- **WHEN** deduplication marks a recognized line as a duplicate
- **THEN** the orchestrator does not translate or speak it again

### Requirement: Processing state indication

The system SHALL expose the current processing state (e.g. idle, recognizing, translating, speaking) so the UI can display a processing indicator.

#### Scenario: Indicator reflects work

- **WHEN** the pipeline is translating a new line
- **THEN** the UI can show a processing indicator that clears when the translation is displayed

### Requirement: Speech queue

The system SHALL manage a speech queue so translations are spoken in order without overlapping, and SHALL not enqueue duplicate consecutive lines.

#### Scenario: Ordered non-overlapping speech

- **WHEN** multiple translations are produced in quick succession
- **THEN** they are spoken one at a time in order, without overlapping audio

#### Scenario: Current line displayed and voiced

- **WHEN** a new unique dialogue line is translated
- **THEN** both the Japanese source and the English translation are displayed and the English is enqueued for speech
