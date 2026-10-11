import {
  Class_Playback, type Type_PlaybackClock, type Type_PlaybackSettings, type Type_PlaybackSource,
  defaultPlaybackSettings, normalizePlaybackDelay, parsePlaybackSettings, shuffledSteps
} from './Playback'

// sa#639 — le moteur de lecture, sans dimensions : une horloge simulée, une source qui consigne
// ce qu'on lui demande. Les règles du ticket, une par test.

/** Horloge à la main : `paint()` peint l'écran, `advance(ms)` fait passer le temps. */
class FakeClock implements Type_PlaybackClock {
  public t = 0
  private paints: (() => void)[] = []
  private timers: { at: number, run: () => void, id: number }[] = []
  private next_id = 0
  now = () => this.t
  afterPaint = (run: () => void) => { this.paints.push(run) }
  setTimeout = (run: () => void, ms: number) => {
    const id = ++this.next_id
    this.timers.push({ at: this.t + ms, run, id })
    return id
  }
  clearTimeout = (handle: unknown) => { this.timers = this.timers.filter(t => t.id !== handle) }
  get pending_timers() { return this.timers.length }
  paint() {
    const runs = this.paints
    this.paints = []
    runs.forEach(r => r())
  }
  advance(ms: number) {
    this.t += ms
    const due = this.timers.filter(t => t.at <= this.t)
    this.timers = this.timers.filter(t => t.at > this.t)
    due.forEach(t => t.run())
  }
  /** Un pas complet : peindre, puis laisser passer le délai. */
  tick(ms: number) { this.paint(); this.advance(ms) }
}

class FakeSource implements Type_PlaybackSource {
  public shown: string[] = []
  public ended: boolean[] = []
  public takeover: (() => void) | null = null
  public draw_cost = 0
  public alive?: () => boolean
  public isExitTarget?: (target: Element) => boolean
  constructor(
    public key: string,
    private _steps: string[],
    public conf: Type_PlaybackSettings = { ...defaultPlaybackSettings(), delay: 1 },
    private clock?: FakeClock
  ) { }
  steps() { return [...this._steps] }
  settings() { return this.conf }
  begin(takeover: () => void) { this.takeover = takeover }
  show(step: string) {
    this.shown.push(step)
    if (this.clock) this.clock.t += this.draw_cost
  }
  end(restore: boolean) { this.ended.push(restore) }
}

const setup = (steps = ['a', 'b', 'c'], conf?: Partial<Type_PlaybackSettings>) => {
  const clock = new FakeClock()
  const engine = new Class_Playback(clock, () => 0.5)
  const source = new FakeSource('s', steps, { ...defaultPlaybackSettings(), delay: 1, ...conf }, clock)
  return { clock, engine, source }
}

describe('sa#639 — réglages de lecture', () => {
  test('délai : à la milliseconde, au moins 0,001 s, virgule acceptée', () => {
    expect(normalizePlaybackDelay(2)).toBe(2)
    expect(normalizePlaybackDelay('0,05')).toBe(0.05)
    expect(normalizePlaybackDelay(0.0004)).toBe(0.001)
    expect(normalizePlaybackDelay(1.23456)).toBe(1.235)
    expect(normalizePlaybackDelay(0)).toBeUndefined()
    expect(normalizePlaybackDelay('abc')).toBeUndefined()
  })

  test('JSON : clés absentes = défauts (2 s, sans boucle)', () => {
    expect(parsePlaybackSettings({})).toEqual({ loop: false, shuffle: false, delay: 2, autoplay: false })
    expect(parsePlaybackSettings(true)).toEqual(defaultPlaybackSettings())
    expect(parsePlaybackSettings({ loop: true, delay: 0.5, autoplay: true }))
      .toEqual({ loop: true, shuffle: false, delay: 0.5, autoplay: true })
    expect(parsePlaybackSettings(null)).toBeUndefined()
  })

  test('aléatoire : un mélange de tous les pas, qui ne recommence pas par le dernier montré', () => {
    const steps = ['a', 'b', 'c', 'd']
    const out = shuffledSteps(steps, () => 0, 'b')
    expect([...out].sort()).toEqual(steps)
    expect(out[0]).not.toBe('b')
  })
})

describe('sa#639 — moteur de lecture', () => {
  test('montre chaque pas dans l ordre, puis sort de lecture en rétablissant le choix', () => {
    const { clock, engine, source } = setup()
    engine.play(source)
    expect(source.shown).toEqual(['a'])
    expect(engine.position('s')).toEqual({ index: 1, count: 3 })
    clock.tick(1000)
    expect(source.shown).toEqual(['a', 'b'])
    clock.tick(1000)
    expect(engine.currentStep('s')).toBe('c')
    clock.tick(1000)
    expect(source.ended).toEqual([true])
    expect(engine.status).toBe('idle')
    expect(engine.position('s')).toBeNull()
  })

  test('le délai est un plancher : le pas suivant attend la peinture du précédent', () => {
    const { clock, engine, source } = setup()
    engine.play(source)
    // Rien n'a été peint : aucune minuterie n'est encore posée, aucun pas n'est sauté.
    expect(source.shown).toEqual(['a'])
    expect(clock.pending_timers).toBe(0)
    clock.paint()
    expect(clock.pending_timers).toBe(1)
    clock.advance(999)
    expect(source.shown).toEqual(['a'])
    clock.advance(1)
    expect(source.shown).toEqual(['a', 'b'])
  })

  test('un dessin plus long que le délai : pas d attente en plus, pas d empilement', () => {
    const { clock, engine, source } = setup(['a', 'b', 'c'], { delay: 0.001 })
    source.draw_cost = 50
    engine.play(source)
    clock.paint()
    expect(clock.pending_timers).toBe(1)
    clock.advance(0)
    expect(source.shown).toEqual(['a', 'b'])
    expect(clock.pending_timers).toBe(0)
  })

  test('pause : la valeur reste ; reprise : à la suivante', () => {
    const { clock, engine, source } = setup()
    engine.play(source)
    clock.tick(1000)
    engine.toggle(source)
    expect(engine.status).toBe('paused')
    clock.tick(5000)
    expect(source.shown).toEqual(['a', 'b'])
    expect(source.ended).toEqual([])
    engine.toggle(source)
    expect(source.shown).toEqual(['a', 'b', 'c'])
    expect(engine.status).toBe('playing')
  })

  test('boucle : on repart du premier', () => {
    const { clock, engine, source } = setup(['a', 'b'], { loop: true })
    engine.play(source)
    clock.tick(1000)
    clock.tick(1000)
    clock.tick(1000)
    expect(source.shown).toEqual(['a', 'b', 'a', 'b'])
    expect(source.ended).toEqual([])
  })

  test('aléatoire en boucle : chaque valeur passe une fois par tour', () => {
    const clock = new FakeClock()
    let seed = 7
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    const engine = new Class_Playback(clock, random)
    const steps = ['a', 'b', 'c', 'd', 'e']
    const source = new FakeSource('s', steps, { ...defaultPlaybackSettings(), delay: 1, shuffle: true, loop: true }, clock)
    engine.play(source)
    for (let i = 0; i < 3 * steps.length - 1; i++) clock.tick(1000)
    for (let round = 0; round < 3; round++) {
      expect([...source.shown.slice(round * 5, round * 5 + 5)].sort()).toEqual(steps)
    }
    // Pas deux fois la même valeur de suite, même d'un tour à l'autre.
    source.shown.forEach((s, i) => { if (i > 0) expect(s).not.toBe(source.shown[i - 1]) })
  })

  test('une seule lecture à la fois : en lancer une arrête l autre', () => {
    const { clock, engine, source } = setup()
    const other = new FakeSource('o', ['x', 'y'], { ...defaultPlaybackSettings(), delay: 1 }, clock)
    engine.play(source)
    engine.play(other)
    expect(source.ended).toEqual([true])
    expect(engine.isSource('o')).toBe(true)
    clock.tick(1000)
    expect(source.shown).toEqual(['a'])
    expect(other.shown).toEqual(['x', 'y'])
  })

  test('un choix fait ailleurs fait sortir de lecture sans rétablir', () => {
    const { clock, engine, source } = setup()
    engine.play(source)
    source.takeover?.()
    expect(source.ended).toEqual([false])
    clock.tick(1000)
    expect(source.shown).toEqual(['a'])
  })

  test('le délai et la boucle changés en cours de lecture valent dès le pas suivant', () => {
    const { clock, engine, source } = setup(['a', 'b'])
    engine.play(source)
    source.conf = { ...source.conf, delay: 3, loop: true }
    clock.tick(1000)
    expect(source.shown).toEqual(['a'])
    clock.advance(2000)
    expect(source.shown).toEqual(['a', 'b'])
    clock.tick(3000)
    expect(source.shown).toEqual(['a', 'b', 'a'])
  })

  test('lecture automatique : démarre après la peinture, rien si aucune source', () => {
    const { clock, engine, source } = setup()
    engine.autoplay(() => null)
    clock.paint()
    expect(engine.status).toBe('idle')
    const done = jest.fn()
    engine.autoplay(() => source, done)
    expect(source.shown).toEqual([])
    clock.paint()
    expect(engine.is_autoplay).toBe(true)
    expect(source.shown).toEqual(['a'])
    engine.stop()
    expect(done).toHaveBeenCalledTimes(1)
  })

  test('lecture automatique : le premier geste du lecteur la fait sortir, pas un geste sur ses commandes', () => {
    const { clock, engine, source } = setup()
    engine.autoplay(() => source)
    clock.paint()
    const control = document.createElement('button')
    control.setAttribute('data-playback-control', '')
    document.body.appendChild(control)
    control.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(engine.status).toBe('playing')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(engine.status).toBe('idle')
    expect(source.ended).toEqual([true])
    control.remove()
  })

  test('hors lecture automatique, seul un clic sur le diagramme fait sortir', () => {
    const { engine, source } = setup()
    const diagram = document.createElement('div')
    document.body.appendChild(diagram)
    source.isExitTarget = (target: Element) => diagram.contains(target)
    engine.play(source)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }))
    expect(engine.status).toBe('playing')
    diagram.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(engine.status).toBe('idle')
    diagram.remove()
  })

  test('une source disparue (autre fichier ouvert) s arrête sans rien rétablir', () => {
    const { clock, engine, source } = setup()
    let alive = true
    source.alive = () => alive
    engine.play(source)
    alive = false
    clock.tick(1000)
    expect(source.ended).toEqual([false])
    expect(source.shown).toEqual(['a'])
  })
})
