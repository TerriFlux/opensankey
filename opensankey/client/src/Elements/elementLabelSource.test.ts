// ==================================================================================================
// os#1451 — UNE SEULE ÉNUMÉRATION DE SOURCE DE LIBELLÉ POUR TOUTE LA FAMILLE
// ==================================================================================================
//
// Le nommage a été remonté sur l'abstraction commune (`Class_BaseShape`, os#1445), mais DEUX
// énumérations parallèles décrivaient la même notion :
//   · un nœud (ou une zone de texte, ou une part) choisissait par `name_label_source` ;
//   · un flux choisissait par `name_label_text_source`, lu par le seul `LinkDrawNameLabel`.
//
// Conséquence : depuis le déplacement, un flux HÉRITAIT d'une cascade que son dessin IGNORAIT. Rien
// n'était cassé — la cascade était inerte — mais le premier qui aurait réglé la source de libellé
// d'un flux depuis l'inspecteur générique n'aurait rien vu se produire.
//
// CE QUI EST FIGÉ ICI :
//   1. l'arbitrage entre les deux écritures, à comportement CONSTANT pour les fichiers du parc :
//      l'écriture propre au flux (`name_label_text_source`, le format ENREGISTRÉ) prime dès qu'elle
//      dit autre chose que son défaut ;
//   2. la correspondance des valeurs, une fois les deux listes fondues en une ;
//   3. le fait que le DESSIN et le MODÈLE donnent le même texte — c'est tout l'objet du lot : la
//      question « que montre cet élément ? » ne dépend plus de sa nature.
//
// CE QUI N'EST PAS TOUCHÉ : le format enregistré. Aucune migration, aucun fichier réécrit — voir
// `Persistence/corpusFirstLoad.test.ts`, qui fige le rendu des migrations sur le parc.
// ==================================================================================================

import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * Micro-diagramme : un flux `Ble ---> Rhd`, étiqueté « certifie » dans le groupe de flux
 * « qualite ». De quoi poser sur un même flux les trois questions qui ont un sens pour lui — son
 * texte, son étiquette, ses deux bouts.
 */
const fixture = (): Type_JSON => JSON.parse(JSON.stringify({
  version: '1.1.4',
  fluxTags: {
    qualite: {
      name: 'Qualite',
      banner: 'none',
      tags_order: ['certifie'],
      tags: { certifie: { name: 'Certifie', selected: true, color: '#000083' } },
      use_colors: false,
    },
  },
  nodes: {
    Rhd: { name: 'RHD', x: 300, y: 100, inputLinksId: ['Ble---Rhd'] },
    Ble: { name: 'Ble', x: 100, y: 200, outputLinksId: ['Ble---Rhd'] },
  },
  links: {
    'Ble---Rhd': { idSource: 'Ble', idTarget: 'Rhd' },
  },
}))

function loadFixture() {
  const app = new Class_ApplicationData(false)
  app.fromJSON(fixture() as never, {}, false)
  // Aucun DOM ici : on lit le MODÈLE, et les actions de dessin des setters n'ont rien à toucher.
  app.drawing_area.bypass_redraws = true
  return app
}

/** Le flux de la fixture, muni du texte que l'auteur lui a saisi. */
function fluxAvecTexte(texte = 'Ble panifiable') {
  const flux = loadFixture().drawing_area.sankey.links_dict['Ble---Rhd']
  flux.text_value = texte
  return flux
}

/** Ce que le DESSIN écrirait, sans passer par le DOM. `getLabelText` est protégé de plein droit. */
function texteDessine(flux: ReturnType<typeof fluxAvecTexte>): string {
  const drawer = flux.name_label_drawer as unknown as { getLabelText(): string }
  return drawer.getLabelText()
}

describe('os#1451 ce qui est ENREGISTRE commande, et rien ne bouge a la relecture', () => {

  it('un flux sans aucun reglage affiche son texte, comme il l a toujours fait', () => {
    // LE CRITERE ABSOLU DU LOT. `name_label_source` vaut 'name' par defaut sur TOUS les elements :
    // si un flux le prenait au mot, il afficherait « Ble---RHD » a la place du texte saisi, dans
    // chacun des fichiers du parc. Un flux n a pas de nom propre — il se nomme par ses deux bouts —
    // et 'name' designe donc chez lui le texte qu il porte.
    const flux = fluxAvecTexte()

    expect(flux.name_label_source).toBe('name')
    expect(flux.name_label_source_effective).toBe('custom')
    expect(flux.name_label_effective).toBe('Ble panifiable')
    expect(texteDessine(flux)).toBe('Ble panifiable')
  })

  it('l ecriture propre au flux prime sur l attribut commun', () => {
    // `name_label_text_source` est CE QUE LES FICHIERS PORTENT (et ce que l import e!Sankey pose) :
    // tant qu elle dit autre chose que son defaut, elle decide seule. Un diagramme enregistre se
    // rouvre donc a l identique, quoi que l attribut commun ait pu recevoir par ailleurs.
    const flux = fluxAvecTexte()

    flux.name_label_source = 'template'
    flux.name_label_template = 'gabarit commun'
    flux.name_label_text_source = 'source_target'

    expect(flux.name_label_source_effective).toBe('source_target')
    expect(flux.name_label_effective).toBe('Ble → RHD')
  })

  it('revenir au defaut de l ecriture du flux rend la main a l attribut commun', () => {
    const flux = fluxAvecTexte()

    flux.name_label_text_source = 'none'
    expect(flux.name_label_effective).toBe('')

    flux.name_label_text_source = 'custom'
    expect(flux.name_label_source_effective).toBe('custom')
    expect(flux.name_label_effective).toBe('Ble panifiable')
  })
})

describe('os#1451 regler la source depuis l attribut COMMUN agit enfin sur un flux', () => {

  it('gabarit a jetons : le flux interprete les siens', () => {
    // LE PIEGE QUE CE LOT FERME. Avant, ces deux lignes ne produisaient RIEN a l ecran.
    const flux = fluxAvecTexte()

    flux.name_label_source = 'template'
    flux.name_label_template = 'Flux : {Name} ({Source} vers {Target})'

    expect(flux.name_label_effective).toBe('Flux : Ble panifiable (Ble vers RHD)')
    expect(texteDessine(flux)).toBe('Flux : Ble panifiable (Ble vers RHD)')
    // Un gabarit s edite tel qu il est ecrit, jetons compris — comme pour un nœud.
    expect(flux.name_label_effective_editable).toBe('Flux : {Name} ({Source} vers {Target})')
  })

  it('etiquette : le flux lit SES etiquettes, pas celles d un nœud', () => {
    const flux = fluxAvecTexte()

    flux.name_label_source = 'tag'
    flux.name_label_flux_tag_group_id = 'qualite'
    // Sans etiquette assignee, le flux dit son texte plutot que rien : le repli est une reponse.
    expect(flux.name_label_effective).toBe('Ble panifiable')

    flux.addTag(flux.sankey.flux_taggs_dict['qualite'].tags_dict['certifie'])
    expect(flux.name_label_effective).toBe('Certifie')
  })

  it('les deux bouts : la source que le flux est seul a pouvoir honorer', () => {
    const flux = fluxAvecTexte()

    flux.name_label_source = 'source'
    expect(flux.name_label_effective).toBe('Ble')
    flux.name_label_source = 'target'
    expect(flux.name_label_effective).toBe('RHD')
    flux.name_label_source = 'source_target'
    expect(flux.name_label_effective).toBe('Ble → RHD')

    // Et ce sont bien les libelles AFFICHES des bouts, pas leurs noms : renommer l affichage d un
    // nœud renomme le flux compose, sans qu aucun nom de document ne bouge.
    flux.source.name_label_source = 'custom'
    flux.source.name_label_text = 'Ble tendre'
    expect(flux.name_label_effective).toBe('Ble tendre → RHD')
    expect(flux.source.name).toBe('Ble')
  })

  it('les sources sans objet pour un flux retombent sur son texte, jamais sur du vide', () => {
    // Un flux n a pas d ancetre le long d une dimension : lui poser la question n est pas une
    // erreur, et la reponse est ce qu il affiche par ailleurs.
    const flux = fluxAvecTexte()

    flux.name_label_source = 'ancestor'
    expect(flux.name_label_effective).toBe('Ble panifiable')
  })
})

describe('os#1451 le dessin ne decide plus du contenu', () => {

  it('le libelle dessine est celui que l element dit afficher, valeur par valeur', () => {
    // La garde du lot : si quelqu un remet une cascade dans `LinkDrawNameLabel.getLabelText`, les
    // deux reponses divergeront ici avant de diverger a l ecran.
    const sources = ['custom', 'name', 'none', 'source', 'target', 'source_target', 'tag', 'template'] as const
    sources.forEach(source => {
      const flux = fluxAvecTexte()
      flux.name_label_template = '{Value} {Unit}'
      flux.name_label_text_source = source
      expect(texteDessine(flux)).toBe(flux.name_label_effective)
    })
  })

  it('le libelle d icone n a pas de source a choisir : il porte le texte du flux', () => {
    const flux = fluxAvecTexte()
    flux.name_label_text_source = 'none'

    // Le dessinateur d icone n est expose nulle part (il n a rien de public a offrir) : on le prend
    // la ou le flux le range, pour verifier qu il ignore bien la source.
    const icon_drawer = (flux as unknown as { _link_draw_icon: { getLabelText(): string } })._link_draw_icon
    expect(icon_drawer.getLabelText()).toBe('Ble panifiable')
  })
})
