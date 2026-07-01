import { createClient } from "@supabase/supabase-js";

// Estas duas variáveis vêm do arquivo .env (veja .env.example)
// e são preenchidas automaticamente pela Vercel/Netlify a partir
// das "Environment Variables" configuradas no painel do projeto.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configuradas. Veja o GUIA-HOSPEDAGEM.md"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
