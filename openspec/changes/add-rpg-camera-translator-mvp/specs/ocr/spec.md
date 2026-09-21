# Spec Delta

## Purpose

Defines the contract for turning a captured image region into recognized Japanese text, independent of any particular OCR engine, so implementations (mock, cloud, or on-device model) can be swapped without changing callers.

## ADDED Requirements

### Requirement: OCR service abstraction

The system SHALL define an OCR service contract that accepts a captured image region and returns recognized Japanese text with an associated confidence indication. Callers SHALL depend only on this contract and never on a specific engine.

#### Scenario: Recognize text from a region

- **WHEN** a captured region is submitted to the OCR service
- **THEN** the service returns recognized Japanese text (possibly empty) and a confidence indication

#### Scenario: Replaceable implementation

- **WHEN** the OCR implementation is replaced with a different engine that satisfies the contract
- **THEN** no changes are required in the calling pipeline code

### Requirement: OCR MVP implementation

The system SHALL provide an MVP OCR implementation that satisfies the contract, which MAY use manually supplied text or a temporary provider, so the end-to-end experience can be demonstrated before on-device OCR exists.

#### Scenario: MVP path produces text

- **WHEN** the MVP OCR implementation is active and a region (or manual input) is provided
- **THEN** the pipeline receives Japanese text usable by downstream stages

### Requirement: OCR output normalization

The system SHALL normalize OCR output (at minimum whitespace normalization) before it is used for deduplication and translation.

#### Scenario: Normalize whitespace and stray characters

- **WHEN** OCR returns text containing irregular whitespace or line breaks
- **THEN** the normalized text collapses redundant whitespace so equivalent readings compare equal downstream
