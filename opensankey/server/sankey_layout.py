"""
==================================================================================================
The MIT License (MIT)
==================================================================================================
Copyright (c) 2026 TerriFlux

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
==================================================================================================
Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
==================================================================================================

Helpers de construction de diagramme Sankey (JSON front) et calcul de positions
en colonnes. Module neutre : historiquement issu du convertisseur SankeyMATIC,
il ne sert plus qu'à l'import STAN (stan_smfa.py) depuis que le parsing
SankeyMATIC est passé 100 % côté front (client/src/Persistence/sankeymaticParser.ts).

computeSankeyPosition est un portage (simplifié) de `build/sankey.js` de
SankeyMATIC — https://github.com/nowthis/sankeymatic — Copyright (c) 2014-2024,
Steve Bogart <sbogart@sankeymatic.com>, distribué sous licence ISC :

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
    MERCHANTABILITY AND FITNESS.

    IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING
    FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
    NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION
    WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

Cf. THIRD-PARTY-NOTICES.md à la racine du dépôt.
"""

# coding: utf-8

import re
import random
from typing import List, Dict


# ------------------------------------------------------------- Helpers JSON

def normalizeStringToValidId(text: str):
    """Normalise un texte pour servir d'id front (non alphanumérique -> '_')."""
    return "id_" + re.sub("[^0-9a-zA-Z]+", "_", text)


def randomId(length: int = 5):
    result = ""
    characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    charactersLength = len(characters)
    counter = 0
    while counter < length:
        result += characters[random.randint(0, charactersLength - 1)]
        counter += 1
    return result


def create_json_node(id: str, name: str):
    """Crée un nœud au format JSON attendu par le front."""
    return {
        "id": id,
        "name": name,
        "svg_parent_group": "g_nodes",
        "x": 0,
        "y": 0,
        "u": 0,
        "v": 0,
        "style": "default",
        "local": {},
        "tags": {},
        "dimensions": {},
        "inputLinksId": [],
        "outputLinksId": [],
        "links_order": [],
        "input_value": 0,   # non utilisé côté OS, sert ici au calcul d'échelle
        "output_value": 0,  # non utilisé côté OS, sert ici au calcul d'échelle
    }


def create_json_flow(org_id: str, dest_id: str, value: str, color: str):
    """Crée un flux au format JSON attendu par le front."""
    flow = {
        "id": org_id + "-->" + dest_id + "_" + randomId(),
        "is_visible": True,
        "svg_parent_group": "g_links",
        "idSource": org_id,
        "idTarget": dest_id,
        "style": "default",
        "local": {},
        "displaying_order": 0,
        "tooltip_text": "",
        "value": {
            "id": org_id + dest_id + "_" + randomId(),
            "data_value": float(value),
            "tags": {},
        },
    }
    if color is not None:
        flow["local"]["color"] = color
    return flow


def sum_node_value_from_list_node_dict(nodes: List[dict]):
    col_val = 0
    for node in nodes:
        node_val = node["input_value"] if node["input_value"] > node["output_value"] else node["output_value"]
        col_val += node_val
    return col_val


def generate_hexa_color():
    def r():
        return random.randint(0, 255)
    return "#%02X%02X%02X" % (r(), r(), r())


# ------------------------------------------------------- Calcul de positions

def computeHorizontalIndex(
    node: dict,
    nodes: dict,
    links: dict,
    starting_index: int,
    visited_nodes_ids: List[str],
    horizontal_indexes_per_nodes_ids: Dict[str, int],
):
    # Update node index
    if node["id"] not in horizontal_indexes_per_nodes_ids:
        horizontal_indexes_per_nodes_ids[node["id"]] = starting_index
    else:
        if starting_index > horizontal_indexes_per_nodes_ids[node["id"]]:
            horizontal_indexes_per_nodes_ids[node["id"]] = starting_index

    # From current node, use output links to recurse on following node
    for link in node["outputLinksId"]:
        next_node = nodes[links[link]["idTarget"]]
        if next_node["id"] not in visited_nodes_ids:
            new_visited_nodes_ids = visited_nodes_ids.copy()
            new_visited_nodes_ids.append(node["id"])
            computeHorizontalIndex(
                next_node,
                nodes,
                links,
                starting_index + 1,
                new_visited_nodes_ids,
                horizontal_indexes_per_nodes_ids,
            )


def computeSankeyPosition(nodes: dict, links: dict, setting: dict):
    """
    Positionne les nœuds en colonnes et renvoie l'échelle (user_scale) du front.

    Parameters
    ----------
    nodes : dict
        dict de tous les nœuds
    links : dict
        dict de tous les flux
    setting : dict
        paramètres de placement (tailles, marges, labels…)

    Returns
    -------
    - DA_scale : number
    """
    label_pos_autoalign = float(setting["label_position_autoalign"])
    label_pos_scheme = setting["label_position_scheme"]
    label_pos_breakpoint = float(setting["label_position_breakpoint"])
    label_pos_first = setting["label_position_first"]
    label_linespaceing = float(setting["labels_linespacing"])
    baseLabelSize = float(setting["label_name_size"])
    relativeLAbelSize = float(setting["labels_relativesize"])
    fontSize = baseLabelSize * (relativeLAbelSize / 100)
    flowInheritance = setting["flow_inheritfrom"]
    DA_height = float(setting["size_height"])
    DA_margin_top = float(setting["margin_top"])
    DA_margin_bottom = float(setting["margin_bottom"])
    node_height = float(setting["node_height"])

    # Compute positionning indexes
    horizontal_indexes_per_nodes_ids = {}
    for k, node in nodes.items():
        if len(node["inputLinksId"]) == 0 and len(node["outputLinksId"]) > 0:
            starting_index = 0
            computeHorizontalIndex(node, nodes, links, starting_index, [], horizontal_indexes_per_nodes_ids)
        else:
            if len(node["inputLinksId"]) == 0 and len(node["outputLinksId"]) == 0:
                horizontal_indexes_per_nodes_ids[node["id"]] = 0

    max_horizontal_index = 0
    nodes_per_horizontal_indexes: Dict[int, List[str]] = {}
    for k, node in nodes.items():
        node_index = horizontal_indexes_per_nodes_ids[node["id"]]
        if node_index not in nodes_per_horizontal_indexes:
            nodes_per_horizontal_indexes[node_index] = []
        nodes_per_horizontal_indexes[node_index].append(nodes[node["id"]])
        if node_index > max_horizontal_index:
            max_horizontal_index = node_index

    # Nœuds sans entrée : les coller à la colonne du plus proche voisin de sortie
    for horizontal_index in range(max_horizontal_index):
        if not nodes_per_horizontal_indexes[horizontal_index]:
            continue
        to_splice: List[str] = []
        for node in nodes_per_horizontal_indexes[horizontal_index]:
            if len(node["inputLinksId"]) == 0:
                min_next_horizontal_index = max_horizontal_index + 1
                for link_id in node["outputLinksId"]:
                    target_node = nodes[links[link_id]["idTarget"]]
                    if target_node is None:
                        return
                    if (
                        horizontal_indexes_per_nodes_ids[target_node["id"]]
                        < horizontal_indexes_per_nodes_ids[node["id"]]
                    ):
                        return
                    if horizontal_indexes_per_nodes_ids[target_node["id"]] < min_next_horizontal_index:
                        min_next_horizontal_index = horizontal_indexes_per_nodes_ids[target_node["id"]]

                if horizontal_indexes_per_nodes_ids[node["id"]] < min_next_horizontal_index - 1:
                    to_splice.append(node)
                    horizontal_indexes_per_nodes_ids[node["id"]] = min_next_horizontal_index - 1
                    if not nodes_per_horizontal_indexes[min_next_horizontal_index - 1]:
                        nodes_per_horizontal_indexes[min_next_horizontal_index - 1] = []
                    nodes_per_horizontal_indexes[min_next_horizontal_index - 1].append(node)

        for node in to_splice:
            nodes_per_horizontal_indexes[horizontal_index].remove(node)

    node_max_value = 0
    for k, v in nodes.items():
        if v["output_value"] > node_max_value:
            node_max_value = v["output_value"]
        if v["input_value"] > node_max_value:
            node_max_value = v["input_value"]

    max_val_col = 0
    for k, nodes_list in nodes_per_horizontal_indexes.items():
        col_val = sum_node_value_from_list_node_dict(nodes_list)
        max_val_col = col_val if col_val > max_val_col else max_val_col

    node_spacing = float(setting["node_spacing"]) / 100
    greatestNodeCount = max([len(v) for k, v in nodes_per_horizontal_indexes.items()])
    vert_space = DA_height - DA_margin_top - DA_margin_bottom
    allAvailablePadding = max(2, vert_space - greatestNodeCount)
    maximumNodeSpacing = ((1 - node_height / 100) * allAvailablePadding) / (greatestNodeCount - 1)
    actualNodeSpacing = maximumNodeSpacing * node_spacing

    ky = min(
        [
            (vert_space - (len(v) - 1) * maximumNodeSpacing) / sum_node_value_from_list_node_dict(v)
            for k, v in nodes_per_horizontal_indexes.items()
        ]
    )
    DA_scale = node_max_value / (node_max_value * ky)
    length_of_horiz_index = len(nodes_per_horizontal_indexes.items())
    stagesMidpoint = (length_of_horiz_index - 1) / 2
    horizontal_col_shift = float(setting["size_width"]) / length_of_horiz_index

    first_stage = "left" if label_pos_first == "before" else "right"
    opposite_stage = "left" if first_stage == "right" else "left"

    height_cumul_per_indexes = [(len(v) - 1) * actualNodeSpacing for k, v in nodes_per_horizontal_indexes.items()]
    max_height_cumul = max(height_cumul_per_indexes)
    for k, ndes_list in nodes_per_horizontal_indexes.items():
        x_shift = (k + 1) * horizontal_col_shift

        uniqueSrc = [node["inputLinksId"] for node in ndes_list]
        n_set = set([x for xs in uniqueSrc for x in xs])
        uniqueSrc = list(n_set)
        uniqueNodesInPrevCol = [nodes[links[idLink]["idSource"]] for idLink in uniqueSrc]
        if len(uniqueNodesInPrevCol) > 0:
            y_shift = min([node["y"] for node in uniqueNodesInPrevCol]) - (height_cumul_per_indexes[k] / 2)
        else:
            y_shift = actualNodeSpacing + (max_height_cumul - height_cumul_per_indexes[k]) / 2

        for node in ndes_list:
            node["x"] = x_shift
            node["y"] = y_shift
            y_shift += (max(node["input_value"], node["output_value"]) / DA_scale) + actualNodeSpacing
            node["local"]["label_vert"] = "middle"
            node["local"]["label_vert_valeur"] = "middle"

            if label_pos_scheme == "auto":
                if len(node["inputLinksId"]) == 0:
                    node["local"]["label_horiz"] = "left"
                    node["local"]["label_horiz_valeur"] = "left"
                elif len(node["outputLinksId"]) == 0:
                    node["local"]["label_horiz"] = "right"
                    node["local"]["label_horiz_valeur"] = "right"
                else:
                    if label_pos_autoalign == -1:
                        node["local"]["label_horiz"] = "left"
                        node["local"]["label_horiz_valeur"] = "left"
                    elif label_pos_autoalign == 0:
                        node["local"]["label_horiz"] = "middle"
                        node["local"]["label_horiz_valeur"] = "middle"
                    elif label_pos_autoalign == 1:
                        node["local"]["label_horiz"] = "right"
                        node["local"]["label_horiz_valeur"] = "right"
            elif label_pos_scheme == "per_stage":
                if ((k + 1) < label_pos_breakpoint) or (label_pos_breakpoint == 5):
                    node["local"]["label_horiz"] = first_stage
                    node["local"]["label_vert_valeur"] = first_stage
                elif (k + 1) >= label_pos_breakpoint:
                    node["local"]["label_horiz"] = opposite_stage
                    node["local"]["label_vert_valeur"] = opposite_stage

    for k, node in nodes.items():
        node["local"]["value_label_vert_shift"] = fontSize + (fontSize * label_linespaceing)
        if "color" not in node["local"]:
            node["local"]["color"] = generate_hexa_color()
        if setting["layout_order"] == "automatic":
            node["inputLinksId"].sort(reverse=False, key=lambda k: nodes[links[k]["idSource"]]["y"])
            node["outputLinksId"].sort(key=lambda k: nodes[links[k]["idTarget"]]["y"])
            node["links_order"] = node["inputLinksId"] + node["outputLinksId"]

    for k, link in links.items():
        if "color" not in link["local"]:
            if flowInheritance == "source":
                link["local"]["color"] = nodes[link["idSource"]]["local"]["color"]
            elif flowInheritance == "target":
                link["local"]["color"] = nodes[link["idTarget"]]["local"]["color"]
            elif flowInheritance == "outside-in":
                flowMidpoint = (
                    horizontal_indexes_per_nodes_ids[link["idSource"]]
                    + horizontal_indexes_per_nodes_ids[link["idTarget"]]
                ) / 2
                sourceColor = nodes[link["idSource"]]["local"]["color"]
                lMidInftoStageMid = flowMidpoint <= stagesMidpoint
                link["local"]["color"] = sourceColor if lMidInftoStageMid else nodes[link["idTarget"]]["local"]["color"]

    return DA_scale * 100
