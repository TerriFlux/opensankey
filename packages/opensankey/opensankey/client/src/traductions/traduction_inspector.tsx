// #1243 — Libellés de l'INSPECTEUR piloté par la sélection et des onglets du
// panneau de filtres. Fichier dédié (comme traduction_guided_tour), fusionné
// par deep_assign_resources dans traduction.tsx.
//
// `inspector.*`  : fil d'Ariane, cibles, portée/cascade, onglets, indicateurs.
// `filter_panel.*` : onglets Filtrer / Sélectionner / Éditer du tiroir.

export const resources_inspector = {
  //=======================================================
  //EN
  //=======================================================
  en: {
    translation: {
      inspector: {
        view: 'View',
        back_to_selection: 'Back to selection',
        pin: 'Pin the panel (the drawing resizes to its left)',
        unpin: 'Unpin the panel (floats over the drawing)',
        // Cibles : singulier / pluriel (fil d'Ariane).
        target: {
          view: 'View',
          node: 'Node', nodes: 'nodes',
          link: 'Flow', links: 'flows',
          container: 'Area', containers: 'areas',
          legend: 'Legend', legends: 'legends',
          title: 'Title', titles: 'titles',
          mixed: 'Mixed selection', elements: 'elements'
        },
        nothing_here: 'No settings available for: {{target}}.',
        // Portée & cascade de styles
        selection: 'Selection',
        selection_count: 'Selection ({{count}})',
        styles_count: 'Styles ({{count}})',
        cascade: 'Cascade',
        style_name: 'Style name',
        new_style: '+ New style',
        delete_style: 'Delete',
        delete_style_tooltip: 'Delete this style (elements following it fall back on the rest of their cascade)',
        attach_style: 'Attach a style to the selection (end of cascade, wins)',
        detach_style: 'Detach this style from the selection',
        edited_style_hint: 'Editing the highlighted style: every element following it will change. The last one in the cascade wins; a local override always wins.',
        divergent_cascade: 'Cascade of the 1st element — other selected elements follow a different cascade. ',
        selection_hint: 'Dimmed attributes: inherited from styles (cascade). Purple outline: overridden on the selection. Orange outline: multiple values.',
        tab_overloaded: 'Contains overridden attributes',
        provenance: {
          local: 'Overridden here (on the selection)',
          from_style: 'Inherited from style « {{style}} »',
          factory: 'Factory default value'
        },
        // Onglets
        tab: {
          stock: 'Stock',
          tooltip: 'Tooltip',
          tags: 'Tags',
          analysis: 'Analysis',
          title: 'Title',
          mfa: 'MFA'
        },
        // #1258 — Onglet MFA (espace AFM unifié).
        mfa: {
          reconciliation: 'Reconciliation',
          open_spreadsheet: 'Open the spreadsheet (constraints)',
          run_reconciliation: 'Reconcile via Excel…',
          value_in_mfa: 'Value type, bounds and uncertainty are edited in the MFA tab.'
        },
        // #1258 — Titres des sections repliables des onglets.
        section: {
          page: 'Page',
          dressing: 'Background & grid',
          scale_sizes: 'Scale & sizes',
          advanced: 'Advanced',
          advanced_geometry: 'Advanced — geometry'
        },
        visible: 'Visible',
        labels_visible: 'Labels visible',
        stock_enabled: 'Enabled',
        stock_shape: 'Shape',
        stock_shape_tooltip: 'Show the stock shape',
        stock_labels: 'Labels',
        stock_labels_tooltip: 'Show the stock labels',
        stock_shape_visible: 'Stock shape visible',
        stock_select_node: 'Select a node carrying a stock.',
        stock_caption: 'Stock caption',
        stock_delta_caption: 'Δ stock caption',
        advanced_editor: 'Advanced editor…',
        open_editor: 'Open the editor…',
        tags_assign_hint: 'Assignment (groups are edited in Filters)'
      },
      filter_panel: {
        filter: 'Filter',
        select: 'Select',
        select_tooltip: 'Select elements by type and tag (bulk operations)',
        edit: 'Edit',
        select_elements: 'Select elements',
        deselect_all: 'Deselect all',
        selection_summary: 'Selection: {{summary}}',
        short: {
          node: 'Nodes',
          link: 'Flows',
          data: 'Data',
          level: 'Levels',
          views: 'Views'
        }
      }
    }
  },
  //=======================================================
  //FR
  //=======================================================
  fr: {
    translation: {
      inspector: {
        view: 'Vue',
        back_to_selection: 'Retour à la sélection',
        pin: 'Épingler le panneau (le dessin se recadre à gauche)',
        unpin: 'Détacher le panneau (survol du dessin)',
        target: {
          view: 'Vue',
          node: 'Nœud', nodes: 'nœuds',
          link: 'Flux', links: 'flux',
          container: 'Zone', containers: 'zones',
          legend: 'Légende', legends: 'légendes',
          title: 'Titre', titles: 'titres',
          mixed: 'Sélection mixte', elements: 'éléments'
        },
        nothing_here: 'Aucun réglage disponible pour : {{target}}.',
        selection: 'Sélection',
        selection_count: 'Sélection ({{count}})',
        styles_count: 'Styles ({{count}})',
        cascade: 'Cascade',
        style_name: 'Nom du style',
        new_style: '+ Nouveau style',
        delete_style: 'Supprimer',
        delete_style_tooltip: 'Supprimer ce style (les éléments qui le suivaient retombent sur le reste de leur cascade)',
        attach_style: 'Attacher un style à la sélection (fin de cascade, prioritaire)',
        detach_style: 'Détacher ce style de la sélection',
        edited_style_hint: 'Édition du style surligné : tous les éléments qui le suivent seront modifiés. Le dernier de la cascade gagne ; une surcharge locale gagne toujours.',
        divergent_cascade: 'Cascade du 1er élément — d’autres éléments sélectionnés suivent une cascade différente. ',
        selection_hint: 'Attributs en retrait : hérités des styles (cascade). Liseré violet : surchargé sur la sélection. Liseré orange : valeurs multiples.',
        tab_overloaded: 'Contient des attributs surchargés',
        provenance: {
          local: 'Surchargé ici (sur la sélection)',
          from_style: 'Hérité du style « {{style}} »',
          factory: 'Valeur d’usine'
        },
        tab: {
          stock: 'Stock',
          tooltip: 'Infobulle',
          tags: 'Tags',
          analysis: 'Analyse',
          title: 'Titre',
          mfa: 'AFM'
        },
        mfa: {
          reconciliation: 'Réconciliation',
          open_spreadsheet: 'Ouvrir le tableur (contraintes)',
          run_reconciliation: 'Réconcilier via Excel…',
          value_in_mfa: 'Type de valeur, bornes et incertitude s’éditent dans l’onglet AFM.'
        },
        section: {
          page: 'Page',
          dressing: 'Habillage',
          scale_sizes: 'Échelle & tailles',
          advanced: 'Avancé',
          advanced_geometry: 'Avancé — géométrie'
        },
        visible: 'Visible',
        labels_visible: 'Libellés visibles',
        stock_enabled: 'Activé',
        stock_shape: 'Forme',
        stock_shape_tooltip: 'Afficher la forme de stock',
        stock_labels: 'Libellés',
        stock_labels_tooltip: 'Afficher les libellés du stock',
        stock_shape_visible: 'Forme de stock visible',
        stock_select_node: 'Sélectionnez un nœud portant un stock.',
        stock_caption: 'Libellé stock',
        stock_delta_caption: 'Libellé Δ stock',
        advanced_editor: 'Éditeur avancé…',
        open_editor: 'Ouvrir l’éditeur…',
        tags_assign_hint: 'Assignation (les groupes s’éditent dans Filtres)'
      },
      filter_panel: {
        filter: 'Filtrer',
        select: 'Sélectionner',
        select_tooltip: 'Sélectionner des éléments par type et par tag (opérations groupées)',
        edit: 'Éditer',
        select_elements: 'Sélectionner des éléments',
        deselect_all: 'Tout désélectionner',
        selection_summary: 'Sélection : {{summary}}',
        short: {
          node: 'Nœuds',
          link: 'Flux',
          data: 'Données',
          level: 'Niveaux',
          views: 'Vues'
        }
      }
    }
  },
  //=======================================================
  //ES
  //=======================================================
  es: {
    translation: {
      inspector: {
        view: 'Vista',
        back_to_selection: 'Volver a la selección',
        pin: 'Fijar el panel (el dibujo se reajusta a su izquierda)',
        unpin: 'Desacoplar el panel (flota sobre el dibujo)',
        target: {
          view: 'Vista',
          node: 'Nodo', nodes: 'nodos',
          link: 'Flujo', links: 'flujos',
          container: 'Zona', containers: 'zonas',
          legend: 'Leyenda', legends: 'leyendas',
          title: 'Título', titles: 'títulos',
          mixed: 'Selección mixta', elements: 'elementos'
        },
        nothing_here: 'Ningún ajuste disponible para: {{target}}.',
        selection: 'Selección',
        selection_count: 'Selección ({{count}})',
        styles_count: 'Estilos ({{count}})',
        cascade: 'Cascada',
        style_name: 'Nombre del estilo',
        new_style: '+ Nuevo estilo',
        delete_style: 'Eliminar',
        delete_style_tooltip: 'Eliminar este estilo (los elementos que lo seguían vuelven al resto de su cascada)',
        attach_style: 'Adjuntar un estilo a la selección (final de la cascada, prioritario)',
        detach_style: 'Separar este estilo de la selección',
        edited_style_hint: 'Edición del estilo resaltado: todos los elementos que lo siguen se modificarán. El último de la cascada gana; una anulación local siempre gana.',
        divergent_cascade: 'Cascada del 1.er elemento — otros elementos seleccionados siguen una cascada diferente. ',
        selection_hint: 'Atributos atenuados: heredados de los estilos (cascada). Borde morado: anulado en la selección. Borde naranja: valores múltiples.',
        tab_overloaded: 'Contiene atributos anulados',
        provenance: {
          local: 'Anulado aquí (en la selección)',
          from_style: 'Heredado del estilo « {{style}} »',
          factory: 'Valor de fábrica'
        },
        tab: {
          stock: 'Stock',
          tooltip: 'Información',
          tags: 'Etiquetas',
          analysis: 'Análisis',
          title: 'Título',
          mfa: 'AFM'
        },
        mfa: {
          reconciliation: 'Conciliación',
          open_spreadsheet: 'Abrir la hoja de cálculo (restricciones)',
          run_reconciliation: 'Conciliar vía Excel…',
          value_in_mfa: 'El tipo de valor, los límites y la incertidumbre se editan en la pestaña AFM.'
        },
        section: {
          page: 'Página',
          dressing: 'Fondo y cuadrícula',
          scale_sizes: 'Escala y tamaños',
          advanced: 'Avanzado',
          advanced_geometry: 'Avanzado — geometría'
        },
        visible: 'Visible',
        labels_visible: 'Etiquetas visibles',
        stock_enabled: 'Activado',
        stock_shape: 'Forma',
        stock_shape_tooltip: 'Mostrar la forma de stock',
        stock_labels: 'Etiquetas',
        stock_labels_tooltip: 'Mostrar las etiquetas de stock',
        stock_shape_visible: 'Forma de stock visible',
        stock_select_node: 'Seleccione un nodo que lleve un stock.',
        stock_caption: 'Etiqueta de stock',
        stock_delta_caption: 'Etiqueta Δ stock',
        advanced_editor: 'Editor avanzado…',
        open_editor: 'Abrir el editor…',
        tags_assign_hint: 'Asignación (los grupos se editan en Filtros)'
      },
      filter_panel: {
        filter: 'Filtrar',
        select: 'Seleccionar',
        select_tooltip: 'Seleccionar elementos por tipo y etiqueta (operaciones en grupo)',
        edit: 'Editar',
        select_elements: 'Seleccionar elementos',
        deselect_all: 'Deseleccionar todo',
        selection_summary: 'Selección: {{summary}}',
        short: {
          node: 'Nodos',
          link: 'Flujos',
          data: 'Datos',
          level: 'Niveles',
          views: 'Vistas'
        }
      }
    }
  },
  //=======================================================
  //DE
  //=======================================================
  de: {
    translation: {
      inspector: {
        view: 'Ansicht',
        back_to_selection: 'Zurück zur Auswahl',
        pin: 'Panel anheften (die Zeichnung wird links davon neu angepasst)',
        unpin: 'Panel lösen (schwebt über der Zeichnung)',
        target: {
          view: 'Ansicht',
          node: 'Knoten', nodes: 'Knoten',
          link: 'Fluss', links: 'Flüsse',
          container: 'Bereich', containers: 'Bereiche',
          legend: 'Legende', legends: 'Legenden',
          title: 'Titel', titles: 'Titel',
          mixed: 'Gemischte Auswahl', elements: 'Elemente'
        },
        nothing_here: 'Keine Einstellungen verfügbar für: {{target}}.',
        selection: 'Auswahl',
        selection_count: 'Auswahl ({{count}})',
        styles_count: 'Stile ({{count}})',
        cascade: 'Kaskade',
        style_name: 'Name des Stils',
        new_style: '+ Neuer Stil',
        delete_style: 'Löschen',
        delete_style_tooltip: 'Diesen Stil löschen (Elemente, die ihm folgten, fallen auf den Rest ihrer Kaskade zurück)',
        attach_style: 'Einen Stil an die Auswahl anhängen (Ende der Kaskade, hat Vorrang)',
        detach_style: 'Diesen Stil von der Auswahl lösen',
        edited_style_hint: 'Bearbeitung des hervorgehobenen Stils: alle Elemente, die ihm folgen, werden geändert. Der letzte der Kaskade gewinnt; eine lokale Überschreibung gewinnt immer.',
        divergent_cascade: 'Kaskade des 1. Elements — andere ausgewählte Elemente folgen einer anderen Kaskade. ',
        selection_hint: 'Abgeblendete Attribute: von den Stilen geerbt (Kaskade). Violetter Rahmen: in der Auswahl überschrieben. Oranger Rahmen: mehrere Werte.',
        tab_overloaded: 'Enthält überschriebene Attribute',
        provenance: {
          local: 'Hier überschrieben (in der Auswahl)',
          from_style: 'Vom Stil « {{style}} » geerbt',
          factory: 'Werkseinstellung'
        },
        tab: {
          stock: 'Bestand',
          tooltip: 'Tooltip',
          tags: 'Tags',
          analysis: 'Analyse',
          title: 'Titel',
          mfa: 'MFA'
        },
        mfa: {
          reconciliation: 'Abgleich',
          open_spreadsheet: 'Tabelle öffnen (Nebenbedingungen)',
          run_reconciliation: 'Abgleich über Excel…',
          value_in_mfa: 'Werttyp, Grenzen und Unsicherheit werden im MFA-Tab bearbeitet.'
        },
        section: {
          page: 'Seite',
          dressing: 'Hintergrund & Raster',
          scale_sizes: 'Maßstab & Größen',
          advanced: 'Erweitert',
          advanced_geometry: 'Erweitert — Geometrie'
        },
        visible: 'Sichtbar',
        labels_visible: 'Beschriftungen sichtbar',
        stock_enabled: 'Aktiviert',
        stock_shape: 'Form',
        stock_shape_tooltip: 'Die Bestandsform anzeigen',
        stock_labels: 'Beschriftungen',
        stock_labels_tooltip: 'Die Bestandsbeschriftungen anzeigen',
        stock_shape_visible: 'Bestandsform sichtbar',
        stock_select_node: 'Wählen Sie einen Knoten mit Bestand.',
        stock_caption: 'Bestandsbeschriftung',
        stock_delta_caption: 'Δ-Bestandsbeschriftung',
        advanced_editor: 'Erweiterter Editor…',
        open_editor: 'Editor öffnen…',
        tags_assign_hint: 'Zuweisung (Gruppen werden in Filter bearbeitet)'
      },
      filter_panel: {
        filter: 'Filtern',
        select: 'Auswählen',
        select_tooltip: 'Elemente nach Typ und Tag auswählen (Sammelvorgänge)',
        edit: 'Bearbeiten',
        select_elements: 'Elemente auswählen',
        deselect_all: 'Auswahl aufheben',
        selection_summary: 'Auswahl: {{summary}}',
        short: {
          node: 'Knoten',
          link: 'Flüsse',
          data: 'Daten',
          level: 'Ebenen',
          views: 'Ansichten'
        }
      }
    }
  },
  //=======================================================
  //IT
  //=======================================================
  it: {
    translation: {
      inspector: {
        view: 'Vista',
        back_to_selection: 'Torna alla selezione',
        pin: 'Fissa il pannello (il disegno si ridimensiona alla sua sinistra)',
        unpin: 'Sgancia il pannello (fluttua sopra il disegno)',
        target: {
          view: 'Vista',
          node: 'Nodo', nodes: 'nodi',
          link: 'Flusso', links: 'flussi',
          container: 'Zona', containers: 'zone',
          legend: 'Legenda', legends: 'legende',
          title: 'Titolo', titles: 'titoli',
          mixed: 'Selezione mista', elements: 'elementi'
        },
        nothing_here: 'Nessuna impostazione disponibile per: {{target}}.',
        selection: 'Selezione',
        selection_count: 'Selezione ({{count}})',
        styles_count: 'Stili ({{count}})',
        cascade: 'Cascata',
        style_name: 'Nome dello stile',
        new_style: '+ Nuovo stile',
        delete_style: 'Elimina',
        delete_style_tooltip: 'Eliminare questo stile (gli elementi che lo seguivano ricadono sul resto della loro cascata)',
        attach_style: 'Allegare uno stile alla selezione (fine della cascata, prioritario)',
        detach_style: 'Staccare questo stile dalla selezione',
        edited_style_hint: 'Modifica dello stile evidenziato: tutti gli elementi che lo seguono saranno modificati. L’ultimo della cascata vince; una sovrascrittura locale vince sempre.',
        divergent_cascade: 'Cascata del 1º elemento — altri elementi selezionati seguono una cascata diversa. ',
        selection_hint: 'Attributi attenuati: ereditati dagli stili (cascata). Bordo viola: sovrascritto sulla selezione. Bordo arancione: valori multipli.',
        tab_overloaded: 'Contiene attributi sovrascritti',
        provenance: {
          local: 'Sovrascritto qui (sulla selezione)',
          from_style: 'Ereditato dallo stile « {{style}} »',
          factory: 'Valore di fabbrica'
        },
        tab: {
          stock: 'Stock',
          tooltip: 'Tooltip',
          tags: 'Tag',
          analysis: 'Analisi',
          title: 'Titolo',
          mfa: 'AFM'
        },
        mfa: {
          reconciliation: 'Riconciliazione',
          open_spreadsheet: 'Aprire il foglio di calcolo (vincoli)',
          run_reconciliation: 'Riconciliare via Excel…',
          value_in_mfa: 'Tipo di valore, limiti e incertezza si modificano nella scheda AFM.'
        },
        section: {
          page: 'Pagina',
          dressing: 'Sfondo e griglia',
          scale_sizes: 'Scala e dimensioni',
          advanced: 'Avanzate',
          advanced_geometry: 'Avanzate — geometria'
        },
        visible: 'Visibile',
        labels_visible: 'Etichette visibili',
        stock_enabled: 'Attivato',
        stock_shape: 'Forma',
        stock_shape_tooltip: 'Mostrare la forma di stock',
        stock_labels: 'Etichette',
        stock_labels_tooltip: 'Mostrare le etichette di stock',
        stock_shape_visible: 'Forma di stock visibile',
        stock_select_node: 'Selezionare un nodo con uno stock.',
        stock_caption: 'Etichetta stock',
        stock_delta_caption: 'Etichetta Δ stock',
        advanced_editor: 'Editor avanzato…',
        open_editor: 'Aprire l’editor…',
        tags_assign_hint: 'Assegnazione (i gruppi si modificano in Filtri)'
      },
      filter_panel: {
        filter: 'Filtrare',
        select: 'Selezionare',
        select_tooltip: 'Selezionare elementi per tipo e tag (operazioni di gruppo)',
        edit: 'Modificare',
        select_elements: 'Selezionare elementi',
        deselect_all: 'Deselezionare tutto',
        selection_summary: 'Selezione: {{summary}}',
        short: {
          node: 'Nodi',
          link: 'Flussi',
          data: 'Dati',
          level: 'Livelli',
          views: 'Viste'
        }
      }
    }
  }
}
