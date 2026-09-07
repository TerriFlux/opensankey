import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// ==================================================================================================
// Chargement d'un fichier LEGACY : ordre des flux autour d'un nœud, et étiquettes de dataTag que le
// fichier ne mentionne pas.
//
// Le témoin est « Filière végétale », un classique du web au format 0.8 : 11 nœuds, 164 flux, un
// dataTag « Niveau produit » à trois granularités alternatives (chaque flux n'existe qu'à UNE), et
// un nœud (Transformation) qui porte 13 flux bouclant sur lui-même. Les deux défauts corrigés ici
// ne se voient que sur ce genre de fichier, d'où le choix d'un cas réel plutôt que d'une maquette :
// une maquette n'aurait pas la forme qui les déclenche.
// ==================================================================================================

function findTemplate(): string | null {
  let dir = __dirname
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, 'SankeyData', 'templates', 'web', 'data', 'filiere_vegetale.json.gz')
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

/** Les flux d'un fichier legacy sont renommés au chargement (`previous_id + makeId`). */
const base = (id: string) => id.split(/_idlink/i)[0]

const template = findTemplate()
const describeOrSkip = template ? describe : describe.skip

describeOrSkip('chargement legacy — ordre des flux et etiquettes absentes', () => {
  if (!template) {
    // eslint-disable-next-line no-console
    console.warn('[legacy] SankeyData/templates introuvable — suite skippee.')
    return
  }
  const raw = JSON.parse(zlib.gunzipSync(fs.readFileSync(template)).toString('utf-8')) as Type_JSON
  const file = raw as unknown as {
    nodes: { [id: string]: { name: string, inputLinksId: string[], outputLinksId: string[] } }
    links: { [id: string]: { value: { [tag_id: string]: unknown } } }
  }

  const load = () => {
    const app = new Class_ApplicationData(false)
    app.fromJSON(JSON.parse(JSON.stringify(raw)) as never, {}, false)
    return app.drawing_area.sankey
  }

  it('un noeud portant des flux des deux cotes garde l ordre du fichier', () => {
    // Transformation : 38 entrees + 55 sorties = 93 citations pour 80 flux, les 13 boucles
    // etant citees deux fois. La garde d'egalite des longueurs abandonnait l'ordre du fichier
    // pour ce nœud, qui se rendait alors dans l'ordre du dictionnaire `links`.
    const node_json = file.nodes['node1']
    const expected: string[] = []
    ;[...node_json.inputLinksId, ...node_json.outputLinksId]
      .forEach(id => { if (!expected.includes(id)) expected.push(id) })
    expect(node_json.inputLinksId.length + node_json.outputLinksId.length)
      .toBeGreaterThan(expected.length) // le nœud a bien des flux cites deux fois

    const node = load().nodes_dict['node1']
    expect(node.links_order.map(l => base(l.id))).toEqual(expected)
  })

  it('les autres noeuds gardent aussi l ordre du fichier', () => {
    const sankey = load()
    Object.entries(file.nodes).forEach(([node_id, node_json]) => {
      const expected: string[] = []
      ;[...node_json.inputLinksId, ...node_json.outputLinksId]
        .forEach(id => { if (!expected.includes(id)) expected.push(id) })
      expect(sankey.nodes_dict[node_id].links_order.map(l => base(l.id))).toEqual(expected)
    })
  })

  it('une etiquette de dataTag absente du fichier rend le flux absent, pas fantome', () => {
    // #188 — le niveau 3 est celui que le fichier selectionne ; 40 flux n'y portent aucune
    // valeur parce qu'ils vivent aux niveaux 1 ou 2. Sans marquage, ils se rendaient en
    // pointille par-dessus le diagramme.
    const sankey = load()
    const missing_at_level_3 = Object.values(file.links)
      .filter(l => l.value['3'] === undefined).length
    expect(missing_at_level_3).toBeGreaterThan(0)

    const absent = sankey.links_list.filter(l => l.is_structurally_absent_for_current_datatags)
    expect(absent.length).toBe(missing_at_level_3)
    // Plus aucun fantome : un flux sans valeur courante est desormais un flux absent.
    expect(sankey.links_list.filter(
      l => !l.is_structurally_absent_for_current_datatags && l.valueCurrent == null
    )).toEqual([])
    absent.forEach(l => expect(l.is_visible).toBe(false))
  })

  it('un fichier MODERNE garde le sens « valeur pas encore saisie »', () => {
    // Meme contenu, mais un `format_version` explicite : la migration ne s'applique plus et une
    // feuille absente reste une valeur manquante (le marqueur, la, est ecrit par SEP).
    const modern = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>
    modern.format_version = 3
    const app = new Class_ApplicationData(false)
    app.fromJSON(modern as never, {}, false)
    expect(app.drawing_area.sankey.links_list
      .filter(l => l.is_structurally_absent_for_current_datatags)).toEqual([])
  })
})
