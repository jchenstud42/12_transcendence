# ==== Dockerfile multi-stage ================================================================ #
# Contient plusieurs etapes successives, construit une application dans une image (BUILD),     #
# puis copie uniquement ce qui est necessaire dans l'image final (RUNTIME ou DEV)              #
# ============================================================================================ #


# ================================ #
#        BUILD (Preparation)       #
# ================================ #
FROM node:22-alpine AS build

WORKDIR /app

# Copie le package.json et installe toutes les dépendances
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

# Copie du reste du projet
COPY tsconfig.json ./
COPY srcs ./srcs

# Compilation TypeScript
RUN npm run build



# ========================================= #
#       RUNTIME (Env minimal et leger)      #
# ========================================= #
FROM node:22-alpine AS runtime

WORKDIR /app

# Copie de package.json pour installer les dépendances
COPY package*.json ./

COPY prisma ./prisma
RUN npx prisma generate

# Installation prod uniquement (pas de devDependencies)
RUN npm ci --omit=dev

# On récupère le build du stage "build"
COPY --from=build /app/dist ./dist

# Crée le dossier database pour SQLite
RUN mkdir -p /app/database

EXPOSE 3000

CMD ["node", "dist/main.js"]



# ================================================ #
#        DEV (Acces aux outils + hot-reload)       #
# ================================================ #
FROM node:22-alpine AS development

WORKDIR /app

# Copie le package.json et installe toutes les dépendances
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

# Copie le code source pour dev
COPY tsconfig.json ./
COPY srcs ./srcs

# Copie le build si on veut l'utiliser (optionnel)
COPY --from=build /app/dist ./dist

COPY tools/start-dev.sh ./tools/start-dev.sh
RUN chmod +x ./tools/start-dev.sh

EXPOSE 3000

# Commande pour développement avec nodemon
CMD ["npx", "nodemon", "dist/main.js"]
