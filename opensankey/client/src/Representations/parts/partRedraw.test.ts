// os#1459 — REGLER UN ATTRIBUT DE PART DEMANDE UN REDESSIN.
//
// Julien, DEUX FOIS : « si on change les attributs ce n est pas agissant », puis « les attributs ne
// sont toujours pas agissants sur les parts ». La seconde fois etait de ma faute.
//
// J avais surcharge `draw()`. Or UN SETTER D ATTRIBUT N APPELLE JAMAIS `draw()` : il appelle les
// ACTIONS DECLAREES a cote de l attribut — `drawShape`, `drawNameLabel`, `drawValueLabel`… (cf.
// `createDynamicProperties` : `attribute.actions.forEach(...)`). Ma porte n etait jamais franchie,
// et le premier correctif n a rien change a l ecran.
//
// CE FICHIER TESTE LA VRAIE PORTE : on ecrit un attribut comme l inspecteur l ecrit, et on regarde
// si le redessin est demande. Pas `draw()` appele a la main — ce serait refaire l erreur.

import { Class_Workspace } from '../../types/Workspace'
import { DRAW_TOPIC } from '../../types/EventBus'
import { buildParts } from './buildParts'
import type { Type_PartInput } from './buildParts'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const inputs = (): Type_PartInput[] => [
  { id: 'a', label: 'A', value: 3 },
  { id: 'b', label: 'B', value: 7 }
]

const buildScene = () => {
  const ws = new Class_Workspace(false)
  const source = ws.createDocument()
  source.drawing_area.bypass_redraws = true
  let asked = 0
  source.menu_configuration.subscribe(DRAW_TOPIC, () => { asked++ })
  const parts = buildParts(source, inputs())
  return { source, parts, asked: () => asked }
}

describe('os#1459 ecrire un attribut de part demande le redessin de sa figure', () => {

  it('la FORME : une couleur posee demande un redessin', () => {
    const { parts, asked } = buildScene()
    const avant = asked()

    parts.by_id['a'].shape_color = '#123456'

    expect(asked()).toBeGreaterThan(avant)
  })

  it('le LIBELLE : une taille de police aussi', () => {
    // Deux familles differentes, donc deux ACTIONS differentes du catalogue. Tester une seule
    // laisserait passer une porte oubliee — c est exactement ce qui vient d arriver.
    const { parts, asked } = buildScene()
    const avant = asked()

    parts.by_id['a'].name_label_font_size = 22

    expect(asked()).toBeGreaterThan(avant)
  })

  it('la VALEUR : la montrer ou la cacher aussi', () => {
    const { parts, asked } = buildScene()
    const avant = asked()

    parts.by_id['a'].value_label_is_visible = true

    expect(asked()).toBeGreaterThan(avant)
  })

  it('CONSTRUIRE les parts ne demande aucun redessin', () => {
    // La contre-epreuve, et elle garde contre une boucle : si la construction demandait un
    // redessin, le redessin reconstruirait, qui redemanderait — sans fin.
    const { source, asked } = buildScene()
    const avant = asked()

    buildParts(source, inputs())

    expect(asked()).toBe(avant)
  })

  it('REPRENDRE les reglages au rebatissage nen demande pas non plus', () => {
    // `restoreStorage` ecrit le sac SANS passer par les setters dynamiques : c est ce qui ferme
    // la boucle. Si un jour on repasse par `copyAttrFrom`, ce test tombe et dit pourquoi.
    const { source, parts, asked } = buildScene()
    parts.by_id['a'].shape_color = '#123456'
    const avant = asked()

    const second = buildParts(source, inputs(), parts)

    expect(second.by_id['a'].shape_color).toBe('#123456')
    expect(asked()).toBe(avant)
  })
})
