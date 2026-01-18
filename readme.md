# Trustless Agent

**Trustless Agent** is a local demo showcasing agentic commerce: an AI agent analyzes user input, determines transparent pricing using Gemini, and—when required—settles payments autonomously in USDC using Circle Developer-Controlled Wallets on Arc Testnet.
# Trustless Agent

**Trustless Agent** is a local demo showcasing agentic commerce: an AI agent analyzes user input, determines transparent pricing using Gemini, and—when required—settles payments autonomously in USDC using Circle Developer-Controlled Wallets on Arc Testnet.

The system is **trustless by design**: all pricing and payment guardrails are enforced server-side, ensuring deterministic financial behavior even though the AI is probabilistic.

---

## ✨ Features

- **AI-Driven Pricing** — Uses Gemini to classify task complexity and suggest pricing.
- **Trustless Enforcement** — Backend enforces pricing rules regardless of AI output.
- **On-Chain Settlement** — Automated USDC transfers via Circle wallets on Arc Testnet.
- **Balances Endpoint** — Inspect agent and merchant wallet balances.
- **Simple Local Demo** — Minimal frontend + Node.js backend.

---

## 🧱 Architecture Overview

```
[User Browser]
	|
	v
[Frontend]  (frontend/index.html, frontend/app.js)
	|
	v
[Backend]   (backend/src/server.js)
	├─ Gemini (backend/src/gemini.js)        # pricing, analysis
	├─ Pricing Guardrails (backend/src/pricing.js)
	└─ Circle helpers (backend/src/circle.js) # balances + transfers
	|
	v
[Arc Testnet / Circle on-chain settlement]
```

**Key principle:**
AI decides and explains pricing, but the backend enforces payments and controls wallets.

---


## 📁 Repository Structure

```
trustless-agent/
├─ commands.txt
├─ readme.md
├─ backend/
│  ├─ .env
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ node_modules/
│  ├─ scripts/
│  │  ├─ init_circle.js
│  │  └─ make_entity_ciphertext.js
│  └─ src/
│     ├─ circle.js        # Circle wallet + transfer logic
│     ├─ gemini.js        # Gemini pricing & analysis
│     ├─ pricing.js       # Guardrails & enforcement
│     ├─ server.js        # API server
│     └─ utils.js
└─ frontend/
	├─ app.css
	├─ app.js
	└─ index.html
```

---

## ⚙️ Environment & Configuration

Create a `.env` file inside the `backend/` folder (or set the environment variables in your environment) with the following keys. **Never** commit secrets to git.

- `CIRCLE_API_KEY` — Circle API key used for REST calls and SDK operations
- `CIRCLE_AGENT_WALLET_ID` — Wallet ID for the agent (payer)
- `CIRCLE_MERCHANT_WALLET_ID` — Wallet ID for the merchant (recipient)
- `CIRCLE_BLOCKCHAIN` — blockchain identifier (e.g. `ARC-TESTNET`)

The backend expects Node.js 18+ because it uses the built-in `fetch` and ES module features.

## ▶️ Running Locally

1. Install backend dependencies

```bash
cd backend
npm install
```

2. Start the backend

```bash
node src/server.js
```

The backend serves the API on `http://localhost:3001` by default.

3. Open the frontend

Open `frontend/index.html` in your browser (or serve the `frontend` folder with a static server). The frontend calls the backend endpoints on `http://localhost:3001`.

## 🔌 API Endpoints

- `GET /wallets/balances`
	- Purpose: Returns both agent and merchant wallet balances using Circle REST.
	- Response: `{ agent: <circle-response>, merchant: <circle-response> }`

- `POST /quote`
	- Purpose: Returns a price quote for a given `text` payload. The backend calls Gemini and returns structured pricing.
	- Body: `{ "text": "..." }`

- `POST /run`
	- Purpose: Executes the analysis and—if payment is required—attempts to transfer USDC from the agent wallet. Returns analysis and transaction details.
	- Body: `{ "text": "..." }`

## Examples

Check balances (shell):

```bash
curl http://localhost:3001/wallets/balances
```

Get a quote:

```bash
curl -X POST http://localhost:3001/quote \
	-H "Content-Type: application/json" \
	-d '{"text":"Summarize the benefits of switching to USDC payments."}'
```

Run + Pay:

```bash
curl -X POST http://localhost:3001/run \
	-H "Content-Type: application/json" \
	-d '{"text":"Short technical analysis: Which payment method should a small business choose?"}'
```

## Implementation Notes

- The code includes a compatibility fix for some Circle SDK builds which expect a `fee.config` property; the transfer helper supplies a minimal `fee` object to avoid runtime TypeErrors.
- Gemini outputs may be malformed or truncated; `backend/src/gemini.js` contains tolerant parsing and extraction helpers to recover useful fields.
- The balances endpoint uses Circle REST for robustness and to avoid SDK version mismatches.

## Troubleshooting

- If balances are not visible in the frontend:
	1. Confirm the backend is running and reachable: `node backend/src/server.js`.
	2. From the same machine, hit the balances endpoint: `curl http://localhost:3001/wallets/balances` — you should receive valid JSON.
	3. Open browser DevTools → Console and Network tabs; inspect any errors and the `/wallets/balances` request/response.

- If Circle requests fail with auth errors, check `CIRCLE_API_KEY` and wallet IDs.

## Extending

- Add persistence (database) to keep historical runs and transactions.
- Replace the static frontend with a modern SPA (React/Vite) for better UX.
- Add tests around pricing rules in `backend/src/pricing.js` to lock expected enforcement behavior.

## License

Add a `LICENSE` file to choose an explicit license (MIT recommended for permissive use).

---

If you'd like, I can now:


Tell me which next step you prefer.
If you'd like, I can now:

- generate a `README.md` at the repo root instead of `readme.md`,
- or open and amend `backend/src/server.js`/`frontend/app.js` to improve error reporting for balances.

Tell me which next step you prefer.