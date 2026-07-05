import { FormatAttributeConfig, INPUT_ATTRIBUTES_CONFIG, OUTPUT_ATTRIBUTES_CONFIG } from '@terriflux/opensankey/src/components/dialogs/PersistenceProcessDialogConfigs'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'

export const OSP_OUTPUT_ATTRIBUTES_CONFIG = {
  ...OUTPUT_ATTRIBUTES_CONFIG
}

OSP_OUTPUT_ATTRIBUTES_CONFIG['base'] = {
  ...OUTPUT_ATTRIBUTES_CONFIG['base'],
  'only_current_view' : {
    group: 'content',
    default: false,
    type: (() => false) as (() => boolean),
    labels: {
      en: 'Only current view',
      fr: 'Seulement la vue courante',
      es: 'Solo la vista actual',
      de: 'Nur aktuelle Ansicht',
      it: 'Solo la vista corrente'
    },
    tooltips: {
      en: 'Export only the current view (instead of all views) when saving the diagram.',
      fr: 'Exporter uniquement la vue courante (au lieu de toutes les vues) lors de l\'enregistrement du diagramme.',
      es: 'Exportar solo la vista actual (en lugar de todas las vistas) al guardar el diagrama.',
      de: 'Beim Speichern des Diagramms nur die aktuelle Ansicht exportieren (anstatt alle Ansichten).',
      it: 'Esportare solo la vista corrente (invece di tutte le viste) al salvataggio del diagramma.'
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