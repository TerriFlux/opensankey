- Un utilisateur peut avoir plusieurs licences
- Une licence peut être attribuée à plusieurs utilisateurs
- La table `user_licenses` gère l'association avec dates et statut

---

## Requêtes courantes

### Lister tous les utilisateurs avec licences actives

```sql
SELECT 
    u.id,
    u.email,
    u.firstname,
    u.name,
    l.name AS license_name,
    ul.creation AS license_creation,
    ul.expiry AS license_expiry,
    ul.activated
FROM user u
JOIN user_licenses ul ON u.id = ul.user_id
JOIN license l ON ul.license_id = l.id
WHERE ul.activated = 1
ORDER BY u.name, u.firstname, l.name;
```

### Compter les utilisateurs

```sql
-- Total utilisateurs
SELECT COUNT(*) FROM user;

-- Utilisateurs avec au moins une licence active
SELECT COUNT(DISTINCT u.id)
FROM user u
JOIN user_licenses ul ON u.id = ul.user_id
WHERE ul.activated = 1;

-- Utilisateurs sans licence
SELECT COUNT(*)
FROM user u
LEFT JOIN user_licenses ul ON u.id = ul.user_id AND ul.activated = 1
WHERE ul.user_id IS NULL;
```

### Créer un utilisateur avec licences

```sql
-- 1. Créer l'utilisateur
INSERT INTO user (email, password, firstname, name, creation) 
VALUES ('user@example.com', NULL, 'John', 'DOE', '2026-04-01');

-- 2. Ajouter OpenSankey+ (3 mois)
INSERT INTO user_licenses (user_id, license_id, creation, expiry, activated) 
VALUES (
    (SELECT id FROM user WHERE email = 'user@example.com'),
    1, 
    '2026-04-01', 
    '2026-07-01', 
    1
);

-- 3. Ajouter SankeySuite (3 mois)
INSERT INTO user_licenses (user_id, license_id, creation, expiry, activated) 
VALUES (
    (SELECT id FROM user WHERE email = 'user@example.com'),
    9, 
    '2026-04-01', 
    '2026-07-01', 
    1
);
```

### Utilisateurs inscrits récemment sans licence

```sql
SELECT 
    u.id,
    u.email,
    u.firstname,
    u.name,
    u.creation
FROM user u
LEFT JOIN user_licenses ul ON u.id = ul.user_id AND ul.activated = 1
WHERE u.creation >= '2026-01-01'
  AND ul.user_id IS NULL
ORDER BY u.creation DESC;
```

### Mettre à jour une expiration de licence

```sql
-- Prolonger d'un an
UPDATE user_licenses 
SET expiry = '2027-04-01'
WHERE user_id = (SELECT id FROM user WHERE email = 'user@example.com')
  AND license_id = 1;

-- Rendre illimitée
UPDATE user_licenses 
SET expiry = 'never'
WHERE user_id = 4;
```

### Supprimer un utilisateur et ses licences

```sql
-- 1. Supprimer les licences
DELETE FROM user_licenses 
WHERE user_id = (SELECT id FROM user WHERE email = 'user@example.com');

-- 2. Supprimer l'utilisateur
DELETE FROM user WHERE email = 'user@example.com';
```

---

## Conventions et bonnes pratiques

### IDs auto-incrémentés
- **Ne jamais réindexer les IDs** après suppression
- Les "trous" dans la séquence sont normaux et sains
- Ils indiquent l'historique des suppressions

### Dates d'expiration
- Format : `'YYYY-MM-DD'` ou `'YYYY-MM-DDTHH:MM:SS'`
- Valeur spéciale : `'never'` pour licences illimitées
- Le backend doit gérer correctement la comparaison avec `'never'`

### Statut développeur
- `is_developer = 1` : accès complet sans vérification de licence
- Utilisé pour : équipe TerriFlux, collaborateurs Inria, testeurs

### Noms de licences
- Les noms dans la table `license` peuvent être modifiés par webhook Stripe
- Le frontend cherche les clés exactes : `"OpenSankey+"` et `"SankeySuite"`
- ⚠️ Si les noms incluent des descriptions (ex: `"OpenSankey+ — Diagrammes de Sankey premium"`), le frontend ne reconnaîtra pas les licences

### Colonnes dépréciées
- `user.license_opensankeyplus` et `user.license_sankeysuite` : ne plus utiliser
- Système actuel : table `user_licenses` (plus flexible)

---

## Notes de sécurité

- **Mots de passe** : toujours hashés (sha256 ou pbkdf2)
- **Tokens** : stockés dans `secret_token` avec expiration
- **Stripe IDs** : à ne jamais exposer publiquement
- **SQLite** : base locale, pas d'accès direct depuis le frontend

---

## Intégration Stripe

- Webhook Stripe peut mettre à jour `license.name` automatiquement
- `stripe_id` dans `user` = Customer ID Stripe
- `stripe_subscription_id` dans `user_licenses` = Subscription ID Stripe
- Product IDs Stripe mappés dans `license.stripe_product_id`

---

## Exemples de scénarios

### Scénario 1 : Formation AFM (6 demi-journées)

```sql
-- 10 participants, licences 3 mois
INSERT INTO user_licenses (user_id, license_id, creation, expiry, activated)
SELECT id, 1, '2026-04-01', '2026-07-01', 1 
FROM user 
WHERE email IN ('participant1@example.com', 'participant2@example.com', ...);

INSERT INTO user_licenses (user_id, license_id, creation, expiry, activated)
SELECT id, 9, '2026-04-01', '2026-07-01', 1 
FROM user 
WHERE email IN ('participant1@example.com', 'participant2@example.com', ...);
```

### Scénario 2 : Partenaire longue durée

```sql
-- Licence illimitée pour collaborateur
INSERT INTO user_licenses (user_id, license_id, creation, expiry, activated)
VALUES (
    (SELECT id FROM user WHERE email = 'partner@institution.fr'),
    1,
    '2026-04-01',
    'never',
    1
);
```

### Scénario 3 : Test expiration de licence

```sql
-- Mettre une licence en périmé pour tester
UPDATE user_licenses 
SET expiry = '2026-03-31'
WHERE user_id = 4 AND license_id = 1;

-- Remettre à illimitée après test
UPDATE user_licenses 
SET expiry = 'never'
WHERE user_id = 4 AND license_id = 1;
```

---

## Localisation de la base

**Chemin** : `~/prod_opensankey/sankeyapplication/server/db.sqlite`

**Accès** :
```bash
cd ~/prod_opensankey/sankeyapplication/server
sqlite3 db.sqlite
```

**Commandes SQLite utiles** :
```sql
.tables              -- Lister les tables
.schema user         -- Structure d'une table
.headers on          -- Afficher les en-têtes
.mode column         -- Mode colonne
.quit                -- Quitter
```

---

*Dernière mise à jour : Avril 2026*
*Version : 1.0*