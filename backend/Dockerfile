# Imagen de producción del backend RAG (FastAPI).
# Se construye desde deploy/docker-compose.yml; Caddy queda delante (HTTPS).
#
#   docker build -t ondesanmarcos-api backend/

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependencias primero: se cachean mientras no cambien los requirements.
COPY requirements.txt requirements-llm.txt requirements-pgvector.txt ./
RUN pip install -r requirements.txt -r requirements-llm.txt -r requirements-pgvector.txt

COPY app ./app

RUN useradd --system --uid 10001 --no-create-home app \
    && chown -R app /app/app/knowledge/entries
USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4)"

# Un solo proceso: el límite por IP vive en memoria (app/api/ratelimit.py) y
# el VPS es pequeño. --proxy-headers toma la IP real del cliente desde Caddy.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--proxy-headers", "--forwarded-allow-ips", "*"]
