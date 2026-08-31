"""
/menus/templates_save — reenregistrement d'un modele de galerie (DEV).

La route ecrit dans le depot de la source puis committe : trois choses doivent
tenir, sinon la fonctionnalite devient un moyen d'ecrire n'importe ou.

  - la garde dev (mode debug ou compte `is_developer`) : ferme, la route repond
    404, comme la galerie e!Sankey locale ;
  - la liste blanche : SEULS les chemins declares par l'index sont ecrivables ;
  - l'ecrasement seul : un chemin declare mais absent du disque n'est pas cree.

On verifie aussi la forme d'enregistrement : .json indente (diff git relisible),
.json.gz d'origine supprime, index bascule sur le .json, et le tout dans UN
commit qui ne contient que ces fichiers.

SEULE SOURCE REENREGISTRABLE : 'sankeydata' (les modeles). La sankeytheque
('mfadata') n'est PLUS une source d'ecriture depuis le retrait sa#457
(31/08/2026) : elle est servie par la bibliotheque, et sa contrepartie
d'ecriture est le depot d'une version de brique (sa#456). Toute demande
mfadata est refusee, et rien n'est ecrit sur le disque MFAData meme si la
variable d'environnement est posee.
"""

import gzip
import json
import os
import subprocess

import pytest

from opensankey.server import create_app


def git(repo, *args):
    return subprocess.run(
        ["git", "-C", str(repo)] + list(args),
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )


@pytest.fixture(autouse=True)
def skip_sans_git():
    if subprocess.run(["git", "--version"], capture_output=True).returncode != 0:
        pytest.skip("git indisponible")


@pytest.fixture
def sankeydata(tmp_path, monkeypatch):
    """Une racine SANKEY_DATA minimale, versionnee : un modele publie
    (uniquement compresse, comme dans la vraie galerie), un leurre hors index,
    et une entree fantome (declaree, absente du disque)."""
    root = tmp_path / "sankeydata"
    (root / "templates" / "data").mkdir(parents=True)
    with gzip.open(root / "templates" / "data" / "modele.json.gz", "wt",
                   encoding="utf-8") as file_gz:
        json.dump({"nodes": {}, "links": {}}, file_gz)
    (root / "hors_index.json").write_text(json.dumps({"secret": "interdit"}),
                                          encoding="utf-8")
    index = {
        "categories": ["opensankey"],
        "templates": {
            "modele": {
                "file_path": "templates/data/modele.json.gz",
                "lang": "fr",
                "category": "opensankey",
            },
            # Declare par l'index mais absent du disque : ecraser, oui ; creer, non.
            "fantome": {
                "file_path": "templates/data/fantome.json",
                "lang": "fr",
                "category": "opensankey",
            },
        },
    }
    (root / "templates" / "index.json").write_text(json.dumps(index, indent=2),
                                                   encoding="utf-8")
    git(root, "init", "-q")
    git(root, "add", "-A")
    git(root, "-c", "user.name=T", "-c", "user.email=t@t", "commit", "-q", "-m", "init")
    monkeypatch.setenv("SANKEY_DATA", str(root))
    monkeypatch.delenv("MFAData", raising=False)
    return root


@pytest.fixture
def mfadata_decoy(tmp_path, monkeypatch):
    """Un disque MFAData present et une env posee : rien ne doit s'y ecrire ni
    s'en servir — le retrait sa#457 ne depend pas de l'absence du clone."""
    root = tmp_path / "mfadata"
    (root / "Etudes").mkdir(parents=True)
    with gzip.open(root / "Etudes" / "demo.json.gz", "wt", encoding="utf-8") as file_gz:
        json.dump({"nodes": {}, "links": {}}, file_gz)
    (root / "index.json").write_text(json.dumps({
        "categories": ["etudes"],
        "templates": {"demo": {"file_path": "Etudes/demo.json.gz",
                               "lang": "fr", "category": "etudes"}},
    }, indent=2), encoding="utf-8")
    git(root, "init", "-q")
    git(root, "add", "-A")
    git(root, "-c", "user.name=T", "-c", "user.email=t@t", "commit", "-q", "-m", "init")
    monkeypatch.setenv("MFAData", str(root))
    return root


@pytest.fixture
def client_dev(sankeydata):
    """Poste de developpeur : mode debug et AUCUNE gestion de comptes montee."""
    app = create_app()
    app.config["PROPAGATE_EXCEPTIONS"] = False
    app.debug = True
    return app.test_client()


@pytest.fixture
def client_ferme(sankeydata):
    """Client ordinaire : ni debug, ni compte developpeur. DEBUG force a False —
    FLASK_DEBUG traine dans l'environnement de beaucoup de postes."""
    app = create_app()
    app.config["PROPAGATE_EXCEPTIONS"] = False
    app.config["DEBUG"] = False
    return app.test_client()


@pytest.fixture
def client_deploye(sankeydata):
    """Serveur deploye : login-component monte, visiteur non developpeur. Le repli
    « mode debug » ne doit PAS ouvrir la route, meme si FLASK_DEBUG est pose."""
    app = create_app()
    app.config["PROPAGATE_EXCEPTIONS"] = False
    app.debug = True
    app.login_manager = object()
    return app.test_client()


DIAGRAM = {"nodes": {"n0": {"name": "Corrige"}}, "links": {}}

MODELE = "templates/data/modele.json.gz"


def save(client, file_path, diagram=None, message="test", source="sankeydata",
         **extra):
    payload = {"file_path": file_path, "json": diagram or DIAGRAM,
               "message": message, "source": source}
    payload.update(extra)
    return client.post("/menus/templates_save", json=payload)


# create_app renvoie une redirection sur 404 (page_not_found) : un refus se lit
# donc « pas 200 », comme dans test_templates_asset_whitelist.
def test_route_fermee_hors_compte_developpeur(client_ferme, sankeydata):
    response = save(client_ferme, MODELE)

    assert response.status_code != 200
    assert not (sankeydata / "templates" / "data" / "modele.json").exists()
    assert (sankeydata / "templates" / "data" / "modele.json.gz").exists()


def test_route_fermee_sur_un_serveur_avec_comptes(client_deploye, sankeydata):
    """Le mode debug ne doit jamais suffire des qu'il y a des comptes."""
    response = save(client_deploye, MODELE)

    assert response.status_code != 200
    assert not (sankeydata / "templates" / "data" / "modele.json").exists()


def test_enregistre_en_json_lisible_et_supprime_le_gz(client_dev, sankeydata):
    response = save(client_dev, MODELE)

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] and payload["committed"]
    ecrit = sankeydata / "templates" / "data" / "modele.json"
    assert ecrit.exists()
    assert not (sankeydata / "templates" / "data" / "modele.json.gz").exists()
    # Indente : un diff git ligne a ligne, c'est tout l'interet du .json en clair.
    contenu = ecrit.read_text(encoding="utf-8")
    assert "\n" in contenu.strip()
    assert json.loads(contenu) == DIAGRAM


def test_l_index_bascule_sur_le_json(client_dev, sankeydata):
    """Les outils qui lisent l'index (vignettes, publication) ouvrent file_path
    tel quel : il doit decrire la realite du disque."""
    save(client_dev, MODELE)

    index = json.loads(
        (sankeydata / "templates" / "index.json").read_text(encoding="utf-8"))
    assert index["templates"]["modele"]["file_path"] == "templates/data/modele.json"


def test_le_commit_ne_contient_que_le_modele_et_l_index(client_dev, sankeydata):
    """Un fichier de travail non committe traine dans la copie : il ne doit pas
    partir dans le commit de l'app."""
    (sankeydata / "templates" / "brouillon.txt").write_text(
        "en cours", encoding="utf-8")

    save(client_dev, MODELE, message="mise a jour modele")

    fichiers = git(sankeydata, "show", "--name-only", "--format=%s", "HEAD").stdout.split()
    assert "templates/data/modele.json" in fichiers
    assert "templates/data/modele.json.gz" in fichiers
    assert "templates/index.json" in fichiers
    assert "templates/brouillon.txt" not in fichiers
    assert git(sankeydata, "log", "-1", "--format=%s").stdout.strip() \
        == "mise a jour modele"


def test_push_refuse_laisse_le_commit_et_le_dit(client_dev, sankeydata):
    """Depot sans remote : le commit reste local et la reponse l'annonce, plutot
    que de faire croire a une publication."""
    payload = save(client_dev, MODELE).get_json()

    assert payload["committed"] and not payload["pushed"]
    assert payload["detail"]


@pytest.mark.parametrize("demande", ["templates/data/modele.json",
                                     "templates/data/modele.json.gz"])
def test_relecture_par_la_galerie_apres_enregistrement(client_dev, sankeydata,
                                                       demande):
    """Round-trip. Le .json frais est servi aussi bien par le nouveau chemin que
    par l'ancien (.gz), que reclame toute galerie deja ouverte dans un
    navigateur."""
    save(client_dev, MODELE)

    response = client_dev.get("/menus/templates_asset/" + demande)

    assert response.status_code == 200
    assert json.loads(gzip.decompress(response.data).decode("utf-8")) == DIAGRAM


def test_reenregistrement_par_l_ancien_chemin(client_dev, sankeydata):
    """Deuxieme enregistrement depuis une galerie chargee AVANT le premier :
    elle envoie encore le .gz, l'index dit deja .json — ca doit passer."""
    save(client_dev, MODELE)

    payload = save(client_dev, MODELE, diagram={"nodes": {}, "links": {"l": {}}})

    assert payload.status_code == 200 and payload.get_json()["committed"]
    ecrit = json.loads((sankeydata / "templates" / "data" / "modele.json")
                       .read_text(encoding="utf-8"))
    assert ecrit["links"] == {"l": {}}


@pytest.mark.parametrize(
    "file_path",
    [
        "hors_index.json",                       # existe, mais pas dans l'index
        "templates/index.json",                  # l'index lui-meme n'est pas un modele
        "templates/../hors_index.json",          # remontee normalisee avant le filtre
        "../evasion.json",
    ],
)
def test_refuse_tout_chemin_non_declare(client_dev, sankeydata, file_path):
    response = save(client_dev, file_path)

    assert response.status_code != 200
    assert json.loads(
        (sankeydata / "hors_index.json").read_text(encoding="utf-8")
    ) == {"secret": "interdit"}


def test_refuse_de_creer_un_modele_absent_du_disque(client_dev, sankeydata):
    response = save(client_dev, "templates/data/fantome.json")

    assert response.status_code != 200
    assert not (sankeydata / "templates" / "data" / "fantome.json").exists()


def test_refuse_une_charge_utile_sans_diagramme(client_dev, sankeydata):
    response = client_dev.post(
        "/menus/templates_save",
        json={"file_path": MODELE, "json": "pas un objet", "source": "sankeydata"}
    )

    assert response.status_code == 400
    assert os.path.exists(sankeydata / "templates" / "data" / "modele.json.gz")


def test_refuse_une_source_inconnue(client_dev, sankeydata):
    assert save(client_dev, MODELE, source="esankey-local").status_code != 200


# ---------------------------------------------------------------------------
# Retrait sa#457 : 'mfadata' n'est PLUS une source d'ecriture
# ---------------------------------------------------------------------------

def test_mfadata_nest_plus_une_source_decriture(client_dev, sankeydata,
                                                mfadata_decoy):
    """Meme un chemin que l'index du disque declare, avec l'env posee : refus,
    et rien n'a bouge dans le depot MFAData."""
    response = save(client_dev, "Etudes/demo.json.gz", source="mfadata")

    assert response.status_code != 200
    assert not (mfadata_decoy / "Etudes" / "demo.json").exists()
    assert (mfadata_decoy / "Etudes" / "demo.json.gz").exists()
    assert git(mfadata_decoy, "status", "--porcelain").stdout.strip() == ""


def test_une_demande_sans_source_est_refusee(client_dev, sankeydata,
                                             mfadata_decoy):
    """Le defaut historique de la route etait 'mfadata' : un client d'avant le
    retrait, qui n'envoie pas de source, doit etre refuse — jamais rerouté."""
    response = client_dev.post("/menus/templates_save", json={
        "file_path": "Etudes/demo.json.gz", "json": DIAGRAM, "message": "t"})

    assert response.status_code != 200
    assert not (mfadata_decoy / "Etudes" / "demo.json").exists()


def test_l_etat_mfadata_est_ferme(client_dev, sankeydata, mfadata_decoy):
    """Le dialogue de reenregistrement sonde templates_save_state : pour la
    sankeytheque, la reponse est un refus franc — le bouton se desactive."""
    assert client_dev.get(
        "/menus/templates_save_state?source=mfadata").status_code != 200


# ---------------------------------------------------------------------------
# Adresse publique du modele (published_url) : portee par l'index
# ---------------------------------------------------------------------------
# La galerie en fait un lien « voir en ligne ». Elle est validee par le
# developpeur dans le dialogue, donc filtree ici : seul un http(s) est retenu.
def test_l_index_retient_l_adresse_publiee(client_dev, sankeydata):
    save(client_dev, MODELE,
         published_url="https://terriflux.com/portfolios/SOCLE/Sucre")

    index = json.loads(
        (sankeydata / "templates" / "index.json").read_text(encoding="utf-8"))
    assert index["templates"]["modele"]["published_url"] \
        == "https://terriflux.com/portfolios/SOCLE/Sucre"


def test_une_adresse_vide_retire_le_lien_de_l_index(client_dev, sankeydata):
    save(client_dev, MODELE, published_url="https://terriflux.com/p/x")
    save(client_dev, "templates/data/modele.json", diagram={"nodes": {}},
         published_url="")

    index = json.loads(
        (sankeydata / "templates" / "index.json").read_text(encoding="utf-8"))
    assert "published_url" not in index["templates"]["modele"]


def test_une_adresse_non_http_est_ignoree(client_dev, sankeydata):
    save(client_dev, MODELE, published_url="javascript:alert(1)")

    index = json.loads(
        (sankeydata / "templates" / "index.json").read_text(encoding="utf-8"))
    assert "published_url" not in index["templates"]["modele"]


# ---------------------------------------------------------------------------
# Serveur deploye : checkout detache, et ecriture a valider avant le temporaire
# ---------------------------------------------------------------------------
# Un HEAD detache n'est pas une anomalie : c'est l'etat normal d'un submodule
# (`git submodule update` pose un sha), donc celui de tous les serveurs deployes.
# Le geste doit y marcher — ce qui met le travail a l'abri, c'est le push, pas la
# copie de travail, remplacee au deploiement suivant. Ne restent refuses que les
# cas ou il n'y a nulle part ou pousser, ou rien a ecrire.
@pytest.fixture
def sankeydata_deploye(sankeydata, tmp_path):
    """Le depot tel qu'un deploiement le laisse : un checkout DETACHE, avec un
    remote. Renvoie le depot nu qui joue origin."""
    remote = tmp_path / "sankeydata.git"
    subprocess.run(["git", "init", "--bare", "-q", str(remote)], capture_output=True)
    git(sankeydata, "remote", "add", "origin", str(remote))
    git(sankeydata, "push", "-q", "origin", "HEAD:refs/heads/main")
    git(sankeydata, "fetch", "-q", "origin")
    git(sankeydata, "checkout", "-q", "--detach", "HEAD")
    return remote


def test_un_checkout_detache_pousse_sur_la_branche_distante(
        client_dev, sankeydata, sankeydata_deploye):
    """`git push` nu echoue sur un HEAD detache, faute de branche courante : le
    refspec explicite fait atterrir le commit sur la branche que suit origin."""
    payload = save(client_dev, MODELE,
                   message="modeles: correction depuis le serveur").get_json()

    assert payload["ok"] and payload["committed"] and payload["pushed"]
    assert payload["branch"] == "main"
    # Le travail est chez origin, la ou il survivra au prochain deploiement.
    assert git(sankeydata_deploye, "log", "-1", "--format=%s", "main").stdout.strip() \
        == "modeles: correction depuis le serveur"
    fichiers = git(sankeydata_deploye, "show", "--name-only", "--format=", "main").stdout
    assert "templates/data/modele.json" in fichiers


def test_un_checkout_detache_sans_remote_est_refuse(client_dev, sankeydata):
    """La seule situation vraiment perdante : ni branche locale, ni branche
    distante. Le commit ne pourrait aller nulle part — autant ne rien ecrire."""
    git(sankeydata, "checkout", "-q", "--detach", "HEAD")

    payload = save(client_dev, MODELE).get_json()

    assert payload["ok"] is False and payload["saved"] is False
    # Rien n'a ete touche : ni le .gz d'origine, ni un temporaire laisse a cote.
    assert [p.name for p in (sankeydata / "templates" / "data").iterdir()] \
        == ["modele.json.gz"]


def test_une_racine_non_versionnee_est_refusee(client_dev, tmp_path, monkeypatch):
    """Meme refus si la racine existe mais n'est pas un depot : il n'y a pas de
    filet git, donc pas de reenregistrement."""
    nue = tmp_path / "sans_git"
    nue.mkdir()
    monkeypatch.setenv("SANKEY_DATA", str(nue))

    payload = save(client_dev, MODELE).get_json()

    assert payload["ok"] is False
    assert "git" in payload["detail"]


@pytest.mark.skipif(os.name == "nt" or (hasattr(os, "geteuid") and os.geteuid() == 0),
                    reason="droits POSIX inapplicables (Windows, ou root qui passe outre)")
def test_un_dossier_ferme_en_ecriture_est_refuse_avant_le_temporaire(
        client_dev, sankeydata):
    """Le bug d'origine, tel qu'il se presentait en production : la racine etait
    ouverte, le sous-dossier vise non — et le seul retour etait un EACCES sur un
    fichier temporaire. C'est donc le dossier REELLEMENT ecrit qu'on sonde."""
    dossier = sankeydata / "templates" / "data"
    dossier.chmod(0o555)
    try:
        payload = save(client_dev, MODELE).get_json()
    finally:
        dossier.chmod(0o755)

    assert payload["ok"] is False and payload["saved"] is False
    assert "lecture seule" in payload["detail"]
    assert not list(dossier.glob("*.tmp"))


def test_l_etat_annonce_au_dialogue_ce_que_le_serveur_peut_faire(client_dev, sankeydata):
    """Le dialogue desactive son bouton sur cette reponse : elle doit dire oui
    tant qu'il y a ou ecrire et ou pousser, et non — avec la raison — sinon."""
    ouvert = client_dev.get(
        "/menus/templates_save_state?source=sankeydata"
        "&path=templates/data/modele.json.gz")
    assert ouvert.status_code == 200
    assert ouvert.get_json()["available"] is True

    git(sankeydata, "checkout", "-q", "--detach", "HEAD")

    ferme = client_dev.get("/menus/templates_save_state?source=sankeydata").get_json()
    assert ferme["available"] is False
    assert ferme["reason"]


def test_l_etat_est_ferme_hors_compte_developpeur(client_ferme, sankeydata):
    """Meme garde que la route d'ecriture : rien ne filtre vers un visiteur."""
    assert client_ferme.get(
        "/menus/templates_save_state?source=sankeydata").status_code != 200
