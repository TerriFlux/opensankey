// os#1445, etape 2 — L ADAPTATEUR DE LA COURONNE, et la garantie qui commande tout le lot.
//
// Deux choses se verifient ici :
//  1. CE QU UNE PART DESIGNE. Une part n est pas toujours un noeud (correction de Julien, 20/09) :
//     le secteur de complement ne designe rien, et un identifiant introuvable non plus — surtout
//     pas une reference inventee.
//  2. QU UNE COURONNE ENREGISTREE AVANT CE LOT NE CHANGE PAS D ASPECT. C est le seul critere du
//     contrat, et il se joue sur un detail : les valeurs d usine d un element ne sont PAS celles
//     du trace (quatorze points contre dix, un lisere noir contre un blanc). Une part fraiche ne
//     doit donc rien dire du tout.

import { sunburstPartInputs, sunburstPartSubject } from './sunburstParts'
import type { Type_SunburstPartsSource } from './sunburstParts'
import { buildParts } from './buildParts'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { SUNBURST_STYLE_DEFAULTS, sunburstPartStyle } from '../../Charts/SunburstChart'
import type { Type_SunburstNode, Type_SunburstTree } from '../../Charts/SunburstHierarchy'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const sector = (
  id: string,
  value: number,
  children: Type_SunburstNode[] = [],
  extra: Partial<Type_SunburstNode> = {}
): Type_SunburstNode => ({
  id, label: id, value, declared: value, color: null, depth: 0, children, dimension_id: 'dim', ...extra
})

const treeOf = (roots: Type_SunburstNode[]): Type_SunburstTree => ({
  dimension_id: 'dim',
  dimension_label: 'Especes',
  roots,
  rings: [],
  total: roots.reduce((acc, r) => acc + r.value, 0),
  mismatch_count: 0,
  is_truncated: false
})

/** Le document regarde, reduit a ce que l adaptateur lui demande : ses noeuds par identifiant. */
const ble = { id: 'n_ble', name: 'Ble' }
const mais = { id: 'n_mais', name: 'Mais' }
const source: Type_SunburstPartsSource = { nodes_dict: { n_ble: ble, n_mais: mais } }

describe('os#1445 ce quun secteur de couronne designe', () => {

  it('un secteur ordinaire designe le NOEUD du document, et le noeud lui-meme', () => {
    // Le noeud LUI-MEME et non une copie de son nom : c est ce qui fait qu un renommage sur le
    // diagramme change ce que la couronne affiche, tant que la part ne porte pas d alias.
    const subject = sunburstPartSubject(source, sector('n_ble', 6))

    expect(subject.kind).toBe('node')
    expect(subject.kind === 'node' && subject.node).toBe(ble)
  })

  it('le secteur residuel ne designe RIEN', () => {
    // Il n est pas un noeud du modele : le renommer ne doit rien renommer en amont.
    expect(sunburstPartSubject(source, sector('n_ble__residual__', 2)).kind).toBe('none')
    // Et le drapeau de l arbre suffit, meme sans le suffixe — un secteur replie par le trace
    // (« Autres ») le porte ainsi.
    expect(sunburstPartSubject(source, sector('__others__n_ble', 1, [], { is_residual: true })).kind)
      .toBe('none')
  })

  it('un identifiant introuvable ne designe rien, et aucune reference nest inventee', () => {
    const subject = sunburstPartSubject(source, sector('n_disparu', 4))

    expect(subject.kind).toBe('none')
    expect(subject).not.toHaveProperty('node')
  })
})

describe('os#1445 larbre de la couronne devient des parts', () => {

  it('lordre des secteurs est conserve : chaque secteur puis ses enfants', () => {
    // C est l ordre du trace (`partitionSunburst` descend l arbre de la meme facon), donc celui
    // sous lequel « le troisieme secteur » veut dire quelque chose.
    const tree = treeOf([
      sector('n_ble', 10, [sector('n_mais', 6), sector('n_ble__residual__', 4)]),
      sector('n_disparu', 5)
    ])

    const parts = sunburstPartInputs(source, tree)

    expect(parts.map(p => p.id)).toEqual(['n_ble', 'n_mais', 'n_ble__residual__', 'n_disparu'])
    expect(parts.map(p => p.subject?.kind)).toEqual(['node', 'node', 'none', 'none'])
  })

  it('le libelle, la valeur et la couleur du modele suivent le secteur', () => {
    const tree = treeOf([sector('n_ble', 10, [], { label: 'Ble tendre', color: '#123456' })])

    const [part] = sunburstPartInputs(source, tree)

    expect(part.label).toBe('Ble tendre')
    expect(part.value).toBe(10)
    expect(part.color).toBe('#123456')
  })

  it('un secteur sans couleur imposee nen porte aucune : la palette de la figure commande', () => {
    const [part] = sunburstPartInputs(source, treeOf([sector('n_ble', 10)]))

    expect(part.color).toBeUndefined()
  })
})

describe('os#1445 une couronne enregistree avant ce lot ne change pas daspect', () => {

  const buildSource = () => {
    const doc = new Class_ApplicationData(false)
    doc.drawing_area.bypass_redraws = true
    return doc
  }

  it('une part fraiche ne dit RIEN, et la mise en forme de la figure tient telle quelle', () => {
    // LE POINT CRITIQUE DU LOT. Une part est un element : ses valeurs d usine sont celles d un
    // element, pas celles de la couronne. Si le trace lisait son aspect sans reserve, toutes les
    // couronnes du parc passeraient en quatorze points, lisere noir. La part n est donc ecoutee
    // que sur ce qu elle porte EN PROPRE.
    const figure = buildParts(buildSource(), [{ id: 'n_ble', label: 'Ble', value: 6 }],
      undefined, 'sunburst')
    const part = figure.by_id['n_ble']

    // os#1449 — CE QUE LA PART RESOUT A CHANGE, CE QU ELLE DIT NON. Depuis que les parts ont leur
    // style, une part fraiche resout l aspect d usine d une FIGURE et non celui d un noeud : dix
    // points, opacite 1. C est ce que l inspecteur montre, et c est ce que la couronne dessine.
    expect(part.name_label_font_size).toBe(SUNBURST_STYLE_DEFAULTS.font_size)
    expect(part.shape_opacity).toBe(SUNBURST_STYLE_DEFAULTS.opacity)

    // Et la garantie du lot est intacte : une amorce est MUETTE, donc la mise en forme de la
    // figure tient telle quelle — au pixel, et quel que soit ce que l auteur y avait regle.
    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part)).toEqual(SUNBURST_STYLE_DEFAULTS)
  })

  it('une part qui porte un reglage le fait valoir, et elle seule', () => {
    // L objet meme du lot : l aspect d UN secteur peut differer de celui des autres.
    const figure = buildParts(buildSource(), [
      { id: 'n_ble', label: 'Ble', value: 6 },
      { id: 'n_mais', label: 'Mais', value: 4 }
    ])
    figure.by_id['n_ble'].name_label_font_size = 22
    figure.by_id['n_ble'].shape_opacity = 0.5

    const reglee = sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_ble'])
    const voisine = sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_mais'])

    expect(reglee.font_size).toBe(22)
    expect(reglee.opacity).toBe(0.5)
    // La voisine n a rien demande : elle garde la mise en forme de la figure.
    expect(voisine).toEqual(SUNBURST_STYLE_DEFAULTS)
  })
})

// os#1462 — LA COULEUR ET LE FOND D UN SECTEUR.
//
// Julien, a l ecran : « Fond et Bordure n agissent pas sur l element du sunburst ; y a-t-il un
// dessin du fond et de la bordure par part ? si ce n est pas le cas il faut le faire, et cela pour
// tous les attributs pertinents — couleur, etc. »
//
// La bordure etait lue. La COULEUR ne l etait pas : l arc se peignait de la teinte que l arbre lui
// donne, sans jamais demander a la part ce qu elle en dit. Et la VISIBILITE DU FOND n existait pas
// du tout — la case etait offerte a l auteur sans que rien ne l ecoute.
describe('os#1462 un secteur se repeint et seface', () => {

  const buildSource = () => {
    const doc = new Class_ApplicationData(false)
    doc.drawing_area.bypass_redraws = true
    return doc
  }

  it('la couleur de la part gagne sur la teinte de larbre', () => {
    const figure = buildParts(buildSource(), [{ id: 'n_ble', label: 'Ble', value: 6 }],
      undefined, 'sunburst')
    const part = figure.by_id['n_ble']
    part.shape_color = '#123456'

    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part).fill).toBe('#123456')
  })

  it('Fond decoche se dit SEPAREMENT de la couleur', () => {
    // Une part qui cache son fond sans avoir choisi de couleur ne dit rien de `fill` : passer par
    // `fill` ne saurait donc pas distinguer « pas de fond » de « la figure decide ».
    const figure = buildParts(buildSource(), [{ id: 'n_ble', label: 'Ble', value: 6 }],
      undefined, 'sunburst')
    const part = figure.by_id['n_ble']
    part.shape_color_visible = false

    const resolu = sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part)
    expect(resolu.background_visible).toBe(false)
    expect(resolu.fill).toBeUndefined()
  })

  it('une part qui na rien dit ne dit toujours rien', () => {
    // La garantie du lot, intacte : deux cles de plus ne doivent repeindre aucune figure du parc.
    const figure = buildParts(buildSource(), [{ id: 'n_ble', label: 'Ble', value: 6 }],
      undefined, 'sunburst')

    const resolu = sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_ble'])
    expect(resolu.fill).toBeUndefined()
    expect(resolu.background_visible).toBeUndefined()
  })
})

// os#1465 — LE PICTOGRAMME DUN SECTEUR.
//
// Julien : « oui on peut dessiner l icone sur les parts ». L onglet Icone etait servi aux parts
// depuis os#1456 — sur sa demande — SANS que rien ne les dessine : soixante-trois cles `icon_*`
// offertes a l auteur, lues par aucun trace. Un onglet inerte est pire que pas d onglet.
describe('os#1465 un secteur nomme sa filiere par son pictogramme', () => {

  const buildSource = () => {
    const doc = new Class_ApplicationData(false)
    doc.drawing_area.bypass_redraws = true
    return doc
  }

  /** Une figure dont le document connait un pictogramme, comme un vrai document en connait. */
  //
  // ⚠️ `icon_is_visible` est FAUX par defaut, et ce n est pas un oubli : c est la regle du
  // diagramme. Sur un noeud aussi, `DrawLabel.drawIcon` exige la visibilite avant le nom — on
  // ACTIVE l icone dans son onglet, puis on la choisit. Une part suit la meme regle, sans quoi
  // deux objets du meme produit se regleraient autrement.
  const figureAvecCatalogue = () => {
    const source = buildSource()
    const figure = buildParts(source, [{ id: 'n_ble', label: 'Ble', value: 6 }],
      undefined, 'sunburst')
    figure.document.drawing_area.sankey.icon_catalog = { epi: 'M0 0 L10 10' }
    return figure
  }

  it('la part qui nomme une icone en resout le CHEMIN', () => {
    // Le trace ne recoit jamais un nom : il recoit un `d` deja sorti du catalogue. C est ce qui le
    // garde sans dependance au modele, comme pour tout le reste de l aspect.
    const figure = figureAvecCatalogue()
    const part = figure.by_id['n_ble']
    part.icon_is_visible = true
    part.icon_icon_name = 'epi'

    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part).icon_path).toBe('M0 0 L10 10')
  })

  it('une part qui ne nomme rien na pas dicone', () => {
    // LA GARANTIE DU LOT. Une couronne enregistree avant aujourd hui n a aucune part qui nomme une
    // icone : elle se rouvre donc a l identique. Et le nom est lu PAR LA PORTE, jamais resolu —
    // sans quoi un nom porte par le style par defaut couvrirait le parc de pictogrammes.
    const figure = figureAvecCatalogue()

    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_ble']).icon_path)
      .toBeUndefined()
  })

  it('un nom que le catalogue ne connait pas ne donne pas dicone', () => {
    // `getIconFromCatalog` rend une chaine vide sur un nom inconnu : on ne pose pas un chemin vide
    // dans l aspect, sinon le trace dessinerait un `path` sans `d` et le libelle aurait disparu
    // pour rien.
    const figure = figureAvecCatalogue()
    figure.by_id['n_ble'].icon_is_visible = true
    figure.by_id['n_ble'].icon_icon_name = 'pictogramme_absent'

    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_ble']).icon_path)
      .toBeUndefined()
  })

  it('cacher licone la retire, meme nommee', () => {
    const figure = figureAvecCatalogue()
    const part = figure.by_id['n_ble']
    part.icon_is_visible = true
    part.icon_icon_name = 'epi'
    part.icon_is_visible = false

    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part).icon_path).toBeUndefined()
  })

  it('lauteur peut imposer lencre et la taille', () => {
    const figure = figureAvecCatalogue()
    const part = figure.by_id['n_ble']
    part.icon_is_visible = true
    part.icon_icon_name = 'epi'
    part.icon_color = '#FF0000'
    part.icon_box_width = 24

    const resolu = sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part)
    expect(resolu.icon_color).toBe('#FF0000')
    expect(resolu.icon_size).toBe(24)
  })

  it('sans document qui porte un catalogue, rien ne casse', () => {
    // Le contrat de part est STRUCTUREL : `sankey` y est facultatif, et un appelant qui fabrique
    // une part sans document doit obtenir « pas d icone », pas une exception.
    const sans = {
      isAttributeOverloaded: (a: string) => a === 'icon_icon_name',
      getElementProperty: (a: string) => a === 'icon_icon_name' ? 'epi' : true
    }

    expect(() => sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, sans)).not.toThrow()
    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, sans).icon_path).toBeUndefined()
  })
})

// os#1470 — COLLER LA VALEUR AU NOM, OU L EN DETACHER.
//
// Julien : « oui mais je crois qu il faut le faire ; l option par defaut c est d avoir les deux
// attaches. Cette option existe pour les flux je crois, donc reutilisons-la. »
//
// C est `value_label_stick_to_label`, la cle des flux, avec son mot deja traduit en sept langues :
// « Coller au libelle ». Rien a inventer, rien a declarer.
describe('os#1470 le nombre dune part se colle au nom ou sen detache', () => {

  const buildSource = () => {
    const doc = new Class_ApplicationData(false)
    doc.drawing_area.bypass_redraws = true
    return doc
  }
  const unePart = () => buildParts(buildSource(), [{ id: 'n_ble', label: 'Ble', value: 6 }],
    undefined, 'sunburst').by_id['n_ble']

  it('par defaut la part ne dit rien, et le trace garde son usage', () => {
    // LE POINT QUI PROTEGE LES DEUX PARCS. La cle vaut FAUX par defaut dans le catalogue, mais une
    // part n est ecoutee que sur ce qu elle DIT : tant qu elle se tait, le secteur reste colle et
    // l histogramme reste separe. Un defaut unique aurait change l aspect de l un des deux.
    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, unePart()).value_attached).toBeUndefined()
  })

  it('la part peut detacher son nombre', () => {
    const part = unePart()
    part.value_label_stick_to_label = false

    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part).value_attached).toBe(false)
  })

  it('et le recoller explicitement', () => {
    // Distinct de « absent » : une part qui a dit non puis oui doit pouvoir revenir.
    const part = unePart()
    part.value_label_stick_to_label = true

    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part).value_attached).toBe(true)
  })
})
