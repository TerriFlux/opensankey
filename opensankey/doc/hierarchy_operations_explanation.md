# Opérations Hiérarchiques dans les Diagrammes de Sankey

## Introduction

Dans un diagramme de Sankey hiérarchique, les données peuvent être visualisées à différents niveaux d'agrégation. Notre exemple avec les fruits illustre parfaitement ces concepts : nous avons des **nœuds parents** (niveau 1) comme "Fruits" et leurs **nœuds enfants** (niveau 2) comme "Apples" et "Pears".

## Les Trois Opérations Principales

### 🔄 **EXPAND** - Développement hiérarchique

**Qu'est-ce que c'est ?**
L'opération `expand` consiste à "exploser" un nœud parent pour révéler ses composants détaillés (enfants) tout en maintenant la cohérence des flux.

**Exemple concret :**
Quand vous cliquez sur "Expand" sur le nœud **"Fruits"** :

**AVANT (vue agrégée) :**
```
Production → Fruits (40) → Transformation (35)
                     → Exports (5)
```

**APRÈS (vue développée) :**
```
Production → Apples (25) → Transformation (20)
                      → Exports (5)
         → Pears (15) → Transformation (15)
```

**Ce qui se passe techniquement :**
1. Le nœud "Fruits" reste visible mais devient "parent visuel"
2. Deux nouveaux nœuds "Apples" et "Pears" apparaissent
3. Les flux originaux sont redistribués selon les proportions réelles
4. Des liens connectent "Fruits" à ses enfants "Apples" et "Pears"

### 🔀 **AGREGATE_SIDE** - Agrégation latérale

**Qu'est-ce que c'est ?**
L'opération `agregate_side` permet de regrouper des nœuds enfants existants vers leur parent commun, créant une vue plus synthétique.

**Exemple concret :**
Si vous avez déjà une vue développée avec "Apples" et "Pears" visibles, et que vous faites "Agregate Side" :

**AVANT (vue développée) :**
```
Apples (25) → Transformation (20)
           → Exports (5)
Pears (15) → Transformation (15)
```

**APRÈS (vue agrégée) :**
```
Fruits (40) → Transformation (35)
           → Exports (5)
```

**Ce qui se passe techniquement :**
1. Un nouveau nœud "Fruits" (parent) est créé
2. Les flux individuels des enfants sont agrégés et redirigés vers ce parent
3. Les nœuds enfants restent connectés au parent par des liens internes
4. La vue globale devient plus simple et synthétique

### ↩️ **CONTRACT** - Contraction d'expansion

**Qu'est-ce que c'est ?**
L'opération `contract` annule une expansion précédente, restaurant l'état antérieur du diagramme.

**Exemple concret :**
Après avoir fait un `expand` sur "Fruits", vous pouvez faire `contract` pour revenir à l'état initial :

**Vue expandée → Vue contractée**
```
AVANT :                           APRÈS :
Production → Apples → ...         Production → Fruits → ...
         → Pears → ...                     (état initial)
```

**Ce qui se passe techniquement :**
1. Les nœuds enfants créés par l'expansion sont supprimés
2. Les liens originaux du parent sont restaurés
3. Le diagramme revient exactement à son état avant l'expansion

## Cas d'Usage Pratiques

### 📈 **Navigation Progressive**
```
1. Vue générale : "Fruit juice → Consumption (18)"
2. Expand : "Apple juice → Consumption (10)" + "Pear juice → Consumption (8)"
3. Contract : Retour à la vue générale
```

### 🔍 **Analyse Multi-niveau**
- **Niveau stratégique** : Voir les flux globaux entre grandes catégories
- **Niveau opérationnel** : Décomposer pour analyser les détails
- **Flexibilité** : Passer d'un niveau à l'autre selon le besoin

### 🎯 **Gestion de la Complexité**
Dans notre exemple avec les fruits :
- **9 nœuds niveau 1** (vue synthétique)
- **15 nœuds total** (vue complète)
- **Possibilité de mixer** : développer seulement certaines branches

## Avantages de cette Approche

### ✅ **Cohérence Garantie**
- Les sommes des flux détaillés = flux agrégés
- Exemple : Fruits (40) = Apples (25) + Pears (15)

### ✅ **Flexibilité Visuelle**
- Adapter le niveau de détail selon l'audience
- Zoomer sur les parties intéressantes

### ✅ **Conservation de l'Information**
- Aucune perte de données lors des transformations
- Possibilité de revenir à l'état antérieur

## Conclusion

Ces trois opérations (`expand`, `agregate_side`, `contract`) forment un système complet de navigation hiérarchique permettant d'explorer des données complexes de manière intuitive et progressive. L'utilisateur peut ainsi :

- **Partir d'une vue d'ensemble** (niveau agrégé)
- **Creuser dans les détails** (expand)
- **Regrouper pour simplifier** (agregate_side)  
- **Revenir en arrière** (contract)

Cette flexibilité rend l'analyse de flux complexes beaucoup plus accessible et permet d'adapter la visualisation au contexte et aux besoins spécifiques de chaque utilisateur.