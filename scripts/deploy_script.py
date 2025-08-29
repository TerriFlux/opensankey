#!/usr/bin/env python3
"""
Script de déploiement pour OpenSankey
Usage: python deploy_opensankey.py [dev|test|prod]
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, cwd=None, check=True):
    """Exécute une commande shell et affiche le résultat"""
    print(f"Exécution: {command}")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            check=check,
            capture_output=False,
            text=True
        )
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de l'exécution de: {command}")
        print(f"Code de retour: {e.returncode}")
        return False

def deploy_opensankey(env='dev'):
    """
    Déploie OpenSankey pour l'environnement spécifié
    
    Args:
        env (str): Environnement de déploiement ('dev', 'test', ou 'prod')
    """
    
    # Validation du paramètre environnement
    valid_envs = ['dev', 'test', 'prod']
    if env not in valid_envs:
        print(f"Erreur: L'environnement '{env}' n'est pas valide.")
        print(f"Environnements disponibles: {', '.join(valid_envs)}")
        return False
    
    print(f"🚀 Démarrage du déploiement pour l'environnement: {env}")
    
    # Définir les chemins
    base_dir = Path.home() / "dev_opensankey"
    sankey_app_dir = base_dir / "sankeyapplication"
    
    # Vérifier que les répertoires existent
    if not base_dir.exists():
        print(f"Erreur: Le répertoire {base_dir} n'existe pas")
        return False
    
    if not sankey_app_dir.exists():
        print(f"Erreur: Le répertoire {sankey_app_dir} n'existe pas")
        return False
    
    # Activer l'environnement virtuel (simulation via variables d'environnement)
    venv_path = base_dir / "dev_opensankey" / "bin" / "activate"
    eigen_include = base_dir / "sankeyapplication" / "submodules" / "MFAProblem" / "submodules" / "eigen"
    
    # Ajouter les variables d'environnement nécessaires
    env_vars = os.environ.copy()
    env_vars['VIRTUAL_ENV'] = str(base_dir / "dev_opensankey")
    env_vars['PATH'] = f"{base_dir / 'dev_opensankey' / 'bin'}:{env_vars.get('PATH', '')}"
    env_vars['EIGEN_INCLUDE'] = str(eigen_include)
    
    print("📦 Configuration de l'environnement...")
    
    # Étape 1: Git pull dans sankeyapplication
    print("\n🔄 Mise à jour du code source...")
    if not run_command("git pull", cwd=sankey_app_dir):
        print("Attention: git pull a échoué, continuation du déploiement...")
    
    # Étape 2: Mise à jour des sous-modules
    print("\n📋 Mise à jour des sous-modules...")
    if not run_command("git submodule update --init --recursive", cwd=sankey_app_dir):
        print("Erreur: Échec de la mise à jour des sous-modules")
        return False
    
    # Étape 3: Exécution du script de déploiement
    print(f"\n🔧 Déploiement de l'application pour {env}...")
    deploy_script = sankey_app_dir / "deploy_SankeyApp.sh"
    if not deploy_script.exists():
        print(f"Erreur: Le script {deploy_script} n'existe pas")
        return False
    
    if not run_command("bash deploy_SankeyApp.sh", cwd=sankey_app_dir):
        print("Erreur: Échec du déploiement")
        return False
    
    # Étape 4: Redémarrage du site
    print(f"\n🔄 Redémarrage du site pour {env}...")
    restart_script = sankey_app_dir / "restart_site.sh"
    if not restart_script.exists():
        print(f"Erreur: Le script {restart_script} n'existe pas")
        return False
    
    if not run_command(f"bash restart_site.sh {env}", cwd=sankey_app_dir):
        print("Erreur: Échec du redémarrage")
        return False
    
    print(f"\n✅ Déploiement terminé avec succès pour l'environnement {env}!")
    return True

def main():
    """Fonction principale"""
    # Récupérer l'environnement depuis les arguments de ligne de commande
    if len(sys.argv) != 2:
        print("Usage: python deploy_opensankey.py [dev|test|prod]")
        print("Exemple: python deploy_opensankey.py dev")
        sys.exit(1)
    
    env = sys.argv[1].lower()
    
    # Exécuter le déploiement
    success = deploy_opensankey(env)
    
    if not success:
        print("\n❌ Le déploiement a échoué!")
        sys.exit(1)
    else:
        print(f"\n🎉 Déploiement réussi pour {env}!")
        sys.exit(0)

if __name__ == "__main__":
    main()
