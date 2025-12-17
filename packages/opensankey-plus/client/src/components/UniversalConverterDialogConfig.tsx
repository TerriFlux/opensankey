import { FormatAttributeConfig, INPUT_ATTRIBUTES_CONFIG, OUTPUT_ATTRIBUTES_CONFIG } from "../deps/OpenSankey/components/dialogs/PersistenceProcessDialogConfigs";
import { Class_ApplicationDataOSP } from "../types/ApplicationDataOSP"

export const OSP_OUTPUT_ATTRIBUTES_CONFIG = {
    ...OUTPUT_ATTRIBUTES_CONFIG
}

OSP_OUTPUT_ATTRIBUTES_CONFIG['base'] = {
    ...OUTPUT_ATTRIBUTES_CONFIG['base'],
    'only_current_view' : {
    default: false,
    type: (() => false) as (() => boolean),
    labels: {
      en: 'Only current view',
      fr: 'Seulement la vue courante'
    },
    tooltips: {
      en: 'Load only the current view',
      fr: 'Charger seulement la vue courante'
    },
    visibilityConditions: [
    {
        type: 'custom',
        customCheck: (app_data) => {
          const has_views = (app_data as Class_ApplicationDataOSP).has_views
          return has_views
        }
    }
    ]
  } satisfies FormatAttributeConfig<boolean> 
}

export const OSP_INPUT_ATTRIBUTES_CONFIG = {
    ...INPUT_ATTRIBUTES_CONFIG
}