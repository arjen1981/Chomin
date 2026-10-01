# Spec Delta

## Purpose

Defines the contract for turning a captured image region into recognized Japanese text, independent of any particular OCR engine, so implementations (mock, cloud, or on-device model) can be swapped without changing callers.

## ADDED Requirements

### Requirement: OCR service abstraction

The system SHALL define an OCR service contract that accepts a captured image region and returns recognized Japanese text with an associated confidence indication. Callers SHALL depend only on this contract and never on a specific engine.

#### Scenario: Recognize text from a region

- **WHEN** a captured region is submitted to the OCR service
- **THEN** the service returns recognized Japanese text (possibly empty) and a confidence indication normalized to the range 0..1

#### Scenario: Replaceable implementation

- **WHEN** the OCR implementation is replaced with a different engine that satisfies the contract
- **THEN** no changes are required in the calling pipeline code

### Requirement: On-device Japanese OCR

The system SHALL provide an on-device Japanese OCR implementation that satisfies the contract and runs entirely in the browser (Tesseract.js, `jpn` model, WASM). The engine SHALL be lazy-loaded on first recognition so application startup and tests stay light. Captured images SHALL never leave the device.

#### Scenario: Live camera recognition

- **WHEN** the camera loop submits a captured region to the on-device OCR implementation
- **THEN** the pipeline receives the recognized Japanese text and its confidence without any image being sent over the network

#### Scenario: Engine loads on first use

- **WHEN** the first region is recognized after the application starts
- **THEN** the OCR engine and its Japanese language data are initialized once and reused for all subsequent recognitions

#### Scenario: Mock implementation for tests

- **WHEN** tests or development need deterministic OCR output
- **THEN** a mock implementation satisfying the same contract can be injected in place of the on-device engine

### Requirement: OCR image preprocessing

Before recognition, the system SHALL preprocess the captured region to improve recognition of on-screen game fonts photographed by a camera: upscale small regions toward a target height (scale factor between 1 and 4), convert to grayscale, stretch contrast between low and high luminance percentiles, and invert the image when the background is predominantly dark so text is always dark on a light background.

#### Scenario: Light text on dark dialogue box

- **WHEN** the captured region is a dark dialogue box with light text
- **THEN** the image passed to the OCR engine is grayscale, contrast-stretched, and inverted to dark text on a light background

#### Scenario: Small region is upscaled

- **WHEN** the captured region is shorter than the target height
- **THEN** it is upscaled (at most 4×) before recognition

### Requirement: OCR output normalization

The system SHALL normalize OCR output before it is used for deduplication and translation. Because Japanese uses no word spaces, whitespace inserted by the OCR engine between characters SHALL be removed.

#### Scenario: Normalize whitespace and stray characters

- **WHEN** OCR returns Japanese text containing spaces between characters or line breaks
- **THEN** the whitespace is removed so equivalent readings compare equal downstream and translation receives contiguous Japanese text

### Requirement: OCR debug view

The system SHALL provide a collapsible debug panel showing the latest raw OCR reading, its confidence, and the preprocessed image, to help tune recognition on a real device.

#### Scenario: Inspect a recognition

- **WHEN** the user opens the OCR debug panel while the camera loop runs
- **THEN** the most recent recognized text, its confidence, and the preprocessed image are displayed
