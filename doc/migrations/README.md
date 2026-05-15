# Migrations — runbooks et historique

Ce dossier regroupe les runbooks de migration d'infrastructure (VPS, OS, versions de runtime serveur, etc.) et sert d'historique consultable.

Convention de nommage : `YYYY-MM-<périmètre>.md` (tri chronologique naturel).

## Historique

| Date | Périmètre | Doc |
|---|---|---|
| 2026-05 | VPS `dev.open-sankey.fr` — Ubuntu 20.04 → 24.04, Python 3.8 → 3.12, Node 22 | [2026-05-vps-py3.12.md](2026-05-vps-py3.12.md) |

## Périmètre

Un runbook de migration documente :

- Le contexte (versions avant/après, machine cible, date).
- Les étapes ordonnées et reproductibles (préparation OS, services, certificats, DNS).
- Les corrections de compatibilité qui n'ont pas encore été remontées dans les sources (à committer ensuite dans les submodules concernés).
- Les étapes pour les environnements suivants si la migration est progressive (dev → test → prod).

Une fois une migration complètement appliquée et ses fixes committés, le doc reste comme trace d'historique — il n'a plus besoin d'être maintenu.
