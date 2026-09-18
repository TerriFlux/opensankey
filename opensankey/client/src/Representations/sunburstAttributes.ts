// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1425 — CE QUE RÈGLE UNE COURONNE, DÉCLARÉ.
//
// La nature n'écrit plus d'interface : elle déclare ses réglages — valeur d'usine, sorte, libellés
// des sept langues, sorte de contrôle et choix — et le formulaire générique les rend, dans
// l'inspecteur pour la mise en forme, dans « Filtres et coordonnées » pour ce qu'on regarde.
//
// LA SORTE RÉPARTIT, et elle seule (cf. figureControls). D'où le classement ci-dessous :
//  - 'navigation' : la hiérarchie de départ, l'enchaînement, la profondeur, le régime de valeur,
//    la valeur d'un nœud, le seuil de regroupement — tout ce qui change CE QU'ON LIT ;
//  - 'style' : couleurs, étiquettes, centre, légende, mentions, info-bulle, geste du clic — tout
//    ce qui change COMMENT ça se dessine, et qu'un style a le droit de porter ;
//  - 'identity' : la racine, posée par la fenêtre depuis son élément, jamais par l'auteur.
//
// Ce fichier ne contient AUCUNE valeur en dur du tracé : chaque défaut est celui que le dessin
// appliquait avant ce lot, pour qu'aucune couronne déjà enregistrée ne change d'aspect.

import { figureAttribute } from './figureAttribute'
import type { Labels7 } from './figureAttribute'
import type { Type_FigureAttributesConfig, Type_FigureChoiceContext } from './Figure'
import { sunburstDimensions } from '../Charts/SunburstHierarchy'
import type { Type_SunburstSankey } from '../Charts/SunburstHierarchy'

/** Groupes visuels du formulaire — clés i18n, cf. `sunburst.group.*`. */
const G = {
  read: 'sunburst.group.read',
  colors: 'sunburst.group.colors',
  labels: 'sunburst.group.labels',
  centre: 'sunburst.group.centre',
  legend: 'sunburst.group.legend',
  notes: 'sunburst.group.notes'
}

const choice = (value: string | number, labels: Labels7) => ({ value, labels })

/** Les hiérarchies du diagramme regardé — jamais figées : un axe ajouté apparaît de lui-même. */
const dimensionChoices = (ctx: Type_FigureChoiceContext) => {
  const sankey = ctx.app_data?.drawing_area?.sankey as Type_SunburstSankey | undefined
  if (!sankey?.nodes_list) return []
  return sunburstDimensions(sankey).map(d => ({ value: d.id, label: d.label }))
}

const yes_no = (o: { [k: string]: unknown }, key: string, fallback: boolean): boolean =>
  typeof o[key] === 'boolean' ? o[key] as boolean : fallback

export const SUNBURST_ATTRIBUTES: Type_FigureAttributesConfig = {

  // ── Ce qu'on lit ────────────────────────────────────────────────────────────────────────────
  dimension_id: figureAttribute<string | undefined>(undefined, 'navigation', {
    en: 'First hierarchy', fr: 'Première hiérarchie', es: 'Primera jerarquía',
    de: 'Erste Hierarchie', it: 'Prima gerarchia', 'zh-CN': '首个层级', ja: '最初の階層'
  }, undefined, { kind: 'select', choicesOf: dimensionChoices, group: G.read }),

  chain_axes: figureAttribute<boolean>(true, 'navigation', {
    en: 'Chain the other hierarchies', fr: 'Enchaîner les autres hiérarchies',
    es: 'Encadenar las demás jerarquías', de: 'Weitere Hierarchien verketten',
    it: 'Concatenare le altre gerarchie', 'zh-CN': '串联其他层级', ja: '他の階層を連結する'
  }, {
    en: 'A node with no children left in the current hierarchy continues in the next one.',
    fr: 'Un nœud qui n’a plus d’enfants dans la hiérarchie courante continue dans la suivante.',
    es: 'Un nodo sin hijos en la jerarquía actual continúa en la siguiente.',
    de: 'Ein Knoten ohne Kinder in der aktuellen Hierarchie setzt in der nächsten fort.',
    it: 'Un nodo senza figli nella gerarchia corrente prosegue nella successiva.',
    'zh-CN': '当前层级中已无子节点的节点，将在下一层级继续展开。',
    ja: '現在の階層で子を持たないノードは、次の階層で続きます。'
  }, { group: G.read, advanced: true }),

  max_depth: figureAttribute<number>(6, 'navigation', {
    en: 'Maximum depth', fr: 'Profondeur maximale', es: 'Profundidad máxima',
    de: 'Maximale Tiefe', it: 'Profondità massima', 'zh-CN': '最大深度', ja: '最大の深さ'
  }, {
    en: 'How many rings at most. Beyond that the hierarchy is cut, and the cut is reported.',
    fr: 'Combien d’anneaux au plus. Au-delà, la hiérarchie est coupée et la coupe est signalée.',
    es: 'Cuántos anillos como máximo. Más allá, la jerarquía se corta y el corte se indica.',
    de: 'Wie viele Ringe höchstens. Darüber hinaus wird die Hierarchie abgeschnitten.',
    it: 'Quanti anelli al massimo. Oltre, la gerarchia viene tagliata e il taglio segnalato.',
    'zh-CN': '最多绘制多少环。超出部分会被截断并加以提示。',
    ja: 'リングは最大でいくつか。超えた分は打ち切られ、その旨が示されます。'
  }, { kind: 'number', min: 1, max: 12, step: 1, group: G.read, advanced: true }),

  value_mode: figureAttribute<'sum' | 'declared'>('sum', 'navigation', {
    en: 'A parent sector is worth', fr: 'Un secteur parent vaut',
    es: 'Un sector padre vale', de: 'Ein Elternsektor entspricht',
    it: 'Un settore padre vale', 'zh-CN': '父扇区的取值', ja: '親の扇形の値'
  }, {
    en: 'Sum of children: the geometry cannot lie, the gap is reported. Node value: what the children do not cover becomes an “Unallocated” sector.',
    fr: 'Somme des enfants : la géométrie ne peut pas mentir, l’écart est signalé. Valeur du nœud : ce que les enfants ne couvrent pas devient un secteur « Non réparti ».',
    es: 'Suma de los hijos: la geometría no puede mentir, la diferencia se indica. Valor del nodo: lo que los hijos no cubren se vuelve «Sin asignar».',
    de: 'Summe der Kinder: die Geometrie kann nicht lügen, die Abweichung wird gemeldet. Knotenwert: was die Kinder nicht abdecken, wird „Nicht zugeordnet“.',
    it: 'Somma dei figli: la geometria non può mentire, lo scarto è segnalato. Valore del nodo: ciò che i figli non coprono diventa «Non assegnato».',
    'zh-CN': '子节点之和：几何关系必然成立，差异会被标注。节点自身值：子节点未覆盖的部分成为「未分配」扇区。',
    ja: '子ノードの合計：図形は決して嘘をつかず、差は注記されます。ノードの値：子が覆わない分は「未割当」になります。'
  }, {
    kind: 'select',
    choices: [
      choice('sum', {
        en: 'Sum of children', fr: 'Somme des enfants', es: 'Suma de los hijos',
        de: 'Summe der Kinder', it: 'Somma dei figli', 'zh-CN': '子节点之和', ja: '子ノードの合計'
      }),
      choice('declared', {
        en: 'Node value', fr: 'Valeur du nœud', es: 'Valor del nodo', de: 'Knotenwert',
        it: 'Valore del nodo', 'zh-CN': '节点自身值', ja: 'ノードの値'
      })
    ],
    group: G.read,
    advanced: true
  }),

  node_value_mode: figureAttribute<'max' | 'inputs' | 'outputs'>('max', 'navigation', {
    en: 'A node is worth', fr: 'Un nœud vaut', es: 'Un nodo vale',
    de: 'Ein Knoten entspricht', it: 'Un nodo vale',
    'zh-CN': '节点的取值', ja: 'ノードの値'
  }, {
    en: 'Which side of the node the value is read from. Often makes no difference: on a balanced diagram inflows equal outflows.',
    fr: 'De quel côté du nœud la valeur se lit. Souvent sans effet : sur un diagramme bouclé, les entrées égalent les sorties.',
    es: 'De qué lado del nodo se lee el valor. A menudo sin efecto: en un diagrama equilibrado las entradas igualan las salidas.',
    de: 'Auf welcher Seite des Knotens der Wert gelesen wird. Meist ohne Wirkung: in einem ausgeglichenen Diagramm sind Zu- und Abflüsse gleich.',
    it: 'Da quale lato del nodo si legge il valore. Spesso senza effetto: in un diagramma bilanciato gli ingressi eguagliano le uscite.',
    'zh-CN': '从节点的哪一侧读取数值。通常没有差别：在平衡的图中流入等于流出。',
    ja: 'ノードのどちら側から値を読むか。多くの場合は差が出ません（平衡した図では流入と流出は等しい）。'
  }, {
    kind: 'select',
    choices: [
      choice('max', {
        en: 'the larger of its two sides', fr: 'le plus grand de ses deux côtés',
        es: 'el mayor de sus dos lados', de: 'der größeren seiner beiden Seiten',
        it: 'il maggiore dei suoi due lati', 'zh-CN': '两侧中的较大者', ja: '両側のうち大きい方'
      }),
      choice('inputs', {
        en: 'its inflows', fr: 'ses entrées', es: 'sus entradas', de: 'seiner Zuflüsse',
        it: 'i suoi ingressi', 'zh-CN': '流入量', ja: '流入量'
      }),
      choice('outputs', {
        en: 'its outflows', fr: 'ses sorties', es: 'sus salidas', de: 'seiner Abflüsse',
        it: 'le sue uscite', 'zh-CN': '流出量', ja: '流出量'
      })
    ],
    group: G.read,
    advanced: true
  }),

  sort_order: figureAttribute<'value_desc' | 'value_asc' | 'name' | 'model'>(
    'value_desc', 'style', {
      en: 'Sector order', fr: 'Ordre des secteurs', es: 'Orden de los sectores',
      de: 'Reihenfolge der Sektoren', it: 'Ordine dei settori',
      'zh-CN': '扇区顺序', ja: '扇形の順序'
    }, undefined, {
      kind: 'select',
      choices: [
        choice('value_desc', {
          en: 'Largest first', fr: 'Du plus grand au plus petit', es: 'De mayor a menor',
          de: 'Größte zuerst', it: 'Dal più grande al più piccolo',
          'zh-CN': '从大到小', ja: '大きい順'
        }),
        choice('value_asc', {
          en: 'Smallest first', fr: 'Du plus petit au plus grand', es: 'De menor a mayor',
          de: 'Kleinste zuerst', it: 'Dal più piccolo al più grande',
          'zh-CN': '从小到大', ja: '小さい順'
        }),
        choice('name', {
          en: 'By name', fr: 'Par nom', es: 'Por nombre', de: 'Nach Name', it: 'Per nome',
          'zh-CN': '按名称', ja: '名前順'
        }),
        choice('model', {
          en: 'Model order', fr: 'Ordre du modèle', es: 'Orden del modelo',
          de: 'Reihenfolge des Modells', it: 'Ordine del modello',
          'zh-CN': '模型顺序', ja: 'モデルの順序'
        })
      ],
      group: G.read
    }),

  others_threshold: figureAttribute<number>(1.5, 'style', {
    en: 'Group parts under (% of the whole)', fr: 'Regrouper les parts sous (% du tout)',
    es: 'Agrupar las partes por debajo de (% del total)',
    de: 'Teile zusammenfassen unter (% des Ganzen)',
    it: 'Raggruppare le parti sotto (% del totale)',
    'zh-CN': '低于此占比的部分合并（占整体 %）', ja: '全体に対する割合がこの値未満の部分をまとめる（%）'
  }, {
    en: 'Zero never groups. A sector too thin to be seen or hovered is folded into “Others”.',
    fr: 'Zéro ne regroupe jamais. Un secteur trop étroit pour être vu ou survolé rejoint « Autres ».',
    es: 'Cero no agrupa nunca. Un sector demasiado estrecho para verse pasa a «Otros».',
    de: 'Null fasst nie zusammen. Ein zu schmaler Sektor wandert in „Andere“.',
    it: 'Zero non raggruppa mai. Un settore troppo stretto finisce in «Altri».',
    'zh-CN': '设为 0 则从不合并。过窄而无法查看或悬停的扇区会并入「其他」。',
    ja: '0 なら決してまとめません。細すぎて見えない扇形は「その他」に入ります。'
  }, { kind: 'number', min: 0, max: 25, step: 0.5, group: G.read, advanced: true }),

  // ── Couleurs ────────────────────────────────────────────────────────────────────────────────
  color_source: figureAttribute<'palette' | 'model'>('palette', 'style', {
    en: 'Sector colour', fr: 'Couleur des secteurs', es: 'Color de los sectores',
    de: 'Farbe der Sektoren', it: 'Colore dei settori', 'zh-CN': '扇区颜色', ja: '扇形の色'
  }, undefined, {
    kind: 'select',
    choices: [
      choice('palette', {
        en: 'Figure palette', fr: 'Palette de la figure', es: 'Paleta de la figura',
        de: 'Palette der Abbildung', it: 'Tavolozza della figura',
        'zh-CN': '图形调色板', ja: '図のパレット'
      }),
      choice('model', {
        en: 'Node colour from the model', fr: 'Couleur du nœud dans le modèle',
        es: 'Color del nodo en el modelo', de: 'Knotenfarbe aus dem Modell',
        it: 'Colore del nodo nel modello', 'zh-CN': '模型中的节点颜色', ja: 'モデルのノード色'
      })
    ],
    group: G.colors
  }),

  depth_shading: figureAttribute<boolean>(true, 'style', {
    en: 'Lighten by depth', fr: 'Éclaircir selon la profondeur', es: 'Aclarar según la profundidad',
    de: 'Nach Tiefe aufhellen', it: 'Schiarire in base alla profondità',
    'zh-CN': '按层级深浅变化', ja: '深さに応じて明るくする'
  }, {
    en: 'Hue says the branch, lightness says the ring.',
    fr: 'La teinte dit la branche, la clarté dit l’anneau.',
    es: 'El tono dice la rama, la claridad dice el anillo.',
    de: 'Der Farbton nennt den Zweig, die Helligkeit den Ring.',
    it: 'La tinta dice il ramo, la chiarezza dice l’anello.',
    'zh-CN': '色相表示分支，明度表示环层。',
    ja: '色相が枝を、明度がリングを表します。'
  }, { group: G.colors }),

  border_visible: figureAttribute<boolean>(true, 'style', {
    en: 'Sector border', fr: 'Bordure des secteurs', es: 'Borde de los sectores',
    de: 'Rand der Sektoren', it: 'Bordo dei settori', 'zh-CN': '扇区描边', ja: '扇形の枠線'
  }, undefined, { group: G.colors }),

  border_color: figureAttribute<string>('#ffffff', 'style', {
    en: 'Border colour', fr: 'Couleur de la bordure', es: 'Color del borde',
    de: 'Randfarbe', it: 'Colore del bordo', 'zh-CN': '描边颜色', ja: '枠線の色'
  }, undefined, {
    kind: 'color', group: G.colors,
    visibleIf: (o) => yes_no(o, 'border_visible', true)
  }),

  // ── Étiquettes ──────────────────────────────────────────────────────────────────────────────
  labels_mode: figureAttribute<'fit' | 'none' | 'always'>('fit', 'style', {
    en: 'Show names', fr: 'Afficher les noms', es: 'Mostrar los nombres',
    de: 'Namen anzeigen', it: 'Mostrare i nomi', 'zh-CN': '显示名称', ja: '名前を表示'
  }, undefined, {
    kind: 'select',
    choices: [
      choice('fit', {
        en: 'Where they fit', fr: 'Là où ça tient', es: 'Donde quepan',
        de: 'Wo sie hineinpassen', it: 'Dove ci stanno', 'zh-CN': '能放下时显示', ja: '収まる場所に'
      }),
      choice('always', {
        en: 'Always (truncated)', fr: 'Toujours (tronqués)', es: 'Siempre (truncados)',
        de: 'Immer (abgeschnitten)', it: 'Sempre (troncati)', 'zh-CN': '始终显示（可截断）',
        ja: '常に（切り詰め）'
      }),
      choice('none', {
        en: 'Never', fr: 'Jamais', es: 'Nunca', de: 'Nie', it: 'Mai', 'zh-CN': '从不', ja: '表示しない'
      })
    ],
    group: G.labels
  }),

  label_orientation: figureAttribute<'radial' | 'tangential' | 'horizontal'>(
    'radial', 'style', {
      en: 'Label orientation', fr: 'Orientation des étiquettes', es: 'Orientación de las etiquetas',
      de: 'Ausrichtung der Beschriftungen', it: 'Orientamento delle etichette',
      'zh-CN': '标签方向', ja: 'ラベルの向き'
    }, undefined, {
      kind: 'select',
      choices: [
        choice('radial', {
          en: 'Radial', fr: 'Radiale', es: 'Radial', de: 'Radial', it: 'Radiale',
          'zh-CN': '径向', ja: '放射方向'
        }),
        choice('tangential', {
          en: 'Along the arc', fr: 'Le long de l’arc', es: 'A lo largo del arco',
          de: 'Entlang des Bogens', it: 'Lungo l’arco', 'zh-CN': '沿弧线', ja: '弧に沿って'
        }),
        choice('horizontal', {
          en: 'Horizontal', fr: 'Horizontale', es: 'Horizontal', de: 'Waagerecht',
          it: 'Orizzontale', 'zh-CN': '水平', ja: '水平'
        })
      ],
      group: G.labels,
      visibleIf: (o) => o['labels_mode'] !== 'none'
    }),

  label_name_source: figureAttribute<'displayed' | 'own'>('displayed', 'style', {
    en: 'Sector name', fr: 'Nom des secteurs', es: 'Nombre de los sectores',
    de: 'Name der Sektoren', it: 'Nome dei settori', 'zh-CN': '扇区名称', ja: '扇形の名前'
  }, {
    en: 'The name the diagram draws (template, tag, ancestor) or the node’s own name.',
    fr: 'Le nom que le diagramme dessine (gabarit, étiquette, ancêtre) ou le nom propre du nœud.',
    es: 'El nombre que dibuja el diagrama (plantilla, etiqueta, ancestro) o el nombre propio.',
    de: 'Der vom Diagramm gezeichnete Name (Vorlage, Tag, Vorfahr) oder der eigene Name.',
    it: 'Il nome che il diagramma disegna (modello, etichetta, antenato) o il nome proprio.',
    'zh-CN': '图中绘制的名称（模板、标签、上级）或节点自身名称。',
    ja: '図が描く名前（テンプレート、タグ、上位ノード）か、ノード自身の名前。'
  }, {
    kind: 'select',
    choices: [
      choice('displayed', {
        en: 'As the diagram names it', fr: 'Comme le diagramme le nomme',
        es: 'Como lo nombra el diagrama', de: 'Wie das Diagramm ihn nennt',
        it: 'Come lo nomina il diagramma', 'zh-CN': '与图中一致', ja: '図と同じ名前'
      }),
      choice('own', {
        en: 'The node’s own name', fr: 'Le nom propre du nœud', es: 'El nombre propio del nodo',
        de: 'Der eigene Name des Knotens', it: 'Il nome proprio del nodo',
        'zh-CN': '节点自身名称', ja: 'ノード自身の名前'
      })
    ],
    group: G.labels,
    visibleIf: (o) => o['labels_mode'] !== 'none'
  }),

  label_value_visible: figureAttribute<boolean>(false, 'style', {
    en: 'Show the value', fr: 'Afficher la valeur', es: 'Mostrar el valor',
    de: 'Wert anzeigen', it: 'Mostrare il valore', 'zh-CN': '显示数值', ja: '値を表示'
  }, undefined, { group: G.labels, visibleIf: (o) => o['labels_mode'] !== 'none' }),

  label_unit_visible: figureAttribute<boolean>(false, 'style', {
    en: 'Show the unit', fr: 'Afficher l’unité', es: 'Mostrar la unidad',
    de: 'Einheit anzeigen', it: 'Mostrare l’unità', 'zh-CN': '显示单位', ja: '単位を表示'
  }, undefined, {
    group: G.labels,
    visibleIf: (o) => o['labels_mode'] !== 'none' && yes_no(o, 'label_value_visible', false)
  }),

  label_digits: figureAttribute<number>(4, 'style', {
    en: 'Significant digits', fr: 'Chiffres significatifs', es: 'Cifras significativas',
    de: 'Signifikante Stellen', it: 'Cifre significative', 'zh-CN': '有效数字', ja: '有効数字'
  }, undefined, {
    kind: 'number', min: 1, max: 12, step: 1, group: G.labels,
    visibleIf: (o) => o['labels_mode'] !== 'none' && yes_no(o, 'label_value_visible', false)
  }),

  label_percent: figureAttribute<'none' | 'total' | 'parent'>('none', 'style', {
    en: 'Show a percentage', fr: 'Afficher un pourcentage', es: 'Mostrar un porcentaje',
    de: 'Prozentsatz anzeigen', it: 'Mostrare una percentuale',
    'zh-CN': '显示百分比', ja: '割合を表示'
  }, undefined, {
    kind: 'select',
    choices: [
      choice('none', {
        en: 'None', fr: 'Aucun', es: 'Ninguno', de: 'Keiner', it: 'Nessuna',
        'zh-CN': '不显示', ja: '表示しない'
      }),
      choice('total', {
        en: 'Of the whole', fr: 'Du tout', es: 'Del total', de: 'Vom Ganzen',
        it: 'Del totale', 'zh-CN': '占整体', ja: '全体に対して'
      }),
      choice('parent', {
        en: 'Of its parent', fr: 'De son parent', es: 'De su padre', de: 'Vom Elternteil',
        it: 'Del suo genitore', 'zh-CN': '占父级', ja: '親に対して'
      })
    ],
    group: G.labels,
    visibleIf: (o) => o['labels_mode'] !== 'none'
  }),

  label_font_size: figureAttribute<number>(10, 'style', {
    en: 'Label size', fr: 'Taille des étiquettes', es: 'Tamaño de las etiquetas',
    de: 'Schriftgröße der Beschriftungen', it: 'Dimensione delle etichette',
    'zh-CN': '标签字号', ja: 'ラベルの文字サイズ'
  }, undefined, {
    kind: 'number', min: 5, max: 24, step: 1, group: G.labels,
    visibleIf: (o) => o['labels_mode'] !== 'none'
  }),

  label_bold: figureAttribute<boolean>(false, 'style', {
    en: 'Bold labels', fr: 'Étiquettes en gras', es: 'Etiquetas en negrita',
    de: 'Fette Beschriftungen', it: 'Etichette in grassetto',
    'zh-CN': '标签加粗', ja: 'ラベルを太字に'
  }, undefined, { group: G.labels, visibleIf: (o) => o['labels_mode'] !== 'none' }),

  // ── Le centre ───────────────────────────────────────────────────────────────────────────────
  centre_content: figureAttribute<'both' | 'name' | 'value' | 'none'>('both', 'style', {
    en: 'Centre shows', fr: 'Le centre affiche', es: 'El centro muestra',
    de: 'Die Mitte zeigt', it: 'Il centro mostra', 'zh-CN': '中心显示', ja: '中心の表示'
  }, undefined, {
    kind: 'select',
    choices: [
      choice('both', {
        en: 'Name and value', fr: 'Nom et valeur', es: 'Nombre y valor', de: 'Name und Wert',
        it: 'Nome e valore', 'zh-CN': '名称与数值', ja: '名前と値'
      }),
      choice('name', {
        en: 'Name only', fr: 'Nom seul', es: 'Solo el nombre', de: 'Nur Name',
        it: 'Solo il nome', 'zh-CN': '仅名称', ja: '名前のみ'
      }),
      choice('value', {
        en: 'Value only', fr: 'Valeur seule', es: 'Solo el valor', de: 'Nur Wert',
        it: 'Solo il valore', 'zh-CN': '仅数值', ja: '値のみ'
      }),
      choice('none', {
        en: 'Nothing', fr: 'Rien', es: 'Nada', de: 'Nichts', it: 'Niente',
        'zh-CN': '不显示', ja: '表示しない'
      })
    ],
    group: G.centre
  }),

  centre_hole: figureAttribute<number>(22, 'style', {
    en: 'Hole size (% of radius)', fr: 'Taille du trou (% du rayon)',
    es: 'Tamaño del hueco (% del radio)', de: 'Lochgröße (% des Radius)',
    it: 'Dimensione del foro (% del raggio)', 'zh-CN': '中心孔大小（半径 %）',
    ja: '中心の穴の大きさ（半径の %）'
  }, undefined, { kind: 'number', min: 5, max: 60, step: 1, group: G.centre }),

  // ── La légende ──────────────────────────────────────────────────────────────────────────────
  legend_mode: figureAttribute<'auto' | 'none' | 'rings' | 'branches' | 'both'>(
    'auto', 'style', {
      en: 'Legend', fr: 'Légende', es: 'Leyenda', de: 'Legende', it: 'Legenda',
      'zh-CN': '图例', ja: '凡例'
    }, {
      en: 'Automatic lists the rings, and only the sectors the drawing could not name.',
      fr: 'Automatique liste les anneaux, et les seuls secteurs que le dessin n’a pas pu nommer.',
      es: 'Automática enumera los anillos y solo los sectores que el dibujo no pudo nombrar.',
      de: 'Automatisch listet die Ringe und nur die Sektoren, die die Zeichnung nicht benennt.',
      it: 'Automatica elenca gli anelli e i soli settori che il disegno non ha potuto nominare.',
      'zh-CN': '自动模式列出环层，以及图中无法标注名称的扇区。',
      ja: '自動では、リングと、図中に名前を書けなかった扇形だけを並べます。'
    }, {
      kind: 'select',
      choices: [
        choice('auto', {
          en: 'Automatic', fr: 'Automatique', es: 'Automática', de: 'Automatisch',
          it: 'Automatica', 'zh-CN': '自动', ja: '自動'
        }),
        choice('rings', {
          en: 'Rings only', fr: 'Anneaux seuls', es: 'Solo los anillos', de: 'Nur Ringe',
          it: 'Solo gli anelli', 'zh-CN': '仅环层', ja: 'リングのみ'
        }),
        choice('branches', {
          en: 'Branches only', fr: 'Branches seules', es: 'Solo las ramas', de: 'Nur Zweige',
          it: 'Solo i rami', 'zh-CN': '仅分支', ja: '枝のみ'
        }),
        choice('both', {
          en: 'Rings and every branch', fr: 'Anneaux et toutes les branches',
          es: 'Anillos y todas las ramas', de: 'Ringe und alle Zweige',
          it: 'Anelli e tutti i rami', 'zh-CN': '环层与全部分支', ja: 'リングとすべての枝'
        }),
        choice('none', {
          en: 'None', fr: 'Aucune', es: 'Ninguna', de: 'Keine', it: 'Nessuna',
          'zh-CN': '不显示', ja: '表示しない'
        })
      ],
      group: G.legend
    }),

  legend_position: figureAttribute<'right' | 'left' | 'bottom'>('right', 'style', {
    en: 'Legend position', fr: 'Position de la légende', es: 'Posición de la leyenda',
    de: 'Position der Legende', it: 'Posizione della legenda',
    'zh-CN': '图例位置', ja: '凡例の位置'
  }, undefined, {
    kind: 'select',
    choices: [
      choice('right', {
        en: 'Right', fr: 'À droite', es: 'A la derecha', de: 'Rechts', it: 'A destra',
        'zh-CN': '右侧', ja: '右'
      }),
      choice('left', {
        en: 'Left', fr: 'À gauche', es: 'A la izquierda', de: 'Links', it: 'A sinistra',
        'zh-CN': '左侧', ja: '左'
      }),
      choice('bottom', {
        en: 'Below', fr: 'Dessous', es: 'Debajo', de: 'Unten', it: 'Sotto',
        'zh-CN': '下方', ja: '下'
      })
    ],
    group: G.legend,
    visibleIf: (o) => o['legend_mode'] !== 'none'
  }),

  // ── Mentions et info-bulle ──────────────────────────────────────────────────────────────────
  notes_visible: figureAttribute<boolean>(true, 'style', {
    en: 'Show warnings', fr: 'Afficher les avertissements', es: 'Mostrar las advertencias',
    de: 'Warnungen anzeigen', it: 'Mostrare gli avvisi', 'zh-CN': '显示提示', ja: '注意書きを表示'
  }, {
    en: 'Sum of independent roots, parents that do not match their children, truncated depth.',
    fr: 'Somme de racines indépendantes, parents qui ne bouclent pas, profondeur tronquée.',
    es: 'Suma de raíces independientes, padres que no cuadran, profundidad truncada.',
    de: 'Summe unabhängiger Wurzeln, nicht passende Elternknoten, abgeschnittene Tiefe.',
    it: 'Somma di radici indipendenti, genitori che non quadrano, profondità troncata.',
    'zh-CN': '独立根节点之和、与子节点不平衡的父节点、被截断的层级。',
    ja: '独立したルートの合計、子と一致しない親、打ち切られた深さ。'
  }, { group: G.notes }),

  tooltip_visible: figureAttribute<boolean>(true, 'style', {
    en: 'Tooltip on hover', fr: 'Info-bulle au survol', es: 'Información al pasar el ratón',
    de: 'Tooltip beim Überfahren', it: 'Suggerimento al passaggio',
    'zh-CN': '悬停提示', ja: 'ホバー時のツールチップ'
  }, undefined, { group: G.notes }),

  click_action: figureAttribute<'both' | 'zoom' | 'aggregate' | 'none'>('both', 'style', {
    en: 'Clicking a sector', fr: 'Le clic sur un secteur', es: 'Al hacer clic en un sector',
    de: 'Klick auf einen Sektor', it: 'Il clic su un settore',
    'zh-CN': '点击扇区时', ja: '扇形をクリックすると'
  }, undefined, {
    kind: 'select',
    choices: [
      choice('both', {
        en: 'Zooms in and expands it in the diagram',
        fr: 'Zoome dedans et le déplie dans le diagramme',
        es: 'Hace zoom y lo despliega en el diagrama',
        de: 'Zoomt hinein und klappt ihn im Diagramm auf',
        it: 'Ingrandisce e lo espande nel diagramma',
        'zh-CN': '放大并在图中展开', ja: 'ズームし、図でも展開する'
      }),
      choice('zoom', {
        en: 'Zooms into the ring only', fr: 'Zoome dans l’anneau seulement',
        es: 'Solo hace zoom en el anillo', de: 'Zoomt nur in den Ring',
        it: 'Ingrandisce solo l’anello', 'zh-CN': '仅放大环层', ja: 'リング内のズームのみ'
      }),
      choice('aggregate', {
        en: 'Expands it in the diagram only', fr: 'Le déplie dans le diagramme seulement',
        es: 'Solo lo despliega en el diagrama', de: 'Klappt ihn nur im Diagramm auf',
        it: 'Lo espande solo nel diagramma', 'zh-CN': '仅在图中展开', ja: '図での展開のみ'
      }),
      choice('none', {
        en: 'Does nothing', fr: 'Ne fait rien', es: 'No hace nada', de: 'Tut nichts',
        it: 'Non fa nulla', 'zh-CN': '无操作', ja: '何もしない'
      })
    ],
    group: G.notes
  })
}
