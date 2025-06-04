# Dockerfile pour SankeySuite Client
FROM node:18-bullseye

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    git \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Installer pnpm globalement
RUN npm install -g pnpm

# Créer un utilisateur non-root
RUN useradd -m -s /bin/bash sankey && \
    mkdir -p /app && \
    chown -R sankey:sankey /app

USER sankey
WORKDIR /app

# Copier tout le contenu du projet SankeySuite
COPY --chown=sankey:sankey . .

# S'assurer que les scripts sont exécutables
RUN chmod +x build_client.sh

# Initialiser et mettre à jour les submodules git
RUN git config --global --add safe.directory /app && \
    git config --global --add safe.directory /app/submodules/OpenSankey+ && \
    git config --global --add safe.directory /app/submodules/LoginComponent && \
    git submodule update --init --recursive || echo "Submodules initialized"

# Exécuter le script de build avec l'option -I (install dependencies)
RUN bash build_client.sh -I

# Exposer le port si nécessaire (à adapter selon votre config)
EXPOSE 3000

# Définir le répertoire de travail sur client
WORKDIR /app/client

# Point d'entrée par défaut
CMD ["bash"]