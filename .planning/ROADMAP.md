# Roadmap: GRÜNE Bildgenerator — Tiroler Logos Erweiterung

## Overview

All 62 requirements are data changes to a single file (`index.json`). The work adds 8 Tiroler Bezirke, 43 Gemeinden, and 7 Organisationen to the searchable logo dropdown, then alphabetically sorts all categories and verifies the production build still works. One phase delivers everything.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Tiroler Logos** - Add all Tiroler entries to index.json, sort all categories, verify build (completed 2026-02-26)

## Phase Details

### Phase 1: Tiroler Logos
**Goal**: All Tiroler Bezirke, Gemeinden, and Organisationen are findable in the logo dropdown and the application functions correctly
**Depends on**: Nothing (first phase)
**Requirements**: BEZ-01, BEZ-02, BEZ-03, BEZ-04, BEZ-05, BEZ-06, BEZ-07, BEZ-08, GEM-01, GEM-02, GEM-03, GEM-04, GEM-05, GEM-06, GEM-07, GEM-08, GEM-09, GEM-10, GEM-11, GEM-12, GEM-13, GEM-14, GEM-15, GEM-16, GEM-17, GEM-18, GEM-19, GEM-20, GEM-21, GEM-22, GEM-23, GEM-24, GEM-25, GEM-26, GEM-27, GEM-28, GEM-29, GEM-30, GEM-31, GEM-32, GEM-33, GEM-34, GEM-35, GEM-36, GEM-37, GEM-38, GEM-39, GEM-40, GEM-41, GEM-42, GEM-43, ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, ORG-07, SORT-01, SORT-02, SORT-03, SORT-04, QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. User can search for any of the 8 Tiroler Bezirke by name and select it from the dropdown
  2. User can search for any of the 43 Tiroler Gemeinden by name and select it from the dropdown
  3. User can search for any of the 7 Organisationen (Grüne Frauen, Grüne Jugend, GRAS, etc.) and select from the dropdown
  4. All entries within Bezirke, Gemeinden, Andere, and Bundesländer categories appear in alphabetical order in the dropdown
  5. The production build (embed_logos.py) runs without errors and the application loads correctly with no duplicate entries
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — Add all Tiroler entries to index.json, sort all categories, verify build

## Progress

**Execution Order:**
Phases execute in numeric order: 1

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Tiroler Logos | 1/1 | Complete   | 2026-02-26 |
