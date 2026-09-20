// os#1451 — L ADAPTATEUR DES BARRES : CE QU UNE PART DESIGNE.
//
// LE POINT QUE JULIEN A CORRIGE LUI-MEME, et qui a fait refaire le chantier une fois : une part
// n est PAS toujours un noeud. Selon l axe, elle est un FLUX, une SOMME de flux sous une etiquette,
// un NOEUD enfant — ou rien du tout. Les quatre sortes se verifient ici, une par une, plus les deux
// regles qui les gouvernent : l ordre du trace est conserve, et un identifiant introuvable rend
// `none` et jamais une reference inventee.
//
// Le diagramme regarde est reduit a ses REGISTRES (noeuds, flux, groupes d etiquettes) : c est tout
// ce que l adaptateur lit, et le declarer ainsi montre noir sur blanc qu il ne devine rien
// d ailleurs.

import type { Class_NodeElement } from '../../Elements/Node'
import type { Type_AnalysisDescriptor } from '../../Charts/AnalysisDescriptor'

import { analysisPartInputs, analysisPartSubject } from './analysisParts'
import type { Type_ChartPart, Type_ChartSubject } from '../../Charts/AnalysisChartData'

// Le document : deux noeuds, deux flux, un groupe d etiquettes de flux et un de donnees.
const ble = { id: 'n_ble', name: 'Ble' }
const mais = { id: 'n_mais', name: 'Mais' }
const flux_amont = { id: 'l_amont', name: 'Amont vers Ble' }
const flux_aval = { id: 'l_aval', name: 'Ble vers Aval' }
const tag_produit = { id: 't_grain', name: 'Grain' }
const tag_annee = { id: 't_2019', name: '2019' }

const sankey = {
  nodes_dict: { n_ble: ble, n_mais: mais },
  links_dict: { l_amont: flux_amont, l_aval: flux_aval },
  flux_taggs_dict: { produit: { tags_list: [tag_produit] } },
  data_taggs_dict: { annee: { tags_list: [tag_annee] } }
}

/** Le sujet regarde : le noeud « Ble », qui porte le registre ci-dessus. */
const subject: Type_ChartSubject = {
  kind: 'node',
  node: { ...ble, sankey } as unknown as Class_NodeElement
}

const descriptor = (d: Partial<Type_AnalysisDescriptor>): Type_AnalysisDescriptor =>
  ({ decompose: null, compare: null, ...d })

const part = (id: string, value = 1): Type_ChartPart => ({ id, label: id, value })

describe('os#1451 les quatre sortes de sujets dune part de barres', () => {

  it('decomposer par flux sortants : une part est un FLUX, et le flux lui-meme', () => {
    // Le flux LUI-MEME et non une copie de son nom : c est ce qui fait qu un renommage ailleurs
    // change ce que la barre affiche, tant qu elle ne porte pas d alias.
    const found = analysisPartSubject(
      subject, descriptor({ decompose: { kind: 'outputs' } }), 'l_aval'
    )

    expect(found.kind).toBe('flux')
    expect(found.kind === 'flux' && found.link).toBe(flux_aval)
  })

  it('decomposer par flux GROUPES : une part est une ETIQUETTE, aucun element unique derriere', () => {
    // Sous `group_by`, une part est l addition de tous les flux portant l etiquette. C est le cas
    // qui interdit de reduire une part a un element : l etiquette est ce qu elle DESIGNE, pas ce
    // qu elle EST.
    const found = analysisPartSubject(
      subject,
      descriptor({ decompose: { kind: 'outputs', group_by_flux_tagg_id: 'produit' } }),
      't_grain'
    )

    expect(found.kind).toBe('tag')
    expect(found.kind === 'tag' && found.tag).toBe(tag_produit)
  })

  it('decomposer par noeuds enfants : une part est un NOEUD', () => {
    const found = analysisPartSubject(
      subject, descriptor({ decompose: { kind: 'node_children', dimension_id: 'dim' } }), 'n_mais'
    )

    expect(found.kind).toBe('node')
    expect(found.kind === 'node' && found.node).toBe(mais)
  })

  it('un secteur de complement ou un identifiant introuvable ne designe RIEN', () => {
    // Aucune reference fabriquee : une part qui designerait un flux disparu afficherait un nom mort
    // et renommerait dans le vide.
    const found = analysisPartSubject(
      subject, descriptor({ decompose: { kind: 'outputs' } }), 'l_disparu'
    )

    expect(found.kind).toBe('none')
    expect(found).not.toHaveProperty('link')
    expect(found).not.toHaveProperty('node')
  })
})

describe('os#1451 les axes qui ne decomposent pas', () => {

  it('comparer selon les flux : une barre par flux, donc un FLUX', () => {
    // #389 — chaque serie EST un flux, et le trace en fait une barre.
    const found = analysisPartSubject(
      subject, descriptor({ compare: { kind: 'inputs' } }), 'l_amont'
    )

    expect(found.kind).toBe('flux')
  })

  it('comparer selon des etiquettes de donnees : la part porte le SUJET, sous ce millesime', () => {
    // Sans axe additif, l analyse rend une part dont l identifiant est celui du sujet : « la valeur
    // de CE noeud, cette annee-la ». La part designe donc le noeud regarde.
    const found = analysisPartSubject(
      subject, descriptor({ compare: { data_tagg_id: 'annee' } }), 'n_ble'
    )

    expect(found.kind).toBe('node')
    expect(found.kind === 'node' && found.node.id).toBe('n_ble')
  })

  it('une etiquette du groupe compare se retrouve aussi, quand cest elle qui nomme la barre', () => {
    // Croisement de deux axes (#390) : la barre porte l identifiant de l entree d axe.
    const found = analysisPartSubject(
      subject, descriptor({ compare: { data_tagg_id: 'annee' } }), 't_2019'
    )

    expect(found.kind).toBe('tag')
  })

  it('un groupe detiquettes introuvable ne fabrique pas detiquette', () => {
    const found = analysisPartSubject(
      subject, descriptor({ compare: { data_tagg_id: 'groupe_efface' } }), 't_2019'
    )

    expect(found.kind).toBe('none')
  })
})

describe('os#1451 des parts de lanalyse aux entrees de buildParts', () => {

  it('lordre des barres est conserve, et chaque part sait ce quelle designe', () => {
    // L ordre est celui du trace : c est sous lui que « la troisieme barre » veut dire quelque
    // chose. Le classement (`parts_order`) est un reglage du GRAPHE, applique par le trace.
    const inputs = analysisPartInputs(
      subject,
      descriptor({ decompose: { kind: 'outputs' } }),
      [part('l_aval', 6), part('l_disparu', 3), part('l_amont', 1)]
    )

    expect(inputs.map(p => p.id)).toEqual(['l_aval', 'l_disparu', 'l_amont'])
    expect(inputs.map(p => p.subject?.kind)).toEqual(['flux', 'none', 'flux'])
  })

  it('le libelle, la valeur et la couleur du modele suivent la part', () => {
    const inputs = analysisPartInputs(
      subject,
      descriptor({ decompose: { kind: 'outputs' } }),
      [{ id: 'l_aval', label: 'Vers Aval', value: 12, color: '#123456' }]
    )

    expect(inputs[0].label).toBe('Vers Aval')
    expect(inputs[0].value).toBe(12)
    expect(inputs[0].color).toBe('#123456')
  })

  it('une part sans couleur imposee nen porte aucune : la palette de la figure commande', () => {
    const inputs = analysisPartInputs(
      subject, descriptor({ decompose: { kind: 'outputs' } }), [part('l_aval')]
    )

    expect(inputs[0].color).toBeUndefined()
  })

  it('un groupe de flux introuvable redonne des FLUX, comme la decomposition le fait', () => {
    // `decomposeSubject` passe alors `undefined` a `decomposeNodeFlows`, qui retombe sur une part
    // par flux. L adaptateur lit le modele comme la decomposition le lit, pas comme le descripteur
    // l annonce — sinon des parts qui sont des flux se diraient « rien ».
    const inputs = analysisPartInputs(
      subject,
      descriptor({ decompose: { kind: 'outputs', group_by_flux_tagg_id: 'groupe_efface' } }),
      [part('l_aval')]
    )

    expect(inputs[0].subject?.kind).toBe('flux')
  })
})
