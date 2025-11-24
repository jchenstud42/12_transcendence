# ================================ #
#        BUILD (TypeScript)        #
# ================================ #
FROM node:22-alpine AS build

WORKDIR /app

# Installer bash/git nécessaires pour TS
RUN apk add --no-cache bash git

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier tout le code source
COPY . .

# Compiler TypeScript uniquement
RUN npm run tsc

# ================================ #
#       RUNTIME (Node léger)       #
# ================================ #
FROM node:22-alpine AS runtime

WORKDIR /app

# Copier le build TS depuis l'étape builder
COPY --from=build /app/dist ./dist

# Lancer Node sur le frontend si besoin (ou juste servir le dist via nginx)
CMD ["node", "--version"]

# ================================ #
#        DEV (shell + hot-reload)  #
# ================================ #
FROM node:22-alpine AS development

WORKDIR /app

RUN apk add --no-cache bash git

COPY package*.json ./
RUN npm install

COPY . .

# Volume pour hot reload (TS + CSS compilé par Makefile)
VOLUME /app/dist

# Lancer un shell pour exécuter ton Makefile ou commandes manuelles
CMD ["sh"]
