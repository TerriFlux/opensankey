import { MINI_APP_IDS, miniAppFromPathname } from './miniApps'

describe('miniAppFromPathname — sa#671', () => {
  it('reconnait une appli a la racine, avec ou sans barre finale', () => {
    expect(miniAppFromPathname('/sankeymatic/')).toBe('sankeymatic')
    expect(miniAppFromPathname('/sankeymatic')).toBe('sankeymatic')
    expect(miniAppFromPathname('/crosstab/')).toBe('crosstab')
  })

  it('reconnait une appli sous une langue', () => {
    expect(miniAppFromPathname('/fr/crosstab/')).toBe('crosstab')
    expect(miniAppFromPathname('/ja/sankeymatic')).toBe('sankeymatic')
  })

  it('ne reconnait ni l accueil, ni une langue seule, ni un creneau versionne', () => {
    expect(miniAppFromPathname('/')).toBeNull()
    expect(miniAppFromPathname('/fr/')).toBeNull()
    expect(miniAppFromPathname('/v1.3.6/sankeymatic/')).toBeNull()
    expect(miniAppFromPathname('/portfolios/crosstab/')).toBeNull()
    expect(miniAppFromPathname('/crosstab/index.html')).toBeNull()
  })

  it('la liste et le motif disent la meme chose', () => {
    for (const id of MINI_APP_IDS) expect(miniAppFromPathname(`/${id}/`)).toBe(id)
  })
})
