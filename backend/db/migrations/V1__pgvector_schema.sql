-- V1 · Esquema pgvector para el corpus RAG de OndeSanMarcos.
--
-- Lo aplica Flyway (servicio `migrate` de docker-compose). No se edita una vez
-- aplicada: los cambios van en una migración nueva (V2__...sql).
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
