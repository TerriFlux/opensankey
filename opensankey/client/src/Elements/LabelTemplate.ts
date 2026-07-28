// ==================================================================================================
// OS#1314 — Gabarits de label à jetons (« labels templétés »).
//
// Un gabarit est un texte libre où des jetons `{Mot}` sont remplacés AU DESSIN
// par une valeur dynamique — exactement la mécanique déjà utilisée par le titre
// du diagramme (jetons `{NomDuGroupe}` de Class_ContainerElement) et par le
// label de nœud (`{Scale}`), généralisée ici à tous les éléments et exposée
// dans l'inspecteur.
//
// Module volontairement FEUILLE (aucun import) : il est chargé par NodeBase /
// TextZone / Link / le générateur de légende, dont aucun ne doit gagner un
// chemin runtime vers le cœur (cf. l'invariant Element → Handler = TDZ au
// démarrage, en-tête d'elementBasics.ts). Les résolveurs qui ont besoin du
// modèle (valeurs, unités, tags assignés) vivent chez l'appelant et sont
// injectés sous forme de fonction `resolve`.
// ==================================================================================================

/** Un jeton = `{` + un mot (éventuellement `Groupe:Argument`) + `}`. */
export const TEMPLATE_TOKEN_REGEX = /\{([^{}]*)\}/g

/** Séparateurs qu'on nettoie aux extrémités quand un jeton s'est résolu à vide. */
const DANGLING_SEPARATORS = ' \t:;,-–—/|'

/**
 * Nettoyage du texte produit : un jeton qui se résout à vide (valeur absente,
 * pas de tag assigné…) laisse sinon des séparateurs orphelins
 * (« Charbon :  » ou «  : 12 t »). On collapse les espaces, puis on retire les
 * séparateurs de tête et de queue. Volontairement limité aux EXTRÉMITÉS : un
 * gabarit « {Source} → {Target} » dont un seul bout manque doit rester lisible,
 * mais on ne va pas deviner quel séparateur interne supprimer.
 */
export function cleanTemplateResult(text: string): string {
  // Paire de délimiteurs devenue VIDE (« Nom [] » quand l'unité manque, gabarit
  // « {Name} [{Unit}] ») : on la retire, elle n'est là que pour habiller un
  // jeton absent.
  let out = text.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '')
  out = out.replace(/[ \t]+/g, ' ')
  // Nettoyage ligne par ligne (un gabarit peut être multi-lignes)
  out = out.split('\n').map(line => {
    let l = line
    let start = 0
    while (start < l.length && DANGLING_SEPARATORS.includes(l[start])) start++
    let end = l.length
    while (end > start && DANGLING_SEPARATORS.includes(l[end - 1])) end--
    l = l.slice(start, end)
    return l
  }).join('\n')
  return out
}

/**
 * Interpole les jetons d'un gabarit. `resolve` reçoit le nom du jeton (sans
 * accolades, espaces retirés) et renvoie :
 *  - une chaîne (éventuellement vide) → le jeton est remplacé ;
 *  - null / undefined → jeton INCONNU, laissé tel quel dans le texte (l'auteur
 *    voit sa faute de frappe au lieu d'un trou silencieux).
 */
export function applyTemplate(
  template: string,
  resolve: (token: string) => string | null | undefined
): string {
  if (!template || !template.includes('{')) return template
  const out = template.replace(TEMPLATE_TOKEN_REGEX, (whole, token: string) => {
    const value = resolve(String(token).trim())
    return (value === null || value === undefined) ? whole : value
  })
  return cleanTemplateResult(out)
}

// JETONS COMMUNS =====================================================================

/** Groupe de tags vu par les résolveurs (structurel : Class_DataTagGroup & co en sont). */
export type Type_TemplateTagGroup = {
  name: string
  selected_tags_list: { display_name: string }[]
}

/** Groupe de VIEW tags : la sélection ne vaut que si le filtre de vue est actif. */
export type Type_TemplateViewTagGroup = Type_TemplateTagGroup & { view_mode: boolean }

/**
 * Jetons `{NomDuGroupe}` des groupes de data tags / view tags : remplacés par la
 * valeur SÉLECTIONNÉE du groupe (comportement historique du titre). En « vue
 * complète » (view_mode faux) un view tag reste sélectionné en interne mais le
 * diagramme n'est pas filtré → le jeton doit être vide, pas le dernier tag choisi.
 * Renvoie null si le jeton ne correspond à aucun groupe (jeton d'un autre
 * résolveur, ou inconnu).
 */
export function resolveTagGroupToken(
  token: string,
  data_taggs: Type_TemplateTagGroup[],
  view_taggs: Type_TemplateViewTagGroup[]
): string | null {
  const data_group = data_taggs.find(g => g.name === token)
  if (data_group) return data_group.selected_tags_list.map(t => t.display_name).join(', ')
  const view_group = view_taggs.find(g => g.name === token)
  if (view_group) {
    return view_group.view_mode
      ? view_group.selected_tags_list.map(t => t.display_name).join(', ')
      : ''
  }
  return null
}

/** Tag assigné à un élément, vu par le résolveur `{Tag:...}`. */
export type Type_TemplateAssignedTag = {
  display_name: string
  group: { id: string, name: string }
}

/**
 * Jeton `{Tag:<groupe>}` — tag assigné à l'élément dans le groupe désigné (par
 * nom, ou par id), le premier si plusieurs. `{Tag}` nu = tous les tags assignés,
 * joints par ', '. Renvoie null si le jeton n'est pas de la famille `Tag`.
 */
export function resolveAssignedTagToken(
  token: string,
  tags: Type_TemplateAssignedTag[]
): string | null {
  if (token === 'Tag') return tags.map(t => t.display_name).join(', ')
  if (!token.startsWith('Tag:')) return null
  const wanted = token.slice(4).trim()
  const tag = tags.find(t => t.group.name === wanted || t.group.id === wanted)
  return tag ? tag.display_name : ''
}

// CATALOGUE POUR L'INTERFACE =========================================================

/** Libellés inline (mêmes 7 langues que les AttributeConfig — pas des clés i18n). */
export type Type_TemplateTokenLabels = {
  en: string, fr: string, es: string, de: string, it: string, 'zh-CN': string, ja: string
}

export type Type_TemplateTokenDef = {
  /** Le jeton tel qu'inséré, accolades comprises. */
  token: string
  /** Alias acceptés à la lecture (compat e!Sankey), non proposés dans le menu. */
  aliases?: string[]
  labels: Type_TemplateTokenLabels
}

/** Jetons proposés pour un label de FLUX. */
export const LINK_TEMPLATE_TOKENS: Type_TemplateTokenDef[] = [
  {
    token: '{Value}',
    aliases: ['Quantity'],
    labels: {
      en: 'Value (formatted, no unit)', fr: 'Valeur (formatée, sans unité)',
      es: 'Valor (formateado, sin unidad)', de: 'Wert (formatiert, ohne Einheit)',
      it: 'Valore (formattato, senza unità)', 'zh-CN': '数值（已格式化，不含单位）',
      ja: '値（書式適用、単位なし）'
    }
  },
  {
    token: '{Unit}',
    aliases: ['UnitName'],
    labels: {
      en: 'Unit', fr: 'Unité', es: 'Unidad', de: 'Einheit', it: 'Unità',
      'zh-CN': '单位', ja: '単位'
    }
  },
  {
    token: '{Name}',
    labels: {
      en: 'Typed label text', fr: 'Texte saisi du label',
      es: 'Texto introducido de la etiqueta', de: 'Eingegebener Beschriftungstext',
      it: 'Testo digitato dell\'etichetta', 'zh-CN': '输入的标签文本',
      ja: '入力したラベル文字列'
    }
  },
  {
    token: '{Source}',
    labels: {
      en: 'Source node name', fr: 'Nom du nœud source',
      es: 'Nombre del nodo origen', de: 'Name des Quellknotens',
      it: 'Nome del nodo sorgente', 'zh-CN': '源节点名称', ja: '始点ノード名'
    }
  },
  {
    token: '{Target}',
    labels: {
      en: 'Target node name', fr: 'Nom du nœud destination',
      es: 'Nombre del nodo destino', de: 'Name des Zielknotens',
      it: 'Nome del nodo destinazione', 'zh-CN': '目标节点名称', ja: '終点ノード名'
    }
  },
  {
    token: '{Tag:}',
    labels: {
      en: 'Assigned flux tag of a group', fr: 'Tag de flux assigné d\'un groupe',
      es: 'Etiqueta de flujo asignada de un grupo', de: 'Zugewiesener Fluss-Tag einer Gruppe',
      it: 'Tag di flusso assegnato di un gruppo', 'zh-CN': '某组中指派的流量标签',
      ja: 'グループで割り当てられたフロータグ'
    }
  },
  {
    token: '{EntryName}',
    labels: {
      en: 'Flux tag of the group chosen below', fr: 'Tag de flux du groupe choisi ci-dessous',
      es: 'Etiqueta de flujo del grupo elegido abajo', de: 'Fluss-Tag der unten gewählten Gruppe',
      it: 'Tag di flusso del gruppo scelto sotto', 'zh-CN': '下方所选标签组的流量标签',
      ja: '下で選んだグループのフロータグ'
    }
  },
  {
    token: '{PercentSourceOut}',
    aliases: ['PercentProcessSource'],
    labels: {
      en: '% of source node outputs', fr: '% des sorties du nœud source',
      es: '% de las salidas del nodo origen', de: '% der Ausgänge des Quellknotens',
      it: '% delle uscite del nodo sorgente', 'zh-CN': '占源节点流出总量的百分比',
      ja: '始点ノードの流出合計に対する％'
    }
  },
  {
    token: '{PercentTargetIn}',
    aliases: ['PercentProcessDestination'],
    labels: {
      en: '% of target node inputs', fr: '% des entrées du nœud destination',
      es: '% de las entradas del nodo destino', de: '% der Eingänge des Zielknotens',
      it: '% degli ingressi del nodo destinazione', 'zh-CN': '占目标节点流入总量的百分比',
      ja: '終点ノードの流入合計に対する％'
    }
  },
  {
    token: '{PercentSourceIn}',
    labels: {
      en: '% of source node inputs', fr: '% des entrées du nœud source',
      es: '% de las entradas del nodo origen', de: '% der Eingänge des Quellknotens',
      it: '% degli ingressi del nodo sorgente', 'zh-CN': '占源节点流入总量的百分比',
      ja: '始点ノードの流入合計に対する％'
    }
  },
  {
    token: '{PercentTargetOut}',
    labels: {
      en: '% of target node outputs', fr: '% des sorties du nœud destination',
      es: '% de las salidas del nodo destino', de: '% der Ausgänge des Zielknotens',
      it: '% delle uscite del nodo destinazione', 'zh-CN': '占目标节点流出总量的百分比',
      ja: '終点ノードの流出合計に対する％'
    }
  },
  {
    token: '{PercentSourceTotal}',
    labels: {
      en: '% of source node throughput', fr: '% du débit du nœud source',
      es: '% del caudal del nodo origen', de: '% des Durchsatzes des Quellknotens',
      it: '% della portata del nodo sorgente', 'zh-CN': '占源节点吞吐量的百分比',
      ja: '始点ノードの総流量に対する％'
    }
  },
  {
    token: '{PercentTargetTotal}',
    labels: {
      en: '% of target node throughput', fr: '% du débit du nœud destination',
      es: '% del caudal del nodo destino', de: '% des Durchsatzes des Zielknotens',
      it: '% della portata del nodo destinazione', 'zh-CN': '占目标节点吞吐量的百分比',
      ja: '終点ノードの総流量に対する％'
    }
  },
  {
    token: '{Coef}',
    labels: {
      en: 'Ratio constraint coefficient', fr: 'Coefficient de la contrainte ratio',
      es: 'Coeficiente de la restricción de ratio', de: 'Koeffizient der Verhältnisbedingung',
      it: 'Coefficiente del vincolo di rapporto', 'zh-CN': '比例约束系数',
      ja: '比率制約の係数'
    }
  }
]

/** Jetons proposés pour un label de NŒUD (ou de zone de texte). */
export const NODE_TEMPLATE_TOKENS: Type_TemplateTokenDef[] = [
  {
    token: '{Name}',
    labels: {
      en: 'Element name', fr: 'Nom de l\'élément', es: 'Nombre del elemento',
      de: 'Elementname', it: 'Nome dell\'elemento', 'zh-CN': '元素名称', ja: '要素名'
    }
  },
  {
    token: '{Value}',
    aliases: ['Quantity'],
    labels: {
      en: 'Node value (formatted)', fr: 'Valeur du nœud (formatée)',
      es: 'Valor del nodo (formateado)', de: 'Knotenwert (formatiert)',
      it: 'Valore del nodo (formattato)', 'zh-CN': '节点数值（已格式化）',
      ja: 'ノードの値（書式適用）'
    }
  },
  {
    token: '{Unit}',
    aliases: ['UnitName'],
    labels: {
      en: 'Unit', fr: 'Unité', es: 'Unidad', de: 'Einheit', it: 'Unità',
      'zh-CN': '单位', ja: '単位'
    }
  },
  {
    token: '{SumIn}',
    labels: {
      en: 'Sum of incoming flux', fr: 'Somme des flux entrants',
      es: 'Suma de los flujos entrantes', de: 'Summe der eingehenden Flüsse',
      it: 'Somma dei flussi in entrata', 'zh-CN': '流入量合计', ja: '流入フローの合計'
    }
  },
  {
    token: '{SumOut}',
    labels: {
      en: 'Sum of outgoing flux', fr: 'Somme des flux sortants',
      es: 'Suma de los flujos salientes', de: 'Summe der ausgehenden Flüsse',
      it: 'Somma dei flussi in uscita', 'zh-CN': '流出量合计', ja: '流出フローの合計'
    }
  },
  {
    token: '{Diff}',
    labels: {
      en: 'Balance (in − out, signed)', fr: 'Bilan (entrées − sorties, signé)',
      es: 'Balance (entradas − salidas, con signo)', de: 'Bilanz (ein − aus, vorzeichenbehaftet)',
      it: 'Bilancio (entrate − uscite, con segno)', 'zh-CN': '差额（流入 − 流出，含符号）',
      ja: '収支（流入 − 流出、符号つき）'
    }
  },
  {
    token: '{DiffAbs}',
    labels: {
      en: 'Balance (absolute value)', fr: 'Bilan (valeur absolue)',
      es: 'Balance (valor absoluto)', de: 'Bilanz (Absolutwert)',
      it: 'Bilancio (valore assoluto)', 'zh-CN': '差额（绝对值）', ja: '収支（絶対値）'
    }
  },
  {
    token: '{Tag:}',
    labels: {
      en: 'Assigned node tag of a group', fr: 'Tag de nœud assigné d\'un groupe',
      es: 'Etiqueta de nodo asignada de un grupo', de: 'Zugewiesener Knoten-Tag einer Gruppe',
      it: 'Tag di nodo assegnato di un gruppo', 'zh-CN': '某组中指派的节点标签',
      ja: 'グループで割り当てられたノードタグ'
    }
  },
  {
    token: '{Scale}',
    labels: {
      en: 'Local scale factor (x24)', fr: 'Facteur d\'échelle local (x24)',
      es: 'Factor de escala local (x24)', de: 'Lokaler Maßstabsfaktor (x24)',
      it: 'Fattore di scala locale (x24)', 'zh-CN': '局部缩放系数（x24）',
      ja: 'ローカル倍率（x24）'
    }
  }
]

/** Jetons d'une ENTRÉE de légende (gabarit commun à toutes les entrées de tag). */
export const LEGEND_TEMPLATE_TOKENS: Type_TemplateTokenDef[] = [
  {
    token: '{Name}',
    aliases: ['EntryName'],
    labels: {
      en: 'Tag name', fr: 'Nom du tag', es: 'Nombre de la etiqueta', de: 'Tag-Name',
      it: 'Nome del tag', 'zh-CN': '标签名称', ja: 'タグ名'
    }
  },
  {
    token: '{Unit}',
    aliases: ['UnitName'],
    labels: {
      en: 'Unit of the tag (unit groups)', fr: 'Unité du tag (groupes d\'unité)',
      es: 'Unidad de la etiqueta (grupos de unidad)', de: 'Einheit des Tags (Einheitengruppen)',
      it: 'Unità del tag (gruppi di unità)', 'zh-CN': '标签的单位（单位组）',
      ja: 'タグの単位（単位グループ）'
    }
  },
  {
    token: '{Group}',
    aliases: ['GroupName'],
    labels: {
      en: 'Tag group name', fr: 'Nom du groupe de tags',
      es: 'Nombre del grupo de etiquetas', de: 'Name der Tag-Gruppe',
      it: 'Nome del gruppo di tag', 'zh-CN': '标签组名称', ja: 'タググループ名'
    }
  }
]

/**
 * Nom canonique d'un jeton : replie les alias (compat e!Sankey `{Quantity}`,
 * `{UnitName}`, `{PercentProcessSource}`…) sur le jeton officiel. Rend null si
 * le jeton n'appartient pas au catalogue fourni.
 */
export function canonicalToken(token: string, catalog: Type_TemplateTokenDef[]): string | null {
  for (const def of catalog) {
    const name = def.token.slice(1, -1)
    if (token === name) return name
    if (def.aliases?.includes(token)) return name
  }
  return null
}

/** Libellé d'un jeton dans la langue active (repli anglais). */
export function templateTokenLabel(def: Type_TemplateTokenDef, language: string): string {
  const lang = language === 'zh-CN' ? 'zh-CN' : language.slice(0, 2)
  return def.labels[lang as keyof Type_TemplateTokenLabels] ?? def.labels.en
}
