import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { buildDiagramNavigationTable } from './diagramNavigationTable'
import { applyReaderSeveral, applyReaderSubPick } from '../components/ui/dimensionDrawingHost'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 (Jean-Yves, 09/10) — les commandes du lecteur dans le tableau du diagramme : une case pour
// le type de matiere, une liste a choix unique pour la filiere (sous-filiere seulement si elle en a).

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const filiere = sankey.addDataTagGroup('filiere', 'Filière', false) as Class_DataTagGroup
  const cereales = filiere.addTag('Céréales', 'cereales') as Class_DataTag
  const ble = filiere.addTag('Blé', 'ble') as Class_DataTag
  const mais = filiere.addTag('Maïs', 'mais') as Class_DataTag
  const orge = filiere.addTag('Orge', 'orge') as Class_DataTag
  filiere.addTag('Lait', 'lait')
  ble.parent = cereales
  mais.parent = cereales
  orge.parent = cereales
  filiere.levels = ['Filière', 'Sous-filière']
  cereales.setSelected()
  filiere.reader_control = { kind: 'pick' }
  const matiere = sankey.addDataTagGroup('matiere', 'Type de matière', false) as Class_DataTagGroup
  const tout = matiere.addTag('Matière', 'matiere') as Class_DataTag
  const mp = matiere.addTag('Matière première', 'mp') as Class_DataTag
  const pr = matiere.addTag('Produits', 'produits') as Class_DataTag
  mp.parent = tout
  pr.parent = tout
  matiere.levels = ['Matière', 'Type de matière']
  tout.setSelected()
  matiere.reader_control = { kind: 'toggle', label: 'Distinguer matière première et produits' }
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  sankey.addNewLink(a, b)
  return { app, filiere, matiere }
}

const table = (app: Class_ApplicationData, dims: Class_DataTagGroup[]) =>
  buildDiagramNavigationTable(app, dims, { memory_key: 'essai' })

const attendre = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 20)) }

describe('os#1511 — commandes du lecteur du tableau du diagramme', () => {
  test('la case du type de matiere passe au niveau suivant et revient', async () => {
    const { app, filiere, matiere } = monter()
    const box = table(app, [filiere, matiere])
    const caseMatiere = [...box.querySelectorAll('input[type=checkbox]')]
      .find(c => c.parentElement?.textContent?.includes('Distinguer mati')) as HTMLInputElement
    expect(caseMatiere).toBeDefined()
    expect(caseMatiere.checked).toBe(false)
    caseMatiere.checked = true
    caseMatiere.dispatchEvent(new Event('change'))
    await attendre()
    expect(matiere.selected_tags_list.map(m => m.id).sort()).toEqual(['mp', 'produits'])
    const box2 = table(app, [filiere, matiere])
    const caseApres = [...box2.querySelectorAll('input[type=checkbox]')]
      .find(c => c.parentElement?.textContent?.includes('Distinguer mati')) as HTMLInputElement
    expect(caseApres.checked).toBe(true)
  })

  test('la filiere se choisit dans un arbre ; Distinguer les sous-filieres seulement si elle en a', async () => {
    const { app, filiere, matiere } = monter()
    const box = table(app, [filiere, matiere])
    const liste = box.querySelector('select') as HTMLSelectElement
    // Jean-Yves, 11/10 : filiere OU sous-filiere, dans l ordre de l arbre.
    expect([...liste.options].map(o => o.value)).toEqual(['cereales', 'ble', 'mais', 'orge', 'lait'])
    expect(liste.value).toBe('cereales')
    expect(box.textContent).toContain('Distinguer les sous-filières')
    liste.value = 'lait'
    liste.dispatchEvent(new Event('change'))
    await attendre()
    expect(filiere.selected_tags_list.map(m => m.id)).toEqual(['lait'])
    // Lait n a pas de sous-filiere : pas de case.
    expect(table(app, [filiere, matiere]).textContent).not.toContain('Distinguer les sous-filières')
  })

  test('distinguer les sous-filieres les met en bandes et gele la case du type de matiere', async () => {
    const { app, filiere, matiere } = monter()
    matiere.membersAtLevel(1).forEach(m => m.setSelected())
    matiere.tags_dict.matiere.setUnSelected()
    expect(matiere.current_level_index).toBe(1)
    const caseSous = [...table(app, [filiere, matiere]).querySelectorAll('input[type=checkbox]')]
      .find(c => c.parentElement?.textContent?.includes('sous-filières')) as HTMLInputElement
    caseSous.checked = true
    caseSous.dispatchEvent(new Event('change'))
    await attendre()
    expect(filiere.selected_tags_list.map(m => m.id).sort()).toEqual(['ble', 'mais', 'orge'])
    // Les deux cases s excluent : celle du type de matiere s est decochee et se gele.
    expect(matiere.current_level_index).toBe(0)
    const caseMatiere = [...table(app, [filiere, matiere]).querySelectorAll('input[type=checkbox]')]
      .find(c => c.parentElement?.textContent?.includes('Distinguer mati')) as HTMLInputElement
    expect(caseMatiere.disabled).toBe(true)
    const caseSousApres = [...table(app, [filiere, matiere]).querySelectorAll('input[type=checkbox]')]
      .find(c => c.parentElement?.textContent?.includes('sous-filières')) as HTMLInputElement
    expect(caseSousApres.checked).toBe(true)
  })

  test('deux sous-filieres decochent la case des autres : un seul pas a annuler', () => {
    const { app, filiere, matiere } = monter()
    matiere.membersAtLevel(1).forEach(m => m.setSelected())
    matiere.tags_dict.matiere.setUnSelected()
    applyReaderSubPick(app, filiere, filiere.tags_dict.cereales as Class_DataTag, ['ble', 'mais'])
    expect(filiere.selected_tags_list.map(m => m.id).sort()).toEqual(['ble', 'mais'])
    expect(matiere.current_level_index).toBe(0)
    app.history.applyUndo()
    expect(filiere.selected_tags_list.map(m => m.id)).toEqual(['cereales'])
    expect(matiere.current_level_index).toBe(1)
  })

  test('selectionner plusieurs puis annuler rend un seul diagramme, en un pas', () => {
    const { app, filiere } = monter()
    applyReaderSeveral(app, filiere, true)
    expect(filiere.draws_member_bands).toBe(true)
    app.history.applyUndo()
    expect(filiere.draws_member_bands).toBe(false)
    expect(filiere.selected_tags_list.map(m => m.id)).toEqual(['cereales'])
  })

  test('en colonne, pas de tableau : un bloc par dimension, niveaux a la ligne', () => {
    const { app, filiere, matiere } = monter()
    matiere.reader_control = undefined
    const box = buildDiagramNavigationTable(app, [filiere, matiere], { memory_key: 'col', vertical: true })
    expect(box.querySelector('table')).toBeNull()
    const blocs = box.querySelectorAll('.figure_navigation_column_dimension')
    expect(blocs).toHaveLength(2)
    // La filiere garde sa commande ; le type de matiere montre ses niveaux (a partir de l entree).
    expect(blocs[0].querySelector('select')).not.toBeNull()
    expect(blocs[1].querySelectorAll('.figure_navigation_level').length).toBeGreaterThan(0)
  })

  test('la commande du lecteur survit a l enregistrement', () => {
    const { app, filiere } = monter()
    filiere.reader_control = { kind: 'pick', label: 'Filière', multi_label: 'Sélectionner plusieurs filières' }
    const json = filiere.toJSON() as { reader_control?: unknown }
    expect(json.reader_control).toEqual({ kind: 'pick', label: 'Filière', multi_label: 'Sélectionner plusieurs filières' })
    const copie = app.drawing_area.sankey.addDataTagGroup('copie', 'Copie', false) as Class_DataTagGroup
    copie.fromJSON(json as never)
    expect(copie.reader_control).toEqual(filiere.reader_control)
  })

  test('en colonne, annee et unite d abord, en bloc a part ; peu d annees : des pastilles', async () => {
    // Julien, 12/10 : l annee quitte la frise, au-dessus de la filiere avec l unite, en pastilles.
    const { app, filiere, matiere } = monter()
    const sankey = app.drawing_area.sankey
    const annee = sankey.addDataTagGroup('annee', 'Année', false) as Class_DataTagGroup
    ;['2015', '2019', '2023'].forEach(a => annee.addTag(a, a))
    ;(annee.tags_dict['2023'] as Class_DataTag).setSelected()
    annee.banner = 'one'
    const unite = sankey.addDataTagGroup('unite', 'Unité', false) as Class_DataTagGroup
    ;['kt', 'pj', 'kt_ms', 'kt_mp', 'kt_mg', 'kt_ca'].forEach(u => unite.addTag(u, u))
    ;(unite.tags_dict['kt'] as Class_DataTag).setSelected()
    unite.banner = 'one'
    const box = buildDiagramNavigationTable(app, [filiere, annee, unite, matiere], { memory_key: 'essai', vertical: true })
    const blocs = [...box.querySelectorAll('.figure_navigation_column_dimension')] as HTMLElement[]
    expect(blocs[0].textContent).toContain('Année')
    expect(blocs[1].textContent).toContain('Unité')
    expect(blocs[2].textContent).toContain('Filière')
    // La fin du contexte se marque plus fort que les autres separations.
    expect(blocs[2].style.borderTop).toContain('2px')
    expect(blocs[1].style.borderTop).toContain('1px')
    // Trois annees : des pastilles ; six unites : une liste.
    const pastilles = [...blocs[0].querySelectorAll('[role=radio]')] as HTMLElement[]
    expect(pastilles.map(p => p.textContent)).toEqual(['2015', '2019', '2023'])
    expect(pastilles.map(p => p.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true'])
    expect(blocs[1].querySelector('select')).not.toBeNull()
    pastilles[0].click()
    await attendre()
    expect(annee.selected_tags_list.map(m => m.id)).toEqual(['2015'])
  })
})
