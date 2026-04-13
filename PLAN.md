# DEV COMPANION — PROJECT PLAN

> Stack: Electron + React + Vite + Tailwind + Zustand + Drizzle ORM + SQLite + Supabase + Zod + dnd-kit + cmdk
> Security: Electron safeStorage for credentials | Supabase row-level security for cloud data
> Target: Windows + Mac | Role-based (Admin / Member) | Local-first, selective cloud sync

---

## STATUS KEY

- [ ] Not started

- [~] In progress

- [X] Complete

---

## PHASE 0 — Project Scaffold & Base Architecture

**Goal:** Repo structure, Electron shell, React app boots, DB connections live, auth working.
**Completion: 100%**

### Tasks

- [X] Init repo: `npm create vite@latest` inside Electron shell
- [X] Configure Electron main.js + preload.js (contextBridge, ipcMain/ipcRenderer)
- [X] Setup Tailwind CSS + base theme (dark hacker aesthetic — #0d1117 bg, #00ff9f accent)
- [X] Setup Zustand global store (activeWorkspace, currentUser, navLayout)
- [X] Setup Drizzle ORM + SQLite (better-sqlite3) — local DB file at app data path
- [X] Setup Supabase client — cloud sync for non-sensitive data
- [X] Supabase Auth — email/password login, role field (admin/member) in profiles table
- [X] Electron safeStorage — encrypt/decrypt helper for credentials
- [X] Base DB schema — all tables defined (see Schema section below)
- [X] App shell layout — sidebar nav, main content area, top bar
- [X] Settings page scaffold — preferred browser, theme, API key, user profile
- [X] cmdk command palette — registers all module routes
- [X] dnd-kit nav customisation — sidebar order persisted in SQLite

### DB Schema (SQLite — local)

```
workspaces        (id, name, color, created_at)
instances         (id, workspace_id, name, url, type[project|demo], platform[fusion|salesforce], expiry_date, notes, created_at)
instance_creds    (id, instance_id, encrypted_blob) ← safeStorage encrypted
tasks             (id, workspace_id, title, platform, status, priority, created_at)
notes             (id, workspace_id, title, body, updated_at)
nav_layout        (id, user_id, layout_json)
settings          (key, value)
```

### DB Schema (Supabase — cloud, non-sensitive)

```
profiles          (id, email, role[admin|member], team_id)
snippets          (id, team_id, title, code, platform, tags, created_by, updated_at)
vault_files       (id, team_id, name, content, filetype, platform, tags, description, version_note, created_by)
knowledge_base    (id, team_id, title, body, category, platform, links, created_by)
checklists        (id, team_id, title, platform, steps_json, created_by)
error_decoder     (id, team_id, platform, error_code, title, explanation, root_cause, fix_steps, created_by)
permission_map    (id, team_id, platform, action_desc, roles_json, notes, created_by)
glossary          (id, team_id, term, definition, platform, created_by)
onboarding_guides (id, team_id, title, body, section, created_by)
api_references    (id, team_id, title, endpoint, method, headers_json, payload_json, platform, created_by)
component_registry(id, team_id, name, description, platform, projects, version, file_ref, created_by)
known_issues      (id, team_id, title, platform, description, workaround, status, created_by)
```

**Phase 0 complete when:** App launches, user can log in, sidebar renders, SQLite + Supabase both connected.

---

## PHASE 1 — Workspace & Instance Dashboard

**Goal:** Project switcher live, instance dashboard with status + launch working.
**Completion: 0%**

### Tasks

- [X] Workspace switcher UI — create/edit/delete workspaces, switch context `[x]`
- [X] All modules scope to active workspace via Zustand `[x]`
- [X] Instance Dashboard page — card grid (project instances / demo instances) `[x]`
- [X] Add/edit instance form — name, URL, platform, type, expiry date, username, password `[x]`
- [X] Store credentials via safeStorage (encrypted JSON blob) `[x]`
- [X] Status check — GET ping with header-only fetch, show Active / Unreachable `[x]`
- [X] Auto-Copy Launcher — Copy password + Open system browser workflow `[x]`
- [X] Security — SHA-256 PIN hashing & Zustand Persistence `[x]`
- [X] Expiry countdown badge — color coded (green >7d, amber 3-7d, red <3d) `[ ]`
- [X] Auto-check status on app open + Global Refresh button `[x]`

**Phase 1 complete when:** User can add Oracle + Salesforce instances, see their status, and launch them.

---

## PHASE 2 — Task Tracker + Quick Notes

**Goal:** Daily work management and scratch pad working.
**Completion: 0%**

### Tasks

- [ ] Task Tracker — kanban board (Backlog / In Progress / Blocked / Done)
- [ ] Task card — title, platform tag (Fusion/Sales/Service/OIC/BIP), priority, created date
- [ ] Drag cards between columns (dnd-kit)
- [ ] Filter tasks by platform, priority
- [ ] Quick Notes — persistent notepad per workspace
- [ ] Notes list — multiple notes, titled, searchable via Fuse.js
- [ ] Auto-save on keystroke (debounced 1s)
- [ ] Markdown preview toggle for notes

**Phase 2 complete when:** Tasks can be created, moved, filtered. Notes persist across app restarts.

---

## PHASE 3 — Code & File Vault + Snippet Library

**Goal:** Reusable code storage and quick-access snippets working.
**Completion: 0%**

### Tasks

- [ ] Snippet Library — list view, one-click copy, filter by platform/tag
- [ ] Add/edit snippet form — title, code, platform, tags
- [ ] Syntax highlighting — use Shiki (local, offline capable)
- [ ] Code & File Vault — full file storage in Supabase (content as text) + metadata
- [ ] Vault upload — paste content or upload file from disk
- [ ] Vault search — Fuse.js across name, description, tags
- [ ] Vault card — name, filetype badge, platform, description, version note, copy/download button
- [ ] Admin-only: delete vault entries. Members: read + add only.
- [ ] Reusable Component Registry — same structure as vault but with project usage field

**Phase 3 complete when:** Files and snippets can be stored, searched, and copied. Role restrictions enforced.

---

## PHASE 4 — Knowledge Base + Guided Checklists + Glossary + Onboarding

**Goal:** All reference and knowledge modules working.
**Completion: 0%**

### Tasks

- [ ] Knowledge Base — categorized articles, links, notes. Filter by platform/category.
- [ ] Rich text editor for KB articles — use TipTap (lightweight, local)
- [ ] Guided Checklists — create runbook templates with ordered steps + checkboxes
- [ ] Run a checklist — mark steps done, progress bar, reset to reuse
- [ ] Admin creates templates, members run them
- [ ] Terminology Glossary — searchable A-Z list, add/edit terms
- [ ] Environment Onboarding Guide — structured guide per workspace (markdown sections)
- [ ] API Quick Reference Panel — endpoint cards with method badge, headers, payload, platform

**Phase 4 complete when:** All four reference modules are populated, searchable, and accessible to all roles.

---

## PHASE 5 — Permission Advisor + Error Decoder

**Goal:** The two AI-assist power features working.
**Completion: 0%**

### Tasks

- [ ] Error Decoder — paste error → match against local DB first → AI fallback if no match
- [ ] Error Decoder covers: Oracle Fusion, OIC, ODA, VBS
- [ ] Error entry structure: code/pattern, plain English, root cause, fix steps, platform
- [ ] Team can add new solved errors (admin approves before it's shared)
- [ ] Permission Advisor — structured question flow (platform → module → action → scope)
- [ ] Permission result shows: exact roles, duty roles, data security policies, common traps
- [ ] Free-text input mode — describe in plain English → Claude API maps to permissions
- [ ] Both features work offline (DB lookup). AI assist is optional (requires API key in settings).
- [ ] Known Issues Tracker — log issue, platform, workaround, status (open/resolved)

**Phase 5 complete when:** Error decoder returns results for common errors. Permission advisor walks through structured flow. Both degrade gracefully without API key.

---

## PHASE 6 — Settings + Nav Customisation + Polish

**Goal:** Settings complete, nav customisable, UX polished, app production-ready.
**Completion: 0%**

### Tasks

- [ ] Settings page — preferred browser, theme toggle, Claude API key (safeStorage), team management
- [ ] Admin-only: invite member (Supabase invite email), change roles, remove members
- [ ] Nav customisation — drag sidebar items, hide/show modules, reset to default
- [ ] Persist nav layout in SQLite per user
- [ ] Command palette (cmdk) — search all modules, recent items, actions
- [ ] Keyboard shortcuts — defined and documented in settings
- [ ] Empty states — every module has a helpful empty state with CTA

- [x] Onboarding flow — First Launch Profile Wizard (Name, Email, PIN Setup) `[x]`

- [ ] Export/import — backup all local SQLite data as JSON
- [ ] App auto-updater (electron-updater)
- [ ] Windows + Mac build pipeline (electron-builder)

**Phase 6 complete when:** App is fully polished, builds on both platforms, all settings work.

---

## MODULE SUMMARY TABLE

| #  | Module                       | Storage        | Role Restriction                       | AI Needed |
| -- | ---------------------------- | -------------- | -------------------------------------- | --------- |
| 1  | Instance Dashboard           | SQLite (local) | Admin: full, Member: view+launch       | No        |
| 2  | Task Tracker                 | SQLite (local) | Per workspace                          | No        |
| 3  | Quick Notes                  | SQLite (local) | Personal                               | No        |
| 4  | Code & File Vault            | Supabase       | Admin: delete, Member: add+read        | No        |
| 5  | Snippet Library              | Supabase       | Admin: delete, Member: add+read        | No        |
| 6  | Knowledge Base               | Supabase       | Admin: full, Member: read+add          | No        |
| 7  | Guided Checklists            | Supabase       | Admin: create templates, Member: run   | No        |
| 8  | Permission Advisor           | Supabase + API | All roles                              | Optional  |
| 9  | Error Decoder                | Supabase + API | All roles                              | Optional  |
| 10 | Reusable Component Registry  | Supabase       | Admin: full, Member: add+read          | No        |
| 11 | Known Issues Tracker         | Supabase       | Admin: full, Member: add+read          | No        |
| 12 | API Quick Reference          | Supabase       | Admin: full, Member: read              | No        |
| 13 | Project/Workspace Switcher   | SQLite (local) | Admin: create/delete                   | No        |
| 14 | Terminology Glossary         | Supabase       | Admin: full, Member: add+read          | No        |
| 15 | Environment Onboarding Guide | Supabase       | Admin: full, Member: read              | No        |
| 16 | Settings                     | SQLite (local) | Admin: team settings, Member: personal | No        |

---

## OVERALL PROGRESS

| Phase           | Description                        | Status      | % Done        |
| --------------- | ---------------------------------- | ----------- | ------------- |
| 0               | Scaffold & Base Architecture       | Complete    | 100%          |
| 1               | Workspace & Instance Dashboard     | Complete    | 100%          |
| 2               | Task Tracker + Notes               | Not started | 0%            |
| 3               | Code Vault + Snippets              | Not started | 0%            |
| 4               | Knowledge Base + Reference Modules | Not started | 0%            |
| 5               | Permission Advisor + Error Decoder | Not started | 0%            |
| 6               | Settings + Polish + Build          | Not started | 0%            |
| **TOTAL** |                                    |             | **28%** |

---

*Update this file after completing each task. Change [ ] to [~] when starting, [x] when done. Update % in the table above after each phase.*
