// os#1472 — CE QUI BRANCHE UNE MODALE UNIQUE VIT SUR L HOTE.
//
// Julien, TROIS FOIS : « l icone ne marche toujours pas », puis « franchement t es lourd ».
//
// LE DEFAUT, ET IL ETAIT INVISIBLE A TOUT CE QUE J AVAIS TESTE. Le catalogue d icones est une
// modale UNIQUE de l espace de travail. Elle est montee une fois, par le document hote, et
// s enregistre en posant `icon_selector_set_elements.current = ...` sur LA configuration de menus
// qu elle voit — celle de l hote.
//
// L inspecteur, lui, parle du document ACTIF. Depuis os#1446, toucher une part fait du document de
// FIGURE l actif : le bouton « catalogue d icones » appelait donc la ref de CE document, qui n a
// jamais ete branchee et vaut `() => null`.
//
// Resultat a l ecran : la modale s ouvrait — son ouverture, elle, etait deja deleguee a l hote par
// `dict_setter_show_dialog` — on y choisissait un pictogramme, et rien ne se passait. Le catalogue
// avait recu une liste VIDE d elements a modifier, donc il ecrivait dans un objet jetable.
//
// ⚠️ AUCUN TEST DE MODELE NE POUVAIT LE VOIR, et c est la lecon. J ai verifie trois fois que
// l aspect resolvait bien un chemin, et il le resolvait. Le defaut etait entre l inspecteur et la
// modale, dans un objet que ni l un ni l autre ne nomme.

import { Class_Workspace } from './Workspace'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

describe('os#1472 les refs des modales uniques sont celles de lespace de travail', () => {

  /**
   * Les trois refs concernees : chacune branche une modale MONTEE UNE FOIS a ce qu elle edite.
   * Le catalogue d icones est celle qui a fait defaut ; les deux autres ont exactement le meme
   * cycle de vie, et le meme piege.
   */
  const REFS = [
    'icon_selector_set_elements',
    'r_editor_content_set_elements',
    'r_rich_text_editor_refresh'
  ] as const

  it('un second document voit les refs du PREMIER, pas les siennes', () => {
    // LE DEFAUT, EN UNE ASSERTION. Deux documents du meme espace de travail : la modale s enregistre
    // sur l un, l autre doit la trouver.
    const ws = new Class_Workspace(false)
    const premier = ws.createDocument()
    const second = ws.createDocument()

    REFS.forEach(nom => {
      expect(second.menu_configuration[nom]).toBe(premier.menu_configuration[nom])
    })
  })

  it('et ce quun document y ecrit, lautre le lit', () => {
    // La contre-epreuve, et c est le geste reel : la modale pose son setter depuis le document qui
    // la monte, l inspecteur d un AUTRE document doit l appeler.
    const ws = new Class_Workspace(false)
    const hote = ws.createDocument()
    const figure = ws.createDocument()
    let recu: unknown = null
    hote.menu_configuration.icon_selector_set_elements.current = (elements) => { recu = elements }

    figure.menu_configuration.icon_selector_set_elements.current(
      [] as never, 'icon'
    )

    expect(recu).toEqual([])
  })

  it('l ouverture de la modale etait deja deleguee, elle', () => {
    // Ce qui explique le symptome exact : la modale S OUVRAIT, et ne faisait rien. Les deux
    // moities du branchement ne vivaient pas au meme endroit.
    const ws = new Class_Workspace(false)
    const premier = ws.createDocument()
    const second = ws.createDocument()

    expect(second.menu_configuration.dict_setter_show_dialog)
      .toBe(premier.menu_configuration.dict_setter_show_dialog)
  })
})
