# Sankey Application

## Description

Repository contenant l'application de réalisation de diagramme de Sankey.

## Installation

### Cloner et recupérer les sous-modules

Commande bash

```sh
git clone git@gitlab.com:su-model/sankeyapplication.git SankeyApplication #Necessite clée ssh
cd sankeyapplication
git submodule update --init --recursive
```

Ou plus simplement

```sh
git clone --recurse-submodules git@gitlab.com:su-model/sankeyapplication.git SankeyApplication #Necessite clée ssh
```

### Travailler sur les sous-modules

Attention, une fois le repo clonés, les sous-modules contenus sont en mode "détaché".

Pour travailler sur les sous-module, il faut préalablement pull la branche du sous-module, soit directement via VSCode ou bien en se positionnant dans le dossier du sous-module en question.

Dans les sous-modules, il est possible de créer des branches, de faire des commit et de faire des push, ceux-ci seront repercuté sur le repository d'origine du sous-module en question.

Documentation git sur les sous-modules [ici](https://git-scm.com/book/en/v2/Git-Tools-Submodules).

### Installation des dependances externes

Ces dépendances externes sont necessaires
- wkhtmltopdf

### Installation client

Installation des libs

```sh
bash build_client.sh -I
```

Linter check

```sh
bash build_client.sh -L
```

Build check

```sh
bash build_client.sh -B
```

### Installation server (Python)

Installation de Miniconda [ici](https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html).

Creation de l'environnement de travail : Python 3.8.?

```sh
conda create -n sankeyapp python=3.8
conda activate sankeyapp
```

Installation / Mise à jour libs Python

```sh
bash build_server.sh
```

### Deploiement total de l'application

```sh
bash deploy_SankeyApp.sh
```

### Excution en local de l'application

Partie server, à la racine du repo (après l'installation)

```sh
python -m flask run
```

Partie client, dans le dossier client (après l'installation)

```sh
cd client
pnpm run start
```

## Gestion de la base de donnée

### Base de donnée utilisateur

Base au format sqlite, disponible sous `SankeyApp/instance/db.sqlite`

Commandes utiles :

```sh
# Pour entrer dans la base de donnée
sqlite3 SankeyApp/instance/db.sqlite

# Une fois dans l'interface sqlite3
.tables                    # liste les tables présentes
PRAGMA table_info(user);   # Donne la structure de la table user
SELECT * FROM user;        # Donne toutes les entrées de la table user
SELECT * FROM user WHERE name = 'toto';  # Donne toutes les entrées avec nom = toto
.quit                      # Permet de quitter l'interface sqlite

# Ajouter quelqu'un en SankeyDev
UPDATE user SET is_developer = 1 WHERE name = 'toto' AND firstname = 'titi';

# ZONE DE DANGER - Supprimer une entrée
# ATTENTION UNE FOIS SUPPRIME PAS DE MARCHE ARRIERE
DELETE FROM user WHERE id = 14;  # via id - checker avec SELECT * FROM USER
DELETE FROM user WHERE name = 'toto' AND firstname = 'titi'; #
```

### Utilisation d'alembic

Alembic permet de faire automatiquement les migrations de bases de données. Tutoriel disponible [ici](https://alembic.sqlalchemy.org/en/latest/tutorial.html#create-a-migration-script)

Une fois le fichier `SankeyApp/server/models.py`, la commande `alembic revision --autogenerate` permet de générer un fichier python présent dans `SankeyApp/Alembic/versions` qui défini les opérations d'upgrade et de downgrade pour migrer une base de données vers les nouvelles versions ou vers une version précédente.

Commandes utiles :

```sh
# Installation d'alembic
pip install alembic

# Pour générer automatiquement un script de migration. Attention les commandes de migrations seront à vérifier.
alembic revision --autogenerate -m "message changement apporté à base de donnée"

# Pour migrer
alembic check         # Permet de vérifier si la base de données actuelle est à jour
alembic upgrade head  # Permet de migrer la base de donnée vers le dernier format défini
```

## Systeme de paiement STRIPE

### Documentation utile

Point de départ : https://docs.stripe.com/checkout/embedded/quickstart?lang=python&client=react

Cartes de test : https://docs.stripe.com/checkout/embedded/quickstart?lang=python&client=react#testing


### Server stripe CLI

Installation : https://docs.stripe.com/stripe-cli#install

```sh
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

```

Initialisation

```sh
stripe login
```

Lancement

```sh
stripe listen --forward-to localhost:5000/stripe/webhook
```

Ne pas oublier d'exporter la variables secret, exemple : `export STRIPE_ENDPOINT_SECRET=whsec_bd224d5114f66d5f29d5997b******'