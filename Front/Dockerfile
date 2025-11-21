# ================================ #
#        BUILD (Preparation)       #
# ================================ #
FROM node:22-alpine AS build

WORKDIR /app

# Installer bash/git nécessaires pour Tailwind
RUN apk add --no-cache bash git

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier tout le code source
COPY . .

# Compilation TypeScript + Tailwind
# - TypeScript compile ts/ → dist/
# - Tailwind compile input.css → dist/output.css
RUN npm run build



# ========================================= #
#       RUNTIME (Env minimal et léger)      #
# ========================================= #
FROM node:22-alpine AS runtime

WORKDIR /app

# Copier le build depuis l'étape builder
COPY --from=build /app/dist ./dist

# Optionnel : si tu veux lancer un serveur, tu peux mettre CMD node dist/main.js
CMD ["node", "--version"]



# ================================================ #
#        DEV (Accès aux outils + hot-reload)      #
# ================================================ #
FROM node:22-alpine AS development

WORKDIR /app

# Installer bash/git nécessaires pour Tailwind
RUN apk add --no-cache bash git

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier tout le code source
COPY . .

# Volume pour dist (build TS + CSS Tailwind)
VOLUME /app/dist

# Hot reload TS + Tailwind
CMD ["sh", "-c", "npm run dev"]
