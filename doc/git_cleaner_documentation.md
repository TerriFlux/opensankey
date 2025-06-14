# Git Branch Cleaner 🧹

Script Python pour supprimer automatiquement les branches Git locales qui n'existent plus sur le serveur distant.

## Usage

```bash
python git_clean_branches.py [chemin_depot] [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-d, --dry-run` | **Simulation** : affiche ce qui serait supprimé |
| `-f, --force` | Supprime sans confirmation |
| `-l, --list` | Liste seulement, ne supprime rien |

## Exemples

```bash
# Recommandé : toujours commencer par une simulation
python git_clean_branches.py --dry-run

# Ensuite nettoyer pour de vrai
python git_clean_branches.py --force

# Pour un dépôt spécifique
python git_clean_branches.py /path/to/repo --dry-run
python git_clean_branches.py /path/to/repo --force
```

## Sécurité

- ✅ La branche courante n'est jamais supprimée
- ✅ Demande confirmation par défaut (sauf `--force`)
- ✅ Mode dry-run pour tester sans risque

## Workflow recommandé

1. `--dry-run` pour voir ce qui serait supprimé
2. `--force` pour nettoyer réellement