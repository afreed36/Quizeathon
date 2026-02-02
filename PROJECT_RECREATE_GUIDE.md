# LiveDashBoard (Quiz Arena) — Full Project Rebuild Guide

This document is a complete, reproducible specification of the LiveDashBoard project (a quiz leaderboard/admin UI). If you (or an AI) are given this file, you should have enough detail to recreate the app from scratch, reconstitute its data model, and run the app with the same behavior and features.

Use this guide to:
- Recreate the repository structure and files.
- Rebuild the React frontend with Tailwind, Framer Motion and Recharts.
- Create and run the json-server API (local REST) used in development.
- Restore the UI behavior: host/admin mode, per-round scores, overrides, exports, and offline fallbacks.

---

## At-a-glance summary

- Frontend: React 18 (create-react-app), Tailwind CSS, Framer Motion, Recharts
- Data/backend (dev): json-server serving a `db.json` on port 3001
- Exports: SheetJS (`xlsx`) for Summary/Details Excel downloads
- Notifications: `react-hot-toast`
- Icons: `react-icons`
- Dev convention: App tries API first -> `public/db.json` fallback -> `src/data/seed.json` embedded fallback
- Admin mode: Host controls allow editing teams/quizzes/days/scores; changes sent to json-server when online, or saved to local state when offline
- Overrides: An explicit `src/data/teamRoundOverrides.js` provides team-by-quiz override values used when no real member scores exist

---

## Repository structure (important files)

Top-level:
```
package.json
.db.json                # project-level db for json-server (dev API)
public/db.json          # snapshot fallback served by CRA
src/
  App.js
  index.js
  index.css
  data/
    seed.json           # built-in fallback dataset
    teamRoundOverrides.js
  contexts/
    ThemeContext.js
  components/
    Leaderboard.js
    HostControls.js
    TeamAccordion.js
    Analytics.js
```

Note: The actual repo includes additional files and more complete `db.json` (teams, quizzes, rounds, scores). See the data model section below.

---

## Dependencies (from package.json)

Key dependencies used in the project. Use the exact versions to reduce surprises:

- react 18.2.0
- react-dom 18.2.0
- react-scripts 5.0.1
- tailwindcss 3.x
- postcss & autoprefixer
- axios
- json-server 0.17.4
- framer-motion
- react-hot-toast
- react-icons
- recharts
- xlsx

Scripts in `package.json`:
```json
"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build",
  "test": "react-scripts test",
  "eject": "react-scripts eject",
  "server": "json-server --watch db.json --port 3001"
}
```

---

## Data model (db.json)

The json-server `db.json` contains these top-level collections (arrays):
- `days` - objects: { id, name, date }
- `quizzes` - objects: { id, name, dayId }
- `rounds` - objects: { id, name, quizId }
- `teams` - objects: { id, name, teammates: [ { id, name, isLeader, avatar } ] }
- `scores` - objects: { id, memberId, roundId, score }

Important notes about IDs:
- IDs in some files can be strings or numbers (e.g., `"1"` vs `1`). The app normalizes comparisons using `String(...)` so mixed types still match.
- `rounds` links quizzes via `round.quizId`.
- `scores` references `roundId` and `memberId`.

Example snippet:
```json
{
  "teams": [
    { "id": "1", "name": "Hoken", "teammates": [ { "id": "2457348", "name": "Dinesh" } ] }
  ],
  "rounds": [ { "id": 1, "name": "Round 1", "quizId": 1 } ],
  "scores": [ { "id": 1, "memberId": "2457348", "roundId": 1, "score": 70 } ]
}
```

---

## Key runtime behavior

1. Data loading (App.js)
   - On startup, the app attempts to fetch resources from the json-server REST API (http://localhost:3001): `/teams`, `/days`, `/quizzes`, `/rounds`, `/scores`.
   - If that fails, it fetches `/db.json` (served from `public/` by CRA).
   - If the public snapshot has empty arrays, the app falls back to `src/data/seed.json` (embedded last-resort seed).
   - `serverOnline` boolean reflects if json-server reachable.

2. Score resolution (Leaderboard.js)
   - The UI shows per-team, per-round values using `getScoreForRound(teamId, roundId)`.
   - Resolution logic order (stable behavior implemented):
     - If member scores exist for that team & round, compute the average across members and show that (rounded to integer).
     - Otherwise, if `teamRoundOverrides` contains a mapping for (teamName, quizName), use that override value.
     - Otherwise show `-` (or empty in host input mode).
   - This ordering ensures admin edits (member scores) take precedence and are visible immediately.

3. Admin mode / Host controls
   - Toggle `Host Mode` via the button in `App.js`. The authentication modal uses a built-in credential check (email: `admin`, password: `admin@123`).
   - Host controls (component `HostControls`) expose: Add Team, Add Quiz, Add Day.
   - In Host mode, score cells are inputs (type=number, step=1). When editing:
     - If server is online, `updateScore` PATCHes or POSTs to json-server to update `scores` records.
     - If server is offline, updates are applied to local `data` state and saved visibly; a toast warns user that changes are local.
   - While `isEditingScores` is true, live sorting is paused to avoid reordering rows while the admin types.

4. Excel exports
   - Two exports: Summary and Details.
   - Exports build their per-quiz columns using the same visible logic as the UI (overrides used only when no member scores). Totals and averages are aggregated over the per-quiz visible values to match the UI.

5. Visuals & Theme
   - `ThemeContext` provides multiple named themes. Components read `theme.colors.*` CSS class tokens to style elements.
   - Sticky columns for Rank/Team/Average/Total maintained via CSS positioning and z-index.

---

## Files of special importance (what to look at)

- `src/App.js` — app bootstrap, fetchData logic, fallback strategy, exports, view selection, admin toggle and auth modal.
- `src/components/Leaderboard.js` — main table renderer; computes per-round scores, team average/total (derived from per-round visible values), editing handlers (updateScore, addDay, addQuiz, addTeam, update/delete operations), and host controls placement.
- `src/components/HostControls.js` — small admin UI for adding teams/quizzes/days.
- `src/data/teamRoundOverrides.js` — explicit mapping of teamName -> { quizName: score }. Used as a last resort when no member scores exist for a round.
- `src/data/seed.json` — embedded fallback snapshot of data used if public snapshot and API are missing.
- `db.json` (project root) and `public/db.json` — the canonical dev dataset and the CRA-served snapshot respectively.

---

## Rebuild the project from scratch — Step-by-step

This section enables recreating the entire app from an empty directory.

1) Create the base React app (CRA) and install dependencies

```powershell
npx create-react-app live-dashboard
cd live-dashboard
npm install axios framer-motion react-hot-toast react-icons recharts xlsx json-server tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2) Set up Tailwind CSS (tailwind.config.js + index.css) — standard CRA + Tailwind setup.

3) Add `package.json` scripts (if not already present):
- `start` (CRA)
- `server`: `json-server --watch db.json --port 3001`

4) Add data files

- `db.json` (root) — include arrays: `days`, `quizzes`, `rounds`, `teams`, `scores`.
- `public/db.json` — a copy of a snapshot used as a fallback for development when json-server is down.
- `src/data/seed.json` — small embedded dataset as final fallback.
- `src/data/teamRoundOverrides.js` — mapping used only when there are no member scores. Example:

```js
export default {
  "Cucumberz": { "OOPS": 95, "Collections": 65, ... },
  ...
}
```

5) Implement `ThemeContext` as in `src/contexts/ThemeContext.js` (see THIS repo's file for a complete set of theme tokens).

6) Implement core components
- `App.js`: provide fetchData with axios (primary -> public -> seed fallback), manage `hostMode` state and `serverOnline` flag, pass `data` and `updateData` to `Leaderboard`.
- `Leaderboard.js`: implement table layout with sticky columns; `getScoreForRound` (member scores first, then override); `updateScore` that writes to json-server when online or local state when offline; compute team averages/totals from visible per-quiz scores; ensure ID comparisons use `String(...)` to handle mixed types.
- `HostControls.js`, `TeamAccordion.js`, `Analytics.js`: implement per repo behavior (small admin forms and a simple accordion for team details).

7) Ensure id-robustness
- Throughout the code, whenever you compare ids (dayId, quizId, roundId), wrap both sides in `String(...)` to avoid mismatches between numeric and string id types.

8) Add `Toaster` from `react-hot-toast` and wire up success/warning/errors in API flows.

9) Start the app and server in development:

```powershell
# Run json-server in one terminal
npm run server
# Run CRA in another terminal (if port 3000 in use, create .env with PORT=3002)
npm start
```

10) Admin credentials (built-in dev auth)
- Username: `admin`
- Password: `admin@123`

---

## Implementation details and important code contracts

- getScoreForRound(teamId, roundId) => number | '-' (string)
  - Input: team id and round id
  - Output: integer score or '-'
  - Behavior: prefer member scores (take average across teammates); if none, return override value if present; otherwise return '-'.

- updateScore(teamId, roundId, newScore)
  - Finds all member `scores` rows for teammates & round. If present, PATCH each existing score to new value; if none, POST new scores for each teammate.
  - If `serverOnline === false`, modify local `data` state and toast a local-save message.

- Exports
  - Build per-quiz columns by pairing each quiz with its day label.
  - Use `getTeamQuizScore` logic (same visible logic) when constructing Excel rows so the exported files match the UI.

---

## Common issues & troubleshooting

1. Blank columns / missing quizzes
   - Cause: mixed numeric vs string ID types between `quizzes.dayId` and `days.id`. Fix: compare IDs using `String(q.dayId) === String(day.id)`.

2. Admin edits not visible / overrides masking edits
   - Cause: overrides applied before member-scores. Fix: show member-scores first; only use overrides when no member-scores exist.

3. CRA starts on a different port (3000 conflict)
   - Create `.env` in project root with `PORT=3002` and restart CRA.

4. json-server not running or port conflicts
   - Use `npm run server` to start json-server on port 3001. Confirm with `netstat -ano | findstr :3001` or check terminal logs.

5. Exports not matching UI
   - Ensure exports compute per-quiz values using the same getTeamQuizScore logic (prefers member scores, fallback to overrides).

---

## Suggested tests to validate behavior

- Manual test: With json-server running and the provided `db.json`, load the app and assert:
  - All days and quizzes appear in the header.
  - For a team with scores, per-round values are visible and Average/Total compute correctly.
  - Toggle Host Mode, edit a score, and confirm it remains visible and persists when serverOnline is true (and updates db.json when using json-server).
  - When json-server is stopped, editing a score results in a local save (toast informs), and the UI reflects the change.
  - Exports (Summary & Details) download and contain the same numbers as the UI.

- Unit/integration tests (optional): For logic-heavy helpers (getTeamQuizScore, getScoreForRound, getTeamTotals) write unit tests asserting precedence and rounding.

---

## Additional notes for future maintainers

- The code uses a pragmatic override table to fast-prototype user-provided final scores. In a full production redesign, consider storing team-level aggregated scores explicitly in the API to avoid fragile mapping by team name/quiz name.

- Keep ID types consistent. Prefer numeric IDs in `db.json` or consistently use strings across all data sources. The app contains defensive `String(...)` comparisons to accommodate mixed sources.

- Security: the admin auth is intentionally simple for local/dev convenience. Replace with a proper auth flow before any public deployment.

- Persistence of offline changes: currently local-only when server is offline. To durable-queue edits for later sync, implement a background sync queue (localStorage + retry logic) to reconcile local changes with the server when it comes back online.

---

## Quick reference — commands

```powershell
# Install deps
npm install

# Start json-server (dev API)
npm run server

# Start CRA frontend
npm start

# If port 3000 in use, set .env:
# PORT=3002
```

---

## Contact & context

This document was generated to fully describe the LiveDashBoard / Quiz Arena frontend and its local dev API so that an automated tool (or developer) can reproduce the project from scratch. If you feed this file back to the same AI assistant, it has all the necessary design notes, file responsibilities, data models, and key code contracts to recreate the project.


---

End of `PROJECT_RECREATE_GUIDE.md`.
