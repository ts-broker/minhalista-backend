// index.js — IstoEuQuero Backend (CommonJS) com CORS e erros tratados

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

// Libera CORS no MVP (depois podemos restringir aos seus domínios)
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization", "apikey"] }));
app.use(express.json());

// Variáveis do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("⚠️  Faltam variáveis de ambiente SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE");
}

// Helper para chamadas ao REST do Supabase
async function supabaseFetch(path, { method = "GET", body, preferReturn = false } = {}) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
  if (preferReturn) headers.Prefer = "return=representation";

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const maybeJson = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg = (maybeJson && (maybeJson.message || maybeJson.error)) || text || `HTTP ${res.status}`;
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return maybeJson;
}

function safeJson(txt) {
  try { return JSON.parse(txt); } catch { return null; }
}

// ---------- Rotas utilitárias ----------
app.get("/", (_req, res) => res.send("🚀 IstoEuQuero Backend online"));
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------- 1) Criar usuário ----------
app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body || {};
    if (!name) return res.status(400).json({ error: "name é obrigatório" });

    const data = await supabaseFetch(
      "istoeuquero_users",
      { method: "POST", body: { name, email }, preferReturn: true }
    );
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro ao criar usuário" });
  }
});

// ---------- 2) Criar lista ----------
app.post("/wishlists", async (req, res) => {
  try {
    const { user_id, title, description, event_date } = req.body || {};
    if (!user_id || !title) return res.status(400).json({ error: "user_id e title são obrigatórios" });

    const data = await supabaseFetch(
      "istoeuquero_wishlists",
      { method: "POST", body: { user_id, title, description, event_date }, preferReturn: true }
    );
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro ao criar lista" });
  }
});

// ---------- 3) Adicionar item na lista ----------
app.post("/wishlists/:wishlistId/items", async (req, res) => {
  try {
    const { wishlistId } = req.params;
    const { name, url } = req.body || {};
    if (!name) return res.status(400).json({ error: "name é obrigatório" });

    const data = await supabaseFetch(
      "istoeuquero_wishlist_items",
      { method: "POST", body: { wishlist_id: wishlistId, name, url }, preferReturn: true }
    );
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro ao adicionar item" });
  }
});

// ---------- 4) Marcar item como comprado ----------
app.put("/items/:itemId/buy", async (req, res) => {
  try {
    const { itemId } = req.params;
    const { buyer_name } = req.body || {};

    const data = await supabaseFetch(
      `istoeuquero_wishlist_items?id=eq.${itemId}`,
      { method: "PATCH", body: { status: "comprado", buyer_name }, preferReturn: true }
    );
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro ao marcar item como comprado" });
  }
});

// ---------- 5) Ver lista + itens ----------
app.get("/wishlists/:wishlistId", async (req, res) => {
  try {
    const { wishlistId } = req.params;

    // Busca dados da lista
    const listArr = await supabaseFetch(`istoeuquero_wishlists?id=eq.${wishlistId}`);
    const wishlist = Array.isArray(listArr) ? listArr[0] : listArr;

    if (!wishlist) return res.status(404).json({ error: "Lista não encontrada" });

    // Busca itens da lista
    const items = await supabaseFetch(`istoeuquero_wishlist_items?wishlist_id=eq.${wishlistId}&order=created_at.asc`);

    res.json({ wishlist, items });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro ao buscar lista" });
  }
});

// ----------------------------------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 IstoEuQuero Backend rodando na porta ${PORT}`);
});
