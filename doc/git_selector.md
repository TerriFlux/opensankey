# Git Branch Selector 🌿

Script Python pour supprimer interactivement les branches Git locales et distantes.

## Usage

```bash
python git_branch_selector.py [chemin_depot] [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--show-all` | Afficher toutes les branches (y compris trackées) |
| `--orphans-only` | Afficher seulement les branches orphelines |

## Contrôles interactifs

Pour chaque branche :

| Touche | Action |
|--------|--------|
| `y` | Supprimer **localement** seulement |
| `Y` | Supprimer **localement + remote** |
| `n` | Garder la branche |
| `s` | Sauter toutes les suivantes |
| `q` | **Quitter immédiatement** |

## Exemples

```bash
# Dépôt courant
python git_branch_selector.py

# Dépôt spécifique  
python git_branch_selector.py /path/to/repo

# Toutes les branches
python git_branch_selector.py --show-all

# Seulement les orphelines
python git_branch_selector.py --orphans-only
```

## Sécurité

- ✅ La branche courante est protégée
- ✅ Vérification avant suppression remote
- ✅ Sortie possible à tout moment avec `q`