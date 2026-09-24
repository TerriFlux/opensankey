"""
Familles d'échec de lecture d'un fichier : nommer la cause, pas seulement l'échec.

Jusqu'ici tout échec de `load_sankey` repartait en `BAD_DATA`, dont le message
(« vérifiez le fichier d'entrée : valeurs manquantes ou mal formées ») envoie
chercher une cellule fautive. C'est un contresens pour le cas le plus fréquent
en production — un tableur ordinaire, sans aucun onglet au format attendu : il
n'y a pas de cellule à corriger, il faut repartir d'un classeur d'exemple.

Les phrases testées ici sont des constantes ANGLAISES de SankeyExcelParser
(io_base.load_sankey, sankey_pandas._checkNeededSheets) : c'est le contrat que
`load_failure_code` observe. Si l'une d'elles change là-bas, ce test tombe, et
la classification retombe sur BAD_DATA — un message vague, jamais une erreur.
"""

from opensankey.server.views import (
    PROCESS_ERROR_BAD_DATA,
    PROCESS_ERROR_MISSING_COLUMN,
    PROCESS_ERROR_SHEETS_UNKNOWN,
    load_failure_code,
)


def test_aucun_onglet_au_format_attendu():
    assert load_failure_code("No sheets to parse.") == PROCESS_ERROR_SHEETS_UNKNOWN
    assert load_failure_code(
        "Not enough sheets. To create the Sankey, we need at least one of theses sheets: \n"
        "data, nodes\n"
    ) == PROCESS_ERROR_SHEETS_UNKNOWN


def test_onglet_present_mais_colonne_manquante():
    assert load_failure_code(
        'Error on sheet Noeuds (nodes) : The "node" column is missing or does not have the right name.'
    ) == PROCESS_ERROR_MISSING_COLUMN
    assert load_failure_code(
        "Error on sheet Table entrées-sorties (input_output) : Did not found the column"
    ) == PROCESS_ERROR_MISSING_COLUMN


def test_tout_le_reste_reste_bad_data():
    assert load_failure_code(
        "Error on sheet Données (data) : 1 flux non trouvé(s) dans les onglets de base"
    ) == PROCESS_ERROR_BAD_DATA
    assert load_failure_code("") == PROCESS_ERROR_BAD_DATA
    assert load_failure_code(None) == PROCESS_ERROR_BAD_DATA
