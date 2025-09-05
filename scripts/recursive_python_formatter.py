#!/usr/bin/env python3
"""
Script pour formater récursivement le code Python dans tous les dossiers
trouvés à partir d'un répertoire racine.

Usage: python recursive_formatter.py [chemin_racine]
"""

import subprocess
import sys
import os
from pathlib import Path
from typing import List, Optional

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

def run_command(command: List[str], cwd: Optional[Path] = None) -> bool:
    """
    Exécute une commande et retourne True si succès
    """
    print(f"\n▶️ Running: {' '.join(command)}")
    try:
        result = subprocess.run(
            command, 
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True
        )
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        log_error(f"Command failed: {' '.join(command)}")
        if e.stderr:
            print(e.stderr)
        if e.stdout:
            print(e.stdout)
        return False
    except FileNotFoundError:
        log_error(f"Command not found: {command[0]}")
        log_info(f"Install with: pip install {command[0]}")
        return False

def has_python_files(directory: Path) -> bool:
    """Vérifie si un dossier contient des fichiers Python"""
    for file in directory.rglob("*.py"):
        return True
    return False

def find_python_directories(root_path: Path, exclude_dirs: List[str] = None) -> List[Path]:
    """
    Trouve tous les dossiers contenant des fichiers Python
    """
    if exclude_dirs is None:
        exclude_dirs = ['build','.git', '__pycache__', '.pytest_cache', 'node_modules', 'alembic','eigen','.venv', 'venv']
    
    python_dirs = []
    
    def scan_directory(path: Path):
        # Ignorer les dossiers exclus
        if path.name in exclude_dirs:
            return
            
        # Si le dossier contient des fichiers Python, l'ajouter
        if has_python_files(path):
            python_dirs.append(path)
        
        # Scanner les sous-dossiers
        try:
            for item in path.iterdir():
                if item.is_dir() and not item.name.startswith('.'):
                    scan_directory(item)
        except PermissionError:
            log_warning(f"Permission refusée pour accéder à {path}")
    
    scan_directory(root_path)
    return python_dirs

def format_directory(target_dir: Path) -> bool:
    """
    Formate un dossier avec black, autopep8 et ruff
    """
    dir_name = target_dir.name
    log_info(f"Formatage de: {dir_name} (dans {target_dir})")
    
    if not has_python_files(target_dir):
        log_info(f"Aucun fichier Python trouvé dans {dir_name}, ignoré")
        return True
    
    success_count = 0
    total_commands = 4
    
    # 1. Format with black
    if run_command(["black", str(target_dir)]):
        success_count += 1
    
    # 2. Format with autopep8
    if run_command([
        "autopep8",
        "--in-place",
        "--aggressive",
        "--aggressive", 
        "--recursive",
        str(target_dir)
    ]):
        success_count += 1
    
    # 3. Fix lint issues with ruff
    if run_command(["ruff", "check", str(target_dir), "--fix"]):
        success_count += 1
    
    # 4. Show remaining issues with ruff (remplace flake8)
    if run_command(["ruff", "check", str(target_dir)]):
        success_count += 1
    
    if success_count == total_commands:
        log_success(f"Formatage terminé avec succès pour {dir_name}")
        return True
    else:
        log_warning(f"Formatage partiellement réussi pour {dir_name} ({success_count}/{total_commands})")
        return False

def check_tools_installed() -> bool:
    """Vérifie que tous les outils nécessaires sont installés"""
    tools = ["black", "autopep8", "ruff"]
    missing_tools = []
    
    for tool in tools:
        try:
            subprocess.run([tool, "--version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            missing_tools.append(tool)
    
    if missing_tools:
        log_error("Outils manquants:")
        for tool in missing_tools:
            print(f"  - {tool}")
        log_info("Installez avec: pip install " + " ".join(missing_tools))
        return False
    
    return True

def main():
    """Fonction principale"""
    # Vérifier les outils
    if not check_tools_installed():
        sys.exit(1)
    
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
    
    log_info(f"Recherche des dossiers Python dans: {root_path}")
    
    # Trouver tous les dossiers avec du Python
    python_dirs = find_python_directories(root_path)
    
    if not python_dirs:
        log_warning("Aucun dossier contenant du Python trouvé")
        return
    
    log_info(f"Dossiers Python trouvés: {len(python_dirs)}")
    for directory in python_dirs:
        print(f"  - {directory}")
    print()
    
    # Demander confirmation
    response = input(f"Voulez-vous formater ces {len(python_dirs)} dossiers ? (y/N): ")
    if response.lower() not in ['y', 'yes', 'oui', 'o']:
        log_info("Opération annulée")
        return
    
    # Traiter chaque dossier
    success_count = 0
    failed_dirs = []
    
    for i, dir_path in enumerate(python_dirs):
        print(f"{'='*60}")
        print(f"Dossier {i+1}/{len(python_dirs)}")
        
        if format_directory(dir_path):
            success_count += 1
        else:
            failed_dirs.append(dir_path)
        
        print()
        
        # Pause sauf pour le dernier dossier
        if i < len(python_dirs) - 1:
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
    log_success(f"Dossiers formatés avec succès: {success_count}/{len(python_dirs)}")
    
    if failed_dirs:
        log_error(f"Dossiers avec erreurs: {len(failed_dirs)}")
        for directory in failed_dirs:
            print(f"  - {directory}")
    
    if failed_dirs:
        sys.exit(1)
    else:
        log_success("Tous les dossiers ont été formatés avec succès!")

if __name__ == "__main__":
    main()