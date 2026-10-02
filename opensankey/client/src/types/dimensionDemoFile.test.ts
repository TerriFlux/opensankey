import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from './ApplicationData'
import { NodeLeftExtremityStyle, NodeRightExtremityStyle } from '../Elements/ElementStyle'
import type { Class_DataTag } from './Tag'
import type { Class_DataTagGroup } from './TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import {
  disaggregateDimensionNodes,
  isGeneratedMemberLink,
  removeGeneratedMemberNodes,
} from '../Algorithms/DimensionDisaggregation'

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

// os#1511 (sa!820) — VARIANTE « RESULTATS » : chaque valeur saisie recoit en plus un resultat
// reconcilie NETTEMENT different, pour voir quelle couche lit un noeud engendre. Avant sa!820, en
// mode resultats, les noeuds engendres montraient la donnee saisie : avec deux couches egales, on
// ne voyait rien. L ecart depend du PAYS (axe dessine en noeuds) et de la FILIERE (axe dessine en
// bandes, d ou `banner = 'multi'`), de sorte que chaque noeud et chaque bande ait son propre ecart.
// Une sortie en `.json` s ecrit en clair, avec son jumeau `.json.gz` a cote.
const RESULTATS = process.env.DIMENSION_DEMO_RESULTS === '1'
const ECART_PAYS: { [pays: string]: number } = {
  'espagne': 1.10, 'italie': 0.80, 'maroc': 1.30, 'egypte': 0.90,
}
const ECART_FILIERE: { [filiere: string]: number } = {
  'ble': 1.00, 'mais': 1.20, 'farine': 0.85, 'malt': 1.10, 'oleagineux': 1.25,
}
function resultatReconcilie(filiere_id: string, pays_id: string, nombre: number): number {
  return Math.round(nombre * ECART_PAYS[pays_id] * ECART_FILIERE[filiere_id])
}

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
    sankey.name = RESULTATS
      ? 'Démo — dimensions hiérarchisées (données et résultats)'
      : 'Démo — dimensions hiérarchisées'

    // Les dimensions AVANT le flux : son arbre de valeurs porte alors un etage par dimension.
    const filiere = sankey.addDataTagGroup('filiere', 'Filière', false) as unknown as Class_DataTagGroup
    Object.keys(FILIERES).forEach(id => filiere.addTag(NOMS_FILIERE[id], id))
    Object.entries(FILIERES).forEach(([id, parent_id]) => {
      if (parent_id === null) return
      const membre = filiere.tags_dict[id] as Class_DataTag
      membre.parent = filiere.tags_dict[parent_id] as Class_DataTag
    })
    filiere.levels = ['ensemble', 'filières', 'transformation', 'produits']
    // En variante resultats, la filiere se dessine EN BANDES (choix multiple) : on compare ainsi
    // les deux chemins de lecture, bandes d un flux et noeuds engendres.
    filiere.banner = RESULTATS ? 'multi' : 'one'
    if (RESULTATS) {
      // Des bandes toutes grises ne se distingueraient pas : une couleur par membre.
      const COULEURS: { [id: string]: string } = {
        'cereales': '#d9a441', 'oleagineux': '#5b8c3a',
        'cereales-brutes': '#c98a2b', 'cereales-transformees': '#e6c27a',
        'ble': '#b5781f', 'mais': '#f0b93a', 'farine': '#e8d3a1', 'malt': '#9c6b30',
      }
      Object.entries(COULEURS).forEach(([id, couleur]) => { (filiere.tags_dict[id] as Class_DataTag).color = couleur })
    }

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
    // os#1511 lot 2 — « Partenaires » N EST PAS un noeud ordinaire : il EST l axe des pays. Au
    // niveau des regions il se remplacera par Europe et Afrique, au niveau des pays par les
    // quatre. Sans cet attachement, le fichier ne montrait qu un seul flux, quel que soit le
    // niveau choisi — ce que Julien a vu a l ecran le 28/09.
    partenaires.driving_dimension = pays
    // os#1511 (retour de Julien, 30/09) — LES STYLES D EXTREMITE, que la mise en page automatique
    // pose d apres la connectivite (`setNodeLabelPositioning`) et qu un fichier fabrique a la main
    // n a jamais recus. Sans eux, le nom se pose AU MILIEU du noeud, par-dessus lui ; avec eux, il
    // se pose du cote libre — a gauche d une source, a droite d un puits.
    //
    // Les noeuds de membre en heritent a la desagregation : ils occupent la colonne de leur axe et
    // se branchent sur les memes voisins, donc ils ont la meme extremite.
    const style_gauche = sankey.styles_dict[NodeLeftExtremityStyle]
    const style_droite = sankey.styles_dict[NodeRightExtremityStyle]
    if (style_gauche !== undefined) france.addStyle(style_gauche)
    if (style_droite !== undefined) partenaires.addStyle(style_droite)
    france.setPosXY(80, 260)
    partenaires.setPosXY(520, 260)
    // La geometrie est portee par le MEMBRE : c est elle qui survit a la regeneration des
    // noeuds engendres. On etale les membres pour qu ils ne s empilent pas au premier abord.
    const PLACES: { [id: string]: { x: number, y: number } } = {
      'europe': { x: 520, y: 150 }, 'afrique': { x: 520, y: 380 },
      'espagne': { x: 520, y: 80 }, 'italie': { x: 520, y: 220 },
      'maroc': { x: 520, y: 340 }, 'egypte': { x: 520, y: 460 },
    }
    Object.entries(PLACES).forEach(([id, place]) => {
      (pays.tags_dict[id] as Class_DataTag).position = place
    })

    let total_saisi = 0
    let total_resultat = 0
    const resultat_par_pays: { [pays: string]: number } = {}
    Object.entries(VALEURS).forEach(([filiere_id, par_pays]) => {
      Object.entries(par_pays).forEach(([pays_id, nombre]) => {
        viser(filiere, filiere_id)
        viser(pays, pays_id)
        const valeur = exportations.value as Class_LinkValue
        valeur.valueData = nombre
        total_saisi += nombre
        if (RESULTATS) {
          // APRES la donnee : `valueData` remet le resultat a null.
          const resultat = resultatReconcilie(filiere_id, pays_id, nombre)
          valeur.valueResult = resultat
          total_resultat += resultat
          resultat_par_pays[pays_id] = (resultat_par_pays[pays_id] ?? 0) + resultat
        }
      })
    })

    // Le fichier s ouvre au niveau le plus agrege : un seul flux, le total.
    filiere.selectAllAtLevel(0)
    pays.selectAllAtLevel(0)

    // L ECHELLE, sans quoi le diagramme s ouvre avec des flux minuscules dans un coin —
    // constate a l ecran. Le SOCLE, qui est bien regle, prend un dixieme de son total : on
    // garde ce rapport plutot que d inventer un nombre.
    app.drawing_area.scale = 1385 / 10

    // L INVARIANT qui rend le fichier utile : au niveau le plus agrege, le flux vaut la somme
    // de toutes les feuilles saisies — sans qu aucun total n ait ete ecrit nulle part.
    const contributions = exportations.contributing_values
    const total_agrege = (contributions ?? []).reduce((t, v) => t + (v.valueData ?? 0), 0)
    expect(total_agrege).toBe(total_saisi)
    expect(total_agrege).toBe(1385)
    // Et l invariant tel que le DESSIN le lit, qui est ce que Julien regarde : un flux sans
    // valeur ne prouve rien, meme si l agregat est juste par ailleurs.
    // A l ouverture, la couche lue est le reconcilie (`type_data` par defaut) : sans resultat, il
    // retombe sur la donnee saisie ; avec, il doit rendre la somme des RESULTATS.
    expect(exportations.valueCurrent).toBe(RESULTATS ? total_resultat : 1385)
    if (RESULTATS) {
      expect(total_resultat).not.toBe(total_saisi)
      app.drawing_area.type_data = 'data'
      expect(exportations.valueCurrent).toBe(1385)
      app.drawing_area.type_data = 'free_value'
      expect(exportations.valueCurrent).toBe(total_resultat)
    }

    // Le second invariant, celui du lot 2 : le noeud d axe se decoupe sur les membres CHOISIS,
    // et le flux se repartit sans rien perdre en chemin. On choisit ici le niveau des regions,
    // ce qui coche les deux d un coup.
    pays.selectAllAtLevel(1)
    expect(disaggregateDimensionNodes(sankey)).toBe(2)
    const par_membre = sankey.links_list.filter(isGeneratedMemberLink)
    expect(par_membre.map(l => l.target.name).sort()).toEqual(['Afrique', 'Europe'])
    expect(par_membre.reduce((t, l) => t + (l.value?.valueData ?? 0), 0)).toBe(1385)
    if (RESULTATS) {
      // Ce que sa!820 garantit : le noeud engendre porte les DEUX couches, et le dessin lit le
      // resultat en mode reconcilie. Europe = Espagne + Italie, Afrique = Maroc + Egypte.
      const attendu: { [nom: string]: number } = {
        'Europe': resultat_par_pays['espagne'] + resultat_par_pays['italie'],
        'Afrique': resultat_par_pays['maroc'] + resultat_par_pays['egypte'],
      }
      par_membre.forEach(l => {
        expect(l.value?.valueResult).toBe(attendu[l.target.name])
        expect(l.value?.valueResult).not.toBe(l.value?.valueData)
        expect(l.valueCurrent).toBe(attendu[l.target.name])
        // eslint-disable-next-line no-console
        console.log(`  ${l.target.name} : saisi ${l.value?.valueData} kt, reconcilie ${l.value?.valueResult} kt`)
      })
    }
    // On rend le fichier a son etat d ouverture : les noeuds engendres ne s ecrivent pas, et
    // l on repart du niveau le plus agrege.
    removeGeneratedMemberNodes(sankey)
    pays.selectAllAtLevel(0)
    if (RESULTATS) {
      // La variante s ouvre la ou les deux lectures se comparent d un coup d oeil : les filieres
      // en bandes (Cereales, Oleagineux), les regions en noeuds (Europe, Afrique). Les noeuds
      // engendres se refont au premier dessin.
      filiere.selectAllAtLevel(1)
      pays.selectAllAtLevel(1)
    }

    if (SORTIE !== undefined) {
      const texte = JSON.stringify(app.toJSON())
      fs.mkdirSync(path.dirname(SORTIE), { recursive: true })
      const ecrits = SORTIE.endsWith('.json') ? [SORTIE, `${SORTIE}.gz`] : [SORTIE]
      if (SORTIE.endsWith('.json')) fs.writeFileSync(SORTIE, texte, 'utf-8')
      fs.writeFileSync(ecrits[ecrits.length - 1], zlib.gzipSync(Buffer.from(texte, 'utf-8')))
      const totaux = RESULTATS ? `saisi ${total_agrege} kt, reconcilie ${total_resultat} kt` : `total ${total_agrege} kt`
      // eslint-disable-next-line no-console
      console.log(`FICHIER ECRIT : ${ecrits.join(' + ')} (${totaux})`)
    }
  })
})
