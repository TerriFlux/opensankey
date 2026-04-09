Période d'essai OpenSankey+
============================

Cette page décrit le comportement de l'application pour l'accès aux
fonctionnalités OpenSankey+ via la période d'essai gratuite de 30 jours.
Le mécanisme est entièrement local au navigateur (``localStorage``), sans
identification, sans empreinte numérique et sans appel obligatoire au serveur.

Principe général
----------------

- L'essai dure **30 jours**, accordés une seule fois par navigateur.
- L'essai est **opt-in** : il ne démarre **jamais** automatiquement. L'utilisateur
  doit cliquer pour le démarrer.
- Pendant l'essai, **toutes** les fonctionnalités OpenSankey+ sont déverrouillées
  (vues, animations, icônes, dégradés, étiquettes nœud/flux/données…).
- À l'expiration, les fonctionnalités OpenSankey+ se reverrouillent
  automatiquement et l'utilisateur revient en version OpenSankey gratuite.
- Une **licence payante** est toujours prioritaire sur l'essai : un utilisateur
  qui paie OpenSankey+ ne voit jamais aucune fenêtre ou bannière liée à l'essai.

Données stockées localement
---------------------------

Le navigateur conserve, dans son ``localStorage``, les clés suivantes :

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Clé
     - Rôle
   * - ``os_plus_trial_offered``
     - Vaut ``"1"`` dès que la fenêtre d'accueil de l'essai a été présentée
       à l'utilisateur (qu'il ait accepté ou non). Empêche la fenêtre
       d'accueil de réapparaître.
   * - ``os_plus_trial_start``
     - Timestamp en millisecondes du démarrage effectif de l'essai. Présent
       uniquement si l'utilisateur a cliqué sur « Démarrer mon essai ».
   * - ``os_plus_trial_uuid``
     - Identifiant anonyme v4 généré côté client lors du démarrage de l'essai,
       utilisé pour les pings d'analytics agrégés. Aucun lien avec un compte,
       un email ou une IP.
   * - ``os_plus_trial_pinged``
     - Drapeau d'idempotence : empêche un second envoi du ping
       ``/api/trial/started``.
   * - ``os_plus_trial_converted``
     - Drapeau d'idempotence : empêche un second envoi du ping
       ``/api/trial/converted``.

Aucune autre information n'est persistée. Effacer ces clés (vider le
``localStorage``, mode privé, autre navigateur) repart à zéro et permet à un
même humain d'avoir plusieurs essais successifs — c'est un compromis assumé
pour éviter le fingerprinting.

Scénario A — nouveau visiteur anonyme
-------------------------------------

Cas type : un internaute arrive pour la première fois sur ``open-sankey.fr``.

1. La page se charge. Aucune clé d'essai n'existe dans le ``localStorage``.
2. La fenêtre d'accueil **« Essayez OpenSankey+ gratuitement pendant 30 jours »**
   apparaît immédiatement, par-dessus le diagramme. Elle propose :

   - **« Démarrer mon essai de 30 jours »** : marque l'essai comme démarré,
     génère l'UUID anonyme, envoie un ping ``/api/trial/started`` et
     déverrouille immédiatement toutes les fonctionnalités OpenSankey+.
   - **« Plus tard »** : marque la fenêtre comme « vue » (clé
     ``os_plus_trial_offered``) et ferme la modale sans démarrer l'essai.
     L'utilisateur reste sur OpenSankey gratuit.

3. La fenêtre d'accueil ne se réaffichera **jamais** ensuite, peu importe le
   choix.

Scénario B — visiteur récurrent dont l'essai est en cours
---------------------------------------------------------

1. ``os_plus_trial_offered = "1"``, ``os_plus_trial_start`` présent et
   ``days_elapsed <= 30``.
2. Aucune fenêtre n'apparaît au chargement.
3. Toutes les fonctionnalités OpenSankey+ sont disponibles.
4. La bannière en bas de page affiche **« ✦ Essai OpenSankey+ — N jours
   restants »**. Cliquer sur la bannière redirige vers la page d'abonnement
   ``/license/checkout``.

Scénario C — visiteur récurrent qui avait cliqué « Plus tard »
--------------------------------------------------------------

1. ``os_plus_trial_offered = "1"``, mais ``os_plus_trial_start`` est absent.
2. Aucune fenêtre n'apparaît.
3. L'utilisateur est en version OpenSankey gratuite : les fonctionnalités
   OpenSankey+ sont grisées comme pour n'importe quel non-licencié.
4. La bannière en bas de page affiche **« ✦ Démarrer l'essai OpenSankey+ de
   30 jours »**. Cliquer dessus démarre l'essai immédiatement (équivalent du
   bouton « Démarrer » de la fenêtre d'accueil).

Scénario D — l'essai a expiré
-----------------------------

Cas type : un utilisateur revient au jour 31 ou au-delà après avoir démarré
l'essai.

1. ``days_elapsed > 30`` → ``isTrialActive()`` retourne ``false``.
2. Toutes les fonctionnalités OpenSankey+ se reverrouillent automatiquement
   (l'onglet « Vues », les lignes OSP dans les grilles de styles, les icônes,
   etc. redeviennent grisés).
3. La fenêtre **« Période d'essai OpenSankey+ terminée »** apparaît une fois
   au chargement. Elle propose :

   - **« Continuer en version gratuite »** : ferme la fenêtre.
   - **« Souscrire à OpenSankey+ »** : redirige vers ``/license/checkout``.

4. La bannière en bas de page affiche **« ✦ Débloquer OpenSankey+ »** (texte
   identique à celui des utilisateurs non-licenciés).
5. **L'essai ne peut pas être redémarré dans le même navigateur** : la clé
   ``os_plus_trial_start`` reste en place.

Scénario E — utilisateur OpenSankey existant **avec compte mais sans licence**
------------------------------------------------------------------------------

C'est le cas des utilisateurs qui possédaient déjà un compte OpenSankey
(gratuit ou en version basique) mais qui n'ont jamais souscrit à OpenSankey+.

**Important : la période d'essai est indépendante de l'authentification.**
Elle est rattachée au navigateur, pas au compte. La logique est donc identique
à celle d'un visiteur anonyme :

1. L'utilisateur se connecte. Le serveur déclare ``has_licence_sankeyplus =
   false`` → ``has_real_sankey_plus_licence = false`` côté client.
2. Si c'est la **première fois** que ce navigateur ouvre OpenSankey depuis la
   mise en place de l'essai, la fenêtre d'accueil **« Essayez OpenSankey+
   gratuitement pendant 30 jours »** apparaît exactement comme pour un
   visiteur anonyme. L'utilisateur peut accepter ou refuser.
3. Si le navigateur a **déjà** vu la fenêtre (essai en cours, expiré, ou
   refusé), le comportement est celui des scénarios B, C ou D ci-dessus.
4. Le fait d'être connecté n'envoie ni ne reçoit aucune information
   supplémentaire liée à l'essai. Aucun lien n'est établi entre le compte et
   l'UUID anonyme côté serveur.

**Conséquence pratique** : un utilisateur ayant un compte gratuit qui passe
sur un nouvel ordinateur ou un nouveau navigateur bénéficiera d'un nouvel
essai de 30 jours sur cette machine. C'est un compromis assumé pour préserver
l'absence d'empreinte numérique. Ce sur-comptage est connu et documenté dans
les analytics ; il rend le compteur de starts un majorant et le compteur de
conversions trial→paid un minorant.

Scénario F — utilisateur OpenSankey existant **avec licence OpenSankey+**
-------------------------------------------------------------------------

Cas trivial mais important à mentionner pour la complétude :

1. Le serveur déclare ``has_licence_sankeyplus = true`` →
   ``has_real_sankey_plus_licence = true``.
2. Le getter ``has_sankey_plus`` retourne ``true`` quel que soit l'état du
   ``localStorage``.
3. **Aucune** fenêtre liée à l'essai ne s'affiche jamais. **Aucune** bannière
   n'est rendue (la bannière a un ``return <></>`` immédiat dans ce cas).
4. **Aucun** ping d'analytics n'est envoyé (puisque ``startTrial()`` n'est
   jamais appelé pour ces utilisateurs).
5. Si un licencié payant a démarré l'essai par le passé (par exemple avant de
   souscrire), les clés ``localStorage`` restent en place mais ne sont jamais
   lues : sa licence prime totalement.

Scénario G — conversion essai → paiement
----------------------------------------

Quand un utilisateur en cours d'essai (ou même après expiration) clique sur la
bannière puis souscrit avec succès via Stripe :

1. La page de retour Stripe (``PaiementReturn``) reçoit
   ``status = 'complete'``.
2. La fonction ``notifyTrialConverted()`` lit l'UUID local et envoie un ping
   ``/api/trial/converted`` au serveur.
3. Le serveur enregistre la conversion dans ``cache/trial_events.jsonl``.
4. L'utilisateur a désormais ``has_real_sankey_plus_licence = true`` :
   bannière, modales, restrictions de l'essai disparaissent.
5. Côté analytics, l'UUID figure dans les ensembles ``starts`` et
   ``converted``, et le script ``scripts/trial_stats.py`` peut calculer le
   taux de conversion par intersection des deux ensembles.

Côté serveur — analytics
------------------------

Le serveur Flask expose deux routes anonymes :

.. list-table::
   :header-rows: 1
   :widths: 35 65

   * - Route
     - Effet
   * - ``POST /api/trial/started``
     - Reçoit ``{uuid, started_at}``. Append d'une ligne dans
       ``cache/trial_events.jsonl`` et incrément du compteur
       ``cache/trial_counter.txt``.
   * - ``POST /api/trial/converted``
     - Reçoit ``{uuid, converted_at}``. Append d'une ligne dans
       ``cache/trial_events.jsonl``.

Aucune adresse IP, aucun user-agent, aucun cookie n'est journalisé. Seul
l'UUID anonyme généré côté client est enregistré. Le ping est envoyé en
``fetch keepalive`` avec ``.catch`` silencieux : un blocage par adblocker ou
une coupure réseau n'affecte jamais le fonctionnement de l'application.

Pour consulter les compteurs ::

    python scripts/trial_stats.py            # résumé
    python scripts/trial_stats.py --by-day   # répartition par jour UTC
    python scripts/trial_stats.py --raw      # dump JSONL brut

Composants impliqués
--------------------

- ``submodules/OpenSankey+/client/src/utils/trial.ts`` — logique pure : lecture/
  écriture du ``localStorage``, génération d'UUID, envoi des pings.
- ``submodules/OpenSankey+/client/src/components/ModalTrialOSP.tsx`` — fenêtres
  d'accueil et d'expiration, et bannière du bas (``BannerTrialOSP``).
- ``submodules/OpenSankey+/client/src/types/ApplicationDataOSP.tsx`` — override
  du getter ``has_sankey_plus`` pour intégrer ``isTrialActive()``, et nouveau
  getter ``has_real_sankey_plus_licence``.
- ``submodules/OpenSankey+/client/src/ModulesOSP.tsx`` — injection des deux
  modales dans ``moduleDialogsOSP`` et de la bannière dans
  ``additional_bottom_item``.
- ``submodules/LoginComponent/client/src/Paiement/Paiement.tsx`` — appel à
  ``notifyTrialConverted()`` dans ``PaiementReturn`` au retour Stripe success.
- ``server/views.py`` — routes ``/api/trial/started`` et ``/api/trial/converted``.
- ``scripts/trial_stats.py`` — outil de lecture des compteurs côté serveur.
