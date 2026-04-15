Workflow de contribution — branches, issues et cycle de tests
===============================================================

Ce document décrit le workflow standard pour toute tâche de
développement non triviale sur SankeyApplication et ses submodules.
Il couvre la création d'issues GitLab, le nommage des branches, la
gestion des submodules imbriqués et le cycle de validation par labels
``Tests::*``.

Contexte — sandwich de submodules
----------------------------------

Le projet est un empilement de **six submodules Git indépendants**,
chacun hébergé comme un projet GitLab distinct sous le groupe
``su-model`` sur gitlab.com, plus ``eigen`` en dépendance externe.

.. code-block:: text

   SA (racine)                                    → su-model/sankeyapplication
   ├── submodules/OpenSankey+                     → su-model/sankeyanimation    (OSP)
   │   └── submodules/OpenSankey                  → su-model/opensankey         (OS)
   │       └── submodules/SankeyExcelParser       → su-model/sankeyexcelparser
   ├── submodules/LoginComponent                  → su-model/logincomponent
   └── submodules/MFAProblem                      → su-model/mfa_problem
       └── submodules/eigen                       → libeigen/eigen (externe)

Table récapitulative :

.. list-table::
   :header-rows: 1
   :widths: 18 22 32 12 16

   * - Rôle
     - Projet GitLab
     - Chemin local (depuis racine SA)
     - Branche par défaut
     - Autoclose ``Closes #N``
   * - SA
     - ``su-model/sankeyapplication``
     - ``.``
     - ``main``
     - activé
   * - OSP
     - ``su-model/sankeyanimation``
     - ``submodules/OpenSankey+``
     - ``main``
     - désactivé
   * - OS
     - ``su-model/opensankey``
     - ``submodules/OpenSankey+/submodules/OpenSankey``
     - ``main`` (OSP pin sur ``proto_classe``)
     - désactivé
   * - SankeyExcelParser
     - ``su-model/sankeyexcelparser``
     - ``submodules/OpenSankey+/submodules/OpenSankey/submodules/SankeyExcelParser``
     - ``main``
     - désactivé
   * - LoginComponent
     - ``su-model/logincomponent``
     - ``submodules/LoginComponent``
     - ``main``
     - activé
   * - MFAProblem
     - ``su-model/mfa_problem``
     - ``submodules/MFAProblem``
     - ``master``
     - activé

.. note::

   Le réglage ``autoclose_referenced_issues`` est documenté pour
   référence mais n'est **pas utilisé** par ce workflow. On applique
   un label ``Tests::To do`` au merge au lieu de fermer l'issue — voir
   plus bas.

Pièges connus
~~~~~~~~~~~~~

- **Nom de repo trompeur** : OSP s'appelle ``sankeyanimation`` sur
  GitLab, pas ``opensankey+``.
- **Branche par défaut différente** : ``mfa_problem`` utilise
  ``master``, tous les autres ``main``.
- **OSP pin OS sur ``proto_classe``** : pour un travail OS destiné à
  remonter dans OSP, partir de et merger vers ``proto_classe``, pas
  ``main``.
- **SankeyExcelParser est imbriqué sous OS**, pas directement sous
  SA. Modifier le parser implique trois bumps de pointeurs en cascade
  (OS → OSP → SA).
- **``eigen`` est externe** (``libeigen/eigen``) — ne jamais créer
  d'issue ni de MR dessus, c'est juste une dépendance C++ de
  MFAProblem.

Cycle de vie d'une tâche
------------------------

Trois points d'entrée sont possibles.

A — Nouvelle tâche
~~~~~~~~~~~~~~~~~~

1. **Identifier la couche impactée.** Lire le code concerné si
   l'emplacement est ambigu. Une même tâche peut toucher plusieurs
   couches — dans ce cas, créer une issue par repo concerné avec
   cross-références (``Related: su-model/opensankey#42``).
2. **Créer l'issue** sur le projet GitLab qui héberge réellement le
   code à modifier :

   .. code-block:: bash

      glab issue create -R su-model/<projet> \
        --title "..." \
        --description "..."

3. Récupérer le numéro ``#N`` et passer à la phase Travail.

B — Tâche existante
~~~~~~~~~~~~~~~~~~~

1. **Récupérer l'issue** et lire son contenu, ses labels et ses
   commentaires :

   .. code-block:: bash

      glab issue view N -R su-model/<projet> --comments

2. La couche est en principe déterminée par le projet GitLab
   lui-même. Confirmer en cas de doute.
3. Passer à la phase Travail.

C — Retravail après ``Tests::Failed``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Lire les commentaires** de l'issue pour comprendre ce qui a
   échoué au test.
2. **Créer une nouvelle branche** ``fix/<N>-<slug>-rework`` — ne pas
   réutiliser l'ancienne branche qui a déjà été mergée.
3. Au merge du correctif, le label ``Tests::To do`` est appliqué et
   remplace automatiquement ``Tests::Failed`` grâce au scope.

Phase Travail (commune aux trois points d'entrée)
-------------------------------------------------

Création d'un worktree isolé
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Pour travailler sur plusieurs tâches en parallèle sans interférence,
utiliser ``git worktree`` plutôt que de switcher de branches dans le
répertoire principal. Créer le worktree **directement sur le repo
concerné**, pas systématiquement sur SA.

.. code-block:: bash

   # Exemple pour une tâche dans OS
   cd submodules/OpenSankey+/submodules/OpenSankey
   git worktree add ../../../../../sankeyapp-feat-42 -b feat/42-mon-slug

.. warning::

   ``git worktree add`` sur **SA** réinitialise l'état des submodules
   dans le nouveau worktree. Si tu crées un worktree sur SA, lance
   immédiatement ``git submodule update --init --recursive`` dans le
   nouveau répertoire pour récupérer la hiérarchie complète.

Convention de nommage des branches
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Format : ``<type>/<N>-<slug>`` où ``<type>`` est l'un de :

- ``feat`` — nouvelle fonctionnalité
- ``fix`` — correction de bug
- ``refactor`` — refactoring sans changement de comportement
- ``chore`` — maintenance (déps, config, build)
- ``docs`` — documentation pure

Exemples :

- ``feat/42-shift-drag-axis-lock``
- ``fix/77-hierarchies-memoization-rework``
- ``docs/103-workflow-contribution``

Branche cible du merge request
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 40 30

   * - Projet
     - Branche cible
   * - SA, OSP, LoginComponent, SankeyExcelParser
     - ``main``
   * - MFAProblem
     - ``master``
   * - OS (travail destiné à remonter dans OSP)
     - ``proto_classe``

Description du MR
~~~~~~~~~~~~~~~~~

Inclure ``Related: #N`` dans la description — **jamais** ``Closes
#N``. L'issue doit rester ouverte pour la phase de test.

Bumps de pointeurs de submodules
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Après merge dans un submodule, les repos parents continuent de
pointer vers l'ancien commit. Il faut remonter la chaîne :

.. code-block:: bash

   # Exemple : modif mergée dans OS
   cd submodules/OpenSankey+
   git submodule update --remote submodules/OpenSankey
   git add submodules/OpenSankey
   git commit -m "chore: bump OpenSankey submodule"
   git push
   # Puis même chose dans SA pour bumper OSP

Cas le plus lourd : une modification dans **SankeyExcelParser**
nécessite **trois bumps en cascade** (OS → OSP → SA).

Application du label ``Tests::To do``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Au merge du MR, appliquer le label ``Tests::To do`` sur l'issue :

.. code-block:: bash

   glab issue update N -R su-model/<projet> --label "Tests::To do"

L'issue **reste ouverte**. Elle sort du périmètre du développeur
et entre dans la file d'attente du tester.

Cycle de validation par labels
------------------------------

Quatre labels scopés ``Tests::*`` existent au niveau du groupe GitLab
``su-model`` et sont donc disponibles sur les six projets :

.. list-table::
   :header-rows: 1
   :widths: 25 15 60

   * - Label
     - Couleur
     - Signification
   * - ``Tests::To do``
     - violet
     - Merged, en attente de test.
   * - ``Tests::Passed``
     - vert
     - Testé avec succès. À fermer.
   * - ``Tests::Failed``
     - magenta
     - Testé avec échec. Déclenche un cycle de retravail (point
       d'entrée C).
   * - ``Tests::Nothing to do``
     - gris
     - Pas de test applicable (documentation pure, refactoring sans
       impact utilisateur).

.. note::

   Le préfixe ``Tests::`` est un **scoped label** GitLab : GitLab
   garantit qu'un seul label de ce scope peut être appliqué à la
   fois. Appliquer ``Tests::Failed`` remplace automatiquement
   ``Tests::To do`` — pas besoin d'enlever l'ancien.

Transitions
~~~~~~~~~~~

.. code-block:: text

                          ┌──────────────────┐
                          │                  │
   [merge] → Tests::To do ─┼→ Tests::Passed ─→ issue fermée
                          │                  │
                          └→ Tests::Failed ──┘
                                  │
                                  └→ [retravail, cas C]
                                        ↓
                                     Tests::To do (re-merge)

Le développeur applique ``Tests::To do``. Le tester applique
``Tests::Passed`` ou ``Tests::Failed``. Seul ``Tests::Passed`` conduit
à la fermeture de l'issue (manuelle).

Exceptions — cas où on ne crée pas d'issue
-------------------------------------------

- Micro-corrections (typo, commentaire, formatage).
- Explications ou lectures de code sans modification.
- Exploration, questions, investigations.
- Bumps de pointeurs seuls — c'est une étape d'un autre cycle, pas
  une tâche.

Outils
------

- ``glab`` (GitLab CLI) — installable via ``winget install GLab.GLab``
  sur Windows. Une fois installé, ``glab auth login --hostname
  gitlab.com`` pour s'authentifier.
- ``git worktree`` — livré avec Git, permet plusieurs branches
  checkées out simultanément dans des répertoires différents.
