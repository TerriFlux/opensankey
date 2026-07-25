import { applyRandomColors } from '../../Algorithms/Colors'
import { prepositionAllInPlace, centerChildrenOnParent } from '../../Algorithms/Hierarchies'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { MenuConfig } from './SankeyMenuContext'
import { downloadImageSource } from './SaveImage'

export const ZDD_MENU_CONFIG: MenuConfig = {
  structure: [
    { type: 'button', actionName: 'clearCurrentView', visibilityConditions: [{ type: 'custom', customCheck: (app_data) => 'has_views' in app_data && (app_data as unknown as { has_views: boolean }).has_views }] },
    { type: 'button', actionName: 'deleteAllViews' },
    {
      type: 'submenu',
      titleKey: 'Positionnement',
      children: [
        { type: 'button', actionName: 'bakeZoomTo100' },
        { type: 'button', actionName: 'transposeDA' },
        {
          type: 'submenu',
          titleKey: 'MiseEnPageAuto',
          children: [
            { type: 'widget', widgetName: 'MenuContextAutoLayout', widgetProps: {} }
          ]
        },
        { type: 'button', actionName: 'prepositionInPlace' },
        { type: 'button', actionName: 'centerChildrenOnParent' },
        // {
        //   type: 'button', actionName: 'toggleAutoX',
        //   visibilityConditions: [{
        //     type: 'custom',
        //     customCheck: (app_data) => {
        //       return app_data.drawing_area.sankey.styles_dict['default'].shape_position_type === 'parametric'
        //     }
        //   }]
        // },
        // {
        //   type: 'button', actionName: 'toggleAutoY',
        //   visibilityConditions: [{
        //     type: 'custom',
        //     customCheck: (app_data) => {
        //       return app_data.drawing_area.sankey.styles_dict['default'].shape_position_type === 'parametric'
        //     }
        //   }]
        // },
        {
          type: 'button', actionName: 'toggleTradeMode',
          visibilityConditions: [{
            type: 'custom',
            customCheck: (app_data) => {
              const sankey = app_data.drawing_area.sankey
              if (!sankey.node_taggs_dict['type de noeud']) {
                return false
              }
              const process_nodes = sankey.nodes_list
              const echangeTag = sankey.node_taggs_dict['type de noeud'].tags_dict['echange']
              const import_nodes = process_nodes.filter(n =>
                n.hasGivenTag(echangeTag) && n.output_links_list.length > 0
              )
              const export_nodes = process_nodes.filter(n =>
                n.hasGivenTag(echangeTag) && n.input_links_list.length > 0
              )
              if (import_nodes.length + export_nodes.length === 0) {
                return false
              }
              return true
            }
          }]
        },
        { type: 'button', actionName: 'arrangeNodesToGrid' },
        {
          type: 'submenu',
          titleKey: 'ResetVerticalIntervals',
          visibilityConditions: [{
            type: 'custom',
            customCheck: (app_data) => {
              return app_data.drawing_area.sankey.styles_dict['default'].shape_position_type === 'parametric'
            }
          }],
          children: [
            { type: 'widget', widgetName: 'MenuContextResetVerticalIntervals', widgetProps: {} }
          ]
        }
      ]
    },
    // {
    //   type: 'submenu',
    //   titleKey: 'ZoneDessin',
    //   children: [
    //     { type: 'button', actionName: 'bgGrid' },
    //     { type: 'button', actionName: 'maskLegend' }
    //   ]
    // },
    {
      type: 'submenu',
      titleKey: 'GestionCouleurs',
      children: [
        { type: 'button', actionName: 'applyRandomNodeColors' },
        { type: 'button', actionName: 'applyRandomLinkColors' },
        { type: 'button', actionName: 'resetNodeColors' },
        { type: 'button', actionName: 'resetLinkColors' }
      ]
    },
    // OS#1243 — « Styles des éléments » retiré du menu contextuel : les styles
    // s'éditent désormais dans l'inspecteur (portée Styles sur une sélection,
    // onglet Styles de la cible « Vue » quand rien n'est sélectionné).
    // {
    //   type: 'button',
    //   actionName: 'openGraphOrder'
    // },
    {
      type: 'button',
      actionName: 'toggleZDTActivated',
      visibilityConditions: [{
        type: 'custom',
        customCheck: (app_data) => {
          return app_data.drawing_area.sankey.containers_list.length > 0
        }
      }]
    },
    {
      type: 'button',
      actionName: 'saveBgImage',
      visibilityConditions: [{
        type: 'custom',
        customCheck: (app_data) =>
          app_data.drawing_area.show_background_image && !!app_data.drawing_area.background_image
      }]
    }
  ],

  actions: {
    toggleZDTActivated: {
      type: 'toggle',
      labels: {
        en: 'Text Zone',
        fr: 'Zone de texte',
        es: 'Zona de texto',
        de: 'Textbereich',
        it: 'Zona di testo',
        'zh-CN': '文本区',
        ja: 'テキストエリア'
      },
      tooltips: {
        en: 'Text Zone',
        fr: 'Zone de texte',
        es: 'Zona de texto',
        de: 'Textbereich',
        it: 'Zona di testo',
        'zh-CN': '文本区',
        ja: 'テキストエリア'
      },
      labelsToggle: {
        en: {
          true: 'Deactivate Text Zone ',
          false: 'Activate Text Zone'
        },
        fr: {
          true: 'Désactiver zone de texte',
          false: 'Activer zone de texte'
        },
        es: {
          true: 'Desactivar zona de texto',
          false: 'Activar zona de texto'
        },
        de: {
          true: 'Textbereich deaktivieren',
          false: 'Textbereich aktivieren'
        },
        it: {
          true: 'Disattiva zona di testo',
          false: 'Attiva zona di testo'
        },
        'zh-CN': {
          true: '停用文本区 ',
          false: '启用文本区'
        },
        ja: {
          true: 'テキストエリアを無効にする ',
          false: 'テキストエリアを有効にする'
        }
      },
      getToggleValue: 'toggleZDTActivatedValue'
    },
    clearCurrentView: {
      type: 'action',
      labels: {
        en: 'Clear view',
        fr: 'Vider la vue',
        es: 'Vaciar la vista',
        de: 'Ansicht leeren',
        it: 'Svuota la vista',
        'zh-CN': '清空视图',
        ja: 'ビューを空にする'
      },
      tooltips: {
        en: 'Clear all nodes and links in the current view',
        fr: 'Supprimer tous les nœuds et flux de la vue courante',
        es: 'Eliminar todos los nodos y flujos de la vista actual',
        de: 'Alle Knoten und Flüsse in der aktuellen Ansicht löschen',
        it: 'Eliminare tutti i nodi e flussi nella vista corrente',
        'zh-CN': '清除当前视图中的所有节点与流量',
        ja: '現在のビューのノードとフローをすべて削除します'
      }
    },

    deleteAllViews: {
      type: 'action',
      labels: {
        en: 'New diagram',
        fr: 'Nouveau diagramme',
        es: 'Nuevo diagrama',
        de: 'Neues Diagramm',
        it: 'Nuovo diagramma',
        'zh-CN': '新建图表',
        ja: '新しい図'
      },
      tooltips: {
        en: 'Delete all views and reset to an empty diagram',
        fr: 'Supprimer toutes les vues et réinitialiser un diagramme vide',
        es: 'Eliminar todas las vistas y restablecer un diagrama vacío',
        de: 'Alle Ansichten löschen und auf ein leeres Diagramm zurücksetzen',
        it: 'Eliminare tutte le viste e reimpostare un diagramma vuoto',
        'zh-CN': '删除所有视图并重置为空白图表',
        ja: 'すべてのビューを削除し、空の図に戻します'
      }
    },

    bgGrid: {
      type: 'toggle',
      labels: {
        en: 'Grid',
        fr: 'Quadrillage',
        es: 'Cuadrícula',
        de: 'Raster',
        it: 'Griglia',
        'zh-CN': '网格',
        ja: 'グリッド'
      },
      tooltips: {
        en: 'Show or hide the background grid',
        fr: 'Afficher ou masquer la grille de fond',
        es: 'Mostrar u ocultar la cuadrícula de fondo',
        de: 'Hintergrundraster ein- oder ausblenden',
        it: 'Mostrare o nascondere la griglia di sfondo',
        'zh-CN': '显示或隐藏背景网格',
        ja: '背景のグリッドの表示を切り替えます'
      },
      getToggleValue: 'bgGridValue',
      showCheck: true
    },

    maskLegend: {
      type: 'toggle',
      labels: {
        en: 'Legend',
        fr: 'Légende',
        es: 'Leyenda',
        de: 'Legende',
        it: 'Legenda',
        'zh-CN': '图例',
        ja: '凡例'
      },
      labelsToggle: {
        en: {
          true: 'Show the legend',
          false: 'Hide the legend'
        },
        fr: {
          true: 'Afficher la légende',
          false: 'Masquer la légende'
        },
        es: {
          true: 'Mostrar la leyenda',
          false: 'Ocultar la leyenda'
        },
        de: {
          true: 'Legende anzeigen',
          false: 'Legende ausblenden'
        },
        it: {
          true: 'Mostra la legenda',
          false: 'Nascondi la legenda'
        },
        'zh-CN': {
          true: '显示图例',
          false: '隐藏图例'
        },
        ja: {
          true: '凡例を表示',
          false: '凡例を隠す'
        }
      },
      tooltips: {
        en: 'Toggle the visibility of the legend',
        fr: 'Basculer la visibilité de la légende',
        es: 'Alternar la visibilidad de la leyenda',
        de: 'Sichtbarkeit der Legende umschalten',
        it: 'Attiva/disattiva la visibilità della legenda',
        'zh-CN': '切换图例的可见性',
        ja: '凡例の表示を切り替えます'
      },
      getToggleValue: 'maskLegendValue'
    },

    bakeZoomTo100: {
      type: 'action',
      labels: {
        en: 'Reset zoom to 100% (keep appearance)',
        fr: 'Ramener le zoom à 100 % (aspect conservé)',
        es: 'Restablecer el zoom al 100 % (conservar aspecto)',
        de: 'Zoom auf 100 % zurücksetzen (Aussehen behalten)',
        it: 'Riporta lo zoom al 100% (aspetto invariato)',
        'zh-CN': '将缩放重置为 100%（保持外观）',
        ja: 'ズームを 100% に戻す（見た目は維持）'
      },
      tooltips: {
        en: 'Bake the current zoom into the geometry: multiply node/text-zone sizes, fonts, positions and flow scale by the current ratio, then set the camera back to 100%. The diagram looks identical but stored pixel sizes reflect the real scale. Undoable.',
        fr: 'Fige le zoom courant dans la géométrie : multiplie les tailles des nœuds/zones de texte, les polices, les positions et l\'échelle des flux par le ratio courant, puis remet la caméra à 100 %. Le diagramme reste identique mais les tailles px stockées reflètent l\'échelle réelle. Annulable.',
        es: 'Fija el zoom actual en la geometría: multiplica los tamaños de nodos/zonas de texto, fuentes, posiciones y escala de flujos por el ratio actual, y vuelve la cámara al 100 %. El diagrama se ve igual pero los tamaños px almacenados reflejan la escala real. Reversible.',
        de: 'Fixiert den aktuellen Zoom in der Geometrie: multipliziert Knoten-/Textzonengrößen, Schriften, Positionen und Flussskala mit dem aktuellen Verhältnis und setzt die Kamera auf 100 %. Das Diagramm sieht identisch aus, gespeicherte Pixelgrößen entsprechen dem realen Maßstab. Umkehrbar.',
        it: 'Fissa lo zoom corrente nella geometria: moltiplica dimensioni di nodi/zone di testo, font, posizioni e scala dei flussi per il rapporto corrente, poi riporta la camera al 100%. Il diagramma resta identico ma le dimensioni px memorizzate riflettono la scala reale. Annullabile.',
        'zh-CN': '将当前缩放固化到几何尺寸中：把节点/文本区的尺寸、字号、位置与流量比例乘以当前比率，再将视角恢复为 100%。图表外观完全相同，但存储的像素尺寸反映真实比例。可撤销。',
        ja: '現在のズームを図形に焼き付けます：ノード／テキストエリアのサイズ、フォント、位置、フローのスケールを現在の倍率で掛け、視点を 100% に戻します。見た目は変わりませんが、保存されるピクセル寸法が実寸を反映します。取り消し可能です。'
      }
    },

    transposeDA: {
      type: 'action',
      labels: {
        en: 'Transpose diagram',
        fr: 'Transposer le diagramme',
        es: 'Transponer diagrama',
        de: 'Diagramm transponieren',
        it: 'Trasponi diagramma',
        'zh-CN': '转置图表',
        ja: '図を転置'
      },
      tooltips: {
        en: 'Transpose the diagram: swap horizontal and vertical axes',
        fr: 'Transposer le diagramme : inverser les axes horizontal et vertical',
        es: 'Transponer el diagrama: intercambiar los ejes horizontal y vertical',
        de: 'Diagramm transponieren: horizontale und vertikale Achsen tauschen',
        it: 'Trasponi il diagramma: scambia gli assi orizzontale e verticale',
        'zh-CN': '转置图表：交换水平轴与垂直轴',
        ja: '図を転置します：水平軸と垂直軸を入れ替えます'
      }
    },

    prepositionInPlace: {
      type: 'action',
      labels: {
        en: 'Pre-position nodes',
        fr: 'Pré-positionner les nœuds',
        es: 'Pre-posicionar nodos',
        de: 'Knoten vorpositionieren',
        it: 'Pre-posiziona nodi',
        'zh-CN': '预置节点位置',
        ja: 'ノードの位置をあらかじめ計算'
      },
      tooltips: {
        en: 'Recursively disaggregate every node in place then re-aggregate, so all hidden nodes get a position within their ancestor (used by the view filter).',
        fr: 'Désagrège récursivement chaque nœud in-place puis ré-agrège : tous les nœuds cachés reçoivent une position dans l\'empreinte de leur ancêtre (utilisé par le filtre vue).',
        es: 'Desagrega recursivamente cada nodo in situ y reagrega: todos los nodos ocultos obtienen una posición dentro de su ancestro (usado por el filtro de vista).',
        de: 'Zerlegt rekursiv jeden Knoten an Ort und Stelle und aggregiert wieder: alle versteckten Knoten erhalten eine Position innerhalb ihres Vorfahren (vom Ansichtsfilter genutzt).',
        it: 'Disaggrega ricorsivamente ogni nodo in loco poi riaggrega: tutti i nodi nascosti ottengono una posizione nell\'antenato (usato dal filtro vista).',
        'zh-CN': '原地递归分解每个节点再重新聚合，使所有隐藏节点在其祖先内获得位置（供视图筛选使用）。',
        ja: '各ノードをその場で再帰的に分解してから再集約し、隠れているノードにも祖先の中での位置を持たせます（ビューフィルタが使用します）。'
      }
    },

    centerChildrenOnParent: {
      type: 'action',
      labels: {
        en: 'Center children on parent',
        fr: 'Centrer les enfants sur le parent',
        es: 'Centrar los hijos en el padre',
        de: 'Kinder auf Eltern zentrieren',
        it: 'Centra i figli sul genitore',
        'zh-CN': '将子节点居中于父节点',
        ja: '子を親の中心に揃える'
      },
      tooltips: {
        en: 'Place each child\'s center on its parent\'s center (recursively): all descendants end up at their level-1 ancestor\'s position. The view filter then shows leaves stacked on their ancestor (clean static alternative to the ancestor mode).',
        fr: 'Place le centre de chaque enfant sur celui de son parent (récursivement) : tous les descendants se retrouvent à la position de leur ancêtre niveau 1. Le filtre vue montre alors les feuilles empilées sur leur ancêtre (alternative statique propre au mode ancêtres).',
        es: 'Coloca el centro de cada hijo en el de su padre (recursivamente): todos los descendientes quedan en la posición de su ancestro de nivel 1.',
        de: 'Setzt das Zentrum jedes Kindes auf das seines Elternknotens (rekursiv): alle Nachkommen landen an der Position ihres Vorfahren der Ebene 1.',
        it: 'Posiziona il centro di ogni figlio su quello del genitore (ricorsivamente): tutti i discendenti finiscono nella posizione del loro antenato di livello 1.',
        'zh-CN': '将每个子节点的中心置于其父节点的中心（递归）：所有后代最终位于其一级祖先的位置。视图筛选随后会把叶子堆叠显示在其祖先上（祖先模式的简洁静态替代方案）。',
        ja: '各子の中心を親の中心に配置します（再帰的）。すべての子孫は第 1 階層の祖先の位置に集まります。ビューフィルタでは、葉ノードが祖先の上に重なって表示されます（祖先モードのすっきりした静的な代替）。'
      }
    },

    arrangeNodesToGrid: {
      type: 'action',
      labels: {
        en: 'Align to grid',
        fr: 'Aligner sur grille',
        es: 'Alinear a la cuadrícula',
        de: 'Am Raster ausrichten',
        it: 'Allinea alla griglia',
        'zh-CN': '对齐到网格',
        ja: 'グリッドに合わせる'
      },
      tooltips: {
        en: 'Align all nodes to the background grid',
        fr: 'Aligner tous les nœuds sur la grille de fond',
        es: 'Alinear todos los nodos a la cuadrícula de fondo',
        de: 'Alle Knoten am Hintergrundraster ausrichten',
        it: 'Allineare tutti i nodi alla griglia di sfondo',
        'zh-CN': '将所有节点对齐到背景网格',
        ja: 'すべてのノードを背景のグリッドに揃えます'
      }
    },

    toggleParametricMode: {
      type: 'toggle',
      labels: {
        en: 'Absolute coordinate mode',
        fr: 'Mode position en coordonnées absolues',
        es: 'Modo coordenadas absolutas',
        de: 'Absolutkoordinaten-Modus',
        it: 'Modalità coordinate assolute',
        'zh-CN': '绝对坐标模式',
        ja: '絶対座標モード'
      },
      labelsToggle: {
        en: {
          true: 'Absolute coordinate mode',
          false: 'Constant vertical offset mode'
        },
        fr: {
          true: 'Mode position en coordonnées absolues',
          false: 'Mode position avec écart vertical constant'
        },
        es: {
          true: 'Modo coordenadas absolutas',
          false: 'Modo desplazamiento vertical constante'
        },
        de: {
          true: 'Absolutkoordinaten-Modus',
          false: 'Konstanter vertikaler Versatz-Modus'
        },
        it: {
          true: 'Modalità coordinate assolute',
          false: 'Modalità offset verticale costante'
        },
        'zh-CN': {
          true: '绝对坐标模式',
          false: '恒定垂直偏移模式'
        },
        ja: {
          true: '絶対座標モード',
          false: '一定の垂直オフセットモード'
        }
      },
      tooltips: {
        en: 'Toggle between absolute coordinate mode and constant vertical offset mode',
        fr: 'Basculer entre le mode coordonnées absolues et le mode écart vertical constant',
        es: 'Alternar entre modo coordenadas absolutas y modo desplazamiento vertical constante',
        de: 'Zwischen Absolutkoordinaten-Modus und konstantem vertikalen Versatz-Modus umschalten',
        it: 'Alternare tra modalità coordinate assolute e modalità offset verticale costante',
        'zh-CN': '在绝对坐标模式与恒定垂直偏移模式之间切换',
        ja: '絶対座標モードと一定の垂直オフセットモードを切り替えます'
      },
      getToggleValue: 'toggleParametricModeValue'
    },

    resetVerticalIntervals: {
      type: 'action',
      labels: {
        en: 'Reset vertical intervals',
        fr: 'Réinitialiser les intervalles verticaux',
        es: 'Restablecer intervalos verticales',
        de: 'Vertikale Abstände zurücksetzen',
        it: 'Reimposta intervalli verticali',
        'zh-CN': '重置垂直间距',
        ja: '垂直方向の間隔をリセット'
      },
      tooltips: {
        en: 'Reset vertical intervals',
        fr: 'Réinitialiser les intervalles verticaux',
        es: 'Restablecer intervalos verticales',
        de: 'Vertikale Abstände zurücksetzen',
        it: 'Reimposta intervalli verticali',
        'zh-CN': '重置垂直间距',
        ja: '垂直方向の間隔をリセット'
      }
    },
    // toggleAutoX: {
    //   type: 'toggle',
    //   labels: {
    //     en: 'Auto X position',
    //     fr: 'Position X auto'
    //   },
    //   labelsToggle: {
    //     en: {
    //       true: 'Disable auto horizontal positioning',
    //       false: 'Enable auto horizontal positioning'
    //     },
    //     fr: {
    //       true: 'Désactiver positionnement horizontal auto',
    //       false: 'Activer positionnement horizontal auto'
    //     }
    //   },
    //   tooltips: {
    //     en: 'Toggle automatic horizontal positioning of nodes',
    //     fr: 'Basculer le positionnement horizontal automatique des nœuds'
    //   },
    //   getToggleValue: 'toggleAutoXValue'
    // },

    toggleTradeMode: {
      type: 'toggle',
      labels: {
        en: 'Import/export close',
        fr: 'Import/export proche',
        es: 'Importación/exportación cercana',
        de: 'Import/Export nah',
        it: 'Importazione/esportazione vicina',
        'zh-CN': '进出口就近',
        ja: '移入／移出を近くに'
      },
      tooltips: {
        en: 'Set import/export nodes close to their connected nodes oir at the top and bottom of the diagram',
        fr: 'Placer les nœuds import/export près de leurs nœuds connectés ou en haut et en bas du diagramme',
        es: 'Colocar los nodos de importación/exportación cerca de sus nodos conectados o en la parte superior e inferior del diagrama',
        de: 'Import-/Export-Knoten nah an ihren verbundenen Knoten oder oben und unten im Diagramm platzieren',
        it: 'Posizionare i nodi di importazione/esportazione vicino ai nodi collegati o in alto e in basso nel diagramma',
        'zh-CN': '将进口/出口节点置于与之相连的节点附近，或置于图表的上下两端',
        ja: '移入／移出ノードを、接続先のノードの近く、または図の上下の端に配置します'
      },
      labelsToggle: {
        en: {
          true: 'Option Import/export close',
          false: 'Option Import/export top/bottom'
        },
        fr: {
          true: 'Option Import/export proche',
          false: 'Option Import/export haut/bas'
        },
        es: {
          true: 'Opción Importación/exportación cercana',
          false: 'Opción Importación/exportación arriba/abajo'
        },
        de: {
          true: 'Option Import/Export nah',
          false: 'Option Import/Export oben/unten'
        },
        it: {
          true: 'Opzione Importazione/esportazione vicina',
          false: 'Opzione Importazione/esportazione alto/basso'
        },
        'zh-CN': {
          true: '进出口就近选项',
          false: '进出口置于上下两端选项'
        },
        ja: {
          true: '移入／移出を近くに配置',
          false: '移入／移出を上下に配置'
        }
      },
      getToggleValue: 'toggleTradeValue'
    },
    applyRandomNodeColors: {
      type: 'action',
      labels: {
        en: 'Random node colors',
        fr: 'Couleurs aléatoires nœuds',
        es: 'Colores aleatorios de nodos',
        de: 'Zufällige Knotenfarben',
        it: 'Colori casuali nodi',
        'zh-CN': '随机节点颜色',
        ja: 'ノードの色をランダムに'
      },
      tooltips: {
        en: 'Apply random colors to all nodes',
        fr: 'Appliquer des couleurs aléatoires à tous les nœuds',
        es: 'Aplicar colores aleatorios a todos los nodos',
        de: 'Zufällige Farben auf alle Knoten anwenden',
        it: 'Applicare colori casuali a tutti i nodi',
        'zh-CN': '为所有节点应用随机颜色',
        ja: 'すべてのノードにランダムな色を適用します'
      }
    },

    applyRandomLinkColors: {
      type: 'action',
      labels: {
        en: 'Random link colors',
        fr: 'Couleurs aléatoires flux',
        es: 'Colores aleatorios de flujos',
        de: 'Zufällige Flussfarben',
        it: 'Colori casuali flussi',
        'zh-CN': '随机流量颜色',
        ja: 'フローの色をランダムに'
      },
      tooltips: {
        en: 'Apply random colors to all links',
        fr: 'Appliquer des couleurs aléatoires à tous les flux',
        es: 'Aplicar colores aleatorios a todos los flujos',
        de: 'Zufällige Farben auf alle Flüsse anwenden',
        it: 'Applicare colori casuali a tutti i flussi',
        'zh-CN': '为所有流量应用随机颜色',
        ja: 'すべてのフローにランダムな色を適用します'
      }
    },

    resetNodeColors: {
      type: 'action',
      labels: {
        en: 'Default node colors',
        fr: 'Couleurs par défaut nœuds',
        es: 'Colores predeterminados de nodos',
        de: 'Standard-Knotenfarben',
        it: 'Colori predefiniti nodi',
        'zh-CN': '默认节点颜色',
        ja: 'ノードを既定色に'
      },
      tooltips: {
        en: 'Reset all nodes to their default colors',
        fr: 'Remettre tous les nœuds à leurs couleurs par défaut',
        es: 'Restablecer todos los nodos a sus colores predeterminados',
        de: 'Alle Knoten auf ihre Standardfarben zurücksetzen',
        it: 'Reimpostare tutti i nodi ai colori predefiniti',
        'zh-CN': '将所有节点恢复为默认颜色',
        ja: 'すべてのノードを既定の色に戻します'
      }
    },

    resetLinkColors: {
      type: 'action',
      labels: {
        en: 'Default link colors',
        fr: 'Couleurs par défaut flux',
        es: 'Colores predeterminados de flujos',
        de: 'Standard-Flussfarben',
        it: 'Colori predefiniti flussi',
        'zh-CN': '默认流量颜色',
        ja: 'フローを既定色に'
      },
      tooltips: {
        en: 'Reset all links to their default colors',
        fr: 'Remettre tous les flux à leurs couleurs par défaut',
        es: 'Restablecer todos los flujos a sus colores predeterminados',
        de: 'Alle Flüsse auf ihre Standardfarben zurücksetzen',
        it: 'Reimpostare tutti i flussi ai colori predefiniti',
        'zh-CN': '将所有流量恢复为默认颜色',
        ja: 'すべてのフローを既定の色に戻します'
      }
    },

    openStyleModal: {
      type: 'action',
      labels: {
        en: 'Element styles',
        fr: 'Styles des éléments',
        es: 'Estilos de elementos',
        de: 'Elementstile',
        it: 'Stili degli elementi',
        'zh-CN': '元素样式',
        ja: '要素のスタイル'
      },
      tooltips: {
        en: 'Open the node visual style configuration dialog',
        fr: 'Ouvrir la boîte de dialogue de configuration du style visuel des nœuds',
        es: 'Abrir el diálogo de configuración del estilo visual de los nodos',
        de: 'Den Dialog zur Konfiguration des visuellen Knotenstils öffnen',
        it: 'Aprire la finestra di configurazione dello stile visivo dei nodi',
        'zh-CN': '打开节点视觉样式配置对话框',
        ja: 'ノードの外観スタイルの設定ダイアログを開きます'
      }
    },

    saveBgImage: {
      type: 'action',
      labels: {
        en: 'Save background image',
        fr: 'Enregistrer l\'image de fond',
        es: 'Guardar imagen de fondo',
        de: 'Hintergrundbild speichern',
        it: 'Salva immagine di sfondo',
        'zh-CN': '保存背景图片',
        ja: '背景画像を保存'
      },
      tooltips: {
        en: 'Download the background image to a file',
        fr: 'Télécharger l\'image de fond dans un fichier',
        es: 'Descargar la imagen de fondo a un archivo',
        de: 'Hintergrundbild in eine Datei herunterladen',
        it: 'Scarica l\'immagine di sfondo in un file',
        'zh-CN': '将背景图片下载为文件',
        ja: '背景画像をファイルとしてダウンロードします'
      }
    },
    // openGraphOrder: {
    //   type: 'action',
    //   labels: {
    //     en: 'Shape draw order',
    //     fr: 'Ordre d\'affichage des formes'
    //   },
    //   tooltips: {
    //     en: 'Shape draw order',
    //     fr: 'Ordre d\'affichage des formes'
    //   }
    // }


  },

  sectionTitles: {
    // ZoneDessin: {
    //   en: 'Drawing zone',
    //   fr: 'Zone de dessin'
    // },
    Positionnement: {
      en: 'Positioning',
      fr: 'Positionnement',
      es: 'Posicionamiento',
      de: 'Positionierung',
      it: 'Posizionamento',
      'zh-CN': '定位',
      ja: '配置'
    },
    MiseEnPageAuto: {
      en: 'Auto layout',
      fr: 'Mise en page auto',
      es: 'Diseño automático',
      de: 'Automatisches Layout',
      it: 'Layout automatico',
      'zh-CN': '自动布局',
      ja: '自動レイアウト'
    },
    ResetVerticalIntervals: {
      en: 'Reset vertical intervals',
      fr: 'Réinitialiser les intervalles verticaux',
      es: 'Restablecer intervalos verticales',
      de: 'Vertikale Abstände zurücksetzen',
      it: 'Reimposta intervalli verticali',
      'zh-CN': '重置垂直间距',
      ja: '垂直方向の間隔をリセット'
    },
    GestionCouleurs: {
      en: 'Color Management',
      fr: 'Gestion des couleurs',
      es: 'Gestión de colores',
      de: 'Farbverwaltung',
      it: 'Gestione colori',
      'zh-CN': '颜色管理',
      ja: '色の管理'
    },
    Style: {
      en: 'Styles',
      fr: 'Style des éléments',
      es: 'Estilos de elementos',
      de: 'Elementstile',
      it: 'Stili degli elementi',
      'zh-CN': '样式',
      ja: 'スタイル'
    }
  }
} as const

export const createZDDModifier = (app_data: Class_ApplicationData) => {
  const { drawing_area, menu_configuration } = app_data
  const { sankey } = drawing_area
  const { nodePositioning } = drawing_area
  const { dict_setter_show_dialog } = menu_configuration
  const { ref_setter_show_modal_styles } = dict_setter_show_dialog
  const saveToCache = () => menu_configuration.ref_to_save_in_cache_indicator.current(false)
  const getNodeStyle = () => sankey.styles_dict['default']
  return {
    clearCurrentView: () => { app_data.reset({ only_current_view: true }); app_data.drawing_area.draw() },
    deleteAllViews: () => app_data.reinitialization(),
    // Fige le zoom courant dans la géométrie puis remet la caméra à 100 % (historique interne
    // à bakeZoomIntoGeometry : snapshots avant/après). saveToCache après pour persister le geste.
    bakeZoomTo100: () => { drawing_area.bakeZoomIntoGeometry(); saveToCache() },
    transposeDA: () => { drawing_area.verticalizeDiagram(); saveToCache() },
    arrangeNodesToGrid: () => { nodePositioning.arrangeNodesToGrid(); saveToCache() },
    prepositionInPlace: () => {
      // Opération lourde (désagrégation récursive) : toast spinner + exécution différée
      // (sendWaitingToast attend ~500 ms pour afficher le spinner avant de bloquer).
      // Repositionne TOUS les nœuds → snapshot avant/après, sinon rien ne le rattrape.
      app_data.sendWaitingToast(() => {
        app_data.runWithSnapshotUndo(() => { prepositionAllInPlace(app_data); saveToCache() })
      })
    },
    centerChildrenOnParent: () => {
      // Écrase les positions de toute la descendance + réordonne les ancres.
      app_data.runWithSnapshotUndo(() => { centerChildrenOnParent(app_data); saveToCache() })
    },
    // #1231 — le mode paramétrique n'est plus un mode utilisateur : ce toggle bascule
    // désormais entre pourcentage et absolu.
    toggleParametricMode: () => getNodeStyle().shape_position_type === 'proportional' ? drawing_area.setAbsoluteMode() : drawing_area.setProportionalMode(),
    toggleParametricModeValue: () => getNodeStyle().shape_position_type === 'proportional',
    resetVerticalIntervals: () => { drawing_area.resetAllVerticalIntervals(); saveToCache() },
    // toggleAutoX: () => { },//getNodeStyle().position.auto_x = !getNodeStyle().position.auto_x },
    // toggleAutoXValue: () => null,//getNodeStyle().position.auto_x,
    // toggleAutoY: () => { },//getNodeStyle().position.auto_y = !getNodeStyle().position.auto_y },
    // toggleAutoYValue: () => null, //getNodeStyle().position.auto_y,
    // setTrade fait un replaceStyles massif + bascule import_export_above_below :
    // withBypassRedraws ne groupait que les rendus, il n'y avait aucun undo.
    toggleTradeMode: () => app_data.runWithSnapshotUndo(() => {
      sankey.tradeOption() == 'above_below' ? sankey.setTrade(true) : sankey.setTrade(false)
      saveToCache()
    }),
    toggleTradeValue: () => sankey.tradeOption() == 'above_below',
    applyRandomNodeColors: () => { applyRandomColors(app_data, sankey.nodes_list); saveToCache() },
    applyRandomLinkColors: () => { applyRandomColors(app_data, sankey.links_list); saveToCache() },
    resetNodeColors: () => { sankey.deleteLocalAttrSelectedElements('shape_color', sankey.nodes_list); saveToCache() },
    resetLinkColors: () => { sankey.deleteLocalAttrSelectedElements('shape_color', sankey.links_list); saveToCache() },
    openStyleModal: () => ref_setter_show_modal_styles.current(true),

    saveBgImage: () => downloadImageSource(drawing_area.background_image, (app_data.file_name || 'sankey') + '_background'),

    toggleZDTActivated: () => {
      app_data.drawing_area.sankey.container_activated = !app_data.drawing_area.sankey.container_activated
      app_data.drawing_area.draw()
    },
    toggleZDTActivatedValue: () => app_data.drawing_area.sankey.container_activated
  }
}
export type ZDDModifierType = ReturnType<typeof createZDDModifier>