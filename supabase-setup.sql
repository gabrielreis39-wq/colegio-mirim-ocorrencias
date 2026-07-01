-- ════════════════════════════════════════════════════════════════
-- Colégio Mirim · Registro de Ocorrências
-- Script de criação da tabela no Supabase
-- ════════════════════════════════════════════════════════════════
-- Como usar: Supabase > seu projeto > SQL Editor > New query
-- Cole este script inteiro e clique em "Run".

create table if not exists ocorrencias (
  id bigint primary key,
  estudante text not null,
  turma text not null,
  professor text not null,
  data date not null,
  descricao text not null,
  sugestao_intervencao text,
  status text not null default 'novo',
  historico jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Habilita Row Level Security (obrigatório no Supabase)
alter table ocorrencias enable row level security;

-- Política aberta: qualquer pessoa com a chave "anon" pode ler e escrever.
-- Ideal para uso interno da escola com o link compartilhado apenas com a equipe.
-- (Se quiser exigir login no futuro, troque por políticas baseadas em auth.uid())
create policy "Permitir leitura para todos"
  on ocorrencias for select
  using (true);

create policy "Permitir inserção para todos"
  on ocorrencias for insert
  with check (true);

create policy "Permitir atualização para todos"
  on ocorrencias for update
  using (true);

create policy "Permitir exclusão para todos"
  on ocorrencias for delete
  using (true);

-- Habilita atualizações em tempo real (opcional, mas recomendado)
alter publication supabase_realtime add table ocorrencias;
