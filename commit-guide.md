# Eco-Commerce Orchestrator Commit Guide

## Purpose

This guide defines commit standards for human and AI-assisted changes.

Commits must be:

- atomic
- readable
- reviewable
- scoped
- reversible

---

## Commit Format

Use:

`type(scope): short description`

Examples:

- feat(components): add checkout button
- fix(services): validate payment transition
- refactor(lib): extract currency formatter
- docs(knowledge): add architecture diagram
- test(hooks): cover useCart hook logic
- chore(repo): align workspace scripts

---

## Allowed Types

- feat
- fix
- refactor
- docs
- test
- chore

---

## Scope Rules

Scope should describe the affected domain or layer.

Good scopes:

- app
- components
- hooks
- lib
- services
- ui
- docs
- config
- repo
- ai

Avoid vague scopes:

- stuff
- update
- misc
- changes

---

## Description Rules

Description must:

- be short
- be explicit
- use present tense
- stay under 72 characters when possible

Good:

- feat(services): add payment processing endpoint
- fix(hooks): include item count in cart event

Bad:

- fix: update things
- refactor(code): improve logic
- chore: changes

---

## Atomic Commit Rule

Each commit should represent one logical change.

Allowed:

- one endpoint
- one bug fix
- one refactor
- one documentation update group

Avoid:

- mixing feature + refactor + docs without reason
- giant dump commits
- formatting-only noise mixed with behavior changes

---

## Commit Sequence Guidance

Preferred order when possible:

1. docs/spec changes
2. domain or contract changes
3. implementation
4. tests
5. integration
6. final docs sync

---

## AI-Assisted Commit Rule

If AI helped generate the change:

- review before commit
- remove meaningless comments
- remove fake placeholder logic
- ensure commit message reflects real behavior

Do not commit raw AI output without cleanup.

---

## Examples

### Good Commit History

- docs(services): define payment endpoint contract
- feat(services): add payment processing service
- test(services): cover payment validation
- docs(knowledge): add payment.processed payload

### Bad Commit History

- update files
- fix issues
- more changes
- final fix
