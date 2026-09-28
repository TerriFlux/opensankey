import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag } from './Tag'
import type { Class_DataTagGroup } from './TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 lot 3 — LE SOCLE « Pays partenaires » RAMENE A DEUX FLUX.
//
// Le fichier unique porte 649 noeuds et 34 004 flux, qui sont le produit cartesien de deux
// hierarchies : 148 produits d un cote, 248 pays a l export et 253 a l import de l autre. Chaque
// noeud declare son parent un par un — la parente appartient pourtant a l AXE, pas aux elements
// qui l affichent (regle 1).
//
// La forme visee : DEUX flux, l exporte et l importe, entre deux noeuds. Tout le reste devient
// des dimensions — produit, pays partenaire, annee — et les deux noeuds sont attaches a leur axe,
// donc se redecoupent a la demande.
//
// Ce n est pas un test de non-regression : il FABRIQUE un livrable, et n ecrit que si SOCLE_OUT
// est fourni, pour ne rien deposer en CI. Il lit SOCLE_SRC.

const SOURCE = process.env.SOCLE_SRC
const SORTIE = process.env.SOCLE_OUT

type Type_NoeudSource = {
  name?: string,
  dimensions?: { [axe: string]: { parent_name?: string } },
}
type Type_FluxSource = {
  idSource: string,
  idTarget: string,
  value?: { [cle: string]: { data_value?: number } | string },
}
type Type_Fichier = {
  nodes: { [id: string]: Type_NoeudSource },
  links: { [id: string]: Type_FluxSource },
  levelTags?: { [id: string]: { name?: string, tags?: { [id: string]: { name?: string } } } },
  dataTags?: { [id: string]: { tags?: { [id: string]: { name?: string } } } },
}

const AXE_PAYS = 'niveau partenaires'
const AXE_PRODUIT = 'niveau produits'

/** « Andorre_Export » et « Andorre_Import » designent LE MEME pays : c est un membre unique. */
const membrePays = (node_id: string): string =>
  node_id.replace(/_Export$/, '').replace(/_Import$/, '')

const maybe = SOURCE !== undefined && fs.existsSync(SOURCE) ? describe : describe.skip

maybe('os#1511 lot 3 — le SOCLE pays partenaires ramene a deux flux', () => {
  test('deux flux, trois dimensions, et les totaux du fichier source conserves', () => {
    const source = JSON.parse(
      zlib.gunzipSync(fs.readFileSync(SOURCE as string)).toString('utf-8')
    ) as Type_Fichier

    // ---- 1. Relever les deux hierarchies, telles que les NOEUDS les declarent -------------
    const axe_de: { [node_id: string]: string } = {}
    Object.entries(source.nodes).forEach(([nid, n]) => {
      Object.keys(n.dimensions ?? {}).forEach(axe => { axe_de[nid] = axe })
    })

    /** membre -> parent, pour un axe. Les deux arbres pays (export, import) se superposent. */
    const releverParents = (axe: string, cle: (nid: string) => string) => {
      const parents: { [membre: string]: string | undefined } = {}
      const noms: { [membre: string]: string } = {}
      const conflits: string[] = []
      Object.entries(source.nodes).forEach(([nid, n]) => {
        if (axe_de[nid] !== axe) return
        const membre = cle(nid)
        const parent_brut = (n.dimensions ?? {})[axe]?.parent_name
        const parent = parent_brut !== undefined ? cle(parent_brut) : undefined
        if (membre in parents && parents[membre] !== parent) conflits.push(membre)
        parents[membre] = parent
        // « Andorre - Export » et « Andorre - Import » nomment le meme pays : on garde le nom
        // sans son suffixe de sens, qui n a plus lieu d etre une fois le sens porte par le flux.
        noms[membre] = (n.name ?? membre).replace(/\s*-\s*(Export|Import)$/, '')
      })
      return { parents, noms, conflits }
    }

    const pays_src = releverParents(AXE_PAYS, membrePays)
    const produit_src = releverParents(AXE_PRODUIT, (nid: string) => nid)
    // Un membre dont les deux arbres donneraient des parents differents serait une donnee
    // contradictoire : on veut le savoir, pas le moyenner.
    expect(pays_src.conflits).toEqual([])
    expect(produit_src.conflits).toEqual([])

    const niveaux = (axe: string): string[] => {
      const groupe = (source.levelTags ?? {})[axe]
      return Object.values(groupe?.tags ?? {}).map(t => t.name ?? '')
    }

    // ---- 2. Batir le nouveau diagramme ---------------------------------------------------
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    sankey.name = 'SOCLE — Pays partenaires (dimensions)'

    const poserDimension = (
      id: string, nom: string,
      src: { parents: { [m: string]: string | undefined }, noms: { [m: string]: string } },
      noms_niveaux: string[]
    ) => {
      const dim = sankey.addDataTagGroup(id, nom, false) as unknown as Class_DataTagGroup
      Object.keys(src.parents).forEach(membre => dim.addTag(src.noms[membre], membre))
      Object.entries(src.parents).forEach(([membre, parent]) => {
        if (parent === undefined) return
        const enfant = dim.tags_dict[membre] as Class_DataTag
        const pere = dim.tags_dict[parent] as Class_DataTag
        if (enfant !== undefined && pere !== undefined) enfant.parent = pere
      })
      dim.levels = noms_niveaux
      dim.banner = 'one'
      return dim
    }

    // L ORDRE compte : l arbre de valeurs porte un etage par dimension, dans cet ordre.
    const produit = poserDimension('produit', 'Produit', produit_src, niveaux(AXE_PRODUIT))
    const pays = poserDimension('pays', 'Pays partenaire', pays_src, niveaux(AXE_PAYS))
    const annee = sankey.addDataTagGroup('annee', 'Année', false) as unknown as Class_DataTagGroup
    const annees = Object.keys((source.dataTags ?? {})['annee']?.tags ?? {})
    annees.forEach(an => annee.addTag(an, an))
    annee.banner = 'sequence'

    const n_produits = sankey.addNewNodeWithName('Produits agricoles')
    const n_pays = sankey.addNewNodeWithName('Monde')
    n_produits.setPosXY(120, 320)
    n_pays.setPosXY(760, 320)
    // UN SEUL noeud attache, celui des pays. Attacher les deux fait se CROISER les deux
    // decoupes — 14 filieres x 8 regions = 270 flux des l ouverture, 124 s de chargement
    // (mesure du 28/09). Le croisement n est pas faux, mais il ne doit pas etre l etat
    // d ouverture : on part du plus agrege, et l on ouvre ce qu on veut voir.
    n_pays.driving_dimension = pays

    const exporte = sankey.addNewLinkWithId('exporte', n_produits, n_pays)
    const importe = sankey.addNewLinkWithId('importe', n_pays, n_produits)

    // ---- 3. Verser les valeurs ------------------------------------------------------------
    // On vise une coordonnee en posant la selection, et on ne change que l etiquette qui varie :
    // vider les 404 etiquettes a chaque valeur couterait 34 004 fois ce balayage.
    const courant: { [groupe: string]: Class_DataTag | undefined } = {}
    const viser = (dim: Class_DataTagGroup, membre_id: string) => {
      const membre = dim.tags_dict[membre_id] as Class_DataTag | undefined
      if (membre === undefined || membre === courant[dim.id]) return membre !== undefined
      courant[dim.id]?.setUnSelected()
      membre.setSelected()
      courant[dim.id] = membre
      return true
    }

    let verses = 0
    let ignores = 0
    let total_export_2015 = 0
    Object.values(source.links).forEach(l => {
      const sens_export = axe_de[l.idTarget] === AXE_PAYS
      const node_pays = sens_export ? l.idTarget : l.idSource
      const node_produit = sens_export ? l.idSource : l.idTarget
      const lien = sens_export ? exporte : importe
      if (!viser(produit, node_produit) || !viser(pays, membrePays(node_pays))) {
        ignores++
        return
      }
      Object.entries(l.value ?? {}).forEach(([cle, brut]) => {
        if (cle === 'datatag_group' || typeof brut !== 'object') return
        const nombre = brut.data_value
        if (nombre === undefined || nombre === null) return
        if (!viser(annee, cle)) return
        const valeur = lien.value as Class_LinkValue | null
        if (valeur === null) return
        valeur.valueData = nombre
        verses++
        if (sens_export && node_produit === 'Produits_agricoles'
          && membrePays(node_pays) === 'Monde' && cle === '2015') {
          total_export_2015 = nombre
        }
      })
    })

    // ---- 4. Ce qui doit etre vrai avant d ecrire -------------------------------------------
    expect(sankey.links_list.length).toBe(2)
    expect(sankey.nodes_list.length).toBe(2)
    expect(ignores).toBe(0)
    expect(verses).toBeGreaterThan(90000)
    // Le total general de 2015, tel que le fichier source le portait sur son flux racine.
    expect(total_export_2015).toBeCloseTo(59317.591, 3)
    // Et tel que le NOUVEAU fichier le rend, en visant la racine des deux hierarchies.
    viser(produit, 'Produits_agricoles')
    viser(pays, 'Monde')
    viser(annee, '2015')
    expect((exporte.value as Class_LinkValue).valueData).toBeCloseTo(59317.591, 3)

    // eslint-disable-next-line no-console
    console.log(`produits : ${produit.tags_list.length} membres, ${produit.levels.length} niveaux`)
    // eslint-disable-next-line no-console
    console.log(`pays : ${pays.tags_list.length} membres, ${pays.levels.length} niveaux`)
    // eslint-disable-next-line no-console
    console.log(`valeurs versees : ${verses} (source : ${Object.keys(source.links).length} flux)`)

    if (SORTIE !== undefined) {
      const json = app.toJSON()
      fs.mkdirSync(path.dirname(SORTIE), { recursive: true })
      fs.writeFileSync(SORTIE, zlib.gzipSync(Buffer.from(JSON.stringify(json), 'utf-8')))
      // eslint-disable-next-line no-console
      console.log(`FICHIER ECRIT : ${SORTIE} (${fs.statSync(SORTIE).size} octets)`)
    }
  }, 600000)
})
