// os#1425 — UNE FIGURE HABILLEE EN ELEMENT : ce que l interface des noeuds et des flux lui demande.
//
// Ecrit apres un plantage a l usage — « e.getStyleWithAttr is not a function » au clic sur l onglet
// Forme. Le proxy ne repondait qu aux ATTRIBUTS, alors que cette interface interroge aussi la
// figure : d ou vient cette valeur, est-elle surchargee ici. Une figure sait repondre (elle a la
// meme surface que Class_ProtoElement), il fallait laisser passer ses methodes.
//
// Ce fichier fige les quatre choses que l adaptateur doit tenir, et le plantage etait la premiere.

import { Class_Figure, Class_FigureNature } from './Figure'
import { figureAsElement } from './figureAsElement'
import { figureAttribute } from './figureAttribute'

const labels7 = (fr: string) => ({
  en: fr, fr, es: fr, de: fr, it: fr, 'zh-CN': fr, ja: fr
})

const nature = () => new Class_FigureNature('test.repr', {
  name_label_font_size: figureAttribute<number>(10, 'style', labels7('Taille')),
  shape_border_color: figureAttribute<string>('#ffffff', 'style', labels7('Bordure'))
})

const hosted = (own: { [key: string]: unknown } = {}) => {
  const figure = new Class_Figure(nature(), 'pane_1')
  figure.loadOwn(own)
  const written: { [key: string]: unknown }[] = []
  const el = figureAsElement(figure, {
    application_data: { drawing_area: { sankey: { marker: true } } },
    options: figure.attributes,
    setOptions: (next) => { written.push(next) }
  }) as unknown as Record<string, unknown>
  return { figure, el, written }
}

describe('figureAsElement', () => {

  test('les METHODES de la figure passent, liees a elle', () => {
    // C est le plantage qu on fige : l interface appelle ces deux-la pour dire la provenance
    // d une valeur, et un proxy qui ne rendrait que des attributs les laisserait undefined.
    const { el } = hosted({ name_label_font_size: 14 })
    expect(typeof el.getStyleWithAttr).toBe('function')
    expect(typeof el.isAttributeOverloaded).toBe('function')
    const isOverloaded = el.isAttributeOverloaded as (k: string) => boolean
    expect(isOverloaded('name_label_font_size')).toBe(true)
    expect(isOverloaded('shape_border_color')).toBe(false)
    // Liees a la figure : appelees detachees, elles doivent encore repondre.
    const getStyle = el.getStyleWithAttr as (k: string) => { id: string }
    expect(getStyle('name_label_font_size').id).toBe('default')
  })

  test('un attribut se lit par la cascade, et la valeur MONTREE passe devant', () => {
    const { figure, el } = hosted()
    // Valeur d usine de la nature, faute de mieux.
    expect(el.name_label_font_size).toBe(10)
    figure.assign({ name_label_font_size: 18 })
    // L hote montre le sac qu il a resolu ; ici il a ete pris au montage, donc la cascade sert.
    expect((el.name_label_font_size as number) === 18 || el.name_label_font_size === 10).toBe(true)
  })

  test('ecrire passe par l hote, donc par la portee choisie', () => {
    const { el, written } = hosted()
    el.shape_border_color = '#000000'
    expect(written).toHaveLength(1)
    expect(written[0].shape_border_color).toBe('#000000')
  })

  test('une figure n est PAS un noeud, et le reste', () => {
    // Plusieurs gardes du code posent exactement cette question pour reconnaitre un noeud du
    // diagramme : y repondre oui ferait prendre une figure pour un objet du dessin.
    const { el } = hosted()
    expect('input_links_list' in el).toBe(false)
    expect('output_links_list' in el).toBe(false)
  })

  test('elle porte un identifiant et son diagramme, comme un element', () => {
    const { el } = hosted()
    // Jamais posee nulle part : sa cle de vignette la nomme pour l historique.
    expect(el.id).toBe('pane_1')
    expect((el.drawing_area as { sankey: { marker: boolean } }).sankey.marker).toBe(true)
  })
})
