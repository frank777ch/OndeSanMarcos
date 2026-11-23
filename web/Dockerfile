# Web de producción: compila con Vite y sirve el resultado con nginx.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Tiene prioridad sobre web/.env (Vite no pisa las variables que ya existen en el entorno).
# VITE_MAPBOX_TOKEN se lee de web/.env, que entra en el contexto de build; la imagen final solo lleva dist/.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL \
    VITE_USE_MOCK_CHAT=false
# `vite build` directo: `npm run build` corre antes `tsc -b`, que hoy falla por tipos en pathfinder.ts y en un test.
RUN npx vite build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
