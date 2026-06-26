#!/bin/bash
# Copie le profil de réglages Claude d'un contributeur dans .claude/settings.json.
# Calqué sur .vscode/set_vsc_env.sh : chacun maintient son dossier (default, julien, alexandre…)
# et le fichier actif .claude/settings.json reste gitignoré (non imposé aux autres).

cd "$(dirname "$0")" || exit 1

read -p "User name (default/julien/alexandre/...): " user_name

if [ ! -f "$user_name/settings.json" ]; then
  echo "Profil introuvable : $user_name/settings.json"
  echo "Profils disponibles :"
  ls -d */ 2>/dev/null | sed 's:/$::'
  exit 1
fi

cp "$user_name/settings.json" settings.json
echo "Profil '$user_name' copié dans .claude/settings.json"
