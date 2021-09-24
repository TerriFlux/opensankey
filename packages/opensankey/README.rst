Open Sankey
***********

Prérequis
---------
Install visual studio code
~~~~~~~~~~~~~~~~~~~~~~~~~~
* https://code.visualstudio.com/
Install python extension
^^^^^^^^^^^^^^^^^^^^^^^^
.. image:: doc/source/_static/ExtensionVSCode.png
   :width: 400
   :align: center
Install chrome extension
^^^^^^^^^^^^^^^^^^^^^^^^

Ouvrir un compte sur Gitlab
~~~~~~~~~~~~~~~~~~~~~~~~~~~
S'inscrire sur le site
^^^^^^^^^^^^^^^^^^^^^^
Générer une clé SSH et la mettre sur gitlab
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
In powershell on windows or terminal on linux or mac:

* ssh-keygen -o -t rsa -b 4096 -C julien.alapetite@gmail.com
* cat ^/.ssh/id_rsa.pub | clip
* paste in https://gitlab.com/profile/keys

Installer Node ( A mettre à jour)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* https://nodejs.org/en/download/

Pour utiliser npm

* npm install npm@latest -g
* npm install (will install packages specified in package.json)
* npm run build

Python
~~~~~~
Installation
^^^^^^^^^^^^
conda doit être préalablement installé sur la machine:

* télécharger depuis https://conda.io/miniconda.html
* Modifier la variable d'environnment PATH(ex C:\Users\alapetite\AppData\Local\Continuum\miniconda3;C:\Users\alapetite\AppData\Local\Continuum\miniconda3\Scripts)
Créer un environnement virtuel
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
* Dans un terminal, lancer la commande suivante en remplaçant "my_env" par le nom souhaité
conda create -n my_env python=3.6

Sélectionner l'environnement virtuel
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
* in visual studio code appeler commande palette ctrl shit p et taper python : select interpreter

.. image:: doc/source/_static/select_python_interpreter.png
   :width: 400
   :align: center
   
* in command prompt with virtual environment selected (activate my_env)

Installer le module opensankey
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* git clone git@gitlab.com:su-model/opensankey.git
* cd opensankey/opensankey/client
* npm install (crée node_modules)
* npm run build
* cd ../.. (se placer à la racine)
* pip install . (bien se placer dans virtual environment)
