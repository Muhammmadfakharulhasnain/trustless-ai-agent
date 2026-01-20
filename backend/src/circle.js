import fetch from "node-fetch"; // Node 18+ has fetch built-in, optional
import dotenv from "dotenv";
dotenv.config();

const CIRCLE_API = "https://api-sandbox.circle.com/v1"; // Sandbox/TESTNET
const API_KEY = process.env.CIRCLE_API_KEY?.trim();
if (!API_KEY) throw new Error("Missing CIRCLE_API_KEY in .env");

export async function getWalletBalances(walletId) {
  const res = await fetch(`${CIRCLE_API}/wallets/${walletId}/balances`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  if (!res.ok) throw new Error(`Wallet ${walletId} fetch failed: ${res.status}`);
  return res.json();
}

export async function getWallet(walletId) {
  const res = await fetch(`${CIRCLE_API}/wallets/${walletId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  if (!res.ok) throw new Error(`Wallet ${walletId} fetch failed: ${res.status}`);
  return res.json();
}

// ✅ Get both agent + merchant balances
export async function getAgentAndMerchantBalancesRest() {
  const agentId = process.env.CIRCLE_AGENT_WALLET_ID?.trim();
  const merchantId = process.env.CIRCLE_MERCHANT_WALLET_ID?.trim();
  if (!agentId || !merchantId)
    throw new Error("CIRCLE_AGENT_WALLET_ID or CIRCLE_MERCHANT_WALLET_ID missing in .env");

  // Fetch both in parallel
  const [agent, merchant] = await Promise.all([
    getWalletBalances(agentId).catch(e => ({ error: e.message })),
    getWalletBalances(merchantId).catch(e => ({ error: e.message }))
  ]);

  return { agent, merchant };
}

// Optional: simple USDC transfer
export async function transferUsdc({ fromWalletId, toAddress, amountUsdc }) {
  const res = await fetch(`${CIRCLE_API}/transfers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source: { type: "wallet", id: fromWalletId },
      destination: { type: "blockchain", address: toAddress },
      amount: { amount: amountUsdc.toString(), currency: "USD" }
    })
  });
  if (!res.ok) throw new Error(`Transfer failed: ${res.status}`);
  return res.json();
}

export async function getTransaction(txId) {
  const res = await fetch(`${CIRCLE_API}/transfers/${txId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  if (!res.ok) throw new Error(`Transaction ${txId} fetch failed: ${res.status}`);
  return res.json();
}
