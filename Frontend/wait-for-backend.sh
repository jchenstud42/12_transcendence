#!/bin/sh

while ! nc -z backend 3000; do
  echo "Backend not ready yet, waiting..."
  sleep 0.5
done

echo "Backend is up! Starting nginx..."
exec nginx -g "daemon off;"
