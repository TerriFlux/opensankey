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
                    'display_value': 'default',
                    'color': row['colors']
                }
            )
        break
    return sankey_dict

def parse_conversions_sheet(
    excel_file,
    params_dict
):
    tooltip_names = []
    units_names = []
    nodes2tooltips = {}
    nodes2units_conv = {}
    nodes2natural_unit = {}
    if 'Conversions' not in excel_file.sheet_names:
        return tooltip_names, units_names, nodes2tooltips, nodes2units_conv, nodes2natural_unit
    conversion_sheet = pd.read_excel(excel_file, 'Conversions')
    columns = conversion_sheet.columns.tolist()
    
    try:
        natural_unit_col = conversion_sheet.columns.get_loc("Unité naturelle")
    except Exception as excpt:
        return tooltip_names, units_names, nodes2tooltips, nodes2units_conv, nodes2natural_unit


    tmp = np.where(conversion_sheet.iloc[:, 0].isnull().values == True)
    tmp2 = tmp[0]
    if tmp2.shape[0] == 0:
        idx_first_empty_row = len(conversion_sheet)
    else:
        idx_first_empty_row = np.where(conversion_sheet.iloc[:, 0].isnull().values == True)[0][0]

    # pct_cols = conversion_sheet.columns.str.contains('%')
    # # pct_cols = pct_cols.nonzero()[0]
    # pct_cols = conversion_sheet.columns[pct_cols]
    # conversion_sheet[pct_cols] = str(conversion_sheet[pct_cols]*100)+'%'

    for col in range(3, natural_unit_col):
        tooltip_names.append(columns[col])
         
    unit_eq = params_dict['Unité Equivalente']
    units_names = [unit_eq,'natural']
    for col in range(natural_unit_col+3, conversion_sheet.shape[1]):
        if 'Unnamed' in columns[col]:
            continue
        denominator = columns[col].split('/')[1].strip()
        if denominator != unit_eq:
            continue
        unit_name = columns[col].split('/')[0].strip()

        units_names.append(unit_name.replace('1000','k'))    

    humidity_col = 3
    for i in range(1, idx_first_empty_row):
        location = conversion_sheet.iat[i, 0]
        product_name = conversion_sheet.iat[i, 1]
        tooltips = []
        humidity =  type(conversion_sheet.iloc[i, humidity_col]) == str and 'humid' in conversion_sheet.iloc[i, humidity_col]
        for col in range(3, natural_unit_col):
            val = conversion_sheet.iloc[i, col]
            if type(val) != str and math.isnan(val):
                tooltips.append(None)
            else:
                tooltips.append(val)

        units_conv = [1,conversion_sheet.iat[i, natural_unit_col+2]]
        for col in range(natural_unit_col+3, conversion_sheet.shape[1]):
            if 'Unnamed' in columns[col]:
                continue
            denominator = columns[col].split('/')[1].strip()
            if denominator != unit_eq:
                continue
            val = conversion_sheet.iat[i, col]
            if type(val) == str and 'PCI' in val and not humidity:
                units_conv.append(None)
            if type(val) != str and math.isnan(val):
                units_conv.append(None)
            else:
                units_conv.append(val)
        try:
            nodes2tooltips[location+'/'+product_name] = tooltips
            nodes2units_conv[location+'/'+product_name] = units_conv
            if conversion_sheet.iat[i, natural_unit_col] == 't' or conversion_sheet.iat[i, natural_unit_col] == '1000 t':
                conversion_sheet.iat[i, natural_unit_col] = conversion_sheet.iat[i, natural_unit_col].replace('t','tonne')
            nodes2natural_unit[location+'/'+product_name] = conversion_sheet.iat[i, natural_unit_col].replace('1000','k')            
        except Exception as excpt:
            break

    return tooltip_names, units_names, nodes2tooltips, nodes2units_conv, nodes2natural_unit


def parse_excel_nodes(
    wb,
    product_or_sector: str,
    indent: int = None
):
    cols = [
        'Level', 'Element', 'Bilan matière ?', 'Donnée transport inter-regional ?',
        'Poids consolidation', 'Table Emplois ou Ressources', 'Sankey ?', 'Couleur', "Sous-Filières"
    ]
    if product_or_sector == 'produits':
        matching_product_sheet = [s.strip() for s in wb.sheet_names if "produits" in s.lower()]
        if len(matching_product_sheet) == 0:
            matching_product_sheet = [s.strip() for s in wb.sheet_names if "products" in s.lower()]
        if len(matching_product_sheet) == 0:
            return
        ws = pd.read_excel(wb, matching_product_sheet[0])
        le_type = 'product'
    else:
        matching_product_sheet = [s.strip() for s in wb.sheet_names if "secteurs" in s.lower()]
        if len(matching_product_sheet) == 0:
            matching_product_sheet = [s.strip() for s in wb.sheet_names if "sectors" in s.lower()]
        if len(matching_product_sheet) == 0:
            return
        ws = pd.read_excel(wb, matching_product_sheet[0])
        le_type = 'sector'
    the_nodes = []
    the_nodes_dict = {}
    subchains = []
    value_node2display_node = {}
    node2agregate_node = {}
    if indent is None:
        id = 0
    else:
        id = indent

    for i in range(ws.shape[0]):
        name = ws.iat[i, cols.index('Element')].strip()
        if name in the_nodes_dict:
            if ws.iat[i, cols.index('Sankey ?')] != 1 and ws.iat[i, cols.index('Level')] != 1:
                other_display_node_found = False
                j = i
                previous_level = ws.iat[i, cols.index('Level')]
                while not other_display_node_found:
                    j = j-1
                    if ws.iat[j, cols.index('Sankey ?')] == 1 and \
                            ws.iat[j, cols.index('Level')] < ws.iat[i, cols.index('Level')]:
                        display_node_found = True
                        node2agregate_node[name] = ws.iat[j, cols.index('Element')].strip()
                    elif ws.iat[j, cols.index('Level')] == 1:
                        break 
                    previous_level = ws.iat[j, cols.index('Level')]
                    if ws.iat[j-1, cols.index('Sankey ?')] == 1 and ws.iat[j-1, cols.index('Level')] == previous_level:
                        break
            continue
        j = i
        if ws.iat[i, cols.index('Sankey ?')] == 1:
            new_node = {}
            try:
                color = ws.iat[i, cols.index('Couleur')]
                if type(color) != str and math.isnan(color):
                    color = 'grey'
                new_node['color'] = color
            except Exception:
                new_node['color'] = 'grey'
            new_node['id'] = id
            new_node['name'] = name
            new_node['type'] = le_type
            new_node['visible'] = 1
            try:
                new_node['subchain'] = ws.iat[i, cols.index('Sous-Filières')]
                if type(new_node['subchain']) != str and math.isnan(new_node['subchain']):
                    new_node['subchain'] = ''
            except Exception:
                new_node['subchain'] = ''
            if type(new_node['subchain']) == str:
                subchain_list = new_node['subchain'].split(',')
                for subchain in subchain_list:
                    if subchain not in subchains:
                        subchains.append(subchain)
            the_nodes.append(new_node)
            the_nodes_dict[name] = new_node
            id += 1
            if ws.iat[i, cols.index('Level')] != 1:
                other_display_node_found = False
                j = i
                previous_level = ws.iat[i, cols.index('Level')]
                while not other_display_node_found:
                    j = j-1
                    if ws.iat[j, cols.index('Sankey ?')] == 1 and \
                            ws.iat[j, cols.index('Level')] < ws.iat[i, cols.index('Level')] :
                        node2agregate_node[name] = ws.iat[j, cols.index('Element')].strip()
                        other_display_node_found = True
                    elif ws.iat[j, cols.index('Level')] == 1:
                        break 
                    previous_level = ws.iat[j, cols.index('Level')]
                    # if ws.iat[j-1, cols.index('Sankey ?')] == 1 and ws.iat[j-1, cols.index('Level')] == previous_level:
                    #     break
                    if ws.iat[j, cols.index('Level')] < ws.iat[i, cols.index('Level')]:
                        break     
        elif name not in the_nodes_dict and ws.iat[i, cols.index('Level')] != 1 and math.isnan(ws.iat[j, cols.index('Poids consolidation')]):
            display_node_found = False
            j = i
            while not display_node_found:
                j = j-1
                if ws.iat[j, cols.index('Sankey ?')] == 1 and \
                        ws.iat[j, cols.index('Level')] < ws.iat[i, cols.index('Level')]:
                    value_node2display_node[name] = ws.iat[j, cols.index('Element')].strip()
                    display_node_found = True
                elif ws.iat[j, cols.index('Level')] == 1:
                    break

        #     if i<ws.max_row and
        #         ws[str_coord(i, cols.index('Level')+1)].value < ws[str_coord(i+1, cols.index('Level')+1)].value:
        #         continue
        #     new_node = {}
        #     new_node['id'] = id
        #     new_node['color'] = 'grey' if le_type == 'sector' else 'lightblue'
        #     new_node['name'] = name
        #     new_node['type'] = le_type
        #     new_node['visible'] = 1
        #     the_nodes.append(new_node)
        #     the_nodes_dict[name] = new_node
        #     id += 1
    error = ''
    if len(the_nodes) == 0:
        error = "Pas de colonne sankey dans les tab produits et secteurs"
    return error, the_nodes, the_nodes_dict, value_node2display_node, subchains, node2agregate_node


# EXTRACT FUNCTION___________________________________________________
def parse_output_excel_data(
    filepath
):
    excel_file = pd.ExcelFile(filepath)
    error, nodes, links, subchains, data_links_dict,trade = parse_input_excel_data(excel_file)


    ws = None
    for sheet_name in ['result liste full', 'result liste', 'Results', 'Résultats']:
        for xl_sheet_name in excel_file.sheet_names:
            if sheet_name in xl_sheet_name:
                ws = pd.read_excel(excel_file, xl_sheet_name)
                break
        if ws is not None:
            break
    if ws is None:
        return "no tab result liste full or result liste or Results", {}, {},None,None,None,None,None,None

    has_period = ws.columns[0] == 'period'
    #has_period = not type(ws[ws.columns[1]][0] ) == str and math.isnan(ws[ws.columns[1]][0])

    reg_col = 1
    if has_period:
      reg_col = 2       

    reg = ws.columns[reg_col] == 'region' or ws.columns[reg_col] == 'région'
    if reg:
        cols = [
            'period','id', 'region', 'table', 'produit', 'secteur', 'origine', 'destination', 'valeur in', 'sigma in',
            'sigma in %', 'min in', 'max in', 'valeur out', 'nb_sigmas', 'Ai', 'free min', 'free max', 'classif',
            'MC mu in', 'MC std in', 'MC mu', 'MC std',	 'MC min', 'MC max', 'MC p0', 'MC p5', 'MC p10', 'MC p20',
            'MC p30',	'MC p40', 'MC p50', 'MC p60', 'MC p70', 'MC p80', 'MC p90',	'MC p95', 'MC p100',
            'MC hist0',	'MC hist1',	'MC hist2',	'MC hist3',	'MC hist4',	'MC hist5',	'MC hist6',	'MC hist7',
            'MC hist8',	'MC hist9'
        ]
    else:
        cols = [
            'period','id', 'table', 'produit', 'secteur', 'origine', 'destination', 'valeur in', 'sigma in', 'sigma in %',
            'min in', 'max in', 'valeur out', 'nb_sigmas', 'Ai', 'free min', 'free max', 'classif',
            'MC mu in', 'MC std in', 'MC mu', 'MC std',	 'MC min', 'MC max', 'MC p0', 'MC p5', 'MC p10', 'MC p20',
            'MC p30',	'MC p40', 'MC p50', 'MC p60', 'MC p70', 'MC p80', 'MC p90',	'MC p95', 'MC p100',
            'MC hist0',	'MC hist1',	'MC hist2',	'MC hist3',	'MC hist4',	'MC hist5',	'MC hist6',	'MC hist7',
            'MC hist8',	'MC hist9'
        ]
    if not has_period:
        cols.pop(0)

    region_names = np.array(['no_region'])
    if reg:
        region_names = ws[ws.columns[reg_col]].unique()

    constraints = parse_constraint_excel_data(excel_file,region_names)

    links = {}
    params_rows = {}
    matching_param_sheet = [s for s in excel_file.sheet_names if "param" in s]
    if len(matching_param_sheet) == 0:
        matching_param_sheet = [s for s in excel_file.sheet_names if "Param" in s]
    if len(matching_param_sheet) != 0:
        param_sheet = pd.read_excel(excel_file, matching_param_sheet[0])
        params_rows = param_sheet.values.tolist()

    params_dict = {
        'Import Export': None,
        'Flux Maximum': None,
        'Unité Equivalente': None
    }
    for row in params_rows:
        params_dict[row[0]] = row[1]

    if 'periods' in params_dict:
        new_region_names = np.array([])
        for region_name in region_names:
            period_array = params_dict['periods'].split(':')
            for period in period_array:
                new_region_names = np.append(new_region_names,period)
        region_names = new_region_names

    error, nodes, nodes_dict, value_node2display_node, subchains, node2agregate_node = parse_excel_nodes(
        excel_file, 'produits'
    )
    if len(error) != 0:
        return error, nodes, nodes_dict
    error, nodes2, nodes_dict2, value_node2display_node2, subchains, node2agregate_node2 = parse_excel_nodes(
        excel_file, 'secteurs', indent=len(nodes)
    )
    if len(error) != 0:
        return error, nodes, nodes_dict
    nodes += nodes2
    nodes_dict = {**nodes_dict, **nodes_dict2}
    value_node2display_node = {**value_node2display_node, **value_node2display_node2}
    node2agregate_node = {**node2agregate_node, **node2agregate_node2}

    # Units
    tooltip_names, units_names, nodes2tooltips, nodes2units_conv, nodes2natural_unit = parse_conversions_sheet(excel_file,params_dict)

    for node_name in nodes2units_conv:
        localisation = node_name.split('/')[0]
        # if localisation != 'Domestique':
        #     break
        product_node_name = node_name.split('/')[1]
        try:
            nodes_dict[product_node_name]['natural_unit'] = nodes2natural_unit[node_name]
            nodes_dict[product_node_name]['conv'] = nodes2units_conv[node_name]
            nodes_dict[product_node_name]['tooltips'] = nodes2tooltips[node_name]
        except Exception as expt:
            continue

    data_values_dict = {}
    links_dict = {}
    reg_name ="no_region"
    for region_name in region_names:
        links[region_name] = []
        links_dict[region_name] = {}
        data_values_dict[region_name] = {}

    id = 0

    mini = None

    #has_period = not type(ws[ws.columns[1]][0] ) == str and math.isnan(ws[ws.columns[1]][0])
    for i in range(ws.shape[0]):
        if reg:
            #if ws[ws.columns[1]][i] != reg_name:
            reg_name = ws[ws.columns[reg_col]][i]
            if has_period and not math.isnan(ws[ws.columns[0]][i]):
                period = ws[ws.columns[0]][i]
                reg_name = str(period)
            #links[reg_name] = []
        elif has_period:
            period = ws[ws.columns[0]][i]
            reg_name = 'no_region'
            if not math.isnan(period):
                reg_name = str(period)            


        source_name = ws.iat[i, cols.index('origine')]
        target_name = ws.iat[i, cols.index('destination')]

        root_input_val = ws.iat[i, cols.index('valeur in')]
        if (source_name+target_name) in constraints:
            root_input_constraint = str(constraints[source_name+target_name])+'%'

        ancestor = False
        if not math.isnan(root_input_val) or (source_name+target_name) in constraints:
            if source_name in value_node2display_node:
                ancestor = True
            if target_name in value_node2display_node:
                ancestor = True

        if source_name in nodes_dict.keys() and target_name in nodes_dict.keys():
            source = nodes_dict[source_name]
            target = nodes_dict[target_name]
            color = 'lightblue'
            if nodes_dict[source_name]['type'] == 'product':
                if 'color' in nodes_dict[source_name]:
                    color = nodes_dict[source_name]['color']
            else:
                if 'color' in nodes_dict[target_name]:
                    color = nodes_dict[target_name]['color']

            input_val = ws.iat[i, cols.index('valeur in')]
            if (source_name+target_name) in constraints:
                input_constraint = str(constraints[source_name+target_name])+'%'

            min_val = ws.iat[i, cols.index('min in')]
            if min_val > 0:
                pass
            if not math.isnan(input_val) and (source_name+target_name) in data_links_dict[reg_name]:
                try:
                    data_link = data_links_dict[reg_name][source_name+target_name]
                except Exception as excpt:
                    print(excpt)
                    continue
                try:
                    data_source = data_link['data_source']
                except Exception:
                    data_source = ''
                data_period = data_link['data_period']
                try:
                    natural_unit = data_link['natural_unit'].replace('1000','k')
                except Exception:
                    natural_unit = ''                 
            if not math.isnan(min_val) and min_val > 0 and (source_name+target_name) in data_links_dict[reg_name]:
                data_link = data_links_dict[reg_name][source_name+target_name]
                try:
                    data_source = data_link['data_source']
                except Exception:
                    data_source = ''
                data_period = data_link['data_period']
                try:
                    natural_unit = data_link['natural_unit'].replace('1000','k')
                except Exception:
                    natural_unit = ''

            if target_name in node2agregate_node:
                # flux is redirected to agregate node (bois sur pied->auto approvisionnement becomes
                # Prélevement->auto approvisionnement
                try:
                    conv = nodes_dict[source_name]['conv']
                    natural_unit = nodes_dict[source_name]['natural_unit']
                    source_name =  node2agregate_node[target_name]
                    source = nodes_dict[source_name]
                    source['conv'] = conv
                    source['natural_unit'] = natural_unit
                    #source['tooltips'] = tooltips
                except Exception as excpt:
                   pass
            # elif source_name in node2agregate_node.values():
            #     # do not duplicate flux
            #     # the flux starts from the children (example:Prélevements->exploitation forestiére)
            #     continue
            if type(source['subchain']) == str and type(target['subchain']) == str:
                source_subchains = source['subchain'].split(',')
                target_subchains = target['subchain'].split(',')
                link_subchains = list(set(source_subchains) | set(target_subchains))
            #source_id = source['id']
            #target_id = target['id']
            val = ws.iat[i, cols.index('valeur out')]

            if val <= 0:
                val = 0
            if cols.index('MC max') < len(ws.columns):
                mini = ws.iat[i, cols.index('MC min')]
                maxi = ws.iat[i, cols.index('MC max')]
            classif = ws.iat[i, cols.index('classif')]

            new_link = {}
            #new_link['id'] = id
            if not math.isnan(input_val) and \
                ((source_name+target_name) in data_links_dict[reg_name] or \
                     (ws.iat[i, cols.index('origine')]+target_name) in data_links_dict[reg_name]):
                new_link['data'] = True
                if input_val >= 1:
                   new_link['agregated_data_value'] = round(input_val)
                   new_link['data_value'] = [round(input_val)]
                else:
                   new_link['agregated_data_value'] = round(input_val,1)
                   new_link['data_value'] = [round(input_val,1)]                
                new_link['data_source'] = data_source
                new_link['data_period'] = data_period
                new_link['natural_unit'] = natural_unit
            elif not math.isnan(min_val) and min_val > 0 and (source_name+target_name) in data_links_dict[reg_name]:
                new_link['data'] = True
                new_link['data_value'] = round(min_val)
                new_link['data_source'] = data_source
                new_link['data_period'] = data_period
                new_link['natural_unit'] = natural_unit
            elif (source_name+target_name) in constraints:
                new_link['data'] = True
                new_link['data_constraint'] = [input_constraint]              
            else:
                new_link['data'] = False

            new_link['source_name'] = source_name
            new_link['target_name'] = target_name

            if (params_dict['Flux Maximum'] is not None) and val > params_dict['Flux Maximum']:
                new_link['value'] = round(params_dict['Flux Maximum'])
                new_link['display_value'] = round(val)
            else:
                if val >= 1:
                    new_link['value'] = round(val)
                else:
                    new_link['value'] = round(val,1)                    
                if not isinstance(classif, str):
                    new_link['display_value'] = 'default'
                elif 'libre' not in classif or 'unbounded' in classif:
                    new_link['display_value'] = 'default'
                else:
                    if round(ws.iat[i, cols.index('free min')]) == 0 and round(ws.iat[i, cols.index('free max')]) == 0:
                        new_link['display_value'] = 'default'
                    # elif not pd.isnull(mini):
                    #     new_link['display_value'] = \
                    #         '['+str(round(mini))+\
                    #         '...'+str(round(maxi))+']'
                    else:
                        new_link['display_value'] = \
                            '['+str(round(ws.iat[i, cols.index('free min')]))+\
                            '...'+str(round(ws.iat[i, cols.index('free max')]))+']'

            if isinstance(classif, str) and 'unbounded' in classif:
                new_link['unbounded'] = True
            else:
                new_link['unbounded'] = False                
            if type(source['subchain']) == str and type(target['subchain']) == str:
                new_link['subchain'] = ','.join(link_subchains)
            try:
                new_link['conv'] = source['conv']
                new_link['natural_unit'] = source['natural_unit']
                new_link['tooltips'] = source['tooltips']
            except Exception:
                try:
                    new_link['conv'] = target['conv']
                    new_link['natural_unit'] = target['natural_unit']
                    new_link['tooltips'] = target['tooltips']
                except Exception:
                    pass
            try:
                new_link['tooltip'] = source['tooltip']
            except Exception:
                try:
                    new_link['tooltip'] = target['tooltip']
                except Exception:
                    pass

            if not pd.isnull(mini):
                new_link['mini'] = round(mini)
                new_link['maxi'] = round(maxi)
            # else:
            #     new_link['mini'] = new_link['value']
            #     new_link['maxi'] = new_link['value']
            if isinstance(classif, str):
                new_link['classif'] = classif
            if type(color) != str and math.isnan(color):
                color = 'grey'
            new_link['color'] = color
            try:
                links[reg_name].append(new_link)
            except Exception:
                pass  
            id += 1
        elif ancestor:
            #new_link may not exist at this point
            constraint = False
            if (source_name+target_name) in constraints:
                constraint = True
            display_source_name = source_name
            display_target_name = target_name
            if source_name in value_node2display_node:
                display_source_name = value_node2display_node[source_name]
            if target_name in value_node2display_node:
                display_target_name = value_node2display_node[target_name]
            if display_source_name+display_target_name in data_values_dict[reg_name]:
                if not math.isnan(root_input_val):
                    data_values_dict[reg_name][display_source_name+display_target_name]['agregated_data_value'] += root_input_val
                    data_values_dict[reg_name][display_source_name+display_target_name]['data_value'].append(
                        source_name+'->'+target_name+': ' + str(root_input_val)
                    )
                if constraint and 'data_constraint' in data_values_dict[reg_name][display_source_name+display_target_name]:
                    data_values_dict[reg_name][display_source_name+display_target_name]['data_constraint'].append(target_name + ' ' + str(constraints[source_name+target_name]) + '%')
            else:
                data_values_dict[reg_name][display_source_name+display_target_name] = {}
                if not math.isnan(root_input_val):
                    data_values_dict[reg_name][display_source_name+display_target_name]['agregated_data_value'] = root_input_val
                    data_values_dict[reg_name][display_source_name+display_target_name]['data_value'] = []
                    data_values_dict[reg_name][display_source_name+display_target_name]['data_value'].append(source_name+'->'+target_name+': ' + str(root_input_val))
                elif constraint:
                    data_values_dict[reg_name][display_source_name+display_target_name]['data_constraint'] = []
                    data_values_dict[reg_name][display_source_name+display_target_name]['data_constraint'].append(target_name + ' ' + str(constraints[source_name+target_name]) + '%')
                if (source_name+target_name) in data_links_dict[reg_name]:
                    if 'natural_unit' in  data_links_dict[reg_name][source_name+target_name]:
                        data_values_dict[reg_name][display_target_name+display_target_name]['natural_unit'] = data_links_dict[reg_name][source_name+target_name]['natural_unit']
                    if 'data_source' in  data_links_dict[reg_name][source_name+target_name]:
                        data_values_dict[reg_name][display_target_name+display_target_name]['data_source'] = data_links_dict[reg_name][source_name+target_name]['data_source']
                    if 'data_period' in data_links_dict[reg_name][source_name+target_name]:
                        data_values_dict[reg_name][display_target_name+display_target_name]['data_period'] = data_links_dict[reg_name][source_name+target_name]['data_period']

    for region_name in region_names:
        for i in range(len(links[region_name])):
            link = links[region_name][i]
            if not link['data']:
                if link['source_name']+link['target_name'] in data_values_dict[region_name]:
                    link['data'] = True
                    if 'data_value' in data_values_dict[region_name][link['source_name']+link['target_name']]:
                        link['data_value'] = data_values_dict[region_name][link['source_name']+link['target_name']]['data_value']
                    if 'agregated_data_value' in data_values_dict[region_name][link['source_name']+link['target_name']]:
                        link['agregated_data_value'] = data_values_dict[region_name][link['source_name']+link['target_name']]['agregated_data_value']
                    if 'natural_unit' in data_values_dict[region_name][link['source_name']+link['target_name']]:
                        link['natural_unit'] = data_values_dict[region_name][link['source_name']+link['target_name']]['natural_unit']
                    if 'data_source' in data_values_dict[region_name][link['source_name']+link['target_name']]:
                        link['data_source'] = data_values_dict[region_name][link['source_name']+link['target_name']]['data_source']
                    if 'data_period' in data_values_dict[region_name][link['source_name']+link['target_name']]:
                        link['data_period'] = data_values_dict[region_name][link['source_name']+link['target_name']]['data_period']
                    if 'data_constraint' in data_values_dict[region_name][link['source_name']+link['target_name']]:
                        link['data_constraint'] = data_values_dict[region_name][link['source_name']+link['target_name']]['data_constraint']

    return error, nodes, links, subchains, tooltip_names, units_names,\
         nodes2tooltips, nodes2units_conv, params_dict['Import Export'],'periods' in params_dict


def parse_input_excel_data(
    excel_file
):
    #excel_file = pd.ExcelFile(filepath)
    ws_data = None
    for sheet_name in ['donn', 'data']:
        for xl_sheet_name in excel_file.sheet_names:
            if sheet_name in xl_sheet_name.lower():
                ws_data = pd.read_excel(excel_file, xl_sheet_name)
                break
        if ws_data is not None:
            break
    if ws_data is None:
        return "no tab données or data", {}, {},'',{},{}

    ws_min_max = None
    for sheet_name in ['min max','min_max']:
        for xl_sheet_name in excel_file.sheet_names:
            if sheet_name in xl_sheet_name.lower() and 'ter' not in xl_sheet_name.lower():
                ws_min_max = pd.read_excel(excel_file, xl_sheet_name)
                break
        if ws_min_max is not None:
            break

    params_rows = {}
    matching_param_sheet = [s for s in excel_file.sheet_names if "param" in s]
    if len(matching_param_sheet) == 0:
        matching_param_sheet = [s for s in excel_file.sheet_names if "Param" in s]
    if len(matching_param_sheet) != 0:
        param_sheet = pd.read_excel(excel_file, matching_param_sheet[0])
        params_rows = param_sheet.values.tolist()

    params_dict = {
        'Import Export': None,
        'Flux Maximum': None
    }
    for row in params_rows:
        params_dict[row[0]] = row[1]

    region_names = np.array(['no_region'])
    reg = ws_data.columns[1] == 'region' or ws_data.columns[1] == 'région'
    reg_name = 'no_region'
    if reg:
        region_names = ws_data[ws_data.columns[1]].unique()
        if len(region_names) == 1:
            reg = False
            region_names = np.array(['no_region'])
    if 'periods' in params_dict:
        new_region_names = np.array([])
        for region_name in region_names:
            period_array = params_dict['periods'].split(':')
            for period in period_array:
                new_region_names = np.append(new_region_names,period)
        region_names = new_region_names


    cols_data = [
        'period', 'region', 'table', 'origin', 'destination', 'value',
        'uncert', 'constraint', 'quantity', 'unit', 'factor', 'source'
    ]
    cols_min_max = [
        'period', 'region', 'table', 'origin', 'destination', 'min',
        'max', 'min unit', 'max unit', 'unit', 'factor', 'source'
    ]

    links = {}

    error, nodes, nodes_dict, value_node2display_node, subchains, _ = parse_excel_nodes(
        excel_file, 'produits'
    )
    if len(error) != 0:
        return error, nodes, nodes_dict,'',{},params_dict['Import Export']
    error, nodes2, nodes_dict2, value_node2display_node2, subchains, _ = parse_excel_nodes(
        excel_file, 'secteurs', indent=len(nodes)
    )
    if len(error) != 0:
        return error, nodes, nodes_dict,'',{},params_dict['Import Export']
    nodes += nodes2
    nodes_dict = {**nodes_dict, **nodes_dict2}
    value_node2display_node = {**value_node2display_node, **value_node2display_node2}

    links_dict = {}
    for region_name in region_names:
        links[region_name] = []
        links_dict[region_name] = {}
    id = 0
    error = []

    col_name = ws_data.columns[cols_data.index('value')]
    nb_nan = ws_data[col_name].isnull().sum()
    all_nan = False
    if nb_nan == ws_data.shape[0]:
        all_nan = True

    for i in range(ws_data.shape[0]):
        if reg:
            #if ws[ws.columns[1]][i] != reg_name:
            reg_name = ws_data[ws_data.columns[1]][i]
            if 'periods' in params_dict:
                period = ws_data[ws_data.columns[0]][i]
                reg_name = reg_name + ' ' + str(period)
            #links[reg_name] = []
        elif 'periods' in params_dict:
            period = ws_data[ws_data.columns[0]][i]
            reg_name = str(period)      

        source_name = ws_data.iat[i, cols_data.index('origin')]
        target_name = ws_data.iat[i, cols_data.index('destination')]
        if source_name in value_node2display_node:
            source_name = value_node2display_node[source_name]
        if target_name in value_node2display_node:
            target_name = value_node2display_node[target_name]

        # data which are not displayed in sankey diagram
        if source_name not in nodes_dict:
            #error.append(source_name + ' not defined')
            continue
        if target_name not in nodes_dict:
            #error.append(target_name + ' not defined')
            continue

        source = nodes_dict[source_name]
        target = nodes_dict[target_name]
        if type(source['subchain']) == str and type(target['subchain']) == str:
            source_subchains = source['subchain'].split(',')
            target_subchains = target['subchain'].split(',')
            link_subchains = list(set(source_subchains) | set(target_subchains))

        if not all_nan:
            val = ws_data.iat[i, cols_data.index('value')]
            # subchain = ws_data.iat[i,cols_data.index('subchain')]
            if math.isnan(val):
                val = 1
            # if val < 0:
            #     continue

        color = 'lightblue'
        if nodes_dict[source_name]['type'] == 'product':
            if 'color' in nodes_dict[source_name]:
                color = nodes_dict[source_name]['color']
        else:
            if 'color' in nodes_dict[target_name]:
                color = nodes_dict[target_name]['color']
        if source_name+target_name not in links_dict[reg_name]:
            new_link = {}
            #new_link['id'] = id
            new_link['source_name'] = source_name
            new_link['target_name'] = target_name
            #new_link['source'] = source['id']
            #new_link['target'] = target['id']
            if not all_nan:
                if val >= 1:
                    new_link['value'] = round(val)
                else:
                    new_link['value'] = round(val,1)
            else:
                new_link['value'] = 1
                new_link['label_visible'] = False

            #new_link['mini'] = new_link['value']
            #new_link['maxi'] = new_link['value']
            new_link['display_value'] = 'default'
            try:
                new_link['natural_unit'] = ws_data.iat[i, cols_data.index('unit')].replace('1000','k')
            except Exception:
                pass            
            if type(color) != str and math.isnan(color):
                color = 'grey'
            new_link['color'] = color
            if type(source['subchain']) == str and  type(target['subchain']) == str:
                new_link['subchain'] = ','.join(link_subchains)
            new_link['data_period'] = str(ws_data.iat[i, cols_data.index('period')])
            try:
                new_link['data_source'] = str(ws_data.iat[i, cols_data.index('source')])
            except Exception:
                pass
            links_dict[reg_name][source_name+target_name] = new_link
            links[region_name].append(new_link)
            id += 1
        else:
            if not all_nan:
                try:
                    new_link['value'] += round(val)
                except Exception:
                    pass

    #if ws_min_max is None:
    return error, nodes, links, subchains, links_dict, params_dict['Import Export']
        
    # for i in range(ws_min_max.shape[0]):
    #     if reg:
    #         if ws_min_max[ws_min_max.columns[1]][i] != reg_name:
    #             reg_name = ws_min_max[ws_min_max.columns[1]][i]
    #             links[reg_name] = []
    #     source_name = ws_min_max.iat[i, cols_min_max.index('origin')]
    #     target_name = ws_min_max.iat[i, cols_min_max.index('destination')]
    #     if source_name in value_node2display_node:
    #         source_name = value_node2display_node[source_name]
    #     if target_name in value_node2display_node:
    #         target_name = value_node2display_node[target_name]

    #     if source_name not in nodes_dict:
    #         error.append(source_name + ' not defined')
    #         continue
    #     if target_name not in nodes_dict:
    #         error.append(target_name + ' not defined')
    #         continue
    #     source = nodes_dict[source_name]
    #     target = nodes_dict[target_name]
    #     if type(source['subchain']) == str:
    #         source_subchains = source['subchain'].split(',')
    #         target_subchains = target['subchain'].split(',')
    #         link_subchains = list(set(source_subchains) & set(target_subchains))

    #     val = ws_min_max.iat[i, cols_min_max.index('min')]
    #     # subchain = ws_data.iat[i,cols_data.index('subchain')]
    #     if val <= 0:
    #         continue
    #     color = 'lightblue'
    #     if nodes_dict[source_name]['type'] == 'product':
    #         if 'color' in nodes_dict[source_name]:
    #             color = nodes_dict[source_name]['color']
    #     else:
    #         if 'color' in nodes_dict[target_name]:
    #             color = nodes_dict[target_name]['color']
    #     if source_name+target_name not in links_dict:
    #         new_link = {}
    #         new_link['id'] = id
    #         new_link['source_name'] = source_name
    #         new_link['target_name'] = target_name
    #         new_link['source'] = source['id']
    #         new_link['target'] = target['id']
    #         if val >= 1:
    #             new_link['value'] = round(val)
    #         else:
    #             new_link['value'] = round(val,1)
    #         new_link['mini'] = new_link['value']
    #         new_link['maxi'] = new_link['value']
    #         new_link['display_value'] = 'default'
    #         try:
    #             new_link['natural_unit'] = ws_min_max.iat[i, cols_min_max.index('unit')].replace('1000','k')
    #         except Exception:
    #             pass            
    #         new_link['color'] = color
    #         if type(source['subchain']) == str:
    #             new_link['subchain'] = ','.join(link_subchains)

    #         new_link['data_period'] = str(ws_min_max.iat[i, cols_min_max.index('period')])
    #         try:
    #             new_link['data_source'] = str(ws_min_max.iat[i, cols_min_max.index('source')])
    #         except Exception:
    #             pass
    #         links_dict[source_name+target_name] = new_link
    #         links[reg_name].append(new_link)
    #         id += 1
    #     else:
    #         if val >= 1:
    #             new_link['value'] += round(val)
    #         else:
    #             new_link['value'] += round(val,1)
    # return error, nodes, links, subchains, links_dict, params_dict['Import Export']

def parse_constraint_excel_data(
    excel_file,
    region_names
):
    #excel_file = pd.ExcelFile(filepath)
    ws_constraint = None
    for sheet_name in ['contr', 'cnstr']:
        for xl_sheet_name in excel_file.sheet_names:
            if sheet_name in xl_sheet_name.lower():
                ws_constraint = pd.read_excel(excel_file, xl_sheet_name)
                break
        if ws_constraint is not None:
            break
    if ws_constraint is None:
        return "no tab constraint"

    cols_data = [
        'id', 'period', 'region', 'table', 'origin', 'destination', 'eq', 'ineq_inf', 'ineq_sup','tmp','sankey'
    ]

    constraints = []
    prev_id = -1
    for i in range(ws_constraint.shape[0]):
        id = ws_constraint.iat[i, cols_data.index('id')]
        if id != prev_id:
            if ws_constraint.shape[1]-1 < cols_data.index('sankey'):
                continue
            sankey = ws_constraint.iat[i, cols_data.index('sankey')]
            if sankey == 0:
                continue
            constraint = []
            constraints.append(constraint)
        # else:
        #     constraint = constraints[len(constraints)-1]         
        constraint.append([ 
            ws_constraint.iat[i, cols_data.index('period')],
            ws_constraint.iat[i, cols_data.index('region')],   
            ws_constraint.iat[i, cols_data.index('origin')],
            ws_constraint.iat[i, cols_data.index('destination')],
            ws_constraint.iat[i, cols_data.index('eq')],
            ws_constraint.iat[i, cols_data.index('ineq_inf')],
            ws_constraint.iat[i, cols_data.index('ineq_sup')]
        ])
        prev_id = id

    constraint_percentages = {}
    for i in range(len(constraints)):
        nb_positive = 0
        constraint = constraints[i]
        for j in range(len(constraint)):
            if constraint[j][4] > 0:
                nb_positive = nb_positive+1
                if nb_positive > 1:
                    break
        
        constraint_sum_idx = 0
        for j in range(len(constraint)):
            if constraint[j][4] > 0 and nb_positive == 1:
                constraint_sum_idx = j
                break
            if constraint[j][4] < 0 and nb_positive > 1:
                constraint_sum_idx = j
                break

        for j in range(len(constraint)):
            if j == constraint_sum_idx:
                continue
            constraint_percentages[constraint[j][2]+constraint[j][3]] = round(abs(constraint[constraint_sum_idx][4]/constraint[j][4])*100,1)

    return constraint_percentages