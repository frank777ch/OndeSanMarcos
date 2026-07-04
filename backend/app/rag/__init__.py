"""Motor RAG del asistente del campus.

Submódulos:
- ``guardrails``   : limita el alcance a temas de la UNMSM (HU-2.4).
- ``embeddings``   : vectorización de texto (mock sin dependencias + hueco real).
- ``vector_store`` : almacén vectorial en memoria con similitud coseno.
- ``retriever``    : ingesta del corpus y recuperación top-k.
- ``llm``          : generación de la respuesta (mock anclado al contexto).
- ``engine``       : orquestación de todo el pipeline.
"""
