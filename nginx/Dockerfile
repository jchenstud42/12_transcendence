FROM nginx:stable-alpine

# Configurations pour generer le certificat auto-signe
RUN apk add --no-cache openssl bash
RUN mkdir -p /etc/nginx/certs

RUN openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout /etc/nginx/certs/privkey.pem \
    -out /etc/nginx/certs/fullchain.pem \
    -subj "/CN=localhost"


COPY nginx.conf /etc/nginx/nginx.conf

# Exposer les ports HTTP et HTTPS
EXPOSE 80 443

# Lancer Nginx au premier plan
CMD ["nginx", "-g", "daemon off;"]
