import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Type_JSON } from '../types/Utils'

// os#1351 — HARNAIS D'AUDIT du mode « échelle adaptée » sur le VRAI fichier CARTOFOB.
//
// Symptôme utilisateur (14/08, page publiée) : « le mode échelle adaptée ne marche plus du tout ».
// Le premier défaut trouvé (suspension d'ouverture qui ne surveillait que les datatags, corrigée
// par 96dcd9a5e) ne l'a pas résolu. Ce harnais fait tourner la VRAIE chaîne d'échelle de
// `drawElements` sur le VRAI diagramme, en simulant la navigation d'une essence à l'autre par la
// VRAIE API de vues, pour dire à quelle étape la promesse « hauteur rendue constante » se perd.
//
// CARTOFOB est le cas d'usage exact : ses vues sont des VIEW TAGS (une par essence : chêne, hêtre,
// douglas…), ses données sont ventilées par DATA TAG (une par région), et il porte
// `size_locked`/`font_size_locked`. Surtout, il porte DEUX autres régulateurs d'échelle qui
// s'appliquent APRÈS le mode (cf. `drawElements` ~l.1513-1533) :
//   - `scale_reference_by_viewtag` RENSEIGNÉ POUR LES 11 ESSENCES (un flux « Récolte annuelle bois
//     d'œuvre — <essence> » plafonné à 200 px) ;
//   - `maximum_node` = 1585 px.
//
// L'expérience décisive n'est donc pas « le mode écrit-il une échelle ? » mais « le mode
// CHANGE-T-IL QUELQUE CHOSE à ce que voit l'utilisateur ? ». D'où les quatre scénarios croisés
// ci-dessous (mode absolu / échelle adaptée) × (plafond par view tag présent / retiré).
//
// Le fichier pèse 9 Mo décompressés : il n'est PAS commité. On le lit depuis le scratchpad, et le
// test se saute proprement s'il est absent.

const SCRATCHPAD = 'C:/Users/JULIEN~1/AppData/Local/Temp/claude/'
  + 'd--Dev-sankeyapp-dev-sankeyapplication/5e338cbd-20f6-4dfd-b5cf-226b1928b8c6/scratchpad'

/**
 * Retrouve le fichier CARTOFOB. Variable d'environnement `CARTOFOB_JSON` prioritaire, sinon le
 * scratchpad de la session d'audit, en clair ou en .gz.
 *
 * Le retélécharger :
 *   curl -s https://terriflux.com/portfolios/CARTOFOB/CARTOFOB.json.gz -o <scratchpad>/CARTOFOB.json.gz
 */
function findCartofob(): string | null {
  const candidates = [
    process.env.CARTOFOB_JSON,
    path.join(SCRATCHPAD, 'CARTOFOB.json'),
    path.join(SCRATCHPAD, 'CARTOFOB.json.gz'),
  ].filter((p): p is string => !!p)
  for (const c of candidates) if (fs.existsSync(c)) return c
  return null
}

function loadJSON(abs: string): Type_JSON {
  const buf = fs.readFileSync(abs)
  const text = abs.endsWith('.gz') ? zlib.gunzipSync(buf).toString('utf-8') : buf.toString('utf-8')
  return JSON.parse(text) as Type_JSON
}

/** Métriques relevées à chaque étape de navigation. */
type Frame = {
  label: string
  effective_mode: string
  scale: number
  magnitude: number
  /** Hauteur rendue ATTENDUE du diagramme : grandeur ÷ échelle × 100 (range de `_scaleValueToPx`). */
  height_px: number
  /** Hauteur rendue MESURÉE : colonne la plus haute, en px réellement dessinés. */
  measured_px: number
  visible_nodes: number
  /** Échelle juste après `applyAdaptedScale`, AVANT les surcharges (view tag, maximum_node). */
  scale_after_adapted: number
  /** Échelle après le plafond par view tag, AVANT le plafond `maximum_node`. */
  scale_after_viewtag: number
  /** Hauteur px du nœud le plus haut (ce que plafonne `maximum_node`). */
  tallest_node_px: number
  /** Étiquette de vue servant de clé au plafond d'épaisseur (undefined = pas de plafond). */
  scale_ref_viewtag: string | undefined
  /**
   * Épaisseur rendue (px) du flux « Récolte annuelle bois d'œuvre — <essence> », celui que le
   * fichier désigne comme référence d'épaisseur du view tag courant. C'est la grandeur que
   * l'ANCIEN mode « échelle adaptée » (référence = un ÉLÉMENT désigné) tenait constante.
   */
  ref_link_px: number
  /**
   * Hauteur rendue (px) du nœud-stock « Bois sur pied », que le fichier désigne comme ÉLÉMENT DE
   * RÉFÉRENCE du mode (`shape_is_reference_stock`, dans `nodes.BoisSurPied.local`). C'est
   * EXACTEMENT ce que l'ANCIEN mode « échelle adaptée » (≤ 1.1.8) tenait constant.
   */
  bois_px: number
  bois_visible: boolean
  /** Colonne (`position_u`) du nœud de référence, et colonne dimensionnante retenue par le mode. */
  bois_u: number
  tallest_u: number
}

/** Nœud désigné comme référence de stock par le fichier de Julien. */
const REF_STOCK_ID = 'BoisSurPied'

/** Id du flux de référence d'épaisseur du view tag courant, tel que le porte le fichier. */
const REF_LINK_OF = (essence: string) =>
  'International---RecolteAnnuelle_2DBoisD_27Oeuvre_2D' + ({
    chene: 'Chene', hetre: 'Hetre', douglas: 'Douglas', peuplier: 'Peuplier',
    'sapin-epicea': 'Sapin_2Depicea',
  }[essence] ?? essence)

/**
 * Rejoue la CHAÎNE D'ÉCHELLE de `DrawingArea.drawElements` (cf. DrawingArea.tsx ~l.1509-1533),
 * verbatim et dans l'ordre, sans le rendu SVG : mode effectif → `applyAdaptedScale` (ou capture
 * si le mode est seulement ARMÉ) → `applyViewTagScaleReference` → `applyMaximumNodeScale`.
 *
 * On relève l'échelle ENTRE chaque étape : c'est là que se joue la question « le mode écrit-il
 * l'échelle, et cette écriture survit-elle aux deux plafonds qui s'appliquent par-dessus ? ».
 */
function frame(da: Class_DrawingArea, label: string): Frame {
  const mode = da.effective_position_mode
  if (mode === 'scale_adapted') {
    da.nodePositioning.applyAdaptedScale()
  } else if (da.is_position_mode_suspended
    && da.sankey.styles_dict['default'].shape_position_type === 'scale_adapted') {
    da.nodePositioning.captureScaleReference()
  }
  const scale_after_adapted = da._scale
  da.applyViewTagScaleReference()
  const scale_after_viewtag = da._scale
  da.applyMaximumNodeScale()

  const magnitude = da.nodePositioning.diagramMagnitude()
  const scale = da._scale
  let tallest_node_px = 0
  da.sankey.visible_nodes_list.forEach(n => {
    const h = n.getNaturalShapeHeight()
    if (h > tallest_node_px) tallest_node_px = h
  })

  // Hauteur MESURÉE : somme des hauteurs px de la colonne la plus chargée, mêmes conventions de
  // colonne que `diagramMagnitude` (groupage par position_u, hors `echange`/relatifs/cadres tied).
  const echange = da.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
  const columns = new Map<number, number>()
  let visible = 0
  da.sankey.visible_nodes_list.forEach(n => {
    if (!n.is_visible) return
    visible++
    if (echange && n.hasGivenTag(echange)) return
    if (n.shape_position_type === 'relative') return
    if (n.tied_to_nodes && n.attached_node.length > 0) return
    columns.set(n.position_u, (columns.get(n.position_u) ?? 0) + n.getShapeHeightToUse())
  })
  let measured_px = 0
  let tallest_u = -1
  columns.forEach((v, u) => { if (v > measured_px) { measured_px = v; tallest_u = u } })

  // Élément de RÉFÉRENCE du fichier (ancien régime) : le nœud-stock « Bois sur pied ».
  const bois = da.sankey.nodes_dict[REF_STOCK_ID]
  const bois_visible = !!bois?.is_visible
  const bois_px = bois && bois_visible ? bois.getShapeHeightToUse() : 0
  const bois_u = bois ? bois.position_u : -1

  // Épaisseur rendue du flux de référence d'épaisseur du view tag courant (px), même convention
  // que `Class_ScaleOverrides.applyViewTagScaleReference` : v / (échelle × facteur local) × 100.
  const vt = da.sankey.current_scale_reference_viewtag_id
  const ref_id = vt ? REF_LINK_OF(vt) : undefined
  const ref_link = ref_id ? da.sankey.links_dict[ref_id] : undefined
  const ref_v = ref_link ? Math.abs(ref_link.valueCurrent ?? 0) : 0
  const ref_link_px = (ref_link && scale > 0)
    ? ref_v / (scale * (ref_link.shape_local_link_scale || 1)) * 100
    : 0
  if (process.env.DEBUG_REF_LINK && vt) {
    // eslint-disable-next-line no-console
    console.log(`   [ref] ${label} vt=${vt} id=${ref_id} trouvé=${!!ref_link} `
      + `valeur=${ref_v} visible=${ref_link?.is_visible}`)
  }

  return {
    ref_link_px,
    bois_px,
    bois_visible,
    bois_u,
    tallest_u,
    label,
    effective_mode: mode,
    scale,
    magnitude,
    height_px: scale > 0 ? magnitude / scale * 100 : 0,
    measured_px,
    visible_nodes: visible,
    scale_after_adapted,
    scale_after_viewtag,
    tallest_node_px,
    scale_ref_viewtag: da.sankey.current_scale_reference_viewtag_id,
  }
}

function table(frames: Frame[]): string {
  const head = ['étape', 'mode effectif', 'échelle', 'grandeur', 'H diagramme',
    'BoisSurPied px', 'col. réf', 'col. dimensionnante', 'nœuds']
  const rows = frames.map(f => [
    f.label,
    f.effective_mode,
    f.scale.toPrecision(6),
    f.magnitude.toPrecision(6),
    f.measured_px.toFixed(1),
    f.bois_visible ? f.bois_px.toFixed(1) : 'invisible',
    String(f.bois_u),
    String(f.tallest_u),
    String(f.visible_nodes),
  ])
  const w = head.map((h, i) => Math.max(h.length, ...rows.map(r => r[i].length)))
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(w[i])).join(' | ')
  return [line(head), w.map(n => '-'.repeat(n)).join('-+-'), ...rows.map(line)].join('\n')
}

const CARTOFOB = findCartofob()
const describeIf = CARTOFOB ? describe : describe.skip
const ESSENCES = ['chene', 'hetre', 'douglas', 'peuplier', 'sapin-epicea']

type Scenario = {
  mode: 'absolute' | 'scale_adapted'
  strip_ceiling: boolean
  /** os#1352 — régime de référence du mode. `diagram` = sa#384 (défaut), `element` = régime ≤ 1.1.8. */
  reference?: 'diagram' | 'element'
}

/**
 * Charge CARTOFOB, pose le mode demandé comme le fait une page publiée
 * (`publish_settings.position_mode` → `applyPublishOptions` → `setScaleAdaptedMode`), puis navigue
 * d'une essence à l'autre par la VRAIE API de vues.
 *
 * Deux précautions dictées par le code réel :
 *  - la DA est REMPLACÉE au switch de vue (les vues d'essence sont `is_light` et réutilisent la DA
 *    MAÎTRE) : on la relit après chaque navigation ;
 *  - le mode de position vit dans le style 'default' de CHAQUE DA. On le pose aussi sur la DA
 *    maître, sinon `applyViewChange` constate un écart et rappelle `setScaleAdaptedMode()`, qui
 *    RÉ-ARME la suspension — le mode sauterait une frame à chaque aller-retour avec la vue lourde
 *    (défaut réel, isolé dans le test dédié plus bas ; ici on veut mesurer le mode, pas ce défaut).
 */
function runScenario({ mode, strip_ceiling, reference }: Scenario): Frame[] {
  const json = loadJSON(CARTOFOB as string) as Record<string, unknown>
  if (strip_ceiling) {
    delete json.scale_reference_by_viewtag
    const views = json.views as Record<string, Record<string, unknown>> | undefined
    if (views) Object.values(views).forEach(v => { delete v.scale_reference_by_viewtag })
  }
  const app = new Class_ApplicationData(false)
  app.fromJSON(json as never, {}, false)

  const setMode = (da: Class_DrawingArea | undefined) => {
    if (da) da.sankey.styles_dict['default'].shape_position_type = mode
  }
  setMode(app.drawing_area)
  setMode(app.master_drawing_area)
  // os#1352 — le régime se pose AVANT le mode (c'est lui qui décide de la grandeur capturée), et
  // sur les DEUX aires : une vue d'essence est `is_light` et réutilise la DA maître.
  if (reference) {
    app.drawing_area.scale_adapted_reference = reference
    if (app.master_drawing_area) app.master_drawing_area.scale_adapted_reference = reference
  }
  if (mode === 'scale_adapted') {
    // Chemin exact d'une page publiée (cf. ApplicationData.applyPublishOptions).
    app.drawing_area.setScaleAdaptedMode()
  }

  const frames: Frame[] = [frame(app.drawing_area, 'ouverture')]
  for (const e of ESSENCES) {
    app.setCurrentView(`vt__essence__${e}`)
    frames.push(frame(app.drawing_area, `vt:${e}`))
  }
  return frames
}

/** Rapport min/max/rapport des hauteurs rendues sur les étapes de navigation. */
function spreadOf(frames: Frame[]): { min: number, max: number, ratio: number } {
  const h = frames.filter(f => f.label.startsWith('vt:')).map(f => f.measured_px)
  const min = Math.min(...h)
  const max = Math.max(...h)
  return { min, max, ratio: max / min }
}

describeIf('os#1351 — « échelle adaptée » sur le vrai CARTOFOB', () => {
  jest.setTimeout(180000)

  it('compare les 4 régimes croisés (mode × plafond par view tag)', () => {
    const results: { name: string, frames: Frame[] }[] = [
      { name: 'A. absolu, plafond view tag PRÉSENT (fichier tel quel)', frames: runScenario({ mode: 'absolute', strip_ceiling: false }) },
      { name: 'B. ÉCHELLE ADAPTÉE, plafond view tag PRÉSENT (ce que fait l\'utilisateur)', frames: runScenario({ mode: 'scale_adapted', strip_ceiling: false }) },
      { name: 'C. absolu, plafond view tag RETIRÉ', frames: runScenario({ mode: 'absolute', strip_ceiling: true }) },
      { name: 'D. ÉCHELLE ADAPTÉE, plafond view tag RETIRÉ', frames: runScenario({ mode: 'scale_adapted', strip_ceiling: true }) },
    ]
    for (const r of results) {
      const s = spreadOf(r.frames)
      // eslint-disable-next-line no-console
      console.log(`\n### ${r.name}\n${table(r.frames)}\n`
        + `   → hauteur rendue entre essences : min=${s.min.toFixed(1)} px, `
        + `max=${s.max.toFixed(1)} px, rapport=${s.ratio.toFixed(2)}`)
    }
    const [A, B, C, D] = results.map(r => spreadOf(r.frames))
    // eslint-disable-next-line no-console
    console.log('\n===== VERDICT =====\n'
      + `A absolu + plafond      : rapport ${A.ratio.toFixed(2)}\n`
      + `B adaptée + plafond     : rapport ${B.ratio.toFixed(2)}\n`
      + `C absolu sans plafond   : rapport ${C.ratio.toFixed(2)}\n`
      + `D adaptée sans plafond  : rapport ${D.ratio.toFixed(2)}\n`
      + `Le mode change-t-il quelque chose AVEC le plafond ? ${A.ratio.toFixed(4) !== B.ratio.toFixed(4) ? 'OUI' : 'NON — A et B identiques'}\n`
      + `Le mode change-t-il quelque chose SANS le plafond ? ${C.ratio.toFixed(4) !== D.ratio.toFixed(4) ? 'OUI' : 'NON — C et D identiques'}\n`)

    // Sans le plafond par view tag, le mode doit tenir sa promesse : hauteur rendue constante.
    expect(D.ratio).toBeLessThan(1.05)
    // Et il doit apporter quelque chose que l'absolu n'apporte pas.
    expect(C.ratio).toBeGreaterThan(1.05)

    // AVANT/APRÈS du point de vue de l'utilisateur. L'ANCIEN mode (≤ 1.1.8) tenait constante la
    // taille rendue de l'ÉLÉMENT DE RÉFÉRENCE désigné dans le fichier — ici le nœud-stock
    // « Bois sur pied » (`shape_is_reference_stock`). Le NOUVEAU tient constante la hauteur de la
    // COLONNE LA PLUS HAUTE. Les deux ne coïncident que si le nœud de référence est justement
    // dans cette colonne et en garde la même part d'une vue à l'autre.
    const adapted = results[1].frames.filter(f => f.label.startsWith('vt:'))
    const bois = adapted.map(f => f.bois_px)
    const bois_ratio = Math.max(...bois) / Math.min(...bois)
    // eslint-disable-next-line no-console
    console.log('\n===== AVANT / APRÈS, mode « échelle adaptée » actif =====\n'
      + 'Ce que le NOUVEAU régime tient constant — hauteur de la colonne la plus haute :\n'
      + adapted.map(f => `  ${f.label.padEnd(16)} ${f.measured_px.toFixed(1)} px  (colonne u=${f.tallest_u})`).join('\n')
      + `\n  → rapport max/min = ${spreadOf(results[1].frames).ratio.toFixed(2)}\n\n`
      + 'Ce que l\'ANCIEN régime tenait constant — nœud-stock de référence « Bois sur pied »\n'
      + `(colonne u=${adapted[0].bois_u}, désigné par shape_is_reference_stock) :\n`
      + adapted.map(f => `  ${f.label.padEnd(16)} ${f.bois_visible ? f.bois_px.toFixed(1) + ' px' : 'INVISIBLE'}`).join('\n')
      + `\n  → rapport max/min = ${bois_ratio.toFixed(2)}`
      + (bois_ratio > 1.05
        ? '  ← N\'EST PLUS TENU : c\'est exactement le « ça ne fait plus rien » de l\'utilisateur'
        : '  (encore tenu)') + '\n')
  })

  /**
   * os#1352 — LES DEUX RÉGIMES SUR LE MÊME DOCUMENT.
   *
   * CARTOFOB désigne le nœud-stock « Bois sur pied » comme élément de référence
   * (`shape_is_reference_stock`, dans `nodes.BoisSurPied.local`). Ce nœud est INVISIBLE dans
   * chaque vue d'essence : c'est son CORRESPONDANT de vue qui porte la valeur, et seul le régime
   * `element` sait aller le chercher (`referenceViewValue`). Le régime `diagram`, lui, se cale sur
   * la colonne la plus haute — laquelle change même d'identité d'une vue à l'autre (u=4 partout,
   * u=9 pour le peuplier), ce qui est précisément ce que l'utilisateur constate comme « l'algo est
   * complètement différent de ce que c'était avant ».
   */
  it('os#1352 — régimes `diagram` et `element` comparés sur le même document', () => {
    const diagram = runScenario({ mode: 'scale_adapted', strip_ceiling: false, reference: 'diagram' })
      .filter(f => f.label.startsWith('vt:'))
    const element = runScenario({ mode: 'scale_adapted', strip_ceiling: false, reference: 'element' })
      .filter(f => f.label.startsWith('vt:'))

    const ratio = (xs: number[]) => Math.max(...xs) / Math.min(...xs)
    // eslint-disable-next-line no-console
    console.log('\n===== os#1352 — LES DEUX RÉGIMES SUR CARTOFOB =====\n'
      + 'régime `diagram` (défaut sa#384) — colonne la plus haute :\n'
      + diagram.map(f => `  ${f.label.padEnd(16)} échelle=${f.scale.toPrecision(6)}`
        + `  H=${f.measured_px.toFixed(1)} px  (colonne u=${f.tallest_u})`).join('\n')
      + `\n  → H max/min = ${ratio(diagram.map(f => f.measured_px)).toFixed(2)}\n\n`
      + 'régime `element` (rétabli, régime ≤ 1.1.8) — stock « Bois sur pied » :\n'
      + element.map(f => `  ${f.label.padEnd(16)} échelle=${f.scale.toPrecision(6)}`
        + `  H=${f.measured_px.toFixed(1)} px  (colonne u=${f.tallest_u})`).join('\n')
      + `\n  → H max/min = ${ratio(element.map(f => f.measured_px)).toFixed(2)}\n\n`
      + 'échelles comparées, essence par essence :\n'
      + diagram.map((f, i) => `  ${f.label.padEnd(16)} diagram=${f.scale.toPrecision(6)}`
        + `  element=${element[i].scale.toPrecision(6)}`
        + (Math.abs(f.scale - element[i].scale) / f.scale > 1e-6 ? '   ← DIFFÈRENT' : '   (identique)')
      ).join('\n') + '\n')

    // Les deux régimes doivent produire des échelles DIFFÉRENTES : c'est toute la raison d'être
    // du rétablissement. S'ils coïncidaient, le régime `element` serait sans objet.
    const differs = diagram.some((f, i) => Math.abs(f.scale - element[i].scale) / f.scale > 1e-6)
    expect(differs).toBe(true)
    // Le régime `element` doit rester STABLE (pas de division par zéro, pas d'échelle aberrante).
    expect(element.every(f => isFinite(f.scale) && f.scale > 0)).toBe(true)
  })

  /**
   * Défaut isolé : sur le chemin RÉEL d'une page publiée, `applyPublishOptions` ne pose le mode
   * que sur la DA COURANTE (la vue ouverte, ici la vue LOURDE `view_noo1b`). Les vues d'essence
   * sont `is_light` et réutilisent la DA MAÎTRE, dont le style est resté `absolute` :
   * `applyViewChange` constate l'écart et rappelle `setScaleAdaptedMode()`, qui RÉ-ARME la
   * suspension #369. La frame de cette navigation est donc dessinée en ABSOLU.
   */
  it('chemin réel d\'une page publiée : la 1re navigation est perdue à ré-armer le mode', () => {
    const app = new Class_ApplicationData(false)
    app.fromJSON(loadJSON(CARTOFOB as string) as never, {}, false)
    // Exactement ce que fait `applyPublishOptions` pour `publish_settings.position_mode`.
    app.drawing_area.setScaleAdaptedMode()
    const master_mode_before = app.master_drawing_area?.sankey.styles_dict['default'].shape_position_type

    const modes: string[] = []
    for (const e of ESSENCES) {
      app.setCurrentView(`vt__essence__${e}`)
      modes.push(frame(app.drawing_area, `vt:${e}`).effective_mode)
    }
    // eslint-disable-next-line no-console
    console.log('\n===== CHEMIN RÉEL D\'UNE PAGE PUBLIÉE =====\n'
      + `mode du style de la DA MAÎTRE après setScaleAdaptedMode() sur la vue ouverte : ${master_mode_before}\n`
      + `mode EFFECTIF à chaque navigation : ${modes.join(', ')}\n`)

    // La 1re navigation est dessinée en absolu (ré-armement), les suivantes appliquent le mode.
    expect(modes[0]).toBe('absolute')
    expect(modes.slice(1).every(m => m === 'scale_adapted')).toBe(true)
  })
})
