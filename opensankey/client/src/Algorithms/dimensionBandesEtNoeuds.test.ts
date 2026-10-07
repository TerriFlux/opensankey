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

const filiereDe = (n: Class_NodeElement) => membersOfGeneratedNode(n).find(m => m.group.id === 'filiere')?.id
const posteDe = (n: Class_NodeElement) => membersOfGeneratedNode(n).find(m => m.group.id === 'poste')?.id

describe('os#1511 — un diagramme par filiere, les postes en noeuds dans chaque bande', () => {
  test('chaque bande a ses postes, sa matiere, et des flux qui ne sortent pas de la bande', () => {
    const { sankey, ressources } = monter()
    disaggregateDimensionNodes(sankey)
    // Le diagramme repete : les noeuds de poste portent le nom du poste seul.
    const noms = sankey.nodes_list.filter(isGeneratedMemberNode).map(n => n.name).sort()
    expect(noms).toEqual([
      'Alimentation', 'Alimentation', 'Cereales', 'Exportations', 'Exportations',
      'Importations', 'Importations', 'Lait', 'Production', 'Production'
    ])
    expect(ressources.own_driving_dimension?.id).toBe('poste')
    // Un diagramme par filiere, pas en plus des bandes de filiere sur les flux.
    expect((sankey.data_taggs_dict['filiere'] as unknown as { drawing: string }).drawing).toBe('nodes')
    const engendres = sankey.links_list.filter(isGeneratedMemberLink)
    engendres.forEach(l => expect(filiereDe(l.source as Class_NodeElement)).toBe(filiereDe(l.target as Class_NodeElement)))
    const valeur = (f: string, p: string, sens: 'source' | 'target') => engendres
      .find(l => filiereDe(l[sens] as Class_NodeElement) === f && posteDe(l[sens] as Class_NodeElement) === p)?.value?.valueData
    expect(valeur('cereales', 'production', 'source')).toBe(60)
    expect(valeur('lait', 'alimentation', 'target')).toBe(25)
    expect(engendres).toHaveLength(8)
  })

  test('choisie dans la legende, la filiere peint chaque bande de sa couleur', () => {
    const { sankey, filiere } = monter()
    ;(filiere.tags_dict['cereales'] as Class_DataTag).color = '#aa0000'
    ;(filiere.tags_dict['lait'] as Class_DataTag).color = '#00aa00'
    filiere.paints_flows = true
    disaggregateDimensionNodes(sankey)
    sankey.links_list.filter(isGeneratedMemberLink).forEach(l =>
      expect(l.getShapeColorToUse()).toBe(filiereDe(l.source as Class_NodeElement) === 'cereales' ? '#aa0000' : '#00aa00'))
  })

  test('les bandes ne se chevauchent pas, les postes d une colonne sont espaces d un demi ecart', () => {
    const { sankey, app } = monter()
    app.drawing_area.disaggregation_gap_value = 40
    disaggregateDimensionNodes(sankey)
    const boite = (n: Class_NodeElement) => ({ haut: n.position_y, bas: n.position_y + n.getShapeHeightToUse() })
    const bande = (f: string) => sankey.nodes_list.filter(isGeneratedMemberNode).filter(n => filiereDe(n) === f).map(boite)
    expect(Math.min(...bande('lait').map(b => b.haut))).toBeGreaterThan(Math.max(...bande('cereales').map(b => b.bas)))
    ;['cereales', 'lait'].forEach(f => {
      const colonne = sankey.nodes_list.filter(isGeneratedMemberNode)
        .filter(n => n.position_x === 0 && filiereDe(n) === f).map(boite).sort((a, b) => a.haut - b.haut)
      expect(colonne).toHaveLength(2)
      expect(colonne[1].haut - colonne[0].bas).toBeCloseTo(20, 6)
    })
  })

  test('un nom repete d une bande a l autre ne s ecrit qu une fois, en haut', () => {
    const { sankey } = monter()
    disaggregateDimensionNodes(sankey)
    const production = sankey.nodes_list.filter(isGeneratedMemberNode).filter(n => n.name === 'Production')
      .sort((a, b) => a.position_y - b.position_y)
    expect(production.map(n => n.name_label_is_visible)).toEqual([true, false])
    // Le noeud central, un par bande, garde son nom partout.
    expect(sankey.nodes_list.filter(isGeneratedMemberNode).filter(n => n.name === 'Lait')[0].name_label_is_visible).toBe(true)
  })

  test('par defaut les postes peignent les flux, et la legende liste les dimensions', () => {
    // Julien, 07/10 : « le premier choix, c est Ressources et emplois qui peint les branches ».
    const { sankey, filiere, poste } = monter()
    ;(filiere.tags_dict['cereales'] as Class_DataTag).color = '#aa0000'
    ;(poste.tags_dict['production'] as Class_DataTag).color = '#0000aa'
    filiere.use_colors = true
    disaggregateDimensionNodes(sankey)
    expect(poste.paints_member_bands_flows).toBe(true)
    expect(filiere.paints_member_bands_flows).toBe(false)
    const lien = sankey.links_list.filter(isGeneratedMemberLink)
      .find(l => filiereDe(l.source as Class_NodeElement) === 'cereales' && posteDe(l.source as Class_NodeElement) === 'production')
    expect(lien?.getShapeColorToUse()).toBe('#0000aa')
    expect(filiere.draws_members_as_nodes).toBe(true)
    expect(poste.draws_members_as_nodes).toBe(true)
  })
})

