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

Auteur : Julien ALAPETITE
Date : /

Modifs : Vincent LE DOZE - 06/2023
"""

# External libs ---------------------------------------------------------------
import copy

# Local libs ------------------------------------------------------------------
import SankeyExcelParser.io_excel_constants as CONST_IO_XL

# Local modules ---------------------------------------------------------------
from SankeyExcelParser.classes.sankey import Sankey
from SankeyExcelParser.classes.sankey_utils.data import Data as SankeyData

# Constants -------------------------------------------------------------------
JSON_TO_IO_XL__TAGG_TYPES = {
    "dataTags": CONST_IO_XL.TAG_TYPE_DATA,
    "nodeTags": CONST_IO_XL.TAG_TYPE_NODE,
    "fluxTags": CONST_IO_XL.TAG_TYPE_FLUX,
    "levelTags": CONST_IO_XL.TAG_TYPE_LEVEL,
}

DEFAULT_LEVEL_TAGGS = ["Primaire"]


# Private Functions -----------------------------------------------------------
def _get_value_if_in_dict(dict, key):
    try:
        return dict[key]
    except Exception:
        return None


# Private Functions -----------------------------------------------------------
def _update_dict_if_value(dict, key, value):
    if value is not None:
        dict[key] = value


# Public Functions ------------------------------------------------------------
def extract_json_from_sankey(sankey: Sankey):
    """
    Convert a sankey json to a sankey object

    Parameters
    ----------
    :param sankey: Sankey as a python Sankey object
    :type sankey: Sankey

    Returns
    -------
    :return: Sankey as a Json dict
    :rtype: dict
    """
    # Parser object
    sankeyToJson = SankeyToJson()
    # Parse all tags -> data struct
    dataTags = {}
    nodeTags = {}
    levelTags = {}
    fluxTags = {}
    sankeyToJson.parse_tags(sankey, dataTags, nodeTags, levelTags, fluxTags)
    # Parser all nodes -> data struct
    nodes = {}
    sankeyToJson.parse_nodes(sankey, nodes, levelTags)
    # Parser all links -> data struct
    links = {}
    sankeyToJson.parse_links(sankey, links)
    # Return data struct
    return {
        "version": "1.0",
        "dataTags": dataTags,
        "nodeTags": nodeTags,
        "levelTags": levelTags,
        "fluxTags": fluxTags,
        "nodes": nodes,
        "links": links,
        "labels": {},
    }


def extract_sankey_from_json(sankey_json: dict):
    """
    Convert a sankey json to a sankey object

    Parameters
    ----------
    :param sankey_json: Sankey as a Json dict
    :type sankey_json: dict

    Returns
    -------
    :return: Sankey as a python Sankey object
    :rtype: Sankey
    """
    # Parser object
    jsonToSankey = JsonToSankey(sankey_json)
    jsonToSankey.run()
    return jsonToSankey.sankey


# Classes -------------------------------------------------------------------
class SankeyToJson(object):
    """
    Class created to ease the parsing process by permitting methods overloading.

    JSON struct is like that:
    {
        'version': str,
        'dataTags': {
            '<tag group name>': tagg_json,
            ...
        },
        'nodeTags': {
            '<tag group name>': tagg_json,
            ...
        },
        'fluxTags': {
            '<tag group name>': tagg_json,
            ...
        },

        'nodes': nodes_json,
        'links': links_json,
        'labels': {}
    }
    """

    def __init__(self):
        self.primary_level_id = None

    def parse_tags(
        self,
        sankey: Sankey,
        dataTags: dict,
        nodeTags: dict,
        levelTags: dict,
        fluxTags: dict,
    ):
        """
        Extract tags from sankey struct for json data format.

        Update Json with :
        {
            'dataTags': {
                '<tag group name>': tagg_json,
                ...
            },
            'nodeTags': {
                '<tag group name>': tagg_json,
                ...
            },
            'levelTags': {
                '<tag group name>': tagg_json,
                ...
            },
            'fluxTags': {
                '<tag group name>': tagg_json,
                ...
            }
        }

        Struct for tagg_json :
        {
            'name': str,
            'show_legend': bool,
            'tags': {
                '<tag name>': tag_json,
                ...
            }
            'banner': str,
            'activated': bool,
            'siblings': [str, ...]
        }

        Struct for tag_json :
        {
            'name': str
            'selected': bool
            'color': str (in hexa)
        }

        Parameters
        ----------
        :param sankey: Input sankey struct
        :type sankey: Sankey

        :param dataTags: data tags
        :type dataTags: dict (modified)

        :param nodeTags: node tags
        :type nodeTags: dict (modified)

        :param fluxTags: flux tags
        :type fluxTags: dict (modified)
        """
        # Go trough all tags
        for taggs_type, taggs in sankey.taggs.items():
            # Data tags parsing
            if taggs_type == CONST_IO_XL.TAG_TYPE_DATA:
                self._parse_data_tags(taggs, dataTags)
                continue
            # Node & level tags parsing
            if taggs_type == CONST_IO_XL.TAG_TYPE_NODE:
                self._parse_node_tags(taggs_type, taggs, nodeTags)
                continue
            if taggs_type == CONST_IO_XL.TAG_TYPE_FLUX:
                self._parse_flux_tags(taggs, fluxTags)
        # Dimension parsing
        self._parse_level_tags(sankey, levelTags)

    def _parse_data_tags(self, taggs, data_tags_json):
        """
        Extract nodes tags from dict of taggs to update json data format.

        Struct for data_tags_json :
        {
            'tag group name': tagg_json,
            ...
        }

        Struct for tagg_json :
        {
            'name': str,
            'show_legend': bool,
            'tags': {
                '<tag name>': tags_json,
                ...
            }
            'banner': str,
            'activated': bool,
            'siblings': [str, ...]
        }

        Struct for tags_json :
        {
            'name': str
            'selected': bool
            'color': str (in hexa)
        }

        Parameters
        ----------
        :param taggs: Input taggroups from sankey struct
        :type taggs: dict(tagg_name: tagg)

        :param data_tags_json: data tags json struct
        :type data_tags_json: dict (modified)
        """
        for tagg in taggs.values():
            # tags dict
            tags = {
                tag.name: {
                    "name": tag.name_unformatted,
                    "selected": False,
                    "color": tag.color_in_hex,
                }
                for tag in tagg.tags.values()
            }
            next(iter(tags.values()))["selected"] = True  # by default select first tag
            # tag group dict
            data_tags_json[tagg.name] = {
                "name": tagg.name_unformatted,
                "show_legend": tagg.has_palette,
                "is_unit": tagg.is_unit,
                "tags": tags,
                "banner": "one",
                "activated": True,
                "siblings": [],
            }

    def _parse_node_tags(self, taggs_type, taggs, node_tags_json):
        """
        Extract nodes tags from dict of taggs to update json data format.

        Struct for node_tags_json :
        {
            'tag group name': tagg_json,
            ...
        }

        Struct for tagg_json :
        {
            'name': str,
            'show_legend': bool,
            'tags': {
                '<tag name>': tags_json,
                ...
            }
            'banner': str,
            'activated': bool,
            'siblings': [str, ...]
        }

        Struct for tags_json :
        {
            'name': str
            'selected': bool
            'color': str (in hexa)
        }

        Parameters
        ----------
        :param taggs_type: Type of all taggroups from input taggs dict
        :type taggs_type: str

        :param taggs: Input taggroups from sankey struct
        :type taggs: dict(tagg_name: tagg)

        :param node_tags_json: nodes tags json struct
        :type node_tags_json: dict (modified)
        """
        for tagg in taggs.values():
            # tags dict
            tags = {
                tag.name: {
                    "name": tag.name_unformatted,
                    "selected": True,
                    "color": tag.color_in_hex,
                }
                for tag in tagg.tags.values()
            }
            # case level tag
            if taggs_type == CONST_IO_XL.TAG_TYPE_LEVEL:
                for tag in list(tags.values())[1:]:
                    tag["selected"] = False
            # Banner type
            banner = "multi"
            if tagg.name_unformatted == CONST_IO_XL.NODE_TYPE:
                banner = "none"
            # tag group dict
            # if there are antagonists_taggs only one can be selected
            activated = True
            for antagonists_tagg in tagg.antagonists_taggs:
                if antagonists_tagg.name in node_tags_json:
                    if node_tags_json[antagonists_tagg.name]["activated"]:
                        activated = False
                        break
            node_tags_json[tagg.name] = {
                "name": tagg.name_unformatted,
                "show_legend": tagg.has_palette,
                "tags": tags,
                "banner": banner,
                "activated": activated,
                "siblings": [anta_tagg.name for anta_tagg in tagg.antagonists_taggs],
            }

    def _parse_level_tags(self, sankey, level_tags_json):
        """
        Extract level tags from dict of taggs to update json data format.

        Struct for level_tags_json :
        {
            'tag group name': tagg_json,
            ...
        }

        Struct for tagg_json :
        {
            'name': str,
            'show_legend': bool,
            'tags': {
                '<tag name>': tags_json,
                ...
            }
            'banner': str,
            'activated': bool,
            'siblings': [str, ...]
        }

        Struct for tags_json :
        {
            'name': str
            'selected': bool
            'color': str (in hexa)
        }

        Parameters
        ----------
        :param sankey: Input sankey struct
        :type sankey: Sankey

        :param level_tags_json: nodes tags json struct
        :type level_tags_json: dict (modified)
        """
        unactivated_dimensions = []
        for i, dimension in enumerate(sankey.dimensions.values()):
            # Dimension infos
            tags = {
                str(level): {"name": str(level), "selected": level == 1, "color": ""}
                for level in range(1, dimension.depth + 1)
            }
            # Siblings
            siblings = [
                _
                for _ in sankey.dimensions.values()
                if (dimension.is_antagonist(_) and _ != dimension)
            ]
            unactivated_dimensions += siblings
            # Dimension dict
            level_tags_json[dimension.id] = {
                "name": dimension.name,
                "show_legend": False,
                "tags": tags,
                "banner": "level",
                "activated": dimension not in unactivated_dimensions,
                "siblings": [_.id for _ in siblings],
            }

    def _parse_flux_tags(self, taggs, flux_tags_json):
        """
        Extract flux tags from dict of taggs to update json data format.

        Struct for flux_tags_json :
        {
            'tag group name': tagg_json,
            ...
        }

        Struct for tagg_json :
        {
            'name': str,
            'show_legend': bool,
            'tags': {
                '<tag name>': tags_json,
                ...
            }
            'banner': str,
            'activated': bool,
            'siblings': []
        }

        Struct for tags_json :
        {
            'name': str
            'selected': bool
            'color': str (in hexa)
        }

        Parameters
        ----------
        :param taggs: Input taggroups from sankey struct
        :type taggs: dict(tagg_name: tagg)

        :param flux_tags_json: flux tags json struct
        :type flux_tags_json: dict (modified)
        """
        for tagg in taggs.values():
            # tags dict
            tags = {
                tag.name: {
                    "name": tag.name_unformatted,
                    "selected": True,
                    "color": tag.color_in_hex,
                }
                for tag in tagg.tags.values()
            }
            # Specific tags for reconcillation
            # TODO remove ?
            tagg_name = tagg.name
            if tagg_name == CONST_IO_XL.DATA_TYPE_LABEL:
                tagg_name = "flux_types"
                tags["initial_data"] = tags.pop(CONST_IO_XL.DATA_COLLECTED)
                tags["computed_data"] = tags.pop(CONST_IO_XL.DATA_COMPUTED)
            # tag group dict
            flux_tags_json[tagg_name] = {
                "name": tagg.name_unformatted,
                "show_legend": tagg.has_palette,
                "tags": tags,
                "banner": "multi",
                "activated": True,
                "siblings": [],
            }

    def parse_links(self, sankey: Sankey, links_with_datas_json: dict):
        """
        Extract links from sankey struct for json data format.

        Struct for *links_with_datas_json* :
        {
            '<id link>': *link_with_datas_json*,
            ...
        }

        Parameters
        ----------
        :param sankey: Input sankey object
        :type sankey: Sankey

        :param links_with_datas_json: links & data json struct
        :type links_with_datas_json: dict (modified)
        """
        # First create default datas struct
        default_data_strct = {
            "data_value": "",
            "value_option": None,
            "text_value": "",
            "tags": {},
            "extension": {},
        }
        # Add flux tag groups to default data structure
        for tagg in sankey.taggs[CONST_IO_XL.TAG_TYPE_FLUX].values():
            # Replace specific names
            tagg_name = tagg.name
            if tagg_name == CONST_IO_XL.DATA_TYPE_LABEL:
                tagg_name = "flux_types"
            # Update fluxtags struct
            default_data_strct["tags"][tagg_name] = []  # tag_name
        # Create the links json struct
        self._create_links_with_datas_json(
            sankey, default_data_strct, links_with_datas_json
        )

    def _create_links_with_datas_json(
        self, sankey: Sankey, default_data_json: dict, links_with_datas_json: dict
    ):
        """
        Extract all nodes from sankey object to update json data format.

        Struct for *links_with_datas_json* :
        {
            '<id link>': *link_with_datas_json*,
            ...
        }

        Parameters
        ----------
        :param sankey: Input sankey object
        :type sankey: Sankey

        :param default_data_json: data json struct inituialized but empty
        :type default_data_json: dict

        :param links_with_datas_json: links with datas json struct
        :type links_with_datas_json: dict (modified)
        """
        # Go trough all links
        for flux in sankey.flux.values():
            links_with_datas_json[flux.id] = self._create_link_with_datas_json(
                sankey, flux, default_data_json
            )

    def _create_link_with_datas_json(
        self,
        sankey: Sankey,
        flux,
        default_data_json: dict,
    ):
        """
        Extract a given node info from sankey object to update json data format.

        Struct for *link_with_datas_json* :
        {
            'idLink': str,
            'idSource': str,
            'idTarget': str,
            'value': datas_json
        }

        Parameters
        ----------
        :param sankey: Input sankey object
        :type sankey: Sankey

        :param flux: Input flux object
        :type flux: Sankey

        :param nodes: nodes json struct
        :type nodes: dict (modified)

        Returns
        -------
        :return: JSON struct as defined for *link_with_datas_json*
        :rtype: dict

        """
        # Initilialize datas struct
        datas_json = copy.deepcopy(default_data_json)
        for tagg in reversed(sankey.taggs[CONST_IO_XL.TAG_TYPE_DATA].values()):
            next_datas_strct = {}
            for tag in tagg.tags.values():
                next_datas_strct[tag.name] = copy.deepcopy(datas_json)
            datas_json = next_datas_strct
        # We use result data if present instead of simple data
        self._parse_datas_or_results(sankey, flux, default_data_json, datas_json)
        # Color of link : default = color of source node
        # color = flux.orig.color_in_hex
        # if flux.dest.has_specific_tag(CONST_IO_XL.NODE_TYPE, CONST_IO_XL.NODE_TYPE_PRODUCT):
        #     color = flux.dest.color_in_hex
        # Then create link struct
        return {"idSource": flux.orig.id, "idTarget": flux.dest.id, "value": datas_json}

    def _parse_datas_or_results(
        self, sankey: Sankey, flux, default_data_strct: dict, datas_json: dict
    ):
        """
        Choose the way to parse datas or results from flux

        Struct for *datas_json* :
        {
            'dataTag1_dataTagGroup1': {
                dataTag1_dataTagGroup2: {
                    ... :{
                            dataTag1_dataTagGroupN: *data_json*
                        }
                },
                dataTag2_dataTagGroup2: {
                    ...
                },
                ...
            },
            'dataTag2_dataTagGroup1': {
                ...
            },
            ...
        }

        Struct for *data_json* :
        {
            'data_value': <float>,
            'text_value': <str>,
            'tags': {
                'fluxTagGroup1': ['fluxTagX1_fluxTagGroup1','fluxTagY1_fluxTagGroup1'],
                'fluxTagGroup2': ['fluxTagY1_fluxTagGroup2'],
                ...
            },
            extensions: {<reserved>}
        }

        Parameters
        ----------
        :param sankey: sankey struct
        :type sankey: Sankey

        :param flux: flux to get data from t
        :type flux: Flux

        :param default_data_strct: Default data json struct
        :type default_data_strct: dict

        :param datas_json: Output json struct that contains all datas
        :type datas_json: dict (modified)
        """
        # Boolean that memorized if flux have at least one value
        has_data = False
        # We use result data if present instead of simple data
        if flux.has_result():
            for result in flux.results:
                has_data |= result.data_value is not None
                raw_data = result.alterego
                self._parse_result(
                    sankey, result, raw_data, default_data_strct, datas_json
                )
        elif flux.has_data():
            for data in flux.datas:
                has_data |= data.data_value is not None
                self._parse_data(sankey, data, default_data_strct, datas_json)
        return has_data

    def _parse_data(
        self, sankey: Sankey, data, default_data_strct: dict, datas_json: dict
    ):
        """
        Extract datas from link struct for json data format.

        Struct for *datas_json* :
        {
            'dataTag1_dataTagGroup1': {
                dataTag1_dataTagGroup2: {
                    ... :{
                            dataTag1_dataTagGroupN: *data_json*
                        }
                },
                dataTag2_dataTagGroup2: {
                    ...
                },
                ...
            },
            'dataTag2_dataTagGroup1': {
                ...
            },
            ...
        }

        Struct for *data_json* :
        {
            'data_value': <float>,
            'text_value': <str>,
            'tags': {
                'fluxTagGroup1': ['fluxTagX1_fluxTagGroup1','fluxTagY1_fluxTagGroup1'],
                'fluxTagGroup2': ['fluxTagY1_fluxTagGroup2'],
                ...
            },
            extensions: {<reserved>}
        }

        Parameters
        ----------
        :param data: sankey struct
        :type data: Sankey

        :param data: Input data object
        :type data: Data

        :param default_data_strct: Default data json struct
        :type default_data_strct: dict

        :param datas_json: Output json struct that contains all datas
        :type datas_json: dict (modified)
        """

        # Reccurent function specific to this function
        def add_data_to_datas(tags, datas_json, data_json):
            # Check if we reached the last data tag
            if len(tags) == 0:
                datas_json.update(data_json)
                return
            # Otherwise we have a reccurence
            for tag in tags:
                if tag.name in datas_json.keys():
                    tags.remove(tag)
                    add_data_to_datas(tags, datas_json[tag.name], data_json)
                    return
            # TODO : Mettre gestion erreur aucun tag trouvé ?

        # Create data structure
        data_json = self._init_data_struct(sankey, data, default_data_strct)
        _update_dict_if_value(data_json, "data_value", data.data_value)
        # Reference data struct from data tags
        tags = [
            tag for tag in data.tags if (tag.group.type == CONST_IO_XL.TAG_TYPE_DATA)
        ]
        add_data_to_datas(tags, datas_json, data_json)

    def _init_data_struct(self, sankey, data, default_data_strct):
        """
        Initialize data_struct with data attributes

        Struct for *data_json* :
        {
            'data_value': <float>,
            'text_value': <str>,
            'tags': {
                'fluxTagGroup1': ['fluxTagX1_fluxTagGroup1','fluxTagY1_fluxTagGroup1'],
                'fluxTagGroup2': ['fluxTagY1_fluxTagGroup2'],
                ...
            },
            extensions: {<reserved>}
        }

        Parameters
        ----------
        :param data: sankey struct
        :type data: Sankey

        :param data: Input data object
        :type data: Data

        :param default_data_strct: Default data json struct
        :type default_data_strct: dict

        Returns
        -------
        :return: Data json struct with data attributes
        :rtype: dict
        """
        data_json = copy.deepcopy(default_data_strct)
        data_json = copy.deepcopy(default_data_strct)
        # data_json["data_value"] = data.value if (data.value is not None) else ""
        # data_json["value_option"] = (
        #     data.value_option if (data.value_option != "") else None
        # )

        if data.flux.constraints:
            for constraints in data.flux.constraints.values():
                for constraint in constraints:
                    if constraint.type in CONST_IO_XL.DATA_VALUE_PERCENT_CONSTRAINTS:
                        data_json["value_option"] = constraint.type
                        data_json["data_value"] = constraint.ratio * 100
                    if constraint.type == CONST_IO_XL.DATA_VALUE_TYPE_UNIT_RATIO:
                        data_json["value_option"] = constraint.type
                        data_json["data_value"] = constraint.ratio

        if data.constraints:
            for constraints in data.constraints.values():
                for constraint in constraints:
                    if constraint.type in CONST_IO_XL.DATA_VALUE_PERCENT_CONSTRAINTS:
                        data_json["value_option"] = constraint.type
                        data_json["data_value"] = constraint.ratio * 100
                    if constraint.type == CONST_IO_XL.DATA_VALUE_TYPE_UNIT_RATIO:
                        data_json["value_option"] = constraint.type
                        data_json["data_value"] = constraint.ratio
                        data_json["ratio_unit_tag"] = constraint.ratio_unit_tag
        # Update flux tags to data structure
        for tagg in sankey.taggs[CONST_IO_XL.TAG_TYPE_FLUX].values():
            # TODO : Checker si len(tags) > 1 -> normalement ça ne devrait pas arriver
            tags = data.get_tags_from_taggroup(tagg)
            if tags is not None:
                # Replace specific names for tags and tagggroup
                tagg_name = tagg.name
                for tag in tags:
                    tag_name = tag.name
                    if tagg_name == CONST_IO_XL.DATA_TYPE_LABEL:
                        tagg_name = "flux_types"
                        tag_name = tag_name.replace(
                            CONST_IO_XL.DATA_COLLECTED, "initial_data"
                        ).replace(CONST_IO_XL.DATA_COMPUTED, "computed_data")
                    # Update fluxtags struct
                    data_json["tags"][tagg_name].append(tag_name)
        return data_json

    def _parse_result(
        self,
        sankey: Sankey,
        result,
        raw_data,
        default_data_strct: dict,
        datas_strct: dict,
    ):
        """
        Extract datas from link struct for json data format.

        Struct for *datas_json* :
        {
            'dataTag1_dataTagGroup1': {
                dataTag1_dataTagGroup2: {
                    ... :{
                            dataTag1_dataTagGroupN: *data_json*
                        }
                },
                dataTag2_dataTagGroup2: {
                    ...
                },
                ...
            },
            'dataTag2_dataTagGroup1': {
                ...
            },
            ...
        }

        Struct for *data_json* :
        {
            'value': <float>,
            'display_value': <str>,
            'tags': {
                'fluxTagGroup1': ['fluxTagX1_fluxTagGroup1','fluxTagY1_fluxTagGroup1'],
                'fluxTagGroup2': ['fluxTagY1_fluxTagGroup2'],
                ...
            },
            extensions: {
                'free_mini': float, (Optional)
                'free_maxi': float, (Optional)
                'data_min': float, (Optional)
                'data_max': float, (Optional)
                'data_value': float, (Optional)
                'data_source': str (Optional)
            }
        }

        Parameters
        ----------
        :param data: sankey struct
        :type data: Sankey

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
                if tag.name in datas_strct.keys():
                    tags.remove(tag)
                    add_data_to_datas(tags, datas_strct[tag.name], data_strct)
                    return
            # TODO : Mettre gestion erreur aucun tag trouvé ?

        # Initialize result structure
        data_strct = self._init_data_struct(sankey, result, default_data_strct)
        # Update extensions
        _update_dict_if_value(data_strct, "result_min", result.min_val)
        _update_dict_if_value(data_strct, "result_max", result.max_val)
        _update_dict_if_value(data_strct, "result_value", result.data_value)
        if raw_data is not None:
            _update_dict_if_value(data_strct, "data_min", raw_data.min_val)
            _update_dict_if_value(data_strct, "data_max", raw_data.max_val)
            _update_dict_if_value(data_strct, "data_value", raw_data.data_value)
            _update_dict_if_value(data_strct, "data_source", raw_data.source)
            _update_dict_if_value(data_strct, "value_option", raw_data.value_option)
        # Reference result struct from data tags
        tags = [
            tag for tag in result.tags if (tag.group.type == CONST_IO_XL.TAG_TYPE_DATA)
        ]
        add_data_to_datas(tags, datas_strct, data_strct)

    def parse_nodes(self, sankey: Sankey, nodes: dict, levelTags):
        """
        Extract nodes from sankey object for json data format.

        Struct for nodes_json :
        {
            '<id node>': node_json,
            ...
        }

        Parameters
        ----------
        :param sankey: Input sankey object
        :type sankey: Sankey

        :param nodes: nodes json struct
        :type nodes: dict (modified)

        :param levelTags: level tags json struct - Updated if necessary
        :type levelTags: dict (modified)
        """
        # Update nodes json struct
        self._create_nodes_json(sankey, nodes)
        # Create primary level tag if necessary
        if sankey.max_nodes_level > 1:
            if len(sankey.taggs[CONST_IO_XL.TAG_TYPE_LEVEL].values()) == 0:
                levelTags["Primaire"] = {
                    "name": "Primaire",
                    "show_legend": False,
                    "tags": {},
                    "banner": "level",
                    "activated": True,
                }
                for tag in range(1, sankey.max_nodes_level + 1):
                    levelTags["Primaire"]["tags"][str(tag)] = {
                        "name": str(tag),
                        "selected": (tag == 1),
                        "color": "",
                    }

    def _create_nodes_json(self, sankey: Sankey, nodes_json: dict):
        """
        Extract all nodes from sankey object to update json data format.

        Struct for *nodes_json* :
        {
            '<id node>': *node_json*,
            ...
        }

        Parameters
        ----------
        :param sankey: Input sankey object
        :type sankey: Sankey

        :param nodes: nodes json struct
        :type nodes: dict (modified)
        """
        # Create nodes struct
        for node in sankey.nodes.values():
            nodes_json[node.id] = self._create_node_json(sankey, node)

    def _create_node_json(self, sankey: Sankey, node):
        """
        Extract a given node info from sankey object to update json data format.

        Struct for *node_json* :
        {
            'idNode': str,
            'name': str,
            'definition': str,
            'display': bool,
            'node_visible': bool,
            'label_visible': bool,
            'shape_visible': bool,
            'color': 'str', (Optional)
            'tags': {
                '<tag group name 1>': ['<tag name 1>', ...],
                ...
            },
            'dimensions': {
                '<level tag group name 1>': *node_level_json*,
                ...
            }
        }

        Struct for *node_level_json*:
        {
            'parent_name': '<parent node id>'
            'level': int
            'parent_tag': '<level tag 1>'
            'children_tags': ['<level tag 2>', ...]
            'antitag': bool
        }

        Parameters
        ----------
        :param sankey: Input sankey object
        :type sankey: Sankey

        :param nodes: nodes json struct
        :type nodes: dict (modified)
        """
        # Check if we must create 'Primaire' or not
        if len(sankey.taggs[CONST_IO_XL.TAG_TYPE_LEVEL].values()) > 1:
            create_primary = False
        else:
            create_primary = True
        # Create node struct
        node_json = {
            "idNode": node.id,
            "name": node.name,
            "definition": node.definition,
            "display": True,
            "node_visible": True,
            "label_visible": True,
            "shape_visible": True,
            "tags": {},
            "dimensions": {},
        }
        if create_primary:
            node_json["dimensions"]["Primaire"] = {}

        # Update tags
        for tag in node.tags:
            tag_group_name = tag.group.name
            # Create group entry if not already the case
            if tag_group_name not in node_json["tags"].keys():
                node_json["tags"][tag_group_name] = []
            # Add the tag
            node_json["tags"][tag_group_name].append(tag.name)
        # Parents relations -> TODO duplicate node for each parent
        for dimension in sankey.dimensions.values():
            id = "Primaire" if dimension.id == self.primary_level_id else dimension.id
            parent = dimension.get_parent_of(node)
            children = dimension.get_children_of(node)
            if parent is not None:
                # Node has parent in given dim
                node_json["dimensions"][id] = {}
                node_json["dimensions"][id]["parent_name"] = parent.id
                level = dimension.get_level_of(node)
                is_root_child = children is None
                node_json["dimensions"][id]["parent_tag"] = str(level - 1)
                if is_root_child:
                    node_json["dimensions"][id]["children_tags"] = [
                        str(_) for _ in range(level, dimension.depth + 1)
                    ]
                else:
                    node_json["dimensions"][id]["children_tags"] = [str(level)]
            elif children is not None:
                # Node does not have parent but have children in givent dim
                # ie : Node is parent-root
                # Nothing to do
                pass
            # else:
            #     # Node does not exist in given dim
            #     node_json["dimensions"][id] = {}
            #     if node._dimensions_as_child or node._dimensions_as_parent:
            #         node_json["dimensions"][id]["antitag"] = True
        return node_json


class JsonToSankey(object):
    """
    Class created to ease the parsing process by permitting methods overloading.

    JSON struct is like that:
    {
        'version': str,
        'dataTags': {},
        'nodeTags': {},
        'fluxTags': {},

        'nodes': {},
        'links': {}',
        'labels': {}
    }

    Attributes
    ----------
    :param sankey: output sankey struct
    :type sankey: Sankey

    :param json: copy of json input
    :type json: dict
    """

    def __init__(self, json):
        # Public attributes
        self.json = copy.deepcopy(json)
        self.sankey = Sankey()
        # Private attributes - for computation purpose
        self._nodes_id_corresp = {}
        self._dimensions_id_corresp = {}
        # self._leveltaggs_corresp = {}
        # self._leveltags_corresp = {}
        self._nodetags_id_corresp = {}
        self._fluxtags_id_corresp = {}
        self._datatags_id_corresp = {}

    def run(self):
        """
        Extract all infos from json to create Sankey struct.
        """
        self.parse_taggs()
        self.parse_nodes()
        self.parse_links_and_datas()

    def parse_taggs(self):
        """
        Extract all tags from json data struct to fill a Sankey struct.

        Struct for data/nodes/flux_tags_json :
        {
            'name': str,
            'show_legend': bool,
            'tags': tags_json,
            'banner': str,
            'activated': bool,
            'siblings': [str, ...]
        }

        Struct for tags_json :
        {
            'name': str
            'selected': bool
            'color': str (in hexa)
        }

        Parameters
        ----------
        None
        """
        for tagg_type_json in JSON_TO_IO_XL__TAGG_TYPES.keys():
            if tagg_type_json in self.json.keys():
                self._parse_tagg(tagg_type_json)

    def _parse_tagg(self, tagg_type_json):
        """
        Extract all tags of a given tag group type
        from json data struct to fill a Sankey struct.

        Struct for tagg_json :
        {
            'name': str,
            'show_legend': bool,
            'tags':{
                '<tag name>': tag_json,
                ...
            }
            'banner': str,
            'activated': bool,
            'siblings': [str, ...]
        }

        Struct for tag_json :
        {
            'name': str
            'selected': bool
            'color': str (in hexa) (Optional)
        }

        Parameters
        ----------
        :param tagg_type_json: Tagg group type (dataTag, NodeTag, FluxTag, LevelTag)
        :type tagg_type_json: str
        """
        for tagg_id, tagg_json in self.json[tagg_type_json].items():
            # Get tag type
            tagg_type = JSON_TO_IO_XL__TAGG_TYPES[tagg_type_json]
            # For node tag, check if it's not a level tag instead
            if (tagg_type == CONST_IO_XL.TAG_TYPE_NODE) and (
                (tagg_json["banner"] == "level") or (tagg_id in DEFAULT_LEVEL_TAGGS)
            ):
                tagg_type = CONST_IO_XL.TAG_TYPE_LEVEL
            # Leveltag are no more - create dimension instead
            if tagg_type == CONST_IO_XL.TAG_TYPE_LEVEL:
                dim = self.sankey.get_or_create_dimension(tagg_json["name"])
                self._dimensions_id_corresp[tagg_id] = dim
                continue
            # Specific taggs to ignore
            if (tagg_type == CONST_IO_XL.TAG_TYPE_FLUX) and (tagg_id == "flux_types"):
                continue
            # Create tag groupe
            tagg = self.sankey.get_or_create_tagg(tagg_json["name"], tagg_type)
            # Create tags corresp table
            tags_corresp = {}
            # Create tags
            for tag_id, tag_json in tagg_json["tags"].items():
                tag = tagg.get_or_create_tag(tag_json["name"])
                tag.color = _get_value_if_in_dict(tag_json, "color")
                # For latter reference
                tags_corresp[tag_id] = tag
            # Update correspondance dict
            if tagg_type == CONST_IO_XL.TAG_TYPE_NODE:
                self._nodetags_id_corresp[tagg_id] = tags_corresp
            if tagg_type == CONST_IO_XL.TAG_TYPE_FLUX:
                self._fluxtags_id_corresp[tagg_id] = tags_corresp
            if tagg_type == CONST_IO_XL.TAG_TYPE_DATA:
                self._datatags_id_corresp[tagg_id] = tags_corresp
            # Check siblings tag groups
            if "siblings" in tagg_json.keys():
                for sib_tagg_id in tagg_json["siblings"]:
                    sib_tagg = self.sankey.get_or_create_tagg(sib_tagg_id, tagg_type)
                    tagg.add_antagonist_tagg(sib_tagg)

    def parse_nodes(self):
        """
        Extract all nodes from json data struct to fill a Sankey struct.

        Struct for nodes_json :
        {
            '<id node>': node_json,
            ...
        }

        Struct for node_json :
        {
            'idNode': str,
            'name': str,
            'definition': str, (Optional)
            'display': bool,
            'node_visible': bool,
            'label_visible': bool,
            'shape_visible': bool,
            'color': 'str', (Optional)
            'tags': {
                '<tag group name 1>': ['<tag name 1>', ...],
                ...
            },
            'dimensions': {
                '<level tag group name 1>': node_level_json,
                ...
            }
        }

        Struct for node_level_json:
        {
            'parent_name': '<parent node id>'
            'level': int
            'parent_tag': '<level tag 1>'
            'children_tags': ['<level tag 2>', ...]
            'antitag': bool
        }

        Parameters
        ----------
        None
        """
        # Parse all nodes
        all_dim_parent_child = []
        for node_id, node_json in self.json["nodes"].items():
            # Create node with attributes
            # Note : default level = 1
            node = self.sankey.get_or_create_node(node_json["name"])
            node.update(
                color=_get_value_if_in_dict(node_json, "color"),
                definition=_get_value_if_in_dict(node_json, "tooltip_text"),
            )
            # Keep node id in mind
            # self._nodes_id_corresp[node_json['id']] = node
            self._nodes_id_corresp[node_id] = node
            # Apply node tags
            if "tags" in node_json:
                for tagg_id in node_json["tags"].keys():
                    if tagg_id in self._nodetags_id_corresp.keys():
                        # Get corresponding tags
                        for tag_id in node_json["tags"][tagg_id]:
                            if tag_id in self._nodetags_id_corresp[tagg_id].keys():
                                tag = self._nodetags_id_corresp[tagg_id][tag_id]
                                node.add_tag(tag)
            # Save dimensions
            if "dimensions" not in node_json:
                continue
            for dimension_id, dimension in node_json["dimensions"].items():
                if "parent_name" in dimension.keys():
                    all_dim_parent_child.append(
                        (dimension_id, dimension["parent_name"], node_id)
                    )
        # Apply all dimensions
        for dim_parent_child in all_dim_parent_child:
            dim_id, parent_id, child_id = dim_parent_child
            self._dimensions_id_corresp[dim_id].add_nodes_relationship(
                self._nodes_id_corresp[parent_id], self._nodes_id_corresp[child_id]
            )

    def parse_links_and_datas(self):
        """
        Extract all links and their datas from json data struct to fill a Sankey struct.

        Struct for *links_with_datas_json* :
        {
            '<id link>': *link_with_datas_json*,
            ...
        }

        Struct for *link_with_datas_json* :
            {
            'idLink': str,
            'idSource': str,
            'idTarget': str,
            'value': *datas_json*
        }

        Struct for *datas_json*:
        {
            '<data_taggroup1__data_tag_1>': {
                '<data_taggroup2__data_tag_1>': {
                    '<data_taggroup3__data_tag_1>': *data_json*,
                    '<data_taggroup3__data_tag_1>': *data_json*,
                    ...
                },
                '<data_taggroup2__data_tag_2>': {
                    ...
                },
                ...
            },
            '<data_taggroup1__data_tag_2>': {
                ...
            },
            ...
        }

        Struct for *data_json*:
        {
            'data_value': str,
            'text_value': str,
            'tags': {
                '<flux_taggroup1>': ['<tag name 1>', ...],
                ...
            },
            'extension': {}
        }

        Parameters
        ----------
        None
        """
        # Grouper les flux par paire source-destination
        flux_groups = {}
        for flux_id, flux_json in self.json["links"].items():
            source_id = flux_json["idSource"]
            target_id = flux_json["idTarget"]
            key = (source_id, target_id)

            if key not in flux_groups:
                flux_groups[key] = []
            flux_groups[key].append(flux_json)
        # Créer un flux unique par paire avec tous les flux tags
        for (source_id, target_id), flux_list in flux_groups.items():
            # Obtenir les nœuds
            orig_node = self._nodes_id_corresp[source_id]
            dest_node = self._nodes_id_corresp[target_id]
            for flux_json in flux_list:
                if "tags" in flux_json["value"]:
                    for tagg_id in flux_json["value"]["tags"].keys():
                        if tagg_id in self._fluxtags_id_corresp.keys():
                            # Get corresponding tags
                            for tag_id in flux_json["value"]["tags"][tagg_id]:
                                if tag_id in self._fluxtags_id_corresp[tagg_id].keys():
                                    tag = self._fluxtags_id_corresp[tagg_id][tag_id]
                                    flux = self.sankey.get_or_create_flux(
                                        orig_node.name, dest_node.name, tag
                                    )
                                    self._extract_data(flux_json["value"], flux, False)
                else:
                    flux = self.sankey.get_or_create_flux(
                        orig_node.name, dest_node.name
                    )
                    self._extract_data(flux_json["value"], flux, False)

        self.sankey.autocompute_nodes_types()
        for (source_id, target_id), flux_list in flux_groups.items():
            # Obtenir les nœuds
            orig_node = self._nodes_id_corresp[source_id]
            dest_node = self._nodes_id_corresp[target_id]
            for flux_json in flux_list:
                if "tags" in flux_json["value"]:
                    for tagg_id in flux_json["value"]["tags"].keys():
                        if tagg_id in self._fluxtags_id_corresp.keys():
                            # Get corresponding tags
                            for tag_id in flux_json["value"]["tags"][tagg_id]:
                                if tag_id in self._fluxtags_id_corresp[tagg_id].keys():
                                    tag = self._fluxtags_id_corresp[tagg_id][tag_id]
                                    flux = self.sankey.get_or_create_flux(
                                        orig_node.name, dest_node.name, tag
                                    )
                                    self._extract_data(flux_json["value"], flux, True)
                else:
                    flux = self.sankey.get_or_create_flux(
                        orig_node.name, dest_node.name
                    )
                    self._extract_data(flux_json["value"], flux, True)

    def _extract_data(
        self, datas_json, flux, read_constraint, datatags_list=[], datataggs_list=None
    ):
        """
        Extract all datas (recursively) from json flux struct to fill a Sankey struct.

        Struct for *datas_json*:
        {
            '<data_taggroup1__data_tag_1>': {
                '<data_taggroup2__data_tag_1>': {
                    '<data_taggroup3__data_tag_1>': *data_json*,
                    '<data_taggroup3__data_tag_1>': *data_json*,
                    ...
                },
                '<data_taggroup2__data_tag_2>': {
                    ...
                },
                ...
            },
            '<data_taggroup1__data_tag_2>': {
                ...
            },
            ...
        }

        Struct for *data_json*:
        {
            'data_value': str,
            'text_value': str,
            'tags': {
                '<flux_taggroup1>': ['<tag name 1>', ...],
                ...
            },
            'extension': {}
        }

        Parameters
        ----------
        :param datas_json: Json data struct
        :type datas_json: dict

        :param flux: Sankey Flux object
        :type flux: Flux

        :param datatags_list: List of data tags to apply on parse Data object
        :type datatags_list: list[Tags]
        """
        # Check if we reach the bottom of datas_json
        if "data_value" in datas_json.keys() or "result_value" in datas_json.keys():
            # Get corresponding data / datatags
            data = flux.get_corresponding_datas_from_tags(datatags_list)[0]
            # Get all fluxtags
            fluxtags_list = []
            if "tags" in datas_json:
                for fluxtagg_id in datas_json["tags"].keys():
                    # Get all tags related to this taggroup and to this flux
                    for fluxtag_id in datas_json["tags"][fluxtagg_id]:
                        if (
                            fluxtag_id == "initial_data"
                            or fluxtag_id == "computed_data"
                        ):
                            continue
                        if (
                            fluxtag_id
                            not in self._fluxtags_id_corresp[fluxtagg_id].keys()
                        ):
                            # sanity check
                            continue
                        fluxtags_list.append(
                            self._fluxtags_id_corresp[fluxtagg_id][fluxtag_id]
                        )
            # Check if data is result or not
            # data_is_computed = False
            # if "flux_types" in datas_json["tags"].keys():
            #     if "computed_data" in datas_json["tags"]["flux_types"]:
            #         data_is_computed = True
            # Update data OR result

            if "value_option" in datas_json:
                data.value_option = datas_json["value_option"]
            if (
                read_constraint
                and data.value_option in CONST_IO_XL.DATA_VALUE_PERCENT_CONSTRAINTS
            ):
                self.sankey.ratio_node(flux, datas_json)
            if not read_constraint:
                if "data_value" in datas_json:
                    data.data_value = datas_json["data_value"]
                # Apply only flux-tags
                for tag in fluxtags_list:
                    data.add_tag(tag)
                if "result_value" in datas_json:
                    # Create result
                    result = SankeyData(data_value=datas_json["result_value"])
                    for tag in data.tags:
                        result.add_tag(tag)
                    # Update result value
                    flux.add_result(result)
                    # Link with data
                    result.alterego = data
                    # # Apply tags
                    # for tag in datatags_list + fluxtags_list:
                    #     result.add_tag(tag)
                # else:
                # Update value

                return
        # Otherwise we have to go deeper
        elif "datatag_group" in datas_json.keys():
            curr_datatagg_id = datas_json["datatag_group"]
            # Recursive calls on all datatags
            for datatag_id, datatag in self._datatags_id_corresp[
                curr_datatagg_id
            ].items():
                # Temporary copy of datatags_list
                new_datatags_list = datatags_list.copy()
                new_datatags_list.append(datatag)
                # Recurse
                self._extract_data(
                    datas_json[datatag_id], flux, read_constraint, new_datatags_list
                )
        return
