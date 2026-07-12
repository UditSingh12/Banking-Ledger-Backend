# Backend Ledger — Frontend

> Premium banking-style React frontend for the Backend-Ledger API. Built with a "private ledger" aesthetic — Ink/Paper/Brass palette, Fraunces serif display type, IBM Plex Mono for all numeric data, and an animated double-entry strip hero.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Architecture Overview](#architecture-overview)
4. [Pages & Routes](#pages--routes)
5. [Design System](#design-system)
6. [Environment Variables](#environment-variables)
7. [Setup & Running](#setup--running)
8. [API Routes — Wired vs Pending](#api-routes--wired-vs-pending)
9. [CORS Requirement on Backend](#cors-requirement-on-backend)
10. [Auth Model — How Cookies Work](#auth-model--how-cookies-work)

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v4 (`@theme` CSS config, no `tailwind.config.js`) |
| Routing | React Router v6 |
| HTTP | Axios (`withCredentials: true`) |
| Server State | TanStack Query (`@tanstack/react-query`) |
| Client State | Zustand + `persist` middleware |
| Form Validation | React Hook Form + Zod + `@hookform/resolvers/zod` |
| Animations | Framer Motion |
| Icons | lucide-react |
| Fonts | Fraunces (display) · IBM Plex Sans (body) · IBM Plex Mono (data) |

---

## Folder Structure

```
Backend-Ledger-Frontend/
│
├── .env                      # Local environment (gitignored)
├── .env.example              # Safe template
├── index.html                # Entry HTML — loads Google Fonts
├── vite.config.js            # Vite + Tailwind v4 plugin
├── package.json
└── README.md
│
└── src/
    │
    ├── index.css             # Tailwind v4 @import + @theme design tokens
    ├── main.jsx              # React root — wraps with QueryClientProvider
    ├── App.jsx               # BrowserRouter + Routes
    │
    ├── api/                  # Axios layer
    │   ├── axios.js          # Base instance (withCredentials, 401 interceptor)
    │   ├── auth.api.js       # register(), login(), logout() stub
    │   └── account.api.js    # createAccount(), getAccounts()
    │
    ├── store/
    │   └── useAuthStore.js   # Zustand + persist (name, email, isAuthenticated only)
    │
    ├── lib/
    │   └── schemas.js        # Zod: loginSchema, registerSchema, createAccountSchema
    │
    ├── hooks/
    │   ├── useAuth.js        # useLogin(), useRegister() — TanStack Query mutations
    │   └── useAccounts.js    # useAccounts(), useCreateAccount() — TanStack Query
    │
    ├── routes/
    │   └── ProtectedRoute.jsx # Redirects to /auth if not authenticated
    │
    ├── pages/
    │   ├── LandingPage.jsx   # / — Hero + Features + Footer
    │   ├── AuthPage.jsx      # /auth — Login / Sign Up tabs
    │   └── DashboardPage.jsx # /dashboard — Account grid + Create modal
    │
    └── components/
        │
        ├── ui/               # Reusable primitives (plain Tailwind, no library)
        │   ├── Button.jsx    # primary | secondary | ghost | danger variants
        │   ├── Input.jsx     # label, error, hint, accessible aria
        │   ├── Modal.jsx     # Framer Motion entry/exit, Escape key, backdrop click
        │   └── Badge.jsx     # ACTIVE (green) | FROZEN (blue) | CLOSED (rose)
        │
        ├── landing/
        │   ├── Navbar.jsx    # Fixed, blurred background, brass logo mark
        │   ├── Hero.jsx      # Ruled-paper background + animated double-entry strip
        │   ├── Features.jsx  # Staggered feature grid (6 actual backend features)
        │   └── Footer.jsx    # Brand mark + nav links
        │
        ├── auth/
        │   └── AuthForm.jsx  # Tab toggle (Log in / Sign up), validation, API errors
        │
        └── dashboard/
            ├── AccountCard.jsx        # Account ID, currency, status badge, opened date
            └── CreateAccountModal.jsx # Currency selector, idempotency key, success state
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        React App                             │
│                                                              │
│  ┌────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │   Pages    │──▶│  Components  │──▶│   UI Primitives  │   │
│  │  Landing   │   │   Landing    │   │  Button / Input  │   │
│  │  Auth      │   │   Auth       │   │  Modal / Badge   │   │
│  │  Dashboard │   │   Dashboard  │   └──────────────────┘   │
│  └────────────┘   └──────────────┘                          │
│        │                                                     │
│        ▼                                                     │
│  ┌──────────────────────────────────────┐                   │
│  │           Hooks Layer                │                   │
│  │  useAuth.js  │  useAccounts.js       │                   │
│  │  (TanStack Query mutations/queries)  │                   │
│  └──────────────────────────────────────┘                   │
│        │                          │                         │
│        ▼                          ▼                         │
│  ┌────────────┐           ┌───────────────┐                 │
│  │  Zustand   │           │  API Layer    │                 │
│  │ Auth Store │           │  axios.js     │                 │
│  │ (persist)  │           │  auth.api.js  │                 │
│  └────────────┘           │ account.api.js│                 │
│                           └───────────────┘                 │
└──────────────────────────────────────────────────────────────┘
                                    │
                    withCredentials: true (cookies)
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Backend-Ledger API       │
                    │  http://localhost:3000    │
                    └───────────────────────────┘
```

---

## Pages & Routes

| Path | Component | Access | Description |
|---|---|---|---|
| `/` | `LandingPage` | Public | Hero + Features + Footer |
| `/auth` | `AuthPage` | Public (redirects if logged in) | Login / Sign Up tabs |
| `/dashboard` | `DashboardPage` | **Protected** | Account grid + create modal |
| `*` | `LandingPage` | Public | Catch-all redirect |

### Route Protection

`ProtectedRoute` checks `useAuthStore.isAuthenticated`. On `false`, it `<Navigate to="/auth" replace />`.

---

## Design System

All tokens are defined in `src/index.css` using Tailwind v4's `@theme` block.

### Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-ink` | `#0B0E13` | Primary dark background |
| `--color-ink-soft` | `#161B24` | Card / panel backgrounds |
| `--color-paper` | `#EDEAE2` | Primary text, light surfaces |
| `--color-brass` | `#B68D40` | CTAs, highlights, focus rings |
| `--color-ledger` | `#17392E` | Positive / credit indicators |
| `--color-debit` | `#9B3B3B` | Errors, negative values (used sparingly) |
| `--color-slate` | `#6B7280` | Muted / secondary text |

### Typography

| Role | Font | Used For |
|---|---|---|
| Display | Fraunces (serif) | `h1`, `h2` headings — editorial, warm |
| Body | IBM Plex Sans | All body copy, labels, UI text |
| Data | IBM Plex Mono | Account IDs, balances, amounts, badges |

### Signature Element — Ledger Hero

The hero section uses:
- A `repeating-linear-gradient` to create thin horizontal ruled lines (like ledger paper)
- An animated **double-entry strip** where DR/CR entries appear one at a time at 900ms intervals
- A running balance counter that updates with each entry
- `useReducedMotion()` — if the user prefers reduced motion, all entries appear immediately

---

## Environment Variables

```bash
cp .env.example .env
```

`.env.example`:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

The Axios base instance reads `import.meta.env.VITE_API_BASE_URL` and falls back to `http://localhost:3000/api`.

---

## Setup & Running

```bash
# Install dependencies
npm install

# Start dev server (Vite, port 5173)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## API Routes — Wired vs Pending

| Method | Route | Status | Frontend Behaviour |
|---|---|---|---|
| `POST` | `/api/auth/register` | ✅ Wired | Registers user, sets cookie, navigates to dashboard |
| `POST` | `/api/auth/login` | ✅ Wired | Logs in, sets cookie, navigates to dashboard |
| `POST` | `/api/account` | ✅ Wired | Creates account; shown immediately via optimistic local state |
| `GET` | `/api/account` | ⏳ Backend pending | Query runs but error is caught silently; inline notice shown instead of crash |
| `POST` | `/api/auth/logout` | ⏳ Backend pending | Logout clears Zustand store + redirects to `/`; cookie cleared by backend once route exists |

---

## CORS Requirement on Backend

> **The backend must enable CORS with `credentials: true` for cookies to work.**

Without this, the browser will silently strip the `Set-Cookie` header from cross-origin responses and every request will be treated as unauthenticated.

Install `cors` on the backend:
```bash
npm install cors
```

Add to `Backend-Ledger/src/app.js` **before** route registration:
```js
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',   // Vite dev URL
  credentials: true,                  // Allow cookies cross-origin
}));
```

For production, set `origin` to your deployed frontend domain.

---

## Auth Model — How Cookies Work

```
1. User logs in  →  POST /api/auth/login
                 ←  Set-Cookie: token=<JWT>; HttpOnly; SameSite=Lax

2. JWT lives in HTTP-only cookie (invisible to JS)

3. Every subsequent Axios request automatically sends the cookie
   because the instance is configured with withCredentials: true

4. On 401 response  →  Axios interceptor clears Zustand store
                    →  Redirects user to /auth

5. Zustand stores ONLY: { name, email, isAuthenticated }
   — Never the JWT itself
```

This means:
- ✅ JWT cannot be stolen via XSS (it's HTTP-only)
- ✅ No `localStorage` token management
- ✅ Session persists across page refreshes (cookie + Zustand `persist`)
- ✅ 401 anywhere in the app automatically logs the user out
