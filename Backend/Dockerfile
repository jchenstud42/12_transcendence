#  ON BUILD LE TRUC

FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY srcs ./srcs

RUN npm run build

# ON RUN LE TRUC

FROM node:22-alpine AS runtime

RUN apk add --no-cache bash

WORKDIR /app

COPY package*.json ./

# ON INSTALLE QUE LES DEPENDANCIES, PAS LES DEVDEPENDANCIES
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE  3000

CMD ["node", "dist/main.js"]
