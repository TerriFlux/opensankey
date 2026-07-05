#!/usr/bin/env python3
"""
Script pour supprimer interactivement les branches Git locales ET distantes
Usage: python git_branch_selector.py [chemin_vers_depot]
"""

import subprocess
import sys
import os
import argparse


def run_command(command, capture_output=True, cwd=None):
    """Exécute une commande shell et retourne le résultat"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=capture_output,
            text=True,
            check=True,
            cwd=cwd,
        )
        return result.stdout.strip() if capture_output else None
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de l'exécution de: {command}")
        if capture_output:
            print(f"Sortie d'erreur: {e.stderr}")
        return None


def get_current_branch(repo_path=None):
    """Obtient le nom de la branche courante"""
    output = run_command("git branch --show-current", cwd=repo_path)
    return output if output else None


def check_detached_head(repo_path=None):
    """Vérifie si on est en HEAD détaché"""
    current_branch = get_current_branch(repo_path)
    if current_branch is None or current_branch.strip() == "":
        head_info = run_command("git branch", cwd=repo_path)
        if head_info and "HEAD detached" in head_info:
            return True
    return False


def get_local_branches(repo_path=None):
    """Récupère toutes les branches locales"""
    output = run_command("git branch", cwd=repo_path)
    if output is None:
        return []

    branches = []
    for line in output.split("\n"):
        line = line.strip()
        if line:
            # Enlever l'astérisque et les espaces pour la branche courante
            clean_branch = line.lstrip("* ").strip()
            if clean_branch and not clean_branch.startswith("("):  # Ignorer "(HEAD detached...)"
                branches.append(clean_branch)

    print(f"🔍 DEBUG - Lignes brutes git branch: {output.split(chr(10))}")  # Toutes les lignes
    return branches


def get_remote_branches(repo_path=None):
    """Récupère toutes les branches distantes (sans origin/)"""
    output = run_command("git branch -r", cwd=repo_path)
    if output is None:
        return []

    branches = []
    for line in output.split("\n"):
        line = line.strip()
        if line and not line.endswith("/HEAD") and line.startswith("origin/"):
            # Enlever le préfixe 'origin/'
            clean_branch = line[7:]  # Enlever 'origin/'
            branches.append(clean_branch)

    print(f"🔍 DEBUG - Lignes brutes git branch -r: {output.split(chr(10))[:5]}...")  # Première 5 lignes
    return branches


def get_remote_only_branches(repo_path=None):
    """Récupère les branches qui existent seulement sur le remote"""
    local_branches = set(get_local_branches(repo_path))
    remote_branches = set(get_remote_branches(repo_path))

    # DEBUG: Afficher les branches pour diagnostic
    print(f"🔍 DEBUG - Branches locales trouvées: {local_branches}")
    print(f"🔍 DEBUG - Branches distantes trouvées: {remote_branches}")

    # Branches qui sont sur le remote mais pas en local
    remote_only = remote_branches - local_branches
    print(f"🔍 DEBUG - Branches distantes orphelines: {remote_only}")

    remote_branch_info = []
    for branch in remote_only:
        # Obtenir la date du dernier commit
        last_commit_date = get_last_commit_date_remote(branch, repo_path)

        remote_branch_info.append(
            {
                "name": branch,
                "is_current": False,
                "info": f"[origin/{branch}]",
                "status": "remote_only",
                "full_line": f"  origin/{branch}",
                "last_commit_date": last_commit_date,
            }
        )

    return remote_branch_info


def get_last_commit_date_remote(branch_name, repo_path=None):
    """Obtient la date du dernier commit d'une branche distante"""
    date_output = run_command(f'git log -1 --format="%ci" origin/{branch_name}', cwd=repo_path)
    if date_output:
        try:
            from datetime import datetime

            dt = datetime.fromisoformat(date_output.replace('"', "").rsplit(" ", 1)[0])
            return dt.strftime("%Y-%m-%d %H:%M")
        except BaseException:
            return date_output.replace('"', "")[:16] if date_output else "inconnue"
    return "inconnue"


def get_all_branches(repo_path=None):
    """Récupère toutes les branches locales avec leurs informations"""
    output = run_command("git branch -vv", cwd=repo_path)
    if output is None:
        return []

    branches = []
    lines = output.split("\n")

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Déterminer si c'est la branche courante
        is_current = line.startswith("*")

        # Extraire le nom de la branche
        if is_current:
            # Enlever l'astérisque et l'espace
            line_clean = line[2:]
        else:
            line_clean = line

        # Parser le nom de la branche (première partie)
        parts = line_clean.split()
        if not parts:
            continue

        branch_name = parts[0]

        # Ignorer les entrées spéciales comme (HEAD detached...)
        if branch_name.startswith("("):
            continue

        # Obtenir les infos supplémentaires
        info = " ".join(parts[1:]) if len(parts) > 1 else ""

        # Déterminer le statut
        status = "courante" if is_current else "locale"
        if ": gone]" in info:
            status = "orpheline"
        elif "[origin/" in info:
            status = "trackée"

        # Obtenir la date du dernier commit
        last_commit_date = get_last_commit_date(branch_name, repo_path)

        branches.append(
            {
                "name": branch_name,
                "is_current": is_current,
                "info": info,
                "status": status,
                "full_line": line,
                "last_commit_date": last_commit_date,
            }
        )

    return branches


def get_last_commit_date(branch_name, repo_path=None):
    """Obtient la date du dernier commit d'une branche"""
    date_output = run_command(f'git log -1 --format="%ci" {branch_name}', cwd=repo_path)
    if date_output:
        try:
            from datetime import datetime

            dt = datetime.fromisoformat(date_output.replace('"', "").rsplit(" ", 1)[0])
            return dt.strftime("%Y-%m-%d %H:%M")
        except BaseException:
            return date_output.replace('"', "")[:16] if date_output else "inconnue"
    return "inconnue"


def display_branch_info(branch, index, total, branch_type="locale"):
    """Affiche les informations d'une branche"""
    print(f"\n{'='*60}")

    if branch_type == "remote":
        print(f"🌐 Branche distante {index + 1}/{total}: {branch['name']}")
        print("📊 Statut: branche distante uniquement")
        print(f"📅 Dernier commit: {branch['last_commit_date']}")
        print("🗑️  Cette branche existe sur le serveur mais pas en local")
    else:
        print(f"🌿 Branche {index + 1}/{total}: {branch['name']}")
        print(f"📊 Statut: {branch['status']}")
        print(f"📅 Dernier commit: {branch['last_commit_date']}")

        if branch["is_current"]:
            print("📍 ⭐ BRANCHE COURANTE ⭐")

        if branch["info"]:
            print(f"ℹ️  Info: {branch['info']}")

        # Indications visuelles selon le statut
        if branch["status"] == "orpheline":
            print("🗑️  Cette branche n'existe plus sur le serveur distant")
        elif branch["status"] == "courante":
            print("⚠️  Attention: c'est votre branche courante")
        elif branch["status"] == "trackée":
            print("🔗 Cette branche suit une branche distante")


def ask_delete_branch(branch, branch_type="locale"):
    """Demande à l'utilisateur s'il veut supprimer la branche"""
    if branch_type == "locale" and branch["is_current"]:
        print("❌ Impossible de supprimer la branche courante")
        return False

    while True:
        if branch_type == "remote":
            print(f"\n❓ Supprimer la branche distante '{branch['name']}' ?")
            print("   [y] Oui (supprimer du serveur)")
            print("   [n] Non (garder)")
        else:
            print(f"\n❓ Supprimer la branche '{branch['name']}' ?")
            print("   [y] Oui (local seulement)")
            print("   [Y] Oui (local + remote)")
            print("   [n] Non (garder)")

        print("   [s] Sauter toutes les suivantes")
        print("   [q] Quitter le script")

        choice = input("Votre choix (q pour quitter): ").strip()

        if choice in ["y", "yes", "o", "oui"]:
            return "remote" if branch_type == "remote" else "local"
        elif choice in ["Y", "YES"] and branch_type == "locale":
            return "both"
        elif choice in ["n", "no", "non", "N"]:
            return False
        elif choice in ["s", "skip", "S"]:
            return "skip_all"
        elif choice in ["q", "quit", "exit", "Q"]:
            return "quit"
        else:
            if branch_type == "remote":
                print("⚠️  Choix invalide. Utilisez y/n/s/q (q pour quitter)")
            else:
                print("⚠️  Choix invalide. Utilisez y/Y/n/s/q (q pour quitter)")


def delete_branch(branch_name, repo_path=None, delete_remote=False):
    """Supprime une branche localement et optionnellement sur le remote"""
    print(f"🗑️  Suppression de '{branch_name}'...")

    # Suppression locale
    result = run_command(f"git branch -d {branch_name}", cwd=repo_path)

    if result is None:
        print("⚠️  La suppression normale a échoué (commits non mergés ?)")
        force_choice = input("🔨 Forcer la suppression locale ? (y/N): ").lower()

        if force_choice in ["y", "yes", "o", "oui"]:
            result = run_command(f"git branch -D {branch_name}", cwd=repo_path)
            if result is None:
                print(f"❌ Échec de la suppression forcée locale de '{branch_name}'")
                return False
            else:
                print(f"✅ Branche '{branch_name}' supprimée localement (forcé)")
        else:
            print(f"🚫 Suppression de '{branch_name}' annulée")
            return False
    else:
        print(f"✅ Branche '{branch_name}' supprimée localement")

    # Suppression sur le remote si demandée
    if delete_remote:
        return delete_remote_branch(branch_name, repo_path)

    return True


def delete_remote_branch(branch_name, repo_path=None):
    """Supprime une branche sur le remote"""
    print(f"🌐 Suppression de '{branch_name}' sur le remote...")

    # Vérifier d'abord si la branche existe sur le remote
    remote_check = run_command(f"git ls-remote --heads origin {branch_name}", cwd=repo_path)

    if remote_check and remote_check.strip():
        # La branche existe sur le remote, la supprimer
        remote_result = run_command(f"git push origin --delete {branch_name}", cwd=repo_path)
        if remote_result is None:
            print(f"❌ Échec de la suppression remote de '{branch_name}'")
            print("   (problème de permissions ou de connexion ?)")
            return False
        else:
            print(f"✅ Branche '{branch_name}' supprimée sur le remote")
            return True
    else:
        print(f"ℹ️  Branche '{branch_name}' n'existe pas sur le remote (déjà supprimée ?)")
        return True


def validate_git_repo(repo_path):
    """Vérifie que le chemin donné est un dépôt Git valide"""
    if not os.path.exists(repo_path):
        print(f"❌ Le chemin '{repo_path}' n'existe pas")
        return False

    if not os.path.isdir(repo_path):
        print(f"❌ Le chemin '{repo_path}' n'est pas un dossier")
        return False

    # Vérifier que c'est un dépôt Git
    if run_command("git rev-parse --git-dir", cwd=repo_path) is None:
        return False

    return True


def find_git_repo_in_folder(folder_path):
    """Trouve un dépôt Git dans un dossier (soit le dossier lui-même, soit un sous-dossier)"""
    if validate_git_repo(folder_path):
        return folder_path

    try:
        for item in os.listdir(folder_path):
            item_path = os.path.join(folder_path, item)
            if os.path.isdir(item_path) and validate_git_repo(item_path):
                return item_path
    except PermissionError:
        pass

    return None


def parse_arguments():
    """Parse les arguments de la ligne de commande"""
    parser = argparse.ArgumentParser(
        description="Suppression interactive des branches Git locales ET distantes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples d'utilisation:
  python git_branch_selector.py                      # Branches locales du dépôt courant
  python git_branch_selector.py --remote-only        # Branches distantes sans équivalent local
  python git_branch_selector.py --show-all           # Toutes les branches locales
  python git_branch_selector.py /path/to/repo        # Dépôt spécifique

Contrôles pendant l'exécution:
  y     = Supprimer localement OU sur le remote (selon le contexte)
  Y     = Supprimer localement ET sur le remote (branches locales seulement)
  n     = Garder la branche
  s     = Sauter toutes les branches restantes
  q     = Quitter immédiatement
        """,
    )

    parser.add_argument(
        "repo_path",
        nargs="?",
        default=".",
        help="Chemin vers un dépôt Git ou un dossier contenant un dépôt (défaut: répertoire courant)",
    )

    parser.add_argument(
        "--show-all",
        action="store_true",
        help="Afficher toutes les branches locales (y compris celles trackées)",
    )

    parser.add_argument(
        "--orphans-only",
        action="store_true",
        help="Afficher seulement les branches locales orphelines",
    )

    parser.add_argument(
        "--remote-only",
        action="store_true",
        help="Afficher seulement les branches distantes sans équivalent local",
    )

    return parser.parse_args()


def main():
    """Fonction principale"""
    args = parse_arguments()

    print("🌿 Sélecteur interactif de branches Git")
    print("=" * 50)
    print("💡 Appuyez sur 'q' à tout moment pour quitter")
    print("=" * 50)

    # Résoudre le chemin absolu
    input_path = os.path.abspath(args.repo_path)
    print(f"📁 Chemin d'entrée: {input_path}")

    # Vérifier que le chemin existe
    if not os.path.exists(input_path):
        print(f"❌ Le chemin '{input_path}' n'existe pas")
        sys.exit(1)

    # Déterminer le dépôt Git à utiliser
    if validate_git_repo(input_path):
        repo_path = input_path
        print(f"✅ Dépôt Git détecté: {os.path.basename(repo_path)}")
    else:
        repo_path = find_git_repo_in_folder(input_path)
        if repo_path:
            print(f"✅ Dépôt Git trouvé: {os.path.basename(repo_path)}")
        else:
            print(f"❌ Aucun dépôt Git trouvé dans '{input_path}'")
            sys.exit(1)

    # Mettre à jour les références distantes
    print("🔄 Mise à jour des références distantes...")
    run_command("git fetch --prune", cwd=repo_path)

    # Vérifier si on est en HEAD détaché
    if check_detached_head(repo_path):
        print("\n⚠️  ATTENTION: Vous êtes en mode HEAD détaché !")
        print("📍 Certaines opérations peuvent être limitées")

    # Déterminer quelles branches traiter
    if args.remote_only:
        # Mode: branches distantes seulement
        branches = get_remote_only_branches(repo_path)
        branch_type = "remote"
        print("\n🌐 Mode: branches distantes sans équivalent local")

        if not branches:
            print("✅ Aucune branche distante orpheline trouvée")
            sys.exit(0)

    else:
        # Mode: branches locales
        branch_type = "locale"
        all_branches = get_all_branches(repo_path)

        if not all_branches:
            print("❌ Aucune branche locale trouvée")
            sys.exit(1)

        # Filtrer selon les options
        if args.orphans_only:
            branches = [b for b in all_branches if b["status"] == "orpheline"]
            print("\n🔍 Mode: branches locales orphelines uniquement")
        elif not args.show_all:
            branches = [b for b in all_branches if b["status"] in ["orpheline", "courante", "locale"]]
            print("\n🔍 Mode: branches locales (exclusion des trackées - utilisez --show-all pour les inclure)")
        else:
            branches = all_branches
            print("\n🔍 Mode: toutes les branches locales")

    if not branches:
        print("✅ Aucune branche à examiner selon les critères sélectionnés")
        sys.exit(0)

    print(f"📊 {len(branches)} branche(s) à examiner")

    # Traitement interactif
    deleted_count = 0
    skipped_count = 0
    skip_all = False

    for i, branch in enumerate(branches):
        if skip_all:
            skipped_count += 1
            continue

        display_branch_info(branch, i, len(branches), branch_type)

        if not skip_all:
            decision = ask_delete_branch(branch, branch_type)

            if decision == "quit":
                print("\n🚪 Arrêt demandé par l'utilisateur")
                break
            elif decision == "skip_all":
                skip_all = True
                skipped_count += len(branches) - i
                print(f"⏭️  Saut de toutes les branches restantes ({len(branches) - i})")
                break
            elif decision == "local":
                if delete_branch(branch["name"], repo_path, delete_remote=False):
                    deleted_count += 1
            elif decision == "both":
                if delete_branch(branch["name"], repo_path, delete_remote=True):
                    deleted_count += 1
            elif decision == "remote":
                if delete_remote_branch(branch["name"], repo_path):
                    deleted_count += 1
            else:
                print(f"🛡️  Branche '{branch['name']}' conservée")

    # Résumé final
    print(f"\n{'='*50}")
    print("📊 Résumé:")
    print(f"  ✅ Branches supprimées: {deleted_count}")
    print(f"  🛡️  Branches conservées: {len(branches) - deleted_count - skipped_count}")
    if skipped_count > 0:
        print(f"  ⏭️  Branches ignorées: {skipped_count}")

    # Afficher l'état final
    if branch_type == "locale":
        print("\n📋 Branches locales restantes:")
        final_output = run_command("git branch", cwd=repo_path)
        if final_output:
            for line in final_output.split("\n"):
                if line.strip():
                    print(f"  {line}")
    else:
        print("\n📋 Branches distantes restantes (sans équivalent local):")
        remaining_remote = get_remote_only_branches(repo_path)
        if remaining_remote:
            for branch in remaining_remote:
                print(f"  origin/{branch['name']}")
        else:
            print("  Aucune")

    print("\n✅ Session terminée !")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Interruption par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur inattendue: {e}")
        sys.exit(1)
