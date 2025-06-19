
'''
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
'''

# coding: utf-8

# ---------------------------------------------------------------
import re
from typing import List, Dict
try:
    from . import sankeymatic_utils
except Exception:
    try:
        import sankeymatic_utils
    except Exception:
        pass


# Expression régulière pour extraire les nœuds, les flux et les couleurs
orig_pattern = re.compile(r'.+\[')
dest_pattern = re.compile(r'\].+')
value_pattern = re.compile(r'\[[\d*\.]+\]')
flow_pattern = re.compile(r'.+\[[\d*\.]+\].+')


color_pattern = re.compile(r'^:.+#[A-Za-z0-9]+\s{0,1}<{0,2}')
color_node_pattern = re.compile(r'^:.+#')
color_hexa_pattern = re.compile(r'#[A-Za-z0-9]+\s{0,1}<{0,2}')


def computeHorizontalIndex(
    node: dict,
    nodes: dict,
    links: dict,
    starting_index: int,
    visited_nodes_ids: List[str],
    horizontal_indexes_per_nodes_ids: Dict[str, int]
):
    # Update node index
    if (node['id'] not in horizontal_indexes_per_nodes_ids):
        horizontal_indexes_per_nodes_ids[node['id']] = starting_index
    else:
        if (starting_index > horizontal_indexes_per_nodes_ids[node['id']]):
            horizontal_indexes_per_nodes_ids[node['id']] = starting_index

    # From current node, use output links to
    # recurse on following node
    for link in node['outputLinksId']:
        # Next node to recurse on
        next_node = nodes[links[link]['idTarget']]
        # But first we check if next node has not been already visited
        if (not next_node['id'] in visited_nodes_ids):
            new_visited_nodes_ids = visited_nodes_ids.copy()
            new_visited_nodes_ids.append(node['id'])
            # Recursive calling
            computeHorizontalIndex(
                next_node,
                nodes,
                links,
                starting_index + 1,
                new_visited_nodes_ids,
                horizontal_indexes_per_nodes_ids
            )


def computeSankeyPosition(nodes: dict, links: dict, setting: dict):
    """
    Compute node position by sorting them in column

    Parameters
    ----------
    nodes : dict
        dict containing all nodes of sankey
    links : dict
        dict containing all flows of sankey
    setting : dict
        dict containing parameter used to compute position

    Returns
    -------
    - DA_scale : number
        scale of sankey used in front application
    """

    # Some var from setting
    label_pos_autoalign = float(setting['label_position_autoalign'])
    label_pos_scheme = setting['label_position_scheme']
    label_pos_breakpoint = float(setting['label_position_breakpoint'])
    label_pos_first = setting['label_position_first']
    label_linespaceing = float(setting['labels_linespacing'])
    baseLabelSize = float(setting['label_name_size'])
    relativeLAbelSize = float(setting['labels_relativesize'])
    fontSize = baseLabelSize * (100 / relativeLAbelSize)
    flowInheritance = setting['flow_inheritfrom']
    DA_height = float(setting['size_height'])
    DA_margin_top = float(setting['margin_top'])
    DA_margin_bottom = float(setting['margin_bottom'])
    node_height = float(setting['node_height'])

    # Compute positionning indexes
    horizontal_indexes_per_nodes_ids = {}
    for k, node in nodes.items():
        if (len(node['inputLinksId']) == 0 and len(node['outputLinksId']) > 0):
            # get current node horizontal index (eg longest branch length)
            starting_index = 0
            computeHorizontalIndex(
                node,
                nodes,
                links,
                starting_index,
                [],
                horizontal_indexes_per_nodes_ids
            )

        else:
            # Lone node case
            if (len(node['inputLinksId']) == 0 and
                    len(node['outputLinksId']) == 0):
                horizontal_indexes_per_nodes_ids[node['id']] = 0

    # Use results from previous index computing
    # TODO : maybe possible to speed up here overall computing with getting
    #        max_horizontal_index and nodes_per_horizontal_indexes
    #  from another loop
    max_horizontal_index = 0
    nodes_per_horizontal_indexes: Dict[int, List[str]] = {}
    for k, node in nodes.items():
        # Previously computed index for given node
        node_index = horizontal_indexes_per_nodes_ids[node['id']]
        # Update reversed dict index-> nodes
        if (node_index not in nodes_per_horizontal_indexes):
            nodes_per_horizontal_indexes[node_index] = []

        nodes_per_horizontal_indexes[node_index].append(nodes[node['id']])
        # Update max horizontal index
        if (node_index > max_horizontal_index):
            max_horizontal_index = node_index

    # for the node which have no input links they
    # should stick to the next output node and
    # have an horizontal index equal to output node horizontal index minus one
    for horizontal_index in range(max_horizontal_index):
        # Pass if no nodes for this horizontal_index
        # TODO : if it is the case -> something was wrong before
        if (not nodes_per_horizontal_indexes[horizontal_index]):
            continue
        to_splice: List[str] = []
        for node in nodes_per_horizontal_indexes[horizontal_index]:
            if (len(node['inputLinksId']) == 0):
                min_next_horizontal_index = max_horizontal_index + 1
                for link_id in node['outputLinksId']:

                    target_node = nodes[links[link_id]['idTarget']]
                    if target_node is None:
                        return

                    if (horizontal_indexes_per_nodes_ids[target_node['id']] <
                            horizontal_indexes_per_nodes_ids[node['id']]):
                        return

                    if (horizontal_indexes_per_nodes_ids[target_node['id']] <
                            min_next_horizontal_index):
                        min_next_horizontal_index = \
                            horizontal_indexes_per_nodes_ids[
                                target_node['id']]

                if (horizontal_indexes_per_nodes_ids[node['id']] <
                        min_next_horizontal_index - 1):
                    to_splice.append(node)
                    # Il semblerait que dans certains cas nodes2horizontal_indices
                    #  de certains noeuds peuvent devenir négatif
                    # ce qui lors de l'affectation difference'une position x, ceux-ci sont négatif
                    horizontal_indexes_per_nodes_ids[node['id']
                                                     ] = min_next_horizontal_index - 1
                    if (not nodes_per_horizontal_indexes[min_next_horizontal_index - 1]):
                        nodes_per_horizontal_indexes[min_next_horizontal_index - 1] = []

                    nodes_per_horizontal_indexes[min_next_horizontal_index - 1].append(
                        node)

        for node in to_splice:
            nodes_per_horizontal_indexes[horizontal_index].remove(node)

    node_max_value = 0
    # After parsing all flow compute scale
    for k, v in nodes.items():
        if (v['output_value'] > node_max_value):
            node_max_value = v['output_value']
        if (v['input_value'] > node_max_value):
            node_max_value = v['input_value']

    max_val_col = 0
    # compute Value per column
    for k, nodes_list in nodes_per_horizontal_indexes.items():
        col_val = sankeymatic_utils.sum_node_value_from_list_node_dict(
            nodes_list)
        # Update max col value if current col has bigger balue
        max_val_col = col_val if col_val > max_val_col else max_val_col

    # To compute DA scale use processed var from open source sankeymatic code
    node_spacing = float(setting['node_spacing']) / 100
    greatestNodeCount = max([len(v)
                            for k, v in nodes_per_horizontal_indexes.items()])
    vert_space = DA_height - DA_margin_top - DA_margin_bottom
    allAvailablePadding = max(2, vert_space - greatestNodeCount)
    maximumNodeSpacing = ((1 - node_height / 100) *
                          allAvailablePadding) / (greatestNodeCount - 1)
    actualNodeSpacing = maximumNodeSpacing * node_spacing

    ky = min([(vert_space - (len(v) - 1) * maximumNodeSpacing) /
             sankeymatic_utils.sum_node_value_from_list_node_dict(v)
              for k, v in nodes_per_horizontal_indexes.items()])
    DA_scale = node_max_value / (node_max_value * ky)
    length_of_horiz_index = len(nodes_per_horizontal_indexes.items())
    stagesMidpoint = (length_of_horiz_index - 1) / 2
    horizontal_col_shift = float(
        setting['size_width']) / length_of_horiz_index

    # var for node label pos if label_pos_scheme is per_stage
    first_stage = 'left' if label_pos_first == 'before' else 'right'
    opposite_stage = 'left' if first_stage == 'right' else 'left'

    # Column height (sum of node height of the col)
    height_cumul_per_indexes = [(len(v) - 1) * actualNodeSpacing
                                for k, v in nodes_per_horizontal_indexes.items()]
    # Tallest colmun height
    max_height_cumul = max(height_cumul_per_indexes)
    # Place node according the horizontal index
    for k, ndes_list in nodes_per_horizontal_indexes.items():
        x_shift = (k + 1) * horizontal_col_shift

        # Compute starting y_shift
        uniqueSrc = [node['inputLinksId'] for node in ndes_list]
        n_set = set([x for xs in uniqueSrc for x in xs])
        uniqueSrc = list(n_set)
        uniqueNodesInPrevCol = [nodes[links[idLink]['idSource']]
                                for idLink in uniqueSrc]
        if (len(uniqueNodesInPrevCol) > 0):
            y_shift = min([node['y'] for node in uniqueNodesInPrevCol]
                          ) - (height_cumul_per_indexes[k] / 2)
        else:
            y_shift = actualNodeSpacing + \
                (max_height_cumul - height_cumul_per_indexes[k]) / 2

        for node in ndes_list:
            node['x'] = x_shift
            node['y'] = y_shift
            # Update y_shift for next node in col
            y_shift += (max(node["input_value"],
                        node["output_value"]) / DA_scale) + actualNodeSpacing
            # Set label position
            node['local']['label_vert'] = 'middle'
            node['local']['label_vert_valeur'] = 'middle'

            if (label_pos_scheme == 'auto'):
                if (len(node['inputLinksId']) == 0):
                    node['local']['label_horiz'] = 'left'
                    node['local']['label_horiz_valeur'] = 'left'
                elif (len(node['outputLinksId']) == 0):
                    node['local']['label_horiz'] = 'right'
                    node['local']['label_horiz_valeur'] = 'right'
                else:
                    if (label_pos_autoalign == -1):
                        node['local']['label_horiz'] = 'left'
                        node['local']['label_horiz_valeur'] = 'left'
                    elif (label_pos_autoalign == 0):
                        node['local']['label_horiz'] = 'middle'
                        node['local']['label_horiz_valeur'] = 'middle'
                    elif (label_pos_autoalign == 1):
                        node['local']['label_horiz'] = 'right'
                        node['local']['label_horiz_valeur'] = 'right'
            elif (label_pos_scheme == 'per_stage'):
                if (((k + 1) < label_pos_breakpoint) or
                        (label_pos_breakpoint == 5)):
                    node['local']['label_horiz'] = first_stage
                    node['local']['label_vert_valeur'] = first_stage
                elif ((k + 1) >= label_pos_breakpoint):
                    node['local']['label_horiz'] = opposite_stage
                    node['local']['label_vert_valeur'] = opposite_stage

    # Go throught all node & set some var
    for k, node in nodes.items():
        node['local']['value_label_vert_shift'] = fontSize + \
            (fontSize * label_linespaceing)
        # Set random color to node if they haven't one define in sankeymatic file
        if ('color' not in node['local']):
            node['local']['color'] = sankeymatic_utils.generate_hexa_color()
        # Reorganize node IO links if setting var is at true
        if (setting['layout_order'] == 'automatic'):
            node['inputLinksId'].sort(
                reverse=False, key=lambda k: nodes[links[k]['idSource']]['y'])
            node['outputLinksId'].sort(
                key=lambda k: nodes[links[k]['idTarget']]['y'])
            node['links_order'] = node['inputLinksId'] + node['outputLinksId']

    # If link doesn't have a color defined in source file
    # then color of link depend of node source/target
    for k, link in links.items():
        if ('color' not in link['local']):
            if (flowInheritance == 'source'):
                link['local']['color'] = nodes[link['idSource']]['local']['color']
            elif (flowInheritance == 'target'):
                link['local']['color'] = nodes[link['idTarget']]['local']['color']
            elif (flowInheritance == 'outside-in'):
                flowMidpoint = (
                    horizontal_indexes_per_nodes_ids[link['idSource']] +
                    horizontal_indexes_per_nodes_ids[link['idTarget']]) / 2
                sourceColor = nodes[link['idSource']]['local']['color']
                lMidInftoStageMid = flowMidpoint <= stagesMidpoint
                link['local']['color'] = sourceColor if lMidInftoStageMid else nodes[link['idTarget']]['local']['color']

    return DA_scale * 100


def parse_sankeymatic_file(filename: str):
    """
    Open & parse a sankeymatic file

    Parameters
    ----------
    filename : string
        input sankeymatic file name (with full path)

    Returns
    -------
    - True , dict of node, flows & other parameters when file exist
    - False , None when file doesn't exist
    """
    with open(filename, 'r') as f:
        return True, None, parse_sankeymatic_text(f.read())
    return False, 'Error at sankeymatic file opening', None


def parse_sankeymatic_text(lines: str):
    """
    Extract data from a sankeymatic formatted text,
    we extract nodes, flows & general setting and return them in a dict

    Parameters
    ----------
    lines : string
        text formatted to sankeymatic format

    Returns
    -------
    {
        'nodes': dict of node with color associated to them if there is,
        'flows':dict of flow with source, target & value
        'setting': dict containing general parametter from sankeymatic
    }
    """

    # Dictionnaire pour stocker les nœuds et leurs attributs
    nodes = {}
    links = {}
    setting = {'size_width': '1000',
               'size_height': '600',
               'margin_left': '0',
               'margin_right': '0',
               'margin_top': '0',
               'margin_bottom': '0',
               'bg_color': '#ce2222',
               'bg_transparent': 'N',
               'node_width': '20',
               'node_height': '50',
               'node_spacing': '50',
               'node_border': '0',
               'node_theme': 'none',
               'node_color': '#888888',
               'node_opacity': '1',
               'flow_curvature': '0.5',
               'flow_inheritfrom': 'outside-in',
               'flow_color': '#999999',
               'flow_opacity': '0.45',
               'layout_order': 'automatic',
               'layout_justifyorigins': 'N',
               'layout_justifyends': 'N',
               'layout_reversegraph': 'N',
               'layout_attachincompletesto': 'nearest',
               'labels_color': '#000000',
               'labels_hide': 'N',
               'labels_highlight': '0.8',
               'labels_fontface': 'sans-serif',
               'labels_linespacing': '0.2',
               'labels_relativesize': '100',
               'labels_magnify': '120',
               'label_name_appears': 'Y',
               'label_name_size': '25',
               'label_name_weight': '400',
               'label_value_appears': 'Y',
               'label_value_fullprecision': 'Y',
               'label_value_position': 'below',
               'label_value_weight': '400',
               'label_position_autoalign': '0',
               'label_position_scheme': 'auto',
               'label_position_first': 'before',
               'label_position_breakpoint': '3',
               'value_format': '",."',
               'value_prefix': '',
               'value_suffix': '',
               'theme_a': '5',
               'theme_b': '9',
               'theme_c': '0',
               'theme_d': '0',
               'meta_mentionsankeymatic': 'Y',
               'meta_listimbalances': 'Y'}

    # Netoyage
    lines_cleared = lines.replace('&\n', '')

    # Extraction des nœuds et des flux
    for line in lines_cleared.split('\n'):
        ok, res = parse_sankeymatic_flow(line)
        if ok:
            orig, dest, value, color = res

            org_id = sankeymatic_utils.normalizeStringToValidId(orig)
            dest_id = sankeymatic_utils.normalizeStringToValidId(dest)

            if (org_id not in nodes):
                node_org = sankeymatic_utils.create_json_node(org_id, orig)
                nodes[node_org['id']] = node_org
            else:
                node_org = nodes[org_id]

            if (dest_id not in nodes):
                node_dest = sankeymatic_utils.create_json_node(dest_id, dest)
                nodes[node_dest['id']] = node_dest
            else:
                node_dest = nodes[dest_id]

            new_flow = sankeymatic_utils.create_json_flow(
                node_org['id'], node_dest['id'], value, color)
            links[new_flow['id']] = new_flow

            node_org['outputLinksId'].append(new_flow['id'])
            node_org['output_value'] += new_flow['value']['data_value']
            node_org['links_order'].append(new_flow['id'])

            node_dest['inputLinksId'].append(new_flow['id'])
            node_dest['input_value'] += new_flow['value']['data_value']
            node_dest['links_order'].append(new_flow['id'])

        ok_color, res_color = parse_sankeymatic_node_color(line)
        if (ok_color):
            if (res_color[0] in nodes):
                nodes[res_color[0]]['local']['color'] = res_color[1]

        parse_sankeymatic_setting(line, setting)

    if (setting['layout_reversegraph'] == 'Y'):
        for k, link in links.items():
            curr_org = link['idSource']
            curr_dest = link['idTarget']
            value = link['value']['data_value']
            color = link['local']['color']
            new_flow_inv = sankeymatic_utils.create_json_flow(
                curr_dest, curr_org, value, color)
            del links[link['id']]
            links[new_flow_inv['id']] = new_flow_inv

    # Some var from setting used to process some nodes and nodes label var
    baseLabelSize = float(setting['label_name_size'])
    relativeLAbelSize = float(setting['labels_relativesize'])
    labelNameWeight = float(setting['label_name_weight'])
    labelValueWeight = float(setting['label_value_weight'])
    labels_highlight = float(setting['labels_highlight'])

    default_node_style = {
        "shape_visible": float(setting['node_opacity']) > 0.5,
        "shape": "rect",
        "node_width": float(setting['node_width']),
        "node_height": 0,
        "color": "#888888",
        "colorSustainable": False,
        "node_arrow_angle_factor": 30,
        "node_arrow_angle_direction": "right",
        "label_visible": setting['label_name_appears'] == 'Y',
        "font_family": "Arial,sans-serif",
        "font_size": baseLabelSize * (100 / relativeLAbelSize),
        "uppercase": False,
        # in snakeymatic file the weight correspond to font-weight (100 & 400 are normal font and 700 is bold)
        "bold": labelNameWeight == 700,
        "italic": False,
        "label_box_width": 150,
        "label_color": False,
        "label_vert": "bottom",
        "name_label_vert_shift": 0,
        "label_horiz": "middle",
        "name_label_horiz_shift": 0,
        "show_value": setting['label_value_appears'] == 'Y',
        "value_label_font_family": "Arial,sans-serif",
        "value_font_size": baseLabelSize / (100 / relativeLAbelSize),
        "value_label_uppercase": False,
        # in snakeymatic file the weight correspond to font-weight (100 & 400 are normal font and 700 is bold)
        "value_label_bold": labelValueWeight == 700,
        "value_label_italic": False,
        "value_label_box_width": 150,
        "value_label_color": False,
        "label_vert_valeur": "top",
        "value_label_vert_shift": 0,
        "label_horiz_valeur": "middle",
        "value_label_horiz_shift": 0,
        "value_label_background": labels_highlight > 0.5,
        "position": "absolute",
        "label_background": labels_highlight > 0.5,
        "name": "Style par default"
    }
    # Some var from setting used to process link var
    flowCurvature = float(setting['flow_curvature'])

    default_link_style = {
        "orientation": "hh",
        "left_horiz_shift": 0.05,
        "starting_tangeant": flowCurvature / 2,
        "ending_tangeant": flowCurvature / 2,
        "right_horiz_shift": 0.05,
        "curvature": 0.5,
        "curved": flowCurvature != 0,
        "recycling": False,
        "is_structur": False,
        "arrow_size": 10,
        "label_position": "middle",
        "orthogonal_label_position": "middle",
        "label_on_path": True,
        "label_pos_auto": False,
        "arrow": False,
        "color": "#999999",
        "opacity": float(setting['flow_opacity']),
        "dashed": False,
        "label_visible": False,
        "label_font_size": 20,
        "text_color": "black",
        "font_family": "Arial,sans-serif",
        "label_unit_visible": False,
        "label_unit": "",
        "label_unit_factor": 1,
        "to_precision": False,
        "scientific_precision": False,
        "nb_scientific_precision": 3,
        "custom_digit": True,
        "nb_digit": 2,
        "name": "Style par default"
    }

    # Compute nodes position
    DA_scale = computeSankeyPosition(nodes, links, setting)
    return {
        'version': '0.9',
        'nodes': nodes,
        'links': links,
        'user_scale': DA_scale,
        'couleur_fond_sankey': setting['bg_color'],
        'style_node': {'default': default_node_style},
        'style_link': {'default': default_link_style},
        'grid_visible': False,
    }


def parse_sankeymatic_node_color(line: str):
    if color_pattern.match(line):
        node_pat = color_node_pattern.findall(line)
        color_pat = color_hexa_pattern.findall(line)
        if len(node_pat) == 1 and len(color_pat) == 1:
            node_id = node_pat[0].replace(' #', '').replace(
                ':', '').replace('\\n', ' ')
            node_id = sankeymatic_utils.normalizeStringToValidId(node_id)
            color = color_pat[0].replace('<<', ' ').replace(' ', '')
            return True, [node_id, color]
    return False, None


def test_parse_sankeymatic_node_color():
    ok, res = parse_sankeymatic_node_color(':Net Profit #48e <<')
    assert ok is True
    assert res[0] == 'Net Profit'
    assert res[1] == '#48e'


def parse_sankeymatic_flow(line: str):
    if flow_pattern.match(line):
        origs = orig_pattern.findall(line)
        dests = dest_pattern.findall(line)
        values = value_pattern.findall(line)
        color = color_hexa_pattern.findall(line)
        if len(origs) == 1 and len(dests) == 1 and len(values) == 1:
            orig = origs[0].replace('[', ' ').replace(
                '  ', '').replace('\\n', ' ')
            dest = dests[0].replace(']', ' ').replace(
                '  ', '').replace('\\n', ' ')
            orig = re.sub(r'\s{0,1}#[A-Za-z0-9]{3,6}', '', orig)
            dest = re.sub(r'\s{0,1}#[A-Za-z0-9]{3,6}', '', dest)
            valeur = values[0].replace('[', '').replace(']', '')
            color_flow = None
            if (len(color) == 1):
                color_flow = color[0]
            return True, [orig, dest, valeur, color_flow]
    return False, None


def test_parse_sankeymatic_flow():
    ok, res = parse_sankeymatic_flow('DivisionA [100] Division indep')
    assert ok is True
    assert res[0] == 'DivisionA'
    assert res[1] == 'Division indep'
    assert res[2] == '100'


def test_parse_sankeymatic_flows():
    s = "A\\nRound 1 [300000] A\\nRound 2\n\
        B\\nRound 1 [220000] B\\nRound 2\n\
        C\\nRound 1 [200000] C\\nRound 2\n\
        D\\nRound 1 [10000] A\\nRound 2\n\
        D\\nRound 1 [25000] B\\nRound 2\n\
        D\\nRound 1 [20000] C\\nRound 2\n\
        \n\
        A\\nRound 2 [310000] A\\nRound 3\\n(Winner)\n\
        B\\nRound 2 [245000] B\\nRound 3\n\
        C\\nRound 2 [50000] A\\nRound 3\\n(Winner)\n\
        C\\nRound 2 [95000] B\\nRound 3\n\
        \n\
        # This line sets a custom gray color:\n\
        :No further votes #777 <<\n\
        D\\nRound 1 [20000] No further votes\n\
        C\\nRound 2 [75000] No further votes"
    parse_sankeymatic_text(s)


def parse_sankeymatic_setting(line: str, dict_setting: dict):

    line_splitted = line.split(' ')

    if (len(line_splitted) > 2 and line_splitted[0] in dict_setting_keyword):
        disable_token_setting()
        dict_setting_keyword[line_splitted[0]]['token'] = True

    line_splitted = clean_list_setting(line_splitted)
    if (len(line_splitted) == 0):
        disable_token_setting()
    for k, v in dict_setting_keyword.items():
        if (v['token'] is True):
            v['parser'](line_splitted, dict_setting)

    return dict_setting


def clean_list_setting(lst: list):
    lst = [x for x in lst if x != '']
    if (len(lst) > 2):
        lst.pop(0)
    return lst


"""
Dict contianing token & setting parser,
 it use the parser for each subgroup of setting (node attributes, flow attributes, layout ... )
"""
dict_setting_keyword = {
    "size": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_size},
    "margin": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_margin},
    "bg": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_bg},
    "node": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_node},
    "flow": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_flow},
    "layout": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_layout},
    "labels": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_labels},
    "labelname": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_label_name},
    "labelvalue": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_label_value},
    "labelposition": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_label_position},
    "value": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_value},
    "themeoffset": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_themeoffset},
    "meta": {'token': False, 'parser': sankeymatic_utils.parse_setting_line_meta}
}


def disable_token_setting():
    """
   Disable all token in dict_setting_keyword
    """
    for k, v in dict_setting_keyword.items():
        dict_setting_keyword[k]['token'] = False


def test_parse_sankeymatic_setting():
    s = "size w 1000\n\
      h 600\n\
    margin l 12\n\
      r 12\n\
      t 18\n\
      b 20\n\
    bg color #ffffff\n\
      transparent N\n\
    node w 40\n\
      h 31.5\n\
      spacing 37\n\
      border 10\n\
      theme d\n\
      color #888888\n\
      opacity 0.5\n\
    flow curvature 0.22\n\
      inheritfrom none\n\
      color #d22d2d\n\
      opacity 0.25\n\
    layout order exact\n\
      justifyorigins Y\n\
      justifyends N\n\
      reversegraph N\n\
      attachincompletesto nearest\n\
    labels color #c9c5c5\n\
      hide N\n\
      highlight 0.8\n\
      fontface sans-serif\n\
      linespacing 0.1\n\
      relativesize 95\n\
      magnify 124\n\
    labelname appears Y\n\
      size 18\n\
      weight 400\n\
    labelvalue appears Y\n\
      fullprecision Y\n\
      position below\n\
      weight 400\n\
    labelposition autoalign 0\n\
      scheme auto\n\
      first before\n\
      breakpoint 4\n\
    value format ',.'\n\
      prefix ''\n\
      suffix ''\n\
    themeoffset a 9\n\
      b 3\n\
      c 0\n\
      d 0\n\
    meta mentionsankeymatic Y\n\
      listimbalances Y\n\
    "

    list_line = s.split('\n')
    dict_of_setting = {}
    for line in list_line:
        parse_sankeymatic_setting(line, dict_of_setting)

    # Test parse_sankeymatic_setting for given text
    assert dict_of_setting['size_width'] == "1000"
    assert dict_of_setting['size_height'] == "600"
    assert dict_of_setting['margin_left'] == "12"
    assert dict_of_setting['margin_right'] == "12"
    assert dict_of_setting['margin_top'] == "18"
    assert dict_of_setting['margin_bottom'] == "20"
    assert dict_of_setting['bg_color'] == "#ffffff"
    assert dict_of_setting['bg_transparent'] == "N"
    assert dict_of_setting['node_width'] == "40"
    assert dict_of_setting['node_height'] == "31.5"
    assert dict_of_setting['node_spacing'] == "37"
    assert dict_of_setting['node_border'] == "10"
    assert dict_of_setting['node_theme'] == "d"
    assert dict_of_setting['node_color'] == "#888888"
    assert dict_of_setting['node_opacity'] == "0.5"
    assert dict_of_setting['flow_curvature'] == "0.22"
    assert dict_of_setting['flow_inheritfrom'] == "none"
    assert dict_of_setting['flow_color'] == "#d22d2d"
    assert dict_of_setting['flow_opacity'] == "0.25"
    assert dict_of_setting['layout_order'] == "exact"
    assert dict_of_setting['layout_justifyorigins'] == "Y"
    assert dict_of_setting['layout_justifyends'] == "N"
    assert dict_of_setting['layout_reversegraph'] == "N"
    assert dict_of_setting['layout_attachincompletesto'] == "nearest"
    assert dict_of_setting['labels_color'] == "#c9c5c5"
    assert dict_of_setting['labels_hide'] == "N"
    assert dict_of_setting['labels_highlight'] == "0.8"
    assert dict_of_setting['labels_fontface'] == "sans-serif"
    assert dict_of_setting['labels_linespacing'] == "0.1"
    assert dict_of_setting['labels_relativesize'] == "95"
    assert dict_of_setting['labels_magnify'] == "124"
    assert dict_of_setting['label_name_appears'] == "Y"
    assert dict_of_setting['label_name_size'] == "18"
    assert dict_of_setting['label_name_weight'] == "400"
    assert dict_of_setting['label_value_appears'] == "Y"
    assert dict_of_setting['label_value_fullprecision'] == "Y"
    assert dict_of_setting['label_value_position'] == "below"
    assert dict_of_setting['label_value_weight'] == "400"
    assert dict_of_setting['label_position_autoalign'] == "0"
    assert dict_of_setting['label_position_scheme'] == "auto"
    assert dict_of_setting['label_position_first'] == "before"
    assert dict_of_setting['label_position_breakpoint'] == "4"
    assert dict_of_setting['value_format'] == "',.'"
    assert dict_of_setting['value_prefix'] == "''"
    assert dict_of_setting['value_suffix'] == "''"
    assert dict_of_setting['theme_a'] == "9"
    assert dict_of_setting['theme_b'] == "3"
    assert dict_of_setting['theme_c'] == "0"
    assert dict_of_setting['theme_d'] == "0"
    assert dict_of_setting['meta_mentionsankeymatic'] == "Y"
    assert dict_of_setting['meta_listimbalances'] == "Y"


full_file = 'Wages [1500] Budget\n\
Other [250] Budget\n\
\n\
Budget [450] Taxes\n\
Budget [420] Housing\n\
Budget [400] Food\n\
Budget [295] Transportation\n\
Budget [35] Other Necessities\n\
Budget [150] Savings\n\
\n\
:Taxes #d74\n\
:Savings #197\n\
\n\
// === Settings ===\n\
\n\
size w 1000\n\
  h 600\n\
margin l 12\n\
  r 12\n\
  t 18\n\
  b 20\n\
bg color #ce2222\n\
  transparent N\n\
node w 20\n\
  h 63\n\
  spacing 100\n\
  border 0\n\
  theme none\n\
  color #888888\n\
  opacity 1\n\
flow curvature 0.42\n\
  inheritfrom outside-in\n\
  color #999999\n\
  opacity 0.45\n\
layout order automatic\n\
  justifyorigins N\n\
  justifyends N\n\
  reversegraph N\n\
  attachincompletesto nearest\n\
labels color #000000\n\
  hide N\n\
  highlight 0.8\n\
  fontface sans-serif\n\
  linespacing 0.2\n\
  relativesize 100\n\
  magnify 120\n\
labelname appears Y\n\
  size 25\n\
  weight 400\n\
labelvalue appears Y\n\
  fullprecision Y\n\
  position below\n\
  weight 400\n\
labelposition autoalign 0\n\
  scheme auto\n\
  first before\n\
  breakpoint 3\n\
value format ",."\n\
  prefix ''\n\
  suffix ''\n\
themeoffset a 5\n\
  b 9\n\
  c 0\n\
  d 0\n\
meta mentionsankeymatic Y\n\
  listimbalances Y'

if __name__ == '__main__':
    # test_parse_sankeymatic_flow()
    # test_parse_sankeymatic_node_color()
    # test_parse_sankeymatic_flows()
    # test_parse_sankeymatic_setting()
    parse_sankeymatic_text(full_file)
