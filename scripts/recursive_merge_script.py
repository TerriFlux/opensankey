#!/usr/bin/env python3
"""
Script pour merger récursivement main dans tous les modules et sous-modules
sans commit et sans fast-forward

Usage: python recursive_merge.py [chemin_du_repo]
"""

import subprocess
import sys
import os
from pathlib import Path
from typing import List, Tuple, Optional

# Codes couleur ANSI
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

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
            ['git'] + command,
            cwd=cwd,
            capture_output=capture_output,
            text=True,
            check=True
        )
        return True, result.stdout.strip() if capture_output else ""
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.strip() if e.stderr else str(e)
        return False, error_msg

def is_git_repo(path: Path) -> bool:
    """Vérifie si le chemin est un dépôt git (dossier .git ou fichier .git pour sous-modules)"""
    git_path = path / '.git'
    return git_path.exists()  # Fonctionne pour les dossiers ET les fichiers .git

def get_current_branch(repo_path: Path) -> Optional[str]:
    """Récupère la branche actuelle"""
    success, branch = run_git_command(['branch', '--show-current'], repo_path)
    return branch if success else None

def has_uncommitted_changes(repo_path: Path) -> bool:
    """Vérifie s'il y a des modifications non committées"""
    success, _ = run_git_command(['diff-index', '--quiet', 'HEAD', '--'], repo_path)
    return not success

def remote_branch_exists(repo_path: Path, branch: str = 'origin/main') -> bool:
    """Vérifie si une branche distante existe"""
    success, _ = run_git_command(['show-ref', '--verify', '--quiet', f'refs/remotes/{branch}'], repo_path)
    return success

def get_commits_behind_count(repo_path: Path) -> int:
    """Récupère le nombre de commits en retard par rapport à origin/main"""
    success, output = run_git_command(['rev-list', '--count', '--left-right', 'HEAD...origin/main'], repo_path)
    if not success:
        return 0
    
    try:
        # Format: "ahead behind"
        behind_count = int(output.split()[1])
        return behind_count
    except (IndexError, ValueError):
        return 0

def find_all_git_repos(root_path: Path) -> List[Path]:
    """Trouve tous les dépôts git dans l'arborescence"""
    git_repos = []
    
    def scan_directory(path: Path):
        if is_git_repo(path):
            git_repos.append(path)
            # Ne pas scanner à l'intérieur d'un dépôt git pour éviter les sous-modules
            # qui seront traités séparément
            return
        
        try:
            for item in path.iterdir():
                if item.is_dir() and not item.name.startswith('.'):
                    scan_directory(item)
        except PermissionError:
            log_warning(f"Permission refusée pour accéder à {path}")
    
    scan_directory(root_path)
    return git_repos

def merge_main_in_repo(repo_path: Path) -> bool:
    """
    Merge origin/main dans le dépôt sans commit et sans fast-forward
    
    Returns:
        bool: True si succès, False sinon
    """
    repo_name = repo_path.name
    log_info(f"Traitement du dépôt: {repo_name} (dans {repo_path})")
    
    # Vérifier si c'est un dépôt git
    if not is_git_repo(repo_path):
        log_warning(f"{repo_name} n'est pas un dépôt git, ignoré")
        return True
    
    # Vérifier la branche actuelle
    current_branch = get_current_branch(repo_path)
    if not current_branch:
        log_error(f"Impossible de déterminer la branche actuelle pour {repo_name}")
        return False
    
    log_info(f"Branche actuelle dans {repo_name}: {current_branch}")
    
    # Afficher la branche actuelle pour info
    log_info(f"Branche actuelle dans {repo_name}: {current_branch}")
    
    # Fetch pour avoir les dernières modifications
    log_info(f"Fetch des dernières modifications pour {repo_name}...")
    success, error = run_git_command(['fetch', 'origin'], repo_path)
    if not success:
        log_error(f"Échec du fetch pour {repo_name}: {error}")
        return False
    
    # Vérifier s'il y a des modifications non committées
    if has_uncommitted_changes(repo_path):
        log_error(f"{repo_name} a des modifications non committées. Veuillez les committer ou les stasher avant de continuer.")
        return False
    
    # Vérifier si origin/main existe
    if not remote_branch_exists(repo_path):
        log_warning(f"{repo_name} n'a pas de branche origin/main, ignoré")
        return True
    
    # Vérifier s'il y a quelque chose à merger
    behind_count = get_commits_behind_count(repo_path)
    if behind_count == 0:
        log_success(f"{repo_name} est déjà à jour avec origin/main")
        return True
    
    # Effectuer le merge sans commit et sans fast-forward
    log_info(f"Merge de origin/main dans {repo_name} (sans commit, sans fast-forward)...")
    success, error = run_git_command(['merge', '--no-commit', '--no-ff', 'origin/main'], repo_path)
    
    if success:
        log_success(f"Merge préparé avec succès pour {repo_name}")
        
        # Afficher le statut pour information
        print(f"Statut après merge dans {repo_name}:")
        status_success, status_output = run_git_command(['status', '--short'], repo_path)
        if status_success:
            print(status_output if status_output else "Aucune modification")
        print()
        
        return True
    else:
        log_error(f"Conflit lors du merge dans {repo_name}")
        log_info("Résolvez les conflits manuellement, puis utilisez 'git add' et 'git commit'")
        
        # Afficher les fichiers en conflit
        conflict_success, conflict_output = run_git_command(['diff', '--name-only', '--diff-filter=U'], repo_path)
        if conflict_success and conflict_output:
            print("Fichiers en conflit:")
            for file in conflict_output.split('\n'):
                print(f"  - {file}")
        print()
        
        return False

def main():
    """Fonction principale"""
    # Déterminer le répertoire de travail
    if len(sys.argv) > 1:
        root_path = Path(sys.argv[1]).resolve()
    else:
        root_path = Path.cwd()
    
    if not root_path.exists():
        log_error(f"Le chemin {root_path} n'existe pas")
        sys.exit(1)
    
    if not root_path.is_dir():
        log_error(f"Le chemin {root_path} n'est pas un répertoire")
        sys.exit(1)
    
    log_info(f"Recherche des dépôts git dans: {root_path}")
    
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
    response = input(f"Voulez-vous merger origin/main dans ces {len(git_repos)} dépôts ? (y/N): ")
    if response.lower() not in ['y', 'yes', 'oui', 'o']:
        log_info("Opération annulée")
        return
    
    # Traiter chaque dépôt
    success_count = 0
    failed_repos = []
    
    for repo_path in git_repos:
        print(f"{'='*60}")
        if merge_main_in_repo(repo_path):
            success_count += 1
        else:
            failed_repos.append(repo_path)
        print()
    
    # Résumé final
    print(f"{'='*60}")
    log_info("RÉSUMÉ")
    log_success(f"Dépôts traités avec succès: {success_count}/{len(git_repos)}")
    
    if failed_repos:
        log_error(f"Dépôts avec erreurs: {len(failed_repos)}")
        for repo in failed_repos:
            print(f"  - {repo}")
    
    if failed_repos:
        sys.exit(1)
    else:
        log_success("Tous les merges ont été préparés avec succès!")

if __name__ == "__main__":
    main()