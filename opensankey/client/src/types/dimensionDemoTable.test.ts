import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag } from './Tag'
import type { Class_DataTagGroup } from './TagGroup'

// jest 27 / jsdom n expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — LA TABLE DE FAITS DU DIAGRAMME, pour un tableau croise dynamique.
//
// Julien, 29/09 : « avec demo-dimensions-hierarchisees tu peux me produire un fichier Excel duquel
// je puisse construire un tableau croise dynamique, que je voie l interface. »
//
// Le tableau croise dynamique est LA REFERENCE de cette interface : une dimension par axe, des
// niveaux qu on deplie, un agregat qui se recalcule. Mettre les memes donnees dans les deux permet
// de comparer les deux interfaces sur le meme fond, ce qu aucune capture d ecran ne montre.
//
// ⚠️ LES NOMBRES VIENNENT DU MODELE, pas d une re-derivation. On lit chaque cellule par
// `valueForDataTags`, c est-a-dire par le chemin qu emprunte le dessin : une table fabriquee
// autrement pourrait etre juste et ne rien prouver — ou etre fausse sans qu on le voie.
//
// Ce n est pas un test de non-regression : il FABRIQUE un livrable, il est donc versionne (lecon
// de sa#283) et n ecrit que si DIMENSION_TABLE_OUT est fourni, pour ne rien deposer en CI.

const SOURCE = process.env.DIMENSION_DEMO_OUT
const SORTIE = process.env.DIMENSION_TABLE_OUT
const maybe = SOURCE !== undefined && fs.existsSync(SOURCE) ? describe : describe.skip

/**
 * Les cases de niveau d un membre, du plus agrege au plus fin.
 *
 * ⚠️ UNE BRANCHE COURTE REPETE SON DERNIER MEMBRE vers le bas. « Oleagineux » est une filiere sans
 * sous-niveau : laisser « Transformation » et « Produit » vides le ferait tomber dans un groupe
 * « (vide) » du tableau croise, a cote de ses freres, et le lecteur croirait a un trou de donnees.
 * En repetant, « Oleagineux » se retrouve a CHAQUE niveau — exactement ce que fait la regle des
 * hierarchies desequilibrees du diagramme (`Class_DataTagGroup.membersAtLevel`, qui montre un
 * membre moins profond quand il n a pas d enfant). Les deux interfaces disent donc la meme chose.
 */
function casesDeNiveau(dimension: Class_DataTagGroup, membre: Class_DataTag): string[] {
  const chaine: string[] = []
  let courant: Class_DataTag | undefined = membre
  while (courant !== undefined) {
    chaine.unshift(courant.name)
    courant = courant.parent
  }
  const cases = dimension.levels.map((_, rang) => chaine[rang] ?? chaine[chaine.length - 1])
  return cases
}

/** Les membres qui portent la donnee : les feuilles de la hierarchie. */
function feuilles(dimension: Class_DataTagGroup): Class_DataTag[] {
  return (dimension.tags_list as Class_DataTag[]).filter(membre => membre.children.length === 0)
}

maybe('os#1511 — table de faits pour un tableau croise dynamique', () => {
  test('une ligne par cellule renseignee du cube, les niveaux en colonnes', () => {
    const json = JSON.parse(zlib.gunzipSync(fs.readFileSync(SOURCE as string)).toString('utf-8'))
    const app = new Class_ApplicationData(false)
    app.fromJSON(json)
    const sankey = app.drawing_area.sankey

    const dimensions = sankey.data_taggs_list as unknown as Class_DataTagGroup[]
    const entetes = [
      'Origine', 'Destination',
      ...dimensions.flatMap(d => d.levels.map(niveau => `${d.name} — ${niveau}`)),
      'Valeur (kt)'
    ]

    const lignes: (string | number)[][] = []
    let total = 0
    sankey.links_list
      .filter(flux => !flux.id.includes('--par--'))
      .forEach(flux => {
        // Le produit cartesien des feuilles de chaque dimension. Le cube n en porte que deux ici ;
        // la boucle reste generale pour que le meme generateur serve au SOCLE, qui en a trois.
        const combiner = (rang: number, choix: Class_DataTag[]) => {
          if (rang === dimensions.length) {
            const valeur = flux.valueForDataTags(choix)
            // « Ce flux n existe pas ici » n est pas « il vaut 0 » (#161) : une cellule absente ne
            // fait pas de ligne. Un zero ecrit ferait compter un fait qui n existe pas.
            if (valeur === null) return
            lignes.push([
              flux.source.name, flux.target.name,
              ...choix.flatMap((membre, i) => casesDeNiveau(dimensions[i], membre)),
              valeur
            ])
            total += valeur
            return
          }
          feuilles(dimensions[rang]).forEach(membre => combiner(rang + 1, [...choix, membre]))
        }
        combiner(0, [])
      })

    // eslint-disable-next-line no-console
    console.log(`  ${lignes.length} lignes, total ${total} kt`)
    expect(lignes.length).toBeGreaterThan(0)

    if (SORTIE !== undefined) {
      fs.mkdirSync(path.dirname(SORTIE), { recursive: true })
      fs.writeFileSync(SORTIE, JSON.stringify({
        diagramme: sankey.name,
        entetes,
        lignes,
        total,
        // De quoi ecrire la feuille de lecture sans redire la hierarchie a la main.
        dimensions: dimensions.map(d => ({ nom: d.name, niveaux: d.levels }))
      }, null, 1), 'utf-8')
      // eslint-disable-next-line no-console
      console.log(`  TABLE ECRITE : ${SORTIE}`)
    }
  }, 120000)
})
