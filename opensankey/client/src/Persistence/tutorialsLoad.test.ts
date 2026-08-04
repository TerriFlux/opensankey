import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from '../types/ApplicationData'

// Les tutoriels de SankeyData sont en partie FABRIQUÉS PAR SCRIPT, jamais enregistrés par
// l'application : rien ne garantit qu'ils se chargent. Ce test les fait passer par le vrai
// `fromJSON`, fichier par fichier et vue par vue.
//
// Piège vécu : `current_view` pointant sur une vue volontairement vide (l'énoncé d'un exercice)
// donne un diagramme vide au chargement — le fichier est valide, mais s'ouvre sur du blanc. On
// force donc le maître pour juger du contenu, et on vérifie chaque vue séparément.

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

type Type_Dump = { nodes?: object, links?: { [k: string]: { idSource?: string, value?: { data_value?: number } } } }

function load(json: unknown, current_view?: string): Type_Dump {
  const clone = JSON.parse(JSON.stringify(json)) as { current_view?: string }
  if (current_view !== undefined) clone.current_view = current_view
  const app = new Class_ApplicationData(false)
  app.fromJSON(clone as never, {}, false)
  return app.toJSON() as Type_Dump
}

const tutorials_dir = findTutorialsDir()
const maybe = tutorials_dir === null ? describe.skip : describe

maybe('tutoriels — chargement par le moteur réel', () => {
  const dir = tutorials_dir as string
  const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf-8')) as {
    tutorials: { id: string, files: { [lang: string]: string } }[]
  }

  it.each(index.tutorials.map((t) => [t.id, t.files.fr]))(
    'le tutoriel « %s » (%s) se charge sans erreur',
    (_id, file) => {
      const abs = path.join(dir, file as string)
      expect(fs.existsSync(abs)).toBe(true)
      const json = JSON.parse(fs.readFileSync(abs, 'utf-8'))
      expect(() => load(json, 'sankey_maitre')).not.toThrow()
      // Le .gz servi en priorité doit refléter le .json.
      if (fs.existsSync(abs + '.gz')) {
        const gz = JSON.parse(zlib.gunzipSync(fs.readFileSync(abs + '.gz')).toString('utf-8'))
        expect(gz).toEqual(json)
      }
    }
  )

  describe('Socle1 — fil rouge forêt-bois', () => {
    const json = JSON.parse(fs.readFileSync(path.join(dir, 'Socle1.json'), 'utf-8')) as {
      views: { [id: string]: { name?: string, nodes?: object } }
    }

    it('le maître porte la filière complète et le bilan matière boucle', () => {
      const dump = load(json, 'sankey_maitre')
      const links = dump.links ?? {}
      expect(Object.keys(dump.nodes ?? {})).toHaveLength(8)
      expect(Object.keys(links)).toHaveLength(7)

      const outOf = (id: string) => Object.values(links)
        .filter((l) => l.idSource === id)
        .reduce((sum, l) => sum + (l.value?.data_value ?? 0), 0)

      expect(outOf('Foret')).toBe(500)
      expect(outOf('BoisRond')).toBe(500)   // ce qui entre ressort
      expect(outOf('Scierie')).toBe(250)    // idem à la scierie
    })

    it('chaque vue non vide charge ses huit nœuds', () => {
      const non_empty = Object.entries(json.views)
        .filter(([, v]) => Object.keys(v.nodes ?? {}).length > 0)
      expect(non_empty.length).toBe(8)
      for (const [vid] of non_empty) {
        const dump = load(json, vid)
        expect(Object.keys(dump.nodes ?? {})).toHaveLength(8)
      }
    })
  })
})
