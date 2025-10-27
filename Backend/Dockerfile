#  ON BUILD LE TRUC

FROM ??

WORKDIR ??

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY srcs ./srcs

RUN nmp run build

# ON RUN LE TRUC

FROM ?? (pareil)

WORKDIR ?? (pareil)

COPY package*.json ./

# ON INSTALLE QUE LES DEPENDANCIES, PAS LES DEVDEPENDANCIES
RUN npm ci --omit=dev
COPY --from=build /??(WORKDIR)/dist ./dist
EXPOSE  (port)

CMD ["node", "dist/main.js"]
