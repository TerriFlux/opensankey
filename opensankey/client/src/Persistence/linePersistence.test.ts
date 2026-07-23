import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// OS#1276b — ligne libre : VRAI segment à DEUX extrémités orientables.
//
// Modèle (cf. NodeBase / NODE_SHAPE_SPECIFIC_CONFIG) : 4 offsets numériques
// shape_line_x1/y1/x2/y2, relatifs au coin (position_x/y) et normalisés
// (min(x1,x2)=0, min(y1,y2)=0) ; la boîte englobante (shape_min_width/height)
// en est DÉRIVÉE (max des offsets). Sérialisation automatique sous `local`
// (préfixe shape_). Rétrocompatibilité : un fichier à l'ancien format
// (boîte + shape_line_flip, sans offsets → segment dégénéré 0,0,0,0) est
// converti au chargement par ensureLineEndpoints() (diagonale de la boîte).

function deepClone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T
}

function newLineContainer(app: Class_ApplicationData) {
  const cont = app.drawing_area.sankey.addNewDefaultContainer()
  cont.shape_type = 'line'
  return cont
}

describe('OS#1276b — ligne libre : segment à 2 extrémités', () => {
  it('ensureLineEndpoints : dérive la diagonale de la boîte selon shape_line_flip', () => {
    const app = new Class_ApplicationData(false)
    const cont = newLineContainer(app)
    cont.shape_line_flip = true
    cont.shape_min_width = 120
    cont.shape_min_height = 80

    cont.ensureLineEndpoints()

    // flip=true → « / » : A=(0,h), B=(w,0)
    expect(cont.shape_line_x1).toBe(0)
    expect(cont.shape_line_y1).toBe(80)
    expect(cont.shape_line_x2).toBe(120)
    expect(cont.shape_line_y2).toBe(0)

    // Idempotent : un second appel ne touche pas un segment déjà défini
    cont.ensureLineEndpoints()
    expect(cont.shape_line_y1).toBe(80)
  })

  it('drag d\'une extrémité : renormalisation (coin au min, offsets ≥ 0, boîte dérivée)', () => {
    const app = new Class_ApplicationData(false)
    const cont = newLineContainer(app)
    cont.setPosXY(0, 0)
    cont.shape_min_width = 100
    cont.shape_min_height = 100
    cont.ensureLineEndpoints() // A=(0,0), B=(100,100)

    // Déplace B au-dessus et à gauche de A : B passe en monde à (-50, -30)
    const dragB = cont['dragEndpointHandler']('b')
    dragB({ dx: -150, dy: -130 } as never)

    // Le coin haut-gauche encaisse le min ; A reste fixe en monde (0,0)
    expect(cont.position_x).toBe(-50)
    expect(cont.position_y).toBe(-30)
    expect(cont.shape_line_x1).toBe(50)
    expect(cont.shape_line_y1).toBe(30)
    expect(cont.shape_line_x2).toBe(0)
    expect(cont.shape_line_y2).toBe(0)
    // Boîte englobante dérivée des offsets (sélection / hit / ordre-Z)
    expect(cont.shape_min_width).toBe(50)
    expect(cont.shape_min_height).toBe(30)
  })

  it('round-trip : offsets écrits sous local au save puis relus au load', () => {
    const app = new Class_ApplicationData(false)
    const cont = newLineContainer(app)
    cont.setPosXY(10, 20)
    cont.shape_min_width = 200
    cont.shape_min_height = 150
    cont.shape_line_flip = true
    cont.ensureLineEndpoints() // A=(0,150), B=(200,0)
    const id = cont.id

    const json = app.toJSON() as Type_JSON
    const local = ((json.labels as Type_JSON)[id] as Type_JSON).local as Type_JSON
    // x1 (=0, défaut) peut être omis ; les offsets non nuls doivent être présents
    expect(local.shape_line_y1).toBe(150)
    expect(local.shape_line_x2).toBe(200)

    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(deepClone(json) as never, {}, false)
    const cont2 = app2.drawing_area.sankey.containers_list.find(c => c.id === id)
    expect(cont2).toBeDefined()
    expect(cont2!.shape_line_x1).toBe(0)
    expect(cont2!.shape_line_y1).toBe(150)
    expect(cont2!.shape_line_x2).toBe(200)
    expect(cont2!.shape_line_y2).toBe(0)
    expect(cont2!.position_x).toBe(10)
    expect(cont2!.position_y).toBe(20)
  })

  it('rétrocompat : ancien format (boîte + shape_line_flip, sans offsets) → diagonale au chargement', () => {
    // Fabrique un fichier « ancien format » : flip + boîte posés, offsets jamais
    // écrits (segment dégénéré) — c'est exactement ce que produisait OS#1276.
    const app = new Class_ApplicationData(false)
    const cont = newLineContainer(app)
    cont.setPosXY(10, 20)
    cont.shape_line_flip = true
    cont.shape_min_width = 120
    cont.shape_min_height = 80
    const id = cont.id

    const json = app.toJSON() as Type_JSON
    const local = ((json.labels as Type_JSON)[id] as Type_JSON).local as Type_JSON
    expect(local.shape_line_x2).toBeUndefined() // sanity : pas d'offsets dans le fichier

    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(deepClone(json) as never, {}, false)
    const cont2 = app2.drawing_area.sankey.containers_list.find(c => c.id === id)
    expect(cont2).toBeDefined()
    // ensureLineEndpoints (appelé par ContainerPersistence.fromJSON) : « / »
    expect(cont2!.shape_line_x1).toBe(0)
    expect(cont2!.shape_line_y1).toBe(80)
    expect(cont2!.shape_line_x2).toBe(120)
    expect(cont2!.shape_line_y2).toBe(0)

    // La sauvegarde suivante porte les offsets (conversion à l'écriture)
    const json2 = app2.toJSON() as Type_JSON
    const local2 = ((json2.labels as Type_JSON)[id] as Type_JSON).local as Type_JSON
    expect(local2.shape_line_y1).toBe(80)
    expect(local2.shape_line_x2).toBe(120)
  })
})
