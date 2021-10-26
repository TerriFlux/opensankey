import pandas as pd
import numpy as np
import math

def parse_sankey_energie_csv(
    csv_file
):
    csv_data = pd.read_csv(
        csv_file,
        delimiter=';', encoding='latin-1'
    )
    sankey_dict = {}
    nodes_names = np.unique(np.hstack((csv_data['source'], csv_data['target']))).tolist()
    for territory in csv_data['code_territoire'].unique():
        sankey_dict[territory] = {
            'nodes': [],
            'links': [],
        }
        territory_data = csv_data[csv_data['code_territoire'] == territory]
        for node_id, node_name in enumerate(nodes_names):
            sankey_dict[territory]['nodes'].append(
                {
                    'id': node_id,
                    'color': 'grey',
                    'name': node_name,
                    'type': 'product',
                    'orientation': 'vertical'
                }
            )
            id = 0
        for k, row in territory_data.iterrows():
            id = id+1
            source_name = row['source']
            target_name = row['target']
            sankey_dict[territory]['links']. append(
                {
                    'source_name': source_name,
                    'target_name': target_name,
                    'value': [round(row['value'], 1)],
                    'display_value': ['default'],
                    'color': row['colors']
                }
            )
        break
    return sankey_dict

def parse_simple_excel(
    filepath
):
    excel_file = pd.ExcelFile(filepath)
    nodes_cols = [
        'Level', 'Nodes', 'Color', 'Shape', 'Group'
    ]
    ws = pd.read_excel(excel_file, excel_file.sheet_names[0])

    nodes = []
    current_parent_level = 1
    previous_level = 1
    for i in range(ws.shape[0]):
        name = ws.iat[i, nodes_cols.index('Nodes')].strip()
        new_node = {
            'id'      : i,
            'name'    : name,
            'visible' : True,
            'type'    : 'sector'
        }
        color = 'grey'
        shape = 'rectangle'
        try:
            color = ws.iat[i, nodes_cols.index('Color')]
            shape = ws.iat[i, nodes_cols.index('Shape')]
            new_node['color'] = color
            if shape == 'rectangle' :
                new_node['type'] = 'sector' 
            else:
                new_node['type'] = 'product'
        except Exception:
            pass
        level = ws.iat[i, nodes_cols.index('Level')]
        if level > previous_level:
            current_node_parent = nodes[i-1]
            current_parent_level = previous_level
        if level > current_parent_level:
            new_node['parent_name'] = current_node_parent['name']
        previous_level = level
        nodes.append(new_node)

    flux_ws = pd.read_excel(excel_file, excel_file.sheet_names[1])
    flux_cols = [
        'Origin', 'Destination', 'Value'
    ]
    links = []
    for row in range(flux_ws.shape[0]):
        source_name = flux_ws.iat[row, flux_cols.index('Origin')]
        target_name = flux_ws.iat[row, flux_cols.index('Destination')]
        source_node = [n for n in nodes if n['name'] == source_name][0]
        target_node = [n for n in nodes if n['name'] == target_name][0] 
        if source_node['type'] == 'product':
            color = source_node['color']
        elif target_node['type'] == 'product':
            color = target_node['color']           
        links.append({
            'source_name' :  flux_ws.iat[row, flux_cols.index('Origin')],
            'target_name' :  flux_ws.iat[row, flux_cols.index('Destination')],
            'value'       : [flux_ws.iat[row, flux_cols.index('Value')]],
            'color'       : color
        })
    return nodes, links
