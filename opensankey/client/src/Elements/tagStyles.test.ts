/**
 * SA#541 — règles pures des styles d'étiquette (tagStyles.ts). Les cas sur de vraies classes
 * (cascade des attributs, flux qui change de style avec l'année) sont dans
 * `types/Element.tagStyleCascade.test.ts`.
 */
import { buildColorLockIndex, tagStyleLayers, topLayerDefining } from './tagStyles'

type Tag = { name: string, style_id?: string }
type Group = { name: string, style_id?: string, tags_list: Tag[] }
type Style = { id: string, attrs: { [k: string]: unknown } }

const STYLES: { [id: string]: Style } = {
  robuste: { id: 'robuste', attrs: { shape_opacity: 0.8 } },
  indicative: { id: 'indicative', attrs: { shape_opacity: 0.2, shape_color: '#ccc' } },
  methode: { id: 'methode', attrs: { shape_opacity: 0.5 } },
  sans: { id: 'sans', attrs: { shape_border_dashed: true } },
}
const lookup = (id: string) => STYLES[id]

function fiabilite() {
  const fiable: Tag = { name: 'Fiable' }
  const robuste: Tag = { name: 'Robuste', style_id: 'robuste' }
  const indicative: Tag = { name: 'Indicative', style_id: 'indicative' }
  const group: Group = { name: 'Fiabilité', style_id: 'sans', tags_list: [fiable, robuste, indicative] }
  return { group, fiable, robuste, indicative }
}

describe('tagStyleLayers — ordre des listes', () => {
  it('dans un groupe, les étiquettes portées sont empilées dans l ordre de la liste : la plus bas gagne', () => {
    const { group, robuste, indicative } = fiabilite()
    const carried = [indicative, robuste]  // l'ordre de port est sans effet
    const layers = tagStyleLayers([group], t => carried.includes(t), lookup)
    expect(layers.map(l => l.owner)).toEqual([robuste, indicative])
    expect(topLayerDefining(layers, s => s.attrs.shape_opacity)?.owner).toBe(indicative)
  })

  it('entre groupes, le groupe le plus bas dans la liste gagne', () => {
    const { group, robuste } = fiabilite()
    const collectee: Tag = { name: 'Collectée', style_id: 'methode' }
    const methode: Group = { name: 'Méthode', tags_list: [collectee] }
    const carried = [robuste, collectee]
    expect(topLayerDefining(tagStyleLayers([group, methode], t => carried.includes(t), lookup), s => s.attrs.shape_opacity)?.owner).toBe(collectee)
    expect(topLayerDefining(tagStyleLayers([methode, group], t => carried.includes(t), lookup), s => s.attrs.shape_opacity)?.owner).toBe(robuste)
  })

  it('une couche ne masque que les paramètres qu elle définit', () => {
    const { group, robuste, indicative } = fiabilite()
    const collectee: Tag = { name: 'Collectée', style_id: 'methode' }
    const methode: Group = { name: 'Méthode', tags_list: [collectee] }
    const carried = [indicative, collectee]
    const layers = tagStyleLayers([group, methode], t => carried.includes(t), lookup)
    expect(topLayerDefining(layers, s => s.attrs.shape_opacity)?.owner).toBe(collectee)
    expect(topLayerDefining(layers, s => s.attrs.shape_color)?.owner).toBe(indicative)
    expect(topLayerDefining(layers, s => s.attrs.shape_border_dashed)).toBeUndefined()
    expect(robuste.style_id).toBe('robuste')
  })
})

describe('tagStyleLayers — style du groupe pour les éléments sans étiquette', () => {
  it('aucune étiquette du groupe portée : le style du groupe s applique, marqué from_group', () => {
    const { group } = fiabilite()
    const layers = tagStyleLayers([group], () => false, lookup)
    expect(layers).toHaveLength(1)
    expect(layers[0]).toMatchObject({ owner: group, from_group: true, style: STYLES.sans })
  })

  it('une étiquette du groupe portée, même sans style : plus de style de groupe', () => {
    const { group, fiable } = fiabilite()
    expect(tagStyleLayers([group], t => t === fiable, lookup)).toEqual([])
  })
})

describe('tagStyleLayers — robustesse', () => {
  it('un style introuvable (supprimé) est ignoré, sans casser les autres couches', () => {
    const { group, robuste, indicative } = fiabilite()
    robuste.style_id = 'style_supprime'
    const layers = tagStyleLayers([group], t => t === robuste || t === indicative, lookup)
    expect(layers.map(l => l.owner)).toEqual([indicative])
  })

  it('aucun style nulle part : aucune couche (cas de tous les fichiers existants)', () => {
    const tag: Tag = { name: 'x' }
    const group: Group = { name: 'g', tags_list: [tag] }
    expect(tagStyleLayers([group], () => true, lookup)).toEqual([])
    expect(tagStyleLayers([group], () => false, lookup)).toEqual([])
  })
})

describe('buildColorLockIndex — seuls les paramètres qui ont un cadenas', () => {
  it('associe chaque couleur à son cadenas, ignore les cadenas orphelins', () => {
    const index = buildColorLockIndex(['shape_color', 'shape_color_sustainable', 'shape_opacity', 'icon_color_sustainable'])
    expect(index).toEqual({ shape_color: 'shape_color_sustainable' })
  })
})
