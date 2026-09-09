# NCERT Interactive Quiz Bank

A starter full-stack app: Class → Subject → Chapter cascading filters, JWT-protected quiz API, and a scored quiz UI.

## Backend

```bash
npm install
cp .env.example .env   # set a real random JWT_SECRET
npm start
```
Runs on http://localhost:5000

## Frontend

`src/App.jsx` is written as a React component (Vite or Create React App both work). It expects Tailwind CSS to be set up in the project, and assumes the backend is reachable at `http://localhost:5000/api` (change `API_BASE` in `App.jsx` if you deploy the backend elsewhere).

```bash
npm create vite@latest ncert-quiz-frontend -- --template react
cd ncert-quiz-frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
# copy src/App.jsx from this project over the generated one
npm run dev
```

## What's changed from a quick prototype to something safer

- **Passwords are hashed with bcrypt** before storage/comparison — the original draft stored and compared plain-text passwords, which is not safe even for a demo people will actually use.
- **JWT_SECRET now comes from an environment variable**, not a hardcoded string in the source — hardcoded secrets get committed to git by accident constantly.

## Still worth doing before real users touch this

- **Persistent storage.** The user list is a plain in-memory array — it resets to empty every time the server restarts, and every deploy or crash logs everyone out and wipes accounts. Swap in Postgres, MongoDB, or Supabase.
- **Input validation.** Add checks for email format and a minimum password length on `/api/register`.
- **Rate limiting on `/api/login`** to slow down brute-force guessing.
- **HTTPS in production** so the JWT and password never travel in plaintext over the network.
