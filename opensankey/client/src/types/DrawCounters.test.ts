import { Class_ApplicationData } from './ApplicationData'
import {
  startDrawCounters,
  stopDrawCounters,
  drawCountersReport,
  beginDrawPass,
  endDrawPass,
  countLinkDraw,
  countArrowFan,
} from './DrawCounters'

// ==================================================================================================
// os#1376 (jalon 80) — Garde-fou sur le NOMBRE de dessins.
//
// Tout ce qui a été gagné sur os#1372 (bascule de dataTag 1 028 -> 474 ms) tient a une seule
// chose : le travail n'est plus refait. Rien dans le code n'empeche qu'il revienne — un
// `link.draw()` ajoute dans une boucle de mise en page, et on repart aux dix dessins par flux
// mesures au chargement de SOCLE Cereales.
//
// Ce fichier verrouille donc une quantite, pas une duree. La duree ment : sur la machine de
// mesure, la mediane derive de 30 % entre deux sessions, et le meme changement y a
// successivement « prouve » -31 %, +16 % et +36 %. Le nombre de dessins, lui, est un entier.
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * Diagramme de reference : trois colonnes, deux nœuds intermediaires, six flux — assez pour
 * que chaque flux ait une source ET une cible qui le repositionnent, ce qui est precisement le
 * mecanisme de re-dessin qu'on surveille (`Node.applyPosition` -> `_drawLinks`).
 */
function buildReferenceDiagram() {
  const app = new Class_ApplicationData(false)
  const { drawing_area } = app
  const { sankey } = drawing_area

  const amont_a = sankey.addNewNode('amont_a', 'Amont A')
  const amont_b = sankey.addNewNode('amont_b', 'Amont B')
  const pivot_h = sankey.addNewNode('pivot_h', 'Pivot haut')
  const pivot_b = sankey.addNewNode('pivot_b', 'Pivot bas')
  const aval = sankey.addNewNode('aval', 'Aval')
  amont_a.setPosXY(0, 0)
  amont_b.setPosXY(0, 300)
  pivot_h.setPosXY(400, 50)
  pivot_b.setPosXY(400, 350)
  aval.setPosXY(800, 200)

  const links = [
    sankey.addNewLink(amont_a, pivot_h),
    sankey.addNewLink(amont_a, pivot_b),
    sankey.addNewLink(amont_b, pivot_h),
    sankey.addNewLink(amont_b, pivot_b),
    sankey.addNewLink(pivot_h, aval),
    sankey.addNewLink(pivot_b, aval),
  ]
  links.forEach((link, i) => { link.valueCurrent = 10 * (i + 1) })

  return { app, drawing_area, links }
}

describe('os#1376 — comptage des passes et des dessins', () => {
  afterEach(() => stopDrawCounters())

  it('ne compte rien tant que la mesure n a pas demarre', () => {
    beginDrawPass()
    countLinkDraw('flux')
    endDrawPass()
    startDrawCounters()
    expect(drawCountersReport()).toEqual({
      passes: 0, link_draws: 0, max_draws_per_link: 0, links_drawn_twice: [],
      arrow_fans: 0, max_fans_per_node: 0, pass_origins: [],
      draws_per_pass: [], fans_per_pass: [],
    })
  })

  it('compte une passe par appel de premier niveau', () => {
    startDrawCounters()
    beginDrawPass(); endDrawPass()
    beginDrawPass(); endDrawPass()
    expect(drawCountersReport().passes).toBe(2)
  })

  it('une passe imbriquee ne compte pas pour une passe de plus', () => {
    startDrawCounters()
    beginDrawPass()
    beginDrawPass(); endDrawPass()
    endDrawPass()
    expect(drawCountersReport().passes).toBe(1)
  })

  it('le compte par flux est celui d une passe, pas celui de la mesure entiere', () => {
    startDrawCounters()
    // Un flux dessine une fois dans chacune des trois passes : normal (trois passes, c est
    // le sujet d os#1375). Rien a signaler ici.
    for (let i = 0; i < 3; i++) { beginDrawPass(); countLinkDraw('flux'); endDrawPass() }
    const report = drawCountersReport()
    expect(report.link_draws).toBe(3)
    expect(report.max_draws_per_link).toBe(1)
    expect(report.links_drawn_twice).toEqual([])
  })

  it('signale le flux dessine deux fois dans la MEME passe', () => {
    startDrawCounters()
    beginDrawPass()
    countLinkDraw('refait'); countLinkDraw('refait'); countLinkDraw('propre')
    endDrawPass()
    const report = drawCountersReport()
    expect(report.max_draws_per_link).toBe(2)
    expect(report.links_drawn_twice).toEqual(['refait'])
  })

  it('rapporte la passe en cours, sans attendre sa fermeture', () => {
    startDrawCounters()
    beginDrawPass()
    countLinkDraw('flux'); countLinkDraw('flux')
    // Lire les compteurs au milieu d un dessin — le cas de la console — doit montrer ce qui
    // vient de se passer, pas seulement les passes deja refermees.
    expect(drawCountersReport().max_draws_per_link).toBe(2)
    endDrawPass()
  })

  it('note qui a declenche chaque passe', () => {
    startDrawCounters()
    beginDrawPass(); endDrawPass()
    beginDrawPass()
    beginDrawPass(); endDrawPass()   // imbriquee : pas une passe de plus, pas une origine de plus
    endDrawPass()
    const origins = drawCountersReport().pass_origins
    // Une origine par passe de premier niveau, dans l ordre. Se compter est une chose, savoir QUI
    // appelle en est une autre : c est ce qui a permis d attribuer les dessins de flux.
    expect(origins).toHaveLength(2)
    expect(origins.every(o => typeof o === 'string')).toBe(true)
  })

  it('rend compte de ce qu a coute CHAQUE passe, pas seulement du total', () => {
    startDrawCounters()
    // Une passe qui ne dessine rien — un diagramme encore vide — ne coute rien, et la supprimer
    // ne gagnerait rien. Le total seul ne permet pas de le voir.
    beginDrawPass(); endDrawPass()
    beginDrawPass()
    countLinkDraw('a'); countLinkDraw('b'); countArrowFan('n')
    endDrawPass()
    const report = drawCountersReport()
    expect(report.draws_per_pass).toEqual([0, 2])
    expect(report.fans_per_pass).toEqual([0, 1])
    // Pas de passe fantome : `closeCurrentPass` court a l ouverture ET a la fermeture.
    expect(report.draws_per_pass).toHaveLength(report.passes)
  })

  it('compte les eventails de pointes par nœud et par passe', () => {
    startDrawCounters()
    // os#1374 — un nœud dont l eventail est recalcule a chaque flux de son cote : c est le
    // travail refait qu on surveille. Mesure browser avant le correctif, au chargement de SOCLE
    // Cereales : 1823 eventails pour 1823 flux, 72 recalculs pour le pire nœud.
    beginDrawPass()
    countArrowFan('noeud_charge'); countArrowFan('noeud_charge'); countArrowFan('noeud_calme')
    endDrawPass()
    beginDrawPass()
    countArrowFan('noeud_charge')
    endDrawPass()
    const report = drawCountersReport()
    expect(report.arrow_fans).toBe(4)
    // Un eventail par passe est le regime normal ; deux dans la MEME passe est le defaut.
    expect(report.max_fans_per_node).toBe(2)
  })

  it('un eventail par nœud et par passe ne signale rien', () => {
    startDrawCounters()
    for (let i = 0; i < 3; i++) { beginDrawPass(); countArrowFan('noeud'); endDrawPass() }
    const report = drawCountersReport()
    expect(report.arrow_fans).toBe(3)
    expect(report.max_fans_per_node).toBe(1)
  })

  it('une passe qui jette ne laisse pas la profondeur en l air', () => {
    startDrawCounters()
    const { drawing_area } = buildReferenceDiagram()
    jest.spyOn(drawing_area, 'reorganizeIOOnDataSelectionChange')
      .mockImplementation(() => { throw new Error('boum') })
    expect(() => drawing_area.drawElements()).toThrow('boum')
    // Sans le try/finally, la passe suivante serait comptee comme imbriquee et perdue.
    beginDrawPass(); endDrawPass()
    expect(drawCountersReport().passes).toBe(2)
  })
})

describe('os#1376 — garde-fou de non-regression sur le dessin d un diagramme', () => {
  afterEach(() => stopDrawCounters())

  it('un dessin complet est UNE passe', () => {
    const { drawing_area } = buildReferenceDiagram()
    startDrawCounters()
    drawing_area.draw()
    expect(drawCountersReport().passes).toBe(1)
  })

  it('aucun flux n est trace plus de fois que le compte admis dans une passe', () => {
    const { drawing_area, links } = buildReferenceDiagram()
    startDrawCounters()
    drawing_area.draw()
    const report = drawCountersReport()

    // ============================================================================================
    // CLIQUET. La cible du jalon 80 est 1 — un flux trace une fois par passe — et os#1373 vient
    // de l atteindre en separant les deux temps du dessin : toutes les ancres, puis le trait.
    //
    // Avant os#1373 cette constante valait 2 : chaque flux etait trace une fois par sa source et
    // une fois par sa cible, meme pile d appel — `Sankey._drawNodesJoin` -> `Node.draw` ->
    // `applyPosition` -> `_drawLinks` -> `updateLinksPositions` -> `link.draw()`. Sur SOCLE
    // Cereales ce doublon valait 16 407 dessins sur 18 230.
    //
    // Ce test se lit dans les DEUX sens :
    //  - un chiffre PLUS HAUT est une regression — du travail refait vient d etre reintroduit ;
    //  - un chiffre PLUS BAS est le but poursuivi — baisser la constante dans le meme commit
    //    fait partie du lot qui l a obtenu.
    // ============================================================================================
    const DESSINS_PAR_FLUX_ET_PAR_PASSE = 1

    expect(report.max_draws_per_link).toBe(DESSINS_PAR_FLUX_ET_PAR_PASSE)
    expect(report.link_draws).toBe(links.length * DESSINS_PAR_FLUX_ET_PAR_PASSE)
    // Plus aucun flux trace deux fois dans la meme passe : c est la definition du but atteint.
    expect(report.links_drawn_twice).toEqual([])
  })
})
