import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Type_JSON } from '../types/Utils'

// ==================================================================================================
// os#1353 — PLACEMENT des noeuds en mode « echelle adaptee », sur le VRAI fichier CARTOFOB.
//
// Symptome (14/08, page publiee) : « le placement des noeuds a droite, c est n importe quoi ».
// Toute la chaine AVAL remontait au-dessus du haut du diagramme (jusqu a y = -652 px) alors que le
// runtime 1.1.8 tenait tous les noeuds dans la bande [0, 1585] du noeud-stock.
//
// CAUSE. Une option de page `position_mode` est appliquee a la DA COURANTE **et** a la DA MAITRE
// (os#1352). Or `setScaleAdaptedMode`, venant de l absolu, commit le coin courant comme nouveau
// centre de verite (`settleCenterAnchor` : centre := coin + hauteur/2). Sur la DA MAITRE d un
// document qui s ouvre sur une VUE, cette aire n a JAMAIS ete dessinee : les hauteurs de ses noeuds
// valent encore le plancher `shape_min_height` (3 px, les epaisseurs de flux ne sont calculees qu au
// dessin). Le settle remplacait donc les centres lus dans le fichier (format >= 1.1.5,
// `node_pos_is_center`) par « coin + 1,5 px ». Tout dessin ulterieur derive coin = centre - h/2 :
// chaque noeud remontait d environ une demi-hauteur, d autant plus haut qu il est gros. Les noeuds
// dont la hauteur ne vient pas d une bande de flux (le stock, plafonne par `maximum_node`) etaient
// epargnes — d ou l allure « l aval decroche » du defaut.
//
// Le correctif est le drapeau `Class_DrawingArea.has_been_laid_out` : le settle ne s applique qu a
// une aire deja mise en page (cf. `DisplayModes.settleCentersIfLaidOut`).
//
// Le fichier pese 9 Mo decompresses : il n est PAS commite. On le lit depuis le scratchpad, et le
// test se saute proprement s il est absent.
//   curl -s https://terriflux.com/portfolios/CARTOFOB/CARTOFOB.json.gz -o <scratchpad>/CARTOFOB.json.gz
// ==================================================================================================

const SCRATCHPAD = 'C:/Users/JULIEN~1/AppData/Local/Temp/claude/'
  + 'd--Dev-sankeyapp-dev-sankeyapplication/5e338cbd-20f6-4dfd-b5cf-226b1928b8c6/scratchpad'

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

const CARTOFOB = findCartofob()
const describeIf = CARTOFOB ? describe : describe.skip

/**
 * Position verticale (`y` du groupe de noeud dans le SVG) relevee sur la page publiee servie par le
 * runtime 1.1.8, vue « Toutes essences ». Piece a conviction : tous les noeuds tiennent dans la
 * bande [0, 1585] du noeud-stock.
 */
const V118: Record<string, number> = {
  BoisSurPied: 0,
  ProductionBiologique: 319.5,
  PertesDeRecolte: 761.8,
  BoisMort: 1031.5,
  Prelevements: 144.1,
  RecolteAnnuelle_2DBoisD_27Oeuvre: 23.8,
  RecolteAnnuelle_2DBoisD_27Industrie: 480.5,
  Scieries: 21.6,
  Connexes: 248.1,
  Sciages: 12.7,
  UsagesBoisD_27Industries: 414.2,
  BoisEnergie: 677.5,
}
const IDS = Object.keys(V118)

/** Ouvre le fichier comme une page publiee, avec ou sans le mode, et va sur la vue maitre. */
function openMaster(opts: { mode?: boolean, apply_now?: boolean } = {}): Class_DrawingArea {
  const app = new Class_ApplicationData(false)
  app.fromJSON(loadJSON(CARTOFOB as string) as never, {}, false)
  if (opts.mode !== false) {
    ;(app.publish_options as { position_mode: string | null }).position_mode = 'scale_adapted'
    app.applyPublishStateOptions()
  }
  app.setCurrentViewToMaster()
  if (opts.apply_now) {
    // Leve la suspension d ouverture (#369) : le mode est alors REELLEMENT applique, c est-a-dire
    // que le placement passe par `deriveScaleAdaptedCornersFromCenter` + `resolveScaleAdaptedOverlaps`
    // au lieu de la branche absolue. C est l etat du lecteur des qu il a navigue une fois.
    app.drawing_area.clearPositionModeSuspension()
    app.drawing_area.draw()
  }
  return app.drawing_area
}

const yOf = (da: Class_DrawingArea) =>
  Object.fromEntries(IDS.map(id => [id, da.sankey.nodes_dict[id]?.position_y]))

function table(da: Class_DrawingArea): string {
  return IDS.map(id => {
    const n = da.sankey.nodes_dict[id]
    return `  ${id.padEnd(38)} y=${n.position_y.toFixed(1).padStart(9)}`
      + ` h=${n.getShapeHeightToUse().toFixed(1).padStart(8)}`
      + ` centre=${(n.center_y ?? NaN).toFixed(1).padStart(9)}`
      + ` | 1.1.8=${V118[id].toFixed(1).padStart(8)}`
      + ` ecart=${(n.position_y - V118[id]).toFixed(1).padStart(9)}`
  }).join('\n')
}

/** Noeud le plus haut du diagramme, hors noeuds d echange (places au niveau de leur flux). */
function topOfDiagram(da: Class_DrawingArea): { id: string, y: number } {
  const echange = da.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
  let top = { id: '', y: Number.POSITIVE_INFINITY }
  da.sankey.visible_nodes_list.forEach(n => {
    if (!n.is_visible) return
    if (echange && n.hasGivenTag(echange)) return
    if (n.shape_position_type === 'relative') return
    if (n.position_y < top.y) top = { id: n.id, y: n.position_y }
  })
  return top
}

describeIf('os#1353 — placement des noeuds en echelle adaptee (CARTOFOB)', () => {
  jest.setTimeout(300000)

  /**
   * INVARIANT PERDU, formule en une phrase : poser le mode « echelle adaptee » ne deplace AUCUN
   * noeud. Le mode gouverne l ECHELLE ; le placement, lui, reste ancre sur les centres du fichier.
   * On le verifie en confrontant le meme document ouvert avec et sans le mode.
   */
  it('poser le mode ne deplace aucun noeud', () => {
    const sans = openMaster({ mode: false })
    const avec = openMaster()
    // eslint-disable-next-line no-console
    console.log('\n### mode ABSOLU (reference)\n' + table(sans)
      + '\n\n### mode ECHELLE ADAPTEE (arme par l option de page)\n' + table(avec) + '\n')
    const a = yOf(sans)
    const b = yOf(avec)
    IDS.forEach(id => expect(b[id]).toBeCloseTo(a[id] as number, 1))
  })

  /**
   * Le mode REELLEMENT applique (suspension d ouverture levee) : c est le chemin ou le placement
   * passe par `deriveScaleAdaptedCornersFromCenter` + `resolveScaleAdaptedOverlaps`. On le confronte
   * a la piece a conviction, le SVG servi par le runtime 1.1.8.
   *
   * Seul « Connexes » differe du mode absolu (248,1 contre 223,7 px) : c est l anti-chevauchement
   * par colonne qui le repousse sous « Sciages » — et c est bien la valeur de 1.1.8. Le mode
   * applique reproduit donc le rendu 1.1.8 au dixieme de pixel pres, sur les douze noeuds.
   */
  it('mode applique : le placement est celui du runtime 1.1.8', () => {
    const avec = openMaster({ apply_now: true })
    // eslint-disable-next-line no-console
    console.log('\n### mode ECHELLE ADAPTEE APPLIQUE\n' + table(avec) + '\n')
    const b = yOf(avec)
    IDS.forEach(id => expect(Math.abs((b[id] as number) - V118[id])).toBeLessThan(1))
  })

  /**
   * Le symptome tel que l utilisateur le voit : des noeuds AU-DESSUS du haut du diagramme. En 1.1.8
   * le plus haut des noeuds (hors echange) est le noeud-stock, a y = 0.
   */
  it('aucun noeud visible au-dessus du haut du diagramme', () => {
    for (const da of [openMaster(), openMaster({ apply_now: true })]) {
      const top = topOfDiagram(da)
      // eslint-disable-next-line no-console
      console.log(`   noeud le plus haut : ${top.id} a y=${top.y.toFixed(1)}`)
      expect(top.y).toBeGreaterThan(-1)
    }
  })

  /**
   * La cause, prise a la racine : les centres lus dans le fichier (`node_pos_is_center`) doivent
   * survivre a l application de l option de page. C est ce que le settle sur une aire jamais
   * dessinee detruisait.
   */
  it('les centres du fichier survivent a l option de page', () => {
    const app = new Class_ApplicationData(false)
    app.fromJSON(loadJSON(CARTOFOB as string) as never, {}, false)
    const master = app.master_drawing_area as Class_DrawingArea
    expect(master.has_been_laid_out).toBe(false)
    const before = Object.fromEntries(IDS.map(id => [id, master.sankey.nodes_dict[id].center_y]))
    ;(app.publish_options as { position_mode: string | null }).position_mode = 'scale_adapted'
    app.applyPublishStateOptions()
    IDS.forEach(id => {
      expect(master.sankey.nodes_dict[id].center_y).toBeCloseTo(before[id] as number, 3)
    })
  })
})
