LiveDashBoard - Express + MongoDB backend

This small server replaces the dev json-server and persists `public/db.json` into MongoDB collections.

Quick start (local MongoDB):

1. Install dependencies

   cd server
   npm install

2. Import data from `public/db.json` into MongoDB (defaults to mongodb://localhost:27017/live_dashboard):

   npm run import

3. Start the API server:

   npm start

By default the server listens on port 4000. In the frontend set the environment variable `REACT_APP_API_URL` to `http://localhost:4000` (or the deployed server URL).

If you want the import to overwrite existing data, the `import` script already clears existing collections before inserting.

If you want me to map the whiteboard image scores into the DB automatically, tell me whether you want me to:

- overwrite all existing `scores` with the values from the whiteboard (you must confirm the column ordering), or
- only upsert scores for specific teams/quizzes you provide as CSV or JSON.

I'll prepare an automated mapping if you provide the mapping (CSV or JSON) or confirm that column order in `public/db.json` matches the whiteboard left-to-right order.
