# OnDeSanMarcos

Este proyecto contiene el frontend (React Native + Expo) y el backend (FastAPI en Python), organizados en sus respectivas carpetas.

## Estructura de Carpetas

- `/frontend/`: Contiene el código de la aplicación móvil, desarrollada con React Native y Expo.
- `/backend/`: Contiene el código del servidor, la API RAG y la lógica de negocio en Python.
- `/documents/`: Almacena documentos relevantes, requerimientos y diseños del proyecto.
- `/test/`: Contiene los scripts y pruebas automatizadas.

## Instalación del Frontend

Para configurar y levantar el entorno de desarrollo de la aplicación móvil, primero debes navegar a su carpeta:

```sh
cd frontend
npm install
```

### Iniciar la aplicación en desarrollo (Expo)

```sh
npx expo start
```

## Instalación del Backend

El backend es una API basada en RAG (Retrieval-Augmented Generation) construida con FastAPI. Requiere **Python 3.11+**.

Para configurar el entorno de Python para el backend:

```sh
cd backend
python -m venv .venv
.venv\Scripts\activate          # En Windows (en Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt

# Configuración opcional
copy .env.example .env          # En Windows (en Linux/Mac: cp .env.example .env)
```

### Ejecutar la API (Backend)

```sh
uvicorn app.main:app --reload
```

- Healthcheck: http://localhost:8000/health
- Documentación interactiva (Swagger): http://localhost:8000/docs
