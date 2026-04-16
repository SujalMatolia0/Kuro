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
**Completion: 100%**

### Tasks

- [X] Workspace switcher UI — create/edit/delete workspaces, switch context
- [X] All modules scope to active workspace via Zustand
- [X] Instance Dashboard page — card grid (project instances / demo instances)
- [X] Add/edit instance form — name, URL, platform, type, expiry date, username, password
- [X] Store credentials via safeStorage (encrypted JSON blob)
- [X] Status check — GET ping with header-only fetch, show Active / Unreachable
- [X] Auto-Copy Launcher — Copy password + Open system browser workflow
- [X] Security — SHA-256 PIN hashing & Zustand Persistence
- [X] Expiry countdown badge — color coded (green >7d, amber 3-7d, red <3d)
- [X] Auto-check status on app open + Global Refresh button

**Phase 1 complete when:** User can add Oracle + Salesforce instances, see their status, and launch them.

---

## PHASE 2 — Task Tracker + Quick Notes

**Goal:** Daily work management and scratch pad working.
**Completion: 100%**

### Tasks

- [X] Task Tracker — kanban board (Backlog / In Progress / Blocked / Done)
- [X] Task card — title, platform tag (Fusion/Sales/Service/OIC/BIP), priority, created date
- [X] Drag cards between columns (dnd-kit)
- [X] Quick Notes — persistent notepad per workspace
- [X] Notes list — multiple notes, titled, searchable via Fuse.js
- [X] Auto-save on keystroke (debounced)

**Phase 2 complete:** Tasks can be created, moved, filtered. Notes persist across app restarts.

---

## PHASE 3 — Code & File Vault + Snippet Library

**Goal:** Reusable code storage and quick-access snippets working.
**Completion: 100%**

### Tasks

- [X] Snippet Library — list view, one-click copy, filter by platform/tag
- [X] Add/edit snippet form — title, code, platform, tags
- [X] Syntax highlighting — use Shiki (local, offline capable)
- [X] Code & File Vault — full file storage in Supabase (content as text) + metadata
- [X] Vault upload — paste content or upload file from disk
- [X] Vault search — Fuse.js across name, description, tags
- [X] Vault card — name, filetype badge, platform, description, version note, copy/download button
- [X] Admin-only: delete vault entries. Members: read + add only.
- [X] Reusable Component Registry — same structure as vault but with project usage field

**Phase 3 complete when:** Files and snippets can be stored, searched, and copied. Role restrictions enforced.

---

## PHASE 4 — Knowledge Base + Guided Checklists + Glossary + Onboarding

**Goal:** All reference and knowledge modules working.
**Completion: 100%**

### Tasks

- [X] Knowledge Base — categorized articles (doc/term/api/guide types), TipTap rich text editor
- [X] Rich text editor for KB articles — TipTap with full toolbar (bold, italic, headings, lists, code blocks)
- [X] Guided Checklists — runbook templates with ordered steps, progress bar, reset to reuse
- [X] Run a checklist — mark steps done, progress tracking, cloud-synced state
- [X] Terminology Glossary — unified inside KnowledgeHub as 'term' type entries
- [X] Environment Onboarding Guide — unified inside KnowledgeHub as 'guide' type entries
- [X] API Quick Reference Panel — unified inside KnowledgeHub as 'api' type with endpoint/method/links
- [X] Audit logging on all create/update/delete operations

**Phase 4 complete when:** All four reference modules are populated, searchable, and accessible to all roles.

---

## PHASE 5 — Permission Advisor + Error Decoder

**Goal:** The two AI-assist power features working.
**Completion: 100%**

### Tasks

- [X] Error Decoder — paste error → search shared Supabase DB → AI fallback (Gemini) if no match
- [X] Error Decoder covers: Oracle Fusion, OIC, ODA, Salesforce, AWS
- [X] Error entry structure: code/pattern, plain English, root cause, fix steps, platform
- [X] Team can save AI-generated fixes to shared DB with one click
- [X] Permission Advisor — free-text natural language query → AI maps to exact roles/privileges
- [X] Permission result shows: primary role, specific privileges, navigation path, security traps
- [X] Both features work offline (DB lookup). AI assist is optional (requires Gemini key in settings).
- [X] Known Issues Tracker — log issue, platform, description, workaround, status (open/resolved)
- [X] Audit logging on all AI saves and issue reports

**Phase 5 complete when:** Error decoder returns results for common errors. Permission advisor walks through structured flow. Both degrade gracefully without API key.

---

## PHASE 6 — Settings + Nav Customisation + Polish

**Goal:** Settings complete, nav customisable, UX polished, app production-ready.
**Completion: 100%**

### Tasks

- [X] Settings page — preferred browser, theme toggle (dark/light), Gemini API key, team management
- [X] Admin-only: invite member, change roles, remove members (Supabase-backed)
- [X] Command palette (cmdk) — search all modules, recent items, actions
- [X] Keyboard shortcuts — defined and documented in settings page
- [X] Empty states — EmptyState component used across all modules
- [X] Onboarding flow — First Launch Profile Wizard (Name, Email, PIN Setup)
- [X] Export/import — backup all local SQLite data as JSON (exportBackup/importBackup utils)
- [X] Audit Trail module — local + cloud logs merged, diff viewer, action icons
- [X] framer-motion page transitions on module switch
- [X] Nav customisation — drag sidebar items, hide/show modules, reset to default
- [X] Persist nav layout in SQLite per user
- [X] App auto-updater (electron-updater)
- [X] Windows + Mac build pipeline (electron-builder)

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

| Phase     | Description                        | Status      | % Done |
| --------- | ---------------------------------- | ----------- | ------ |
| 0         | Scaffold & Base Architecture       | Complete    | 100%   |
| 1         | Workspace & Instance Dashboard     | Complete    | 100%   |
| 2         | Task Tracker + Notes               | Complete    | 100%   |
| 3         | Code Vault & Snippets              | Complete    | 100%   |
| 4         | Knowledge Base + Reference Modules | Complete    | 100%   |
| 5         | Permission Advisor + Error Decoder | Complete    | 100%   |
| 6         | Settings + Polish + Build          | Complete    | 100%   |
| **TOTAL** |                                    |             | **100%** |

---

*Update this file after completing each task. Change [ ] to [~] when starting, [x] when done. Update % in the table above after each phase.*
