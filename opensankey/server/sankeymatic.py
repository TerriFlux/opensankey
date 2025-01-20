# coding: utf-8

# ---------------------------------------------------------------
import re
# Expression régulière pour extraire les nœuds, les flux et les couleurs
orig_pattern = re.compile(r'.+\[')
dest_pattern = re.compile(r'\].+')
value_pattern = re.compile(r'\[\d+\]')
flow_pattern = re.compile(r'.+\[[\d]+\].+')


color_pattern = re.compile(r'^:.+#[A-Za-z0-9]+\s{0,1}<{0,2}')
color_node_pattern = re.compile(r'^:.+#')
color_hexa_pattern = re.compile(r'#[A-Za-z0-9]+\s{0,1}<{0,2}')


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
    edges = {}
    setting = {}

    # Netoyage
    lines_cleared = lines.replace('&\n', '')

    # Extraction des nœuds et des flux
    for line in lines_cleared.split('\n'):
        ok, res = parse_sankeymatic_flow(line)
        if ok:
            orig, dest, value = res
            nodes[orig] = {}
            nodes[dest] = {}
            if orig not in edges:
                edges[orig] = {}
            edges[orig][dest] = value

        ok_color, res_color = parse_sankeymatic_node_color(line)
        if (ok_color):
            if (res_color[0] in nodes):
                nodes[res_color[0]]['color'] = res_color[1]

        parse_sankeymatic_setting(line, setting)

    return {
        'nodes': nodes,
        'flows': edges,
        'setting': setting
        }


def parse_sankeymatic_node_color(line: str):
    if color_pattern.match(line):
        node_pat = color_node_pattern.findall(line)
        color_pat = color_hexa_pattern.findall(line)
        if len(node_pat) == 1 and len(color_pat) == 1:
            node_id = node_pat[0].replace(' #', '').replace(':', '').replace('\\n', ' ')
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
        if len(origs) == 1 and len(dests) == 1 and len(values) == 1:
            orig = origs[0].replace('[', ' ').replace('  ', '').replace('\\n', ' ')
            dest = dests[0].replace(']', ' ').replace('  ', '').replace('\\n', ' ')
            valeur = values[0].replace('[', '').replace(']', '')
            return True, [orig, dest, valeur]
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
        // This line sets a custom gray color:\n\
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
    if (lst[0] == 'w'):
        obj['size_width'] = lst[1]
    elif (lst[0] == 'h'):
        obj['size_height'] = lst[1]


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
    if (lst[0] == 'l'):
        obj['margin_left'] = lst[1]
    elif (lst[0] == 'r'):
        obj['margin_right'] = lst[1]
    elif (lst[0] == 't'):
        obj['margin_top'] = lst[1]
    elif (lst[0] == 'b'):
        obj['margin_bottom'] = lst[1]


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
    if (lst[0] == 'color'):
        obj['bg_color'] = lst[1]
    elif (lst[0] == 'transparent'):
        obj['bg_transparent'] = lst[1]


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
    if (lst[0] == 'color'):
        obj['node_color'] = lst[1]
    elif (lst[0] == 'w'):
        obj['node_width'] = lst[1]
    elif (lst[0] == 'h'):
        obj['node_height'] = lst[1]
    elif (lst[0] == 'spacing'):
        obj['node_spacing'] = lst[1]
    elif (lst[0] == 'border'):
        obj['node_border'] = lst[1]
    elif (lst[0] == 'theme'):
        obj['node_theme'] = lst[1]
    elif (lst[0] == 'opacity'):
        obj['node_opacity'] = lst[1]


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
    if (lst[0] == 'color'):
        obj['flow_color'] = lst[1]
    elif (lst[0] == 'inheritfrom'):
        obj['flow_inheritfrom'] = lst[1]
    elif (lst[0] == 'opacity'):
        obj['flow_opacity'] = lst[1]
    elif (lst[0] == 'curvature'):
        obj['flow_curvature'] = lst[1]


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
    if (lst[0] == 'order'):
        obj['layout_order'] = lst[1]
    elif (lst[0] == 'justifyorigins'):
        obj['layout_justifyorigins'] = lst[1]
    elif (lst[0] == 'justifyends'):
        obj['layout_justifyends'] = lst[1]
    elif (lst[0] == 'reversegraph'):
        obj['layout_reversegraph'] = lst[1]
    elif (lst[0] == 'attachincompletesto'):
        obj['layout_attachincompletesto'] = lst[1]


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
    if (lst[0] == 'color'):
        obj['labels_color'] = lst[1]
    elif (lst[0] == 'hide'):
        obj['labels_hide'] = lst[1]
    elif (lst[0] == 'highlight'):
        obj['labels_highlight'] = lst[1]
    elif (lst[0] == 'fontface'):
        obj['labels_fontface'] = lst[1]
    elif (lst[0] == 'linespacing'):
        obj['labels_linespacing'] = lst[1]
    elif (lst[0] == 'relativesize'):
        obj['labels_relativesize'] = lst[1]
    elif (lst[0] == 'magnify'):
        obj['labels_magnify'] = lst[1]


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
    if (lst[0] == 'appears'):
        obj['label_name_appears'] = lst[1]
    elif (lst[0] == 'size'):
        obj['label_name_size'] = lst[1]
    elif (lst[0] == 'weight'):
        obj['label_name_weight'] = lst[1]


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
    if (lst[0] == 'appears'):
        obj['label_value_appears'] = lst[1]
    elif (lst[0] == 'fullprecision'):
        obj['label_value_fullprecision'] = lst[1]
    elif (lst[0] == 'position'):
        obj['label_value_position'] = lst[1]
    elif (lst[0] == 'weight'):
        obj['label_value_weight'] = lst[1]


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
    if (lst[0] == 'autoalign'):
        obj['label_position_autoalign'] = lst[1]
    elif (lst[0] == 'scheme'):
        obj['label_position_scheme'] = lst[1]
    elif (lst[0] == 'first'):
        obj['label_position_first'] = lst[1]
    elif (lst[0] == 'breakpoint'):
        obj['label_position_breakpoint'] = lst[1]


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
    if (lst[0] == 'format'):
        obj['value_format'] = lst[1]
    elif (lst[0] == 'prefix'):
        obj['value_prefix'] = lst[1]
    elif (lst[0] == 'suffix'):
        obj['value_suffix'] = lst[1]


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
    if (lst[0] == 'a'):
        obj['theme_a'] = lst[1]
    elif (lst[0] == 'b'):
        obj['theme_b'] = lst[1]
    elif (lst[0] == 'c'):
        obj['theme_c'] = lst[1]
    elif (lst[0] == 'd'):
        obj['theme_d'] = lst[1]


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
    if (lst[0] == 'mentionsankeymatic'):
        obj['meta_mentionsankeymatic'] = lst[1]
    elif (lst[0] == 'listimbalances'):
        obj['meta_listimbalances'] = lst[1]


"""
Dict contianing token & setting parser,
 it use the parser for each subgroup of setting (node attributes, flow attributes, layout ... )
"""
dict_setting_keyword = {
    "size": {'token': False, 'parser': parse_setting_line_size},
    "margin": {'token': False, 'parser': parse_setting_line_margin},
    "bg": {'token': False, 'parser': parse_setting_line_bg},
    "node": {'token': False, 'parser': parse_setting_line_node},
    "flow": {'token': False, 'parser': parse_setting_line_flow},
    "layout": {'token': False, 'parser': parse_setting_line_layout},
    "labels": {'token': False, 'parser': parse_setting_line_labels},
    "labelname": {'token': False, 'parser': parse_setting_line_label_name},
    "labelvalue": {'token': False, 'parser': parse_setting_line_label_value},
    "labelposition": {'token': False, 'parser': parse_setting_line_label_position},
    "value": {'token': False, 'parser': parse_setting_line_value},
    "themeoffset": {'token': False, 'parser': parse_setting_line_themeoffset},
    "meta": {'token': False, 'parser': parse_setting_line_meta}
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


if __name__ == '__main__':
    test_parse_sankeymatic_flow()
    test_parse_sankeymatic_node_color()
    test_parse_sankeymatic_flows()
    test_parse_sankeymatic_setting()
