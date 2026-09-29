#!/bin/sh
# ============================================================
#  Point d'entree du conteneur Karim Market :
#   1. Demarre MongoDB en local SAUF si une URI externe est
#      fournie via SPRING_DATA_MONGODB_URI (ex. MongoDB Atlas).
#   2. Demarre le JAR Spring Boot (React servi en statique).
#  Le port d'ecoute vient de $PORT (Render) ou 8080 par defaut.
# ============================================================
set -e

MONGO_URI="${SPRING_DATA_MONGODB_URI:-mongodb://localhost:27017/karim_market}"

case "$MONGO_URI" in
  *localhost*|*127.0.0.1*)
    echo "[entrypoint] Demarrage de MongoDB local (donnees ephemeres, catalogue reseme au boot)..."
    mkdir -p /data/db
    mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017 --fork --logpath /var/log/mongod.log
    ;;
  *)
    echo "[entrypoint] MongoDB externe detecte (SPRING_DATA_MONGODB_URI), mongod local ignore."
    ;;
esac

echo "[entrypoint] Demarrage de Spring Boot sur le port ${PORT:-8080}..."
exec java $JAVA_OPTS -jar /app/app.jar
