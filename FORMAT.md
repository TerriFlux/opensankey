# Format du fichier Sankey (JSON) — registre des clés

Ce document décrit le format de sérialisation JSON des diagrammes Sankey
(OpenSankey / OpenSankey+ / SankeyApplication). C'est un **embryon** amené à
grandir (issue #22) : il n'est pas encore exhaustif.

## Versionnage

Deux notions **distinctes** cohabitent dans un fichier :

| Clé | Type | Rôle |
|-----|------|------|
| `version` | chaîne pointée (`"1.1.9"`) | Version de l'**application** qui a écrit le fichier. Historiquement aussi utilisée pour router les migrations de rétro-compatibilité (`fromJSON`). |
| `format_version` | entier (`1`) | Version du **format** de sérialisation, **indépendante** de la version d'app. |

### Pourquoi `format_version`

Le routage des migrations par la seule `version` d'app posait deux problèmes :

1. **Faux positifs de migration.** SankeyExcelParser écrivait `"version": "1.0"`
   en dur pour tout JSON issu d'un import Excel. Un tel fichier — pourtant produit
   au format courant — était vu comme antérieur à 1.1.4 et se voyait appliquer les
   migrations legacy (`isVersionBelow('1.0', '1.1.4') === true`), corrompant l'import.
2. **Couplage.** La version d'app bouge à chaque release ; le format, lui, ne change
   que rarement.

`format_version` résout les deux :

- **À l'écriture** : SEP (`io_base.py`, `JSON_FORMAT_VERSION`) et le front
  (`persistenceMigrations.ts`, `CURRENT_FORMAT_VERSION`) écrivent la version de
  format courante. Ces deux constantes doivent rester **alignées**.
- **À la lecture** : si `format_version` est présent, le fichier est déjà au format
  courant. Le dispatcher `DrawingAreaPersistence.fromJSON` neutralise alors la
  `version` pointée (via `effectiveLoadVersion`) pour **ne rejouer aucune migration
  legacy à seuil**. Les fichiers anciens (sans `format_version`) conservent la
  chaîne de migrations historique.

### Règle d'incrémentation

Incrémenter `format_version` (des **deux** côtés, SEP + front) **uniquement** quand
la **structure** du JSON change de façon incompatible — pas à chaque release d'app.
Documenter le changement ci-dessous.

| `format_version` | Changement |
|------------------|------------|
| 1 | Introduction de `format_version` (issue #22). Format courant au moment de l'ajout. |
| 2 | Vues persistées en **delta vs le maître** (issue #254). Une entrée de `views` porte `__patch` (patch structurel) au lieu du snapshot intégral. **Incompatible en lecture** pour une app antérieure, qui prendrait le patch pour une vue. |

### Vues en delta (`format_version` 2)

Une vue ne diffère du maître que par une poignée d'attributs (positions, visibilité,
styles) : la persister en snapshot intégral dupliquait tout le diagramme. Depuis #254,
chaque entrée de `views` peut être encodée en **patch structurel** :

```json
"views": {
  "vue_2": { "__patch": { "nodes": { "n_12": { "position_x": { "$set": 340 } } } } }
}
```

- **Base du patch** : la racine du fichier **privée de sa clé `views`** — définie à
  l'identique à l'écriture et à la lecture, ce qui garantit qu'un patch se réapplique
  exactement sur la base contre laquelle il a été calculé.
- Le delta est un **encodage de sérialisation uniquement** : en mémoire les vues
  restent des snapshots complets. Un patch ne survit donc jamais à une édition du
  maître (contrairement au format legacy « diff », abandonné pour cette raison).
- **Détection structurelle** (présence de `__patch`), pas fondée sur la version : un
  fichier ancien, ou **mixte**, se relit correctement.
- Une vue reste en **snapshot intégral** si son patch ne la reconstitue pas à
  l'identique, ou s'il n'est pas plus petit (cas des tutoriels, où chaque « vue » est
  en réalité un diagramme différent). L'encodage ne dégrade donc jamais.

## Clés principales (non exhaustif)

- `version` — version d'app émettrice (cf. ci-dessus).
- `format_version` — version de format (cf. ci-dessus).
- `nodes`, `links` — nœuds et flux du diagramme.
- `dataTags`, `nodeTags`, `levelTags`, `fluxTags`, `viewTags` — groupes d'étiquettes.
- `ratio_flux_constraints`, `ratio_stock_flux_constraints`, `stock_chaining_constraints`
  — contraintes de niveau Sankey (sankeyexcelparser#116, #156).
- `views`, `current_view` — vues multiples (concept OpenSankey+).

> À compléter au fil des évolutions du format.

## Schéma machine (issue #253)

La **racine** du format est décrite par un schéma [zod](https://zod.dev)
(`packages/opensankey/opensankey/client/src/Persistence/sankeyFormatSchema.ts`),
**source de vérité unique** dont dérivent :

- la validation légère au chargement (`validateSankeyRootJSON`, non bloquante) ;
- le **JSON Schema draft-07 publié**
  [`sankey.schema.json`](packages/opensankey/opensankey/client/src/Persistence/sankey.schema.json),
  généré depuis le zod (régénéré via
  `UPDATE_FORMAT_SCHEMA=1 … test sankeyFormatSchema`, garde-fou anti-dérive en CI).

Le schéma ne contraint pour l'instant que l'**enveloppe** (clés racines typées ;
contenu détaillé des nœuds/liens/styles en `additionalProperties: true`), à
enrichir progressivement. Une validation Python (`jsonschema`) consommant ce
JSON Schema est prévue en suivi (d'abord en avertissement, puis bloquante).
