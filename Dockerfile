# Dockerfile pour SankeySuite Client + Web Generator
FROM node:18-bullseye

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    git \
    bash \
    python3 \
    python3-pip \
    openssh-client \
    openssh-server \
    rsync \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Installer pnpm globalement
RUN npm install -g pnpm

# Créer un utilisateur non-root
RUN useradd -m -s /bin/bash sankey && \
    mkdir -p /app && \
    chown -R sankey:sankey /app

# Configurer SSH pour tous les utilisateurs
RUN mkdir -p /etc/ssh && \
    echo "Host *" >> /etc/ssh/ssh_config && \
    echo "    StrictHostKeyChecking no" >> /etc/ssh/ssh_config && \
    echo "    UserKnownHostsFile /dev/null" >> /etc/ssh/ssh_config

USER sankey
WORKDIR /app

# Créer le répertoire SSH pour l'utilisateur et vérifier SSH
RUN mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
    ssh -V 2>&1 | head -1 && \
    which ssh && \
    which scp

# Copier tout le contenu du projet SankeySuite
COPY --chown=sankey:sankey . .

# S'assurer que les scripts sont exécutables
RUN chmod +x build_client.sh
RUN chmod +x *.py 2>/dev/null || echo "No Python scripts to make executable"

# Initialiser et mettre à jour les submodules git
RUN git config --global --add safe.directory /app && \
    git config --global --add safe.directory /app/submodules/OpenSankey+ && \
    git config --global --add safe.directory /app/submodules/LoginComponent && \
    git submodule update --init --recursive || echo "Submodules initialized"

# Exécuter le script de build avec l'option -I (install dependencies)
RUN bash build_client.sh -I

# Créer la structure pour le générateur web
RUN mkdir -p /app/web-generator && \
    mkdir -p /app/mfadata/dist

# Variables d'environnement pour le générateur web
ENV WEB_GENERATOR_BASE_PATH=/app/web-generator
ENV SANKEY_COMPIL_DIR=/app/client
ENV PYTHON_PATH=/app
ENV PATH="/usr/bin:/usr/local/bin:${PATH}"

# Exposer le port si nécessaire
EXPOSE 3000

# Définir le répertoire de travail
WORKDIR /app

# Point d'entrée par défaut
CMD ["bash"]