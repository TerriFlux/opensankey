import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTagGroup } from './TagGroup'
import type { Type_JSON } from './Utils'

// os#1517 — la barre du haut est un reglage a part, plus une valeur de `banner`.
//
// Julien, 30/09 : « il faut pouvoir dire que c est en topbar independamment des autres options ».
// Ce qui compte ici est la COMPATIBILITE dans les deux sens : un fichier existant `banner:
// 'topbar'` se relit « un membre + barre du haut », et ce cas s ecrit encore `banner: 'topbar'`
// pour qu un viewer publie anterieur le montre toujours en haut.

function groupe() {
  const app = new Class_ApplicationData(false)
  const g = app.drawing_area.sankey.addDataTagGroup('essence', 'Essence', false) as unknown as Class_DataTagGroup
  g.addTag('Chene', 'chene')
  return g
}

describe('os#1517 — barre du haut independante de la banniere', () => {
  test('un ancien banner topbar se lit un membre et barre du haut', () => {
    const g = groupe()
    const ancien = { ...(g.toJSON() as object), banner: 'topbar' } as unknown as Type_JSON
    g.fromJSON(ancien)
    expect(g.banner).toBe('one')
    expect(g.in_topbar).toBe(true)
  })

  test('un membre en barre du haut s ecrit encore topbar pour les viewers anterieurs', () => {
    const g = groupe()
    g.banner = 'one'
    g.in_topbar = true
    const json = g.toJSON() as { banner: string, topbar?: boolean }
    expect(json.banner).toBe('topbar')
    expect(json.topbar).toBe(true)
  })

  test('en bandes et en barre du haut : les deux reglages survivent a l aller retour', () => {
    const g = groupe()
    g.banner = 'multi'
    g.in_topbar = true
    const json = g.toJSON()
    expect((json as { banner: string }).banner).toBe('multi')
    const relu = groupe()
    relu.fromJSON(json)
    expect(relu.banner).toBe('multi')
    expect(relu.in_topbar).toBe(true)
  })

  test('hors barre du haut, aucune cle topbar n est ecrite', () => {
    const g = groupe()
    g.banner = 'sequence'
    const json = g.toJSON() as { banner: string, topbar?: boolean }
    expect(json.banner).toBe('sequence')
    expect(json.topbar).toBeUndefined()
  })
})
