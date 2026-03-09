# ADR-002 — No Backend — Browser-Only Architecture

**Status:** accepted
**Date:** March 2026
**Raised by:** Human (project design phase)

---

## Context

ConceptForge is a personal solo-use tool. A decision was needed on whether to include a backend server.

## Decision

MVP is **browser-only** — no backend server, no database, no cloud storage.

## Rationale

- Eliminates an entire class of infrastructure complexity for a solo-use tool
- No authentication, session management, or data storage concerns for v1
- Reduces deployment surface to a single static nginx container on fly.io
- Claude API calls go directly from the browser to `api.anthropic.com` using the user's own key
- Persistence handled entirely through local JSON file export/import

## Consequences

- URL ingestion (a nice-to-have feature) will require a proxy when implemented — this is deferred to post-MVP
- No cross-device sync — user manages their own JSON files
- Claude API key stored in localStorage — never leaves the browser except to Anthropic's API
- If a backend is added in a future version, this ADR must be superseded with a new ADR explaining the migration
