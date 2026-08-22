import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag } from './Tag'

// sa#355 — « Unité naturelle d'origine » (unit_type = 'unit_tag') : le suffixe
// d'unité s'affichait sur les valeurs de FLUX mais jamais sur les valeurs de
// NŒUD. format_value ne résolvait pas le tag d'unité sélectionné : elle
// recollait le texte fourni par l'appelant, et le nœud lui passait son champ
// d'unité LIBRE (vide dans ce mode).

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

function makeApp() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const source = sankey.addNewNodeWithName('Collecte')
  const target = sankey.addNewNodeWithName('Lait cru')
  const link = sankey.addNewLink(source, target)
  // Groupe de dataTags « unité » : c'est lui qui porte les unités naturelles
  const unite = sankey.addDataTagGroup('unite', 'Unité', false)
  unite.is_unit = true
  const kt_pb = unite.addTag('kt PB', 'kt pb') as Class_DataTag
  const kt_mu = unite.addTag('kt MU', 'kt mu') as Class_DataTag
  kt_pb.setSelected()
  link.valueForTag(kt_pb)!.valueData = 24616
  link.valueForTag(kt_mu)!.valueData = 2117
  return { app, sankey, source, target, link, unite, kt_pb, kt_mu }
}

/** Rend le libellé de valeur visible, unité comprise, dans le mode demandé. */
function showUnit(
  el: { value_label_is_visible: boolean, value_label_unit_visible: boolean,
    value_label_unit_type: string, value_label_unit: string },
  unit_type: string,
  unit = ''
) {
  el.value_label_is_visible = true
  el.value_label_unit_visible = true
  el.value_label_unit_type = unit_type
  el.value_label_unit = unit
}

describe('sa#355 — unité du tag d\'unité sélectionné sur les libellés de valeur', () => {
  it('affiche l\'unité sur la valeur d\'un NŒUD comme sur celle d\'un flux', () => {
    const { source, link } = makeApp()
    showUnit(link, 'unit_tag')
    showUnit(source, 'unit_tag')

    // Référence : le flux affichait déjà son unité
    expect(link.data_label('value_label')).toContain('kt PB')
    // Le nœud l'affiche désormais aussi (avant : « 24 616 », sans unité)
    expect(source.data_label).toContain('kt PB')
  })

  it('ignore un reliquat d\'unité personnalisée resté dans le champ libre', () => {
    // Piège : l'utilisateur a saisi une unité libre, puis basculé sur
    // « Unité naturelle d'origine ». Le champ libre ne doit plus être affiché.
    const { source } = makeApp()
    showUnit(source, 'unit_tag', 'tonnes')

    expect(source.data_label).toContain('kt PB')
    expect(source.data_label).not.toContain('tonnes')
  })

  it('suit le tag d\'unité sélectionné quand il change', () => {
    const { source, kt_pb, kt_mu } = makeApp()
    showUnit(source, 'unit_tag')
    // Bannière « one » : une seule unité sélectionnée à la fois
    kt_pb.setUnSelected()
    kt_mu.setSelected()

    expect(source.data_label).toContain('kt MU')
    expect(source.data_label).not.toContain('kt PB')
  })

  it('n\'ajoute pas de suffixe parasite quand aucun groupe d\'unité n\'existe', () => {
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    const source = sankey.addNewNodeWithName('Collecte')
    const target = sankey.addNewNodeWithName('Lait cru')
    const link = sankey.addNewLink(source, target)
    link.value!.valueData = 42
    showUnit(source, 'unit_tag')

    expect(source.data_label.trim()).toBe(source.data_label)
  })

  it('ne plante pas sur un nœud en « autres unités naturelles »', () => {
    // Le mode lisait link.valueForTag(), méthode propre aux flux → TypeError.
    // Sur un nœud la valeur reste la SOMME au tag sélectionné : l'unité
    // affichée doit être celle de cette somme.
    const { source } = makeApp()
    showUnit(source, 'other_unit_tag', 'kt mu')

    expect(() => source.data_label).not.toThrow()
    expect(source.data_label).toContain('kt PB')
  })

  it('ne plante pas sur un nœud en mode « données collectées »', () => {
    // Le suffixe lisait link.value.value_option, absent d'un nœud → TypeError.
    const { app, source } = makeApp()
    app.drawing_area.type_data = 'data'
    showUnit(source, 'unit_tag')

    expect(() => source.data_label).not.toThrow()
    expect(source.data_label).toContain('kt PB')
  })
})
