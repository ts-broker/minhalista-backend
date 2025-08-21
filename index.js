const express = require("express");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());

// Variáveis do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE;

async function supabaseQuery(table, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// 1. Criar usuário
app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  const data = await supabaseQuery("istoeuquero_users", "POST", { name, email });
  res.json(data);
});

// 2. Criar lista
app.post("/wishlists", async (req, res) => {
  const { user_id, title, description, event_date } = req.body;
  const data = await supabaseQuery("istoeuquero_wishlists", "POST", { user_id, title, description, event_date });
  res.json(data);
});

// 3. Adicionar item na lista
app.post("/wishlists/:wishlistId/items", async (req, res) => {
  const { name, url } = req.body;
  const { wishlistId } = req.params;
  const data = await supabaseQuery("istoeuquero_wishlist_items", "POST", { wishlist_id: wishlistId, name, url });
  res.json(data);
});

// 4. Marcar item como comprado
app.put("/items/:itemId/buy", async (req, res) => {
  const { buyer_name } = req.body;
  const { itemId } = req.params;
  const resData = await fetch(`${SUPABASE_URL}/rest/v1/istoeuquero_wishlist_items?id=eq.${itemId}`, {
    method: "PATCH",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: "comprado", buyer_name })
  });
  const data = await resData.json();
  res.json(data);
});

// 5. Ver lista com itens
app.get("/wishlists/:wishlistId", async (req, res) => {
  const { wishlistId } = req.params;
  const resData = await fetch(`${SUPABASE_URL}/rest/v1/istoeuquero_wishlist_items?wishlist_id=eq.${wishlistId}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    }
  });
  const items = await resData.json();
  res.json(items);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 IstoEuQuero Backend rodando na porta ${PORT}`);
});
