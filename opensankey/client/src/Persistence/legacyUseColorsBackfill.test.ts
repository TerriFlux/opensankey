import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// Rétro-portage `use_colors` sur les fichiers 0.9 / 0.91.
//
// `use_colors` a scindé ce que `show_legend` portait seul : afficher la légende ET appliquer la
// palette du groupe. Le rétro-portage n'existait que sur le chemin `fromJSON_pre_0_9`, si bien
// qu'un fichier estampillé exactement '0.9' ou '0.91' — le template « Dépenses personnelles avec
// étiquettes » en est un — chargeait `use_colors = false`. Conséquences visibles : le switch de
// palette éteint à l'ouverture, et les flux en mode `auto` tous gris (la cascade `auto` filtre les
// tags des extrémités sur `group.use_colors`, ne trouve rien, et retombe sur `shape_color`).

function findDataDir(sub: string[]): string | null {
  let dir = __dirname
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, 'SankeyData', ...sub)
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

function readJSON(abs: string): Type_JSON {
  const buf = fs.readFileSync(abs)
  const text = abs.endsWith('.gz') ? zlib.gunzipSync(buf).toString('utf-8') : buf.toString('utf-8')
  return JSON.parse(text) as Type_JSON
}

function load(json: Type_JSON): Class_ApplicationData {
  const app = new Class_ApplicationData(false)
  // fromJSON mute son argument (migrations en place) → clone.
  app.fromJSON(JSON.parse(JSON.stringify(json)) as never, {}, false)
  return app
}

const TEMPLATES = findDataDir(['templates', 'opensankey', 'data'])

const describeIfData = TEMPLATES ? describe : describe.skip

describeIfData('backfill use_colors (fichiers < 0.92)', () => {
  test('template « Dépenses personnelles avec étiquettes » (v0.9) : palette active + flux colorés', () => {
    const json = readJSON(path.join(TEMPLATES as string, 'personal_budget_with_tags.json.gz'))
    expect(json['version']).toBe('0.9')
    // Le fichier ne porte QUE show_legend : c'est bien le rétro-portage qui est sous test.
    expect((json['nodeTags'] as Type_JSON)['node_taggs0']['use_colors']).toBeUndefined()

    const sankey = load(json).drawing_area.sankey

    const tagg = sankey.node_taggs_list[0]
    expect(tagg.use_colors).toBe(true)

    // « Wages » porte le tag Income (#543005) → le nœud prend la couleur du tag, plus le gris du
    // style par défaut (#a9a9a9).
    const wages = sankey.nodes_list.filter(n => n.name === 'Wages')[0]
    expect(wages.getShapeColorToUse()).toBe('#543005')

    // Mode `auto` : source et cible partagent le tag Income → couleur du tag commun.
    const link = sankey.links_list.filter(l => l.source.name === 'Wages' && l.target.name === 'Budget')[0]
    expect(link.shape_color_rule).toBe('auto')
    expect(link.getShapeColorToUse()).toBe('#543005')
  })

  test('un groupe portant déjà use_colors n\'est pas réécrit par show_legend', () => {
    const json = readJSON(path.join(TEMPLATES as string, 'personal_budget_with_tags.json.gz'));
    (json['nodeTags'] as Type_JSON)['node_taggs0']['use_colors'] = false

    const sankey = load(json).drawing_area.sankey
    expect(sankey.node_taggs_list[0].use_colors).toBe(false)
  })
})
