#!/usr/bin/env python3
"""
Script pour supprimer les branches locales qui n'existent plus sur le serveur distant
Usage: python git_clean_branches.py [chemin_vers_depot]
"""

import subprocess
import re
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
            cwd=cwd
        )
        return result.stdout.strip() if capture_output else None
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de l'exécution de: {command}")
        print(f"Code d'erreur: {e.returncode}")
        print(f"Sortie d'erreur: {e.stderr}")
        return None

def fetch_and_prune(repo_path=None):
    """Met à jour les références distantes et supprime les références obsolètes"""
    print("🔄 Mise à jour des références distantes...")
    result = run_command("git fetch --prune", capture_output=False, cwd=repo_path)
    if result is None:
        print("⚠️  Avertissement lors de la mise à jour des références (peut être dû à HEAD détaché)")
        print("🔄 Tentative de continuation...")
        return True  # Continue même en cas d'erreur
    print("✅ Références mises à jour")
    return True

def get_gone_branches(repo_path=None):
    """Récupère la liste des branches locales dont le upstream est 'gone'"""
    print("\n🔍 Recherche des branches orphelines...")
    
    # Obtenir les branches avec leur statut de suivi
    output = run_command("git branch -vv", cwd=repo_path)
    if output is None:
        return []
    
    gone_branches = []
    lines = output.split('\n')
    
    for line in lines:
        # Chercher les lignes contenant ': gone]'
        if ': gone]' in line:
            # Extraire le nom de la branche (première colonne, sans l'éventuel *)
            branch_match = re.match(r'\s*\*?\s*([^\s]+)', line)
            if branch_match:
                branch_name = branch_match.group(1)
                gone_branches.append(branch_name)
    
    return gone_branches

def get_current_branch(repo_path=None):
    """Obtient le nom de la branche courante"""
    output = run_command("git branch --show-current", cwd=repo_path)
    return output if output else None

def check_detached_head(repo_path=None):
    """Vérifie si on est en HEAD détaché"""
    current_branch = get_current_branch(repo_path)
    if current_branch is None or current_branch.strip() == "":
        # Vérifier si on est vraiment en HEAD détaché
        head_info = run_command("git branch", cwd=repo_path)
        if head_info and "HEAD detached" in head_info:
            return True
    return False

def delete_branches(branches, repo_path=None, force=False, dry_run=False):
    """Supprime les branches spécifiées"""
    if not branches:
        print("✅ Aucune branche orpheline trouvée")
        return
    
    current_branch = get_current_branch(repo_path)
    if current_branch:
        print(f"\n📍 Branche courante: {current_branch}")
    else:
        print(f"\n📍 État: HEAD détaché")
    
    print(f"\n🗑️  Branches à supprimer ({len(branches)}):")
    for branch in branches:
        status = " (branche courante - sera ignorée)" if branch == current_branch else ""
        print(f"  - {branch}{status}")
    
    if dry_run:
        print(f"\n🧪 MODE DRY-RUN: Aucune branche ne sera réellement supprimée")
        eligible_count = len([b for b in branches if b != current_branch])
        print(f"📊 {eligible_count} branche(s) seraient supprimées")
        return
    
    # Demander confirmation
    if not force:
        response = input(f"\n❓ Supprimer ces {len(branches)} branches ? (y/N): ").lower()
        if response not in ['y', 'yes', 'o', 'oui']:
            print("❌ Suppression annulée")
            return
    
    # Supprimer les branches
    deleted_count = 0
    failed_count = 0
    
    for branch in branches:
        if branch == current_branch:
            print(f"⚠️  Ignoré: {branch} (branche courante)")
            continue
            
        print(f"🗑️  Suppression de: {branch}")
        
        # Essayer d'abord avec -d (suppression sécurisée)
        result = run_command(f"git branch -d {branch}", cwd=repo_path)
        
        if result is None:
            # Si ça échoue, essayer avec -D (suppression forcée)
            print(f"⚠️  Suppression forcée de: {branch}")
            result = run_command(f"git branch -D {branch}", cwd=repo_path)
            
            if result is None:
                print(f"❌ Échec de la suppression de: {branch}")
                failed_count += 1
            else:
                deleted_count += 1
        else:
            deleted_count += 1
    
    print(f"\n📊 Résultat:")
    print(f"  ✅ Supprimées: {deleted_count}")
    print(f"  ❌ Échecs: {failed_count}")

def list_all_branches(repo_path=None):
    """Affiche toutes les branches pour information"""
    print("\n📋 Toutes les branches locales:")
    output = run_command("git branch -vv", cwd=repo_path)
    if output:
        for line in output.split('\n'):
            if line.strip():
                print(f"  {line}")

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
        print(f"❌ Le dossier '{repo_path}' n'est pas un dépôt Git")
        return False
    
    return True

def parse_arguments():
    """Parse les arguments de la ligne de commande"""
    parser = argparse.ArgumentParser(
        description="Nettoie les branches Git locales qui n'existent plus sur le serveur distant",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples d'utilisation:
  python git_clean_branches.py                      # Dépôt courant
  python git_clean_branches.py /path/to/repo        # Dépôt spécifique
  python git_clean_branches.py --force              # Sans confirmation
  python git_clean_branches.py --dry-run            # Simulation seulement
  python git_clean_branches.py /path/to/repo -d     # Simulation sur dépôt spécifique
  python git_clean_branches.py /path/to/repo -f     # Dépôt spécifique sans confirmation
        """
    )
    
    parser.add_argument(
        'repo_path', 
        nargs='?', 
        default='.', 
        help='Chemin vers le dépôt Git (défaut: répertoire courant)'
    )
    
    parser.add_argument(
        '-f', '--force', 
        action='store_true', 
        help='Supprimer sans demander confirmation'
    )
    
    parser.add_argument(
        '-l', '--list', 
        action='store_true', 
        help='Afficher seulement les branches orphelines sans les supprimer'
    )
    
    parser.add_argument(
        '-d', '--dry-run', 
        action='store_true', 
        help='Simulation : afficher ce qui serait supprimé sans rien faire'
    )
    
    return parser.parse_args()

def main():
    """Fonction principale"""
    args = parse_arguments()
    
    print("🧹 Nettoyage des branches Git orphelines")
    print("=" * 50)
    
    # Résoudre le chemin absolu
    repo_path = os.path.abspath(args.repo_path)
    print(f"📁 Dépôt: {repo_path}")
    
    # Vérifier que c'est un dépôt Git valide
    if not validate_git_repo(repo_path):
        sys.exit(1)
    
    # Vérifier si on est en HEAD détaché
    if check_detached_head(repo_path):
        print("\n⚠️  ATTENTION: Vous êtes en mode HEAD détaché !")
        print("📍 Pour un fonctionnement optimal, placez-vous sur une branche :")
        print("   git checkout main")
        print("   # ou")
        print("   git checkout <nom-de-branche>")
        
        if not args.force and not args.dry_run:
            response = input("\n❓ Continuer malgré tout ? (y/N): ").lower()
            if response not in ['y', 'yes', 'o', 'oui']:
                print("❌ Opération annulée")
                sys.exit(1)
        elif args.dry_run:
            print("🧪 MODE DRY-RUN: Continuation en mode simulation")
    
    # Option pour voir toutes les branches avant nettoyage
    if not args.force and not args.list and not args.dry_run:
        response = input("\n📋 Afficher toutes les branches avant nettoyage ? (y/N): ").lower()
        if response in ['y', 'yes', 'o', 'oui']:
            list_all_branches(repo_path)
    
    # Étape 1: Mettre à jour les références (sauf si on fait juste un listing ou dry-run)
    if not args.list and not args.dry_run:
        if not fetch_and_prune(repo_path):
            sys.exit(1)
    elif args.dry_run:
        print("🧪 MODE DRY-RUN: Pas de mise à jour des références distantes")
    
    # Étape 2: Trouver les branches orphelines
    gone_branches = get_gone_branches(repo_path)
    
    if args.list:
        # Mode listing seulement
        if gone_branches:
            print(f"\n🗑️  Branches orphelines trouvées ({len(gone_branches)}):")
            for branch in gone_branches:
                print(f"  - {branch}")
        else:
            print("\n✅ Aucune branche orpheline trouvée")
        return
    
    # Étape 3: Supprimer les branches (ou simuler)
    delete_branches(gone_branches, repo_path, args.force, args.dry_run)
    
    # Afficher l'état final (sauf en dry-run)
    if not args.dry_run:
        print("\n📋 Branches restantes:")
        final_output = run_command("git branch", cwd=repo_path)
        if final_output:
            for line in final_output.split('\n'):
                if line.strip():
                    print(f"  {line}")
        
        print("\n✅ Nettoyage terminé !")
    else:
        print("\n🧪 Simulation terminée ! Utilisez sans --dry-run pour effectuer les suppressions.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Interruption par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur inattendue: {e}")
        sys.exit(1)