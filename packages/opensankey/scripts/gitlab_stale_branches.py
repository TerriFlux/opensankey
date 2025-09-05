#!/usr/bin/env python3
"""
Script pour gérer les branches périmées GitLab (locales ET distantes)
Usage: python gitlab_stale_branches.py [options]
"""

import subprocess
import sys
import argparse
from datetime import datetime, timedelta


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
        if capture_output and e.stderr:
            print(f"⚠️ Erreur: {e.stderr.strip()}")
        return None


def fetch_all_remote_branches(repo_path=None):
    """Récupère toutes les branches distantes"""
    print("🌐 Récupération des branches distantes...")

    # Fetch toutes les références distantes
    run_command("git fetch --all --prune", cwd=repo_path, capture_output=False)

    # Récupérer la liste de toutes les branches distantes
    remote_branches = run_command("git branch -r", cwd=repo_path)

    branches = []
    if remote_branches:
        for line in remote_branches.split("\n"):
            line = line.strip()
            if line and not line.startswith("origin/HEAD"):
                # Extraire le nom de la branche (enlever origin/)
                branch_name = line.replace("origin/", "")
                branches.append(branch_name)

    print(f"📊 {len(branches)} branches distantes trouvées")
    return branches


def get_local_branches(repo_path=None):
    """Récupère toutes les branches locales"""
    output = run_command("git branch --format='%(refname:short)'", cwd=repo_path)
    if output:
        return [b.strip() for b in output.split("\n") if b.strip()]
    return []


def get_current_branch(repo_path=None):
    """Obtient le nom de la branche courante"""
    return run_command("git branch --show-current", cwd=repo_path)


def get_branch_info(branch_name, repo_path=None, is_remote=False):
    """Obtient les informations détaillées d'une branche"""
    ref = f"origin/{branch_name}" if is_remote else branch_name

    # Date du dernier commit
    last_commit_date = run_command(f"git log -1 --format='%ci' {ref}", cwd=repo_path)

    # Dernier auteur
    last_author = run_command(f"git log -1 --format='%an' {ref}", cwd=repo_path)

    # Message du dernier commit
    last_message = run_command(f"git log -1 --format='%s' {ref}", cwd=repo_path)

    # Vérifier si la branche est mergée dans main/master
    main_branches = ["main", "master", "develop"]
    is_merged = False
    merged_into = None

    for main_branch in main_branches:
        # Vérifier si la branche principale existe
        if run_command(f"git show-ref --verify --quiet refs/heads/{main_branch}", cwd=repo_path) is not None:
            continue
        if (
            run_command(
                f"git show-ref --verify --quiet refs/remotes/origin/{main_branch}",
                cwd=repo_path,
            )
            is not None
        ):
            continue

        # Vérifier si mergée
        merge_check = run_command(f"git merge-base --is-ancestor {ref} origin/{main_branch}", cwd=repo_path)
        if merge_check is not None:  # Code de retour 0 = mergée
            is_merged = True
            merged_into = main_branch
            break

    # Parser la date
    commit_date = None
    if last_commit_date:
        try:
            commit_date = datetime.fromisoformat(last_commit_date.rsplit(" ", 1)[0])
        except BaseException:
            pass

    return {
        "name": branch_name,
        "last_commit_date": commit_date,
        "last_author": last_author,
        "last_message": last_message,
        "is_merged": is_merged,
        "merged_into": merged_into,
        "is_remote": is_remote,
    }


def classify_stale_branches(all_branches, repo_path=None, stale_days=30):
    """Classifie les branches comme périmées selon différents critères"""
    current_branch = get_current_branch(repo_path)
    protected_branches = ["main", "master", "develop", "production", "staging"]

    stale_branches = {
        "orphaned": [],  # Branches locales dont le remote n'existe plus
        "old": [],  # Branches anciennes (>30 jours)
        "merged": [],  # Branches mergées
        "remote_only": [],  # Branches qui existent seulement en remote
    }

    cutoff_date = datetime.now() - timedelta(days=stale_days)

    local_branches = get_local_branches(repo_path)
    remote_branches = all_branches

    print(f"🔍 Analyse de {len(local_branches)} branches locales et {len(remote_branches)} branches distantes...")

    # 1. BRANCHES LOCALES ORPHELINES
    for local_branch in local_branches:
        if local_branch == current_branch or local_branch in protected_branches:
            continue

        if local_branch not in remote_branches:
            branch_info = get_branch_info(local_branch, repo_path, is_remote=False)
            branch_info["reason"] = "Local branch with no remote equivalent"
            stale_branches["orphaned"].append(branch_info)

    # 2. BRANCHES ANCIENNES ET MERGÉES (locales ET distantes)
    all_branch_names = set(local_branches + remote_branches)

    for branch_name in all_branch_names:
        if branch_name == current_branch or branch_name in protected_branches:
            continue

        # Prioriser les informations de la branche distante si elle existe
        is_remote = branch_name in remote_branches
        branch_info = get_branch_info(branch_name, repo_path, is_remote=is_remote)

        # Vérifier si ancienne
        if branch_info["last_commit_date"] and branch_info["last_commit_date"] < cutoff_date:
            branch_info["reason"] = f"No activity for {stale_days}+ days"
            stale_branches["old"].append(branch_info)

        # Vérifier si mergée
        elif branch_info["is_merged"]:
            branch_info["reason"] = f"Merged into {branch_info['merged_into']}"
            stale_branches["merged"].append(branch_info)

    # 3. BRANCHES QUI N'EXISTENT QUE EN REMOTE
    for remote_branch in remote_branches:
        if remote_branch not in local_branches and remote_branch not in protected_branches:
            branch_info = get_branch_info(remote_branch, repo_path, is_remote=True)

            # Les ajouter seulement si elles sont anciennes ou mergées
            if branch_info["last_commit_date"] and branch_info["last_commit_date"] < cutoff_date:
                branch_info["reason"] = f"Remote-only branch, {stale_days}+ days old"
                stale_branches["remote_only"].append(branch_info)
            elif branch_info["is_merged"]:
                branch_info["reason"] = f"Remote-only branch, merged into {branch_info['merged_into']}"
                stale_branches["remote_only"].append(branch_info)

    return stale_branches


def display_stale_branches(stale_branches):
    """Affiche les branches périmées par catégorie"""
    total = sum(len(branches) for branches in stale_branches.values())

    if total == 0:
        print("✅ Aucune branche périmée trouvée !")
        return

    print(f"\n📊 {total} branche(s) périmée(s) trouvée(s) :")
    print("=" * 60)

    categories = {
        "orphaned": "🗑️ Branches locales orphelines",
        "old": "🕰️ Branches anciennes",
        "merged": "🔀 Branches mergées",
        "remote_only": "🌐 Branches distantes candidates",
    }

    for category, title in categories.items():
        branches = stale_branches[category]
        if not branches:
            continue

        print(f"\n{title} ({len(branches)}):")
        print("-" * 40)

        for branch in branches:
            print(f"🌿 {branch['name']}")
            if branch["last_commit_date"]:
                print(f"   📅 Dernier commit: {branch['last_commit_date'].strftime('%Y-%m-%d %H:%M')}")
            if branch["last_author"]:
                print(f"   👤 Auteur: {branch['last_author']}")
            if branch["last_message"]:
                print(f"   💬 Message: {branch['last_message'][:60]}...")
            print(f"   ℹ️  Raison: {branch['reason']}")
            print(f"   📍 Type: {'Remote' if branch['is_remote'] else 'Local'}")
            print()


def delete_branches_interactive(stale_branches, repo_path=None):
    """Suppression interactive des branches périmées"""
    all_branches = []
    for category_branches in stale_branches.values():
        all_branches.extend(category_branches)

    if not all_branches:
        return

    print(f"\n🗑️ Suppression interactive de {len(all_branches)} branche(s)")
    print("=" * 50)

    deleted_local = 0
    deleted_remote = 0

    for i, branch in enumerate(all_branches):
        print(f"\n{'='*60}")
        print(f"🌿 Branche {i+1}/{len(all_branches)}: {branch['name']}")
        print(f"📍 Type: {'Remote' if branch['is_remote'] else 'Local'}")
        print(f"ℹ️  Raison: {branch['reason']}")
        if branch["last_commit_date"]:
            print(f"📅 Dernier commit: {branch['last_commit_date'].strftime('%Y-%m-%d %H:%M')}")

        while True:
            print(f"\n❓ Supprimer '{branch['name']}' ?")
            if branch["is_remote"]:
                print("   [y] Oui (remote seulement)")
                print("   [l] Checkout local + supprimer remote")
            else:
                print("   [y] Oui (local seulement)")
                print("   [r] Oui (local + remote)")
            print("   [n] Non")
            print("   [s] Sauter toutes les suivantes")
            print("   [q] Quitter")

            choice = input("Votre choix: ").lower().strip()

            if choice in ["y", "yes"]:
                success = delete_branch(
                    branch,
                    repo_path,
                    delete_remote=branch["is_remote"],
                    delete_local=not branch["is_remote"],
                )
                if success:
                    if branch["is_remote"]:
                        deleted_remote += 1
                    else:
                        deleted_local += 1
                break
            elif choice == "l" and branch["is_remote"]:
                # Checkout local puis supprimer remote
                print(f"📥 Checkout de {branch['name']} en local...")
                if run_command(
                    f"git checkout -b {branch['name']} origin/{branch['name']}",
                    cwd=repo_path,
                ):
                    success = delete_branch(branch, repo_path, delete_remote=True, delete_local=True)
                    if success:
                        deleted_remote += 1
                        deleted_local += 1
                break
            elif choice == "r" and not branch["is_remote"]:
                success = delete_branch(branch, repo_path, delete_remote=True, delete_local=True)
                if success:
                    deleted_local += 1
                    deleted_remote += 1
                break
            elif choice in ["n", "no"]:
                print(f"🛡️ Branche '{branch['name']}' conservée")
                break
            elif choice in ["s", "skip"]:
                print("⏭️ Saut de toutes les branches restantes")
                return deleted_local, deleted_remote
            elif choice in ["q", "quit"]:
                print("🚪 Arrêt demandé")
                return deleted_local, deleted_remote
            else:
                print("⚠️ Choix invalide")

    return deleted_local, deleted_remote


def delete_branch(branch_info, repo_path=None, delete_remote=False, delete_local=False):
    """Supprime une branche localement et/ou sur le remote"""
    branch_name = branch_info["name"]
    success = True

    # Suppression locale
    if delete_local:
        print(f"🗑️ Suppression locale de '{branch_name}'...")

        # Essayer suppression normale puis forcée si nécessaire
        if not run_command(f"git branch -d {branch_name}", cwd=repo_path):
            force = input(f"⚠️ Forcer la suppression locale de '{branch_name}'? (y/N): ")
            if force.lower() in ["y", "yes"]:
                if run_command(f"git branch -D {branch_name}", cwd=repo_path):
                    print(f"✅ Branche locale '{branch_name}' supprimée (forcé)")
                else:
                    print("❌ Échec suppression locale forcée")
                    success = False
            else:
                success = False
        else:
            print(f"✅ Branche locale '{branch_name}' supprimée")

    # Suppression remote
    if delete_remote and success:
        print(f"🌐 Suppression remote de '{branch_name}'...")
        if run_command(f"git push origin --delete {branch_name}", cwd=repo_path):
            print(f"✅ Branche remote '{branch_name}' supprimée")
        else:
            print("❌ Échec suppression remote (permissions ? branche protégée ?)")
            success = False

    return success


def main():
    """Fonction principale"""
    parser = argparse.ArgumentParser(description="Gestionnaire de branches périmées GitLab")
    parser.add_argument("repo_path", nargs="?", default=".", help="Chemin vers le dépôt Git")
    parser.add_argument(
        "--stale-days",
        type=int,
        default=30,
        help="Nombre de jours pour considérer une branche comme ancienne",
    )
    parser.add_argument("--show-only", action="store_true", help="Afficher seulement, ne pas supprimer")
    parser.add_argument(
        "--category",
        choices=["orphaned", "old", "merged", "remote_only"],
        help="Afficher seulement une catégorie",
    )

    args = parser.parse_args()

    print("🌿 Gestionnaire de branches périmées GitLab")
    print("=" * 50)

    # Vérifier que c'est un dépôt Git
    if not run_command("git rev-parse --git-dir", cwd=args.repo_path):
        print("❌ Pas un dépôt Git valide")
        sys.exit(1)

    # Récupérer toutes les branches distantes
    remote_branches = fetch_all_remote_branches(args.repo_path)

    # Classifier les branches périmées
    stale_branches = classify_stale_branches(remote_branches, args.repo_path, args.stale_days)

    # Filtrer par catégorie si demandé
    if args.category:
        filtered = {args.category: stale_branches[args.category]}
        stale_branches = filtered

    # Afficher les résultats
    display_stale_branches(stale_branches)

    # Suppression interactive si demandé
    if not args.show_only:
        total_branches = sum(len(branches) for branches in stale_branches.values())
        if total_branches > 0:
            proceed = input(f"\n🤔 Procéder à la suppression interactive de {total_branches} branche(s)? (y/N): ")
            if proceed.lower() in ["y", "yes"]:
                deleted_local, deleted_remote = delete_branches_interactive(stale_branches, args.repo_path)
                print("\n📊 Résumé:")
                print(f"  🗑️ Branches locales supprimées: {deleted_local}")
                print(f"  🌐 Branches distantes supprimées: {deleted_remote}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n❌ Interruption par l'utilisateur")
        sys.exit(1)
