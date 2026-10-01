# app-shell Specification

## Purpose

Provides the installable, mobile-first PWA shell for the translator: a camera-forward layout, offline app caching, settings, and the Local/Cloud privacy mode switch that governs whether any camera-derived data may leave the device.

## Requirements

### Requirement: Installable PWA

The application SHALL be installable to the iPhone home screen from Safari via "Add to Home Screen" and SHALL provide a web app manifest declaring name, icons, theme colors, and a standalone display mode.

#### Scenario: Install from Safari

- **WHEN** a user opens the application in iPhone Safari and chooses "Add to Home Screen"
- **THEN** the application installs with its configured name and icon and launches in a standalone (chromeless) window

#### Scenario: Offline app shell

- **WHEN** the application has been opened once and the device later has no network connection
- **THEN** the application shell (HTML, CSS, JS, manifest, icons) loads from cache and renders the camera-forward UI without a network error

### Requirement: Camera-forward responsive layout

The application SHALL present the live camera preview as the dominant element of the main screen and SHALL remain usable in both portrait and landscape orientations.

#### Scenario: Portrait and landscape

- **WHEN** the device is rotated between portrait and landscape
- **THEN** the camera preview, detected Japanese text, English translation, and controls remain visible and correctly laid out without horizontal overflow

#### Scenario: Minimal interaction after aiming

- **WHEN** the user has pointed the camera at a game screen
- **THEN** translation and speech proceed without requiring further interaction, and controls (settings, speech toggle, replay) are reachable but not obstructing the preview

### Requirement: Privacy mode selection

The application SHALL expose an explicit Local mode and Cloud mode, SHALL default to the most privacy-preserving mode available, and SHALL never transmit camera frames or camera-derived text off the device while in Local mode.

#### Scenario: Local mode keeps data on device

- **WHEN** the application is in Local mode
- **THEN** no camera frame or recognized text is sent to any network endpoint

#### Scenario: Cloud mode disclosure

- **WHEN** the user enables Cloud mode
- **THEN** the application clearly informs the user that camera-derived text may leave the device and that translation is performed remotely, before any remote request is made
