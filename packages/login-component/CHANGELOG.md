# Changelog — LoginComponent

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [1.1.8] — 2026-06-30

### Changed

- Relâche la contrainte de mot de passe (non vide uniquement).

## [1.1.7] — 2026-06-26

### Aligné

- Bump de version aligné sur OpenSankey 1.1.7. Aucun changement fonctionnel propre à LoginComponent.

## [1.1.4] — 2026-05-11

### Aligné

- Bump de version aligné sur OpenSankey 1.1.4. Aucun changement fonctionnel propre à LoginComponent.

## [1.1.3] — 2026-05-10

### Aligné

- Bump de version aligné sur OpenSankey 1.1.3. Aucun changement fonctionnel propre à LoginComponent.

## [1.1.2] — Avril 2026

### Ajouts
- **`feat(paiement)` : notification de conversion d'essai OpenSankey+** — `PaiementReturn` appelle un nouveau helper inline `notifyTrialConverted()` lorsque Stripe confirme la session (`status === 'complete'`). Le helper lit l'UUID anonyme de l'essai dans `localStorage.os_plus_trial_uuid`, pose un drapeau d'idempotence `os_plus_trial_converted` et envoie un POST `/api/trial/converted` au serveur. Permet au backend SankeyApplication de calculer le taux de conversion essai → paiement par intersection des UUIDs `started` ∩ `converted`. Inliné volontairement (sans import depuis OpenSankey+) pour préserver l'indépendance du submodule LoginComponent ; les clés `localStorage` sont la source de vérité documentée dans `submodules/OpenSankey+/client/src/utils/trial.ts` (38c62d0).
