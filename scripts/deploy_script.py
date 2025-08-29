#!/usr/bin/env python3
"""
Script de déploiement pour OpenSankey
Usage: python deploy_opensankey.py [dev|test|prod] [user@host] [port]
Exemple: python deploy_opensankey.py dev ubuntu@open-sankey.fr 5378
"""

import subprocess
import sys
import os
from pathlib import Path
from typing import List, Optional

def run_ssh_command(command: str, host: str, port: int = 22, user: str = "ubuntu") -> bool:
    """Exécute une commande via SSH"""
    ssh_cmd = [
        "ssh", 
        "-p", str(port),
        f"{user}@{host}",
        command
    ]
    
    print(f"🔗 SSH: {command}")
    try:
        result = subprocess.run(ssh_cmd, check=True, text=True)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur SSH: {e}")
        return False

def run_ssh_commands_batch(commands: List[str], host: str, port: int = 22, user: str = "ubuntu") -> bool:
    """Exécute plusieurs commandes via SSH dans une seule session"""
    # Joindre toutes les commandes avec &&
    full_command = " && ".join(commands)
    
    ssh_cmd = [
        "ssh", 
        "-p", str(port),
        f"{user}@{host}",
        full_command
    ]
    
    print(f"🔗 SSH Batch: Exécution de {len(commands)} commandes")
    for i, cmd in enumerate(commands, 1):
        print(f"  {i}. {cmd}")
    
    try:
        result = subprocess.run(ssh_cmd, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Erreur SSH: {e}")
        return False

def deploy_opensankey(env: str = 'dev', ssh_host: str = "open-sankey.fr", ssh_port: int = 5378, ssh_user: str = "ubuntu"):
    """
    Déploie OpenSankey pour l'environnement spécifié via SSH
    
    Args:
        env (str): Environnement de déploiement ('dev', 'test', ou 'prod')
        ssh_host (str): Adresse du serveur SSH
        ssh_port (int): Port SSH
        ssh_user (str): Utilisateur SSH
    """
    
    # Validation du paramètre environnement
    valid_envs = ['dev', 'test', 'prod']
    if env not in valid_envs:
        print(f"❌ Erreur: L'environnement '{env}' n'est pas valide.")
        print(f"Environnements disponibles: {', '.join(valid_envs)}")
        return False
    
    print(f"🚀 Démarrage du déploiement pour l'environnement: {env}")
    print(f"🔗 Connexion SSH: {ssh_user}@{ssh_host}:{ssh_port}")
    
    # Test de connexion SSH
    print("🔍 Test de connexion SSH...")
    if not run_ssh_command("echo 'Connexion SSH OK'", ssh_host, ssh_port, ssh_user):
        print("❌ Impossible de se connecter en SSH")
        return False
    
    # Préparer la liste des commandes à exécuter
    commands = [
        # Navigation vers le bon répertoire
        "cd ~/dev_opensankey/sankeyapplication",
        
        # Activation de l'environnement virtuel et configuration
        "source ~/dev_opensankey/dev_opensankey/bin/activate",
        
        # Configuration de la variable EIGEN_INCLUDE
        "export EIGEN_INCLUDE=/home/ubuntu/dev_opensankey/sankeyapplication/submodules/MFAProblem/submodules/eigen",
        
        # Git pull
        "git pull",
        
        # Mise à jour des sous-modules
        "git submodule update --init --recursive",
        
        # Déploiement
        "bash deploy_SankeyApp.sh",
        
        # Redémarrage du site
        f"bash restart_site.sh {env}"
    ]
    
    print(f"\n🔧 Exécution du déploiement à distance...")
    
    # Exécuter toutes les commandes en une seule session SSH
    success = run_ssh_commands_batch(commands, ssh_host, ssh_port, ssh_user)
    
    if success:
        print(f"\n✅ Déploiement terminé avec succès pour l'environnement {env}!")
        return True
    else:
        print(f"\n❌ Le déploiement a échoué pour l'environnement {env}!")
        return False

def parse_ssh_connection(ssh_string: str) -> tuple[str, str, int]:
    """Parse une chaîne de connexion SSH comme 'user@host:port' ou 'user@host'"""
    # Par défaut
    user = "ubuntu"
    host = "open-sankey.fr" 
    port = 5378
    
    if '@' in ssh_string:
        user_host = ssh_string.split('@')
        user = user_host[0]
        host_port = user_host[1]
        
        if ':' in host_port:
            host, port_str = host_port.split(':')
            port = int(port_str)
        else:
            host = host_port
    else:
        host = ssh_string
    
    return user, host, port

def main():
    """Fonction principale"""
    # Valeurs par défaut
    env = 'dev'
    ssh_host = "open-sankey.fr"
    ssh_port = 5378
    ssh_user = "ubuntu"
    
    # Parse des arguments
    if len(sys.argv) < 2:
        print("Usage: python deploy_opensankey.py [dev|test|prod] [user@host] [port]")
        print("Exemples:")
        print("  python deploy_opensankey.py dev")
        print("  python deploy_opensankey.py dev ubuntu@open-sankey.fr")
        print("  python deploy_opensankey.py dev ubuntu@open-sankey.fr 5378")
        print("  python deploy_opensankey.py test")
        sys.exit(1)
    
    env = sys.argv[1].lower()
    
    # Si un hôte SSH est fourni
    if len(sys.argv) >= 3:
        ssh_connection = sys.argv[2]
        ssh_user, ssh_host, ssh_port = parse_ssh_connection(ssh_connection)
    
    # Si un port spécifique est fourni
    if len(sys.argv) >= 4:
        ssh_port = int(sys.argv[3])
    
    # Exécuter le déploiement
    success = deploy_opensankey(env, ssh_host, ssh_port, ssh_user)
    
    if not success:
        print(f"\n❌ Le déploiement a échoué!")
        sys.exit(1)
    else:
        print(f"\n🎉 Déploiement réussi pour {env}!")
        sys.exit(0)

if __name__ == "__main__":
    main()