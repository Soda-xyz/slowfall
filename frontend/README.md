# Slowfall — Frontend (React + TypeScript + Vite)

A compact frontend built with React, TypeScript and Vite. This README is intentionally minimal — it points to the primary tools and notes the one important runtime env for integrations with the backend.

What this frontend contains

- React (UI)
- TypeScript (static types)
- Vite (dev server + build)
- Mantine (UI components)
- Vitest (unit tests)

Key dependency versions (read from `frontend/package.json`)

- react: ^19.2.0
- typescript: ~5.9.3
- vite: ^7.2.4
- @mantine/core / @mantine/hooks / @mantine/notifications: ^8.3.9
- vitest: ^4.0.14

Notes about API base & cookies

- The frontend reads `VITE_API_BASE_URL` at runtime to compose backend calls. For production builds this should be empty so the app uses relative paths (for example `/web-auth/login`, `/api/...`). For local development set it to your backend host (for example `http://localhost:8080`). See Vite env docs: https://vitejs.dev/guide/env-and-mode.html
- The backend uses an HttpOnly refresh cookie for authentication. Login and refresh requests must be sent with `credentials: 'include'` so the browser stores/sends the cookie. The frontend's shared fetch helper is already configured to use `credentials: 'include'`.

Further reading

- React: https://react.dev/
- Vite envs: https://vitejs.dev/guide/env-and-mode.html
- Fetch API (credentials): https://developer.mozilla.org/docs/Web/API/Fetch_API

If you want me to add back a short commands section (install, dev, build, test) I can — but per your request I left the commands list out to keep this document concise.

# Formatters & Linters — Frontend

Copyable commands (run from `frontend/`):

```bash
# install deps (if needed)
npm install
```

```bash
# lint (ESLint)
npm run lint
```

```bash
# run ESLint autofix across the project
npx eslint --fix .
```

```bash
# format with Prettier (auto-write)
npx prettier --write .
```

> See the rest of this README below for project context and notes.
