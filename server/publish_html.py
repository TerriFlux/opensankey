#!/usr/bin/env python3
# coding: utf-8
# flake8: noqa
# (Module vendorisé depuis MFAData/scripts/generate_html.py : générateur de pages
#  HTML de navigation portfolio. Lignes HTML longues volontaires -> lint désactivé.)
import os
from pathlib import Path
from collections import defaultdict
import markdown
from urllib.parse import quote
from bs4 import BeautifulSoup
import re

# Portage serveur : vprint vient du module publish local (remplace
# l'ancien sankey_common.py de MFAData/scripts).
from .publish import vprint

REPORT_DOCUMENT_EXTENSIONS = {'.pdf', '.docx', '.pptx'}
_DOC_ICONS = {'.pdf': '📕', '.docx': '📘', '.pptx': '📙'}

_DOCUMENTS_SECTION_CSS = """
        .documents-section {
            background: #fff8e1;
            border-left: 4px solid #f39c12;
            padding: 1.5rem;
            margin: 2rem 0;
            border-radius: 0 6px 6px 0;
        }
        .documents-section h2 {
            color: #2c3e50;
            margin-top: 0;
            margin-bottom: 1rem;
            border-bottom: none;
            padding-bottom: 0;
        }
        .doc-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 0.75rem;
        }
        .doc-link {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.75rem 1rem;
            background: white;
            color: #2c3e50;
            text-decoration: none;
            border: 1px solid #f39c12;
            border-radius: 6px;
            transition: all 0.2s;
        }
        .doc-link:hover {
            background: #fff3cd;
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .doc-icon {
            font-size: 1.3rem;
            flex-shrink: 0;
        }
        .doc-name {
            flex: 1;
            font-size: 0.9rem;
            word-break: break-word;
        }
"""


def get_report_documents(folder_path):
    """Retourne la liste triée des documents (.pdf, .docx, .pptx) à la racine du dossier.

    Chaque entrée est un dict {'file': nom_fichier_disque, 'label': libellé_affichage}.
    Si un `documents.json` (manifest écrit par path_mapper) existe, il est utilisé
    pour obtenir le libellé d'origine (avec accents/crochets). Sinon fallback sur
    le nom de fichier présent sur disque.
    """
    folder_path = Path(folder_path)
    if not folder_path.exists():
        return []

    manifest_path = folder_path / 'documents.json'
    if manifest_path.exists():
        try:
            import json
            with open(manifest_path, encoding='utf-8') as f:
                entries = json.load(f)
            # Ne garder que les entrées dont le fichier existe réellement
            entries = [e for e in entries if (folder_path / e.get('file', '')).is_file()]
            return sorted(entries, key=lambda e: e.get('label', '').lower())
        except Exception as e:
            vprint(f"⚠️  Lecture documents.json échouée ({manifest_path}): {e}", 2)

    # Fallback: scan du dossier
    fallback = [
        {'file': f.name, 'label': f.stem}
        for f in folder_path.iterdir()
        if f.is_file() and f.suffix.lower() in REPORT_DOCUMENT_EXTENSIONS
    ]
    return sorted(fallback, key=lambda e: e['label'].lower())


def render_documents_section(folder_path):
    """Rend une section HTML listant les documents de rapport, ou '' si aucun."""
    documents = get_report_documents(folder_path)
    if not documents:
        return ''

    items = []
    for doc in documents:
        file_name = doc['file']
        label = doc.get('label') or Path(file_name).stem
        ext = Path(file_name).suffix.lower()
        icon = _DOC_ICONS.get(ext, '📄')
        href = quote(file_name)
        items.append(
            f'<a href="{href}" target="_blank" rel="noopener noreferrer" class="doc-link">'
            f'<span class="doc-icon">{icon}</span>'
            f'<span class="doc-name">{label}</span>'
            f'</a>'
        )

    return (
        '<div class="documents-section">'
        '<h2>📄 Rapports et documents</h2>'
        f'<div class="doc-grid">{"".join(items)}</div>'
        '</div>'
    )

# Fonction pour détecter si un projet est validé (a un fichier .stamped)
def is_project_validated(public_dir, current_path_parts, project_name):
    """Vérifie si un projet a un fichier .stamped (projet validé)"""
    if current_path_parts:
        project_path = Path(public_dir) / '/'.join(current_path_parts) / project_name
    else:
        project_path = Path(public_dir) / project_name
    
    # Chercher le fichier .stamped au même niveau que diagrams.html
    for root, dirs, files in os.walk(project_path):
        if ('diagrams.html' in files or 'index.html' in files) and '.stamped' in files:
            return True
    
    return False

def read_readme(project_path):
    """
    NOUVELLE FONCTION: Lit le fichier Readme.md depuis le dossier du projet
    
    Args:
        project_path (Path): Chemin vers le dossier du projet
        
    Returns:
        str|None: Contenu HTML du Readme ou None si non trouvé
    """
    readme_variants = ['README.md', 'Readme.md', 'readme.md', 'ReadMe.md']
    
    for readme_name in readme_variants:
        readme_file = Path(project_path) / readme_name
        #print(f"🔍 Tentative lecture: {readme_file}")  # DEBUG
        if readme_file.exists():
            try:
                with open(readme_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                # Convertir Markdown en HTML avec extensions pour plus de richesse
                html_content = markdown.markdown(
                    content,
                    extensions=['tables', 'fenced_code', 'toc', 'codehilite']
                )
                # Modifier tous les liens pour s'ouvrir dans un nouvel onglet
                soup = BeautifulSoup(html_content, 'html.parser')
                for link in soup.find_all('a', href=True):
                    link['target'] = '_blank'
                    link['rel'] = 'noopener noreferrer'  # Sécurité

                html_content = str(soup)
                vprint(f"📖 Readme lu: {readme_file}",2)
                return html_content
            except Exception as e:
                vprint(f"Erreur lecture Readme {readme_file}: {e}",1)
                continue
    
    vprint(f"📭 Aucun README trouvé dans: {project_path}",2)  # DEBUG
    return None

# ============================================================================
# 1. FONCTION À AJOUTER APRÈS read_readme() (environ ligne 110)
# ============================================================================

def get_front_image(folder_path, relative_to_path=None):
    """
    Détecte si une image de présentation existe dans le dossier
    
    Args:
        folder_path (Path): Chemin vers le dossier à examiner
        relative_to_path (Path): Chemin de référence pour calculer le chemin relatif
        
    Returns:
        str|None: Chemin relatif vers l'image ou None si non trouvée
    """
    image_variants = ['image_front.png', 'image_front.jpg', 'image_front.jpeg']
    
    for image_name in image_variants:
        image_file = Path(folder_path) / image_name
        if image_file.exists():
            if relative_to_path:
                try:
                    rel_path = image_file.relative_to(relative_to_path)
                    vprint(f"🖼️  Image trouvée: {rel_path}", 2)
                    return str(rel_path).replace('\\', '/')
                except ValueError:
                    # Si on ne peut pas calculer le chemin relatif
                    vprint(f"⚠️  Impossible de calculer le chemin relatif pour: {image_file}", 2)
                    return None
            else:
                vprint(f"🖼️  Image trouvée: {image_file}", 2)
                return image_name
    
    return None

def generate_project_readme_page(project_path, project_name, path_mapper, build_info):
    """
    NOUVELLE FONCTION: Génère une page de readme pour un projet spécifique
    qui injecte le Readme.md si présent, sinon un contenu minimal
    
    Args:
        project_path (Path): Chemin vers le dossier du projet
        project_name (str): Nom du projet
        path_mapper (PathMapper): Mapper pour les noms d'affichage
        build_info (str): Information de build
        
    Returns:
        str: Contenu HTML de la page de readme
    """
    display_name = path_mapper.get_display_name(project_name)

    # Lire le Readme.md s'il existe
    readme_content = read_readme(project_path)

    # Section des documents de rapport (.pdf, .docx, .pptx) copiés à la racine du projet
    documents_section = render_documents_section(project_path)

    # Contenu principal
    if readme_content:
        main_content = f'''
        <div class="readme-content">
            <div class="readme-body">
                {readme_content}
            </div>
        </div>
        {documents_section}'''
    else:
        # Contenu minimal par défaut
        main_content = f'''
        <div class="default-content">
            <div class="project-overview">
                <h2>📊 Aperçu du projet</h2>
                <p>Ce projet présente une <strong>visualisation Sankey interactive</strong> générée avec l'outil OpenSankey (<a href="https://opensankey.fr" target="_blank" style="color: #3498db; text-decoration: none;">opensankey.fr</a>) d'une analyse de flux de matière réalisée avec SankeySuite (<a href="https://app.terriflux.com" target="_blank" style="color: #3498db; text-decoration: none;">app.terriflux.com</a>).</p>
                
                <div class="features-grid">
                    <div class="feature-item">
                        <h3>🎯 Visualisation interactive</h3>
                        <p>Explorez les flux de matières et d'énergie à travers une interface dynamique</p>
                    </div>
                    <div class="feature-item">
                        <h3>📊 Analyse de flux</h3>
                        <p>Représentation claire des transferts et transformations de matière</p>
                    </div>
                    <div class="feature-item">
                        <h3>🔍 Navigation intuitive</h3>
                        <p>Interface utilisateur moderne et ergonomique</p>
                    </div>
                    <div class="feature-item">
                        <h3>🌐 Technologie web</h3>
                        <p>Accessible via navigateur sans installation requise</p>
                    </div>
                </div>
            </div>
            
            <div class="getting-started">
                <h2>❓ Comment utiliser</h2>
                <ol>
                    <li><strong>Cliquez sur "Voir la visualisation"</strong> pour accéder à l'interface interactive</li>
                    <li><strong>Explorez les flux</strong> en survolant les éléments du diagramme</li>
                </ol>
                
                <div class="tips">
                    <h3>💡 Conseils d'utilisation</h3>
                    <ul>
                        <li>Utilisez le zoom pour examiner les détails</li>
                        <li>Les couleurs indiquent différents types de flux</li>
                        <li>Survolez les éléments pour voir les valeurs exactes</li>
                    </ul>
                </div>
            </div>
        </div>
        {documents_section}'''
    
    # Structure HTML complète
    html_content = f'''<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{display_name} - Description du projet</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        .container {{
            margin: 0 auto;
            background: white;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }}
        .header-with-logo {{
            position: relative;
            text-align: center;
            margin-bottom: 2rem;
        }}
        .project-logo {{
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 80px;
            height: 80px;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        .with-logo {{
            text-align: center;
            color: #2c3e50;
            margin: 0;
            font-size: 2.5rem;
        }}
        h1 {{
            text-align: center;
            color: #2c3e50;
            margin-bottom: 1rem;
            font-size: 2.5rem;
        }}
        .card-link {{
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
            padding: 0.5rem 1rem;
            border: 1px solid #3498db;
            border-radius: 4px;
            display: inline-block;
            transition: all 0.3s;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }}
        .card-link:hover {{
            background: #3498db;
            color: white;
        }}
        .readme {{
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 1.5rem;
            margin: 2rem 0;
            border-radius: 0 6px 6px 0;
        }}
        .readme h2 {{
            color: #2c3e50;
            margin-top: 0;
        }}
        .readme p {{
            line-height: 1.6;
            margin-bottom: 1rem;
        }}
        .readme ul {{
            line-height: 1.6;
        }}
        .readme-body {{
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }}
        .readme-body h1,
        .readme-body h2,
        .readme-body h3,
        .readme-body h4,
        .readme-body h5,
        .readme-body h6 {{
            color: #2c3e50;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }}
        .readme-body h1:first-child,
        .readme-body h2:first-child,
        .readme-body h3:first-child {{
            margin-top: 0;
        }}
        .readme-body code {{
            background: #e9ecef;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        .readme-body pre {{
            background: #2c3e50;
            color: #ecf0f1;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
        }}
        .readme-body pre code {{
            background: none;
            padding: 0;
            color: inherit;
        }}
        .readme-body table {{
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }}
        .readme-body th,
        .readme-body td {{
            border: 1px solid #dee2e6;
            padding: 0.5rem;
            text-align: left;
        }}
        .readme-body th {{
            background: #f8f9fa;
            font-weight: 600;
        }}
        .default-content h2 {{
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 0.5rem;
            margin-bottom: 1.5rem;
        }}
        .features-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }}
        .feature-item {{
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }}
        .feature-item h3 {{
            color: #2c3e50;
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
        }}
        .feature-item p {{
            margin: 0;
            color: #5a6c7d;
        }}
        .getting-started {{
            background: #e8f5e8;
            padding: 2rem;
            border-radius: 8px;
            border-left: 4px solid #27ae60;
            margin-top: 2rem;
        }}
        .getting-started h2 {{
            color: #27ae60;
            margin-top: 0;
            border-bottom: 2px solid #27ae60;
        }}
        .getting-started ol {{
            padding-left: 1.5rem;
        }}
        .getting-started li {{
            margin-bottom: 0.5rem;
        }}
        .tips {{
            background: white;
            padding: 1.5rem;
            border-radius: 6px;
            margin-top: 1.5rem;
            border: 1px solid #d4edda;
        }}
        .tips h3 {{
            color: #155724;
            margin-top: 0;
        }}
        .tips ul {{
            margin-bottom: 0;
            padding-left: 1.5rem;
        }}
        .footer {{
            text-align: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 0.9rem;
        }}
    </style>
</head>
<body>
    <div class="container">
        {main_content}
        <div style="text-align: center; margin-bottom: 2rem;">
            <a href="./diagrams.html" class="card-link" target="_blank">📊 Diagramme de flux</a>
        </div>
        <div class="footer">
            <p>Généré par OpenSankey (<a href="https://open-sankey.fr" target="_blank" style="color: #3498db; text-decoration: none;">open-sankey.fr</a>) • Build: {build_info}</p>
        </div>
    </div>
</body>
</html>'''

    # Injecter les styles de la section documents dans le <style> (hors f-string pour éviter les {{ }})
    html_content = html_content.replace('</style>', _DOCUMENTS_SECTION_CSS + '</style>', 1)

    return html_content

def build_tree_structure(public_dir, path_mapper):
    """Construit la structure d'arbre à partir du dossier public"""
    tree = defaultdict(dict)
    projects = []
    raw_projects = []
    
    public_path = Path(public_dir)
    if not public_path.exists():
        return tree, projects
    
    # Scanner tous les projets (feuilles)
    for root, dirs, files in os.walk(public_path):
        # Ignorer les dossiers de backup
        dirs[:] = [d for d in dirs if not d.startswith('_backup_state')]
        
        if 'index.html' in files:
            # NOUVEAU: Renommer index.html en diagrams.html immédiatement
            index_file = Path(root) / 'index.html'
            diagrams_file = Path(root) / 'diagrams.html'
            
            if not diagrams_file.exists():
                try:
                    index_file.rename(diagrams_file)
                    relative_path = Path(root).relative_to(public_path)
                    vprint(f"✅ Renommé: {relative_path}/index.html → diagrams.html", 2)
                except Exception as e:
                    vprint(f"❌ Erreur renommage {index_file}: {e}", 1)
            
            relative_path = Path(root).relative_to(public_path)
            relative_str = str(relative_path).replace('\\', '/')  # Normaliser pour Windows
            
            # Ignorer seulement la racine
            if relative_str != '.':
                raw_projects.append(relative_str)
    
    # CORRECTION : Normaliser les projets avec une logique améliorée
    normalized_projects = set()
    
    for project in raw_projects:
        # Cas 1: Le projet contient '/Etude/' quelque part dans le chemin
        if '/Etude/' in project:
            # Diviser le chemin et retirer la partie '/Etude'
            parts = project.split('/')
            if 'Etude' in parts:
                # Trouver l'index de 'Etude' et le retirer
                etude_index = parts.index('Etude')
                # Reconstruire le chemin sans 'Etude'
                new_parts = parts[:etude_index] + parts[etude_index+1:]
                normalized_project = '/'.join(new_parts)
                normalized_projects.add(normalized_project)
            else:
                # Fallback au cas où
                normalized_projects.add(project)
        
        # Cas 2: Le projet se termine par '/Etude' (logique originale)
        elif project.endswith('/Etude'):
            parent_project = project[:-6]  # Enlever '/Etude'
            normalized_projects.add(parent_project)
        
        # Cas 3: Projet normal (sans Etude)
        else:
            normalized_projects.add(project)
    
    # Convertir en liste pour la suite
    projects = list(normalized_projects)
    
    # Construire l'arbre hiérarchique
    for project_path in projects:
        parts = project_path.split('/')
        current_level = tree
        
        # Naviguer/créer la structure
        for i, part in enumerate(parts):
            if i == len(parts) - 1:
                # C'est une feuille (projet final)
                current_level[part] = {
                    '_is_project': True,
                    '_full_path': project_path,
                }
            else:
                # C'est un dossier intermédiaire
                if part not in current_level:
                    current_level[part] = {
                        '_is_project': False,
                        '_full_path': '/'.join(parts[:i+1]),
                        '_children': {}
                    }
                current_level = current_level[part].setdefault('_children', {})
    
    # Post-traitement : Aplatir les niveaux qui n'ont que 2 enfants (tous des projets)
    def flatten_two_children(node_dict):
        """
        Parcourt récursivement l'arbre et aplatit les niveaux qui ont exactement 2 enfants projets
        en créant un groupe unique
        """
        items_to_remove = []
        items_to_add = {}
        
        for key, value in list(node_dict.items()):
            if key.startswith('_'):
                continue
                
            # Si c'est un dossier (pas un projet)
            if not value.get('_is_project', False):
                children = value.get('_children', {})
                
                # Compter les enfants (en excluant les clés spéciales)
                child_items = {k: v for k, v in children.items() if not k.startswith('_')}
                
                # Si exactement 2 enfants ET tous sont des projets (pas des sous-dossiers)
                if len(child_items) == 2:
                    all_projects = all(v.get('_is_project', False) for v in child_items.values())
                    
                    if all_projects:
                        # Aplatir : créer UN SEUL groupe avec les 2 projets
                        vprint(f"🔄 Aplatissement : {key} avec 2 projets → groupe unique", 2)
                        
                        # Au lieu de supprimer, transformer le dossier en groupe
                        value['_is_group'] = True  # Nouveau flag
                        value['_is_project'] = False  # Ce n'est pas un projet individuel
                        value['_group_projects'] = list(child_items.items())  # Liste des 2 projets
                        
                        vprint(f"   ↳ Groupe créé avec : {', '.join(child_items.keys())}", 3)
                    else:
                        # Ce n'est pas que des projets, continuer la récursion
                        flatten_two_children(children)
                else:
                    # Plus de 2 enfants ou autre cas, continuer la récursion
                    if children:
                        flatten_two_children(children)
    
    # Appliquer l'aplatissement
    flatten_two_children(tree)
    
    return tree, projects

def generate_breadcrumb(path_parts, path_mapper):
    """Génère un fil d'Ariane avec des chemins relatifs et propre HTML"""
    if not path_parts:
        return '<span class="breadcrumb-current">Accueil</span>'
    
    breadcrumb = '<a href="./" class="breadcrumb-link">🏠 Accueil</a>'
    
    for i, part in enumerate(path_parts):
        rel_path = './' + '/'.join(path_parts[:i + 1]) + '/'
        display_name = path_mapper.get_display_name(part)

        if i == len(path_parts) - 1:
            # CORRECTION: Ajouter le < manquant dans </span>
            breadcrumb += f'<span class="breadcrumb-separator">→</span><span class="breadcrumb-current">{display_name}</span>'
        else:
            # CORRECTION: Ajouter le < manquant dans </span>
            breadcrumb += f'<span class="breadcrumb-separator">→</span><a href="{rel_path}" class="breadcrumb-link">{display_name}</a>'

    return breadcrumb
def get_download_files(public_dir, current_path_parts, project_name):
    """Détecte les fichiers Excel disponibles pour téléchargement"""
    if current_path_parts:
        project_path = Path(public_dir) / '/'.join(current_path_parts) / project_name
    else:
        project_path = Path(public_dir) / project_name
    
    download_files = {}
    
    if project_path.exists():
        # Chercher les fichiers Excel (.xlsx, .xls)
        excel_extensions = ['.xlsx', '.xls']
        
        for excel_file in project_path.rglob('*'):
            if excel_file.is_file():
                file_ext = excel_file.suffix.lower()
                if file_ext in excel_extensions:
                    file_stem = excel_file.stem
                    relative_path = excel_file.relative_to(project_path)
                    
                    # Vérifier si c'est un fichier réconcilié
                    if file_stem.endswith('_reconciled'):
                        # C'est un fichier réconcilié
                        original_name = file_stem[:-11]  # Enlever "_reconciled"
                        if original_name not in download_files:
                            download_files[original_name] = {}
                        download_files[original_name]['reconciled'] = str(relative_path)
                    else:
                        # C'est potentiellement un fichier d'entrée
                        if file_stem not in download_files:
                            download_files[file_stem] = {}
                        download_files[file_stem]['original'] = str(relative_path)
    
    # Filtrer pour ne garder que les entrées qui ont au moins un fichier
    filtered_files = {k: v for k, v in download_files.items() if v}
    
    return filtered_files


def generate_directory_index(tree_level, current_path_parts, build_info, public_dir,path_mapper):
    """
    Génère une page d'index pour un répertoire avec readmes
    """
    
    current_path = '/'.join(current_path_parts) if current_path_parts else ''
    page_title = path_mapper.get_display_name(current_path_parts[-1]) if current_path_parts else 'Portfolio Sankey'
    
    # NOUVEAU: Lire la readme du dossier courant depuis les artifacts
    if current_path_parts:
        current_folder_path = Path(public_dir) / '/'.join(current_path_parts)
    else:
        current_folder_path = Path(public_dir)
    
    vprint(f"🔍 Recherche readme dans artifacts: {current_folder_path}",1)
    
    folder_readme = read_readme(current_folder_path)
    vprint(f"🔍 Description retournée: {folder_readme is not None}",1)
    
    # NOUVEAU: Détecter le logo du projet (png, jpg ou jpeg)
    logo_filename = None
    for _logo_variant in ('image_front.png', 'image_front.jpg', 'image_front.jpeg'):
        if (current_folder_path / _logo_variant).exists():
            logo_filename = _logo_variant
            break
    has_logo = logo_filename is not None
    if has_logo:
        vprint(f"🖼️  Logo détecté: {current_folder_path / logo_filename}", 2)
    
    # Compter les éléments
    directories = {k: v for k, v in tree_level.items() if not k.startswith('_') and not v.get('_is_project', False) and not v.get('_is_group', False)}
    projects = {k: v for k, v in tree_level.items() if not k.startswith('_') and v.get('_is_project', False)}
    groups = {k: v for k, v in tree_level.items() if not k.startswith('_') and v.get('_is_group', False)}
    
    html_content = f'''<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{page_title} - Portfolio Sankey</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        .container {{
            margin: 0 auto;
            background: white;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }}
        .header-with-logo {{
            position: relative;
            text-align: center;
            margin-bottom: 2rem;
        }}
        
        .project-logo {{
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 80px;
            height: 80px;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        .with-logo {{
            text-align: center;
            color: #2c3e50;
            margin: 0;
            font-size: 2.5rem;
        }}
        h1 {{
            text-align: center;
            color: #2c3e50;
            margin-bottom: 1rem;
            font-size: 2.5rem;
        }}   
        .readme {{
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 1.5rem;
            margin: 2rem 0;
            border-radius: 0 6px 6px 0;
        }}
        .readme h2 {{
            color: #2c3e50;
            margin-top: 0;
        }}
        .readme p {{
            line-height: 1.6;
            margin-bottom: 1rem;
        }}
        .readme ul {{
            line-height: 1.6;
        }}
        .breadcrumb {{
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 2rem;
            font-size: 0.9rem;
        }}
        .breadcrumb-link {{
            color: #3498db;
            text-decoration: none;
        }}
        .breadcrumb-link:hover {{
            text-decoration: underline;
        }}
        .breadcrumb-separator {{
            color: #6c757d;
            margin: 0 0.5rem;
        }}
        .breadcrumb-current {{
            color: #495057;
            font-weight: 500;
        }}
        .stats {{
            background: #e7f3ff;
            border: 1px solid #b8daff;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 2rem;
            text-align: center;
        }}
        .section {{
            margin-bottom: 3rem;
        }}
        .section h2 {{
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 0.5rem;
            margin-bottom: 1.5rem;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
        }}
        .card {{
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1.5rem;
            transition: all 0.3s;
        }}
        .card:hover {{
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }}
        .card.directory {{
            border-left-color: #3498db;
        }}
        .card.project {{
            border-left-color: #28a745;
        }}
        .card-title {{
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
        }}
        .card-type {{
            font-size: 0.8rem;
            color: #6c757d;
            margin-bottom: 1rem;
            text-transform: uppercase;
            font-weight: 500;
        }}
        .card-readme {{
            font-size: 0.9rem;
            color: #6c757d;
            margin-bottom: 1rem;
            line-height: 1.4;
        }}
        .card-link {{
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
            padding: 0.5rem 1rem;
            border: 1px solid #3498db;
            border-radius: 4px;
            display: inline-block;
            transition: all 0.3s;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }}
        .card-link:hover {{
            background: #3498db;
            color: white;
        }}
        .card-link.secondary {{
            color: #6c757d;
            border-color: #6c757d;
        }}
        .card-link.secondary:hover {{
            background: #6c757d;
            color: white;
        }}
        .empty {{
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 2rem;
        }}
        .footer {{
            text-align: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 0.9rem;
        }}
        .card.validated {{
            position: relative;
            border-left-color: #28a745 !important;
            background: linear-gradient(135deg, #f8f9fa 0%, #e8f5e8 100%);
        }}
        
        .validation-stamp {{
            position: absolute;
            top: 10px;
            right: 10px;
            background: #28a745;
            color: white;
            padding: 0.3rem 0.6rem;
            border-radius: 15px;
            font-size: 0.7rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
            transform: rotate(12deg);
            z-index: 10;
        }}
        
        .stamp-text {{
            display: flex;
            align-items: center;
            gap: 0.2rem;
        }}
        
        /* Animation subtile pour attirer l'attention */
        .validation-stamp {{
            animation: pulse-validation 2s infinite;
        }}
        
        @keyframes pulse-validation {{
            0% {{transform: rotate(12deg) scale(1); }}
            50% {{ transform: rotate(12deg) scale(1.05); }}
            100% {{ transform: rotate(12deg) scale(1); }}
        }}
        
        /* Effet hover pour les cartes validées */
        .card.validated:hover .validation-stamp {{
            animation: none;
            transform: rotate(12deg) scale(1.1);
        }}
/* Styles pour les versions - AJOUTER CES STYLES */
        .versions-dropdown {{
            position: relative;
            margin-top: 0.5rem;
        }}
        
        .versions-btn {{
            background: #8e44ad !important;
            color: white !important;
            border-color: #8e44ad !important;
            cursor: pointer;
        }}
        
        .versions-btn:hover {{
            background: #7d3c98 !important;
            border-color: #7d3c98 !important;
        }}
        
        .versions-list {{
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            z-index: 100;
            margin-top: 2px;
        }}
        
        .versions-list.show {{
            display: block;
        }}
        
        .version-link {{
            display: block;
            padding: 0.5rem 1rem;
            color: #495057;
            text-decoration: none;
            border-bottom: 1px solid #f8f9fa;
            transition: background 0.3s;
        }}
        
        .version-link:hover {{
            background: #f8f9fa;
            color: #3498db;
        }}
        
        .version-link:last-child {{
            border-bottom: none;
        }}

        .download-dropdown {{
            position: relative;
            margin-top: 0.5rem;
        }}
        
        .download-btn {{
            background: #28a745 !important;
            color: white !important;
            border-color: #28a745 !important;
            cursor: pointer;
        }}
        
        .download-btn:hover {{
            background: #218838 !important;
            border-color: #1e7e34 !important;
        }}
        
        .download-list {{
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            z-index: 100;
            margin-top: 2px;
        }}
        
        .download-list.show {{
            display: block;
        }}
        
        .download-section {{
            padding: 0.5rem;
            border-bottom: 1px solid #f8f9fa;
        }}
        
        .download-section:last-child {{
            border-bottom: none;
        }}
        
        .download-section-title {{
            font-weight: bold;
            color: #495057;
            margin-bottom: 0.25rem;
            font-size: 0.9rem;
        }}
        
        .download-link {{
            display: block;
            padding: 0.25rem 0.5rem;
            color: #3498db;
            text-decoration: none;
            border-radius: 3px;
            font-size: 0.85rem;
            transition: background 0.3s;
        }}
        
        .download-link:hover {{
            background: #f8f9fa;
            text-decoration: none;
        }}
        
        .download-unavailable {{
            display: block;
            padding: 0.25rem 0.5rem;
            color: #6c757d;
            font-style: italic;
            font-size: 0.85rem;
        }}
        .card-image-wrapper {{
            height: 150px;
            margin: 0 auto 1rem auto;
            border-radius: 6px;
            overflow: hidden;
            background: #f0f0f0;
        }}
        
        .card-image-wrapper img {{
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }}
        
        .card:hover .card-image-wrapper img {{
            transform: scale(1.1);
        }}
    </style>
    <script>
        function toggleVersions(projectName) {{
            const versionsList = document.getElementById('versions-' + projectName);
            versionsList.classList.toggle('show');
            
            // Fermer les autres dropdowns
            document.querySelectorAll('.versions-list').forEach(list => {{
                if (list.id !== 'versions-' + projectName) {{
                    list.classList.remove('show');
                }}
            }});
            
            // Fermer les downloads
            document.querySelectorAll('.download-list').forEach(list => {{
                list.classList.remove('show');
            }});
        }}
        
        function toggleDownloads(projectName) {{
            const downloadList = document.getElementById('downloads-' + projectName);
            downloadList.classList.toggle('show');
            
            // Fermer les autres dropdowns
            document.querySelectorAll('.download-list').forEach(list => {{
                if (list.id !== 'downloads-' + projectName) {{
                    list.classList.remove('show');
                }}
            }});
            
            // Fermer aussi les versions
            document.querySelectorAll('.versions-list').forEach(list => {{
                list.classList.remove('show');
            }});
        }}
        
        // Fermer les dropdowns en cliquant ailleurs
        document.addEventListener('click', function(event) {{
            if (!event.target.closest('.versions-dropdown') && !event.target.closest('.download-dropdown')) {{
                document.querySelectorAll('.versions-list, .download-list').forEach(list => {{
                    list.classList.remove('show');
                }});
            }}
        }});
    </script>
</head>
<body>
    <div class="container">'''

    # NOUVEAU: Header avec ou sans logo
    if has_logo:
        html_content += f'''
        <div class="header-with-logo">
            <img src="{logo_filename}" alt="Logo du projet" class="project-logo">
            <h1 class="with-logo">{page_title}</h1>
        </div>'''
    else:
        html_content += f'''
        <h1>{page_title}</h1>'''

    if len(current_path_parts) > 1:
        html_content += f'''<div class="breadcrumb">
            {generate_breadcrumb(current_path_parts,path_mapper)}
        </div>'''
        
    def get_project_versions(public_dir, current_path_parts, project_name):
        """Retourne la liste des versions (V1, V2, etc.) d'un projet"""
        if current_path_parts:
            project_path = Path(public_dir) / '/'.join(current_path_parts) / project_name
        else:
            project_path = Path(public_dir) / project_name
        
        versions = []
        if project_path.exists():
            # Pattern pour matcher V1, V2, V3, etc. (case insensitive)
            version_pattern = re.compile(r'^[Vv]\d+$')
            
            for item in project_path.iterdir():
                if (item.is_dir() and 
                    version_pattern.match(item.name) and 
                    (item / 'diagrams.html').exists()):
                    versions.append(item.name)
        
        # Trier les versions numériquement (V1, V2, V10, etc.)
        def version_sort_key(version_name):
            match = re.match(r'[Vv](\d+)', version_name)
            return int(match.group(1)) if match else 0
        
        return sorted(versions, key=version_sort_key)


    # Ajouter la readme du dossier si elle existe
    if folder_readme:
        html_content += f'''
        <div class="readme">
            {folder_readme}
        </div>'''

    # Section des documents de rapport (.pdf, .docx, .pptx) à la racine du dossier courant
    documents_section = render_documents_section(current_folder_path)
    if documents_section:
        html_content += documents_section

    # Section des projets (MODIFIÉE avec bouton readme)
    if projects or groups:
        html_content += '''
        <div>
            <div class="grid">'''
        
        # Afficher d'abord les projets normaux
        for i,(project_name, project_info) in enumerate(sorted(projects.items())):
            html_content += generate_tab(current_path_parts, public_dir, path_mapper, get_project_versions, get_download_files, project_name)
            if len(projects) > 2:
                break
        
        # Afficher les groupes
        for group_name, group_info in sorted(groups.items()):
            html_content += generate_group_card(current_path_parts, public_dir, path_mapper, group_name, group_info)
        
        html_content += '''
            </div>
        </div>'''

        if len(projects) > 2:
            html_content += '''
            <div class="section">
                <h2>Sous-Filières</h2>
                <div class="grid">'''

            for i,(project_name, project_info) in enumerate(sorted(projects.items())):
                if i == 0:
                    continue
                html_content += generate_tab(current_path_parts, public_dir, path_mapper, get_project_versions, get_download_files, project_name)               
            html_content += '''
                </div>
            </div>'''

    # Section des répertoires - MODIFICATION ICI
    if directories:
        # CAS SPÉCIAL: Si exactement 2 dossiers, créer des onglets au lieu de cartes
        if len(directories) == 2:
            html_content += '''
        <div class="section">
            <h2>📂 Sous-catégories</h2>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem;">'''
            
            for dir_name, dir_info in sorted(directories.items()):
                display_name = path_mapper.get_display_name(dir_name)
                
                html_content += f'''
                <a href="{dir_name}" class="card-link" style="flex: 1; max-width: 300px; text-align: center; padding: 1rem 2rem;">
                    📂 {display_name}
                </a>'''
            
            html_content += '''
            </div>
        </div>'''
        else:
            # CAS NORMAL: Plus de 2 dossiers, afficher des cartes
            html_content += '''
        <div class="section">
            <h2>📂 Dossiers</h2>
            <div class="grid">'''
            
            for dir_name, dir_info in sorted(directories.items()):
                display_name = path_mapper.get_display_name(dir_name)
                child_count = len([k for k in dir_info.get('_children', {}) if not k.startswith('_')])
                
                # NOUVEAU: Lire la readme du sous-dossier depuis les artifacts
                if current_path_parts:
                    subdir_path = Path(public_dir) / '/'.join(current_path_parts) / dir_name
                else:
                    subdir_path = Path(public_dir) / dir_name
                
                subdir_desc = read_readme(subdir_path)
                readme_snippet = ""
                if subdir_desc:
                    # Extraire les 100 premiers caractères de texte (sans HTML)
                    text_only = re.sub('<[^<]+?>', '', subdir_desc)
                    readme_snippet = text_only[:100] + "..." if len(text_only) > 100 else text_only

                # NOUVEAU: Détecter l'image de présentation
                front_image = get_front_image(subdir_path)
                card_classes = "card directory"
                
                html_content += f'''
                <div class="{card_classes}">'''
                
                # Image APRÈS le type, centrée
                if front_image:
                    html_content += f'''
                    <div class="card-image-wrapper">
                        <img src="{dir_name}/{front_image}" alt="{display_name}">
                    </div>'''
                
                html_content += f'''
                    <div class="card-title">{display_name}</div>'''
                
                if readme_snippet:
                    html_content += f'<div class="card-readme">{readme_snippet}</div>'
                
                html_content += f'''
                    <a href="{dir_name}" target="_blank" class="card-link">Explorer →</a>
                </div>'''
            
            html_content += '''
            </div>
        </div>'''
    
    # Si vide
    if not directories and not projects and not groups:
        html_content += '''
        <div class="empty">
            <p>📭 Ce dossier est vide</p>
            <p>Aucun projet ou sous-dossier trouvé</p>
        </div>'''
    
 

    html_content += f'''
        <div class="footer">
            <p>Généré par OpenSankey (<a href="https://open-sankey.fr" target="_blank" style="color: #3498db; text-decoration: none;">open-sankey.fr</a>) • Build: {build_info}</p>
        </div>
    </div>
</body>
</html>'''

    # Injecter les styles de la section documents dans le <style> (hors f-string pour éviter les {{ }})
    html_content = html_content.replace('</style>', _DOCUMENTS_SECTION_CSS + '</style>', 1)

    return html_content

def generate_group_card(current_path_parts, public_dir, path_mapper, group_name, group_info):
    """
    Génère une carte pour un groupe de 2 projets
    """
    display_name = path_mapper.get_display_name(group_name)
    display_name = re.sub(r'^\d+\s+', '', display_name)
    
    # Récupérer les 2 projets du groupe ET LES TRIER
    group_projects = group_info.get('_group_projects', [])
    group_projects = sorted(group_projects, key=lambda x: x[0])  # Tri par nom de projet
    
    # Construire le chemin vers le dossier du groupe
    if current_path_parts:
        group_path = Path(public_dir) / '/'.join(current_path_parts) / group_name
    else:
        group_path = Path(public_dir) / group_name
    
    # Vérifier si le groupe est validé
    is_validated = is_project_validated(public_dir, current_path_parts, group_name)
    
    # NOUVEAU: Récupérer les fichiers de téléchargement
    download_files = get_download_files(public_dir, current_path_parts, group_name)
    
    # Lire le readme du groupe
    group_desc = read_readme(group_path)
    readme_snippet = ""
    if group_desc:
        text_only = re.sub('<[^<]+?>', '', group_desc)
        readme_snippet = text_only[:150] + "..." if len(text_only) > 150 else text_only
    
    # Détecter l'image de présentation du groupe
    front_image = get_front_image(group_path)
    
    card_classes = "card project"
    if is_validated:
        card_classes += " validated"
    
    html_content = f'''
                <div class="{card_classes}">'''
    
    # Afficher l'image si elle existe
    if front_image:
        html_content += f'''
                    <div class="card-image-wrapper">
                        <img src="{group_name}/{front_image}" alt="{display_name}">
                    </div>'''
    
    html_content += f'''
                    <div class="card-title">{display_name}</div>'''
    
    # Afficher le badge de validation
    if is_validated:
        html_content += '''
                    <div class="validation-stamp">
                        <span class="stamp-text">✓ EXPERTISÉ</span>
                    </div>'''
    
    if readme_snippet:
        html_content += f'<div class="card-readme">{readme_snippet}<a href="{group_name}" class="card-link secondary" style="margin-top: 0.5rem;">Plus</a></div>'
    
    # Créer les boutons pour les 2 projets
    html_content += '''
                    <div style="display: flex; gap: 0.5rem; flex-direction: column; margin-top: 1rem;">'''
    
    for proj_name, proj_info in group_projects:
        # Trouver le vrai chemin vers le diagramme
        proj_display_name = path_mapper.get_display_name(proj_name)
        proj_display_name = re.sub(r'^\d+\s+', '', proj_display_name)
        
        # Construire le chemin complet
        full_path = proj_info.get('_full_path', '')
        if current_path_parts:
            relative_path = full_path.replace('/'.join(current_path_parts) + '/', '', 1)
        else:
            relative_path = full_path
        
        # Trouver le diagrams.html
        real_link = find_real_project_path(public_dir, current_path_parts, relative_path)
        
        html_content += f'''
                        <a href="{real_link}" class="card-link" target="_blank">📊 {proj_display_name}</a>'''
    
    html_content += '''
                    </div>'''
    
    # NOUVEAU: Sélecteur de téléchargement (identique à generate_tab)
    if download_files:
        html_content += f'''
                    <div class="download-dropdown">
                        <button class="card-link download-btn" onclick="toggleDownloads('{group_name}')">
                            📥 Téléchargement ({len(download_files)})
                        </button>
                        <div class="download-list" id="downloads-{group_name}">'''
        
        for file_base_name, files in download_files.items():
            html_content += f'''
                            <div class="download-section">
                                <div class="download-section-title">{file_base_name}</div>'''
            
            # Fichier d'entrée
            if 'original' in files:
                html_content += f'''
                                <a href="{group_name}/{files['original']}" class="download-link" download>
                                    📄 Fichier d'entrée
                                </a>'''
            else:
                html_content += '''
                                <span class="download-unavailable">📄 Fichier d'entrée non disponible</span>'''
            
            # Fichier réconcilié
            if 'reconciled' in files:
                html_content += f'''
                                <a href="{group_name}/{files['reconciled']}" class="download-link" download>
                                    📋 Fichier réconcilié
                                </a>'''
            else:
                html_content += '''
                                <span class="download-unavailable">📋 Fichier réconcilié non disponible</span>'''
            
            html_content += '''
                            </div>'''
        
        html_content += '''
                        </div>
                    </div>'''
    
    html_content += '''
                </div>'''
    
    return html_content

def generate_tab(current_path_parts, public_dir, path_mapper, get_project_versions, get_download_files, project_name):
    display_name = path_mapper.get_display_name(project_name)
    display_name = re.sub(r'^\d+\s+', '', display_name)

    versions = get_project_versions(public_dir, current_path_parts, project_name)
    download_files = get_download_files(public_dir, current_path_parts, project_name)  # NOUVEAU
    is_validated = is_project_validated(public_dir, current_path_parts, project_name)

            # Lire la readme du projet depuis les artifacts
    if current_path_parts:
        project_path = Path(public_dir) / '/'.join(current_path_parts) / project_name
    else:
        project_path = Path(public_dir) / project_name
            
    project_desc = read_readme(project_path)
    readme_snippet = ""
    if project_desc:
        text_only = re.sub('<[^<]+?>', '', project_desc)
        readme_snippet = text_only[:150] + "..." if len(text_only) > 150 else text_only

   # NOUVEAU: Détecter l'image de présentation
    front_image = get_front_image(project_path)            
            # Trouver le vrai chemin physique du projet
    # Trouver le vrai chemin physique du projet
    real_link = find_real_project_path(public_dir, current_path_parts, project_name)
            
    card_classes = "card project"
    if is_validated:
        card_classes += " validated"
            
    html_content = f'''
                <div class="{card_classes}">'''
    
    # NOUVEAU: Afficher l'image si elle existe
    if front_image:
        html_content += f'''
                    <div class="card-image-wrapper">
                        <img src="{project_name}/{front_image}" alt="{display_name}">
                    </div>'''
    
    html_content += f'''
                    <div class="card-title">{display_name}</div>'''

    if is_validated:
        html_content += '''
                    <div class="validation-stamp">
                        <span class="stamp-text">✓ EXPERTISÉ</span>
                    </div>'''

    if readme_snippet:
        html_content += f'<div class="card-readme">{readme_snippet}<a href="{project_name}" class="card-link secondary">Plus</a></div>'
            
            # Boutons principaux
    html_content += f'''
                    <a href="{real_link}" class="card-link" target="_blank">📊 Diagramme de flux</a>'''
            
            # Versions antérieures
    # if versions:
    #     html_content += f'''
    #                 <div class="versions-dropdown">
    #                     <button class="card-link versions-btn" onclick="toggleVersions('{project_name}')">
    #                         📊 Versions antérieures ({len(versions)})
    #                     </button>
    #                     <div class="versions-list" id="versions-{project_name}">'''
                
    #     for version in versions:
    #         html_content += f'''
    #                         <a href="{project_name}/{version}/diagrams.html" class="version-link" target="_blank">{version}</a>'''
                
    #     html_content += '''
    #                     </div>
    #                 </div>'''
            
            # NOUVEAU : Sélecteur de téléchargement
    if download_files:
        html_content += f'''
                    <div class="download-dropdown">
                        <button class="card-link download-btn" onclick="toggleDownloads('{project_name}')">
                            📥 Téléchargement ({len(download_files)})
                        </button>
                        <div class="download-list" id="downloads-{project_name}">'''
                
        for file_base_name, files in download_files.items():
            html_content += f'''
                            <div class="download-section">
                                <div class="download-section-title">{file_base_name}</div>'''
                    
                    # Fichier d'entrée
            if 'original' in files:
                html_content += f'''
                                <a href="{project_name}/{files['original']}" class="download-link" download>
                                    📄 Fichier d'entrée
                                </a>'''
            else:
                html_content += '''
                                <span class="download-unavailable">📄 Fichier d'entrée non disponible</span>'''
                    
                    # Fichier réconcilié
            if 'reconciled' in files:
                html_content += f'''
                                <a href="{project_name}/{files['reconciled']}" class="download-link" download>
                                    📋 Fichier réconcilié
                                </a>'''
            else:
                html_content += '''
                                <span class="download-unavailable">📋 Fichier réconcilié non disponible</span>'''
                    
            html_content += '''
                            </div>'''
                
        html_content += '''
                        </div>
                    </div>'''

    html_content += '''
                </div>'''
    return html_content

def find_real_project_path(public_dir, current_path_parts, project_name):
    """
    Trouve le vrai chemin physique vers le diagrams.html d'un projet
    """
    public_path = Path(public_dir)
    
    # Construire le chemin de base où on cherche le projet
    if current_path_parts:
        base_path = public_path / '/'.join(current_path_parts)
    else:
        base_path = public_path
    
    # Chercher tous les diagrams.html possibles pour ce projet
    project_base = base_path / project_name
    
    # Priorité 1: Vérifier s'il y a un diagrams.html avec /Etude/ quelque part
    for root, dirs, files in os.walk(project_base):
        if 'diagrams.html' in files:
            # Calculer le chemin relatif depuis base_path
            relative_root = Path(root).relative_to(base_path)
            relative_link = str(relative_root / 'diagrams.html').replace('\\', '/')
            
            # Priorité aux chemins contenant /Etude/
            if 'Etude' in str(relative_root):
                return relative_link
    
    # Priorité 2: Fallback vers diagrams.html direct s'il existe
    direct_diagrams = project_base / 'diagrams.html'
    if direct_diagrams.exists():
        return f"{project_name}/diagrams.html"
    
    # Priorité 3: Prendre le premier diagrams.html trouvé
    for root, dirs, files in os.walk(project_base):
        if 'diagrams.html' in files:
            relative_root = Path(root).relative_to(base_path)
            return str(relative_root / 'diagrams.html').replace('\\', '/')
    
    # Fallback: lien vers le nom du projet (même si ça ne marche pas)
    return f"{project_name}/diagrams.html"

def generate_all_index_pages(public_dir, build_info, path_mapper):
    """
    Génère toutes les pages d'index de l'arborescence + pages de readme des projets
    MODIFIÉ: Ajoute la génération des pages de readme
    """
    tree, projects = build_tree_structure(public_dir, path_mapper)
    
    if not tree:
        vprint("❌ Aucun projet trouvé",0)
        return
    
    generated_pages = []
    generated_readmes = []
    
    def traverse_and_generate(current_tree, path_parts):
        """Parcourt récursivement l'arbre et génère les pages d'index + readmes"""
        
        # Générer la page d'index du dossier
        html_content = generate_directory_index(current_tree, path_parts, build_info, public_dir, path_mapper)
        
        # Déterminer le chemin du fichier
        if path_parts:
            index_path = Path(public_dir) / '/'.join(path_parts) / 'index.html'
        else:
            index_path = Path(public_dir) / 'index.html'
        
        # Créer le dossier si nécessaire
        index_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Écrire le fichier
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        generated_pages.append(str(index_path))
        
        # NOUVEAU: Générer les pages de description pour les projets de ce niveau
        for key, value in current_tree.items():
            if not key.startswith('_') and value.get('_is_project', False):
                # C'est un projet, générer sa page de description
                
                # CORRECTION: Utiliser le chemin complet normalisé depuis _full_path
                full_normalized_path = value.get('_full_path', key)
                project_path = Path(public_dir) / full_normalized_path
                
                vprint(f"🔍 Génération description pour: {full_normalized_path}", 3)
                vprint(f"📁 Chemin projet: {project_path}", 3)
                
                # Générer la page de readme
                readme_html = generate_project_readme_page(
                    project_path, key, path_mapper, build_info
                )
                
                # Sauvegarder la page de readme
                readme_file = project_path / 'index.html'
                readme_file.parent.mkdir(parents=True, exist_ok=True)
                
                with open(readme_file, 'w', encoding='utf-8') as f:
                    f.write(readme_html)
                
                generated_readmes.append(str(readme_file))
        
        # Récursion pour les sous-dossiers
        for key, value in current_tree.items():
            if not key.startswith('_') and not value.get('_is_project', False):
                # C'est un dossier, pas un projet
                children = value.get('_children', {})
                traverse_and_generate(children, path_parts + [key])
    
    # Lancer la génération
    traverse_and_generate(tree, [])
    
    vprint(f"✅ {len(generated_pages)} pages d'index générées",1)
    for page in generated_pages:
        rel_path = Path(page).relative_to(public_dir)
        vprint(f"   📄 {rel_path}")
    
    vprint(f"✅ {len(generated_readmes)} pages de readme générées",1)
    for desc in generated_readmes:
        rel_path = Path(desc).relative_to(public_dir)
        vprint(f"   📖 {rel_path}",3)
    
    return generated_pages + generated_readmes