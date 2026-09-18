import * as fs from 'fs'
import * as path from 'path'
import { Class_ApplicationData } from '../types/ApplicationData'

/**
 * Changer de niveau hierarchique ne doit jamais VIDER une vue de tutoriel.
 *
 * Vecu (17/09/2026) : sur « Etiquettes et hierarchies », passer de « Agrege » a
 * « Par essence » ne laissait plus rien a l'ecran. Les 14 noeuds etrangers a la
 * dimension portaient quand meme `tags.essence = ["1"]` ; depuis 9ba518079, un
 * noeud qui porte un tag d'un groupe de niveaux ACTIVE n'est visible qu'aux
 * niveaux qu'il porte. Les deux enfants restants devenaient orphelins, et le
 * diagramme tombait a zero noeud.
 *
 * Le chargement seul ne montre RIEN : les `force_show_*` ecrits dans le fichier
 * forcent l'affichage et court-circuitent le filtre par tags. Il faut rejouer le
 * geste — selection du niveau puis `showAccordingToLevelTags()`, la fin de
 * `applyLevelSelection` (Toolbar.tsx) en desagregation uniforme simple.
 */

function findTutorialsDir(): string | null {
  let dir = __dirname
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, 'SankeyData', 'tutorials')
    if (fs.existsSync(path.join(candidate, 'index.json'))) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

type Type_Groupe = { activated?: boolean, tags: { [id: string]: object } }
type Type_Vue = { name?: string, levelTags?: { [g: string]: Type_Groupe } }
type Type_Fichier = { current_view?: string, views?: { [id: string]: Type_Vue } }

type Type_Sankey = {
  level_taggs_dict: { [g: string]: { selectTagsFromId: (id: string) => void } },
  showAccordingToLevelTags: () => void,
  nodes_list: { id: string, is_visible: boolean, dimensionsUpdated: () => void }[]
}

function charger(json: Type_Fichier, vue: string): Type_Sankey {
  const clone = JSON.parse(JSON.stringify(json)) as Type_Fichier
  clone.current_view = vue
  const app = new Class_ApplicationData(false)
  app.fromJSON(clone as never, {}, false)
  return app.drawing_area.sankey as unknown as Type_Sankey
}

function visibles(sankey: Type_Sankey): number {
  return sankey.nodes_list.filter(n => n.is_visible).length
}

const dir = findTutorialsDir()
const maybe = dir === null ? describe.skip : describe

// Les trois tutoriels batis sur la filiere bois : c'est la que la hierarchie est
// le sujet. Les parcourir toutes vues comprises coute ~1 min ; les autres
// tutoriels sont couverts pour leur seul maitre par `tutorialsLoad`.
const FICHIERS = ['Socle2.json', 'SpeEtiquettesHierarchies.json', 'SpeExcelAvance.json']

maybe('changer de niveau ne vide pas une vue de tutoriel', () => {
  FICHIERS.forEach(fichier => {
    const abs = path.join(dir as string, fichier)
    const json = JSON.parse(fs.readFileSync(abs, 'utf-8')) as Type_Fichier
    const cas: [string, string, string, string][] = []
    Object.entries(json.views ?? {}).forEach(([vid, vue]) => {
      Object.entries(vue.levelTags ?? {})
        .filter(([, groupe]) => groupe.activated !== false)
        .forEach(([gid, groupe]) => {
          Object.keys(groupe.tags).forEach(tid => {
            cas.push([vid, vue.name ?? vid, gid, tid])
          })
        })
    })
    expect(cas.length).toBeGreaterThan(0)

    it.each(cas)(fichier + ' — %s (%s), %s -> niveau %s', (vid, _nom, gid, tid) => {
      const sankey = charger(json, vid)
      const avant = visibles(sankey)
      sankey.level_taggs_dict[gid].selectTagsFromId(tid)
      sankey.showAccordingToLevelTags()
      // `are_related_dimensions_selected` est memoise : sans cette invalidation,
      // on relit l'etat d'avant le geste et le test ne voit jamais rien bouger.
      // `applyLevelSelection` fait la meme chose avant de redessiner.
      sankey.nodes_list.forEach(n => n.dimensionsUpdated())
      const apres = visibles(sankey)
      // Une vue qui montrait quelque chose doit encore montrer quelque chose :
      // un changement de niveau remplace des noeuds, il n'en supprime pas tous.
      if (avant > 0) expect(apres).toBeGreaterThan(0)
    })
  })
})
