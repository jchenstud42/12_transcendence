# ================================ #
#            BUILD STAGE           #
# ================================ #
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

RUN npm install prisma@6.19.0 @prisma/client@6.19.0

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY srcs ./srcs

RUN npm run build


# ========================================= #
#                  RUNTIME                  #
# ========================================= #
FROM node:20-alpine AS runtime

WORKDIR /app

COPY package*.json ./

RUN npm install prisma@6.19.0 @prisma/client@6.19.0

COPY prisma ./prisma
RUN npx prisma generate

RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

RUN mkdir -p /app/database

EXPOSE 3000

CMD ["node", "dist/main.js"]
