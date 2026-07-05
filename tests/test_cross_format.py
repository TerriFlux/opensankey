# #231 — Volet « Python-lu » des tests croisés TS↔Python du format.
#
# Le format Sankey a deux implémentations jamais confrontées : TS
# (SankeyPersistence) et Python (SEP io_base.IOJson). Ce test lit avec SEP les
# dumps TS-écrits du corpus golden, produits par le test jest
# packages/opensankey/.../Persistence/corpusCrossDump.test.ts dans
# `.cross-format/` (gitignoré). En CI, le job `test` récupère `.cross-format/`
# en artefact du job `test:jest` ; en local, lancer d'abord :
#   cd packages/opensankey/opensankey/client && CI=true pnpm test -- --testPathPattern corpusCrossDump
#
# Sans `.cross-format/`, la suite se skippe explicitement (pytest -rs le liste).
#
# Le sens inverse (Python-écrit → TS-lu) est couvert par corpusRoundTrip.test.ts
# (l'époque current-fmt1/ du corpus est générée par SEP et chargée par TS).

import json
import os

import pytest

from SankeyExcelParser.io_base import IOJson

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CROSS_DIR = os.path.join(REPO_ROOT, '.cross-format')
CORPUS_DIR = os.path.join(REPO_ROOT, 'SankeyData', 'corpus')


def _load_manifest():
    manifest_path = os.path.join(CROSS_DIR, 'manifest.json')
    if not os.path.isfile(manifest_path):
        return None
    with open(manifest_path, encoding='utf-8') as f:
        return json.load(f)


MANIFEST = _load_manifest()

pytestmark = pytest.mark.skipif(
    MANIFEST is None,
    reason=".cross-format/ absent — générer les dumps TS d'abord (jest corpusCrossDump)",
)


def _dump_cases():
    if not MANIFEST:
        return []
    return sorted(MANIFEST.items())


@pytest.mark.parametrize('dump_name,source_rel', _dump_cases())
def test_ts_dump_lisible_par_sep(dump_name, source_rel):
    """Chaque dump TS du corpus doit être chargeable par SEP (IOJson)."""
    dump_path = os.path.join(CROSS_DIR, dump_name)
    with open(dump_path, encoding='utf-8') as f:
        dump_json = json.load(f)

    io = IOJson()
    ok, msg = io.load_sankey(dump_path)
    assert ok, f"SEP ne lit pas le dump TS de {source_rel} : {msg}"

    # Cohérence structurelle : mêmes nœuds, et mêmes PAIRES (source, cible) —
    # différence de modèle assumée : TS garde un lien par (paire × tag) dans
    # certains fichiers et SEP fusionne/segmente par tags (clés '#tag=…'),
    # mais l'ensemble des paires doit être identique. Une lecture
    # silencieusement partielle reste détectée.
    json_nodes = len(dump_json.get('nodes') or {})
    json_node_names = {
        node_id: (node.get('name') or node_id)
        for node_id, node in (dump_json.get('nodes') or {}).items()
    }
    json_pairs = {
        (json_node_names.get(link.get('idSource'), link.get('idSource')),
         json_node_names.get(link.get('idTarget'), link.get('idTarget')))
        for link in (dump_json.get('links') or {}).values()
    }
    sep_nodes = len(io.sankey.nodes)
    sep_pairs = {(f.orig.name, f.dest.name) for f in io.sankey.flux.values()}
    assert sep_nodes == json_nodes, (
        f"{source_rel} : SEP voit {sep_nodes} nœuds, le dump TS en déclare {json_nodes}")
    assert sep_pairs == json_pairs, (
        f"{source_rel} : paires source→cible différentes — "
        f"JSON-SEP : {sorted(json_pairs - sep_pairs)[:5]} ; SEP-JSON : {sorted(sep_pairs - json_pairs)[:5]}")


@pytest.mark.parametrize(
    'dump_name,source_rel',
    [(d, s) for d, s in _dump_cases() if s.startswith('current-fmt1/')],
)
def test_semantique_croisee_sur_les_fichiers_python_ecrits(dump_name, source_rel):
    """Pour les fichiers ÉCRITS par SEP (current-fmt1), la boucle complète
    Python-écrit → TS-lu → TS-écrit → Python-lu doit conserver la structure
    vue par SEP (mêmes nœuds et mêmes flux, par nom)."""
    io_orig = IOJson()
    ok, msg = io_orig.load_sankey(os.path.join(CORPUS_DIR, source_rel))
    assert ok, f"SEP ne relit pas son propre fichier {source_rel} : {msg}"

    io_ts = IOJson()
    ok, msg = io_ts.load_sankey(os.path.join(CROSS_DIR, dump_name))
    assert ok, f"SEP ne lit pas le dump TS de {source_rel} : {msg}"

    assert sorted(io_ts.sankey.nodes.keys()) == sorted(io_orig.sankey.nodes.keys()), (
        f"{source_rel} : ensembles de nœuds différents après passage par TS")
    pairs_ts = {(f.orig.name, f.dest.name) for f in io_ts.sankey.flux.values()}
    pairs_orig = {(f.orig.name, f.dest.name) for f in io_orig.sankey.flux.values()}
    assert pairs_ts == pairs_orig, (
        f"{source_rel} : paires de flux différentes après passage par TS — "
        f"orig-ts : {sorted(pairs_orig - pairs_ts)[:5]} ; ts-orig : {sorted(pairs_ts - pairs_orig)[:5]}")
