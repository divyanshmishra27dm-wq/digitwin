# NIIT Digital Twin

**Enterprise Digital Twin Platform — MERN POC**

Turn NIIT's human expertise into an intelligent, conversational Digital Twin.

This is an internal NIIT innovation proof-of-concept. It ships with one seeded, published
Digital Twin — **Divyansh Mishra, Leadership Trainee, NIIT Ltd.** — and a full admin workflow
for creating, curating and publishing more.

---

## 1. What's inside

```
niit-digital-twin/
├── client/     React + Vite frontend (plain CSS, no Tailwind)
├── server/     Node + Express + MongoDB API
└── .env.example
```

**Stack:** React, Vite, React Router, Axios, Lucide icons on the frontend · Node, Express,
Mongoose, JWT, bcrypt on the backend · MongoDB for storage. No Next.js, no Tailwind, per spec.

---

## 2. Setup

### Prerequisites
- Node.js 18+
- A MongoDB instance (local `mongod`, or a free Atlas cluster)

### Install

```bash
npm run install:all
```

This installs dependencies **only inside `client/` and `server/`** — there is no root
`node_modules`. `npm run dev` uses `npx concurrently` to run both dev servers together, which
`npx` fetches on the fly rather than installing as a project dependency.

### Configure environment

Copy the example env file and fill in real values:

```bash
cp .env.example server/.env
```

At minimum, set:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/niit-digital-twin
JWT_SECRET=some-long-random-string
ADMIN_EMAIL=admin@niit.com
ADMIN_PASSWORD=ChangeMe123!
```

Leave `LITELLM_API_KEY` empty to run in **Demo Mode** — the whole product works end-to-end
with curated, hand-written answers and zero external API calls (see §5).

### Seed the database

```bash
npm run seed
```

This creates:
- An **admin** user (from `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- An optional **demo employee** user (from `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`, if set)
- The **Divyansh Mishra** Digital Twin, fully configured and **published**, with 7 knowledge entries

### Run it

```bash
npm run dev
```

This starts the Vite frontend on **http://localhost:5173** and the Express API on
**http://localhost:5000** concurrently (Vite proxies `/api` to the server).

---

## 3. Logging in

- **Admin** → whatever you set as `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- **Employee** → whatever you set as `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` (or register a
  new account from the API — there's no self-serve signup UI in this POC by design, since the
  spec scopes registration out of the demo flow)

---

## 4. The demo journey

1. **Admin** logs in → dashboard shows 1 Twin, 1 published.
2. Open **Divyansh Mishra** → review profile, expertise, knowledge, persona.
3. Click **Preview** → ask "What projects has Divyansh worked on?" and "Why wasn't the LLM
   Council just a summarization tool?" → see sources and confidence render.
4. **Publish** (already published by the seed script, but you can unpublish/republish to show
   the flow).
5. Log out, log in as the **employee** user → open **Digital Twins** → see Divyansh, published.
6. Open the Twin → ask "How does Divyansh approach a new AI problem?" → documented, high
   confidence, sources shown.
7. Ask something undocumented, e.g. "What was Divyansh's biggest failure at NIIT?" → the Twin
   correctly says it isn't documented rather than inventing an answer.
8. Click **Ask Divyansh** (human escalation) → submit a question.
9. Back in **admin** → **Escalations** → see the submitted request.

---

## 5. Demo Mode vs. Live Mode

The AI layer (`server/services/aiService.js`) talks to NIIT's **LiteLLM proxy** (not OpenAI
directly) and checks for `LITELLM_API_KEY` at request time:

- **Not set → Demo Mode.** Responses come from `server/services/demoService.js`, a curated
  set of Q&A written in Divyansh's documented voice. Anything outside that set correctly
  returns "I don't have enough documented information…" — the product never hallucinates,
  with or without a real LLM behind it. A `DEMO MODE` pill appears in the sidebar and on the
  admin Settings page.
- **Set → Live Mode.** The server builds a dynamic system prompt per Twin
  (`server/services/personaService.js`) from retrieved knowledge
  (`server/services/retrievalService.js`), then POSTs to
  `${LITELLM_BASE_URL}/chat/completions` with `model: LITELLM_MODEL` (defaults to
  `azure-gpt-l1`), and validates the structured JSON response before returning it. If the call
  fails for any reason, it falls back to Demo Mode gracefully rather than erroring out.

Relevant env vars (`server/.env`):

```env
LITELLM_BASE_URL=https://litellm.niit.com/v1
LITELLM_API_KEY=your-key-here
LITELLM_MODEL=azure-gpt-l1
```

---

## 6. Creating your own Digital Twin

As an admin: **Digital Twins → Create Twin** walks through the 6-step wizard from the spec —
Identity → Expertise → Knowledge → Persona → Preview → Publish. Each step saves to the
database as you go, so you can back out and resume via **Continue Editing** on a draft.

If you want real content to seed a Twin's knowledge base (rather than the placeholder-free
templates the wizard ships empty), see the knowledge-entry template format documented inline
in `server/seed/seed.js` — every field there (`title`, `category`, `summary`, `content`,
`tags`, `source`) maps 1:1 to what the wizard's Knowledge step and the admin Knowledge Library
expect.

---

## 7. Security notes

- Passwords are hashed with bcrypt; sessions are JWTs (7-day expiry).
- Every admin-only endpoint is protected by both `authenticate` and `requireAdmin` middleware
  **on the server** — the frontend hiding a button is not the security boundary.
- Chat and auth endpoints are rate-limited (`express-rate-limit`).
- No API keys are ever sent to the frontend; the LiteLLM call happens entirely server-side.
- `.env` is git-ignored; nothing is hardcoded.

---

## 8. Final quality checklist

```
✓ npm run dev works
✓ MongoDB connects from MONGODB_URI
✓ Admin login works
✓ Employee login works
✓ Admin routes are protected server-side (JWT + role check)
✓ Employees cannot create/edit/publish Twins (backend-enforced, not just hidden UI)
✓ Admin can create, save as draft, preview, and publish a Twin
✓ Published Twins appear to users; unpublished ones do not
✓ Knowledge CRUD works (wizard + standalone Knowledge Library)
✓ Persona configuration works
✓ Chat works with sources, response type, and confidence
✓ Demo mode works with zero external dependencies
✓ Live mode works when LITELLM_API_KEY is set, with graceful fallback on failure
✓ Undocumented questions return "insufficient information," never a fabricated answer
✓ Human escalation works end-to-end (chat → modal → admin Escalations)
✓ Conversation history works
✓ Analytics works
✓ Responsive down to tablet/mobile
✓ No Tailwind, no Next.js, no hardcoded credentials
```

---

**NIIT Internal Innovation POC** — seed data is clearly identified as such; no fabricated
employee profiles, metrics, or achievements are represented as real.
