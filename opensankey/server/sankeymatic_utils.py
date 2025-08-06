"""
==================================================================================================
The MIT License (MIT)
==================================================================================================
Copyright (c) 2025 TerriFlux

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
"""

# coding: utf-8

# ---------------------------------------------------------------

from typing import List
import re
import random


def parse_setting_line_size(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract stting of background size

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "w":
        obj["size_width"] = lst[1]
    elif lst[0] == "h":
        obj["size_height"] = lst[1]


def parse_setting_line_margin(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract stting of background margin

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "l":
        obj["margin_left"] = lst[1]
    elif lst[0] == "r":
        obj["margin_right"] = lst[1]
    elif lst[0] == "t":
        obj["margin_top"] = lst[1]
    elif lst[0] == "b":
        obj["margin_bottom"] = lst[1]


def parse_setting_line_bg(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract stting of background

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "color":
        obj["bg_color"] = lst[1]
    elif lst[0] == "transparent":
        obj["bg_transparent"] = lst[1]


def parse_setting_line_node(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract setting of node general attributes

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "color":
        obj["node_color"] = lst[1]
    elif lst[0] == "w":
        obj["node_width"] = lst[1]
    elif lst[0] == "h":
        obj["node_height"] = lst[1]
    elif lst[0] == "spacing":
        obj["node_spacing"] = lst[1]
    elif lst[0] == "border":
        obj["node_border"] = lst[1]
    elif lst[0] == "theme":
        obj["node_theme"] = lst[1]
    elif lst[0] == "opacity":
        obj["node_opacity"] = lst[1]


def parse_setting_line_flow(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract setting of flow general attributes

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "color":
        obj["flow_color"] = lst[1]
    elif lst[0] == "inheritfrom":
        obj["flow_inheritfrom"] = lst[1]
    elif lst[0] == "opacity":
        obj["flow_opacity"] = lst[1]
    elif lst[0] == "curvature":
        obj["flow_curvature"] = lst[1]


def parse_setting_line_layout(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract setting of layout attributes

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "order":
        obj["layout_order"] = lst[1]
    elif lst[0] == "justifyorigins":
        obj["layout_justifyorigins"] = lst[1]
    elif lst[0] == "justifyends":
        obj["layout_justifyends"] = lst[1]
    elif lst[0] == "reversegraph":
        obj["layout_reversegraph"] = lst[1]
    elif lst[0] == "attachincompletesto":
        obj["layout_attachincompletesto"] = lst[1]


def parse_setting_line_labels(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract setting of label attributes

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "color":
        obj["labels_color"] = lst[1]
    elif lst[0] == "hide":
        obj["labels_hide"] = lst[1]
    elif lst[0] == "highlight":
        obj["labels_highlight"] = lst[1]
    elif lst[0] == "fontface":
        obj["labels_fontface"] = lst[1]
    elif lst[0] == "linespacing":
        obj["labels_linespacing"] = lst[1]
    elif lst[0] == "relativesize":
        obj["labels_relativesize"] = lst[1]
    elif lst[0] == "magnify":
        obj["labels_magnify"] = lst[1]


def parse_setting_line_label_name(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract setting of label name

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "appears":
        obj["label_name_appears"] = lst[1]
    elif lst[0] == "size":
        obj["label_name_size"] = lst[1]
    elif lst[0] == "weight":
        obj["label_name_weight"] = lst[1]


def parse_setting_line_label_value(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract setting of label value

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "appears":
        obj["label_value_appears"] = lst[1]
    elif lst[0] == "fullprecision":
        obj["label_value_fullprecision"] = lst[1]
    elif lst[0] == "position":
        obj["label_value_position"] = lst[1]
    elif lst[0] == "weight":
        obj["label_value_weight"] = lst[1]


def parse_setting_line_label_position(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract setting of label position

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "autoalign":
        obj["label_position_autoalign"] = lst[1]
    elif lst[0] == "scheme":
        obj["label_position_scheme"] = lst[1]
    elif lst[0] == "first":
        obj["label_position_first"] = lst[1]
    elif lst[0] == "breakpoint":
        obj["label_position_breakpoint"] = lst[1]


def parse_setting_line_value(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract setting of value

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "format":
        obj["value_format"] = lst[1]
    elif lst[0] == "prefix":
        obj["value_prefix"] = lst[1] if len(lst) == 2 else ""
    elif lst[0] == "suffix":
        obj["value_suffix"] = lst[1] if len(lst) == 2 else ""


def parse_setting_line_themeoffset(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract setting of theme

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "a":
        obj["theme_a"] = lst[1]
    elif lst[0] == "b":
        obj["theme_b"] = lst[1]
    elif lst[0] == "c":
        obj["theme_c"] = lst[1]
    elif lst[0] == "d":
        obj["theme_d"] = lst[1]


def parse_setting_line_meta(lst: list, obj: dict):
    """
    Extract setting from a sankeymatic formatted text,
    we extract setting of meta

    Parameters
    ----------

    lines : list[string]
        text splitted by blank space
    obj : dict
        dict where we set setting attributes

    Returns
    -------
    - Nothing, it modify obj passed in parametter
    """
    if lst[0] == "mentionsankeymatic":
        obj["meta_mentionsankeymatic"] = lst[1]
    elif lst[0] == "listimbalances":
        obj["meta_listimbalances"] = lst[1]


def normalizeStringToValidId(text: str):
    """
    Normalize a text so we can use it as an id in front application

    Parameters
    ----------
    text : string
        text to noramlize

    Returns
    -------
      text normalised (withnon alphanumeric caracter replaced by '_')
    """
    return "id_" + re.sub("[^0-9a-zA-Z]+", "_", text)


def create_json_node(id: str, name: str):
    """
    Create a default node given a name

    Parameters
    ----------
    name : string
        name of node, it will also be used to create an id for the node

    Returns
    -------
      json object formatted to be a node in a the front application
    """
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
        "input_value": 0,  # Var not used in OS but used here to compute sankey scale
        "output_value": 0,  # Var not used in OS but used here to compute sankey scale
    }


def randomId(length: int = 5):
    result = ""
    characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    charactersLength = len(characters)
    counter = 0
    while counter < length:
        result += characters[random.randint(0, charactersLength - 1)]
        counter += 1

    return result


def create_json_flow(org_id: str, dest_id: str, value: str, color: str):
    """
    Create a default flow given a node origin id & node destination id

    Parameters
    ----------
    org_id : string
        id of node source
    dest_id : string
        id of node destination

    Returns
    -------
      json object formatted to be a node in a the front application
    """
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
        node_val = (
            node["input_value"]
            if node["input_value"] > node["output_value"]
            else node["output_value"]
        )
        col_val += node_val
    return col_val


def generate_hexa_color():
    def r():
        return random.randint(0, 255)

    return "#%02X%02X%02X" % (r(), r(), r())


def sort_nodeIO(node: dict):
    return node["y"]
