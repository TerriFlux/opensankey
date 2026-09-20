// os#1443 — CE QUE COÛTE D ENREGISTRER UN FICHIER À PLUSIEURS FEUILLES.
//
// L audit du 19/09 ne demandait pas d optimiser `sheetsToJSON` mais de le MESURER : « la perf se
// mesure d abord sur un fichier a cinq feuilles ouvertes avant de decider ». Decider sans chiffre
// serait deviner, et le geste mesure est frequent — `saveInCache` part a chaque modification.
//
// CE QUE FAIT `sheetsToJSON`, par feuille NON courante :
//  - un document VIVANT (feuille ouverte dans une fenetre) est serialise en l appelant : c est
//    lui la verite depuis le lot 3, et il n y a pas d alternative ;
//  - une feuille FERMEE voit son instantane DECOMPRESSE puis REPARSE, pour etre repose tel quel
//    dans l objet rendu — qui sera restringifie, et le plus souvent recompresse, juste apres.
//
// Le second chemin est celui qu on soupconne : ces octets-la n ont pas change, on les defait
// seulement pour les refaire. Ce fichier dit de combien, plutot que de l affirmer.
//
// Il IMPRIME et n echoue pas sur une duree : une machine de CI partagee ne donne pas deux fois
// le meme chiffre, et un seuil y serait une fausse alerte de plus. Ce qu il verrouille est
// STRUCTUREL — le nombre de decompressions par enregistrement —, et c est la vraie grandeur :
// elle ne depend ni de la machine ni de la charge.

import pako from 'pako'
import { Class_Workspace } from './Workspace'
import type { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Un diagramme de taille plausible : une chaine de noeuds relies deux a deux. */
const fillSheet = (doc: Class_ApplicationData, nodes: number): void => {
  const sankey = doc.drawing_area.sankey
  const made = []
  for (let i = 0; i < nodes; i++) {
    made.push(sankey.addNewNode('n_' + i, 'Noeud ' + i))
  }
  for (let i = 1; i < made.length; i++) {
    sankey.addNewLink(made[i - 1], made[i])
  }
}

/** Un document a `sheets` feuilles, chacune remplie, aucune ouverte. */
const buildFile = (sheets: number, nodes: number): Class_ApplicationData => {
  const ws = new Class_Workspace(false)
  const main = ws.createDocument()
  fillSheet(main, nodes)
  for (let s = 1; s < sheets; s++) {
    main.createNewSheet(false)
    fillSheet(main, nodes)
  }
  return main
}

const ms = (f: () => void, runs = 5): number => {
  f() // un tour a blanc : on ne mesure pas le rechauffage
  const start = Date.now()
  for (let i = 0; i < runs; i++) f()
  return (Date.now() - start) / runs
}

const NODES = 150

describe('os#1443 ce que coute denregistrer un fichier a plusieurs feuilles', () => {

  it('mesure : une feuille, cinq feuilles fermees, cinq feuilles ouvertes', () => {
    const one = buildFile(1, NODES)
    const five_closed = buildFile(5, NODES)
    const five_open = buildFile(5, NODES)
    // Ouvrir les quatre feuilles non courantes : c est la scene de l audit.
    five_open.sheets_order
      .filter(id => id !== five_open.current_sheet_id)
      .forEach(id => five_open.sheetApplication(id))

    const t_one = ms(() => { one.toJSON() })
    const t_closed = ms(() => { five_closed.toJSON() })
    const t_open = ms(() => { five_open.toJSON() })

    // eslint-disable-next-line no-console
    console.log(
      '[os#1443] toJSON, ' + NODES + ' noeuds par feuille (moyenne sur 5 tours) :\n' +
      '  1 feuille              : ' + t_one.toFixed(1) + ' ms\n' +
      '  5 feuilles FERMEES     : ' + t_closed.toFixed(1) + ' ms' +
      '  (x' + (t_closed / Math.max(t_one, 0.1)).toFixed(1) + ')\n' +
      '  5 feuilles OUVERTES    : ' + t_open.toFixed(1) + ' ms' +
      '  (x' + (t_open / Math.max(t_one, 0.1)).toFixed(1) + ')'
    )

    // Les trois chemins rendent bien un fichier a la bonne forme : la mesure porte sur du
    // travail reel, pas sur une sortie tronquee.
    const entriesOf = (doc: Class_ApplicationData) => {
      const file = doc.toJSON() as Type_JSON
      const sheets = file['sheets'] as unknown as { entries: { [id: string]: Type_JSON } }
      return Object.keys(sheets.entries).length
    }
    expect(entriesOf(five_closed)).toBe(5)
    expect(entriesOf(five_open)).toBe(5)
  })

  it('CHAQUE enregistrement decompresse CHAQUE feuille fermee', () => {
    // LA GRANDEUR STRUCTURELLE, et le vrai resultat de la mesure. Quatre feuilles fermees =
    // quatre `inflate` + quatre `JSON.parse` par enregistrement, sur des octets qui n ont PAS
    // change — on les defait pour les refaire a l identique. Et `saveInCache` part a chaque
    // modification, pas seulement quand l utilisateur clique.
    const main = buildFile(5, 20)
    const inflate = jest.spyOn(pako, 'inflate')

    main.toJSON()

    const closed = main.sheets_order.length - 1
    expect(inflate).toHaveBeenCalledTimes(closed)

    // Et c est bien par enregistrement : rien n est mis en cache d un appel a l autre.
    inflate.mockClear()
    main.toJSON()
    expect(inflate).toHaveBeenCalledTimes(closed)
    inflate.mockRestore()
  })

  it('une feuille OUVERTE ne passe pas par la decompression : on appelle son document', () => {
    // L autre moitie, et celle qu on ne peut PAS economiser : le document vivant est la verite
    // depuis le lot 3, son instantane date de son ouverture. La serialisation est le prix de la
    // justesse, pas du gaspillage.
    const main = buildFile(2, 20)
    const other = main.sheets_order.find(id => id !== main.current_sheet_id)!
    main.sheetApplication(other)
    const inflate = jest.spyOn(pako, 'inflate')

    main.toJSON()

    expect(inflate).not.toHaveBeenCalled()
    inflate.mockRestore()
  })
})
