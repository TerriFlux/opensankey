import * as fs from 'fs'
import * as path from 'path'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

/**
 * Fichiers 0.5 : les niveaux d'agregation ne sont decrits nulle part comme groupe de tags — ils ne
 * vivent que dans `nodes[*].dimensions[<dim>].level`, et l'etat affiche dans `display`. Faute de
 * `levelTags`, le chargement ne filtrait RIEN : les 5 niveaux des 5 dimensions de « Filiere Foret
 * Bois Grand Est » s'affichaient en meme temps (186 noeuds visibles sur 188, au lieu des 47 que la
 * page publiee montre).
 *
 * Ce test verifie la reconstruction (Legacy.convert_legacy_dimensions_as_levelTags) sur le fichier
 * REEL de la publication, deja present dans le corpus : les groupes de niveaux existent, le niveau
 * montre par le fichier est celui qui est selectionne, et surtout AUCUN noeud que le fichier
 * masquait ne reapparait.
 */

function findCorpusDir(): string | null {
  let dir = __dirname
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, 'SankeyData', 'corpus')
    if (fs.existsSync(path.join(candidate, 'index.json'))) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

const corpus_dir = findCorpusDir()
const file = corpus_dir
  ? path.join(corpus_dir, '0.5', 'filiere_foret_bois_grand_est.json')
  : ''
const itOrSkip = (file && fs.existsSync(file)) ? it : it.skip

type LegacyNode = { display?: boolean }
type LevelTagGroupJSON = { tags: { [id: string]: { selected: boolean } } }

itOrSkip('0.5 — les niveaux d\'agregation redeviennent des groupes de niveaux', () => {
  const json = JSON.parse(fs.readFileSync(file, 'utf-8')) as Type_JSON
  const legacy_nodes = (json as unknown as { nodes: { [id: string]: LegacyNode } }).nodes
  const hidden_by_file = Object.entries(legacy_nodes)
    .filter(([, n]) => n.display === false)
    .map(([id]) => id)

  const app = new Class_ApplicationData(false)
  app.fromJSON(JSON.parse(JSON.stringify(json)) as never, {}, false)
  const sankey = app.drawing_area.sankey

  // Un groupe de niveaux par dimension du fichier. Celle qui portait les noeuds affiches s'appelait
  // 'Primaire' : renommee, car ce nom est traite partout comme un groupe par defaut jetable des
  // qu'un autre groupe de niveaux existe — ce qui la supprimerait ici alors qu'elle porte tout.
  const level_taggs = (sankey as unknown as {
    _level_taggs: { [id: string]: { toJSON: () => LevelTagGroupJSON } }
  })._level_taggs
  expect(Object.keys(level_taggs).sort())
    .toEqual(['Echanges', 'Espéces', 'NaN', 'Niveaux', 'Usages'])

  const selected_of = (id: string) => Object.entries(level_taggs[id].toJSON().tags)
    .filter(([, tag]) => tag.selected).map(([tag_id]) => tag_id)
  // Le fichier montre le niveau le plus agrege de sa dimension portante...
  expect(selected_of('Niveaux')).toEqual(['1'])
  // ...et pour les axes alternatifs, le niveau des noeuds qu'il affiche (2 pour Usages/Echanges,
  // via leur niveau 1 de la dimension portante) ou AUCUN quand il n'en affiche aucun.
  expect(selected_of('Usages')).toEqual(['2'])
  expect(selected_of('Echanges')).toEqual(['2'])
  expect(selected_of('Espéces')).toEqual([])
  expect(selected_of('NaN')).toEqual([])

  // Le point du bug : rien de ce que le fichier masquait ne doit reapparaitre.
  const nodes = sankey.nodes_dict as unknown as { [id: string]: { is_visible: boolean } }
  const wrongly_shown = hidden_by_file.filter(id => nodes[id]?.is_visible)
  expect(wrongly_shown).toEqual([])

  // Et le diagramme reste celui de la page : 45 des 47 noeuds affiches par le fichier. Les deux
  // manquants (node70, node71) sortent d'une autre regle, deja a l'oeuvre avant ce correctif :
  // tous leurs flux vers un noeud visible valent 0, et un noeud sans flux visible n'est pas dessine.
  const visible = Object.entries(nodes).filter(([, n]) => n.is_visible).map(([id]) => id)
  expect(visible.length).toBe(45)
})
