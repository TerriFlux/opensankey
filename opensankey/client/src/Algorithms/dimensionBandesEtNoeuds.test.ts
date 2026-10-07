import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_NodeElement } from '../Elements/Node'
import { disaggregateDimensionNodes, isGeneratedMemberLink, isGeneratedMemberNode, membersOfGeneratedNode } from './DimensionDisaggregation'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 07/10, SOCLE filieres agregees : les filieres en un diagramme par membre, et dans
// chaque bande Ressources et Emplois decoupes par poste (« Ressources et emplois »). Matiere reste un
// noeud par filiere.

function choisir(groupe: Class_DataTagGroup, ...membres: Class_DataTag[]) {
  groupe.tags_list.forEach(t => t.setUnSelected())
  membres.forEach(m => m.setSelected())
}

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const filiere = sankey.addDataTagGroup('filiere', 'Filiere', false) as unknown as Class_DataTagGroup
  const cereales = filiere.addTag('Cereales', 'cereales') as Class_DataTag
  const lait = filiere.addTag('Lait', 'lait') as Class_DataTag
  const poste = sankey.addDataTagGroup('poste', 'Poste', false) as unknown as Class_DataTagGroup
  const prod = poste.addTag('Production', 'production') as Class_DataTag
  const imp = poste.addTag('Importations', 'importations') as Class_DataTag
  const exp = poste.addTag('Exportations', 'exportations') as Class_DataTag
  const alim = poste.addTag('Alimentation', 'alimentation') as Class_DataTag

  const ressources = sankey.addNewNodeWithName('Ressources')
  const matiere = sankey.addNewNodeWithName('Matiere')
  const emplois = sankey.addNewNodeWithName('Emplois')
  ressources.setPosXY(0, 100)
  matiere.setPosXY(300, 100)
  emplois.setPosXY(600, 100)
  const entree = sankey.addNewLink(ressources, matiere)
  const sortie = sankey.addNewLink(matiere, emplois)
  const poser = (flux: typeof entree, f: Class_DataTag, p: Class_DataTag, v: number) => {
    choisir(filiere, f)
    choisir(poste, p)
    ;(flux.value as Class_LinkValue).valueData = v
  }
  poser(entree, cereales, prod, 60); poser(entree, cereales, imp, 20)
  poser(entree, lait, prod, 30); poser(entree, lait, imp, 10)
  poser(sortie, cereales, exp, 50); poser(sortie, cereales, alim, 30)
  poser(sortie, lait, exp, 15); poser(sortie, lait, alim, 25)
  choisir(filiere, cereales, lait)
  choisir(poste, prod, imp, exp, alim)
  ressources.driving_dimension = poste
  emplois.driving_dimension = poste
  filiere.member_bands = true
  return { app, sankey, filiere, poste, ressources, matiere, emplois }
}

describe('os#1511 — un diagramme par filiere, les postes en noeuds dans chaque bande', () => {
  test('chaque bande a ses postes, sa matiere, et des flux qui ne sortent pas de la bande', () => {
    const { sankey, ressources } = monter()
    disaggregateDimensionNodes(sankey)
    const noms = sankey.nodes_list.filter(isGeneratedMemberNode).map(n => n.name).sort()
    expect(noms).toEqual([
      'Cereales', 'Cereales - Alimentation', 'Cereales - Exportations', 'Cereales - Importations',
      'Cereales - Production', 'Lait', 'Lait - Alimentation', 'Lait - Exportations',
      'Lait - Importations', 'Lait - Production'
    ])
    expect(ressources.own_driving_dimension?.id).toBe('poste')
    sankey.links_list.filter(isGeneratedMemberLink).forEach(l => {
      const f = (n: Class_NodeElement) => membersOfGeneratedNode(n).find(m => m.group.id === 'filiere')?.id
      expect(f(l.source as Class_NodeElement)).toBe(f(l.target as Class_NodeElement))
    })
    const valeur = (s: string, c: string) => sankey.links_list.filter(isGeneratedMemberLink)
      .find(l => l.source.name === s && l.target.name === c)?.value?.valueData
    expect(valeur('Cereales - Production', 'Cereales')).toBe(60)
    expect(valeur('Lait', 'Lait - Alimentation')).toBe(25)
    expect(sankey.links_list.filter(isGeneratedMemberLink)).toHaveLength(8)
  })

  test('les bandes ne se chevauchent pas, les postes d une colonne non plus', () => {
    const { sankey } = monter()
    disaggregateDimensionNodes(sankey)
    const boite = (n: Class_NodeElement) => ({ haut: n.position_y, bas: n.position_y + n.getShapeHeightToUse() })
    const bande = (f: string) => sankey.nodes_list.filter(isGeneratedMemberNode)
      .filter(n => n.name === f || n.name.startsWith(f + ' - ')).map(boite)
    const bas_cereales = Math.max(...bande('Cereales').map(b => b.bas))
    const haut_lait = Math.min(...bande('Lait').map(b => b.haut))
    expect(haut_lait).toBeGreaterThan(bas_cereales)
    ;['Production', 'Importations'].forEach(() => {
      const colonne = sankey.nodes_list.filter(isGeneratedMemberNode)
        .filter(n => n.position_x === 0).map(boite).sort((a, b) => a.haut - b.haut)
      for (let i = 1; i < colonne.length; i++) expect(colonne[i].haut).toBeGreaterThanOrEqual(colonne[i - 1].bas - 1e-6)
    })
  })
})
