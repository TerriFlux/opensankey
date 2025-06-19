#!/usr/bin/env python3
"""
Script pour supprimer interactivement les branches Git locales
Usage: python git_branch_selector.py [chemin_vers_depot]
"""

import subprocess
import sys
import os
import argparse
import re

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

def get_all_branches(repo_path=None):
    """Récupère toutes les branches locales avec leurs informations"""
    output = run_command("git branch -vv", cwd=repo_path)
    if output is None:
        return []
    
    branches = []
    lines = output.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Déterminer si c'est la branche courante
        is_current = line.startswith('*')
        
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
        if branch_name.startswith('('):
            continue
            
        # Obtenir les infos supplémentaires
        info = ' '.join(parts[1:]) if len(parts) > 1 else ""
        
        # Déterminer le statut
        status = "courante" if is_current else "locale"
        if ': gone]' in info:
            status = "orpheline"
        elif '[origin/' in info:
            status = "trackée"
        
        # Obtenir la date du dernier commit
        last_commit_date = get_last_commit_date(branch_name, repo_path)
            
        branches.append({
            'name': branch_name,
            'is_current': is_current,
            'info': info,
            'status': status,
            'full_line': line,
            'last_commit_date': last_commit_date
        })
    
    return branches

def get_last_commit_date(branch_name, repo_path=None):
    """Obtient la date du dernier commit d'une branche"""
    # Format de date lisible : "2024-01-15 14:30"
    date_output = run_command(f'git log -1 --format="%ci" {branch_name}', cwd=repo_path)
    if date_output:
        try:
            # Convertir la date ISO en format plus lisible
            from datetime import datetime
            # Format d'entrée: "2024-01-15 14:30:25 +0100"
            dt = datetime.fromisoformat(date_output.replace('"', '').rsplit(' ', 1)[0])
            return dt.strftime("%Y-%m-%d %H:%M")
        except:
            return date_output.replace('"', '')[:16] if date_output else "inconnue"
    return "inconnue"

def display_branch_info(branch, index, total):
    """Affiche les informations d'une branche"""
    print(f"\n{'='*60}")
    print(f"🌿 Branche {index + 1}/{total}: {branch['name']}")
    print(f"📊 Statut: {branch['status']}")
    print(f"📅 Dernier commit: {branch['last_commit_date']}")
    
    if branch['is_current']:
        print("📍 ⭐ BRANCHE COURANTE ⭐")
    
    if branch['info']:
        print(f"ℹ️  Info: {branch['info']}")
    
    # Indications visuelles selon le statut
    if branch['status'] == 'orpheline':
        print("🗑️  Cette branche n'existe plus sur le serveur distant")
    elif branch['status'] == 'courante':
        print("⚠️  Attention: c'est votre branche courante")
    elif branch['status'] == 'trackée':
        print("🔗 Cette branche suit une branche distante")

def ask_delete_branch(branch):
    """Demande à l'utilisateur s'il veut supprimer la branche"""
    if branch['is_current']:
        print("❌ Impossible de supprimer la branche courante")
        return False
    
    while True:
        print(f"\n❓ Supprimer la branche '{branch['name']}' ?")
        print("   [y] Oui (local seulement)")
        print("   [Y] Oui (local + remote)")
        print("   [n] Non (garder)")
        print("   [s] Sauter toutes les suivantes")
        print("   [q] Quitter le script")
        
        choice = input("Votre choix (q pour quitter): ").strip()
        
        if choice in ['y', 'yes', 'o', 'oui']:
            return 'local'
        elif choice in ['Y', 'YES']:
            return 'both'
        elif choice in ['n', 'no', 'non', 'N']:
            return False
        elif choice in ['s', 'skip', 'S']:
            return 'skip_all'
        elif choice in ['q', 'quit', 'exit', 'Q']:
            return 'quit'
        else:
            print("⚠️  Choix invalide. Utilisez y/Y/n/s/q (q pour quitter)")

def delete_branch(branch_name, repo_path=None, delete_remote=False):
    """Supprime une branche localement et optionnellement sur le remote"""
    print(f"🗑️  Suppression de '{branch_name}'...")
    
    # Suppression locale
    # Essayer d'abord avec -d (suppression sécurisée)
    result = run_command(f"git branch -d {branch_name}", cwd=repo_path)
    
    if result is None:
        # Si ça échoue, proposer une suppression forcée
        print(f"⚠️  La suppression normale a échoué (commits non mergés ?)")
        force_choice = input("🔨 Forcer la suppression locale ? (y/N): ").lower()
        
        if force_choice in ['y', 'yes', 'o', 'oui']:
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
        print(f"🌐 Suppression de '{branch_name}' sur le remote...")
        
        # Vérifier d'abord si la branche existe sur le remote
        remote_check = run_command(f"git ls-remote --heads origin {branch_name}", cwd=repo_path)
        
        if remote_check and remote_check.strip():
            # La branche existe sur le remote, la supprimer
            remote_result = run_command(f"git push origin --delete {branch_name}", cwd=repo_path)
            if remote_result is None:
                print(f"❌ Échec de la suppression remote de '{branch_name}'")
                print("   (peut-être que la branche n'existe pas sur le remote ou problème de permissions)")
                return True  # On retourne True car la suppression locale a réussi
            else:
                print(f"✅ Branche '{branch_name}' supprimée sur le remote")
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
    # D'abord vérifier si le dossier lui-même est un dépôt Git
    if validate_git_repo(folder_path):
        return folder_path
    
    # Sinon chercher dans les sous-dossiers
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
        description="Suppression interactive des branches Git locales",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples d'utilisation:
  python git_branch_selector.py                   # Dépôt courant
  python git_branch_selector.py /path/to/repo     # Dépôt spécifique
  python git_branch_selector.py --show-all        # Inclure les branches trackées

Contrôles pendant l'exécution:
  y     = Supprimer localement seulement
  Y     = Supprimer localement ET sur le remote
  n     = Garder la branche
  s     = Sauter toutes les branches restantes
  q     = Quitter immédiatement
        """
    )
    
    parser.add_argument(
        'repo_path', 
        nargs='?', 
        default='.', 
        help='Chemin vers un dépôt Git ou un dossier contenant un dépôt (défaut: répertoire courant)'
    )
    
    parser.add_argument(
        '--show-all', 
        action='store_true', 
        help='Afficher toutes les branches (y compris celles trackées)'
    )
    
    parser.add_argument(
        '--orphans-only', 
        action='store_true', 
        help='Afficher seulement les branches orphelines'
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
        # C'est déjà un dépôt Git
        repo_path = input_path
        print(f"✅ Dépôt Git détecté: {os.path.basename(repo_path)}")
    else:
        # Chercher un dépôt Git dans le dossier
        repo_path = find_git_repo_in_folder(input_path)
        if repo_path:
            print(f"✅ Dépôt Git trouvé: {os.path.basename(repo_path)}")
        else:
            print(f"❌ Aucun dépôt Git trouvé dans '{input_path}'")
            sys.exit(1)
    
    # Vérifier si on est en HEAD détaché
    if check_detached_head(repo_path):
        print("\n⚠️  ATTENTION: Vous êtes en mode HEAD détaché !")
        print("📍 Certaines opérations peuvent être limitées")
    
    # Récupérer toutes les branches
    all_branches = get_all_branches(repo_path)
    
    if not all_branches:
        print("❌ Aucune branche trouvée")
        sys.exit(1)
    
    # Filtrer selon les options
    if args.orphans_only:
        branches = [b for b in all_branches if b['status'] == 'orpheline']
        print(f"\n🔍 Affichage des branches orphelines uniquement")
    elif not args.show_all:
        # Par défaut, exclure les branches trackées normales
        branches = [b for b in all_branches if b['status'] in ['orpheline', 'courante', 'locale']]
        print(f"\n🔍 Exclusion des branches trackées (utilisez --show-all pour les inclure)")
    else:
        branches = all_branches
        print(f"\n🔍 Affichage de toutes les branches")
    
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
            
        display_branch_info(branch, i, len(branches))
        
        if not skip_all:
            decision = ask_delete_branch(branch)
            
            if decision == 'quit':
                print("\n🚪 Arrêt demandé par l'utilisateur")
                break
            elif decision == 'skip_all':
                skip_all = True
                skipped_count += len(branches) - i
                print(f"⏭️  Saut de toutes les branches restantes ({len(branches) - i})")
                break
            elif decision == 'local':
                if delete_branch(branch['name'], repo_path, delete_remote=False):
                    deleted_count += 1
            elif decision == 'both':
                if delete_branch(branch['name'], repo_path, delete_remote=True):
                    deleted_count += 1
            else:
                print(f"🛡️  Branche '{branch['name']}' conservée")
    
    # Résumé final
    print(f"\n{'='*50}")
    print(f"📊 Résumé:")
    print(f"  ✅ Branches supprimées: {deleted_count}")
    print(f"  🛡️  Branches conservées: {len(branches) - deleted_count - skipped_count}")
    if skipped_count > 0:
        print(f"  ⏭️  Branches ignorées: {skipped_count}")
    
    # Afficher l'état final
    print(f"\n📋 Branches restantes:")
    final_output = run_command("git branch", cwd=repo_path)
    if final_output:
        for line in final_output.split('\n'):
            if line.strip():
                print(f"  {line}")
    
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