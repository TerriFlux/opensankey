"""
Auteur : Julien ALAPETITE
Date : /
"""

# External libs ---------------------------------------------------------------
import pandas as pd
import numpy as np
import copy

# Local libs -------------------------------------------------------
import SankeyExcelParser.io_excel_constants as CONST_IO_XL

# External modules ------------------------------------------------------------
from collections import OrderedDict

# Local modules ---------------------------------------------------------------
from SankeyExcelParser import format_io
from SankeyExcelParser.sankey import Sankey


# Functions -------------------------------------------------------------------
def parse_excel(sankey: Sankey):
    """
    Convert an input to a json format for OpenSankey App

    Parameters
    ----------
    :param sankey: sankey struct to convert
    :type sankey: Sankey

    Returns
    -------
    :return: Data as json format
    :rtype: dict
    """
    # Parse all tags -> data struct
    dataTags = {}
    nodeTags = {}
    fluxTags = {}
    parse_tags(sankey, dataTags, nodeTags, fluxTags)
    # Parser all nodes -> data struct
    nodes = {}
    parse_nodes(sankey, nodes, nodeTags)
    links = {}
    parse_links(sankey, links)
    return {
        'version': '0.8',

        'dataTags': dataTags,
        'nodeTags': nodeTags,
        'fluxTags': fluxTags,

        'nodes': nodes,
        'links': links,
        'labels': {}
    }


def parse_tags(
    sankey: Sankey,
    dataTags: dict,
    nodeTags: dict,
    fluxTags: dict
):
    """
    Extract tags from sankey struct for json data format.

    Parameters
    ----------
    :param sankey: Input sankey struct
    :type sankey: Sankey

    :param dataTags: data tags
    :type dataTags: dict

    :param nodeTags: node tags
    :type nodeTags: dict

    :param fluxTags: flux tags
    :type fluxTags: dict
    """
    # Go trough all tags
    for tagg_type, taggs in sankey.taggs.items():
        # Data tags parsing
        if (tagg_type == CONST_IO_XL.TAG_TYPE_DATA):
            for tagg in taggs.values():
                # tags dict
                tags = {tag.name_unformatted: {
                    'name': tag.name_unformatted,
                    'selected': False,
                    'color': tag.color_in_hex} for tag in tagg.tags.values()}
                next(iter(tags.values()))['selected'] = True  # by default select first tag
                # tag group dict
                dataTags[tagg.name_unformatted] = {
                    'group_name': tagg.name_unformatted,
                    'show_legend': False,
                    'tags': tags,
                    'banner': 'one',
                    'activated': True,
                    'siblings': []
                }
            continue
        if (tagg_type == CONST_IO_XL.TAG_TYPE_NODE) or (tagg_type == CONST_IO_XL.TAG_TYPE_LEVEL):
            for tagg in taggs.values():
                # tags dict
                tags = {tag.name_unformatted: {
                    'name': tag.name_unformatted,
                    'selected': True,
                    'color': tag.color_in_hex} for tag in tagg.tags.values()}
                # case level tag
                if (tagg_type == CONST_IO_XL.TAG_TYPE_LEVEL):
                    for tag in list(tags.values())[1:]:
                        tag['selected'] = False
                # Banner type
                banner = 'multi'
                if (tagg.name_unformatted == CONST_IO_XL.NODE_TYPE):
                    banner = 'none'
                if (tagg_type == CONST_IO_XL.TAG_TYPE_LEVEL) or \
                   (tagg.name_unformatted == 'Primaire'):
                    banner = 'level'
                # tag group dict
                nodeTags[tagg.name_unformatted] = {
                    'group_name': tagg.name_unformatted,
                    'show_legend': False,
                    'tags': tags,
                    'banner': banner,
                    'activated': True,
                    'siblings': [
                        anta_tagg.name_unformatted for anta_tagg in tagg.antagonists_taggs]
                }
                # Specific case for tag 'échange'
                # Why ? Julien
                # if (tagg.name_unformatted == CONST_IO_XL.NODE_TYPE):
                #     if (CONST_IO_XL.NODE_TYPE_EXCHANGE in nodeTags[CONST_IO_XL.NODE_TYPE]['tags']):
                #         nodeTags[CONST_IO_XL.NODE_TYPE]['tags'][CONST_IO_XL.NODE_TYPE_EXCHANGE]['selected'] = 0
            continue
        if (tagg_type == CONST_IO_XL.TAG_TYPE_FLUX):
            for tagg in taggs.values():
                # tags dict
                tags = {tag.name_unformatted: {
                    'name': tag.name_unformatted,
                    'selected': True,
                    'color': tag.color_in_hex} for tag in tagg.tags.values()}
                # Specific tags for reconcillation
                # TODO remove ?
                tagg_name = tagg.name_unformatted
                if tagg_name == CONST_IO_XL.DATA_TYPE_LABEL:
                    tagg_name = 'flux_types'
                    tags['initial_data'] = tags.pop(CONST_IO_XL.DATA_COLLECTED)
                    tags['computed_data'] = tags.pop(CONST_IO_XL.DATA_COMPUTED)
                # tag group dict
                fluxTags[tagg_name] = {
                    'group_name': tagg.name_unformatted,
                    'show_legend': False,
                    'tags': tags,
                    'banner': 'multi',
                    'activated': True,
                    'siblings': []
                }


def parse_links(
    sankey: Sankey,
    links: dict
):
    """
    Extract links from sankey struct for json data format.

    Parameters
    ----------
    :param sankey: Input sankey object
    :type sankey: Sankey

    :param links: links data struct
    :type links: dict (modified)
    """
    # First create default datas struct
    default_data_strct = {
        "value": "",
        "display_value": "",
        "tags": {},
        "extension": {}
    }
    # Add flux tag groups to default data structure
    for tagg in sankey.taggs[CONST_IO_XL.TAG_TYPE_FLUX].values():
        # Replace specific names
        tagg_name = tagg.name_unformatted
        if tagg_name == CONST_IO_XL.DATA_TYPE_LABEL:
            tagg_name = "flux_types"
        # Update fluxtags struct
        default_data_strct['tags'][tagg_name] = ""  # tag_name
    # Go trough all tags
    for flux in sankey.flux.values():
        # Boolean that memorized if flux have at least one value
        has_data = False
        # Initilialize datas struct
        datas_strct = copy.deepcopy(default_data_strct)
        for tagg in reversed(sankey.taggs[CONST_IO_XL.TAG_TYPE_DATA].values()):
            next_datas_strct = {}
            for tag in tagg.tags.values():
                next_datas_strct[tag.name_unformatted] = copy.deepcopy(datas_strct)
            datas_strct = next_datas_strct
        # We use result data if present instead of simple data
        if flux.has_result():
            for result in flux.results:
                has_data |= result.value is not None
                parse_data(
                    sankey,
                    result,
                    default_data_strct,
                    datas_strct)
        elif flux.has_data():
            for data in flux.datas:
                has_data |= data.value is not None
                parse_data(
                    sankey,
                    data,
                    default_data_strct,
                    datas_strct)
        # Color of link : default = color of source node
        color = flux.orig.color_in_hex
        if flux.dest.has_specific_tag(CONST_IO_XL.NODE_TYPE, CONST_IO_XL.NODE_TYPE_PRODUCT):
            color = flux.dest.color_in_hex
        # Then create link struct
        links[flux.id] = {
            'idLink': flux.id,
            'idSource': flux.orig.id,
            'idTarget': flux.dest.id,
            'value': datas_strct,
            'color': color,
            'dashed': (not has_data)
        }


def parse_data(
    sankey: Sankey,
    data,
    default_data_strct: dict,
    datas_strct: dict
):
    """
    Extract datas from link struct for json data format.

    Parameters
    ----------
    :param data: Input data object
    :type data: Data

    :param default_data_strct: Default data json struct
    :type default_data_strct: dict

    :param datas_strct: Output json struct that contains all datas
    :type datas_strct: dict (modified)
    """
    # Reccurent function specific to this function
    def add_data_to_datas(tags, datas_strct, data_strct):
        # Check if we reached the last data tag
        if len(tags) == 0:
            datas_strct.update(data_strct)
            return
        # Otherwise we have a reccurence
        for tag in tags:
            if tag.name_unformatted in datas_strct.keys():
                tags.remove(tag)
                add_data_to_datas(
                    tags,
                    datas_strct[tag.name_unformatted],
                    data_strct)
                return
        # TODO : Mettre gestion erreur aucun tag trouvé ?
    # Create data structure
    data_strct = copy.deepcopy(default_data_strct)
    data_strct['value'] = data.value if (data.value is not None) else ""
    data_strct['display_value'] = ''
    # Update flux tags to data structure
    for tagg in sankey.taggs[CONST_IO_XL.TAG_TYPE_FLUX].values():
        # TODO : Checker si len(tags) > 1 -> normalement ça ne devrait pas arriver
        tags = data.get_tags_from_taggroup(tagg)
        if tags is not None:
            # Replace specific names for tags and tagggroup
            tagg_name = tagg.name_unformatted
            tag_name = tags[0].name_unformatted
            if tagg_name == CONST_IO_XL.DATA_TYPE_LABEL:
                tagg_name = "flux_types"
                tag_name = tag_name \
                    .replace(CONST_IO_XL.DATA_COLLECTED, "initial_data") \
                    .replace(CONST_IO_XL.DATA_COMPUTED, "computed_data")
            # Update fluxtags struct
            data_strct['tags'][tagg_name] = tag_name
    # Reference data struct from data tags
    tags = [tag for tag in data.tags if (tag.group.type == CONST_IO_XL.TAG_TYPE_DATA)]
    add_data_to_datas(tags, datas_strct, data_strct)


def parse_nodes(
    sankey: Sankey,
    nodes: dict,
    nodeTags
):
    """
    Extract nodes from sankey object for json data format.

    Parameters
    ----------
    :param sankey: Input sankey object
    :type sankey: Sankey

    :param nodes: nodes json struct
    :type nodes: dict (modified)

    :param nodeTags: node tags json struct - Updated if necessary
    :type nodeTags: dict (modified)
    """
    # Create nodes struct
    for node in sankey.nodes.values():
        # Create node struct
        new_node = {
            'idNode': node.id,
            'name': node.name,
            'definition': node.definition,
            'display': True,
            'node_visible': True,
            'label_visible': True,
            'shape_visible': True,
            'color': node.color_in_hex,
            'tags': {},
            'dimensions': {
                'Primaire': {}
            }
        }
        nodes[node.id] = new_node
        # Update tags
        for tag in node.tags:
            tag_group_name = tag.group.name_unformatted
            # Create group entry if not already the case
            if tag_group_name not in new_node['tags'].keys():
                new_node['tags'][tag_group_name] = []
            # Add the tag
            new_node['tags'][tag_group_name].append(tag.name_unformatted)
            new_node['tags'][tag_group_name].sort()
        # Parents relations -> TODO duplicate node for each parent
        if (node.has_parents()):
            new_node['dimensions']['Primaire']['parent_name'] = node.parents[0].id
        # Child relations
        if (node.has_at_least_one_child()):
            # The node has children : Primary tag is only the node's level
            new_node['tags']['Primaire'] = [str(node.level)]
        else:
            # The node does not have child : Primary tags are all level
            # starting from the nod's level
            new_node['tags']['Primaire'] = \
                [str(_) for _ in range(node.level, sankey.max_nodes_level+1)]
        # Level tag parent relations
        for tagg in sankey.taggs[CONST_IO_XL.TAG_TYPE_LEVEL].values():
            # Check all current node level tags groups
            if tagg in node.taggs:
                new_node['dimensions'][tagg.name_unformatted] = {}
                # For each node level tag group, get associated tags
                tags = node.get_tags_from_taggroup(tagg)
                if tags is not None:
                    tag = tags[0]
                    upper_tag = tagg.get_tag_from_name(
                        str(int(tag.name) - 1),
                        include_anti_tags=False)
                    if upper_tag is not None:
                        parent_nodes_for_leveltagg = set(upper_tag.references) & set(node.parents)
                        if len(parent_nodes_for_leveltagg) > 0:
                            # Try to check parenthood consistency
                            for parent_node_primary in node.parents:
                                if parent_node_primary in parent_nodes_for_leveltagg:
                                    new_node['dimensions'][tagg.name_unformatted]['parent_name'] = \
                                        parent_node_primary.id
                            # Otherwise we take the first parent node
                            if 'parent_name' not in new_node['dimensions'][tagg.name_unformatted]:
                                for parent_node_primary in node.parents:
                                    for grand_parent_node_primary in parent_node_primary.parents:
                                        if grand_parent_node_primary in parent_nodes_for_leveltagg:
                                            new_node['dimensions'][tagg.name_unformatted]['parent_name'] = \
                                                grand_parent_node_primary.id
                                            break
    # Create primary level tag if necessary
    if (sankey.max_nodes_level > 1):
        nodeTags['Primaire'] = {
            'group_name': 'Primaire',
            'show_legend': False,
            'tags': {},
            'banner': 'level',
            'activated': True
        }
        for tag in range(1, sankey.max_nodes_level+1):
            nodeTags['Primaire']['tags'][str(tag)] = {
                'name': str(tag),
                'selected': (tag == 1),
                'color': ''
            }


def save_excel(
    sankey_data: dict,
    save_all: bool
):
    '''
    Save sankey data in Excel file

    Parameters
    ----------
    sankey_data : dict
        Formatted data
    save_all : bool
        TODO description

    Returns
    -------
    mfa_output, nodes_names
        TODO description
    '''
    nodes_cols = [CONST_IO_XL.NODES_LEVEL, CONST_IO_XL.NODES_NODE]
    #  tag_names are disposed between the column Dimensions and the column Définition
    tag_key_names = list(sankey_data['dataTags']) + list(sankey_data['nodeTags']) + list(sankey_data['fluxTags'])

    nodes = []
    tags_sheet = []
    if len(tag_key_names) != 0:
        tags_sheet = [[""] * 6] * (len(tag_key_names)+1)
        tags_sheet[0] = [
            CONST_IO_XL.TAG_NAME,
            CONST_IO_XL.TAG_TYPE,
            CONST_IO_XL.TAG_TAGS,
            CONST_IO_XL.TAG_IS_PALETTE,
            CONST_IO_XL.TAG_COLORMAP,
            CONST_IO_XL.TAG_COLOR]

    row = 1
    skip = False
    has_level = False
    for tag_group_type in ['dataTags', 'nodeTags', 'fluxTags']:
        tag_key_names = list(sankey_data[tag_group_type])
        tag_group_names = [tags_group['group_name'] for tags_group in sankey_data[tag_group_type].values()]
        for i in range(len(tag_key_names)):
            banner = sankey_data[tag_group_type][tag_key_names[i]]['banner']
            tags_colors = (':').join([tag['color'] for tag in
                                      sankey_data[tag_group_type][tag_key_names[i]]['tags'].values()if 'color' in tag])
            the_tag_group_type = tag_group_type
            if tag_group_names[i] == 'Primaire':
                skip = True
                for j, node in enumerate(sankey_data['nodes'].values()):
                    if 'Primaire' in node['dimensions'] and 'parent_name' in node['dimensions']['Primaire']:
                        skip = False
                if skip:
                    del sankey_data['nodeTags']['Primaire']
                    tags_sheet.pop()
                    continue
            if banner == 'level':
                the_tag_group_type = 'levelTags'
                has_level = True
            tags_sheet[row] =\
                [tag_group_names[i], the_tag_group_type,
                 (':').join([tag['name'] for tag in sankey_data[tag_group_type][tag_key_names[i]]['tags'].values()]),
                 '', sankey_data[tag_group_type][tag_key_names[i]]['color_map'], tags_colors]
            row = row+1

    if len(tags_sheet) == 2 and skip:
        tags_sheet = []
    # nodes = [ [""] * nb_cols_nodes for i in range(len(sankey_data['nodes'].keys())+1) ]
    nodeTags_group_names = [tags_group['group_name'] for tags_group in sankey_data['nodeTags'].values()]
    nb_cols_nodes = len(nodes_cols) + len(nodeTags_group_names)
    nodes.append([CONST_IO_XL.NODES_LEVEL, CONST_IO_XL.NODES_NODE]+nodeTags_group_names)
    has_dimensions =\
        len([node for node in sankey_data['nodes'].values() if len(node['dimensions'].keys())]) > 0 and has_level
    for row, node in enumerate(sankey_data['nodes'].values()):
        if 'tooltip_text' in node and node['tooltip_text'] is not None and node['tooltip_text'] != '':
            nb_cols_nodes = nb_cols_nodes+1
            nodes[0].append(CONST_IO_XL.NODES_DEFINITIONS)
            break
    if not has_dimensions:
        for row, node in enumerate(sankey_data['nodes'].values()):
            nodes.append([""] * nb_cols_nodes)
            nodes[row+1][nodes_cols.index(CONST_IO_XL.NODES_LEVEL)] = 1
            nodes[row+1][nodes_cols.index(CONST_IO_XL.NODES_NODE)] = node['name']
            if 'tooltip_text' in node and node['tooltip_text'] is not None and node['tooltip_text'] != '':
                nodes[row+1][nb_cols_nodes-1] = node['tooltip_text']
            col_num = 0
            for j, tag_name in enumerate(sankey_data['nodeTags']):
                tags = sankey_data['nodeTags'][tag_name]['tags']
                if tag_name in node['tags']:
                    tags_names = [tags[node_tag]['name'] for node_tag in node['tags'][tag_name] if node_tag in tags]
                    nodes[row+1][len(nodes_cols)+col_num] = (':').join(tags_names)
                col_num = col_num+1
    else:
        levelTags =\
            [tags for tags in sankey_data['nodeTags'].keys() if sankey_data['nodeTags'][tags]['banner'] == 'level']
        if len(levelTags) == 0:
            levelTags = ['Primaire']

        for i in range(len(levelTags)):
            levelTag = levelTags[i]
            dim_nodes = []
            row = 0
            for i, node in enumerate(sankey_data['nodes'].values()):
                skip = False
                for k in range(len(levelTags)):
                    if levelTags[k] in node['dimensions'] and 'parent_name' in node['dimensions'][levelTags[k]]:
                        skip = True
                if skip:
                    continue
                dim_nodes.append([""] * nb_cols_nodes)
                dim_nodes[row][nodes_cols.index(CONST_IO_XL.NODES_LEVEL)] = 1
                dim_nodes[row][nodes_cols.index(CONST_IO_XL.NODES_NODE)] = node['name']
                if 'tooltip_text' in node and node['tooltip_text'] is not None:
                    dim_nodes[row][nb_cols_nodes-1] = node['tooltip_text']
                col_num = 0
                for j, tag_name in enumerate(sankey_data['nodeTags']):
                    tags = sankey_data['nodeTags'][tag_name]['tags']
                    if tag_name in node['tags']:
                        tags_names =\
                            [tags[node_tag]['name'] for node_tag in node['tags'][tag_name] if node_tag in tags]
                        dim_nodes[row][len(nodes_cols)+col_num] = (':').join(tags_names)
                    col_num = col_num+1
                # dim_nodes[row][nodes_cols.index(CONST_IO_XL.NODES_LEVEL)] = 1
                row = row+1
            for i, node in enumerate(sankey_data['nodes'].values()):
                if levelTag in node['dimensions'] and 'parent_name' in node['dimensions'][levelTag]:
                    # level = node['dimensions'][levelTag]['level']
                    parent_id = node['dimensions'][levelTag]['parent_name']
                    parent_names =\
                        [node['name'] for node in sankey_data['nodes'].values() if node['idNode'] == parent_id]
                    if len(parent_names) == 0:
                        continue
                    parent_name = parent_names[0]
                else:
                    continue
                parent_rows = [
                    j for j in range(len(dim_nodes))
                    if dim_nodes[j][nodes_cols.index(CONST_IO_XL.NODES_NODE)] == parent_name]
                if len(parent_rows) == 0:
                    continue
                parent_row = parent_rows[0]
                if dim_nodes[parent_row][0] != 1:
                    continue
                dim_nodes.insert(parent_row+1, [""] * nb_cols_nodes)
                row = parent_row+1
                dim_nodes[row][nodes_cols.index(CONST_IO_XL.NODES_LEVEL)] = dim_nodes[parent_row][0]+1
                dim_nodes[row][nodes_cols.index(CONST_IO_XL.NODES_NODE)] = node['name']
                if 'tooltip_text' in node and node['tooltip_text'] is not None:
                    dim_nodes[row][nb_cols_nodes-1] = node['tooltip_text']
                col_num = 0
                for j, tag_name in enumerate(sankey_data['nodeTags']):
                    if tag_name == 'Dimensions':
                        continue
                    tags = sankey_data['nodeTags'][tag_name]['tags']
                    if tag_name in node['tags']:
                        try:
                            tags_names = [
                                tags[node_tag]['name'] for node_tag in node['tags'][tag_name]
                                if node_tag in tags]
                            dim_nodes[row][len(nodes_cols)+col_num] = (':').join(tags_names)
                        except Exception:
                            print('tutu')
                    col_num = col_num + 1
            nodes = nodes+dim_nodes
        for i, node in enumerate(sankey_data['nodes'].values()):
            for i in range(len(levelTags)):
                levelTag = levelTags[i]
                if (levelTag in node['dimensions']) and \
                   ('parent_name' in node['dimensions'][levelTag]):
                    # level = node['dimensions'][levelTag]['level']
                    parent_id = node['dimensions'][levelTag]['parent_name']
                    parent_names = [
                        node['name'] for node in sankey_data['nodes'].values()
                        if node['idNode'] == parent_id]
                    if len(parent_names) == 0:
                        continue
                    parent_name = parent_names[0]
                else:
                    continue
                parent_rows = [
                    k for k in range(len(nodes))
                    if nodes[k][nodes_cols.index(CONST_IO_XL.NODES_NODE)] == parent_name]
                if len(parent_rows) == 0:
                    continue
                parent_row = parent_rows[0]
                if nodes[parent_row][0] != 2:
                    continue
                #  if node['tags'][levelTag] == sankey_data['nodes'][parent_id]['tags'][levelTag]:
                #      continue
                nodes.insert(parent_row+1, [""] * nb_cols_nodes)
                row = parent_row+1
                nodes[row][nodes_cols.index(CONST_IO_XL.NODES_LEVEL)] = nodes[parent_row][0]+1
                nodes[row][nodes_cols.index(CONST_IO_XL.NODES_NODE)] = node['name']
                if 'definition' in node:
                    nodes[row][nb_cols_nodes-1] = node['definition']
                col_num = 0
                for j, tag_name in enumerate(sankey_data['nodeTags']):
                    tags = sankey_data['nodeTags'][tag_name]['tags']
                    tags_names = ['']
                    if tag_name in node['tags']:
                        tags_names = [tags[node_tag]['name'] for node_tag in node['tags'][tag_name] if node_tag in tags]
                        nodes[row][len(nodes_cols)+col_num] = (':').join(tags_names)
                    col_num = col_num+1
    flux_cols = [
        CONST_IO_XL.DATA_ORIGIN, CONST_IO_XL.DATA_DESTINATION, CONST_IO_XL.DATA_VALUE
    ]

    nb_cols_nodes = 3 + len(sankey_data['dataTags'].keys()) + len(sankey_data['fluxTags'].keys())
    nb_vals = 1
    for dataTag in sankey_data['dataTags']:
        if len(sankey_data['dataTags'][dataTag]['tags']) != 0:
            nb_vals = nb_vals * len(sankey_data['dataTags'][dataTag]['tags'])
    links = [[""] * nb_cols_nodes for i in range(len(sankey_data['links'].keys())*nb_vals+1)]
    dataTags_group_names = [tags_group['group_name'] for tags_group in sankey_data['dataTags'].values()]
    fluxTags_group_names = [tags_group['group_name'] for tags_group in sankey_data['fluxTags'].values()]
    links[0] = flux_cols + dataTags_group_names + fluxTags_group_names
    row = 1
    for _, link in enumerate(sankey_data['links'].values()):
        val = link['value']
        row = add_links(sankey_data, flux_cols, links, row, link, val, 0)
    links = [link for link in links if link[0] != ""]

    #  products = [node['name'] for node in sankey_data['nodes'].values() if node['type'] == 'product']
    #  sectors  = [node['name'] for node in sankey_data['nodes'].values() if node['type'] == 'sector']
    #  nb_products = len(products)
    #  nb_sectors  = len(sectors)

    #  if nb_products == 0 or nb_sectors == 0:
    #      mfa_output = {
    #          'nodes': nodes,
    #          'tags': tags,
    #          'data': links,
    #      }
    #      return mfa_output,products,sectors
    # param_sheet = pd.DataFrame([[VERSION_LABEL,0.8,VERSION_DOC]],columns=[PARAM_NAME,PARAM_VALUE,PARAM_DESC])
    nodes_names = list(OrderedDict.fromkeys([node[1] for node in nodes[1:]]))
    node_tag_keys = list(sankey_data['nodeTags'])
    if CONST_IO_XL.NODE_TYPE in node_tag_keys:
        mfa_output = {
            'nodes': pd.DataFrame(nodes[1:], columns=nodes[0])
        }
        ter, sectors_names, products_names = format_io.create_empty_ter(mfa_output)
        s_names2s_idx = {e: i for i, e in enumerate(sectors_names)}
        p_names2p_idx = {e: i for i, e in enumerate(products_names)}
        for row in range(1, len(links)):
            origin = links[row][flux_cols.index(CONST_IO_XL.DATA_ORIGIN)]
            destination = links[row][flux_cols.index(CONST_IO_XL.DATA_DESTINATION)]
            if origin in sectors_names:
                sector_name = origin
                product_name = destination
                table_name = 'supply'
            else:
                sector_name = destination
                product_name = origin
                table_name = 'use'
            try:
                col = s_names2s_idx[sector_name]
                row = p_names2p_idx[product_name]
                ter[table_name].iat[row, col] = 1
            except Exception as excpt:
                print('exception 1: '+str(excpt))
        mfa_output = {
            CONST_IO_XL.TAG_SHEET: pd.DataFrame(tags_sheet[1:], columns=tags_sheet[0]),
            CONST_IO_XL.NODES_SHEET: pd.DataFrame(nodes[1:], columns=nodes[0]),
            CONST_IO_XL.DATA_SHEET: pd.DataFrame(links[1:], columns=links[0]),
            CONST_IO_XL.TER_SHEET: ter
        }
    else:
        io_table = [[None for x in range(len(nodes_names) + 1)] for y in range(len(nodes_names) + 1)]

        for i in range(len(nodes_names)):
            io_table[i+1][0] = nodes_names[i]
            # ter['use'][i+1][0] = nodes[i]
        for j in range(len(nodes_names)):
            io_table[0][j+1] = nodes_names[j]
        #      ter['use'][0][j+1] = sectors[j]
        for _, link in enumerate(sankey_data['links'].values()):
            origin = sankey_data['nodes'][link['idSource']]['name']
            destination = sankey_data['nodes'][link['idTarget']]['name']
            try:
                origin_idx = nodes_names.index(origin)
                destination_idx = nodes_names.index(destination)
                io_table[origin_idx+1][destination_idx+1] = 1
            except Exception as excpt:
                print('exception 2: '+str(excpt))
        io_table = np.array(io_table)
        mfa_output = {}
        if len(tags_sheet) > 0:
            mfa_output[CONST_IO_XL.TAG_SHEET] = pd.DataFrame(tags_sheet[1:], columns=tags_sheet[0])
        if len(nodes) > 0:
            mfa_output[CONST_IO_XL.NODES_SHEET] = pd.DataFrame(nodes[1:], columns=nodes[0])
        if len(links) > 0:
            mfa_output[CONST_IO_XL.DATA_SHEET] = pd.DataFrame(links[1:], columns=links[0])
        if len(io_table) > 0:
            mfa_output[CONST_IO_XL.IO_SHEET] = \
                pd.DataFrame(data=io_table[1:, 1:], index=io_table[1:, 0], columns=io_table[0, 1:])

    return mfa_output, nodes_names


def add_links(sankey_data, flux_cols, links, row, link, val, depth):
    if len(sankey_data['dataTags'].keys()) == depth:
        # display_val = val['display_value']
        links[row][flux_cols.index(CONST_IO_XL.DATA_ORIGIN)] = sankey_data['nodes'][link['idSource']]['name']
        links[row][flux_cols.index(CONST_IO_XL.DATA_DESTINATION)] = sankey_data['nodes'][link['idTarget']]['name']
        if val['value'] != '':
            links[row][flux_cols.index(CONST_IO_XL.DATA_VALUE)] = float(val['value'])
        for i, flux_tag_key in enumerate(sankey_data['fluxTags'].keys()):
            if flux_tag_key in val['tags']:
                try:
                    links[row][3+depth+i] =\
                         sankey_data['fluxTags'][flux_tag_key]['tags'][val['tags'][flux_tag_key]]['name']
                except Exception as expt:
                    print(str(expt))
                    pass
            else:
                links[row][3+depth+i] = ''
        return row+1
    dataTagGroup = list(sankey_data['dataTags'].keys())[depth]
    data_tags = list(sankey_data['dataTags'][dataTagGroup]['tags'].keys())
    for i, data_tag_key in enumerate(data_tags):
        links[row][3+depth] = sankey_data['dataTags'][dataTagGroup]['tags'][data_tag_key]['name']
        if data_tag_key not in val:
            continue
        new_row = add_links(sankey_data, flux_cols, links, row, link, val[data_tag_key], depth+1)
        for i in range(row, new_row):
            links[i][3+depth] = sankey_data['dataTags'][dataTagGroup]['tags'][data_tag_key]['name']
        row = new_row
    return row
