# Marketplace Contract

## Trust Boundary

The marketplace repository does not execute plugin code. It only records plugin
metadata, source location, install package location, compatibility, and declared
permissions. Hana still validates each plugin manifest when installing and again
when loading.

## Entry Requirements

Every `plugins/*.json` entry must declare:

- `id`, `name`, `publisher`, `version`, `description`
- `repository`
- `compatibility.minAppVersion`
- `trust`
- `permissions`
- `contributions`
- `distribution`
- one README source: `readmePath`, `readmeUrl`, or `readme`

Release entries must also declare:

- `distribution.packageUrl`
- `distribution.sha256`

## Permission Display

The installer should display these fields before enabling a plugin:

- plugin name, publisher, version, and repository
- trust level
- declared permissions
- contribution types
- release checksum when present

Permission upgrades require fresh user confirmation.

## README Display

Hana's marketplace detail page reads README content in this order:

1. `readme` for short inline Markdown.
2. `readmePath` for Markdown files stored in this repository.
3. `readmeUrl` for external HTTPS Markdown.

Prefer `readmePath` for official plugins and `readmeUrl` for community plugins
that keep documentation with their source repository.

## Custom Registries

Hana can later allow users to add additional registry URLs. A custom registry
must serve the same `marketplace.json` shape and should be treated as a separate
trust source.
