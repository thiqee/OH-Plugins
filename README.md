# OH-Plugins

This repository is the public index for OpenHanako plugins. It may also host
official plugin source directories when a plugin is ready to be maintained as
part of the official catalog.

## Repository Layout

```text
marketplace.json                 Generated client-facing index.
plugins/*.json                   Reviewed plugin entries.
schemas/                         JSON Schemas for registry and manifest files.
scripts/                         Validation and index-generation scripts.
official-plugins/                Official plugin source directories.
```

## Model

Hana treats the marketplace as a discovery and trust index. The index points to a
plugin source repository or a fixed release package. Installable release packages
must include a SHA-256 checksum so the app can verify what it downloaded.

The first version supports two distribution modes:

- `source`: source is kept in this repository. This is used for official examples
  and plugins that are copied or packaged by maintainers.
- `release`: the entry points at a versioned package URL and a checksum. This is
  the mode Hana should use for one-click installation.

## Official Plugins

Official plugins live in `official-plugins/` when they exist. The first public
version of this repository starts with an empty catalog and keeps the directory
only as a reserved home for future official plugins.

## Adding A Plugin

1. Add `plugins/<plugin-id>.json`.
2. Include the plugin source repository, manifest URL, version, trust level,
   compatibility, permissions, contributions, and distribution details.
   Add one README source so Hana can show the plugin detail page:
   `readmePath` for files in this repository, `readmeUrl` for external Markdown,
   or `readme` for a short inline Markdown description.
3. Run `npm run check`.
4. Open a pull request.

Runtime-installable community plugins should use `distribution.kind = "release"`
with a fixed `packageUrl` and `sha256`.

## Local Commands

```bash
npm run build:index
npm run validate
npm run check
```

The scripts use only Node.js built-ins. No install step is required.
