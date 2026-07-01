# Guia de Hospedagem Gratuita — Colégio Mirim (Registro de Ocorrências)

Este guia mostra como colocar o aplicativo no ar **fora do Claude**, com um banco de dados real e gratuito, compartilhado entre todos os professores. O processo todo leva entre 20 e 30 minutos e não exige cartão de crédito.

Ferramentas usadas (ambas grátis no plano usado aqui):
- **Supabase** → banco de dados (Postgres) + API automática
- **Vercel** → hospedagem do site (link público tipo `colegio-mirim.vercel.app`)
- **GitHub** → onde o código fica guardado (necessário para conectar com a Vercel)

---

## Parte 1 — Criar o banco de dados no Supabase

1. Acesse **supabase.com** e clique em **Start your project** (pode entrar com sua conta Google).
2. Clique em **New Project**.
   - Dê um nome, ex: `colegio-mirim`
   - Crie uma senha forte para o banco (guarde-a, mas não vai precisar dela no dia a dia)
   - Escolha a região mais próxima do Brasil (ex: `South America (São Paulo)`)
   - Clique em **Create new project** e aguarde ~2 minutos.
3. No menu lateral, clique em **SQL Editor** → **New query**.
4. Abra o arquivo **`supabase-setup.sql`** (incluído neste pacote), copie todo o conteúdo, cole no editor e clique em **Run**.
   - Isso cria a tabela `ocorrencias` já pronta para receber os registros.
5. No menu lateral, clique em **Project Settings** (ícone de engrenagem) → **API**.
   - Copie o **Project URL** (algo como `https://xxxxx.supabase.co`)
   - Copie a chave **anon public** (uma string longa)
   - Guarde os dois — vai usar daqui a pouco.

---

## Parte 2 — Subir o código para o GitHub

1. Acesse **github.com** e crie uma conta gratuita, se ainda não tiver.
2. Clique em **New repository**.
   - Nome: `colegio-mirim-ocorrencias`
   - Deixe como **Public** ou **Private** (tanto faz)
   - Clique em **Create repository**
3. Na página do repositório recém-criado, clique em **uploading an existing file**.
4. Arraste **todos os arquivos e pastas** deste pacote (menos a pasta `node_modules`, que não existe ainda) para a área de upload.
5. Clique em **Commit changes**.

> Alternativa para quem já usa Git: `git init`, `git add .`, `git commit -m "primeira versão"`, depois `git remote add origin <url-do-repo>` e `git push -u origin main`.

---

## Parte 3 — Publicar com a Vercel

1. Acesse **vercel.com** e clique em **Sign Up** → escolha **Continue with GitHub** (mais simples, conecta direto).
2. No painel da Vercel, clique em **Add New** → **Project**.
3. Selecione o repositório `colegio-mirim-ocorrencias` que você acabou de subir e clique em **Import**.
4. Na tela de configuração do projeto, abra a seção **Environment Variables** e adicione duas:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | a URL que você copiou do Supabase |
   | `VITE_SUPABASE_ANON_KEY` | a chave anon que você copiou do Supabase |

5. Clique em **Deploy** e aguarde 1–2 minutos.
6. Pronto! A Vercel vai gerar um link público, algo como:
   `https://colegio-mirim-ocorrencias.vercel.app`

Esse é o link que você compartilha com **Juci, Laryssa, Tainá, Adriana, Victor** e qualquer outro professor — todos vão ver e editar os mesmos registros, em tempo real, de qualquer dispositivo (celular, tablet, computador).

---

## Como funciona o compartilhamento dos dados

- Todos os registros ficam guardados no banco de dados do Supabase (não no navegador de cada pessoa).
- O app usa o recurso de **Realtime** do Supabase: quando um professor registra ou atualiza uma ocorrência, todos os outros que estão com o app aberto veem a mudança automaticamente, sem precisar atualizar a página.
- Mesmo que o Realtime falhe por algum motivo, o app também verifica o banco a cada 30 segundos.

---

## Limites do plano gratuito (mais do que suficiente para uma escola)

- **Supabase Free**: até 500 MB de banco de dados, 2 projetos ativos, pausa automática após 1 semana sem uso (basta acessar o painel para reativar).
- **Vercel Free (Hobby)**: tráfego e builds ilimitados para projetos pessoais/uso interno; mais que suficiente para o número de professores de uma escola.

Se a escola crescer muito ou quiser remover esses limites no futuro, ambos os serviços têm planos pagos a partir de valores baixos — mas para o uso descrito aqui, o gratuito atende integralmente.

---

## Manutenção e próximos passos (opcional)

- **Atualizar o app no futuro:** edite os arquivos, suba as mudanças no GitHub (`git push` ou novo upload) — a Vercel publica a nova versão automaticamente.
- **Adicionar login por professor:** hoje qualquer pessoa com o link pode editar. Se quiser exigir que cada professor faça login antes de acessar, posso te ajudar a configurar o **Supabase Auth** (login por e-mail) numa próxima etapa.
- **Domínio próprio** (ex: `ocorrencias.colegiomirim.com.br`): pode ser configurado direto no painel da Vercel, em **Settings → Domains**.

---

## Rodando localmente antes de publicar (opcional, para quem quiser testar primeiro)

Se tiver o [Node.js](https://nodejs.org) instalado no computador:

```bash
# 1. Entre na pasta do projeto
cd colegio-mirim

# 2. Copie o arquivo de exemplo de variáveis e preencha com seus dados do Supabase
cp .env.example .env

# 3. Instale as dependências
npm install

# 4. Rode localmente
npm run dev
```

O app abrirá em `http://localhost:5173`.
