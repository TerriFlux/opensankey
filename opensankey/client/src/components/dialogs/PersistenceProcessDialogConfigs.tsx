import { MenuCondition } from './SankeyMenuContext'

export const translations = {
  ProcessDialog: {
    writing_option: {
      en: 'Options for writing the Excel file',
      fr: 'Options d\'écriture du fichier excel'
    },
    title: {
      en: 'Reconciliation',
      fr: 'Réconciliation'
    },
    success_status_optim: {
      en: 'Download results',
      fr: 'Télécharger les résultats'
    },
    success_status_check_excel: {
      en: 'Verification finished',
      fr: 'Vérification terminée'
    },
    success_status_create_ter: {
      en: 'Creation finished',
      fr: 'Création Terminée'
    },
    fail_status_optim: {
      en: 'Fail to reconcile',
      fr: 'Echec de la réconciliation'
    },
    fail_status_check_excel: {
      en: 'Fail to verify',
      fr: 'Echec de la vérification'
    },
    fail_status_create_ter: {
      en: 'Fail to create the TER',
      fr: 'Echec de la création'
    },
    launch: {
      en: 'Launch',
      fr: 'Lancer'
    },
    processing: {
      en: 'Processing...',
      fr: 'En traitement...'
    },
    open_file: {
      en: 'Open the reconcilied file',
      fr: 'Ouvrir fichier réconcilié'
    },
    reset: {
      en: 'Reset',
      fr: 'Réinitialiser'
    },
    success: {
      en: 'Success',
      fr: 'Succès'
    },
    fail: {
      en: 'Failed',
      fr: 'Echec'
    },
    infos: {
      en: 'Infos',
      fr: 'Infos'
    },
    err: {
      en: 'Warnings',
      fr: 'Avertissements'
    },
    debug: {
      en: 'Debug',
      fr: 'Debug'
    },
    input_parameters: {
      en: 'Input',
      fr: 'Entrée'
    },
    output_parameters: {
      en: 'Output',
      fr: 'Sortie'
    },
    input_format: {
      en: 'Format',
      fr: 'Format'
    },
    output_format: {
      en: 'Format',
      fr: 'Format'
    },
    input_excel: {
      en: 'Entering excel file',
      fr: 'Fichier d\'entrée excel'
    },
    input_layout: {
      en: 'Layout file',
      fr: 'Diagramme de mise en page'
    },
    check_scale_geo: {
      en: 'Scale\'s descent',
      fr: 'Descente d\'échelle'
    },
    input_scale_geo: {
      en: 'MFA file from supperior geographic level',
      fr: 'Fichier MFA du niveau géographique supérieur'
    },
    check_analyse_uncert: {
      en: 'Uncertainty analysis',
      fr: 'Analyse d\'incertitude'
    },
    input_analyse_uncert: {
      en: 'Number of realisation',
      fr: 'Nombre de réalisations'
    },
    waiting_file: {
      en: 'Choose an input file',
      fr: 'Veuillez choisir un fichier d\'entrée'
    },
    reconciliation: {
      en: 'Reconciliation',
      fr: 'Réconciliation'
    },
    open_excel_file: {
      en: 'Open an excel file',
      fr: 'Ouvrir fichier excel'
    },
    open_json_file: {
      en: 'Open a JSON file',
      fr: 'Ouvrir un fichier JSON'
    },
    save_excel_file: {
      en: 'Save Excel',
      fr: 'Enregistrer Excel'
    },
    save_json_file: {
      en: 'Save JSON',
      fr: 'Enregistrer JSON'
    },
    save: {
      en: 'Save',
      fr: 'Enregistrer'
    },
    input_file_excel: {
      en: 'Input file Excel',
      fr: 'Fichier d\'entrée excel'
    },
    input_file_json: {
      en: 'Input file JSON',
      fr: 'Fichier d\'entrée json'
    },
    load_example: {
      en: 'Load Example',
      fr: 'Chargement de l\'exemple'
    },
    no_input_file_detected: {
      en: 'No file has been selected',
      fr: 'Aucun fichier n\'a été sélectionné'
    },
    waiting: {
      en: 'Please wait',
      fr: 'Veuillez patienter'
    },
    old_app: {
      en: 'Legacy app.',
      fr: 'Version préc. app.'
    },
    excel_sheets_to_ignore: {
      en: 'Excel sheets to ignore',
      fr: 'Onglets excel à ignorer'
    },

    input_options: {
      en: 'Input file options',
      fr: 'Options d\'entrée'
    },
    output_options: {
      en: 'Output file options',
      fr: 'Options d\'enregistrement'
    },
    load: {
      fr: 'Ouvrir',
      en: 'Open'
    },
    file_converter: {
      fr: 'Convertisseur de fichiers',
      en: 'File convertor'
    },
    log_infos: {
      fr: 'Infos',
      en: 'Infos'
    },
    log_errors: {
      fr: 'Erreurs',
      en: 'Errors'
    },
    log_debug: {
      fr: 'Debug',
      en: 'Debug'
    }
  }
}

export interface FormatAttributeConfig<T> {
  default: T
  type: () => T
  labels: { en: string; fr: string }
  tooltips: { en: string; fr: string }
  visibilityConditions?: MenuCondition[]
}
export type FormatConfigStructure = Record<string, FormatAttributeConfig<boolean | number | string> | object>
// ==================================================================================================
// OPTIONS D'ENTRÉE (INPUT)
// ==================================================================================================

export const INPUT_ATTRIBUTES_CONFIG: FormatConfigStructure = {
  // =================== BASE (communes à tous les formats) ===================
  base: {
    // À compléter plus tard selon tes besoins
  },

  // =================== EXCEL ===================
  excel: {
    error_on_new_nodes: {
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Block node creation from fluxes',
        fr: 'Bloquer la création de nœuds depuis les flux'
      },
      tooltips: {
        en: 'If checked: nodes referenced in fluxes but absent from the nodes sheet are NOT created and the load fails with a summary error. If unchecked: nodes are created but listed in the info log; details are available in the debug tab.',
        fr: 'Si coché : les nœuds référencés dans les flux mais absents de l\'onglet nœuds ne sont PAS créés et le chargement échoue avec un récapitulatif. Si décoché : les nœuds sont créés mais listés dans les infos ; le détail est disponible dans l\'onglet debug.'
      }
    } satisfies FormatAttributeConfig<boolean>,

    error_on_new_flux: {
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Block flux creation from secondary sheets',
        fr: 'Bloquer la création de flux depuis les onglets secondaires'
      },
      tooltips: {
        en: 'If checked: fluxes referenced in data/constraints/min-max sheets but absent from base sheets (results, matrix) are NOT created and the load fails. If unchecked: fluxes are created but listed in the info log; details are available in the debug tab.',
        fr: 'Si coché : les flux référencés dans les onglets données/contraintes/min-max mais absents des onglets de base (résultats, matrice) ne sont PAS créés et le chargement échoue. Si décoché : les flux sont créés mais listés dans les infos ; le détail est disponible dans l\'onglet debug.'
      }
    } satisfies FormatAttributeConfig<boolean>,

    propagate_flux_to_children: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Propagate fluxes to children',
        fr: 'Propager les flux aux enfants'
      },
      tooltips: {
        en: 'Create child fluxes when they exist only on parent nodes',
        fr: 'Créer les flux enfants lorsqu\'ils n\'existent que sur les nœuds parents'
      }
    } satisfies FormatAttributeConfig<boolean>
  },

  // =================== JSON ===================
  json: {
    only_current_view: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Only current view',
        fr: 'Seulement la vue courante'
      },
      tooltips: {
        en: 'Load only the current view',
        fr: 'Charger seulement la vue courante'
      }
    } satisfies FormatAttributeConfig<boolean>
  },

  blob: {

  },
  example_excel: {},
  example_json: {}
} as const

// Définir base en dehors
const BASE_OUTPUT_CONFIG: FormatConfigStructure = {

  with_values: {
    default: true,
    type: (() => true) as (() => boolean),
    labels: {
      en: 'Save with links\' values',
      fr: 'Enregistrer avec les valeurs des flux'
    },
    tooltips: {
      en: 'Include link values in the export',
      fr: 'Inclure les valeurs des flux dans l\'export'
    }
  } satisfies FormatAttributeConfig<boolean>,

  save_only_visible_elements: {
    default: false,
    type: (() => false) as (() => boolean),
    labels: {
      en: 'Only save visible elements',
      fr: 'Enregistrer que les éléments visibles'
    },
    tooltips: {
      en: 'Export only visible elements in the diagram',
      fr: 'Exporter uniquement les éléments visibles dans le diagramme'
    }
  } satisfies FormatAttributeConfig<boolean>,

  save_only_elements_with_tags: {
    default: false,
    type: (() => false) as (() => boolean),
    labels: {
      en: 'Only save elements with selected tags',
      fr: 'Enregistrer que les éléments avec étiquettes sélectionnées'
    },
    tooltips: {
      en: 'Export only elements with selected tags',
      fr: 'Exporter uniquement les éléments avec les étiquettes sélectionnées'
    }
  } satisfies FormatAttributeConfig<boolean>,
  example_excel: {},
  example_json: {}
} as const

export const OUTPUT_ATTRIBUTES_CONFIG: FormatConfigStructure = {
  base: {
    ...BASE_OUTPUT_CONFIG,
  },
  excel: {
    mode_write: {
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Add results sheets',
        fr: 'Réécriture des feuilles'
      },
      tooltips: {
        en: 'Add results sheets',
        fr: 'Ajout onglets résultats'
      }
    } satisfies FormatAttributeConfig<boolean>,
    with_sheet_formating: {
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheet formatting',
        fr: 'Formattage des onglets excel'
      },
      tooltips: {
        en: 'Activate auto formatting and colorizing of sheets',
        fr: 'Activer le formatage automatique et la colorisation des feuilles'
      }
    } satisfies FormatAttributeConfig<boolean>,

    with_nodes_sheets: {
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheets nodes',
        fr: 'Onglets nœuds'
      },
      tooltips: {
        en: 'Activate writing of nodes related sheets',
        fr: 'Activer l\'écriture des feuilles liées aux nœuds'
      }
    } satisfies FormatAttributeConfig<boolean>,

    activate_data_table: {
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheet data',
        fr: 'Onglet données'
      },
      tooltips: {
        en: 'Activate writing of DATA_SHEET table',
        fr: 'Activer l\'écriture du tableau DATA_SHEET'
      }
    } satisfies FormatAttributeConfig<boolean>,

    data_table_with_all_flux: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Include flux without data',
        fr: 'Inclure les flux sans données'
      },
      tooltips: {
        en: 'Activate writing of all flux in DATA_SHEET table',
        fr: 'Activer l\'écriture de tous les flux dans le tableau DATA_SHEET'
      },
      // Utiliser le nouveau système de conditions
      visibilityConditions: [
        {
          type: 'optionProperty',
          property: 'activate_data_table',
          operator: '==',
          value: true
        }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    activate_flux_matrix: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Sheet SUT or IOT',
        fr: 'Onglet TER ou TES'
      },
      tooltips: {
        en: 'Activate writing of IO_SHEET / TER_SHEET table',
        fr: 'Activer l\'écriture du tableau IO_SHEET / TER_SHEET'
      }
    } satisfies FormatAttributeConfig<boolean>,

    flux_matrix_with_data: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'With data',
        fr: 'Avec données'
      },
      tooltips: {
        en: 'Activate writing of data in IO_SHEET / TER_SHEET table',
        fr: 'Activer l\'écriture des données dans le tableau IO_SHEET / TER_SHEET'
      },
      visibilityConditions: [
        {
          type: 'optionProperty',
          property: 'activate_flux_matrix',
          operator: '==',
          value: true
        }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    layout: {
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheet layout',
        fr: 'Onglet mise en page'
      },
      tooltips: {
        en: 'Sheet containing diagram layout',
        fr: 'Onglet qui contient la mise en page du diagramme'
      }
    } satisfies FormatAttributeConfig<boolean>,
  },
  json: {
    keep_siblings: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Keep siblings',
        fr: 'Conserver les frères'
      },
      tooltips: {
        en: 'Keep sibling nodes in the export',
        fr: 'Conserver les nœuds frères dans l\'export'
      }
    } satisfies FormatAttributeConfig<boolean>,

    mode_compressed: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'ZIP file',
        fr: 'Fichier ZIP'
      },
      tooltips: {
        en: 'Compress the file as ZIP',
        fr: 'Compresser le fichier en ZIP'
      }
    } satisfies FormatAttributeConfig<boolean>
  },

  blob: {},
  example_excel: {},
  example_json: {}
} as const

export type FormatType = 'base' | 'excel' | 'json' | 'blob' | 'example_excel' | 'example_json'

// Valeurs par défaut pour chaque format
export const getDefaultOutputOptions = (config: FormatAttributeConfig<boolean | number | string> | object): Record<string, unknown> => {
  return Object.keys(config).reduce((acc, key) => {
    // @ts-expect-error Type inference limitation
    acc[key] = config[key].default
    return acc
  }, {} as Record<string, unknown>)
}

export const getDefaultInputOptions = (config: FormatAttributeConfig<boolean | number | string> | object): Record<string, unknown> => {
  return Object.keys(config).reduce((acc, key) => {
    // @ts-expect-error Type inference limitation
    acc[key] = config[key].default
    return acc
  }, {} as Record<string, unknown>)
}

// export type ConfigAttribute<C, F extends FormatType, K> =
//   C extends typeof OUTPUT_ATTRIBUTES_CONFIG | typeof INPUT_ATTRIBUTES_CONFIG
//   ? K extends keyof C[F]
//   ? C[F][K]
//   : never
//   : never

// // Type helper pour garantir qu'on a bien un FormatAttributeConfig
// export type ExtractAttributeConfig<T> = T extends FormatAttributeConfig<infer U> ? FormatAttributeConfig<U> : never

// DialogConfigs.ts (ajouter à la fin)

export interface ConverterConfig {
  // Textes
  title: string
  launch_button_label: string
  success_status?: string
  failure_status?: string
  // Backend
  server_endpoint: string

  input: {
    required: boolean
    format: {
      options?: FormatType[]
    }
  }
  output: {
    required: boolean
    format: {
      options?: FormatType[]
    }
  }
}

export const hasOptionsFormat = (
  format: { fixed?: FormatType; options?: FormatType[] }
): format is { options: FormatType[] } => {
  return format.options !== undefined
}

// Helper pour obtenir le format initial
export const getInitialFormat = (
  format: { fixed?: FormatType; options?: FormatType[] },
  defaultFormat: FormatType
): FormatType => {
  if (hasOptionsFormat(format) && format.options.length > 0) {
    return format.options[0]
  }
  return defaultFormat
}

// Configurations prédéfinies
export const CONVERTER_CONFIGS = {
  // Convertisseur universel (tous les choix)
  universal: {
    title: 'ProcessDialog.file_converter',
    launch_button_label: 'ProcessDialog.launch',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: true,
      format: {
        options: ['excel', 'json', 'blob']
      },
    },
    output: {
      required: true,
      format: {
        options: ['excel', 'json']
      },
    },
  } satisfies ConverterConfig,
  load_excel: {
    title: 'ProcessDialog.open_excel_file',
    launch_button_label: 'ProcessDialog.load',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: true,
      format: {
        options: ['excel']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['json']  // Format fixe
      },
    },
  } satisfies ConverterConfig,
  load_json: {
    title: 'ProcessDialog.open_json_file',
    launch_button_label: 'ProcessDialog.load',
    server_endpoint: '',
    input: {
      required: true,
      format: {
        options: ['json']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['blob']  // Format fixe
      },
    },
  } satisfies ConverterConfig,
  save_json: {
    title: 'ProcessDialog.save_json_file',
    launch_button_label: 'ProcessDialog.save',
    server_endpoint: '',
    input: {
      required: false,
      format: {
        options: ['blob']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: true,
      format: {
        options: ['json']  // Format fixe
      },
    }
  } satisfies ConverterConfig,
  load_example_json: {
    title: 'ProcessDialog.load_example',
    launch_button_label: 'ProcessDialog.load',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: false,
      format: {
        options: ['example_json']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['json']  // Format fixe
      },
    }
  } satisfies ConverterConfig,
  load_example_excel: {
    title: 'ProcessDialog.load_example',
    launch_button_label: 'ProcessDialog.load',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: false,
      format: {
        options: ['example_excel']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['json']  // Format fixe
      },
    }
  } satisfies ConverterConfig,
  save_excel: {
    title: 'ProcessDialog.save_excel_file',
    launch_button_label: 'ProcessDialog.save',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: false,
      format: {
        options: ['blob']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: true,
      format: {
        options: ['excel']  // Format fixe
      },
    }
  } satisfies ConverterConfig,

  reconciliation: {
    title: 'ProcessDialog.reconciliation',
    launch_button_label: 'ProcessDialog.launch',
    server_endpoint: '/optimize/launch_optim',
    input: {
      required: true,
      format: {
        options: ['excel', 'json', 'blob'] // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: true,
      format: {
        options: ['excel', 'json']  // Format fixe
      },
    },
  } satisfies ConverterConfig,
  reconciliation_sankey: {
    title: 'ProcessDialog.reconciliation',
    launch_button_label: 'ProcessDialog.launch',
    server_endpoint: '/optimize/launch_optim',
    input: {
      required: false,
      format: {
        options: ['blob'] // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['blob']  // Format fixe
      },
    },
  } satisfies ConverterConfig,
} as const

export type ConverterConfigKey = keyof typeof CONVERTER_CONFIGS