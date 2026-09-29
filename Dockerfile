# syntax=docker/dockerfile:1
# ============================================================
#  Karim Market — Image unique React + Spring Boot + MongoDB
#  Un seul conteneur, un seul lien web (port $PORT fourni par
#  l'hebergeur, ex. Render/Railway). Spring Boot sert l'interface
#  React compilee (static/) et l'API /api sur le meme port.
# ============================================================

# ---------- Etape 1 : compilation du frontend React (Vite) ----------
FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---------- Etape 2 : compilation du backend Spring Boot ----------
# Image officielle Maven 3.9 + JDK 23 (exige par pom.xml).
# Maven est DEJA installe : plus besoin de copier scripts/.tools.
FROM maven:3.9-eclipse-temurin-23 AS backend-build
WORKDIR /build
COPY backend/pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY backend/src ./src
COPY --from=frontend-build /build/dist ./src/main/resources/static/
RUN mvn -B -q clean package -DskipTests

# ---------- Etape 3 : image finale (JRE 23 + MongoDB) ----------
FROM eclipse-temurin:23-jre-noble

RUN apt-get update \
 && apt-get install -y --no-install-recommends gnupg curl ca-certificates \
 && curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc \
      | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg \
 && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
      > /etc/apt/sources.list.d/mongodb-org-8.0.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends mongodb-org-server mongodb-org-mongos \
 && apt-get purge -y --auto-remove gnupg curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=backend-build /build/target/karim-market-backend-1.0.0.jar app.jar
COPY docker-entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh \
 && mkdir -p /data/db /app/uploads/products

ENV JAVA_OPTS="-XX:MaxRAMPercentage=50"
ENV APP_UPLOADS_PRODUCTS_DIR=/app/uploads/products

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
