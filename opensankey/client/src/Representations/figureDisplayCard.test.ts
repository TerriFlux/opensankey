// 26/09/2026 — UNE FIGURE A SA CARTE « AFFICHAGE », COMME LE DIAGRAMME.
//
// Julien, deux captures cote a cote — la carte « Affichage » du diagramme (Seuil d affichage :
// Flux, Lib., Noeud, Stock) et son seuil a lui, perdu au milieu des coordonnees d une couronne :
// « y a coordonnees mais pas affichage », « je veux quelque chose qui ressemble a ca ».
//
// LES COORDONNEES DISENT OU L ON SE PLACE — quel objet, quelle annee, quel niveau. L AFFICHAGE DIT
// CE QU ON MONTRE DE CET ENDROIT-LA : a partir de quelle taille une etiquette s ecrit. Le
// diagramme les separe depuis toujours, en deux cartes ; une figure les melangeait.
//
// ⚠️ ET LE NOM EST COURT. La carte fait 270 px : « Nommer les parts au-dessus de (% du tout) »
// mangeait le curseur et laissait une ligne tronquee, sans commande — Julien l a eue a l ecran
// (« ce machin-la qui fonctionne pas »). Le diagramme dit « Flux », « Lib. », « Noeud », « Stock »
// et met le sens dans l info-bulle. On fait pareil, avec SON mot.

import { figureControlsOf } from './figureControls'
import { registerAnalysisRepresentations } from './registerAnalysisRepresentations'
import { representation_registry } from './RepresentationRegistry'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

beforeEach(() => registerAnalysisRepresentations())

const couronne = () => (representation_registry.get('osp.repr.donut') as unknown as {
  attributes: object
}).attributes

const controles = (sorts: string[]) => figureControlsOf(
  couronne() as never, {} as never, sorts as never, 'fr'
) as unknown as { key: string, label: string, kind: string }[]

describe('la carte Affichage d une couronne', () => {

  it('LE CAS DE JULIEN : le seuil est dans AFFICHAGE, pas dans les coordonnees', () => {
    expect(controles(['display']).map(c => c.key)).toContain('labels_min_share')
    expect(controles(['navigation']).map(c => c.key)).not.toContain('labels_min_share')
  })

  it('LES COORDONNEES GARDENT LES LEURS : ou l on se place n a pas bouge', () => {
    // LA CONTRE-VERIFICATION QUI COMPTE : separer les deux cartes ne doit rien avoir emporte au
    // passage. Le niveau et le clic disent ou l on se place, ils restent.
    const cles = controles(['navigation']).map(c => c.key)

    expect(cles).toContain('levels_display')
    expect(cles).toContain('interaction_click')
  })

  it('SON NOM TIENT DANS LA CARTE, et son sens est dans l info-bulle', () => {
    const seuil = controles(['display']).find(c => c.key === 'labels_min_share')

    expect(seuil?.label).toBe('Lib.')
    expect(seuil?.label.length).toBeLessThan(12)
  })

  it('ET C EST UN CURSEUR, comme les quatre seuils du diagramme', () => {
    expect(controles(['display']).find(c => c.key === 'labels_min_share')?.kind).toBe('slider')
  })
})
