import { escapeHtml } from './htmlEscape'

// OS#305 — Les constructeurs de contenu hérités assemblent du HTML par
// concaténation et l'injectent tel quel. Tout ce qui vient du DOCUMENT (nom de
// nœud, libellé de tag, unité…) est saisi par l'auteur : sans échappement, un
// `<` casse le tableau au mieux, injecte du balisage au pire.

describe('#305 escapeHtml', () => {
  it('neutralise les caractères structurants du HTML', () => {
    expect(escapeHtml('<b>')).toBe('&lt;b&gt;')
    expect(escapeHtml('a & b')).toBe('a &amp; b')
    expect(escapeHtml('dit "bonjour"')).toBe('dit &quot;bonjour&quot;')
    expect(escapeHtml('l\'eau')).toBe('l&#39;eau')
  })

  it('échappe l\'esperluette AVANT le reste (pas de double échappement inversé)', () => {
    // Si '<' était traité en premier, '&lt;' deviendrait '&amp;lt;'.
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })

  it('neutralise une tentative d\'injection dans un nom d\'élément', () => {
    const nom = '<img src=x onerror="alert(1)">'
    const echappe = escapeHtml(nom)
    expect(echappe).not.toContain('<img')
    expect(echappe).not.toContain('onerror="')
    expect(echappe).toContain('&lt;img')
  })

  it('laisse le texte ordinaire intact', () => {
    expect(escapeHtml('Blé tendre — récolte 2024')).toBe('Blé tendre — récolte 2024')
    expect(escapeHtml('')).toBe('')
  })

  it('rend une chaîne vide pour null/undefined, jamais « null »', () => {
    // Sans ce garde-fou, un attribut absent s'afficherait littéralement.
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('accepte les valeurs non textuelles', () => {
    expect(escapeHtml(42)).toBe('42')
    expect(escapeHtml(0)).toBe('0')
  })
})
