# Spec Delta

## Purpose

Provides an optional ASP.NET Core service that offers a cloud translation fallback for Cloud mode, while remaining entirely optional to the client so the core experience works without any server.

## ADDED Requirements

### Requirement: Optional translation fallback endpoint

The backend SHALL expose an HTTP endpoint that accepts Japanese text (and optional context) and returns English dialogue, conforming to the client's translation contract. The client SHALL treat the backend as optional and MUST remain functional in Local mode with no backend available.

#### Scenario: Translate via backend

- **WHEN** the client is in Cloud mode and posts Japanese dialogue to the translation endpoint
- **THEN** the endpoint returns English dialogue text only

#### Scenario: Backend absent

- **WHEN** no backend is configured or reachable
- **THEN** the client still operates in Local mode without errors caused by the missing backend

### Requirement: No mandatory account or database

The backend SHALL NOT require authentication, user accounts, payments, or a persistent database for the translation fallback in this change.

#### Scenario: Anonymous request

- **WHEN** a translation request is made without any account or credential
- **THEN** the endpoint responds normally without requiring sign-in

### Requirement: Privacy-respecting handling

The backend SHALL only receive data when the client is explicitly in Cloud mode, and SHALL NOT be sent camera frames — only text derived on the client.

#### Scenario: Only text crosses the network

- **WHEN** the client uses the backend fallback
- **THEN** only recognized/translation text is transmitted, never raw camera frames
