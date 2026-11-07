-- Esquema pgvector para el corpus RAG de OndeSanMarcos (Supabase).
--
-- Ejecutar en el SQL Editor de Supabase (o vía migración). Es idempotente.
-- La dimensión del vector (768) debe coincidir con `EMBEDDING_DIM` del backend
-- (gemini-embedding-001 con output_dimensionality=768).

create extension if not exists vector;

create table if not exists documents (
    id        bigint generated always as identity primary key,
    content   text  not null,
    metadata  jsonb not null default '{}'::jsonb,
    embedding vector(768) not null
);

-- Índice para búsqueda aproximada por similitud coseno.
create index if not exists documents_embedding_idx
    on documents using hnsw (embedding vector_cosine_ops);

-- Recuperación top-k por similitud coseno (similarity = 1 - distancia).
create or replace function match_documents(
    query_embedding vector(768),
    match_count int default 4
)
returns table (
    id         bigint,
    content    text,
    metadata   jsonb,
    similarity float
)
language sql stable
as $$
    select
        documents.id,
        documents.content,
        documents.metadata,
        1 - (documents.embedding <=> query_embedding) as similarity
    from documents
    order by documents.embedding <=> query_embedding
    limit match_count;
$$;

-- El backend accede con el rol `service_role` (server-side). Le damos privilegios
-- sobre la tabla y la función. No se otorga a anon/authenticated: la base solo la
-- consume el backend.
grant select, insert, update, delete on table documents to service_role;
grant execute on function match_documents(vector, int) to service_role;

-- Cierra la tabla a los roles públicos (la anon key va en la app). Supabase les
-- da privilegios por defecto sobre tablas nuevas; `service_role` ignora RLS.
-- Igual que supabase/migrations/20261015000000_documents_rls.sql.
alter table documents enable row level security;
revoke all on table documents from anon, authenticated;
revoke execute on function match_documents(vector, int) from public, anon, authenticated;
