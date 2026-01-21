# ================================ #
#            BUILD STAGE           #
# ================================ #
FROM node:20-alpine AS build

WORKDIR /app/srcs

COPY package*.json ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./

COPY ./ts ./ts
COPY ./assets ./assets
COPY ./styles ./styles
COPY ./index.html ./

RUN mkdir -p /app/srcs/stylesDist

RUN npm install

RUN npm run build
RUN ls -la /app/srcs/js
RUN ls -la /app/srcs/stylesDist
RUN cat /app/srcs/stylesDist/output.css | head -100


# ========================================= #
#               NGINX STAGE                 #
# ========================================= #
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

RUN apk add --no-cache openssl bash
RUN mkdir -p /etc/nginx/certs

RUN openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout /etc/nginx/certs/privkey.pem \
    -out /etc/nginx/certs/fullchain.pem \
    -subj "/CN=localhost"

COPY index.html ./

COPY --from=build /app/srcs/js ./js
COPY --from=build /app/srcs/assets ./assets
COPY --from=build /app/srcs/stylesDist ./stylesDist

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 8443
