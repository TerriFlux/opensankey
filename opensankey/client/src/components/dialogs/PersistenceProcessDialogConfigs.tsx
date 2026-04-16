import { MenuCondition } from './SankeyMenuContext'

export const translations = {
  ProcessDialog: {
    writing_option: {
      en: 'Options for writing the Excel file',
      fr: 'Options d\'écriture du fichier excel',
      es: 'Opciones de escritura del archivo Excel',
      de: 'Optionen zum Schreiben der Excel-Datei',
      it: 'Opzioni di scrittura del file Excel'
    },
    title: {
      en: 'Reconciliation',
      fr: 'Réconciliation',
      es: 'Reconciliación',
      de: 'Abstimmung',
      it: 'Riconciliazione'
    },
    success_status_optim: {
      en: 'Download results',
      fr: 'Télécharger les résultats',
      es: 'Descargar resultados',
      de: 'Ergebnisse herunterladen',
      it: 'Scarica risultati'
    },
    success_status_check_excel: {
      en: 'Verification finished',
      fr: 'Vérification terminée',
      es: 'Verificación finalizada',
      de: 'Überprüfung abgeschlossen',
      it: 'Verifica completata'
    },
    success_status_create_ter: {
      en: 'Creation finished',
      fr: 'Création Terminée',
      es: 'Creación finalizada',
      de: 'Erstellung abgeschlossen',
      it: 'Creazione completata'
    },
    fail_status_optim: {
      en: 'Fail to reconcile',
      fr: 'Echec de la réconciliation',
      es: 'Error en la reconciliación',
      de: 'Abstimmung fehlgeschlagen',
      it: 'Riconciliazione fallita'
    },
    fail_status_check_excel: {
      en: 'Fail to verify',
      fr: 'Echec de la vérification',
      es: 'Error en la verificación',
      de: 'Überprüfung fehlgeschlagen',
      it: 'Verifica fallita'
    },
    fail_status_create_ter: {
      en: 'Fail to create the TER',
      fr: 'Echec de la création',
      es: 'Error en la creación del TER',
      de: 'TER-Erstellung fehlgeschlagen',
      it: 'Creazione del TER fallita'
    },
    launch: {
      en: 'Launch',
      fr: 'Lancer',
      es: 'Iniciar',
      de: 'Starten',
      it: 'Avvia'
    },
    processing: {
      en: 'Processing...',
      fr: 'En traitement...',
      es: 'Procesando...',
      de: 'Verarbeitung...',
      it: 'Elaborazione...'
    },
    open_file: {
      en: 'Open the reconcilied file',
      fr: 'Ouvrir fichier réconcilié',
      es: 'Abrir el archivo reconciliado',
      de: 'Abgestimmte Datei öffnen',
      it: 'Apri il file riconciliato'
    },
    reset: {
      en: 'Reset',
      fr: 'Réinitialiser',
      es: 'Restablecer',
      de: 'Zurücksetzen',
      it: 'Reimposta'
    },
    success: {
      en: 'Success',
      fr: 'Succès',
      es: 'Éxito',
      de: 'Erfolg',
      it: 'Successo'
    },
    fail: {
      en: 'Failed',
      fr: 'Echec',
      es: 'Error',
      de: 'Fehlgeschlagen',
      it: 'Fallito'
    },
    infos: {
      en: 'Infos',
      fr: 'Infos',
      es: 'Información',
      de: 'Infos',
      it: 'Info'
    },
    err: {
      en: 'Warnings',
      fr: 'Avertissements',
      es: 'Advertencias',
      de: 'Warnungen',
      it: 'Avvisi'
    },
    debug: {
      en: 'Debug',
      fr: 'Debug',
      es: 'Depuración',
      de: 'Debug',
      it: 'Debug'
    },
    input_parameters: {
      en: 'Input',
      fr: 'Entrée',
      es: 'Entrada',
      de: 'Eingabe',
      it: 'Ingresso'
    },
    output_parameters: {
      en: 'Output',
      fr: 'Sortie',
      es: 'Salida',
      de: 'Ausgabe',
      it: 'Uscita'
    },
    input_format: {
      en: 'Format',
      fr: 'Format',
      es: 'Formato',
      de: 'Format',
      it: 'Formato'
    },
    output_format: {
      en: 'Format',
      fr: 'Format',
      es: 'Formato',
      de: 'Format',
      it: 'Formato'
    },
    input_excel: {
      en: 'Entering excel file',
      fr: 'Fichier d\'entrée excel',
      es: 'Archivo Excel de entrada',
      de: 'Excel-Eingabedatei',
      it: 'File Excel di input'
    },
    input_layout: {
      en: 'Layout file',
      fr: 'Diagramme de mise en page',
      es: 'Archivo de diseño',
      de: 'Layout-Datei',
      it: 'File di layout'
    },
    check_scale_geo: {
      en: 'Scale\'s descent',
      fr: 'Descente d\'échelle',
      es: 'Descenso de escala',
      de: 'Skalenabstieg',
      it: 'Discesa di scala'
    },
    input_scale_geo: {
      en: 'MFA file from supperior geographic level',
      fr: 'Fichier MFA du niveau géographique supérieur',
      es: 'Archivo MFA del nivel geográfico superior',
      de: 'MFA-Datei der übergeordneten geografischen Ebene',
      it: 'File MFA del livello geografico superiore'
    },
    check_analyse_uncert: {
      en: 'Uncertainty analysis',
      fr: 'Analyse d\'incertitude',
      es: 'Análisis de incertidumbre',
      de: 'Unsicherheitsanalyse',
      it: 'Analisi di incertezza'
    },
    input_analyse_uncert: {
      en: 'Number of realisation',
      fr: 'Nombre de réalisations',
      es: 'Número de realizaciones',
      de: 'Anzahl der Realisierungen',
      it: 'Numero di realizzazioni'
    },
    waiting_file: {
      en: 'Choose an input file',
      fr: 'Veuillez choisir un fichier d\'entrée',
      es: 'Elija un archivo de entrada',
      de: 'Wählen Sie eine Eingabedatei',
      it: 'Scegliere un file di input'
    },
    reconciliation: {
      en: 'Reconciliation',
      fr: 'Réconciliation',
      es: 'Reconciliación',
      de: 'Abstimmung',
      it: 'Riconciliazione'
    },
    open_excel_file: {
      en: 'Open an excel file',
      fr: 'Ouvrir fichier excel',
      es: 'Abrir archivo Excel',
      de: 'Excel-Datei öffnen',
      it: 'Apri file Excel'
    },
    open_json_file: {
      en: 'Open a JSON file',
      fr: 'Ouvrir un fichier JSON',
      es: 'Abrir un archivo JSON',
      de: 'JSON-Datei öffnen',
      it: 'Apri un file JSON'
    },
    save_excel_file: {
      en: 'Save Excel',
      fr: 'Enregistrer Excel',
      es: 'Guardar Excel',
      de: 'Excel speichern',
      it: 'Salva Excel'
    },
    save_json_file: {
      en: 'Save JSON',
      fr: 'Enregistrer JSON',
      es: 'Guardar JSON',
      de: 'JSON speichern',
      it: 'Salva JSON'
    },
    save: {
      en: 'Save',
      fr: 'Enregistrer',
      es: 'Guardar',
      de: 'Speichern',
      it: 'Salva'
    },
    input_file_excel: {
      en: 'Input file Excel',
      fr: 'Fichier d\'entrée excel',
      es: 'Archivo Excel de entrada',
      de: 'Excel-Eingabedatei',
      it: 'File Excel di input'
    },
    input_file_json: {
      en: 'Input file JSON',
      fr: 'Fichier d\'entrée json',
      es: 'Archivo JSON de entrada',
      de: 'JSON-Eingabedatei',
      it: 'File JSON di input'
    },
    load_example: {
      en: 'Load Example',
      fr: 'Chargement de l\'exemple',
      es: 'Cargar ejemplo',
      de: 'Beispiel laden',
      it: 'Carica esempio'
    },
    no_input_file_detected: {
      en: 'No file has been selected',
      fr: 'Aucun fichier n\'a été sélectionné',
      es: 'No se ha seleccionado ningún archivo',
      de: 'Keine Datei ausgewählt',
      it: 'Nessun file selezionato'
    },
    waiting: {
      en: 'Please wait',
      fr: 'Veuillez patienter',
      es: 'Por favor espere',
      de: 'Bitte warten',
      it: 'Attendere prego'
    },
    old_app: {
      en: 'Legacy app.',
      fr: 'Version préc. app.',
      es: 'Aplicación anterior',
      de: 'Ältere App',
      it: 'App precedente'
    },
    excel_sheets_to_ignore: {
      en: 'Excel sheets to ignore',
      fr: 'Onglets excel à ignorer',
      es: 'Hojas Excel a ignorar',
      de: 'Zu ignorierende Excel-Blätter',
      it: 'Fogli Excel da ignorare'
    },

    layout_section: {
      en: 'Layout',
      fr: 'Mise en page',
      es: 'Diseño',
      de: 'Layout',
      it: 'Layout'
    },
    layout_from_displayed: {
      en: 'From displayed sankey',
      fr: 'A partir du sankey affiché',
      es: 'Desde el sankey mostrado',
      de: 'Vom angezeigten Sankey',
      it: 'Dal sankey visualizzato'
    },
    layout_from_displayed_tt: {
      en: 'Keep node positions from the currently displayed sankey instead of computing a new layout',
      fr: 'Conserver les positions des nœuds du sankey actuellement affiché au lieu de calculer une nouvelle mise en page',
      es: 'Conservar las posiciones de los nodos del sankey actualmente mostrado en lugar de calcular un nuevo diseño',
      de: 'Knotenpositionen des aktuell angezeigten Sankeys beibehalten statt ein neues Layout zu berechnen',
      it: 'Mantenere le posizioni dei nodi dal sankey attualmente visualizzato invece di calcolare un nuovo layout'
    },
    layout_h_spacing: {
      en: 'Horizontal spacing',
      fr: 'Ecart horizontal',
      es: 'Espaciado horizontal',
      de: 'Horizontaler Abstand',
      it: 'Spaziatura orizzontale'
    },
    layout_h_spacing_tt: {
      en: 'Horizontal distance (in pixels) between node columns',
      fr: 'Distance horizontale (en pixels) entre les colonnes de nœuds',
      es: 'Distancia horizontal (en píxeles) entre las columnas de nodos',
      de: 'Horizontaler Abstand (in Pixeln) zwischen Knotenspalten',
      it: 'Distanza orizzontale (in pixel) tra le colonne dei nodi'
    },
    layout_v_spacing: {
      en: 'Vertical spacing',
      fr: 'Ecart vertical',
      es: 'Espaciado vertical',
      de: 'Vertikaler Abstand',
      it: 'Spaziatura verticale'
    },
    layout_v_spacing_tt: {
      en: 'Vertical distance (in pixels) between nodes within the same column',
      fr: 'Distance verticale (en pixels) entre les nœuds d\'une même colonne',
      es: 'Distancia vertical (en píxeles) entre los nodos de una misma columna',
      de: 'Vertikaler Abstand (in Pixeln) zwischen Knoten innerhalb derselben Spalte',
      it: 'Distanza verticale (in pixel) tra i nodi della stessa colonna'
    },
    layout_sources: {
      en: 'Source nodes',
      fr: 'Nœuds sans entrée',
      es: 'Nodos fuente',
      de: 'Quellknoten',
      it: 'Nodi sorgente'
    },
    layout_sources_tt: {
      en: 'Placement of nodes with no incoming flow: just before their first successor, or pinned to the left extremity of the diagram',
      fr: 'Placement des nœuds sans flux entrant : juste avant leur premier successeur, ou collés à l\'extrémité gauche du diagramme',
      es: 'Ubicación de los nodos sin flujo entrante: justo antes de su primer sucesor, o fijados al extremo izquierdo del diagrama',
      de: 'Platzierung von Knoten ohne eingehenden Fluss: direkt vor ihrem ersten Nachfolger oder am linken Rand des Diagramms fixiert',
      it: 'Posizionamento dei nodi senza flusso in ingresso: appena prima del primo successore, o fissati all\'estremità sinistra del diagramma'
    },
    layout_sinks: {
      en: 'Sink nodes',
      fr: 'Nœuds sans sortie',
      es: 'Nodos sumidero',
      de: 'Senkenknoten',
      it: 'Nodi pozzo'
    },
    layout_sinks_tt: {
      en: 'Placement of nodes with no outgoing flow: just after their last predecessor, or pinned to the right extremity of the diagram',
      fr: 'Placement des nœuds sans flux sortant : juste après leur dernier prédécesseur, ou collés à l\'extrémité droite du diagramme',
      es: 'Ubicación de los nodos sin flujo saliente: justo después de su último predecesor, o fijados al extremo derecho del diagrama',
      de: 'Platzierung von Knoten ohne ausgehenden Fluss: direkt nach ihrem letzten Vorgänger oder am rechten Rand des Diagramms fixiert',
      it: 'Posizionamento dei nodi senza flusso in uscita: appena dopo l\'ultimo predecessore, o fissati all\'estremità destra del diagramma'
    },
    layout_before_neighbor: {
      en: 'Column before neighbor',
      fr: 'Colonne avant voisin',
      es: 'Columna antes del vecino',
      de: 'Spalte vor Nachbar',
      it: 'Colonna prima del vicino'
    },
    layout_left_extremity: {
      en: 'Left extremity',
      fr: 'Extrémité gauche',
      es: 'Extremo izquierdo',
      de: 'Linkes Ende',
      it: 'Estremità sinistra'
    },
    layout_after_neighbor: {
      en: 'Column after neighbor',
      fr: 'Colonne après voisin',
      es: 'Columna después del vecino',
      de: 'Spalte nach Nachbar',
      it: 'Colonna dopo il vicino'
    },
    layout_right_extremity: {
      en: 'Right extremity',
      fr: 'Extrémité droite',
      es: 'Extremo derecho',
      de: 'Rechtes Ende',
      it: 'Estremità destra'
    },
    layout_mode: {
      en: 'Mode',
      fr: 'Mode',
      es: 'Modo',
      de: 'Modus',
      it: 'Modalità'
    },
    layout_mode_tt: {
      en: 'Center: vertical centering of nodes within each column. Minimize crossings: tries to reduce the number of link crossings (slower)',
      fr: 'Centrer : centrage vertical des nœuds dans chaque colonne. Minimiser les croisements : tente de réduire le nombre de croisements de flux (plus lent)',
      es: 'Centrar: centrado vertical de los nodos en cada columna. Minimizar cruces: intenta reducir el número de cruces de flujos (más lento)',
      de: 'Zentrieren: vertikale Zentrierung der Knoten in jeder Spalte. Kreuzungen minimieren: versucht die Anzahl der Flusskreuzungen zu reduzieren (langsamer)',
      it: 'Centra: centramento verticale dei nodi in ogni colonna. Minimizza incroci: cerca di ridurre il numero di incroci dei flussi (più lento)'
    },
    layout_center: {
      en: 'Center nodes',
      fr: 'Centrer les nœuds',
      es: 'Centrar nodos',
      de: 'Knoten zentrieren',
      it: 'Centra nodi'
    },
    layout_minimize: {
      en: 'Minimize crossings',
      fr: 'Minimiser les croisements',
      es: 'Minimizar cruces',
      de: 'Kreuzungen minimieren',
      it: 'Minimizza incroci'
    },
    layout_reset: {
      en: 'Reset to default',
      fr: 'Réinitialiser au défaut',
      es: 'Restablecer valores predeterminados',
      de: 'Auf Standard zurücksetzen',
      it: 'Ripristina predefiniti'
    },
    layout_reset_tt: {
      en: 'Reset all layout options to their default values',
      fr: 'Remettre toutes les options de mise en page à leurs valeurs par défaut',
      es: 'Restablecer todas las opciones de diseño a sus valores predeterminados',
      de: 'Alle Layout-Optionen auf ihre Standardwerte zurücksetzen',
      it: 'Reimpostare tutte le opzioni di layout ai valori predefiniti'
    },
    layout_apply: {
      en: 'Apply layout',
      fr: 'Mise en page',
      es: 'Aplicar diseño',
      de: 'Layout anwenden',
      it: 'Applica layout'
    },
    layout_apply_tt: {
      en: 'Run the automatic layout computation with the options above',
      fr: 'Lancer le calcul de la mise en page automatique avec les options ci-dessus',
      es: 'Ejecutar el cálculo de diseño automático con las opciones anteriores',
      de: 'Die automatische Layout-Berechnung mit den obigen Optionen ausführen',
      it: 'Eseguire il calcolo del layout automatico con le opzioni sopra indicate'
    },

    input_options: {
      en: 'Input file options',
      fr: 'Options d\'entrée',
      es: 'Opciones de archivo de entrada',
      de: 'Eingabedatei-Optionen',
      it: 'Opzioni file di input'
    },
    output_options: {
      en: 'Output file options',
      fr: 'Options d\'enregistrement',
      es: 'Opciones de archivo de salida',
      de: 'Ausgabedatei-Optionen',
      it: 'Opzioni file di output'
    },
    load: {
      fr: 'Ouvrir',
      en: 'Open',
      es: 'Abrir',
      de: 'Öffnen',
      it: 'Apri'
    },
    file_converter: {
      fr: 'Convertisseur de fichiers',
      en: 'File convertor',
      es: 'Convertidor de archivos',
      de: 'Dateikonverter',
      it: 'Convertitore di file'
    },
    log_infos: {
      fr: 'Infos',
      en: 'Infos',
      es: 'Información',
      de: 'Infos',
      it: 'Info'
    },
    log_errors: {
      fr: 'Erreurs',
      en: 'Errors',
      es: 'Errores',
      de: 'Fehler',
      it: 'Errori'
    },
    log_debug: {
      fr: 'Debug',
      en: 'Debug',
      es: 'Depuración',
      de: 'Debug',
      it: 'Debug'
    }
  }
}

export interface FormatAttributeConfig<T> {
  default: T
  type: () => T
  labels: { en: string; fr: string; es?: string; de?: string; it?: string }
  tooltips: { en: string; fr: string; es?: string; de?: string; it?: string }
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
        fr: 'Bloquer la création de nœuds depuis les flux',
        es: 'Bloquear la creación de nodos desde los flujos',
        de: 'Knotenerstellung aus Flüssen blockieren',
        it: 'Bloccare la creazione di nodi dai flussi'
      },
      tooltips: {
        en: 'If checked: nodes referenced in fluxes but absent from the nodes sheet are NOT created and the load fails with a summary error. If unchecked: nodes are created but listed in the info log; details are available in the debug tab.',
        fr: 'Si coché : les nœuds référencés dans les flux mais absents de l\'onglet nœuds ne sont PAS créés et le chargement échoue avec un récapitulatif. Si décoché : les nœuds sont créés mais listés dans les infos ; le détail est disponible dans l\'onglet debug.',
        es: 'Si está marcado: los nodos referenciados en los flujos pero ausentes de la hoja de nodos NO se crean y la carga falla con un error resumen. Si no está marcado: los nodos se crean pero se listan en el registro de información; los detalles están disponibles en la pestaña de depuración.',
        de: 'Wenn aktiviert: Knoten, die in Flüssen referenziert aber im Knotenblatt nicht vorhanden sind, werden NICHT erstellt und das Laden schlägt mit einer Zusammenfassung fehl. Wenn deaktiviert: Knoten werden erstellt aber im Info-Log aufgelistet; Details sind im Debug-Tab verfügbar.',
        it: 'Se selezionato: i nodi referenziati nei flussi ma assenti dal foglio nodi NON vengono creati e il caricamento fallisce con un errore riepilogativo. Se non selezionato: i nodi vengono creati ma elencati nel registro informazioni; i dettagli sono disponibili nella scheda debug.'
      }
    } satisfies FormatAttributeConfig<boolean>,

    error_on_new_flux: {
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Block flux creation from secondary sheets',
        fr: 'Bloquer la création de flux depuis les onglets secondaires',
        es: 'Bloquear la creación de flujos desde las hojas secundarias',
        de: 'Flusserstellung aus sekundären Blättern blockieren',
        it: 'Bloccare la creazione di flussi dai fogli secondari'
      },
      tooltips: {
        en: 'If checked: fluxes referenced in data/constraints/min-max sheets but absent from base sheets (results, matrix) are NOT created and the load fails. If unchecked: fluxes are created but listed in the info log; details are available in the debug tab.',
        fr: 'Si coché : les flux référencés dans les onglets données/contraintes/min-max mais absents des onglets de base (résultats, matrice) ne sont PAS créés et le chargement échoue. Si décoché : les flux sont créés mais listés dans les infos ; le détail est disponible dans l\'onglet debug.',
        es: 'Si está marcado: los flujos referenciados en las hojas de datos/restricciones/min-max pero ausentes de las hojas base (resultados, matriz) NO se crean y la carga falla. Si no está marcado: los flujos se crean pero se listan en el registro de información; los detalles están disponibles en la pestaña de depuración.',
        de: 'Wenn aktiviert: Flüsse, die in Daten-/Einschränkungs-/Min-Max-Blättern referenziert aber in Basisblättern (Ergebnisse, Matrix) nicht vorhanden sind, werden NICHT erstellt und das Laden schlägt fehl. Wenn deaktiviert: Flüsse werden erstellt aber im Info-Log aufgelistet; Details sind im Debug-Tab verfügbar.',
        it: 'Se selezionato: i flussi referenziati nei fogli dati/vincoli/min-max ma assenti dai fogli base (risultati, matrice) NON vengono creati e il caricamento fallisce. Se non selezionato: i flussi vengono creati ma elencati nel registro informazioni; i dettagli sono disponibili nella scheda debug.'
      }
    } satisfies FormatAttributeConfig<boolean>,

    propagate_flux_to_children: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Propagate fluxes to children',
        fr: 'Propager les flux aux enfants',
        es: 'Propagar flujos a los hijos',
        de: 'Flüsse an Kinder weitergeben',
        it: 'Propagare i flussi ai figli'
      },
      tooltips: {
        en: 'Create child fluxes when they exist only on parent nodes',
        fr: 'Créer les flux enfants lorsqu\'ils n\'existent que sur les nœuds parents',
        es: 'Crear flujos hijos cuando existen solo en los nodos padre',
        de: 'Kindflüsse erstellen, wenn sie nur auf Elternknoten existieren',
        it: 'Creare flussi figli quando esistono solo sui nodi genitore'
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
        fr: 'Seulement la vue courante',
        es: 'Solo la vista actual',
        de: 'Nur aktuelle Ansicht',
        it: 'Solo la vista corrente'
      },
      tooltips: {
        en: 'Load only the current view',
        fr: 'Charger seulement la vue courante',
        es: 'Cargar solo la vista actual',
        de: 'Nur die aktuelle Ansicht laden',
        it: 'Caricare solo la vista corrente'
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
      fr: 'Enregistrer avec les valeurs des flux',
      es: 'Guardar con los valores de los flujos',
      de: 'Mit Flusswerten speichern',
      it: 'Salva con i valori dei flussi'
    },
    tooltips: {
      en: 'Include link values in the export',
      fr: 'Inclure les valeurs des flux dans l\'export',
      es: 'Incluir los valores de los flujos en la exportación',
      de: 'Flusswerte in den Export einbeziehen',
      it: 'Includere i valori dei flussi nell\'esportazione'
    }
  } satisfies FormatAttributeConfig<boolean>,

  save_only_visible_elements: {
    default: false,
    type: (() => false) as (() => boolean),
    labels: {
      en: 'Only save visible elements',
      fr: 'Enregistrer que les éléments visibles',
      es: 'Guardar solo los elementos visibles',
      de: 'Nur sichtbare Elemente speichern',
      it: 'Salva solo gli elementi visibili'
    },
    tooltips: {
      en: 'Export only visible elements in the diagram',
      fr: 'Exporter uniquement les éléments visibles dans le diagramme',
      es: 'Exportar solo los elementos visibles en el diagrama',
      de: 'Nur sichtbare Elemente im Diagramm exportieren',
      it: 'Esportare solo gli elementi visibili nel diagramma'
    }
  } satisfies FormatAttributeConfig<boolean>,

  save_only_elements_with_tags: {
    default: false,
    type: (() => false) as (() => boolean),
    labels: {
      en: 'Only save elements with selected tags',
      fr: 'Enregistrer que les éléments avec étiquettes sélectionnées',
      es: 'Guardar solo los elementos con etiquetas seleccionadas',
      de: 'Nur Elemente mit ausgewählten Tags speichern',
      it: 'Salva solo gli elementi con etichette selezionate'
    },
    tooltips: {
      en: 'Export only elements with selected tags',
      fr: 'Exporter uniquement les éléments avec les étiquettes sélectionnées',
      es: 'Exportar solo los elementos con etiquetas seleccionadas',
      de: 'Nur Elemente mit ausgewählten Tags exportieren',
      it: 'Esportare solo gli elementi con etichette selezionate'
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
        fr: 'Réécriture des feuilles',
        es: 'Agregar hojas de resultados',
        de: 'Ergebnisblätter hinzufügen',
        it: 'Aggiungi fogli risultati'
      },
      tooltips: {
        en: 'Add results sheets',
        fr: 'Ajout onglets résultats',
        es: 'Agregar hojas de resultados',
        de: 'Ergebnisblätter hinzufügen',
        it: 'Aggiungi fogli risultati'
      }
    } satisfies FormatAttributeConfig<boolean>,
    with_sheet_formating: {
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheet formatting',
        fr: 'Formattage des onglets excel',
        es: 'Formato de hojas',
        de: 'Blattformatierung',
        it: 'Formattazione fogli'
      },
      tooltips: {
        en: 'Activate auto formatting and colorizing of sheets',
        fr: 'Activer le formatage automatique et la colorisation des feuilles',
        es: 'Activar el formato y coloreado automático de las hojas',
        de: 'Automatische Formatierung und Einfärbung der Blätter aktivieren',
        it: 'Attivare la formattazione automatica e la colorazione dei fogli'
      }
    } satisfies FormatAttributeConfig<boolean>,

    with_nodes_sheets: {
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheets nodes',
        fr: 'Onglets nœuds',
        es: 'Hojas de nodos',
        de: 'Knotenblätter',
        it: 'Fogli nodi'
      },
      tooltips: {
        en: 'Activate writing of nodes related sheets',
        fr: 'Activer l\'écriture des feuilles liées aux nœuds',
        es: 'Activar la escritura de las hojas relacionadas con los nodos',
        de: 'Schreiben von knotenbezogenen Blättern aktivieren',
        it: 'Attivare la scrittura dei fogli relativi ai nodi'
      }
    } satisfies FormatAttributeConfig<boolean>,

    activate_data_table: {
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheet data',
        fr: 'Onglet données',
        es: 'Hoja de datos',
        de: 'Datenblatt',
        it: 'Foglio dati'
      },
      tooltips: {
        en: 'Activate writing of DATA_SHEET table',
        fr: 'Activer l\'écriture du tableau DATA_SHEET',
        es: 'Activar la escritura de la tabla DATA_SHEET',
        de: 'Schreiben der DATA_SHEET-Tabelle aktivieren',
        it: 'Attivare la scrittura della tabella DATA_SHEET'
      }
    } satisfies FormatAttributeConfig<boolean>,

    data_table_with_all_flux: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Include flux without data',
        fr: 'Inclure les flux sans données',
        es: 'Incluir flujos sin datos',
        de: 'Flüsse ohne Daten einbeziehen',
        it: 'Includere flussi senza dati'
      },
      tooltips: {
        en: 'Activate writing of all flux in DATA_SHEET table',
        fr: 'Activer l\'écriture de tous les flux dans le tableau DATA_SHEET',
        es: 'Activar la escritura de todos los flujos en la tabla DATA_SHEET',
        de: 'Schreiben aller Flüsse in der DATA_SHEET-Tabelle aktivieren',
        it: 'Attivare la scrittura di tutti i flussi nella tabella DATA_SHEET'
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
        fr: 'Onglet TER ou TES',
        es: 'Hoja SUT o IOT',
        de: 'Blatt SUT oder IOT',
        it: 'Foglio SUT o IOT'
      },
      tooltips: {
        en: 'Activate writing of IO_SHEET / TER_SHEET table',
        fr: 'Activer l\'écriture du tableau IO_SHEET / TER_SHEET',
        es: 'Activar la escritura de la tabla IO_SHEET / TER_SHEET',
        de: 'Schreiben der IO_SHEET / TER_SHEET-Tabelle aktivieren',
        it: 'Attivare la scrittura della tabella IO_SHEET / TER_SHEET'
      }
    } satisfies FormatAttributeConfig<boolean>,

    flux_matrix_with_data: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'With data',
        fr: 'Avec données',
        es: 'Con datos',
        de: 'Mit Daten',
        it: 'Con dati'
      },
      tooltips: {
        en: 'Activate writing of data in IO_SHEET / TER_SHEET table',
        fr: 'Activer l\'écriture des données dans le tableau IO_SHEET / TER_SHEET',
        es: 'Activar la escritura de datos en la tabla IO_SHEET / TER_SHEET',
        de: 'Schreiben von Daten in der IO_SHEET / TER_SHEET-Tabelle aktivieren',
        it: 'Attivare la scrittura dei dati nella tabella IO_SHEET / TER_SHEET'
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
        fr: 'Onglet mise en page',
        es: 'Hoja de diseño',
        de: 'Layout-Blatt',
        it: 'Foglio layout'
      },
      tooltips: {
        en: 'Sheet containing diagram layout',
        fr: 'Onglet qui contient la mise en page du diagramme',
        es: 'Hoja que contiene el diseño del diagrama',
        de: 'Blatt mit dem Diagramm-Layout',
        it: 'Foglio contenente il layout del diagramma'
      }
    } satisfies FormatAttributeConfig<boolean>,
  },
  json: {
    keep_siblings: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Keep siblings',
        fr: 'Conserver les frères',
        es: 'Conservar hermanos',
        de: 'Geschwister beibehalten',
        it: 'Conserva fratelli'
      },
      tooltips: {
        en: 'Keep sibling nodes in the export',
        fr: 'Conserver les nœuds frères dans l\'export',
        es: 'Conservar los nodos hermanos en la exportación',
        de: 'Geschwisterknoten im Export beibehalten',
        it: 'Conservare i nodi fratelli nell\'esportazione'
      }
    } satisfies FormatAttributeConfig<boolean>,

    mode_compressed: {
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'ZIP file',
        fr: 'Fichier ZIP',
        es: 'Archivo ZIP',
        de: 'ZIP-Datei',
        it: 'File ZIP'
      },
      tooltips: {
        en: 'Compress the file as ZIP',
        fr: 'Compresser le fichier en ZIP',
        es: 'Comprimir el archivo como ZIP',
        de: 'Datei als ZIP komprimieren',
        it: 'Comprimi il file come ZIP'
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