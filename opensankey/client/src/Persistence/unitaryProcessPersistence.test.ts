import { Class_ApplicationData } from '../types/ApplicationData'
import { unitaryProcessFromJSON, unitaryProcessToJSON } from '../types/UnitaryProcess'
import type { Type_UnitaryProcess } from '../types/UnitaryProcess'
import type { Type_JSON } from '../types/Utils'

// os#1378 (U0) puis os#1380 (U4) — la section racine `process` fait d'un fichier
// OpenSankey normal une BRIQUE Sankey unitaire. Ces tests verrouillent les trois
// invariants du chantier :
//
//  1. ALLER-RETOUR — une brique posée dans le fichier se relit à l'identique, ports,
//     coefficients et durée de vie compris. Sans ça la bijection
//     `global <-> (briques + assemblage)` ne tient pas dans une seule sérialisation.
//  2. ADDITIVITE — un fichier qui n'est pas une brique n'en devient pas une, et sa
//     réécriture ne gagne aucune clé. C'est ce qui justifie l'absence d'incrément de
//     `format_version`.
//  3. MULTI-FLUX — `ports` est une LISTE a cle composite
//     `(node_id, direction, quantity_ref)` : un meme noeud porte plusieurs grandeurs
//     et peut etre a la fois entree et sortie. L'ancienne forme dictionnaire de U0
//     reste LUE (et se reecrit en liste).
//
// Une section illisible est rejetée EN ENTIER : une brique partiellement lue aurait des
// coefficients d'entree qui ne sommeraient plus a 1, sans que rien ne le signale.

const baseJSON = (extra: Record<string, unknown> = {}): Type_JSON => ({
  version: '1.1.4',
  format_version: 3,
  nodes: {},
  links: {},
  width: 1000,
  height: 800,
  user_scale: 100,
  ...extra
} as unknown as Type_JSON)

const loadAndDump = (json: Type_JSON): { app: Class_ApplicationData, dump: Type_JSON } => {
  const app = new Class_ApplicationData(false)
  app.fromJSON(JSON.parse(JSON.stringify(json)) as never, {}, false)
  return { app, dump: app.toJSON() as Type_JSON }
}

// Une brique complete : procede central, nomenclature versionnee, niveau d'activite,
// duree de vie, et trois ports dont les coefficients d'entree somment a 1.
const fullProcess = {
  central_node_id: 'Scierie',
  nomenclature_ref: { name: 'woodyn_ports', version: '1.0' },
  activity_reference: { value: 1, unit_ref: 'kt' },
  lifetime_years: 30,
  ports: [
    { node_id: 'grume', direction: 'input', port_type: 'bois_rond', coefficient: 1, unit_ref: 'kt' },
    { node_id: 'sciage', direction: 'output', port_type: 'sciage', coefficient: 0.52 },
    { node_id: 'connexes', direction: 'output', coefficient: 0.48 },
  ],
}

/** Le port d'une brique, retrouve par son noeud (les tests raisonnent par noeud). */
const portOf = (
  unitary_process: Type_UnitaryProcess | null,
  node_id: string
) => unitary_process?.ports.find(port => port.node_id === node_id)

describe('os#1378 — module UnitaryProcess (lecture et ecriture)', () => {
  it('relit une brique complete sans rien perdre', () => {
    const parsed = unitaryProcessFromJSON(fullProcess)
    expect(parsed).not.toBeNull()
    expect(parsed).toEqual(fullProcess)
    // La serialisation est symetrique de la lecture.
    expect(unitaryProcessToJSON(parsed as Type_UnitaryProcess)).toEqual(fullProcess)
  })

  it('accepte le minimum : le seul noeud central, ports vides par defaut', () => {
    const parsed = unitaryProcessFromJSON({ central_node_id: 'Scierie' })
    expect(parsed).toEqual({ central_node_id: 'Scierie', ports: [] })
    // `ports` est ecrit meme vide : brique sans port declaree, pas une absence.
    expect(unitaryProcessToJSON(parsed as Type_UnitaryProcess)).toEqual({
      central_node_id: 'Scierie', ports: []
    })
  })

  it('conserve les valeurs nulles legitimes (coefficient 0, duree de vie 0)', () => {
    const parsed = unitaryProcessFromJSON({
      central_node_id: 'Scierie',
      lifetime_years: 0,
      ports: [{ node_id: 'grume', direction: 'input', coefficient: 0 }],
    })
    expect(parsed?.lifetime_years).toBe(0)
    expect(portOf(parsed, 'grume')?.coefficient).toBe(0)
    // La clé subsiste a la reecriture : 0 n'est pas « pas de valeur ».
    const dumped = unitaryProcessToJSON(parsed as Type_UnitaryProcess)
    expect('lifetime_years' in dumped).toBe(true)
    expect(dumped.lifetime_years).toBe(0)
  })

  it('rejette tout ce qui n est pas une section exploitable, sans lever', () => {
    // Absente ou pas un objet.
    expect(unitaryProcessFromJSON(undefined)).toBeNull()
    expect(unitaryProcessFromJSON(null)).toBeNull()
    expect(unitaryProcessFromJSON('Scierie')).toBeNull()
    expect(unitaryProcessFromJSON([{ central_node_id: 'Scierie' }])).toBeNull()
    // Noeud central manquant, vide, ou du mauvais type : le membre requis.
    expect(unitaryProcessFromJSON({ ports: [] })).toBeNull()
    expect(unitaryProcessFromJSON({ central_node_id: '' })).toBeNull()
    expect(unitaryProcessFromJSON({ central_node_id: 42 })).toBeNull()
    // Nomenclature sans nom, niveau d activite sans valeur, duree non finie.
    expect(unitaryProcessFromJSON({ central_node_id: 'S', nomenclature_ref: {} })).toBeNull()
    expect(unitaryProcessFromJSON({ central_node_id: 'S', activity_reference: { unit_ref: 'kt' } })).toBeNull()
    expect(unitaryProcessFromJSON({ central_node_id: 'S', lifetime_years: 'trente' })).toBeNull()
  })

  it('un seul port mal forme fait tomber la brique entiere', () => {
    // Le port `sciage` est valide, `connexes` n a pas de direction : accepter le
    // premier seul donnerait une brique plausible et fausse.
    const parsed = unitaryProcessFromJSON({
      central_node_id: 'Scierie',
      ports: [
        { node_id: 'sciage', direction: 'output', coefficient: 0.52 },
        { node_id: 'connexes', coefficient: 0.48 },
      ],
    })
    expect(parsed).toBeNull()
    // Noeud absent ou vide : dans la liste, `node_id` est un membre requis.
    expect(unitaryProcessFromJSON({
      central_node_id: 'S', ports: [{ direction: 'input' }]
    })).toBeNull()
    expect(unitaryProcessFromJSON({
      central_node_id: 'S', ports: [{ node_id: '', direction: 'input' }]
    })).toBeNull()
    // Direction inconnue, port non-objet, coefficient non numerique : meme verdict.
    expect(unitaryProcessFromJSON({
      central_node_id: 'S', ports: [{ node_id: 'p', direction: 'inout' }]
    })).toBeNull()
    expect(unitaryProcessFromJSON({ central_node_id: 'S', ports: ['input'] })).toBeNull()
    expect(unitaryProcessFromJSON({
      central_node_id: 'S', ports: [{ node_id: 'p', direction: 'input', coefficient: '0.5' }]
    })).toBeNull()
    expect(unitaryProcessFromJSON({ central_node_id: 'S', ports: 3 })).toBeNull()
  })
})

describe('os#1380 — multi-flux : les ports en liste a cle composite', () => {
  it('porte plusieurs grandeurs sur un meme noeud, et les relit', () => {
    // La matiere (grandeur du diagramme, sans `quantity_ref`) et, sur le meme
    // noeud d entree, l energie qu il a fallu : c est cela, un ICV.
    const multi = {
      central_node_id: 'Scierie',
      ports: [
        { node_id: 'grume', direction: 'input', coefficient: 1, unit_ref: 'kt' },
        {
          node_id: 'grume', direction: 'input', quantity_ref: 'unit_type_energie',
          coefficient: 340, unit_ref: 'kWh'
        },
        {
          node_id: 'co2', direction: 'output', quantity_ref: 'unit_type_masse',
          coefficient: 12, exchange_kind: 'biosphere'
        },
      ],
    }
    const parsed = unitaryProcessFromJSON(multi)
    expect(parsed?.ports).toHaveLength(3)
    expect(parsed).toEqual(multi)
    // Aller-retour : `quantity_ref` et `exchange_kind` survivent a la reecriture.
    expect(unitaryProcessToJSON(parsed as Type_UnitaryProcess)).toEqual(multi)
  })

  it('accepte un meme noeud en entree ET en sortie', () => {
    // La limite « un port par noeud » de la forme U0 est levee : un retour de
    // connexes rentre et ressort du meme procede.
    const parsed = unitaryProcessFromJSON({
      central_node_id: 'Scierie',
      ports: [
        { node_id: 'connexes', direction: 'input', coefficient: 0.1 },
        { node_id: 'connexes', direction: 'output', coefficient: 0.48 },
      ],
    })
    expect(parsed?.ports).toHaveLength(2)
    expect(parsed?.ports.map(port => port.direction)).toEqual(['input', 'output'])
  })

  it('rejette deux ports de meme identite', () => {
    // Meme noeud, meme sens, meme grandeur (ici absente des deux cotes) : deux
    // coefficients pour le meme echange, sans que rien ne dise lequel fait foi.
    expect(unitaryProcessFromJSON({
      central_node_id: 'Scierie',
      ports: [
        { node_id: 'grume', direction: 'input', coefficient: 1 },
        { node_id: 'grume', direction: 'input', coefficient: 0.9 },
      ],
    })).toBeNull()
    // Et la grandeur fait bien partie de la cle : la meme paire, distinguee par
    // `quantity_ref`, passe.
    expect(unitaryProcessFromJSON({
      central_node_id: 'Scierie',
      ports: [
        { node_id: 'grume', direction: 'input', coefficient: 1 },
        { node_id: 'grume', direction: 'input', quantity_ref: 'unit_type_energie', coefficient: 340 },
      ],
    })?.ports).toHaveLength(2)
  })

  it('rejette une nature d echange inconnue', () => {
    // Enumeration fermee : une valeur inconnue serait rangee au hasard dans
    // l une des deux matrices de l ACV.
    expect(unitaryProcessFromJSON({
      central_node_id: 'S', ports: [{ node_id: 'p', direction: 'input', exchange_kind: 'atmosphere' }]
    })).toBeNull()
    expect(unitaryProcessFromJSON({
      central_node_id: 'S', ports: [{ node_id: 'p', direction: 'input', quantity_ref: 42 }]
    })).toBeNull()
  })

  it('lit encore l ancienne forme dictionnaire de U0, et la reecrit en liste', () => {
    const legacy = {
      central_node_id: 'Scierie',
      lifetime_years: 30,
      ports: {
        grume: { direction: 'input', port_type: 'bois_rond', coefficient: 1, unit_ref: 'kt' },
        sciage: { direction: 'output', port_type: 'sciage', coefficient: 0.52 },
      },
    }
    const parsed = unitaryProcessFromJSON(legacy)
    // La cle du dictionnaire devient `node_id` ; pas de grandeur (ces fichiers
    // n en mesuraient qu une).
    expect(parsed?.ports).toEqual([
      { node_id: 'grume', direction: 'input', port_type: 'bois_rond', coefficient: 1, unit_ref: 'kt' },
      { node_id: 'sciage', direction: 'output', port_type: 'sciage', coefficient: 0.52 },
    ])
    expect(parsed?.ports.every(port => port.quantity_ref === undefined)).toBe(true)
    // La reecriture ne produit QUE la liste : le fichier passe a la forme courante.
    const dumped = unitaryProcessToJSON(parsed as Type_UnitaryProcess)
    expect(Array.isArray(dumped.ports)).toBe(true)
    expect(dumped.ports).toEqual(parsed?.ports)
    // Point fixe : la forme courante se relit a l identique.
    expect(unitaryProcessFromJSON(dumped)).toEqual(parsed)
  })

  it('applique la lecture tout-ou-rien a l ancienne forme aussi', () => {
    expect(unitaryProcessFromJSON({
      central_node_id: 'S', ports: { sciage: { direction: 'output' }, connexes: {} }
    })).toBeNull()
    expect(unitaryProcessFromJSON({ central_node_id: 'S', ports: { p: 'input' } })).toBeNull()
    expect(unitaryProcessFromJSON({ central_node_id: 'S', ports: { '': { direction: 'input' } } })).toBeNull()
  })
})

describe('os#1378 — aller-retour de la section process dans le fichier', () => {
  it('une brique posee dans le fichier se relit et se reecrit identique', () => {
    const { app, dump } = loadAndDump(baseJSON({ process: fullProcess }))
    expect(app.drawing_area.sankey.unitary_process).toEqual(fullProcess)
    expect(dump['process']).toEqual(fullProcess)
    // Second aller-retour : point fixe.
    const { app: app2, dump: dump2 } = loadAndDump(dump)
    expect(app2.drawing_area.sankey.unitary_process).toEqual(fullProcess)
    expect(dump2['process']).toEqual(fullProcess)
  })

  it('un fichier sans la cle reste un diagramme ordinaire, et n en gagne pas', () => {
    const { app, dump } = loadAndDump(baseJSON())
    expect(app.drawing_area.sankey.unitary_process).toBeNull()
    // Invariant d additivite : rien d ajoute a la reecriture d un fichier existant.
    expect('process' in dump).toBe(false)
  })

  it('une cle malformee est ignoree en entier, sans lever, et n est pas reecrite', () => {
    // central_node_id manquant : le fichier reste parfaitement lisible comme diagramme.
    const { app, dump } = loadAndDump(baseJSON({ process: { ports: [] } }))
    expect(app.drawing_area.sankey.unitary_process).toBeNull()
    expect('process' in dump).toBe(false)
  })

  it('un fichier a l ancienne forme s ouvre et se reenregistre en liste', () => {
    const legacy_file = baseJSON({
      process: {
        central_node_id: 'Scierie',
        ports: { grume: { direction: 'input', coefficient: 1 } },
      }
    })
    const { app, dump } = loadAndDump(legacy_file)
    expect(app.drawing_area.sankey.unitary_process?.ports).toEqual([
      { node_id: 'grume', direction: 'input', coefficient: 1 }
    ])
    expect((dump['process'] as Type_JSON).ports).toEqual([
      { node_id: 'grume', direction: 'input', coefficient: 1 }
    ])
  })
})

describe('os#1378 — copie de la section par copyFrom', () => {
  it('copie la brique sans partager la reference', () => {
    const { app: source } = loadAndDump(baseJSON({ process: fullProcess }))
    const { app: target } = loadAndDump(baseJSON())
    target.drawing_area.sankey.copyFrom(source.drawing_area.sankey)
    const copied = target.drawing_area.sankey.unitary_process
    expect(copied).toEqual(fullProcess)
    // Meme contenu, objets distincts a tous les etages.
    const original = source.drawing_area.sankey.unitary_process as Type_UnitaryProcess
    expect(copied).not.toBe(original)
    expect(copied?.ports).not.toBe(original.ports)
    expect(copied?.ports[1]).not.toBe(original.ports[1])
    expect(copied?.nomenclature_ref).not.toBe(original.nomenclature_ref)
    expect(copied?.activity_reference).not.toBe(original.activity_reference)
    // Retyper un port de la copie ne touche pas l original.
    const copied_port = portOf(copied, 'sciage')
    if (copied_port !== undefined) copied_port.port_type = 'autre'
    expect(portOf(original, 'sciage')?.port_type).toBe('sciage')
  })

  it('copier depuis un diagramme ordinaire efface la brique de la cible', () => {
    const { app: source } = loadAndDump(baseJSON())
    const { app: target } = loadAndDump(baseJSON({ process: fullProcess }))
    target.drawing_area.sankey.copyFrom(source.drawing_area.sankey)
    expect(target.drawing_area.sankey.unitary_process).toBeNull()
  })
})
