#!/usr/bin/env python3
"""
Script pour merger récursivement une branche dans tous les modules et sous-modules
sans commit et sans fast-forward

Usage: python recursive_merge.py [--branch BRANCH] [chemin_du_repo]
       python recursive_merge.py --clean [chemin_du_repo]
"""

import subprocess
import sys
import argparse
from pathlib import Path
from typing import List, Tuple, Optional


# Codes couleur ANSI
class Colors:
    RED = "\033[0;31m"
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    BLUE = "\033[0;34m"
    NC = "\033[0m"  # No Color


def log_info(message: str) -> None:
    """Affiche un message d'information"""
    print(f"{Colors.BLUE}[INFO]{Colors.NC} {message}")


def log_success(message: str) -> None:
    """Affiche un message de succès"""
    print(f"{Colors.GREEN}[SUCCESS]{Colors.NC} {message}")


def log_warning(message: str) -> None:
    """Affiche un message d'avertissement"""
    print(f"{Colors.YELLOW}[WARNING]{Colors.NC} {message}")


def log_error(message: str) -> None:
    """Affiche un message d'erreur"""
    print(f"{Colors.RED}[ERROR]{Colors.NC} {message}")


def run_git_command(command: List[str], cwd: Path, capture_output: bool = True) -> Tuple[bool, str]:
    """
    Exécute une commande git

    Returns:
        Tuple[bool, str]: (success, output/error_message)
    """
    try:
        result = subprocess.run(
            ["git"] + command,
            cwd=cwd,
            capture_output=capture_output,
            text=True,
            check=True,
        )
        return True, result.stdout.strip() if capture_output else ""
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.strip() if e.stderr else str(e)
        return False, error_msg


def is_git_repo(path: Path) -> bool:
    """Vérifie si le chemin est un dépôt git (dossier .git ou fichier .git pour sous-modules)"""
    git_path = path / ".git"
    return git_path.exists()  # Fonctionne pour les dossiers ET les fichiers .git


def get_current_branch(repo_path: Path) -> Optional[str]:
    """Récupère la branche actuelle"""
    success, branch = run_git_command(["branch", "--show-current"], repo_path)
    return branch if success else None


def find_all_git_repos(root_path: Path) -> List[Path]:
    """Trouve tous les dépôts git dans l'arborescence"""
    git_repos = []

    def scan_directory(path: Path):
        if is_git_repo(path):
            git_repos.append(path)
            # Pour les sous-modules, on continue à scanner même si on a trouvé un .git
            # car il peut y avoir des sous-modules imbriqués

        try:
            for item in path.iterdir():
                if item.is_dir() and not item.name.startswith("."):
                    scan_directory(item)
        except PermissionError:
            log_warning(f"Permission refusée pour accéder à {path}")

    scan_directory(root_path)
    return git_repos


def remote_branch_exists(repo_path: Path, branch: str) -> bool:
    """Vérifie si une branche distante existe"""
    success, _ = run_git_command(['show-ref', '--verify', '--quiet', f'refs/remotes/{branch}'], repo_path)
    return success


def get_commits_behind_count(repo_path: Path, branch: str) -> int:
    """Récupère le nombre de commits en retard par rapport à la branche distante"""
    success, output = run_git_command(['rev-list', '--count', '--left-right', f'HEAD...{branch}'], repo_path)
    if not success:
        return 0
    
    try:
        # Format: "ahead behind"
        behind_count = int(output.split()[1])
        return behind_count
    except (IndexError, ValueError):
        return 0


def has_uncommitted_changes(repo_path: Path) -> bool:
    """Vérifie s'il y a des modifications non committées en ignorant les sous-modules"""
    # Utiliser --ignore-submodules=all pour ignorer complètement les sous-modules
    success, output = run_git_command(['status', '--porcelain', '--ignore-submodules=all'], repo_path)
    
    if not success:
        return True  # En cas d'erreur, considérer qu'il y a des changements
    
    # S'il y a du contenu, cela signifie qu'il y a des changements
    return bool(output.strip())


def show_detailed_status(repo_path: Path) -> None:
    """Affiche le statut détaillé pour debug"""
    repo_name = repo_path.name
    print(f"\nStatus détaillé pour {repo_name}:")
    
    # Status avec sous-modules
    success, output = run_git_command(['status', '--porcelain'], repo_path)
    if success and output:
        print("  Avec sous-modules:")
        for line in output.split('\n'):
            if line.strip():
                print(f"    {line}")
    
    # Status sans sous-modules
    success, output = run_git_command(['status', '--porcelain', '--ignore-submodules=all'], repo_path)
    if success and output:
        print("  Sans sous-modules:")
        for line in output.split('\n'):
            if line.strip():
                print(f"    {line}")
    else:
        print("  Aucun changement hors sous-modules")


def check_if_merge_in_progress(repo_path: Path) -> bool:
    """Vérifie si un merge est en cours"""
    merge_head = repo_path / '.git' / 'MERGE_HEAD'
    return merge_head.exists()


def abort_merge_if_needed(repo_path: Path) -> bool:
    """Annule un merge en cours si nécessaire"""
    if check_if_merge_in_progress(repo_path):
        log_warning(f"Un merge est en cours dans {repo_path.name}, tentative d'annulation...")
        success, error = run_git_command(['merge', '--abort'], repo_path)
        if success:
            log_info(f"Merge annulé avec succès dans {repo_path.name}")
            return True
        else:
            log_error(f"Impossible d'annuler le merge dans {repo_path.name}: {error}")
            return False
    return True


def merge_branch_in_repo(repo_path: Path, branch: str) -> bool:
    """
    Merge une branche distante dans le dépôt sans commit et sans fast-forward
    Version améliorée pour gérer les sous-modules
    """
    repo_name = repo_path.name
    log_info(f"Traitement du dépôt: {repo_name} (dans {repo_path})")

    # Vérifier si c'est un dépôt git
    if not is_git_repo(repo_path):
        log_warning(f"{repo_name} n'est pas un dépôt git, ignoré")
        return True
    
    # Annuler tout merge en cours
    if not abort_merge_if_needed(repo_path):
        return False
    
    # Vérifier la branche actuelle
    current_branch = get_current_branch(repo_path)
    if not current_branch:
        log_warning(f"Impossible de déterminer la branche actuelle pour {repo_name} (probablement detached HEAD), ignoré")
        return True  # Changé de False à True pour ignorer au lieu d'échouer
    
    log_info(f"Branche actuelle dans {repo_name}: {current_branch}")
    
    # Fetch pour avoir les dernières modifications
    log_info(f"Fetch des dernières modifications pour {repo_name}...")
    success, error = run_git_command(["fetch", "origin"], repo_path)
    if not success:
        log_error(f"Échec du fetch pour {repo_name}: {error}")
        return False
    
    # Vérifier s'il y a des modifications non committées (hors sous-modules)
    if has_uncommitted_changes(repo_path):
        log_error(f"{repo_name} a des modifications non committées (hors sous-modules).")
        show_detailed_status(repo_path)
        log_error("Veuillez les committer ou les stasher avant de continuer.")
        return False

    # Vérifier si la branche distante existe
    if not remote_branch_exists(repo_path, branch):
        log_warning(f"{repo_name} n'a pas de branche {branch}, ignoré")
        return True

    # Vérifier s'il y a quelque chose à merger
    behind_count = get_commits_behind_count(repo_path, branch)
    if behind_count == 0:
        log_success(f"{repo_name} est déjà à jour avec {branch}")
        return True
    
    log_info(f"{repo_name} est en retard de {behind_count} commit(s)")
    
    # Effectuer le merge sans commit et sans fast-forward
    log_info(f"Merge de {branch} dans {repo_name} (sans commit, sans fast-forward)...")
    
    # Essayer d'abord avec la stratégie ours pour les sous-modules
    success, error = run_git_command([
        'merge', 
        '--no-commit', 
        '--no-ff', 
        '-X', 'ours',  # En cas de conflit sur sous-modules, garder nos versions
        branch
    ], repo_path, False)
    
    # Si ça échoue, essayer sans stratégie spéciale
    if not success:
        log_warning(f"Merge avec stratégie 'ours' échoué, tentative standard...")
        success, error = run_git_command([
            'merge', 
            '--no-commit', 
            '--no-ff', 
            branch
        ], repo_path, False)
    
    # Si ça échoue encore et qu'il y a des conflits de sous-modules, les résoudre automatiquement
    if not success and "submodule" in error.lower():
        log_warning(f"Conflit de sous-module détecté, tentative de résolution automatique...")
        
        # Récupérer la liste des sous-modules en conflit
        conflict_success, conflict_output = run_git_command(['diff', '--name-only', '--diff-filter=U'], repo_path)
        if conflict_success and conflict_output:
            for submodule_path in conflict_output.split('\n'):
                if submodule_path.strip():
                    submodule_full_path = repo_path / submodule_path.strip()
                    # Vérifier si c'est bien un sous-module
                    if submodule_full_path.is_dir() and (submodule_full_path / '.git').exists():
                        log_info(f"Résolution automatique du conflit pour le sous-module: {submodule_path.strip()}")
                        # Utiliser notre version du sous-module (--ours)
                        checkout_success, _ = run_git_command(['checkout', '--ours', submodule_path.strip()], repo_path)
                        if checkout_success:
                            # Ajouter le sous-module résolu
                            add_success, _ = run_git_command(['add', submodule_path.strip()], repo_path)
                            if add_success:
                                log_success(f"Conflit résolu pour {submodule_path.strip()}")
            
            # Vérifier s'il reste des conflits
            remaining_conflicts_success, remaining_conflicts = run_git_command(['diff', '--name-only', '--diff-filter=U'], repo_path)
            if remaining_conflicts_success and not remaining_conflicts.strip():
                # Plus de conflits, le merge est réussi
                success = True
                log_success(f"Tous les conflits de sous-modules ont été résolus automatiquement")
    
    if success:
        log_success(f"Merge préparé avec succès pour {repo_name}")

        # Afficher le statut pour information
        print(f"Statut après merge dans {repo_name}:")
        status_success, status_output = run_git_command(["status", "--short"], repo_path)
        if status_success:
            print(status_output if status_output else "Aucune modification")
        print()

        return True
    else:
        log_error(f"Conflit lors du merge dans {repo_name}")
        
        # Vérifier si c'est un conflit de sous-module
        conflict_success, conflict_output = run_git_command(['diff', '--name-only', '--diff-filter=U'], repo_path)
        if conflict_success and conflict_output:
            print("Fichiers en conflit:")
            for file in conflict_output.split('\n'):
                if file.strip():
                    print(f"  - {file}")
                    # Vérifier si c'est un sous-module
                    file_path = repo_path / file.strip()
                    if file_path.is_dir() and (file_path / '.git').exists():
                        print(f"    ⚠️  {file.strip()} est un sous-module")
        
        # Proposer des solutions
        print("\nSolutions possibles:")
        print("1. Résoudre manuellement avec 'git add' puis 'git commit'")
        print("2. Annuler avec 'git merge --abort'")
        print("3. Pour les sous-modules: utiliser 'git checkout --ours <submodule>' ou 'git checkout --theirs <submodule>'")
        print()

        return False


def main():
    """Fonction principale avec gestion des arguments"""
    parser = argparse.ArgumentParser(
        description='Merge récursivement une branche dans tous les modules et sous-modules',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples:
  %(prog)s                           # Merge origin/main dans le répertoire courant
  %(prog)s --branch origin/dev       # Merge origin/dev dans le répertoire courant
  %(prog)s --branch origin/dev /path # Merge origin/dev dans /path
  %(prog)s --clean                   # Annule tous les merges en cours
  %(prog)s --clean /path             # Annule tous les merges en cours dans /path
        """
    )
    
    parser.add_argument(
        '--branch', '-b',
        default='origin/main',
        help='Branche à merger (défaut: origin/main)'
    )
    
    parser.add_argument(
        '--clean', '-c',
        action='store_true',
        help='Annuler tous les merges en cours'
    )
    
    parser.add_argument(
        'path',
        nargs='?',
        default='.',
        help='Chemin du répertoire racine (défaut: répertoire courant)'
    )
    
    args = parser.parse_args()
    
    root_path = Path(args.path).resolve()

    if not root_path.exists():
        log_error(f"Le chemin {root_path} n'existe pas")
        sys.exit(1)

    if not root_path.is_dir():
        log_error(f"Le chemin {root_path} n'est pas un répertoire")
        sys.exit(1)

    # Mode nettoyage
    if args.clean:
        log_info("Mode nettoyage : annulation de tous les merges en cours")
        git_repos = find_all_git_repos(root_path)
        
        for repo_path in git_repos:
            if check_if_merge_in_progress(repo_path):
                log_info(f"Annulation du merge en cours dans {repo_path.name}")
                abort_merge_if_needed(repo_path)
        
        log_success("Nettoyage terminé")
        return

    log_info(f"Recherche des dépôts git dans: {root_path}")
    log_info(f"Branche à merger: {args.branch}")

    # Trouver tous les dépôts git
    git_repos = find_all_git_repos(root_path)

    if not git_repos:
        log_warning("Aucun dépôt git trouvé")
        return

    log_info(f"Dépôts git trouvés: {len(git_repos)}")
    for repo in git_repos:
        print(f"  - {repo}")
    print()

    # Demander confirmation
    response = input(f"Voulez-vous merger {args.branch} dans ces {len(git_repos)} dépôts ? (y/N): ")
    if response.lower() not in ["y", "yes", "oui", "o"]:
        log_info("Opération annulée")
        return
    
    # Traiter chaque dépôt en ordre inverse (sous-modules d'abord)
    success_count = 0
    failed_repos = []
    
    for i, repo_path in enumerate(reversed(git_repos)):
        print(f"{'='*60}")
        print(f"Dépôt {i+1}/{len(git_repos)}")
        
        if merge_branch_in_repo(repo_path, args.branch):
            success_count += 1
        else:
            failed_repos.append(repo_path)
        
        print()
        
        # Pause sauf pour le dernier dépôt
        if i < len(git_repos) - 1:
            try:
                response = input("Appuyez sur Entrée pour continuer (q pour quitter): ")
                if response.lower() == 'q':
                    log_info("Arrêt demandé par l'utilisateur")
                    break
            except KeyboardInterrupt:
                log_info("\nInterruption demandée par l'utilisateur")
                break
    
    # Résumé final
    print(f"{'='*60}")
    log_info("RÉSUMÉ")
    log_success(f"Dépôts traités avec succès: {success_count}/{len(git_repos)}")

    if failed_repos:
        log_error(f"Dépôts avec erreurs: {len(failed_repos)}")
        for repo in failed_repos:
            print(f"  - {repo}")
        print(f"\nPour nettoyer les merges en cours: python {sys.argv[0]} --clean")
    
    if failed_repos:
        sys.exit(1)
    else:
        log_success("Tous les merges ont été préparés avec succès!")


if __name__ == "__main__":
    main()