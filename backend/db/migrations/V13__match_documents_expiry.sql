-- V13 · Los fragmentos pueden caducar (eventos terminados).
--
-- Un fragmento con `metadata->>'expires_at'` (fecha ISO con zona horaria) deja de recuperarse cuando
-- esa fecha pasa. Así un evento terminado deja de aparecer en el asistente sin tareas programadas.
-- Los fragmentos sin `expires_at` (el corpus y las fichas de lugares) no cambian.

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
    where documents.metadata->>'expires_at' is null
       or (documents.metadata->>'expires_at')::timestamptz > now()
    order by documents.embedding <=> query_embedding
    limit match_count;
$$;
