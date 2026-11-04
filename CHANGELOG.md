# Changelog

All notable changes to this project are documented here. Older entries are listed in the [README](README.md#version-history).

## 1.6.0

- Migrated to `@n8n/node-cli` (build, lint, dev, release), ESLint 9 flat config, strict mode
- CI and npm publishing with provenance via GitHub Actions
- Node usable as an AI agent tool, correct `pairedItem` handling
- New: task labels, My Tasks / User task listing, include details / exclude completed, user plan listing,
  board formats, assignment replace/remove, remove dates, remove checklist items / attachments,
  order hints, preview type, bucket order hint, comment split into items
- Fixed: update priority values, comment reply endpoint, first comment thread creation, comment HTML escaping,
  missing user scopes, deprecated plan `owner`, empty details PATCH, clearing the description,
  Luxon/Date inputs, user lookup escaping, automatic retry on ETag conflicts
