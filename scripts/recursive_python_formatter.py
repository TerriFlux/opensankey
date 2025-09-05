#!/usr/bin/env python3
"""
Script pour formater le code Python fichier par fichier
avec contrôle total sur les fichiers traités.

Usage: python file_formatter.py [chemin_racine]
"""

import subprocess
import sys
from pathlib import Path
from typing import List, Optional


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


def run_command(command: List[str], cwd: Optional[Path] = None) -> bool:
    """
    Exécute une commande et retourne True si succès
    """
    try:
        result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, check=True)
        return True
    except subprocess.CalledProcessError as e:
        log_error(f"Command failed: {' '.join(command)}")
        if e.stderr:
            print(e.stderr.strip())
        return False
    except FileNotFoundError:
        log_error(f"Command not found: {command[0]}")
        log_info(f"Install with: pip install {command[0]}")
        return False


def find_python_files(root_path: Path, exclude_dirs: List[str] = None) -> List[Path]:
    """
    Trouve tous les fichiers Python en excluant certains dossiers
    """
    if exclude_dirs is None:
        exclude_dirs = [
            "doc",
            "notebooks",
            "scripts_dbg",
            "archives",
            "client",
            "tests",
            "build",
            ".git",
            "__pycache__",
            ".pytest_cache",
            "node_modules",
            "alembic",
            "eigen",
            ".venv",
            "venv",
        ]

    python_files = []

    def should_exclude_path(path: Path) -> bool:
        """Vérifie si un chemin doit être exclu"""
        # Vérifier si un des dossiers parents est dans la liste d'exclusion
        for part in path.parts:
            if part in exclude_dirs:
                return True
        return False

    # Trouver tous les fichiers .py récursivement
    for py_file in root_path.rglob("*.py"):
        if not should_exclude_path(py_file):
            python_files.append(py_file)

    return sorted(python_files)


def format_files_batch(files: List[Path], batch_size: int = 10) -> bool:
    """
    Formate un lot de fichiers avec tous les outils
    """
    if not files:
        return True

    # Limiter la taille des lots pour éviter les lignes de commande trop longues
    if len(files) > 20:
        log_warning(f"Lot de {len(files)} fichiers trop important, division en sous-lots")

        success = True
        for i in range(0, len(files), 20):
            sub_batch = files[i: i + 20]
            if not format_files_batch(sub_batch, batch_size):
                success = False
        return success

    # Convertir en strings pour les commandes
    file_paths = [str(f) for f in files]

    log_info(f"Formatage de {len(files)} fichier(s):")
    for f in files:
        print(f"  - {f.name}")  # Afficher seulement le nom pour économiser l'espace

    success_count = 0
    total_commands = 5  # Ajout de flake8

    # 1. Format with black
    print(f"\n▶️ Running: black {len(files)} file(s)")
    if run_command(["black", "--line-length", "120"] + file_paths):
        success_count += 1
        log_success("Black terminé")

    # 2. Format with autopep8
    print(f"\n▶️ Running: autopep8 {len(files)} file(s)")
    autopep8_cmd = ["autopep8", "--in-place", "--aggressive", "--aggressive", "--max-line-length", "120"] + file_paths
    if run_command(autopep8_cmd):
        success_count += 1
        log_success("Autopep8 terminé")

    # 3. Fix lint issues with ruff
    print(f"\n▶️ Running: ruff check --fix {len(files)} file(s)")
    if run_command(["ruff", "check", "--fix", "--line-length", "120"] + file_paths):
        success_count += 1
        log_success("Ruff --fix terminé")

    # 4. Show remaining issues with ruff
    print(f"\n▶️ Running: ruff check {len(files)} file(s)")
    if run_command(["ruff", "check", "--line-length", "120"] + file_paths):
        success_count += 1
        log_success("Ruff check terminé")

    # 5. Check with flake8
    print(f"\n▶️ Running: flake8 {len(files)} file(s)")
    flake8_cmd = ["flake8", "--max-line-length", "120"] + file_paths
    if run_command(flake8_cmd):
        success_count += 1
        log_success("Flake8 check terminé")

    if success_count == total_commands:
        log_success(f"Lot de {len(files)} fichier(s) formaté avec succès")
        return True
    else:
        log_warning(f"Lot partiellement réussi ({success_count}/{total_commands})")
        return False


def check_tools_installed() -> bool:
    """Vérifie que tous les outils nécessaires sont installés"""
    tools = ["black", "autopep8", "ruff", "flake8"]
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


def group_files_by_directory(files: List[Path]) -> dict:
    """Groupe les fichiers par répertoire pour un affichage organisé"""
    grouped = {}
    for file in files:
        parent = file.parent
        if parent not in grouped:
            grouped[parent] = []
        grouped[parent].append(file)
    return grouped


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

    # Liste d'exclusion
    exclude_dirs = [
        "doc",
        "notebooks",
        "scripts_dbg",
        "archives",
        "client",
        "tests",
        "build",
        ".git",
        "__pycache__",
        ".pytest_cache",
        "node_modules",
        "alembic",
        "eigen",
        ".venv",
        "venv",
    ]

    log_info(f"Recherche des fichiers Python dans: {root_path}")
    log_info(f"Dossiers exclus: {', '.join(exclude_dirs)}")

    # Trouver tous les fichiers Python
    python_files = find_python_files(root_path, exclude_dirs)

    if not python_files:
        log_warning("Aucun fichier Python trouvé")
        return

    # Afficher les fichiers trouvés, groupés par dossier
    log_info(f"Fichiers Python trouvés: {len(python_files)}")
    grouped_files = group_files_by_directory(python_files)

    for directory, files in grouped_files.items():
        print(f"\n📁 {directory}:")
        for file in files:
            print(f"   - {file.name}")

    print(f"\n{'='*60}")
    print(f"Total: {len(python_files)} fichier(s) Python")

    # Demander confirmation
    response = input(f"\nVoulez-vous formater ces {len(python_files)} fichiers ? (y/N): ")
    if response.lower() not in ["y", "yes", "oui", "o"]:
        log_info("Opération annulée")
        return

    # Demander la taille des lots
    try:
        batch_size = int(input("Taille des lots (défaut: 10, 0 pour tout traiter d'un coup): ") or "10")
        if batch_size <= 0:
            batch_size = len(python_files)
    except ValueError:
        batch_size = 10

    # Traiter les fichiers par lots
    success_count = 0
    failed_batches = 0
    total_files_processed = 0

    # Diviser en lots
    for i in range(0, len(python_files), batch_size):
        batch = python_files[i: i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(python_files) + batch_size - 1) // batch_size

        print(f"\n{'='*60}")
        print(f"Lot {batch_num}/{total_batches}")

        if format_files_batch(batch, batch_size):
            success_count += len(batch)
            total_files_processed += len(batch)
        else:
            failed_batches += 1
            # Même en cas d'échec partiel, certains fichiers ont pu être traités
            total_files_processed += len(batch)

        # Pause sauf pour le dernier lot
        if i + batch_size < len(python_files):
            try:
                response = input("\nAppuyez sur Entrée pour continuer (q pour quitter): ")
                if response.lower() == "q":
                    log_info("Arrêt demandé par l'utilisateur")
                    break
            except KeyboardInterrupt:
                log_info("\nInterruption demandée par l'utilisateur")
                break

    # Résumé final
    print(f"\n{'='*60}")
    log_info("RÉSUMÉ")
    log_success(f"Fichiers traités: {total_files_processed}/{len(python_files)}")

    if failed_batches > 0:
        log_error(f"Lots avec erreurs: {failed_batches}")
        log_info("Note: Même les lots avec erreurs peuvent avoir formaté certains fichiers avec succès")

    if failed_batches == 0:
        log_success("Tous les fichiers ont été formatés avec succès!")
    else:
        log_warning("Certains lots ont eu des erreurs, mais le formatage peut avoir réussi partiellement")
        sys.exit(1)


if __name__ == "__main__":
    main()
