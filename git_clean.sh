#!/bin/bash

protect="server/db.sqlite"

# Nettoyer le repo principal
git reset --hard
git clean -dxf -e "$protect"

# Répéter pour tous les sous-modules, récursivement
git submodule foreach --recursive '
  echo "=== Nettoyage dans $name ==="
  git reset --hard
  git clean -dxf
