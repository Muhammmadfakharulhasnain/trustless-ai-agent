const API = "https://trustless-ai-agent-production-9860.up.railway.app";

const el = (id) => document.getElementById(id);

const btnQuote = el("btnQuote");
const btnRun = el("btnRun");
const btnClear = el("btnClear");

const textArea = el("text");
const quoteLine = el("quoteLine");

const status = el("status");
const mComplexity = el("mComplexity");
const mPrice = el("mPrice");
const mPaid = el("mPaid");
const analysis = el("analysis");
const txId = el("txId");
const txLink = el("txLink");

const history = el("history");

let historyItems = [];

function setLoading(isLoading, label = "Working...") {
  btnQuote.disabled = isLoading;
  btnRun.disabled = isLoading;
  status.textContent = isLoading ? label : "Idle";
  status.className = isLoading ? "status" : "status muted";
}

function resetOutput() {
  mComplexity.textContent = "—";
  mPrice.textContent = "—";
  mPaid.textContent = "—";
  analysis.textContent = "—";
  txId.textContent = "—";
  txLink.textContent = "—";
  txLink.href = "#";
  txLink.className = "mono muted";
}

function renderHistory() {
  history.innerHTML = "";
  if (historyItems.length === 0) {
    history.innerHTML = `<div class="muted">No runs yet.</div>`;
    return;
  }

  for (const item of historyItems.slice(0, 8)) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="top">
        <div class="mono">${new Date(item.time).toLocaleString()}</div>
        <div class="badge">${item.complexity} • ${item.amount} USDC</div>
      </div>
      <div class="muted" style="margin-top:6px; font-size:12px;">${item.reason}</div>
      <div class="mono" style="margin-top:8px; opacity:.9;">TX: ${item.tx_id || "—"}</div>
    `;
    history.appendChild(div);
  }
}

async function postJSON(path, body) {
  const resp = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const raw = await resp.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (parseErr) {
    const short = raw.length > 1000 ? raw.slice(0, 1000) + "..." : raw;
    throw new Error(`Server returned invalid JSON (status ${resp.status}). Raw: ${short}`);
  }

  if (!resp.ok) throw new Error(data?.error || `Request failed (status ${resp.status})`);
  return data;
}

btnClear.addEventListener("click", () => {
  textArea.value = "";
  quoteLine.textContent = "Click “Get Quote” to see complexity & price.";
  resetOutput();
});

btnQuote.addEventListener("click", async () => {
  try {
    const text = textArea.value.trim();
    if (!text) return alert("Paste some text first.");

    setLoading(true, "Getting quote...");
    const q = await postJSON("/quote", { text });

    quoteLine.textContent =
      `Complexity: ${q.complexity} • Price: ${q.amount_usdc} USDC • ` +
      (q.payment_required ? "Payment required" : "Free") +
      ` • Reason: ${q.reason}`;

    setLoading(false);
  } catch (e) {
    setLoading(false);
    alert(e.message);
  }
});

btnRun.addEventListener("click", async () => {
  try {
    const text = textArea.value.trim();
    if (!text) return alert("Paste some text first.");

    resetOutput();
    setLoading(true, "Running analysis + payment...");

    const r = await postJSON("/run", { text });

    mComplexity.textContent = r.complexity;
    mPrice.textContent = `${r.amount_usdc}`;
    mPaid.textContent = r.payment_required ? "PAID / REQUIRED" : "FREE";
    analysis.textContent = r.analysis || "—";

    txId.textContent = r.tx_id || "—";
    if (r.tx_link) {
      txLink.textContent = r.tx_link;
      txLink.href = r.tx_link;
      txLink.className = "mono";
    } else {
      txLink.textContent = "—";
      txLink.href = "#";
      txLink.className = "mono muted";
    }

    historyItems.unshift({
      time: Date.now(),
      complexity: r.complexity,
      amount: r.amount_usdc,
      reason: r.reason,
      tx_id: r.tx_id
    });
    renderHistory();

    // Auto-refresh balances after a run
    if (btnBalancesTop) btnBalancesTop.click();

    setLoading(false);
  } catch (e) {
    setLoading(false);
    alert(e.message);
  }
});

renderHistory();
resetOutput();

// --- Balances UI (top) ---
const btnBalancesTop = el("btnBalancesTop");
const balancesBox = el("balancesBox");

/**
 * FIXED: Previously this cleared the balances UI when loading finished.
 * Now it only shows loading text when starting.
 */
function setBalancesLoading(isLoading) {
  if (btnBalancesTop) btnBalancesTop.disabled = isLoading;
  if (balancesBox && isLoading) {
    balancesBox.textContent = "Loading balances...";
  }
}

function normalizeTokenBalances(obj) {
  let arr = null;
  if (!obj) return null;

  if (Array.isArray(obj)) arr = obj;
  else if (obj.tokenBalances && Array.isArray(obj.tokenBalances)) arr = obj.tokenBalances;
  else if (obj.balances && Array.isArray(obj.balances)) arr = obj.balances;
  else if (obj.data) {
    const d = obj.data;
    if (Array.isArray(d)) arr = d;
    else if (d.tokenBalances && Array.isArray(d.tokenBalances)) arr = d.tokenBalances;
    else if (d.balances && Array.isArray(d.balances)) arr = d.balances;
    else arr = null;
  }

  if (!arr) {
    if (obj.data && typeof obj.data === "object") return obj.data;
    return obj;
  }

  return arr.map((it) => {
    let symbol = null;
    let amount = null;

    if (it.token && it.token.symbol) symbol = it.token.symbol;
    if (!symbol && it.tokenSymbol) symbol = it.tokenSymbol;
    if (!symbol && it.symbol) symbol = it.symbol;

    if (it.amount != null) {
      amount = typeof it.amount === "object" ? it.amount.value || it.amount.toString() : it.amount;
    }

    if ((amount === null || amount === undefined) && it.balance) {
      if (typeof it.balance === "object") amount = it.balance.amount || it.balance.available || JSON.stringify(it.balance);
      else amount = it.balance;
    }

    if ((amount === null || amount === undefined) && it.value != null) amount = it.value;

    return { symbol: symbol || "UNKNOWN", amount: amount != null ? String(amount) : "0" };
  });
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function renderBalancesResponse(agentRaw, merchantRaw) {
  const agent = normalizeTokenBalances(agentRaw);
  const merchant = normalizeTokenBalances(merchantRaw);

  const ts = new Date().toLocaleString();

  const renderTable = (list) => {
    if (!list) return `<div>(no balance data)</div>`;
    if (!Array.isArray(list)) return `<pre>${escapeHtml(JSON.stringify(list, null, 2))}</pre>`;
    if (list.length === 0) return `<div>(no tokens)</div>`;

    const upper = (x) => String(x || "").toUpperCase();
    const usdc = list.filter((l) => upper(l.symbol).includes("USDC"));
    const others = list.filter((l) => !upper(l.symbol).includes("USDC"));
    const rows = [...usdc, ...others];

    let html = `<table>`;
    for (const r of rows) {
      html += `<tr><th>${escapeHtml(r.symbol)}</th><td>${escapeHtml(r.amount)}</td></tr>`;
    }
    html += `</table>`;
    return html;
  };

  const html = `
    <div class="balances-section">
      <div class="balances-title">AGENT WALLET</div>
      ${renderTable(agent)}
    </div>
    <div class="balances-section">
      <div class="balances-title">MERCHANT WALLET</div>
      ${renderTable(merchant)}
    </div>
    <div style="margin-top:6px; font-size:12px; color:var(--muted);">Last updated: ${escapeHtml(ts)}</div>
  `;

  if (balancesBox) balancesBox.innerHTML = html;
}

if (btnBalancesTop) {
  btnBalancesTop.addEventListener("click", async () => {
    try {
      setBalancesLoading(true);

      const resp = await fetch(`${API}/wallets/balances`);
      const text = await resp.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { raw: text };
      }

      if (!resp.ok) {
        if (balancesBox) {
          balancesBox.textContent =
            `Error fetching balances (status ${resp.status}):\n` +
            `${JSON.stringify(data, null, 2)}`;
        }
        return;
      }

      renderBalancesResponse(data?.agent, data?.merchant);
    } catch (e) {
      if (balancesBox) balancesBox.textContent = `Fetch error: ${e?.message || String(e)}`;
    } finally {
      // FIXED: do NOT clear balances here anymore
      setBalancesLoading(false);
    }
  });
}

// Initial load on page open
if (btnBalancesTop) {
  (async () => {
    try {
      await new Promise((r) => setTimeout(r, 200));
      btnBalancesTop.click();
    } catch {
      // ignore
    }
  })();
}
