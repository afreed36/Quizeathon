# LiveDashBoard (Quiz Arena) — Beginner-friendly Guide

This document explains the LiveDashBoard project from a beginner's perspective. It covers what the project is, the technologies used, how data flows through the app, how to run it locally, and a guided walkthrough of the important files and functions. At the end there are common interview-style talking points and simple exercises to help you learn the codebase.

---

## 1. What is this project?

LiveDashBoard (a.k.a. Quiz Arena) is a small React-based frontend application that displays quiz results for teams and allows an admin (host) to edit scores, manage teams/quizzes/days, and export reports. During development it uses a simple local REST API powered by `json-server`.

Goals of the app:
- Show a leaderboard with per-team, per-quiz scores, and team averages/totals.
- Allow an admin to toggle Host Mode and edit scores directly.
- Provide fallbacks when the local API is offline (serve a public snapshot or embedded seed data).
- Export summary and details to Excel using SheetJS.
- Provide analytics charts for team/quiz performance.

This project is great to learn common frontend patterns: fetching data, editing with optimistic/local updates, table display, charts, and export functionality.

---

## 2. Technologies used (high-level)

- React 18 (create-react-app)
- Tailwind CSS for styling
- Framer Motion for small animations
- Recharts for charts (Analytics)
- axios for API calls
- json-server for a simple local REST API (dev)
- react-hot-toast for toasts/notifications
- react-icons for icons
- xlsx (SheetJS) for Excel exports

Package versions are pinned in `package.json`. Use those versions to avoid surprises.

---

## 3. How data is modeled

Top-level entities in `db.json` (dev dataset):

- days: { id, name, date }
- quizzes: { id, name, dayId }
- rounds: { id, name, quizId }
- teams: { id, name, teammates: [ { id, name, isLeader, avatar } ] }
- scores: { id, memberId, roundId, score }

Important: IDs can be numbers or strings in various files (e.g., `"1"` vs `1`). The app often uses `String(...)` comparisons to handle mixed types.

Additionally, `src/data/teamRoundOverrides.js` stores a mapping of teamName -> quizName -> score that the UI can use when there are no member scores available. This helps show expected scoreboard values even when the raw per-member scores are missing.

---

## 4. How the app initializes and loads data

Entry point: `src/App.js`

- On app start, `fetchData()` tries to fetch all resources from the local API (json-server at `http://localhost:3001`).
- If the API is unreachable, the app fetches `/db.json` from `public/` (served by CRA).
- If the public snapshot is empty, the app falls back to `src/data/seed.json` (embedded seed) to guarantee the UI renders.
- `serverOnline` is set depending on whether the fetch to json-server succeeded.

This layered fallback ensures the UI still works even when the local backend is not running.

---

## 5. Key UI components and responsibilities

Files you should look at first:
- `src/App.js` — app bootstrap, data fetching, exports, admin toggle, overall state.
- `src/components/Leaderboard.js` — main scoreboard table, admin editing flows, score calculations.
- `src/components/HostControls.js` — add team/quiz/day UI used by admin.
- `src/components/Analytics.js` — charts and analytics.
- `src/contexts/ThemeContext.js` — theme tokens used across the app.
- `src/data/teamRoundOverrides.js` — user-provided score overrides.

What each part does (concise walkthrough):

- Leaderboard:
  - Renders sticky columns (Rank, Team, Average, Total) and a dynamic set of quiz columns built from days->quizzes->rounds.
  - `getScoreForRound(teamId, roundId)` returns the team score for a round by: (1) checking member scores and averaging them; (2) falling back to `teamRoundOverrides` when there are no member scores; (3) returning `-` when nothing found.
  - Admin inputs: in Host Mode, each round cell becomes a numeric input. Editing triggers `updateScore(teamId, roundId, newScore)` which either updates existing per-member score records (PATCH) or creates new ones (POST). When server offline, updates are applied only to local state and the user is warned.
  - After successful server writes, the component calls `refreshData()` (the App's `fetchData`) to re-load canonical server state so all views show the updated data.

- Analytics:
  - Uses Recharts to show Team Averages, Quiz Averages, Top 5 teams, and a Score Distribution pie chart.
  - Filters for day, quiz, and team are provided; they normalize ID comparisons to handle string/number mismatches.

- Exports (App.js):
  - `exportSummaryToExcel` and `exportDetailsToExcel` build sheets using the same visible logic as the UI: per-quiz values use the override-aware lookup so exported values match the table.

---

## 6. Key functions & code contracts (explain like I'm learning)

- getScoreForRound(teamId, roundId) -> number | '-' 
  - Inputs: team identifier, round identifier
  - Behavior:
    1. Find all member scores (data.scores where score.roundId matches and memberId belongs to team.teammates).
    2. If found, average them and return an integer.
    3. Else, check `teamRoundOverrides[teamName][quizName]` (normalized lookup) and return that if present.
    4. Else return `-`.

- updateScore(teamId, roundId, newScore)
  - Finds existing per-member score records for that team & round. If found, PATCH each record with the new score. If none found, POST new score records for each team member.
  - If the API is down, it updates local `data` state only and displays a toast warning.
  - After successful server writes, it calls `refreshData()` to reload authoritative data.

- fetchData()
  - Fetches /teams, /days, /quizzes, /rounds, /scores from json-server. On failure falls back to `/public/db.json` and then `seed.json`.

---

## 7. Common pitfalls and fixes (what to watch out for)

- Mixed ID types: some sample data uses string IDs and others numeric IDs. Always compare IDs using `String(a) === String(b)` to avoid mismatches.
- Overrides masking edits: ensure member-score checks are done before applying overrides so admin edits aren't hidden.
- Offline edits: updates made when the API is down are local-only and must be synchronized manually (or by re-enabling the server and re-applying changes). The app notifies the user when changes are saved locally.

---

## 8. How to run the project locally (practical steps)

1. Install dependencies
```powershell
npm install
```

2. Start the local json-server in a terminal (this provides REST endpoints at port 3001)
```powershell
npm run server
```

3. Start the frontend
```powershell
npm start
```
- If port 3000 is busy, add a `.env` file with `PORT=3002`.

4. Open `http://localhost:3000` (or the port you set) and explore.

Admin credentials (dev):
- Email: `admin`
- Password: `admin@001`

---

## 9. Interview-style bullets: what to say and demonstrate

If you're asked about this project in an interview, you can highlight:
- Data fetching strategy with graceful fallbacks (API -> public snapshot -> embedded seed) to handle offline dev environments.
- How admin edits are handled: optimistic/local updates when offline, server writes when online, and subsequent data refresh to keep the UI consistent.
- Design choices: using a small `teamRoundOverrides` mapping for quick visual correctness vs. normalizing all member scores in the API — mention tradeoffs.
- Resilience: defensive `String(...)` comparisons to handle mixed ID types in JSON sources.
- Export correctness: Excel exports use the same visible logic as the UI, ensuring exports match what users see.

Sample verbal answers:
- Q: "How do you ensure the UI works when the server is down?"
  - A: "We fall back to a public snapshot served by CRA and then an embedded seed, and we store edits locally when offline. The UI shows a toast to inform the admin about local saves."

- Q: "How do updates reach other clients?"
  - A: "After successful server writes we re-fetch the authoritative data. For real-time sync across clients we could add polling or WebSockets; currently you need to refresh other clients or add a polling interval."

---

## 10. Simple exercises to learn the codebase

1. Add automated tests for `getScoreForRound` covering: (a) member scores exist; (b) no member scores but override exists; (c) neither exists.
2. Implement a small polling mechanism in `App.js` that periodically calls `fetchData()` every 10 seconds (configurable) so other tabs reflect server updates automatically.
3. Improve Save Changes batching: when the admin clicks Save, send all changed cells in a single batched request (or sequential requests but call `refreshData()` only once at the end).
4. Add unit tests for Analytics helpers. Mock `data` with mixed ID types and ensure charts compute the expected numbers.

---

## 11. Where to look in code for specific tasks

- Fix ID issues: `src/components/Leaderboard.js` and `src/components/Analytics.js` — look for comparisons like `q.dayId === day.id` and change to `String(q.dayId) === String(day.id)`.
- Score update logic: `src/components/Leaderboard.js` — `updateScore` and `getScoreForRound`.
- Data fetching & fallbacks: `src/App.js` — `fetchData()`.
- Exports: `src/App.js` — `exportSummaryToExcel`, `exportDetailsToExcel`.

---

## 12. Final tips for beginners

- Start by running the app and exploring `db.json` in a JSON editor. See how quizzes, rounds, teams, and scores connect.
- Use console.log judiciously in `getScoreForRound` and `updateScore` to step through the flow when editing a score.
- When debugging missing UI data, suspect ID mismatches first — the app uses many cross-joins by id.

---

If you want, I can now:
- Convert this `read.md` into `README.md` replacing your TODO, or
- Create small unit tests for the key helpers to further help your learning.

Tell me which next step you'd like and I will implement it. Good job getting this far — this is a great project to learn full-stack data flows and resilience patterns.