// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// sa#639 — LA LECTURE, UNE CASE QU'ON AJOUTE À UN SÉLECTEUR.
//
// CE QUI A ÉTÉ DEMANDÉ (consortium SOCLE, arbitré par Alexandre le 11/10). Faire défiler les
// valeurs d'un sélecteur « comme un film », pour le lecteur qui arrive sans question précise :
// boucle, aléatoire, délai réglable, lecture automatique à l'ouverture. La lecture n'est plus un
// MODE de sélecteur (l'ancienne bannière « Séquence », qui imposait un membre à la fois) : c'est
// une case, qui se combine au nombre de membres choisis.
//
// POURQUOI UN MOTEUR SANS DIMENSIONS. L'ancien moteur (`launchDataSequence`) parcourait un groupe
// de dimensions et rien d'autre. Ce ticket le livre pour les dimensions, mais les suites le
// branchent ailleurs : nœuds d'un volet (#640), tableaux de bord en diaporama (#641), groupes
// d'étiquettes et niveaux. Le moteur ne connaît donc qu'une SOURCE (`Type_PlaybackSource`) : une
// liste de pas, une façon d'en montrer un, une façon de revenir à la sélection.
//
// LES RÈGLES DU TICKET, toutes ici :
//  - une seule lecture à la fois : en lancer une arrête celle qui tourne ;
//  - le délai est un PLANCHER : le pas suivant attend que le précédent soit peint (pas
//    d'empilement de minuteries ; à 0,001 s, la vitesse réelle est celle du dessin) ;
//  - aléatoire = mélange sans répétition, nouveau mélange à chaque tour ;
//  - ⏸ garde la valeur en cours à l'écran, ▶ reprend à la suivante ;
//  - fin sans boucle, ou geste qui change ce que la source montre : sortie de lecture ;
//  - lecture automatique (fichier enregistré pendant la lecture) : le premier geste du lecteur
//    (clic, touche) la fait sortir de lecture.

/**
 * Les réglages de lecture d'un sélecteur, enregistrés avec lui. Délai en SECONDES. `autoplay` n'est
 * pas un réglage qu'on coche : il dit si la lecture tournait quand le fichier a été enregistré.
 */
export type Type_PlaybackSettings = {
  loop: boolean
  shuffle: boolean
  delay: number
  autoplay: boolean
}

export const PLAYBACK_DEFAULT_DELAY = 2
/** Le délai descend jusqu'à la milliseconde, pas en dessous. */
export const PLAYBACK_MIN_DELAY = 0.001

export const defaultPlaybackSettings = (): Type_PlaybackSettings =>
  ({ loop: false, shuffle: false, delay: PLAYBACK_DEFAULT_DELAY, autoplay: false })

/** Un délai lisible (nombre positif, arrondi à la milliseconde, au moins 0,001 s) ; sinon `undefined`. */
export const normalizePlaybackDelay = (value: unknown): number | undefined => {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return undefined
  return Math.max(PLAYBACK_MIN_DELAY, Math.round(n * 1000) / 1000)
}

/** Lit les réglages d'un JSON ; une clé absente ou illisible prend sa valeur par défaut. */
export const parsePlaybackSettings = (raw: unknown): Type_PlaybackSettings | undefined => {
  if (raw === true) return defaultPlaybackSettings()
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as { [_: string]: unknown }
  return {
    loop: o['loop'] === true,
    shuffle: o['shuffle'] === true,
    delay: normalizePlaybackDelay(o['delay']) ?? PLAYBACK_DEFAULT_DELAY,
    autoplay: o['autoplay'] === true
  }
}

export const copyPlaybackSettings = (s: Type_PlaybackSettings): Type_PlaybackSettings => ({ ...s })

/**
 * Ce que le moteur fait défiler. La source montre un pas SANS toucher à ce que l'utilisateur a
 * choisi (ni historique, ni cases cochées) et sait revenir à son choix.
 */
export interface Type_PlaybackSource {
  /** Identifie la source (deux objets qui se valent ont la même clé). */
  readonly key: string
  /** Les pas, dans l'ordre de la source. Lus au lancement. */
  steps(): string[]
  /** Les réglages, relus à chaque pas : le lecteur peut les changer pendant la lecture. */
  settings(): Type_PlaybackSettings
  /**
   * La lecture commence. `takeover` est à appeler quand quelqu'un d'autre change ce que la source
   * montre (un clic dans le sélecteur, une annulation) : la lecture s'arrête et ce choix reste.
   */
  begin(takeover: () => void): void
  /**
   * Montre un pas. Synchrone, ou une promesse tenue quand le pas est en place (sa#641 : un tableau
   * de bord, dont les volets se dessinent après la bascule) — le délai court depuis le début du pas.
   */
  show(step: string): void | Promise<void>
  /** La lecture finit : `restore` = revenir au choix de l'utilisateur (sinon il vient d'en faire un). */
  end(restore: boolean): void
  /** La source existe-t-elle encore ? (un autre fichier a pu être ouvert entre deux pas) */
  alive?(): boolean
  /** Un clic sur cet élément fait-il sortir de lecture ? (le diagramme que la source redessine) */
  isExitTarget?(target: Element): boolean
}

export type Type_PlaybackStatus = 'idle' | 'playing' | 'paused'

/** L'horloge du moteur, remplaçable dans les tests. */
export type Type_PlaybackClock = {
  now: () => number
  /** Après que l'écran a été peint. */
  afterPaint: (run: () => void) => void
  setTimeout: (run: () => void, ms: number) => unknown
  clearTimeout: (handle: unknown) => void
}

const browserClock: Type_PlaybackClock = {
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  // Deux temps : la frame qui peint, puis la tâche qui la suit.
  afterPaint: run => {
    if (typeof requestAnimationFrame === 'undefined') { setTimeout(run, 0); return }
    requestAnimationFrame(() => setTimeout(run, 0))
  },
  setTimeout: (run, ms) => setTimeout(run, ms),
  clearTimeout: handle => clearTimeout(handle as ReturnType<typeof setTimeout>)
}

/** Un ordre mélangé (Fisher-Yates) ; `avoid_first` : ne pas recommencer par le dernier pas montré. */
export const shuffledSteps = (steps: string[], random: () => number = Math.random, avoid_first?: string): string[] => {
  const out = [...steps]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp
  }
  if (avoid_first !== undefined && out.length > 1 && out[0] === avoid_first) {
    const j = 1 + Math.floor(random() * (out.length - 1))
    const tmp = out[0]; out[0] = out[j]; out[j] = tmp
  }
  return out
}

/** Attribut posé sur les commandes de lecture : un geste sur elles ne fait pas sortir de lecture. */
export const PLAYBACK_CONTROL_ATTR = 'data-playback-control'

export class Class_Playback {
  private _source: Type_PlaybackSource | null = null
  private _status: Type_PlaybackStatus = 'idle'
  private _steps: string[] = []
  private _order: string[] = []
  private _index = -1
  private _timer: unknown = undefined
  // Chaque lancement, pause ou arrêt change de génération : un rappel d'une génération passée ne
  // fait plus rien. C'est ce qui interdit l'empilement de minuteries.
  private _generation = 0
  private _autoplay = false
  private _listeners = new Set<() => void>()
  private _detach_gestures: (() => void) | null = null
  // Prévenu quand le lecteur a fait sortir la lecture automatique (geste, fin) : elle ne revient pas.
  private _on_autoplay_done: (() => void) | null = null

  constructor(
    private _clock: Type_PlaybackClock = browserClock,
    private _random: () => number = Math.random
  ) { }

  // ÉTAT ===========================================================================================

  public get status(): Type_PlaybackStatus { return this._status }
  public get source_key(): string | null { return this._source?.key ?? null }
  /** Lancée par la lecture automatique : le premier geste du lecteur la fait sortir. */
  public get is_autoplay(): boolean { return this._autoplay }

  public isSource(key: string): boolean { return this._source !== null && this._source.key === key }

  /** « 3 / 9 » : le pas montré (à partir de 1) et le nombre de pas du tour ; `null` hors lecture. */
  public position(key: string): { index: number, count: number } | null {
    if (!this.isSource(key) || this._index < 0) return null
    return { index: this._index + 1, count: this._order.length }
  }

  /** Le pas montré par cette source, `null` hors lecture. */
  public currentStep(key: string): string | null {
    if (!this.isSource(key) || this._index < 0) return null
    return this._order[this._index] ?? null
  }

  public subscribe(listener: () => void): () => void {
    this._listeners.add(listener)
    return () => { this._listeners.delete(listener) }
  }

  private notify() { [...this._listeners].forEach(l => l()) }

  // GESTES =========================================================================================

  /** ▶ / ⏸ d'un sélecteur. */
  public toggle(source: Type_PlaybackSource): void {
    if (this.isSource(source.key) && this._status === 'playing') this.pause()
    else if (this.isSource(source.key) && this._status === 'paused') this.resume()
    else this.play(source)
  }

  /** Lance la lecture de `source`, en arrêtant celle qui tourne. */
  public play(source: Type_PlaybackSource, options: { autoplay?: boolean, onAutoplayDone?: () => void } = {}): void {
    if (this._source !== null) this.stop()
    if (source.alive?.() === false) return
    const steps = source.steps()
    if (steps.length === 0) return
    this._source = source
    this._steps = steps
    this._order = this.round(undefined)
    this._index = -1
    this._status = 'playing'
    this._autoplay = options.autoplay === true
    this._on_autoplay_done = this._autoplay ? (options.onAutoplayDone ?? null) : null
    source.begin(() => { if (this._source === source) this.takeover() })
    this.attachGestures()
    this.step()
  }

  /** ⏸ : la valeur en cours reste affichée. */
  public pause(): void {
    if (this._status !== 'playing') return
    this.cancelTimer()
    this._status = 'paused'
    this.notify()
  }

  /** ▶ après ⏸ : reprend à la suivante. */
  public resume(): void {
    if (this._status !== 'paused') return
    this._status = 'playing'
    this.step()
  }

  /** Sortie de lecture : la source revient au choix de l'utilisateur. */
  public stop(): void { this.finish(true) }

  /** Quelqu'un d'autre a changé ce que la source montre : on s'arrête, son choix reste. */
  public takeover(): void { this.finish(false) }

  /**
   * Les réglages de la source ont changé pendant la lecture. Le délai et la boucle sont relus au
   * pas suivant ; l'aléatoire, lui, réordonne ce qui reste à voir de ce tour.
   */
  public settingsChanged(key: string): void {
    if (!this.isSource(key) || this._source === null) return
    const played = this._order.slice(0, this._index + 1)
    const rest = this._steps.filter(s => !played.includes(s))
    this._order = [...played, ...(this._source.settings().shuffle ? shuffledSteps(rest, this._random) : rest)]
    this.notify()
  }

  /**
   * Lecture automatique : `find` rend la source à lancer (ou `null`), appelée une fois l'écran
   * peint — le document vient d'être ouvert, le dessin d'ouverture doit passer d'abord.
   * `onDone` : le lecteur l'a fait sortir de lecture (premier geste) ou elle est allée au bout.
   */
  public autoplay(find: () => Type_PlaybackSource | null, onDone?: () => void): void {
    this._clock.afterPaint(() => {
      const source = find()
      if (source === null) return
      this.play(source, { autoplay: true, onAutoplayDone: onDone })
    })
  }

  /** Si la source en lecture n'existe plus (autre fichier ouvert), on s'arrête sans rien redessiner. */
  public dropDeadSource(): void {
    if (this._source?.alive?.() === false) this.takeover()
  }

  // MÉCANIQUE ======================================================================================

  private round(last_shown: string | undefined): string[] {
    const settings = this._source?.settings()
    return settings?.shuffle ? shuffledSteps(this._steps, this._random, last_shown) : [...this._steps]
  }

  private cancelTimer() {
    this._generation++
    if (this._timer !== undefined) this._clock.clearTimeout(this._timer)
    this._timer = undefined
  }

  private step(): void {
    const source = this._source
    if (source === null || this._status !== 'playing') return
    if (source.alive?.() === false) { this.takeover(); return }
    this.cancelTimer()
    const generation = this._generation
    let next = this._index + 1
    if (next >= this._order.length) {
      if (!source.settings().loop) { this.stop(); return }
      this._order = this.round(this._order[this._index])
      next = 0
    }
    this._index = next
    const started = this._clock.now()
    const shown = source.show(this._order[next])
    // `show` a pu faire sortir de lecture (le dessin a changé la sélection d'une autre façon).
    if (this._source !== source || generation !== this._generation) return
    this.notify()
    const schedule = () => this._clock.afterPaint(() => {
      if (generation !== this._generation || this._status !== 'playing') return
      const delay_ms = source.settings().delay * 1000
      const wait = Math.max(0, delay_ms - (this._clock.now() - started))
      this._timer = this._clock.setTimeout(() => {
        if (generation !== this._generation) return
        this._timer = undefined
        this.step()
      }, wait)
    })
    // sa#641 — un pas qui se met en place en plusieurs temps : le suivant attend qu'il y soit.
    if (shown) void shown.then(() => { if (generation === this._generation) schedule() }, () => this.stop())
    else schedule()
  }

  private finish(restore: boolean): void {
    const source = this._source
    if (source === null) return
    const autoplay_done = restore ? this._on_autoplay_done : null
    this.cancelTimer()
    this._source = null
    this._status = 'idle'
    this._steps = []
    this._order = []
    this._index = -1
    this._autoplay = false
    this._on_autoplay_done = null
    this.detachGestures()
    source.end(restore)
    autoplay_done?.()
    this.notify()
  }

  /**
   * Un clic sur le diagramme fait sortir de lecture ; en lecture automatique, tout premier geste
   * du lecteur (clic, touche) aussi. Les commandes de lecture elles-mêmes ne comptent pas.
   */
  private attachGestures() {
    this.detachGestures()
    if (typeof window === 'undefined') return
    const onPointer = (evt: Event) => {
      const target = evt.target instanceof Element ? evt.target : null
      if (target?.closest(`[${PLAYBACK_CONTROL_ATTR}]`)) return
      if (this._autoplay || (target !== null && this._source?.isExitTarget?.(target) === true)) this.stop()
    }
    const onKey = (evt: KeyboardEvent) => {
      if (!this._autoplay) return
      const target = evt.target instanceof Element ? evt.target : null
      if (target?.closest(`[${PLAYBACK_CONTROL_ATTR}]`)) return
      this.stop()
    }
    window.addEventListener('pointerdown', onPointer, true)
    window.addEventListener('keydown', onKey, true)
    this._detach_gestures = () => {
      window.removeEventListener('pointerdown', onPointer, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }

  private detachGestures() {
    this._detach_gestures?.()
    this._detach_gestures = null
  }
}

/** LA lecture de l'application : il n'y en a qu'une à la fois. */
export const playback = new Class_Playback()
