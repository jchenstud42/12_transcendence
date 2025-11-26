# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app/srcs

COPY srcs/package*.json ./
COPY srcs/tsconfig.json ./

COPY srcs/ts ./ts

COPY srcs/assets ./assets

RUN npm install

RUN npm run build
RUN ls -la /app/srcs/js  # vérifie que main.js est présent

# ---------- NGINX STAGE ----------
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

RUN apk add --no-cache openssl bash
RUN mkdir -p /etc/nginx/certs

RUN openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout /etc/nginx/certs/privkey.pem \
    -out /etc/nginx/certs/fullchain.pem \
    -subj "/CN=localhost"

COPY srcs/html/index.html ./

COPY --from=builder /app/srcs/js ./js

COPY --from=builder /app/srcs/assets ./assets

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
