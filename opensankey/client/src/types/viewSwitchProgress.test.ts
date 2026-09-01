import {
  Class_ViewSwitchProgress,
  afterViewChange,
  viewSwitchPath,
  yieldToBrowser,
  Type_ViewSwitchIndicator,
} from './viewSwitchProgress'

// os#1368 — L'ORDONNANCEMENT du changement de vue, testé sans rendu (aucune suite jest du dépôt ne
// peut charger @chakra-ui/react). Ce module porte la décision et la cession ; le dessin de
// l'indicateur vit dans viewSwitchOverlay.ts, testé à part.

const MASTER = 'sankey'

/** Indicateur espion : journalise show/hide dans l'ordre où ils tombent. */
const makeSpyIndicator = () => {
  const calls: string[] = []
  const indicator: Type_ViewSwitchIndicator = {
    show: () => { calls.push('show') },
    hide: () => { calls.push('hide') },
  }
  return { indicator, calls }
}

describe('os#1368 viewSwitchPath', () => {
  it('le maitre passe par le chemin light', () => {
    expect(viewSwitchPath(MASTER, MASTER, {})).toBe('light')
  })

  it('une vue marquee light passe par le chemin light', () => {
    expect(viewSwitchPath('v1', MASTER, { v1: { is_light: true } })).toBe('light')
  })

  it('une vue a snapshot passe par le chemin heavy', () => {
    expect(viewSwitchPath('v1', MASTER, { v1: { is_light: false } })).toBe('heavy')
  })

  it('une vue inconnue passe par le chemin heavy, comme applyViewChange', () => {
    expect(viewSwitchPath('inconnue', MASTER, {})).toBe('heavy')
  })
})

describe('os#1368 Class_ViewSwitchProgress — cession avant le travail lourd', () => {
  it('le chemin heavy pose l indicateur, CEDE la main, PUIS travaille', async () => {
    const { indicator, calls } = makeSpyIndicator()
    const progress = new Class_ViewSwitchProgress({
      indicator,
      yield_to_browser: async () => { calls.push('yield') },
    })
    await progress.run('heavy', () => { calls.push('work') })
    // L'ordre est TOUT le correctif : sans « yield » entre « show » et « work », le navigateur
    // ne repeint jamais et l'indicateur n'est pas visible.
    expect(calls).toEqual(['show', 'yield', 'work', 'hide'])
  })

  it('sans indicateur, rien n est cede : le comportement reste celui d avant le lot', () => {
    const calls: string[] = []
    const progress = new Class_ViewSwitchProgress({
      yield_to_browser: async () => { calls.push('yield') },
    })
    const result = progress.run('heavy', () => { calls.push('work') })
    expect(result).toBeUndefined()
    expect(calls).toEqual(['work'])
  })

  it('l indicateur est retire meme si le changement ECHOUE', async () => {
    const { indicator, calls } = makeSpyIndicator()
    const progress = new Class_ViewSwitchProgress({
      indicator,
      yield_to_browser: () => Promise.resolve(),
    })
    await expect(progress.run('heavy', () => { throw new Error('switch casse') }))
      .rejects.toThrow('switch casse')
    expect(calls).toEqual(['show', 'hide'])
    expect(progress.is_indicator_shown).toBe(false)
    expect(progress.is_busy).toBe(false)
  })
})

describe('os#1368 Class_ViewSwitchProgress — le chemin light reste intact', () => {
  it('une vue light ne pose AUCUN indicateur et s applique synchroniquement', () => {
    const { indicator, calls } = makeSpyIndicator()
    const progress = new Class_ViewSwitchProgress({ indicator })
    let applied = false
    const result = progress.run('light', () => { applied = true })
    expect(result).toBeUndefined()
    expect(applied).toBe(true) // deja fait AU RETOUR : aucune frame de latence ajoutee
    expect(calls).toEqual([])
  })

  it('shouldDefer dit non au light et oui au heavy', () => {
    const { indicator } = makeSpyIndicator()
    const progress = new Class_ViewSwitchProgress({ indicator })
    expect(progress.shouldDefer('light')).toBe(false)
    expect(progress.shouldDefer('heavy')).toBe(true)
  })
})

describe('os#1368 Class_ViewSwitchProgress — enchainements et concurrence', () => {
  it('deux switches enchaines ne laissent pas l indicateur affiche', async () => {
    const { indicator, calls } = makeSpyIndicator()
    const progress = new Class_ViewSwitchProgress({
      indicator,
      yield_to_browser: () => Promise.resolve(),
    })
    const a = progress.run('heavy', () => { calls.push('work_a') })
    const b = progress.run('heavy', () => { calls.push('work_b') })
    await Promise.all([a, b])
    // Un seul voile pose, un seul retire, et les deux travaux entre les deux.
    expect(calls).toEqual(['show', 'work_a', 'work_b', 'hide'])
    expect(progress.is_indicator_shown).toBe(false)
  })

  it('un switch LIGHT arrive pendant un heavy est cede lui aussi, pour garder l ORDRE', async () => {
    const { indicator, calls } = makeSpyIndicator()
    const progress = new Class_ViewSwitchProgress({
      indicator,
      yield_to_browser: () => Promise.resolve(),
    })
    const heavy = progress.run('heavy', () => { calls.push('work_heavy') })
    // Sans l invariant, ce light s appliquerait TOUT DE SUITE, avant le heavy deja cede :
    // le diagramme finirait sur la vue heavy alors que le dernier geste visait la light.
    const light = progress.run('light', () => { calls.push('work_light') })
    expect(light).toBeInstanceOf(Promise)
    await Promise.all([heavy, light])
    expect(calls).toEqual(['show', 'work_heavy', 'work_light', 'hide'])
  })

  it('un echec au milieu d un enchainement retire quand meme l indicateur', async () => {
    const { indicator, calls } = makeSpyIndicator()
    const progress = new Class_ViewSwitchProgress({
      indicator,
      yield_to_browser: () => Promise.resolve(),
    })
    const a = progress.run('heavy', () => { throw new Error('boum') })
    const b = progress.run('heavy', () => { calls.push('work_b') })
    await expect(a).rejects.toThrow('boum')
    await b
    expect(calls).toEqual(['show', 'work_b', 'hide'])
    expect(progress.is_indicator_shown).toBe(false)
  })

  it('apres un enchainement, un nouveau switch light repart en synchrone', async () => {
    const { indicator } = makeSpyIndicator()
    const progress = new Class_ViewSwitchProgress({
      indicator,
      yield_to_browser: () => Promise.resolve(),
    })
    await progress.run('heavy', () => undefined)
    expect(progress.is_busy).toBe(false)
    expect(progress.run('light', () => undefined)).toBeUndefined()
  })
})

describe('os#1368 yieldToBrowser', () => {
  it('cede sur DEUX requestAnimationFrame imbriques : un seul ne repeint pas', async () => {
    const frames: Array<() => void> = []
    const original = (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame
    ;(globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame =
      (cb: () => void) => { frames.push(cb); return frames.length }
    let resolved = false
    const promise = yieldToBrowser().then(() => { resolved = true })
    // Frame 1 : le premier rAF ne fait qu enregistrer le second — rien n est encore rendu.
    expect(frames).toHaveLength(1)
    frames.shift()!()
    await Promise.resolve()
    expect(resolved).toBe(false)
    // Frame 2 : la frame precedente a ete peinte, on peut travailler.
    expect(frames).toHaveLength(1)
    frames.shift()!()
    await promise
    expect(resolved).toBe(true)
    ;(globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = original
  })

  it('se replie sur setTimeout quand requestAnimationFrame n existe pas', async () => {
    const original = (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame
    delete (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame
    await expect(yieldToBrowser()).resolves.toBeUndefined()
    ;(globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = original
  })
})

describe('os#1369 le meme ordonnanceur sert les autres gestes lourds', () => {
  // Ce que fait Class_ApplicationData.runHeavyGesture pour le filtrage par dataTag :
  // meme instance que la bascule de vue, chemin heavy impose.
  it('un geste de filtrage cede la main et pose le voile', async () => {
    const { indicator, calls } = makeSpyIndicator()
    const progress = new Class_ViewSwitchProgress({ indicator })
    const order: string[] = []
    await progress.run('heavy', () => { order.push('filtrage') })
    expect(order).toEqual(['filtrage'])
    expect(calls).toEqual(['show', 'hide'])
  })

  it('un filtrage demande pendant une bascule cedee ne passe pas devant elle', async () => {
    const { indicator, calls } = makeSpyIndicator()
    const progress = new Class_ViewSwitchProgress({ indicator })
    const order: string[] = []
    const bascule = progress.run('heavy', () => { order.push('bascule') })
    // Meme instance : l invariant d ordre vaut ENTRE les deux familles de gestes, donc
    // le filtrage est differe lui aussi, meme s il se declarait leger.
    const filtrage = progress.run('light', () => { order.push('filtrage') })
    expect(order).toEqual([])
    await Promise.all([bascule, filtrage])
    expect(order).toEqual(['bascule', 'filtrage'])
    // Un seul voile, retire au retour du DERNIER travail.
    expect(calls).toEqual(['show', 'hide'])
  })
})

describe('os#1368 afterViewChange', () => {
  it('enchaine immediatement quand le switch etait synchrone', () => {
    let done = false
    afterViewChange(undefined, () => { done = true })
    expect(done).toBe(true)
  })

  it('attend la fin du switch cede avant d enchainer', async () => {
    const order: string[] = []
    let release: () => void = () => undefined
    const pending = new Promise<void>((r) => { release = () => { order.push('switch'); r() } })
    afterViewChange(pending, () => { order.push('refresh') })
    expect(order).toEqual([])
    release()
    await pending
    await Promise.resolve()
    expect(order).toEqual(['switch', 'refresh'])
  })

  it('rafraichit quand meme si le switch a echoue, et signale l erreur', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    let done = false
    const failed = Promise.reject(new Error('casse'))
    afterViewChange(failed, () => { done = true })
    await failed.catch(() => undefined)
    await Promise.resolve()
    expect(done).toBe(true)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
