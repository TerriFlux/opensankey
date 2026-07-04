export const initial_data = {
    "node_label_separator": "",
    "version": "0.91",
    "grid_visible": false,
    "user_scale": 20000,
    "nodes": {
      "node0": {
        "id": "node0",
        "is_visible": true,
        "svg_parent_group": "g_nodes",
        "x": 200,
        "y": 95,
        "u": 1,
        "v": 0,
        "name": "Sales - Product 1",
        "style": "default",
        "local": {
          "version": 1,
          "color": "#9141ac",
          "name_label_vert": "middle",
          "name_label_horiz": "left"
        },
        "tags": {},
        "dimensions": {},
        "inputLinksId": [],
        "outputLinksId": [
          "Node 0 --> Node 1"
        ],
        "links_order": [
          "Node 0 --> Node 1"
        ]
      },
      "node1": {
        "id": "node1",
        "is_visible": true,
        "svg_parent_group": "g_nodes",
        "x": 400,
        "y": 120,
        "u": 3,
        "v": 0,
        "name": "Revenues",
        "style": "default",
        "local": {
          "version": 1,
          "name_label_bold": true,
          "name_label_background": false
        },
        "tags": {},
        "dimensions": {},
        "inputLinksId": [
          "Node 0 --> Node 1",
          "Node 2 --> Node 1"
        ],
        "outputLinksId": [
          "Node 1 --> Node 3",
          "Revenues --> Node 7",
          "Revenues --> Node 8"
        ],
        "links_order": [
          "Revenues --> Node 8",
          "Revenues --> Node 7",
          "Node 1 --> Node 3",
          "Node 0 --> Node 1",
          "Node 2 --> Node 1"
        ],
      },
      "node6": {
        "id": "node6",
        "is_visible": true,
        "svg_parent_group": "g_nodes",
        "x": 800,
        "y": 67.5,
        "u": 7,
        "v": 0,
        "name": "Production",
        "style": "default",
        "local": {
          "version": 1,
          "color": "#3584e4",
          "name_label_vert": "middle",
          "name_label_horiz": "right"
        },
        "tags": {},
        "dimensions": {},
        "inputLinksId": [
          "Revenues --> Node 6"
        ],
        "outputLinksId": [],
        "links_order": [
          "Revenues --> Node 6"
        ]
      },
      "node8": {
        "id": "node8",
        "is_visible": true,
        "svg_parent_group": "g_nodes",
        "x": 600,
        "y": 50,
        "u": 5,
        "v": 0,
        "name": "Profits",
        "style": "default",
        "local": {
          "version": 1,
          "color": "#33d17a",
          "name_label_vert": "middle",
          "name_label_horiz": "right"
        },
        "tags": {},
        "dimensions": {},
        "inputLinksId": [
          "Revenues --> Node 8"
        ],
        "outputLinksId": [],
        "links_order": [
          "Revenues --> Node 8"
        ]
      },
      "node2": {
        "id": "node2",
        "is_visible": true,
        "svg_parent_group": "g_nodes",
        "x": 200,
        "y": 245,
        "u": 1,
        "v": 1,
        "name": "Sales - Product 2",
        "style": "default",
        "local": {
          "version": 1,
          "color": "#865e3c",
          "name_label_vert": "middle",
          "name_label_horiz": "left"
        },
        "tags": {},
        "dimensions": {},
        "inputLinksId": [],
        "outputLinksId": [
          "Node 2 --> Node 1"
        ],
        "links_order": [
          "Node 2 --> Node 1"
        ]
      },
      "node7": {
        "id": "node7",
        "is_visible": true,
        "svg_parent_group": "g_nodes",
        "x": 600,
        "y": 140,
        "u": 5,
        "v": 1,
        "name": "Expenses",
        "style": "default",
        "local": {
          "version": 1,
          "color": "#3584e4",
          "name_label_bold": true,
          "name_label_vert": "bottom",
          "name_label_horiz": "middle",
          "name_label_background": false
        },
        "tags": {},
        "dimensions": {},
        "inputLinksId": [
          "Revenues --> Node 7"
        ],
        "outputLinksId": [
          "Node 1 --> Node 4",
          "Node 1 --> Node 5",
          "Revenues --> Node 6"
        ],
        "links_order": [
          "Revenues --> Node 6",
          "Node 1 --> Node 4",
          "Node 1 --> Node 5",
          "Revenues --> Node 7"
        ]
      },
      "node4": {
        "id": "node4",
        "is_visible": true,
        "svg_parent_group": "g_nodes",
        "x": 800,
        "y": 157.5,
        "u": 7,
        "v": 1,
        "name": "Human ressources",
        "style": "default",
        "local": {
          "version": 1,
          "color": "#3584e4",
          "name_label_vert": "middle",
          "name_label_horiz": "right"
        },
        "tags": {},
        "dimensions": {},
        "inputLinksId": [
          "Node 1 --> Node 4"
        ],
        "outputLinksId": [],
        "links_order": [
          "Node 1 --> Node 4"
        ]
      },
      "node3": {
        "id": "node3",
        "is_visible": true,
        "svg_parent_group": "g_nodes",
        "x": 600,
        "y": 300,
        "u": 5,
        "v": 2,
        "name": "Taxes",
        "style": "default",
        "local": {
          "version": 1,
          "color": "#e01b24",
          "name_label_vert": "middle",
          "name_label_horiz": "right"
        },
        "tags": {},
        "dimensions": {},
        "inputLinksId": [
          "Node 1 --> Node 3"
        ],
        "outputLinksId": [],
        "links_order": [
          "Node 1 --> Node 3"
        ]
      },
      "node5": {
        "id": "node5",
        "is_visible": true,
        "svg_parent_group": "g_nodes",
        "x": 800,
        "y": 282.5,
        "u": 7,
        "v": 2,
        "name": "Marketing",
        "style": "default",
        "local": {
          "version": 1,
          "color": "#3584e4",
          "name_label_vert": "middle",
          "name_label_horiz": "right"
        },
        "tags": {},
        "dimensions": {},
        "inputLinksId": [
          "Node 1 --> Node 5"
        ],
        "outputLinksId": [],
        "links_order": [
          "Node 1 --> Node 5"
        ]
      }
    },
    "links": {
      "Node 0 --> Node 1": {
        "id": "Node 0 --> Node 1",
        "is_visible": true,
        "svg_parent_group": "g_links",
        "idSource": "node0",
        "idTarget": "node1",
        "style": "default",
        "local": {
          "version": 1,
          "recycling": false,
          "color": "#c061cb",
          "value_label_unit_visible": true,
          "value_label_unit": "k€",
          "value_label_unit_factor": 1000,
          "gradient": false
        },
        "displaying_order": 0,
        "position_starting_x": 240,
        "position_starting_y": 145,
        "position_ending_x": 400,
        "position_ending_y": 170,
        "tooltip_text": "",
        "value": {
          "id": "node0node1_value__CjFRt",
          "data_value": 20000,
          "tags": {}
        }
      },
      "Node 2 --> Node 1": {
        "id": "Node 2 --> Node 1",
        "is_visible": true,
        "svg_parent_group": "g_links",
        "idSource": "node2",
        "idTarget": "node1",
        "style": "default",
        "local": {
          "version": 1,
          "recycling": false,
          "color": "#b5835a",
          "value_label_unit_visible": true,
          "value_label_unit": "k€",
          "value_label_unit_factor": 1000,
          "gradient": false
        },
        "displaying_order": 2,
        "position_starting_x": 240,
        "position_starting_y": 270,
        "position_ending_x": 400,
        "position_ending_y": 245,
        "tooltip_text": "",
        "value": {
          "id": "node2node1_value__w3unm",
          "data_value": 10000,
          "tags": {}
        }
      },
      "Node 1 --> Node 3": {
        "id": "Node 1 --> Node 3",
        "is_visible": true,
        "svg_parent_group": "g_links",
        "idSource": "node1",
        "idTarget": "node3",
        "style": "default",
        "local": {
          "version": 1,
          "recycling": false,
          "color": "#f66151",
          "value_label_horiz": "middle",
          "value_label_vert": "middle",
          "value_label_unit_visible": true,
          "value_label_unit": "k€",
          "value_label_unit_factor": 1000,
          "gradient": false
        },
        "displaying_order": 4,
        "position_starting_x": 440,
        "position_starting_y": 262.5,
        "position_ending_x": 600,
        "position_ending_y": 320,
        "tooltip_text": "",
        "value": {
          "id": "node1node3_value__bQbVE",
          "data_value": 3000,
          "tags": {}
        }
      },
      "Node 1 --> Node 4": {
        "id": "Node 1 --> Node 4",
        "is_visible": true,
        "svg_parent_group": "g_links",
        "idSource": "node7",
        "idTarget": "node4",
        "style": "default",
        "local": {
          "version": 1,
          "recycling": false,
          "color": "#62a0ea",
          "value_label_unit_visible": true,
          "value_label_unit": "k€",
          "value_label_unit_factor": 1000,
          "gradient": false
        },
        "displaying_order": 6,
        "position_starting_x": 640,
        "position_starting_y": 202.5,
        "position_ending_x": 800,
        "position_ending_y": 195,
        "tooltip_text": "",
        "value": {
          "id": "node1node4_value__rMXnL",
          "data_value": 15000,
          "tags": {}
        }
      },
      "Node 1 --> Node 5": {
        "id": "Node 1 --> Node 5",
        "is_visible": true,
        "svg_parent_group": "g_links",
        "idSource": "node7",
        "idTarget": "node5",
        "style": "default",
        "local": {
          "version": 1,
          "recycling": false,
          "color": "#62a0ea",
          "value_label_unit_visible": true,
          "value_label_unit": "k€",
          "value_label_unit_factor": 1000,
          "gradient": false
        },
        "displaying_order": 8,
        "position_starting_x": 640,
        "position_starting_y": 245,
        "position_ending_x": 800,
        "position_ending_y": 302.5,
        "tooltip_text": "",
        "value": {
          "id": "node1node5_value__4KQWU",
          "data_value": 2000,
          "tags": {}
        }
      },
      "Revenues --> Node 6": {
        "id": "Revenues --> Node 6",
        "is_visible": true,
        "svg_parent_group": "g_links",
        "idSource": "node7",
        "idTarget": "node6",
        "style": "default",
        "local": {
          "version": 1,
          "recycling": false,
          "color": "#62a0ea",
          "value_label_unit_visible": true,
          "value_label_unit": "k€",
          "value_label_unit_factor": 1000,
          "gradient": false
        },
        "displaying_order": 10,
        "position_starting_x": 640,
        "position_starting_y": 152.5,
        "position_ending_x": 800,
        "position_ending_y": 87.5,
        "tooltip_text": "",
        "value": {
          "id": "revenuesnode6_value__LEYWo",
          "data_value": 5000,
          "tags": {}
        }
      },
      "Revenues --> Node 7": {
        "id": "Revenues --> Node 7",
        "is_visible": true,
        "svg_parent_group": "g_links",
        "idSource": "node1",
        "idTarget": "node7",
        "style": "default",
        "local": {
          "version": 1,
          "recycling": false,
          "color": "#62a0ea",
          "value_label_horiz": "middle",
          "value_label_vert": "middle",
          "value_label_unit_visible": true,
          "value_label_unit": "k€",
          "value_label_unit_factor": 1000,
          "gradient": false
        },
        "displaying_order": 12,
        "position_starting_x": 440,
        "position_starting_y": 200,
        "position_ending_x": 600,
        "position_ending_y": 195,
        "tooltip_text": "",
        "value": {
          "id": "revenuesnode7_value__z0I7m",
          "data_value": 22000,
          "tags": {}
        }
      },
      "Revenues --> Node 8": {
        "id": "Revenues --> Node 8",
        "is_visible": true,
        "svg_parent_group": "g_links",
        "idSource": "node1",
        "idTarget": "node8",
        "style": "default",
        "local": {
          "version": 1,
          "recycling": false,
          "color": "#57e389",
          "value_label_horiz": "middle",
          "value_label_vert": "middle",
          "value_label_unit_visible": true,
          "value_label_unit": "k€",
          "value_label_unit_factor": 1000,
          "gradient": false
        },
        "displaying_order": 14,
        "position_starting_x": 440,
        "position_starting_y": 132.5,
        "position_ending_x": 600,
        "position_ending_y": 70,
        "tooltip_text": "",
        "value": {
          "id": "revenuesnode8_value__oigxb",
          "data_value": 5000,
          "tags": {}
        }
      }
    }
  }