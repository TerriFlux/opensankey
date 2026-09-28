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

// os#1511 — GENERATEUR d un petit fichier d essai portant deux dimensions HIERARCHISEES.
//
// Aucun fichier existant n a de hierarchie : `levels` et `parent` ne sont ecrits que s ils
// existent, donc le lot 1 ne change rien a ce qui est deja en production. Pour VOIR le
// comportement, il faut un fichier qui en declare — celui-ci.
//
// Ce n est pas un test de non-regression : il FABRIQUE un livrable. C est pourquoi il est
// versionne (lecon de sa#283 : un script qui produit un livrable n est pas temporaire).
// Il n ecrit que si DIMENSION_DEMO_OUT est fourni, pour ne rien deposer en CI.

const SORTIE = process.env.DIMENSION_DEMO_OUT

const FILIERES: { [membre: string]: string | null } = {
  // membre -> parent
  'tous-produits': null,       // RACINE UNIQUE : sans elle, le total general n est
                               // atteignable par aucune selection (voir le commentaire
                               // en tete du fichier).
  'cereales': 'tous-produits',
  'oleagineux': 'tous-produits',  // BRANCHE COURTE : aucun enfant, pour voir la regle
  'cereales-brutes': 'cereales',
  'cereales-transformees': 'cereales',
  'ble': 'cereales-brutes',
  'mais': 'cereales-brutes',
  'farine': 'cereales-transformees',
  'malt': 'cereales-transformees',
}
const NOMS_FILIERE: { [id: string]: string } = {
  'tous-produits': 'Tous produits',
  'cereales': 'Céréales',
  'oleagineux': 'Oléagineux',
  'cereales-brutes': 'Céréales brutes',
  'cereales-transformees': 'Céréales transformées',
  'ble': 'Blé',
  'mais': 'Maïs',
  'farine': 'Farine',
  'malt': 'Malt',
}

const PAYS: { [membre: string]: string | null } = {
  'monde': null,
  'europe': 'monde',
  'afrique': 'monde',
  'espagne': 'europe',
  'italie': 'europe',
  'maroc': 'afrique',
  'egypte': 'afrique',
}
const NOMS_PAYS: { [id: string]: string } = {
  'monde': 'Monde',
  'europe': 'Europe',
  'afrique': 'Afrique',
  'espagne': 'Espagne',
  'italie': 'Italie',
  'maroc': 'Maroc',
  'egypte': 'Égypte',
}

// Valeurs SAISIES aux seules feuilles, en kt. Les niveaux au-dessus s en deduisent : c est
// tout l objet de l agregat.
const VALEURS: { [filiere: string]: { [pays: string]: number } } = {
  'ble':    { 'espagne': 120, 'italie': 90, 'maroc': 260, 'egypte': 310 },
  'mais':   { 'espagne': 80, 'italie': 45, 'maroc': 30, 'egypte': 25 },
  'farine': { 'espagne': 15, 'italie': 12, 'maroc': 140, 'egypte': 60 },
  'malt':   { 'espagne': 40, 'italie': 35, 'maroc': 10, 'egypte': 8 },
  // Les oleagineux n ont pas de sous-niveau : la donnee est portee par le membre lui-meme.
  'oleagineux': { 'espagne': 55, 'italie': 20, 'maroc': 18, 'egypte': 12 },
}

function viser(groupe: Class_DataTagGroup, membre_id: string) {
  groupe.tags_list.forEach(tag => tag.setUnSelected())
  const membre = groupe.tags_dict[membre_id] as Class_DataTag
  membre.setSelected()
}

describe('os#1511 — fichier d essai a dimensions hierarchisees', () => {
  test('fabrique un diagramme dont les totaux se deduisent des feuilles', () => {
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    sankey.name = 'Démo — dimensions hiérarchisées'

    // Les dimensions AVANT le flux : son arbre de valeurs porte alors un etage par dimension.
    const filiere = sankey.addDataTagGroup('filiere', 'Filière', false) as unknown as Class_DataTagGroup
    Object.keys(FILIERES).forEach(id => filiere.addTag(NOMS_FILIERE[id], id))
    Object.entries(FILIERES).forEach(([id, parent_id]) => {
      if (parent_id === null) return
      const membre = filiere.tags_dict[id] as Class_DataTag
      membre.parent = filiere.tags_dict[parent_id] as Class_DataTag
    })
    filiere.levels = ['ensemble', 'filières', 'transformation', 'produits']
    filiere.banner = 'one'

    const pays = sankey.addDataTagGroup('pays', 'Pays partenaire', false) as unknown as Class_DataTagGroup
    Object.keys(PAYS).forEach(id => pays.addTag(NOMS_PAYS[id], id))
    Object.entries(PAYS).forEach(([id, parent_id]) => {
      if (parent_id === null) return
      const membre = pays.tags_dict[id] as Class_DataTag
      membre.parent = pays.tags_dict[parent_id] as Class_DataTag
    })
    pays.levels = ['monde', 'régions continentales', 'pays']
    pays.banner = 'one'

    const france = sankey.addNewNodeWithName('France')
    const partenaires = sankey.addNewNodeWithName('Partenaires')
    const exportations = sankey.addNewLink(france, partenaires)

    let total_saisi = 0
    Object.entries(VALEURS).forEach(([filiere_id, par_pays]) => {
      Object.entries(par_pays).forEach(([pays_id, nombre]) => {
        viser(filiere, filiere_id)
        viser(pays, pays_id)
        const valeur = exportations.value as Class_LinkValue
        valeur.valueData = nombre
        total_saisi += nombre
      })
    })

    // Le fichier s ouvre au niveau le plus agrege : un seul flux, le total.
    filiere.selectLevel(0)
    pays.selectLevel(0)

    // L INVARIANT qui rend le fichier utile : au niveau le plus agrege, le flux vaut la somme
    // de toutes les feuilles saisies — sans qu aucun total n ait ete ecrit nulle part.
    const contributions = exportations.contributing_values
    const total_agrege = (contributions ?? []).reduce((t, v) => t + (v.valueData ?? 0), 0)
    expect(total_agrege).toBe(total_saisi)
    expect(total_agrege).toBe(1385)

    if (SORTIE !== undefined) {
      const json = app.toJSON()
      fs.mkdirSync(path.dirname(SORTIE), { recursive: true })
      fs.writeFileSync(SORTIE, zlib.gzipSync(Buffer.from(JSON.stringify(json), 'utf-8')))
      // eslint-disable-next-line no-console
      console.log(`FICHIER ECRIT : ${SORTIE} (${fs.statSync(SORTIE).size} octets, total ${total_agrege} kt)`)
    }
  })
})
