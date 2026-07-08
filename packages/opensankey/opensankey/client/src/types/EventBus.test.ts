import { Class_EventBus } from './EventBus'

// #248 — Bus pub/sub par topic, testé en isolation.

describe('#248 Class_EventBus', () => {
  it('notifie uniquement les abonnés du topic', () => {
    const bus = new Class_EventBus()
    let a = 0, b = 0
    bus.subscribe('t1', () => { a++ })
    bus.subscribe('t2', () => { b++ })
    bus.notify('t1')
    expect(a).toBe(1)
    expect(b).toBe(0)
    bus.notify('t2')
    expect(a).toBe(1)
    expect(b).toBe(1)
  })

  it('désabonnement via la fonction retournée', () => {
    const bus = new Class_EventBus()
    let n = 0
    const off = bus.subscribe('t', () => { n++ })
    bus.notify('t'); expect(n).toBe(1)
    off()
    bus.notify('t'); expect(n).toBe(1)
  })

  it('un même listener n\'est enregistré qu\'une fois par topic (Set)', () => {
    const bus = new Class_EventBus()
    let n = 0
    const l = () => { n++ }
    bus.subscribe('t', l)
    bus.subscribe('t', l)
    bus.notify('t')
    expect(n).toBe(1)
  })

  it('un listener qui se désabonne pendant la notification reçoit quand même l\'événement en cours', () => {
    const bus = new Class_EventBus()
    const calls: string[] = []
    let offB: () => void = () => undefined
    bus.subscribe('t', () => { calls.push('a'); offB() }) // a se traite et désabonne b
    offB = bus.subscribe('t', () => { calls.push('b') })
    bus.notify('t') // snapshot : b reçoit l'événement en cours
    expect(calls).toEqual(['a', 'b'])
    calls.length = 0
    bus.notify('t') // b désormais désabonné
    expect(calls).toEqual(['a'])
  })

  it('notify sur un topic sans abonné = no-op', () => {
    const bus = new Class_EventBus()
    expect(() => bus.notify('inconnu')).not.toThrow()
  })

  it('clear(topic) vide un topic ; clear() vide tout', () => {
    const bus = new Class_EventBus()
    let a = 0, b = 0
    bus.subscribe('t1', () => { a++ })
    bus.subscribe('t2', () => { b++ })
    bus.clear('t1')
    bus.notify('t1'); bus.notify('t2')
    expect(a).toBe(0)
    expect(b).toBe(1)
    bus.clear()
    bus.notify('t2')
    expect(b).toBe(1)
  })
})
