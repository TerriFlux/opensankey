// os#1511 (lot 6) — LES LIBELLÉS POSÉS EN `defaultValue` SANS CATALOGUE, traduits dans les sept
// langues. Tant qu'une clé n'existait dans aucun catalogue, son texte par défaut (français)
// s'affichait dans toutes les langues ; `scripts/check_i18n.mjs` le signale désormais.
// Fusionné par `deep_assign_resources` dans traduction.tsx. Les clés gardent leur chemin
// d'origine (`Banner.*`, `matrix.*`, `sunburst.nav.*`…) : elles complètent les arbres existants.

export const resources_rationalisation = {
  //=======================================================
  //EN
  //=======================================================
  en: {
    translation: {
      Banner: {
        draw_expansion: 'As an expansion (at the ends)',
        draw_expansion_tooltip: 'Opened members keep their node; their children open towards the outside of the diagram',
        draw_expansion_unavailable: 'Only on a carrier node at an end of the diagram (with no flows on one side)',
        legend_flow_color: 'Flow colour',
        legend_flow_color_bands: 'The bands of « {{name}} » colour the flows',
        nav_detail_by: 'Detail by {{level}}',
        nav_swap_drawing: 'Swap the drawing of the two dimensions (bands ↔ nodes)',
        nav_swap_drawing_down: 'Swap the drawing with the dimension below',
        nav_swap_drawing_up: 'Swap the drawing with the dimension above',
        nav_undetail: 'Detailed by {{level}} — click again to stop detailing',
        reader_all: 'All',
        reader_several: 'Select several',
        reader_toggle_frozen: 'Unavailable: several members of « {{name}} » are overlaid',
        title_selection: 'Selection of {{name}}'
      },
      MEP: {
        legend_nav_panel_toggle: 'Navigation and legend',
        legend_panel_toggle: 'Legend'
      },
      Spreadsheet: {
        zone: {
          pane_picker: 'Displayed panes',
          pane_picker_reader: 'Panes'
        }
      },
      filter_panel: {
        coordinates: {
          title: 'Coordinates'
        }
      },
      inspector: {
        description: 'Description'
      },
      matrix: {
        draw_flat: 'Flat',
        draw_hierarchical: 'Hierarchical',
        draw_hierarchical_unavailable: 'Only one level is shown: expand a member (+) or choose a finer level',
        draw_tables: 'One table per member',
        draw_tables_unavailable: 'Another active dimension is needed for the rows',
        level_hint: 'Shift+click: the whole level',
        nav: {
          drawing: 'How this dimension is drawn in the table',
          move_down: 'Move this dimension down (towards the columns)',
          move_up: 'Move this dimension up (towards the rows)',
          settings: 'Table settings',
          swap: 'Swap rows and columns (top line = table rows)'
        },
        subtotal: 'Total {{name}}'
      },
      panel: {
        config_title: 'Configuration',
        pin: 'Pin: the window stays open when you click elsewhere',
        to_popup: 'Detach as a window',
        to_sidebar: 'Dock as a sidebar'
      },
      presentation: {
        block: {
          infos: 'Info',
          label: 'Label',
          link_series_flux: 'Flow series',
          series_count: '{{count}} values',
          show_unit: 'Show the unit',
          tags: 'Tags',
          value: 'Value',
          value_in: 'Inputs',
          value_out: 'Outputs'
        },
        delay: 'Display delay (ms)',
        nothing_here: 'Nothing to show for this element.',
        trigger: 'Tooltip trigger'
      },
      sunburst: {
        nav: {
          ctrl_hint: 'Ctrl+click (⌘+click): add this column to those that split, or remove it',
          members: 'Choose the members',
          move_down: 'Move this dimension down (towards the outer ring)',
          move_up: 'Move this dimension up (towards the inner ring)',
          settings: 'Ring chart settings',
          swap: 'Swap the order of the dimensions (top line = inner ring)',
          uncut: 'Split by {{level}} — click again to stop splitting by this dimension'
        }
      }
    }
  },
  //=======================================================
  //FR
  //=======================================================
  fr: {
    translation: {
      Banner: {
        draw_expansion: 'En expansion (aux extrémités)',
        draw_expansion_tooltip: 'Les membres ouverts gardent leur nœud ; leurs enfants s\'ouvrent vers l\'extérieur du diagramme',
        draw_expansion_unavailable: 'Seulement sur un nœud porteur à une extrémité du diagramme (sans flux d\'un côté)',
        legend_flow_color: 'Couleur des flux',
        legend_flow_color_bands: 'Les bandes de « {{name}} » colorent les flux',
        nav_detail_by: 'Détailler par {{level}}',
        nav_swap_drawing: 'Échanger le dessin des deux dimensions (bandes ↔ nœuds)',
        nav_swap_drawing_down: 'Échanger le dessin avec la dimension du dessous',
        nav_swap_drawing_up: 'Échanger le dessin avec la dimension du dessus',
        nav_undetail: 'Détaillé par {{level}} — recliquer pour ne plus détailler',
        reader_all: 'Toutes',
        reader_several: 'Sélectionner plusieurs',
        reader_toggle_frozen: 'Indisponible : plusieurs membres de « {{name}} » sont superposés',
        title_selection: 'Sélection de {{name}}'
      },
      MEP: {
        legend_nav_panel_toggle: 'Navigation et légende',
        legend_panel_toggle: 'Légende'
      },
      Spreadsheet: {
        zone: {
          pane_picker: 'Vignettes affichées',
          pane_picker_reader: 'Vignettes'
        }
      },
      filter_panel: {
        coordinates: {
          title: 'Coordonnées'
        }
      },
      inspector: {
        description: 'Description'
      },
      matrix: {
        draw_flat: 'Plat',
        draw_hierarchical: 'Hiérarchique',
        draw_hierarchical_unavailable: 'Un seul niveau est montré : dépliez un membre (+) ou choisissez un niveau plus fin',
        draw_tables: 'Un tableau par membre',
        draw_tables_unavailable: 'Il faut une autre dimension active pour les lignes',
        level_hint: 'Maj+clic : tout le niveau',
        nav: {
          drawing: 'Comment cette dimension se dessine dans le tableau',
          move_down: 'Descendre cette dimension (vers les colonnes)',
          move_up: 'Monter cette dimension (vers les lignes)',
          settings: 'Réglages du tableau',
          swap: 'Échanger lignes et colonnes (ligne du haut = lignes du tableau)'
        },
        subtotal: 'Total {{name}}'
      },
      panel: {
        config_title: 'Configuration',
        pin: 'Épingler : la fenêtre reste ouverte quand on clique ailleurs',
        to_popup: 'Détacher en fenêtre',
        to_sidebar: 'Ancrer en barre latérale'
      },
      presentation: {
        block: {
          infos: 'Infos',
          label: 'Libellé',
          link_series_flux: 'Séries de flux',
          series_count: '{{count}} valeurs',
          show_unit: 'Afficher l\'unité',
          tags: 'Tags',
          value: 'Valeur',
          value_in: 'Entrées',
          value_out: 'Sorties'
        },
        delay: 'Délai d\'apparition (ms)',
        nothing_here: 'Rien à afficher pour cet élément.',
        trigger: 'Déclencheur de l\'info-bulle'
      },
      sunburst: {
        nav: {
          ctrl_hint: 'Ctrl+clic (⌘+clic) : ajouter cette colonne à celles qui découpent, ou l\'en retirer',
          members: 'Choisir les membres',
          move_down: 'Descendre cette dimension (vers l\'anneau extérieur)',
          move_up: 'Monter cette dimension (vers l\'anneau intérieur)',
          settings: 'Réglages de la couronne',
          swap: 'Échanger l\'ordre des dimensions (ligne du haut = anneau intérieur)',
          uncut: 'Découpé par {{level}} — recliquer pour ne plus découper par cette dimension'
        }
      }
    }
  },
  //=======================================================
  //ES
  //=======================================================
  es: {
    translation: {
      Banner: {
        draw_expansion: 'En expansión (en los extremos)',
        draw_expansion_tooltip: 'Los miembros abiertos conservan su nodo; sus hijos se abren hacia el exterior del diagrama',
        draw_expansion_unavailable: 'Solo en un nodo portador en un extremo del diagrama (sin flujos de un lado)',
        legend_flow_color: 'Color de los flujos',
        legend_flow_color_bands: 'Las bandas de « {{name}} » colorean los flujos',
        nav_detail_by: 'Detallar por {{level}}',
        nav_swap_drawing: 'Intercambiar el dibujo de las dos dimensiones (bandas ↔ nodos)',
        nav_swap_drawing_down: 'Intercambiar el dibujo con la dimensión de abajo',
        nav_swap_drawing_up: 'Intercambiar el dibujo con la dimensión de arriba',
        nav_undetail: 'Detallado por {{level}}: vuelva a hacer clic para dejar de detallar',
        reader_all: 'Todas',
        reader_several: 'Seleccionar varios',
        reader_toggle_frozen: 'No disponible: varios miembros de « {{name}} » están superpuestos',
        title_selection: 'Selección de {{name}}'
      },
      MEP: {
        legend_nav_panel_toggle: 'Navegación y leyenda',
        legend_panel_toggle: 'Leyenda'
      },
      Spreadsheet: {
        zone: {
          pane_picker: 'Viñetas mostradas',
          pane_picker_reader: 'Viñetas'
        }
      },
      filter_panel: {
        coordinates: {
          title: 'Coordenadas'
        }
      },
      inspector: {
        description: 'Descripción'
      },
      matrix: {
        draw_flat: 'Plano',
        draw_hierarchical: 'Jerárquico',
        draw_hierarchical_unavailable: 'Solo se muestra un nivel: despliegue un miembro (+) o elija un nivel más fino',
        draw_tables: 'Una tabla por miembro',
        draw_tables_unavailable: 'Se necesita otra dimensión activa para las filas',
        level_hint: 'Mayús+clic: todo el nivel',
        nav: {
          drawing: 'Cómo se dibuja esta dimensión en la tabla',
          move_down: 'Bajar esta dimensión (hacia las columnas)',
          move_up: 'Subir esta dimensión (hacia las filas)',
          settings: 'Ajustes de la tabla',
          swap: 'Intercambiar filas y columnas (línea superior = filas de la tabla)'
        },
        subtotal: 'Total {{name}}'
      },
      panel: {
        config_title: 'Configuración',
        pin: 'Fijar: la ventana permanece abierta al hacer clic en otro lugar',
        to_popup: 'Separar en ventana',
        to_sidebar: 'Anclar en barra lateral'
      },
      presentation: {
        block: {
          infos: 'Información',
          label: 'Etiqueta',
          link_series_flux: 'Series de flujos',
          series_count: '{{count}} valores',
          show_unit: 'Mostrar la unidad',
          tags: 'Etiquetas',
          value: 'Valor',
          value_in: 'Entradas',
          value_out: 'Salidas'
        },
        delay: 'Retraso de aparición (ms)',
        nothing_here: 'Nada que mostrar para este elemento.',
        trigger: 'Activador de la información emergente'
      },
      sunburst: {
        nav: {
          ctrl_hint: 'Ctrl+clic (⌘+clic): añadir esta columna a las que dividen, o quitarla',
          members: 'Elegir los miembros',
          move_down: 'Bajar esta dimensión (hacia el anillo exterior)',
          move_up: 'Subir esta dimensión (hacia el anillo interior)',
          settings: 'Ajustes de la corona',
          swap: 'Intercambiar el orden de las dimensiones (línea superior = anillo interior)',
          uncut: 'Dividido por {{level}}: vuelva a hacer clic para dejar de dividir por esta dimensión'
        }
      }
    }
  },
  //=======================================================
  //DE
  //=======================================================
  de: {
    translation: {
      Banner: {
        draw_expansion: 'Als Erweiterung (an den Enden)',
        draw_expansion_tooltip: 'Geöffnete Mitglieder behalten ihren Knoten; ihre Kinder öffnen sich zur Außenseite des Diagramms',
        draw_expansion_unavailable: 'Nur an einem Trägerknoten am Ende des Diagramms (ohne Flüsse auf einer Seite)',
        legend_flow_color: 'Flussfarbe',
        legend_flow_color_bands: 'Die Bänder von « {{name}} » färben die Flüsse',
        nav_detail_by: 'Nach {{level}} aufschlüsseln',
        nav_swap_drawing: 'Darstellung der beiden Dimensionen tauschen (Bänder ↔ Knoten)',
        nav_swap_drawing_down: 'Darstellung mit der Dimension darunter tauschen',
        nav_swap_drawing_up: 'Darstellung mit der Dimension darüber tauschen',
        nav_undetail: 'Nach {{level}} aufgeschlüsselt — erneut klicken, um die Aufschlüsselung aufzuheben',
        reader_all: 'Alle',
        reader_several: 'Mehrere auswählen',
        reader_toggle_frozen: 'Nicht verfügbar: mehrere Mitglieder von « {{name}} » sind überlagert',
        title_selection: 'Auswahl von {{name}}'
      },
      MEP: {
        legend_nav_panel_toggle: 'Navigation und Legende',
        legend_panel_toggle: 'Legende'
      },
      Spreadsheet: {
        zone: {
          pane_picker: 'Angezeigte Kacheln',
          pane_picker_reader: 'Kacheln'
        }
      },
      filter_panel: {
        coordinates: {
          title: 'Koordinaten'
        }
      },
      inspector: {
        description: 'Beschreibung'
      },
      matrix: {
        draw_flat: 'Flach',
        draw_hierarchical: 'Hierarchisch',
        draw_hierarchical_unavailable: 'Es wird nur eine Ebene angezeigt: klappen Sie ein Mitglied auf (+) oder wählen Sie eine feinere Ebene',
        draw_tables: 'Eine Tabelle pro Mitglied',
        draw_tables_unavailable: 'Für die Zeilen wird eine weitere aktive Dimension benötigt',
        level_hint: 'Umschalt+Klick: die ganze Ebene',
        nav: {
          drawing: 'Wie diese Dimension in der Tabelle dargestellt wird',
          move_down: 'Diese Dimension nach unten verschieben (zu den Spalten)',
          move_up: 'Diese Dimension nach oben verschieben (zu den Zeilen)',
          settings: 'Tabelleneinstellungen',
          swap: 'Zeilen und Spalten tauschen (oberste Zeile = Tabellenzeilen)'
        },
        subtotal: 'Summe {{name}}'
      },
      panel: {
        config_title: 'Konfiguration',
        pin: 'Anheften: das Fenster bleibt geöffnet, wenn Sie woanders klicken',
        to_popup: 'Als Fenster lösen',
        to_sidebar: 'Als Seitenleiste andocken'
      },
      presentation: {
        block: {
          infos: 'Infos',
          label: 'Bezeichnung',
          link_series_flux: 'Flussreihen',
          series_count: '{{count}} Werte',
          show_unit: 'Einheit anzeigen',
          tags: 'Tags',
          value: 'Wert',
          value_in: 'Eingänge',
          value_out: 'Ausgänge'
        },
        delay: 'Einblendverzögerung (ms)',
        nothing_here: 'Für dieses Element gibt es nichts anzuzeigen.',
        trigger: 'Auslöser des Tooltips'
      },
      sunburst: {
        nav: {
          ctrl_hint: 'Strg+Klick (⌘+Klick): diese Spalte zu den aufteilenden hinzufügen oder daraus entfernen',
          members: 'Mitglieder auswählen',
          move_down: 'Diese Dimension nach unten verschieben (zum äußeren Ring)',
          move_up: 'Diese Dimension nach oben verschieben (zum inneren Ring)',
          settings: 'Ringdiagramm-Einstellungen',
          swap: 'Reihenfolge der Dimensionen tauschen (oberste Zeile = innerer Ring)',
          uncut: 'Nach {{level}} aufgeteilt — erneut klicken, um nicht mehr nach dieser Dimension aufzuteilen'
        }
      }
    }
  },
  //=======================================================
  //IT
  //=======================================================
  it: {
    translation: {
      Banner: {
        draw_expansion: 'In espansione (alle estremità)',
        draw_expansion_tooltip: 'I membri aperti mantengono il loro nodo; i loro figli si aprono verso l\'esterno del diagramma',
        draw_expansion_unavailable: 'Solo su un nodo portante a un\'estremità del diagramma (senza flussi da un lato)',
        legend_flow_color: 'Colore dei flussi',
        legend_flow_color_bands: 'Le bande di « {{name}} » colorano i flussi',
        nav_detail_by: 'Dettagliare per {{level}}',
        nav_swap_drawing: 'Scambiare il disegno delle due dimensioni (bande ↔ nodi)',
        nav_swap_drawing_down: 'Scambiare il disegno con la dimensione sottostante',
        nav_swap_drawing_up: 'Scambiare il disegno con la dimensione sovrastante',
        nav_undetail: 'Dettagliato per {{level}}: fare di nuovo clic per non dettagliare più',
        reader_all: 'Tutte',
        reader_several: 'Selezionare più membri',
        reader_toggle_frozen: 'Non disponibile: più membri di « {{name}} » sono sovrapposti',
        title_selection: 'Selezione di {{name}}'
      },
      MEP: {
        legend_nav_panel_toggle: 'Navigazione e legenda',
        legend_panel_toggle: 'Legenda'
      },
      Spreadsheet: {
        zone: {
          pane_picker: 'Riquadri visualizzati',
          pane_picker_reader: 'Riquadri'
        }
      },
      filter_panel: {
        coordinates: {
          title: 'Coordinate'
        }
      },
      inspector: {
        description: 'Descrizione'
      },
      matrix: {
        draw_flat: 'Piatto',
        draw_hierarchical: 'Gerarchico',
        draw_hierarchical_unavailable: 'Viene mostrato un solo livello: espandere un membro (+) o scegliere un livello più fine',
        draw_tables: 'Una tabella per membro',
        draw_tables_unavailable: 'Serve un\'altra dimensione attiva per le righe',
        level_hint: 'Maiusc+clic: tutto il livello',
        nav: {
          drawing: 'Come si disegna questa dimensione nella tabella',
          move_down: 'Spostare questa dimensione in basso (verso le colonne)',
          move_up: 'Spostare questa dimensione in alto (verso le righe)',
          settings: 'Impostazioni della tabella',
          swap: 'Scambiare righe e colonne (riga in alto = righe della tabella)'
        },
        subtotal: 'Totale {{name}}'
      },
      panel: {
        config_title: 'Configurazione',
        pin: 'Fissare: la finestra resta aperta quando si fa clic altrove',
        to_popup: 'Staccare in una finestra',
        to_sidebar: 'Ancorare nella barra laterale'
      },
      presentation: {
        block: {
          infos: 'Info',
          label: 'Etichetta',
          link_series_flux: 'Serie di flussi',
          series_count: '{{count}} valori',
          show_unit: 'Mostrare l\'unità',
          tags: 'Tag',
          value: 'Valore',
          value_in: 'Ingressi',
          value_out: 'Uscite'
        },
        delay: 'Ritardo di comparsa (ms)',
        nothing_here: 'Niente da mostrare per questo elemento.',
        trigger: 'Attivatore del suggerimento'
      },
      sunburst: {
        nav: {
          ctrl_hint: 'Ctrl+clic (⌘+clic): aggiungere questa colonna a quelle che suddividono, o toglierla',
          members: 'Scegliere i membri',
          move_down: 'Spostare questa dimensione in basso (verso l\'anello esterno)',
          move_up: 'Spostare questa dimensione in alto (verso l\'anello interno)',
          settings: 'Impostazioni della corona',
          swap: 'Scambiare l\'ordine delle dimensioni (riga in alto = anello interno)',
          uncut: 'Suddiviso per {{level}}: fare di nuovo clic per non suddividere più per questa dimensione'
        }
      }
    }
  },
  //=======================================================
  //ZH-CN
  //=======================================================
  'zh-CN': {
    translation: {
      Banner: {
        draw_expansion: '展开（在两端）',
        draw_expansion_tooltip: '展开的成员保留其节点；其子项向图的外侧展开',
        draw_expansion_unavailable: '仅适用于位于图一端的承载节点（一侧没有流）',
        legend_flow_color: '流的颜色',
        legend_flow_color_bands: '« {{name}} » 的条带为流着色',
        nav_detail_by: '按 {{level}} 细分',
        nav_swap_drawing: '交换两个维度的绘制方式（条带 ↔ 节点）',
        nav_swap_drawing_down: '与下方维度交换绘制方式',
        nav_swap_drawing_up: '与上方维度交换绘制方式',
        nav_undetail: '已按 {{level}} 细分——再次单击取消细分',
        reader_all: '全部',
        reader_several: '选择多个',
        reader_toggle_frozen: '不可用：« {{name}} » 的多个成员相互叠加',
        title_selection: '{{name}} 的选择'
      },
      MEP: {
        legend_nav_panel_toggle: '导航和图例',
        legend_panel_toggle: '图例'
      },
      Spreadsheet: {
        zone: {
          pane_picker: '显示的缩略图',
          pane_picker_reader: '缩略图'
        }
      },
      filter_panel: {
        coordinates: {
          title: '坐标'
        }
      },
      inspector: {
        description: '描述'
      },
      matrix: {
        draw_flat: '平铺',
        draw_hierarchical: '分层',
        draw_hierarchical_unavailable: '仅显示一个层级：展开一个成员（+）或选择更细的层级',
        draw_tables: '每个成员一张表',
        draw_tables_unavailable: '行需要另一个活动维度',
        level_hint: 'Shift+单击：整个层级',
        nav: {
          drawing: '此维度在表中的绘制方式',
          move_down: '下移此维度（移向列）',
          move_up: '上移此维度（移向行）',
          settings: '表设置',
          swap: '交换行和列（顶行 = 表的行）'
        },
        subtotal: '{{name}} 合计'
      },
      panel: {
        config_title: '配置',
        pin: '固定：在其他位置单击时窗口保持打开',
        to_popup: '分离为窗口',
        to_sidebar: '停靠为侧边栏'
      },
      presentation: {
        block: {
          infos: '信息',
          label: '标签',
          link_series_flux: '流序列',
          series_count: '{{count}} 个值',
          show_unit: '显示单位',
          tags: '标签',
          value: '值',
          value_in: '输入',
          value_out: '输出'
        },
        delay: '显示延迟（毫秒）',
        nothing_here: '此元素没有可显示的内容。',
        trigger: '提示框触发方式'
      },
      sunburst: {
        nav: {
          ctrl_hint: 'Ctrl+单击（⌘+单击）：将此列加入或移出拆分列',
          members: '选择成员',
          move_down: '下移此维度（移向外环）',
          move_up: '上移此维度（移向内环）',
          settings: '环形图设置',
          swap: '交换维度的顺序（顶行 = 内环）',
          uncut: '已按 {{level}} 拆分——再次单击取消按此维度拆分'
        }
      }
    }
  },
  //=======================================================
  //JA
  //=======================================================
  ja: {
    translation: {
      Banner: {
        draw_expansion: '展開（端で）',
        draw_expansion_tooltip: '開いたメンバーはノードを保ち、その子は図の外側に向かって開きます',
        draw_expansion_unavailable: '図の端にある担い手ノード（片側にフローがない）でのみ',
        legend_flow_color: 'フローの色',
        legend_flow_color_bands: '« {{name}} » の帯がフローを色付けします',
        nav_detail_by: '{{level}} で詳細表示',
        nav_swap_drawing: '2 つの次元の描き方を入れ替える（帯 ↔ ノード）',
        nav_swap_drawing_down: '下の次元と描き方を入れ替える',
        nav_swap_drawing_up: '上の次元と描き方を入れ替える',
        nav_undetail: '{{level}} で詳細表示中 — もう一度クリックで解除',
        reader_all: 'すべて',
        reader_several: '複数選択',
        reader_toggle_frozen: '利用不可：« {{name}} » の複数のメンバーが重なっています',
        title_selection: '{{name}} の選択'
      },
      MEP: {
        legend_nav_panel_toggle: 'ナビゲーションと凡例',
        legend_panel_toggle: '凡例'
      },
      Spreadsheet: {
        zone: {
          pane_picker: '表示中のペイン',
          pane_picker_reader: 'ペイン'
        }
      },
      filter_panel: {
        coordinates: {
          title: '座標'
        }
      },
      inspector: {
        description: '説明'
      },
      matrix: {
        draw_flat: 'フラット',
        draw_hierarchical: '階層',
        draw_hierarchical_unavailable: '1 つのレベルしか表示されていません：メンバーを展開する（+）か、より細かいレベルを選んでください',
        draw_tables: 'メンバーごとに 1 つの表',
        draw_tables_unavailable: '行には別のアクティブな次元が必要です',
        level_hint: 'Shift+クリック：レベル全体',
        nav: {
          drawing: 'この次元の表での描き方',
          move_down: 'この次元を下へ（列の方へ）',
          move_up: 'この次元を上へ（行の方へ）',
          settings: '表の設定',
          swap: '行と列を入れ替える（上の行 = 表の行）'
        },
        subtotal: '{{name}} 合計'
      },
      panel: {
        config_title: '設定',
        pin: '固定：他の場所をクリックしてもウィンドウは開いたまま',
        to_popup: 'ウィンドウとして切り離す',
        to_sidebar: 'サイドバーとしてドッキング'
      },
      presentation: {
        block: {
          infos: '情報',
          label: 'ラベル',
          link_series_flux: 'フローの系列',
          series_count: '{{count}} 個の値',
          show_unit: '単位を表示',
          tags: 'タグ',
          value: '値',
          value_in: '入力',
          value_out: '出力'
        },
        delay: '表示までの遅延（ms）',
        nothing_here: 'この要素に表示するものはありません。',
        trigger: 'ツールチップのきっかけ'
      },
      sunburst: {
        nav: {
          ctrl_hint: 'Ctrl+クリック（⌘+クリック）：この列を分割する列に加える／外す',
          members: 'メンバーを選ぶ',
          move_down: 'この次元を下へ（外側のリングの方へ）',
          move_up: 'この次元を上へ（内側のリングの方へ）',
          settings: 'リングの設定',
          swap: '次元の順序を入れ替える（上の行 = 内側のリング）',
          uncut: '{{level}} で分割中 — もう一度クリックでこの次元での分割を解除'
        }
      }
    }
  }
}
