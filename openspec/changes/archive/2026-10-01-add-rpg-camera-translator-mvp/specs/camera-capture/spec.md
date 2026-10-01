# Spec Delta

## Purpose

Captures live video from the device camera, samples frames at a controlled rate rather than per-frame, and exposes an adjustable region-of-interest so downstream stages receive a focused image of the game dialogue area.

## ADDED Requirements

### Requirement: Camera access

The system SHALL request camera access via the browser `getUserMedia()` API, SHALL prefer the rear-facing camera, and SHALL display a live preview. It SHALL handle permission denial gracefully.

#### Scenario: Grant camera permission

- **WHEN** the user grants camera permission
- **THEN** a live rear-camera preview is displayed as the main surface

#### Scenario: Deny camera permission

- **WHEN** the user denies camera permission or no camera is available
- **THEN** the application shows an actionable message explaining that camera access is required and how to enable it, without crashing

### Requirement: Frame sampling

The system SHALL sample frames for processing at a configurable interval rather than processing every rendered frame, balancing latency, CPU/GPU usage, and battery.

#### Scenario: Controlled sampling rate

- **WHEN** the camera preview is running
- **THEN** frames are submitted to downstream processing no faster than the configured sampling interval (default 500 ms), and previews remain smooth regardless of processing rate

#### Scenario: No overlapping recognition

- **WHEN** a recognition of a previously sampled frame is still in progress
- **THEN** no new frame is submitted until that recognition has finished

#### Scenario: Skip redundant frames

- **WHEN** consecutive sampled frames are effectively unchanged
- **THEN** the system may skip downstream processing for the unchanged frame to conserve resources

### Requirement: Region-of-interest selection

The system SHALL allow the user to position or crop a region-of-interest over the dialogue area, and SHALL feed only that region to the OCR stage.

#### Scenario: Adjust region

- **WHEN** the user moves or resizes the region-of-interest
- **THEN** subsequent captured images passed to OCR contain only the selected region

#### Scenario: Default region

- **WHEN** the user has not adjusted the region
- **THEN** a sensible default region is used so the pipeline can operate without manual setup
