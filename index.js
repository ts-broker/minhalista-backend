const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// CORS liberado no MVP; depois você pode restringir ao seu domínio
app.use(cors({ origin: "*"}));
app.use(express.json());

// Variáveis de ambiente (vamos configurar no Render)
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE, PORT } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.warn("⚠️ Faltam variáveis de ambiente SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE");
}

// Cliente Supabase (service role só no servidor!)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// Rotas básicas
app.get("/", (req, res) => res.send("OK - minhalista backend online"));
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Cria uma lista: { nome_usuario: "Tiago", itens: [{name, link, note}] }
app.post("/api/lista", async (req, res) => {
  try {
    const { nome_usuario, itens } = req.body;
    if (!nome_usuario || !Array.isArray(itens)) {
      return res.status(400).json({ error: "nome_usuario e itens[] são obrigatórios" });
    }

    const { data, error } = await supabase
      .from("listas")
      .insert([{ nome_usuario, itens }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // devolve só o id (pra gerar o link compartilhável)
    res.json({ id: data.id });
  } catch (e) {
    res.status(500).json({ error: "Falha ao criar lista" });
  }
});

// Busca lista por ID (GET /api/lista/:id)
app.get("/api/lista/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("listas")
      .select("id,nome_usuario,itens,criado_em")
      .eq("id", id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Lista não encontrada" });

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Falha ao buscar lista" });
  }
});

app.listen(PORT || 3000, () => {
  console.log(`🚀 Servidor ouvindo na porta ${PORT || 3000}`);
});
