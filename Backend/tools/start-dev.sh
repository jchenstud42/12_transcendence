#!/bin/sh
# Lancer tsc en watch
tsc --watch &

# Attendre que le fichier dist/main.js soit créé
while [ ! -f dist/main.js ]; do
    sleep 0.1
done

# Lancer nodemon sur le dist
nodemon --watch dist --exec node dist/main.js
