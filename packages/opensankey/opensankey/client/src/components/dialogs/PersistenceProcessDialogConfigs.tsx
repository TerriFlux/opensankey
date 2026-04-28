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

export type OptionGroup =
  | 'validation'
  | 'completion'
  | 'sheets'
  | 'content'
  | 'merge'
  | 'presentation'
  | 'packaging'

// Ordre d'affichage imposé des groupes dans la boîte de dialogue.
export const OPTION_GROUP_ORDER: OptionGroup[] = [
  'validation',
  'completion',
  'sheets',
  'content',
  'merge',
  'presentation',
  'packaging',
]

export type OptionDirection = 'input' | 'output'

type LocalizedLabel = { en: string; fr: string; es: string; de: string; it: string }
type DirectedLabel = Record<OptionDirection, LocalizedLabel>

// Libellés directionnels : chaque groupe a une variante « lecture » et « écriture »
// pour distinguer l'usage même quand il n'apparaît que d'un seul côté.
export const OPTION_GROUP_LABELS: Record<OptionGroup, DirectedLabel> = {
  validation: {
    input: { en: 'Validation (read)', fr: 'Validation (lecture)', es: 'Validación (lectura)', de: 'Validierung (Lesen)', it: 'Convalida (lettura)' },
    output: { en: 'Validation (write)', fr: 'Validation (écriture)', es: 'Validación (escritura)', de: 'Validierung (Schreiben)', it: 'Convalida (scrittura)' },
  },
  completion: {
    input: { en: 'Graph completion (read)', fr: 'Complétion du graphe (lecture)', es: 'Completado del grafo (lectura)', de: 'Graphvervollständigung (Lesen)', it: 'Completamento del grafo (lettura)' },
    output: { en: 'Graph completion (write)', fr: 'Complétion du graphe (écriture)', es: 'Completado del grafo (escritura)', de: 'Graphvervollständigung (Schreiben)', it: 'Completamento del grafo (scrittura)' },
  },
  sheets: {
    input: { en: 'Read sheets', fr: 'Onglets lus', es: 'Hojas leídas', de: 'Gelesene Blätter', it: 'Fogli letti' },
    output: { en: 'Written sheets', fr: 'Onglets écrits', es: 'Hojas escritas', de: 'Geschriebene Blätter', it: 'Fogli scritti' },
  },
  content: {
    input: { en: 'Read content', fr: 'Contenu lu', es: 'Contenido leído', de: 'Gelesener Inhalt', it: 'Contenuto letto' },
    output: { en: 'Written content', fr: 'Contenu écrit', es: 'Contenido escrito', de: 'Geschriebener Inhalt', it: 'Contenuto scritto' },
  },
  merge: {
    input: { en: 'Merge (read)', fr: 'Fusion (lecture)', es: 'Fusión (lectura)', de: 'Zusammenführen (Lesen)', it: 'Unione (lettura)' },
    output: { en: 'Merge with existing file', fr: 'Fusion avec fichier existant', es: 'Fusionar con archivo existente', de: 'Mit vorhandener Datei zusammenführen', it: 'Unione con file esistente' },
  },
  presentation: {
    input: { en: 'Presentation (read)', fr: 'Présentation (lecture)', es: 'Presentación (lectura)', de: 'Präsentation (Lesen)', it: 'Presentazione (lettura)' },
    output: { en: 'Presentation (write)', fr: 'Présentation (écriture)', es: 'Presentación (escritura)', de: 'Präsentation (Schreiben)', it: 'Presentazione (scrittura)' },
  },
  packaging: {
    input: { en: 'Packaging (read)', fr: 'Conditionnement (lecture)', es: 'Empaquetado (lectura)', de: 'Verpackung (Lesen)', it: 'Confezionamento (lettura)' },
    output: { en: 'Packaging (write)', fr: 'Conditionnement (écriture)', es: 'Empaquetado (escritura)', de: 'Verpackung (Schreiben)', it: 'Confezionamento (scrittura)' },
  },
}

export interface FormatAttributeConfig<T> {
  default: T
  type: () => T
  labels: { en: string; fr: string; es?: string; de?: string; it?: string }
  tooltips: { en: string; fr: string; es?: string; de?: string; it?: string }
  visibilityConditions?: MenuCondition[]
  group?: OptionGroup
  // Force a row break in the auto-generated options renderer before rendering
  // this option's unit (parent + visibility-conditioned children).
  breakBefore?: boolean
}
export type FormatConfigStructure = Record<string, FormatAttributeConfig<boolean | number | string> | object>
// ==================================================================================================
// OPTIONS D'ENTRÉE (INPUT)
// ==================================================================================================

export const INPUT_ATTRIBUTES_CONFIG: FormatConfigStructure = {
  // =================== BASE (communes à tous les formats) ===================
  base: {
    error_on_new_nodes: {
      group: 'validation',
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
      group: 'validation',
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
      group: 'completion',
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
    } satisfies FormatAttributeConfig<boolean>,

    propagate_flux_to_parent: {
      group: 'completion',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Propagate fluxes to parents',
        fr: 'Propager les flux aux parents',
        es: 'Propagar flujos a los padres',
        de: 'Flüsse an Eltern weitergeben',
        it: 'Propagare i flussi ai genitori'
      },
      tooltips: {
        en: 'Create parent fluxes when they exist only on child nodes',
        fr: 'Créer les flux parents lorsqu\'ils n\'existent que sur les n\u0153uds enfants',
        es: 'Crear flujos padres cuando existen solo en los nodos hijos',
        de: 'Elternflüsse erstellen, wenn sie nur auf Kindknoten existieren',
        it: 'Creare flussi genitori quando esistono solo sui nodi figli'
      }
    } satisfies FormatAttributeConfig<boolean>,

    autogenerate_leveltags: {
      group: 'completion',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Auto-generate level tags',
        fr: 'Générer les tags de niveau automatiques',
        es: 'Generar etiquetas de nivel automáticas',
        de: 'Ebenen-Tags automatisch erzeugen',
        it: 'Generare tag di livello automatici'
      },
      tooltips: {
        en: 'Create level tag groups (Dimension 1, 2, ...) from the node hierarchy. Disabled by default: auto-generated dimensions are often not antagonistic, so it is usually safer to aggregate/disaggregate locally. A single auto-dimension is never generated.',
        fr: 'Créer les groupes de tags de niveau (Dimension 1, 2, ...) à partir de la hiérarchie des nœuds. Désactivé par défaut : les dimensions générées ne sont souvent pas antagonistes, il vaut mieux agréger/désagréger localement. Une dimension auto seule n\'est jamais générée.',
        es: 'Crear grupos de etiquetas de nivel (Dimensión 1, 2, ...) a partir de la jerarquía de nodos. Desactivado por defecto: las dimensiones generadas a menudo no son antagónicas, es más seguro agregar/desagregar localmente. Una única dimensión auto nunca se genera.',
        de: 'Ebenen-Tag-Gruppen (Dimension 1, 2, ...) aus der Knotenhierarchie erstellen. Standardmäßig deaktiviert: automatisch erzeugte Dimensionen sind oft nicht antagonistisch, lokale Aggregation ist meist sicherer. Eine einzelne Auto-Dimension wird nie erzeugt.',
        it: 'Creare gruppi di tag di livello (Dimensione 1, 2, ...) dalla gerarchia dei nodi. Disattivato per impostazione predefinita: le dimensioni generate spesso non sono antagoniste, è più sicuro aggregare/disaggregare localmente. Una singola dimensione auto non viene mai generata.'
      }
    } satisfies FormatAttributeConfig<boolean>
  },

  // =================== EXCEL ===================
  excel: {
    with_nodes_sheets: {
      group: 'sheets',
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
        en: 'Load nodes-related sheets from the Excel file. Uncheck to skip loading them.',
        fr: 'Charger les onglets liés aux nœuds depuis le fichier Excel. Décocher pour ne pas les charger.',
        es: 'Cargar las hojas relacionadas con los nodos desde el archivo Excel. Desmarcar para no cargarlas.',
        de: 'Knotenbezogene Blätter aus der Excel-Datei laden. Deaktivieren, um sie nicht zu laden.',
        it: 'Caricare i fogli relativi ai nodi dal file Excel. Deselezionare per non caricarli.'
      }
    } satisfies FormatAttributeConfig<boolean>,

    activate_data_table: {
      group: 'sheets',
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
        en: 'Load DATA_SHEET table from the Excel file. Uncheck to skip loading it.',
        fr: 'Charger le tableau DATA_SHEET depuis le fichier Excel. Décocher pour ne pas le charger.',
        es: 'Cargar la tabla DATA_SHEET desde el archivo Excel. Desmarcar para no cargarla.',
        de: 'DATA_SHEET-Tabelle aus der Excel-Datei laden. Deaktivieren, um sie nicht zu laden.',
        it: 'Caricare la tabella DATA_SHEET dal file Excel. Deselezionare per non caricarla.'
      }
    } satisfies FormatAttributeConfig<boolean>,

    activate_flux_matrix: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheet SUT or IOT',
        fr: 'Onglet TER ou TES',
        es: 'Hoja SUT o IOT',
        de: 'Blatt SUT oder IOT',
        it: 'Foglio SUT o IOT'
      },
      tooltips: {
        en: 'Load IO_SHEET / TER_SHEET table from the Excel file. Uncheck to skip loading it.',
        fr: 'Charger le tableau IO_SHEET / TER_SHEET depuis le fichier Excel. Décocher pour ne pas le charger.',
        es: 'Cargar la tabla IO_SHEET / TER_SHEET desde el archivo Excel. Desmarcar para no cargarla.',
        de: 'IO_SHEET / TER_SHEET-Tabelle aus der Excel-Datei laden. Deaktivieren, um sie nicht zu laden.',
        it: 'Caricare la tabella IO_SHEET / TER_SHEET dal file Excel. Deselezionare per non caricarla.'
      }
    } satisfies FormatAttributeConfig<boolean>,

    autocorrect: {
      group: 'validation',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Auto-correct',
        fr: 'Auto-correction',
        es: 'Auto-corrección',
        de: 'Auto-Korrektur',
        it: 'Auto-correzione'
      },
      tooltips: {
        en: 'When parent/child inconsistencies are detected in the Sankey structure, propagate parent flux to children that lack them and write a "_corrected.xlsx" file with the added cells highlighted in red. The reconciliation is skipped — review the corrected file and re-run.',
        fr: 'En cas d\'incohérences parent/enfant détectées dans la structure Sankey, propage les flux du parent vers les enfants manquants et écrit un fichier "_corrected.xlsx" avec les cellules ajoutées en rouge. La réconciliation est sautée — corrigez le fichier puis relancez.',
        es: 'Cuando se detectan incoherencias padre/hijo, propaga los flujos del padre a los hijos que carecen de ellos y escribe un archivo "_corrected.xlsx" con las celdas añadidas resaltadas en rojo. Se omite la reconciliación.',
        de: 'Bei erkannten Eltern/Kind-Inkonsistenzen werden die Eltern-Flüsse auf die Kinder propagiert und eine "_corrected.xlsx"-Datei mit rot hervorgehobenen Zellen geschrieben. Die Abstimmung wird übersprungen.',
        it: 'In caso di incoerenze padre/figlio rilevate, propaga i flussi del padre ai figli che ne sono privi e scrive un file "_corrected.xlsx" con le celle aggiunte evidenziate in rosso. La riconciliazione viene saltata.'
      }
    } satisfies FormatAttributeConfig<boolean>
  },

  // =================== JSON ===================
  json: {
    only_current_view: {
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
    group: 'content',
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
    group: 'content',
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

  example_excel: {},
  example_json: {}
} as const

export const OUTPUT_ATTRIBUTES_CONFIG: FormatConfigStructure = {
  base: {
    ...BASE_OUTPUT_CONFIG,
  },
  excel: {
    keep_other_sheets: {
      group: 'merge',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Keep other sheets from input',
        fr: 'Conserver les autres onglets du fichier d\'entrée',
        es: 'Conservar las otras hojas del archivo de entrada',
        de: 'Andere Blätter aus der Eingabedatei beibehalten',
        it: 'Mantenere gli altri fogli del file di input'
      },
      tooltips: {
        en: 'Copy sheets from the input Excel file that are not part of the SankeyExcelParser format into the output file. Only relevant when input is Excel.',
        fr: 'Copier les onglets du fichier Excel d\'entrée qui ne font pas partie du format SankeyExcelParser dans le fichier de sortie. Uniquement pertinent si l\'entrée est Excel.',
        es: 'Copiar las hojas del archivo Excel de entrada que no forman parte del formato SankeyExcelParser en el archivo de salida. Solo relevante si la entrada es Excel.',
        de: 'Blätter aus der Excel-Eingabedatei, die nicht zum SankeyExcelParser-Format gehören, in die Ausgabedatei kopieren. Nur relevant, wenn die Eingabe Excel ist.',
        it: 'Copiare i fogli del file Excel di input che non fanno parte del formato SankeyExcelParser nel file di output. Rilevante solo se l\'input è Excel.'
      }
    } satisfies FormatAttributeConfig<boolean>,

    rewrite_format_sheets: {
      group: 'merge',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Rewrite SankeyExcelParser sheets',
        fr: 'Réécrire les onglets SankeyExcelParser',
        es: 'Reescribir las hojas SankeyExcelParser',
        de: 'SankeyExcelParser-Blätter neu schreiben',
        it: 'Riscrivere i fogli SankeyExcelParser'
      },
      tooltips: {
        en: 'Write SankeyExcelParser-format sheets (nodes, data, IO/TER, tags, layout, ...) to the output. Uncheck to leave them untouched (only meaningful when keeping other sheets from the input).',
        fr: 'Écrire les onglets du format SankeyExcelParser (nœuds, données, IO/TER, tags, mise en page, ...) dans la sortie. Décocher pour les laisser intacts (utile uniquement si on conserve les autres onglets de l\'entrée).',
        es: 'Escribir las hojas del formato SankeyExcelParser (nodos, datos, IO/TER, etiquetas, diseño, ...) en la salida. Desmarcar para dejarlas intactas (útil solo si se conservan las otras hojas de la entrada).',
        de: 'SankeyExcelParser-Format-Blätter (Knoten, Daten, IO/TER, Tags, Layout, ...) in die Ausgabe schreiben. Deaktivieren, um sie unverändert zu lassen (nur sinnvoll, wenn andere Blätter aus der Eingabe behalten werden).',
        it: 'Scrivere i fogli del formato SankeyExcelParser (nodi, dati, IO/TER, tag, layout, ...) nell\'output. Deselezionare per lasciarli intatti (utile solo se si mantengono gli altri fogli dell\'input).'
      }
    } satisfies FormatAttributeConfig<boolean>,

    preserve_extra_columns: {
      group: 'merge',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Preserve user-added columns',
        fr: 'Préserver les colonnes additionnelles',
        es: 'Preservar las columnas añadidas',
        de: 'Benutzerdefinierte Spalten beibehalten',
        it: 'Conservare le colonne aggiunte'
      },
      tooltips: {
        en: 'Best-effort: columns present in the input file but unknown to SankeyExcelParser are stashed at read time and re-added to the regenerated sheets via a left-join on the natural row key (e.g. constraint ID, node name, origin/destination). Rows added by the solver get empty cells; deleted rows lose their values; renamed keys break the join. Toggled at write time but propagated to the read phase server-side so the stash can happen.',
        fr: 'Best-effort : les colonnes présentes dans le fichier d\'entrée et inconnues de SankeyExcelParser sont mémorisées à la lecture puis réintroduites dans les feuilles régénérées via une jointure sur la clé naturelle de chaque ligne (ex : ID de contrainte, nom de nœud, origine/destination). Les lignes ajoutées par le solveur sortent avec des cellules vides ; les lignes supprimées perdent leurs valeurs ; un renommage de clé casse la jointure. Décidée à l\'écriture mais propagée côté serveur à la phase de lecture pour que la mémorisation puisse avoir lieu.',
        es: 'Best-effort: las columnas presentes en el archivo de entrada pero desconocidas para SankeyExcelParser se almacenan al leer y se reintroducen en las hojas regeneradas mediante un left-join sobre la clave natural de cada fila. Las filas añadidas por el solver tienen celdas vacías; las eliminadas pierden sus valores; los renombres rompen la unión.',
        de: 'Best-effort: Spalten, die in der Eingabedatei vorhanden, aber SankeyExcelParser unbekannt sind, werden beim Lesen zwischengespeichert und in den neu erzeugten Blättern über einen Left-Join auf den natürlichen Zeilenschlüssel wiederhergestellt. Vom Solver hinzugefügte Zeilen erhalten leere Zellen; gelöschte Zeilen verlieren ihre Werte; Umbenennungen brechen den Join.',
        it: 'Best-effort: le colonne presenti nel file di input ma sconosciute a SankeyExcelParser vengono memorizzate alla lettura e reinserite nei fogli rigenerati tramite un left-join sulla chiave naturale di ciascuna riga. Le righe aggiunte dal solver escono con celle vuote; le righe eliminate perdono i loro valori; i rinominamenti rompono il join.'
      }
    } satisfies FormatAttributeConfig<boolean>,

    with_sheet_formating: {
      group: 'presentation',
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

    with_index_sheet: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Index sheet',
        fr: 'Onglet Index',
        es: 'Hoja Índice',
        de: 'Index-Blatt',
        it: 'Foglio Index'
      },
      tooltips: {
        en: 'Write an Index sheet listing all written sheets with their type and options. Required for the file to be re-loaded in Index-driven mode. When the input file already had an Index, the user\'s original column labels and Type/Options values are preserved automatically.',
        fr: 'Écrire un onglet Index qui liste toutes les feuilles écrites avec leur type et leurs options. Nécessaire pour pouvoir recharger le fichier en mode Index-driven. Quand le fichier d\'entrée avait déjà un Index, les libellés de colonnes et les valeurs Type/Options de l\'utilisateur sont préservés automatiquement.',
        es: 'Escribir una hoja Índice que enumera todas las hojas escritas con su tipo y opciones. Necesaria para poder recargar el archivo en modo Index-driven. Cuando el archivo de entrada ya tenía un Índice, las etiquetas de columnas y los valores Type/Options del usuario se preservan automáticamente.',
        de: 'Ein Index-Blatt schreiben, das alle geschriebenen Blätter mit Typ und Optionen auflistet. Erforderlich, um die Datei im Index-driven-Modus neu zu laden. Wenn die Eingabedatei bereits einen Index hatte, werden die ursprünglichen Spaltenbeschriftungen und Type/Options-Werte des Benutzers automatisch beibehalten.',
        it: 'Scrivere un foglio Index che elenca tutti i fogli scritti con il loro tipo e le loro opzioni. Necessario per poter ricaricare il file in modalità Index-driven. Quando il file di input aveva già un Index, le etichette delle colonne e i valori Type/Options dell\'utente vengono preservati automaticamente.'
      }
    } satisfies FormatAttributeConfig<boolean>,

    with_description_sheet: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Read-me sheet',
        fr: 'Onglet Lisez-moi',
        es: 'Hoja Léeme',
        de: 'Lies-mich-Blatt',
        it: 'Foglio Leggimi'
      },
      tooltips: {
        en: 'Write a contextual Read-me sheet (placed first in the workbook) that documents only the sheets and columns actually present, with hyperlinks to the full online documentation for everything not listed inline. Purely decorative — ignored at re-load.',
        fr: 'Écrire un onglet Lisez-moi contextuel (placé en première position du classeur) qui ne documente que les feuilles et colonnes effectivement présentes, avec des hyperliens vers la documentation complète en ligne pour tout ce qui n\'est pas listé. Purement décoratif — ignoré au rechargement.',
        es: 'Escribir una hoja Léeme contextual (situada en primera posición del libro) que solo documenta las hojas y columnas realmente presentes, con hiperenlaces a la documentación completa en línea para todo lo demás. Puramente decorativa — ignorada al recargar.',
        de: 'Ein kontextuelles Lies-mich-Blatt schreiben (an erster Stelle der Arbeitsmappe), das nur die tatsächlich vorhandenen Blätter und Spalten dokumentiert, mit Hyperlinks zur vollständigen Online-Dokumentation für alles Übrige. Rein dekorativ — beim erneuten Laden ignoriert.',
        it: 'Scrivere un foglio Leggimi contestuale (posto in prima posizione nella cartella) che documenta solo i fogli e le colonne effettivamente presenti, con collegamenti ipertestuali alla documentazione completa online per tutto il resto. Puramente decorativo — ignorato al ricaricamento.'
      }
    } satisfies FormatAttributeConfig<boolean>,

    with_nodes_sheets: {
      group: 'sheets',
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

    layout: {
      group: 'sheets',
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

    activate_data_table: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      breakBefore: true,
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
      group: 'content',
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

    data_table_only_leaf_flux: {
      group: 'content',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Leaf flux',
        fr: 'Flux feuilles',
        es: 'Flujos hoja',
        de: 'Blattflüsse',
        it: 'Flussi foglia'
      },
      tooltips: {
        en: 'Restrict DATA_SHEET rows to flux whose origin and destination are both leaf nodes (no children in the hierarchy).',
        fr: 'Restreindre les lignes du tableau DATA_SHEET aux flux dont l\'origine et la destination sont toutes deux des nœuds feuilles (sans enfants dans la hiérarchie).',
        es: 'Restringir las filas de DATA_SHEET a flujos cuyo origen y destino son ambos nodos hoja (sin hijos en la jerarquía).',
        de: 'DATA_SHEET-Zeilen auf Flüsse beschränken, deren Ursprung und Ziel beide Blattknoten sind (ohne Kinder in der Hierarchie).',
        it: 'Limitare le righe di DATA_SHEET ai flussi la cui origine e destinazione sono entrambi nodi foglia (senza figli nella gerarchia).'
      },
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
      group: 'sheets',
      default: true,
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
      group: 'content',
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

    flux_matrix_only_leaf_flux: {
      group: 'content',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Leaf flux',
        fr: 'Flux feuilles',
        es: 'Flujos hoja',
        de: 'Blattflüsse',
        it: 'Flussi foglia'
      },
      tooltips: {
        en: 'Restrict the IO/TER matrix to leaf nodes (nodes without children) on both axes.',
        fr: 'Restreindre la matrice IO/TER aux nœuds feuilles (sans enfants) sur les deux axes.',
        es: 'Restringir la matriz IO/TER a los nodos hoja (sin hijos) en ambos ejes.',
        de: 'IO/TER-Matrix auf Blattknoten (ohne Kinder) auf beiden Achsen beschränken.',
        it: 'Limitare la matrice IO/TER ai nodi foglia (senza figli) su entrambi gli assi.'
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
  },
  json: {
    keep_siblings: {
      group: 'content',
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
      group: 'packaging',
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