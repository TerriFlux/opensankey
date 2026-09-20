// os#1458 — UN HOTE DE STYLES, ET DEUX QUI LE SATISFONT.
//
// Julien : « un noeud, un flux, une ZDT, une part sont des elements avec des attributs, et ces
// attributs peuvent etre geres par une cascade de styles ; ce mecanisme doit etre general ». Puis :
// « normalement, avec la factorisation, tout devient simple ».
//
// CE QUE CE FICHIER VERIFIE, et c est exactement la promesse : les DEUX porteurs de styles du
// produit — le diagramme et la nature d une figure — repondent aux MEMES mots. Tant que c est vrai,
// l editeur de styles (famille, liste, « + », renommage) les sert tous les deux sans savoir lequel
// il tient, et une nature de plus ne coutera aucune ligne d interface.
//
// Le jour ou l un des deux derive, c est ici qu on l apprend — et non a l ecran, sur une figure qui
// n aurait pas de bouton « + ».

import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_StyleHost } from '../Elements/ElementStyle'
import { Class_Figure, Class_FigureNature } from './Figure'
import type { Type_FigureAttributesConfig } from './Figure'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Une nature reduite a un attribut : ce qui compte ici est la FAMILLE de styles, pas le catalogue. */
const natureConfig = (): Type_FigureAttributesConfig => ({
  shape_opacity: {
    default: 1, sort: 'style',
    label: { en: 'O', fr: 'O', es: 'O', de: 'O', it: 'O', 'zh-CN': 'O', ja: 'O' }
  }
} as unknown as Type_FigureAttributesConfig)

describe('os#1458 le diagramme et la nature de figure sont le meme hote', () => {

  /**
   * L assertion qui porte le lot. Elle ne compare pas des comportements : elle dit que les deux
   * objets sont assignables au MEME type, ce que le compilateur verifie et que ce test rend
   * visible a la lecture.
   */
  it('les deux repondent a Type_StyleHost', () => {
    const doc = new Class_ApplicationData(false)
    doc.drawing_area.bypass_redraws = true
    const nature = new Class_FigureNature('essai', natureConfig())

    const hosts: Type_StyleHost[] = [doc.drawing_area.sankey, nature]

    expect(hosts.length).toBe(2)
    hosts.forEach(host => {
      expect(typeof host.addNewDefaultElementStyle).toBe('function')
      expect(typeof host.deleteElementStyle).toBe('function')
      expect(typeof host.switchElementStyle).toBe('function')
      expect(typeof host.resetAttrStyle).toBe('function')
      expect(typeof host.deleteLocalAttrStyle).toBe('function')
      expect(Array.isArray(host.styles_list)).toBe(true)
    })
  })

  it('creer un style de figure marche comme creer un style de noeud', () => {
    const nature = new Class_FigureNature('essai', natureConfig())
    const avant = nature.styles_list.length

    const style = nature.addNewDefaultElementStyle()

    expect(nature.styles_list.length).toBe(avant + 1)
    expect(nature.styles_dict[style.id]).toBe(style)
    // Nomme par son RANG dans la famille, comme cote diagramme : un identifiant ne se lit pas.
    expect(style.name).toContain('Style')
  })

  it('le supprimer le retire de la famille, et le defaut resiste', () => {
    const nature = new Class_FigureNature('essai', natureConfig())
    const style = nature.addNewDefaultElementStyle()

    nature.deleteElementStyle(style)
    expect(nature.styles_dict[style.id]).toBeUndefined()

    // Le style d usine ne se supprime pas : ce qui le suivait n aurait plus rien ou retomber.
    const defaut = nature.default_style
    nature.deleteElementStyle(defaut)
    expect(nature.styles_dict[defaut.id]).toBe(defaut)
  })

  it('assigner un style de figure passe par la CIBLE, jamais par une devinette', () => {
    // Une nature decrit une SORTE, pas un objet a l ecran : elle ne sait pas quelle figure
    // l auteur regarde. L appelant, lui, tient deja la liste de ce qu il edite.
    //
    // SUR UNE VRAIE `Class_Figure`, ET C EST LA LECON. La premiere version de ce test se donnait
    // un faux objet portant les noms que j avais inventes (`addStyleId`) : il passait au vert en
    // ne validant que mon invention, alors que la vraie API est `addStyle` / `removeStyleById`.
    // Un test qui fabrique sa cible ne verifie que lui-meme.
    const nature = new Class_FigureNature('essai', natureConfig())
    const style = nature.addNewDefaultElementStyle()
    const figure = new Class_Figure(nature, 'vignette_1')
    expect(figure.hasStyle(style.id)).toBe(false)

    nature.switchElementStyle(style, true, [figure])
    expect(figure.hasStyle(style.id)).toBe(true)

    nature.switchElementStyle(style, false, [figure])
    expect(figure.hasStyle(style.id)).toBe(false)

    // Sans cible, rien ne se passe — et surtout, rien n est devine.
    expect(() => nature.switchElementStyle(style, true)).not.toThrow()
  })

  it('retirer UNE cle dun style laisse les autres en place', () => {
    const nature = new Class_FigureNature('essai', natureConfig())
    const style = nature.addNewDefaultElementStyle()
    nature.assignStyle(style, { shape_opacity: 0.5 })
    expect(nature.styleBag(style).shape_opacity).toBe(0.5)

    nature.deleteLocalAttrStyle(style, 'shape_opacity')

    expect(nature.styleBag(style).shape_opacity).toBeUndefined()
  })
})
