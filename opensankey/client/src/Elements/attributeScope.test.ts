// os#1464 — LA PORTEE D UN ATTRIBUT, SUR DE VRAIS ELEMENTS.
//
// Julien : « et si l attribut n est pas pertinent, ne pas le montrer dans l interface — par exemple
// rayon pour la forme ». Ce fichier tient les deux moities de la regle, et la seconde compte autant
// que la premiere :
//
//   1. CE QUI EST MASQUE l est bien — le rayon des coins sur une part ;
//   2. CE QUI NE L EST PAS ne l est pas — le placement du libelle, l icone, le fond d etiquette.
//      Un attribut qui a du sens s implemente, il ne se cache pas (« tous les attributs qui
//      existent et qui ont du sens, il faut les implementer »). Les tests du second groupe sont
//      des GARDE-FOUS : ils tomberont le jour ou quelqu un elargira le masquage sans le vouloir.
//
// DE VRAIS ELEMENTS, ET PAS DES DOUBLURES. La nature se lit STRUCTURELLEMENT : un sac de proprietes
// invente ici repondrait ce qu on aurait pris soin d y mettre, et ne dirait rien de ce que les vraies
// classes portent. On construit donc un document, ses noeuds, son flux, sa zone de texte, et les
// parts d une figure par le chemin ordinaire (`buildParts`).

import { Class_Workspace } from '../types/Workspace'
import { buildParts } from '../Representations/parts/buildParts'
import { ALL_ATTRIBUTES_CONFIG } from './ElementsAttributesConfig'
import {
  attributeAppliesToElements,
  attributesOwnedBy,
  attributeScopeOf,
  familyAppliesToElements,
  natureOf,
  scopeSpeaksTo
} from './attributeScope'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Un document minimal qui porte les quatre natures a la fois. */
const buildScene = () => {
  const ws = new Class_Workspace(false)
  const source = ws.createDocument()
  source.drawing_area.bypass_redraws = true
  const sankey = source.drawing_area.sankey
  const amont = sankey.addNewNode('amont', 'Amont')
  const aval = sankey.addNewNode('aval', 'Aval')
  const flux = sankey.addNewLink(amont, aval)
  const zone = sankey.addNewContainer('zdt', 'Zone')
  const parts = buildParts(source, [
    { id: 'a', label: 'A', value: 3 },
    { id: 'b', label: 'B', value: 7 }
  ])
  return {
    source, sankey, noeud: amont, flux, zone,
    part: parts.by_id['a'],
    style: sankey.default_style
  }
}

describe('os#1464 la nature d un element se lit structurellement', () => {

  it('une part se reconnait a son marqueur', () => {
    expect(natureOf(buildScene().part)).toBe('part')
  })

  it('un flux se reconnait a ses deux bouts', () => {
    expect(natureOf(buildScene().flux)).toBe('link')
  })

  it('un noeud se reconnait a ce qu il porte des flux', () => {
    expect(natureOf(buildScene().noeud)).toBe('node')
  })

  it('une zone de texte est un element de base qui ne porte aucun flux', () => {
    expect(natureOf(buildScene().zone)).toBe('container')
  })

  it('un style d application n a pas de nature, et recoit donc tout', () => {
    // Un style nomme ne dit pas a quelle nature il s appliquera : masquer ses reglages le rendrait
    // impossible a ecrire.
    const { style } = buildScene()
    expect(natureOf(style)).toBeNull()
    expect(attributeAppliesToElements([style], 'shape_border_radius')).toBe(true)
  })

  it('un objet quelconque n a pas de nature', () => {
    expect(natureOf(undefined)).toBeNull()
    expect(natureOf({ id: 'x' })).toBeNull()
  })
})

describe('os#1464 ce qui est masque sur une part', () => {

  it('le RAYON DES COINS, qui est l exemple de Julien', () => {
    const { part, noeud } = buildScene()
    expect(attributeAppliesToElements([part], 'shape_border_radius')).toBe(false)
    expect(attributeAppliesToElements([noeud], 'shape_border_radius')).toBe(true)
  })

  it('la geometrie de boite : taille minimale, largeur fixe, marges, type de forme', () => {
    const { part } = buildScene()
    const masquees = [
      'shape_type', 'shape_min_width', 'shape_min_height', 'shape_width_locked',
      'shape_box_width', 'shape_margin_left', 'shape_margin_right', 'shape_margin_top',
      'shape_margin_bottom'
    ]
    masquees.forEach(cle => {
      expect([cle, attributeAppliesToElements([part], cle)]).toEqual([cle, false])
    })
  })

  it('la FAMILLE du stock en entier, sans enumerer ses soixante-quatre cles', () => {
    // C est ce que le troisieme etage de declaration apporte : une ligne, et toute la famille suit.
    const { part, noeud } = buildScene()
    expect(attributeAppliesToElements([part], 'stock_label_is_visible')).toBe(false)
    expect(attributeAppliesToElements([part], 'stock_label_background_color')).toBe(false)
    expect(attributeAppliesToElements([noeud], 'stock_label_is_visible')).toBe(true)
    expect(familyAppliesToElements([part], 'stock_label')).toBe(false)
    expect(familyAppliesToElements([noeud], 'stock_label')).toBe(true)
  })
})

describe('os#1464 ce qui RESTE offert a une part, et doit le rester', () => {

  it('la couleur, le fond et le lisere : le trace les lit', () => {
    const { part } = buildScene()
    const lues = [
      'shape_color', 'shape_color_visible', 'shape_opacity',
      'shape_border_visible', 'shape_border_color', 'shape_border_thickness'
    ]
    lues.forEach(cle => {
      expect([cle, attributeAppliesToElements([part], cle)]).toEqual([cle, true])
    })
  })

  it('le PLACEMENT du libelle, qui a du sens meme sans trace', () => {
    // « Au-dessus / dedans / en dessous » sur une barre, « dans l anneau ou sorti du disque » sur un
    // secteur. Ce qui manque est le trace, pas la pertinence : ce lot ne doit pas les retirer.
    const { part } = buildScene()
    const a_implementer = [
      'name_label_horiz', 'name_label_vert', 'name_label_horiz_shift', 'name_label_vert_shift',
      'name_label_text_align', 'name_label_inside_horiz', 'name_label_inside_vert',
      'name_label_position_absolute'
    ]
    a_implementer.forEach(cle => {
      expect([cle, attributeAppliesToElements([part], cle)]).toEqual([cle, true])
    })
  })

  it('l ICONE : elle se dessinera sur les parts, elle ne se masque pas', () => {
    const { part } = buildScene()
    expect(attributeAppliesToElements([part], 'icon_is_visible')).toBe(true)
    expect(familyAppliesToElements([part], 'icon')).toBe(true)
  })

  it('le FOND d une etiquette, dont les memes cles sont masquees sur la FORME', () => {
    // La preuve que la portee se declare par cle PREFIXEE quand ses copies ne se valent pas : un
    // cartouche derriere l etiquette d un secteur a du sens, la geometrie du secteur non.
    const { part } = buildScene()
    expect(attributeAppliesToElements([part], 'shape_border_radius')).toBe(false)
    expect(attributeAppliesToElements([part], 'name_label_background_border_radius')).toBe(true)
    expect(attributeAppliesToElements([part], 'name_label_background_margin_left')).toBe(true)
  })

  it('un attribut sans portee declaree s adresse a tout le monde', () => {
    const { part, noeud, flux, zone } = buildScene()
    const tous = [part, noeud, flux, zone]
    expect(attributeScopeOf('name_label_font_size')).toBeUndefined()
    tous.forEach(el => {
      expect(attributeAppliesToElements([el], 'name_label_font_size')).toBe(true)
    })
  })
})

describe('os#1464 l autre sens : ce qu une nature declare pour elle seule', () => {

  it('les totaux entrants sortants ne s adressent qu au noeud', () => {
    const { noeud, flux, zone, part } = buildScene()
    expect(attributeAppliesToElements([noeud], 'value_label_in_out_display_mode')).toBe(true)
    expect(attributeAppliesToElements([flux], 'value_label_in_out_display_mode')).toBe(false)
    expect(attributeAppliesToElements([zone], 'value_label_in_out_display_mode')).toBe(false)
    expect(attributeAppliesToElements([part], 'value_label_in_out_display_mode')).toBe(false)
  })

  it('coller la valeur au libelle s adresse au noeud, au flux ET A LA PART', () => {
    // LA PART EST ENTREE APRES, et c est Julien qui l a demandee : « l option par defaut c est
    // d avoir les deux attaches ; cette option existe pour les flux je crois, donc reutilisons-la »
    // (os#1470). Elle dit deja la bonne chose dans les sept langues, et le trace d un secteur la
    // lit depuis (`partAspect`, `value_attached`).
    //
    // Ce test affirmait le contraire — ecrit en os#1464, jamais relu quand os#1470 a elargi la
    // portee. Il est corrige vers le REEL, pas vers le vert : la zone reste seule exclue, parce
    // qu elle n ecrit pas de valeur.
    const { noeud, flux, zone, part } = buildScene()
    expect(attributeAppliesToElements([noeud], 'value_label_stick_to_label')).toBe(true)
    expect(attributeAppliesToElements([flux], 'value_label_stick_to_label')).toBe(true)
    expect(attributeAppliesToElements([part], 'value_label_stick_to_label')).toBe(true)
    expect(attributeAppliesToElements([zone], 'value_label_stick_to_label')).toBe(false)
  })

  it('une nature sait enumerer ce qui est a elle', () => {
    // C est ce qu une surface demandera pour rendre la partie propre d une nature, au lieu de porter
    // sa propre liste : l orientation radiale d une etiquette de couronne s y branchera ainsi.
    const a_elle = attributesOwnedBy('node')
    expect(a_elle).toContain('value_label_in_out_display_mode')
    // Un attribut generique dont une nature est ecartee n est pas « a » une autre : il est a tous
    // sauf une.
    expect(a_elle).not.toContain('shape_border_radius')
    expect(attributesOwnedBy('part')).not.toContain('value_label_in_out_display_mode')
  })
})

describe('os#1478 les cent trente cles sans objet ne sont plus offertes a une part', () => {

  // L audit des 350 (`notes/figures/attributs-un-par-un.md`) a trie par REGLES, pas cle par cle.
  // Ce qui suit prend un echantillon de chaque regle : si la portee est posee au bon endroit, tout
  // le groupe suit ; si elle glisse, c est l echantillon qui tombe et il dit lequel.

  it('LA GEOMETRIE D UN NOEUD ET CELLE D UN FLUX : la forme d une part est CALCULEE', () => {
    const { part, noeud, flux } = buildScene()
    const geometrie = [
      // Catalogue du NOEUD : ancrages, verrous de position, hachures.
      'shape_position_type', 'shape_anchor_align_vertical', 'shape_position_u_locked', 'shape_hatch',
      // Catalogue du FLUX : courbure, tangentes, fleches, encoches, points de passage.
      'shape_curvature', 'shape_starting_tangeant', 'shape_is_arrow', 'shape_source_notch',
      'shape_waypoints', 'shape_link_caps'
    ]
    geometrie.forEach(cle => {
      expect([cle, attributeAppliesToElements([part], cle)]).toEqual([cle, false])
      // ET LE GARDE-FOU, qui compte autant : ceux a qui elles s adressent les gardent.
      expect([cle, attributeAppliesToElements([noeud, flux], cle)]).toEqual([cle, true])
    })
  })

  it('LA MACHINERIE D ETIQUETTE HERITEE PAR L ICONE : une icone est un pictogramme', () => {
    // Soixante-trois cles derivees d une declaration d ETIQUETTE, dont cinquante-sept n ont aucun
    // sujet sur un dessin vectoriel : une police, une casse, un separateur, un cartouche.
    const { part } = buildScene()
    const heritage = [
      'icon_font_family', 'icon_font_size', 'icon_bold', 'icon_uppercase',
      'icon_text_align', 'icon_wrap_long_words', 'icon_unit_visible',
      'icon_background_visible', 'icon_background_border_radius'
    ]
    heritage.forEach(cle => {
      expect([cle, attributeAppliesToElements([part], cle)]).toEqual([cle, false])
    })
    // LES CINQ QUI DECRIVENT VRAIMENT UN PICTOGRAMME RESSORTENT, et c est ce qui prouve que la
    // regle « la cle l emporte sur la famille » tient. Elles sont LUES par les trois natures.
    const pictogramme = [
      'icon_is_visible', 'icon_icon_name', 'icon_color', 'icon_box_width', 'icon_view_box'
    ]
    pictogramme.forEach(cle => {
      expect([cle, attributeAppliesToElements([part], cle)]).toEqual([cle, true])
    })
  })

  it('UN NOM N A NI CHIFFRES NI UNITE, mais une VALEUR si', () => {
    // Ces cles n existent sous le prefixe du NOM que parce que la declaration de base est partagee
    // entre les deux familles d etiquette. C est le meme suffixe, et il ne vaut pas des deux cotes.
    const { part } = buildScene()
    const chiffres = [
      'scientific_notation', 'significant_digits', 'nb_digit', 'unit_visible', 'unit', 'unit_factor'
    ]
    chiffres.forEach(suffixe => {
      expect([suffixe, attributeAppliesToElements([part], `name_label_${suffixe}`)])
        .toEqual([suffixe, false])
      expect([suffixe, attributeAppliesToElements([part], `value_label_${suffixe}`)])
        .toEqual([suffixe, true])
    })
  })

  it('CE QUI COUPLE UNE ETIQUETTE AU DIAGRAMME, sans objet dans une figure', () => {
    const { part, flux } = buildScene()
    const couple = [
      'name_label_on_path', 'name_label_pos_auto', 'name_label_flux_tag_group_id',
      'value_label_on_path', 'value_label_pos_auto', 'value_label_flux_tag_group_id',
      'name_label_tag_group_id', 'name_label_dimension_id',
      'analysis_descriptor', 'figure_placements'
    ]
    couple.forEach(cle => {
      expect([cle, attributeAppliesToElements([part], cle)]).toEqual([cle, false])
    })
    // La SOURCE DU TEXTE est ressortie du meme catalogue : elle decrit un libelle, pas un
    // diagramme, et ecrire le nom d une part depuis un attribut a du sens.
    expect(attributeAppliesToElements([part], 'name_label_text_source')).toBe(true)
    expect(attributeAppliesToElements([flux], 'name_label_on_path')).toBe(true)
  })

  it('LE GARDE-FOU : tout ce que les traces LISENT reste offert', () => {
    // Le vrai risque de ce lot n est pas de masquer trop peu, c est de masquer trop — et un reglage
    // retire a tort ne se decouvre que des mois plus tard, a l ecran, sur une plainte.
    const { part } = buildScene()
    const lues = [
      'shape_color_visible', 'shape_color', 'shape_opacity',
      'shape_border_visible', 'shape_border_color', 'shape_border_thickness',
      'name_label_is_visible', 'name_label_font_size', 'name_label_bold', 'name_label_color',
      'name_label_background_visible', 'name_label_background_border_radius',
      'name_label_horiz_shift', 'name_label_text_align', 'name_label_prune_if_unfitting',
      'value_label_is_visible', 'value_label_font_size', 'value_label_unit', 'value_label_nb_digit',
      'value_label_stick_to_label', 'value_label_percent'
    ]
    lues.forEach(cle => {
      expect([cle, attributeAppliesToElements([part], cle)]).toEqual([cle, true])
    })
  })

  it('AUCUNE AUTRE NATURE NE PERD QUOI QUE CE SOIT', () => {
    // Toutes les portees posees par ce lot sont des `except: ['part']` ou des re-autorisations : un
    // noeud, un flux, une zone de texte voient exactement ce qu ils voyaient. Le risque de masquer
    // trop est le seul vrai risque du lot, et il ne se decouvrirait qu a l ecran, des mois plus tard.
    const { noeud, flux, zone } = buildScene()
    const toutes = Object.keys(ALL_ATTRIBUTES_CONFIG)
    const perdues = (el: unknown) => toutes.filter(cle => !attributeAppliesToElements([el], cle))
    // Le NOEUD ne perd que ce qui est declare POUR UNE PART et elle seule (os#1482) : l orientation
    // du texte dans une forme ronde, et le detachement de l etiquette. Un noeud a `text_angle`, qui
    // fait mieux, et son libellé ne se detache pas de lui.
    const A_LA_PART = ['name_label_orientation', 'name_label_callout']
    expect(perdues(noeud).sort()).toEqual([...A_LA_PART].sort())
    // Le flux et la zone ne perdent QUE des portees posees bien avant ce lot : les totaux
    // entrants/sortants (`only: ['node']`, os#1464), qui n ont de sens que la ou des flux entrent et
    // sortent, et pour la zone « coller au libelle » (os#1470) — elle n ecrit pas de valeur.
    const totaux = [
      'name_label_in_out_display_mode', 'value_label_in_out_display_mode',
      'stock_label_in_out_display_mode', 'icon_in_out_display_mode'
    ]
    expect(perdues(flux).sort()).toEqual([...totaux, ...A_LA_PART].sort())
    expect(perdues(zone).sort())
      .toEqual([...totaux, ...A_LA_PART, 'value_label_stick_to_label'].sort())
  })

  it('le compte : une part ne se voit plus offrir qu un tiers du catalogue', () => {
    // Pas le chiffre exact — il bougera a chaque cle ajoutee, et ce test deviendrait un travail
    // d entretien sans valeur. L ORDRE DE GRANDEUR, lui, dit si la porte s est refermee ou rouverte.
    const { part } = buildScene()
    const offertes = Object.keys(ALL_ATTRIBUTES_CONFIG)
      .filter(cle => attributeAppliesToElements([part], cle))
    expect(offertes.length).toBeGreaterThan(120)
    expect(offertes.length).toBeLessThan(165)
  })
})

describe('os#1464 ce que la regle repond aux cas limites', () => {

  it('une portee absente parle a toutes les natures', () => {
    expect(scopeSpeaksTo(undefined, 'part')).toBe(true)
    expect(scopeSpeaksTo(undefined, null)).toBe(true)
  })

  it('une nature inconnue recoit tout, meme sous une portee etroite', () => {
    expect(scopeSpeaksTo({ only: ['node'] }, null)).toBe(true)
    expect(scopeSpeaksTo({ except: ['part'] }, null)).toBe(true)
  })

  it('une selection MELEE garde le reglage des que l une des natures le reclame', () => {
    // Le masquer priverait les autres, ce qui est un degat plus grand que le reglage inerte sur
    // l intrus.
    const { part, noeud } = buildScene()
    expect(attributeAppliesToElements([noeud, part], 'shape_border_radius')).toBe(true)
    expect(attributeAppliesToElements([part, noeud], 'shape_border_radius')).toBe(true)
  })

  it('une selection vide ne masque rien', () => {
    expect(attributeAppliesToElements([], 'shape_border_radius')).toBe(true)
  })

  it('une cle inconnue ne masque rien non plus', () => {
    // Une surface qui interroge une cle qui n existe pas sous ce prefixe ne doit pas faire
    // disparaitre son champ en silence.
    const { part } = buildScene()
    expect(attributeScopeOf('cle_qui_n_existe_pas')).toBeUndefined()
    expect(attributeAppliesToElements([part], 'cle_qui_n_existe_pas')).toBe(true)
  })

  it('une portee posee sur la declaration de base suit TOUS ses prefixes', () => {
    // `in_out_display_mode` existe sous quatre prefixes (le catalogue des libelles est le meme) :
    // « Σin → Σout n a de sens que sur un noeud » vaut pour les quatre, et une seule ligne le dit.
    const { part } = buildScene()
    expect(attributeAppliesToElements([part], 'name_label_in_out_display_mode')).toBe(false)
    expect(attributeAppliesToElements([part], 'icon_in_out_display_mode')).toBe(false)
  })
})
