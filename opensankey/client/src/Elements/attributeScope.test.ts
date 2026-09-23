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
  BarPartStyle, DonutPartStyle, FigurePartStyle,
  figure_part_nature_styles, figure_part_styles
} from './ElementStyle'
import {
  attributeAppliesToElements,
  attributesOwnedBy,
  attributeScopeOf,
  familyAppliesToElements,
  natureOf,
  partStyleFigureNature,
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

// os#1497 — UN STYLE DE PART EST UNE PART, ET IL DIT DE QUELLE FIGURE.
//
// Julien, capture a l appui, sur des BARRES : « il reste des choses qui ne devraient pas etre la,
// ca n a de sens que pour couronne » — l orientation radiale, le detachement de l etiquette. Puis :
// « ca donne l impression que tu n as pas encore fini le travail systematique pour chaque
// attribut. »
//
// LES PORTEES ETAIENT JUSTES ; C EST LA QUESTION QUI NE L ETAIT PAS. En portee STYLES — livree la
// veille par os#1495 — l inspecteur ne tient plus l element mais le STYLE qu il edite. Un style n a
// pas de nature, et « pas de nature = recoit tout » : la bande Styles d une part rouvrait donc le
// catalogue entier, y compris ce qu une barre ne sait pas faire.
//
// Un style de part, lui, SAIT de quoi il est le style : il y en a quatre, ils sont nommes, et un
// par nature (os#1462).
describe('os#1497 un style de part porte la nature de sa figure', () => {

  it('LE STYLE DES BARRES refuse ce qui n a de sens que dans un rond', () => {
    const style_barres = { id: BarPartStyle }

    expect(attributeAppliesToElements([style_barres], 'name_label_orientation')).toBe(false)
    expect(attributeAppliesToElements([style_barres], 'name_label_callout')).toBe(false)
    // CONTRE-VERIFICATION : il garde tout ce qu une part sait faire, sinon ce test passerait au
    // vert sur une declaration qui masque tout.
    expect(attributeAppliesToElements([style_barres], 'shape_color')).toBe(true)
    expect(attributeAppliesToElements([style_barres], 'name_label_horiz')).toBe(true)
  })

  it('LE STYLE DE LA COURONNE les garde, et c est la meme cle', () => {
    const style_couronne = { id: DonutPartStyle }

    expect(attributeAppliesToElements([style_couronne], 'name_label_orientation')).toBe(true)
    expect(attributeAppliesToElements([style_couronne], 'name_label_callout')).toBe(true)
    // Et il perd le placement en boite, qu une barre garde : un arc n a pas de coins (os#1483).
    expect(attributeAppliesToElements([style_couronne], 'name_label_horiz')).toBe(false)
  })

  it('LE STYLE GENERIQUE sert les trois figures, donc ne masque aucune figure', () => {
    // `FigurePartStyle` se pose sous les trois : masquer chez lui ce qu une seule nature refuse
    // rendrait le reglage inatteignable pour les deux autres.
    const style_generique = { id: FigurePartStyle }

    expect(attributeAppliesToElements([style_generique], 'name_label_orientation')).toBe(true)
    expect(attributeAppliesToElements([style_generique], 'name_label_horiz')).toBe(true)
    // Mais il reste une PART : ce qui ne s adresse a aucune part reste masque.
    expect(attributeAppliesToElements([style_generique], 'value_label_unit_type')).toBe(false)
  })

  it('UN STYLE QUI N EST PAS CELUI D UNE PART recoit tout, comme avant', () => {
    // La regle d origine ne bouge pas : un style nomme ne dit pas a quelle nature il servira, et
    // masquer ses reglages le rendrait impossible a ecrire.
    const style_noeud = { id: 'MonStyleDeNoeud' }

    expect(attributeAppliesToElements([style_noeud], 'name_label_orientation')).toBe(true)
    expect(attributeAppliesToElements([style_noeud], 'value_label_unit_type')).toBe(true)
  })

  it('LES QUATRE NOMS SONT LES MEMES DES DEUX COTES', () => {
    // ⚠️ LE GARDE-FOU DE LA RECOPIE. `attributeScope` ne peut pas importer `ElementStyle` sans
    // refermer un cycle de modules : les quatre identifiants y sont donc recopies. Ce cas tient
    // les deux listes ensemble, et rougit le jour ou une cinquieme nature s ajoute d un cote.
    expect(partStyleFigureNature({ id: figure_part_styles[0] })).toBe('')
    Object.entries(figure_part_nature_styles).forEach(([nature, style_id]) => {
      expect([style_id, partStyleFigureNature({ id: style_id })]).toEqual([style_id, nature])
    })
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
      'name_label_text_align', 'name_label_inside_vert',
      'name_label_position_absolute'
    ]
    a_implementer.forEach(cle => {
      expect([cle, attributeAppliesToElements([part], cle)]).toEqual([cle, true])
    })
    // os#1491 — SAUF `inside_horiz`, ET LE TRACE A TRANCHE POUR DE BON.
    //
    // Un noeud a deux « dedans » parce qu il a deux dimensions reglables. Une part n en a qu un :
    // son texte est SUR la forme ou A COTE, et les trois traces lisent `inside_vert` pour le dire.
    // `inside_horiz` n etait lu par aucun — ce n etait pas « pas encore implemente », c etait un
    // doublon sans objet.
    expect(attributeAppliesToElements([part], 'name_label_inside_horiz')).toBe(false)
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
      'scientific_notation', 'significant_digits', 'nb_digit', 'unit_visible', 'unit'
    ]
    chiffres.forEach(suffixe => {
      expect([suffixe, attributeAppliesToElements([part], `name_label_${suffixe}`)])
        .toEqual([suffixe, false])
      expect([suffixe, attributeAppliesToElements([part], `value_label_${suffixe}`)])
        .toEqual([suffixe, true])
    })
    // os#1490 — DEUX EXCEPTIONS DU COTE DE LA VALEUR, et elles se disent :
    //
    //   `unit_type`   : c est le selecteur des FLUX, douze entrees dont « % de flux en entrees du
    //                   noeud source ». Une part a le sien, `value_label_part_unit`, en quatre
    //                   choix — « le selecteur d unite peut pas etre le meme sur un noeud, un flux,
    //                   une part de figure » ;
    //   `unit_factor` : l arbitrage d os#1463 l a laisse au graphe (il divise le nombre sans
    //                   toucher a la geometrie), si bien qu aucun trace ne le lit. Un reglage que
    //                   personne ne lit n a pas a s afficher.
    const a_la_figure = ['unit_type', 'unit_factor']
    a_la_figure.forEach(suffixe => {
      expect([suffixe, attributeAppliesToElements([part], `value_label_${suffixe}`)])
        .toEqual([suffixe, false])
    })
    expect(attributeAppliesToElements([part], 'value_label_part_unit')).toBe(true)
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
    // os#1490 y ajoute le selecteur d unite propre a une part : un noeud garde celui des flux.
    const A_LA_PART = ['name_label_orientation', 'name_label_callout', 'value_label_part_unit']
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
