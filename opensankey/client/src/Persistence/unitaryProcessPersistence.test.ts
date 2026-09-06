import { Class_ApplicationData } from '../types/ApplicationData'
import { unitaryProcessFromJSON, unitaryProcessToJSON } from '../types/UnitaryProcess'
import type { Type_UnitaryProcess } from '../types/UnitaryProcess'
import type { Type_JSON } from '../types/Utils'

// os#1378 (U0) — la section racine `process` fait d'un fichier OpenSankey normal une
// BRIQUE Sankey unitaire. Ces tests verrouillent les deux invariants du chantier :
//
//  1. ALLER-RETOUR — une brique posée dans le fichier se relit à l'identique, ports,
//     coefficients et durée de vie compris. Sans ça la bijection
//     `global <-> (briques + assemblage)` ne tient pas dans une seule sérialisation.
//  2. ADDITIVITE — un fichier qui n'est pas une brique n'en devient pas une, et sa
//     réécriture ne gagne aucune clé. C'est ce qui justifie l'absence d'incrément de
//     `format_version`.
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
// duree de vie, et deux ports dont les coefficients d'entree somment a 1.
const fullProcess = {
  central_node_id: 'Scierie',
  nomenclature_ref: { name: 'woodyn_ports', version: '1.0' },
  activity_reference: { value: 1, unit_ref: 'kt' },
  lifetime_years: 30,
  ports: {
    grume: { direction: 'input', port_type: 'bois_rond', coefficient: 1, unit_ref: 'kt' },
    sciage: { direction: 'output', port_type: 'sciage', coefficient: 0.52 },
    connexes: { direction: 'output', coefficient: 0.48 },
  },
}

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
    expect(parsed).toEqual({ central_node_id: 'Scierie', ports: {} })
    // `ports` est ecrit meme vide : brique sans port declaree, pas une absence.
    expect(unitaryProcessToJSON(parsed as Type_UnitaryProcess)).toEqual({
      central_node_id: 'Scierie', ports: {}
    })
  })

  it('conserve les valeurs nulles legitimes (coefficient 0, duree de vie 0)', () => {
    const parsed = unitaryProcessFromJSON({
      central_node_id: 'Scierie',
      lifetime_years: 0,
      ports: { grume: { direction: 'input', coefficient: 0 } },
    })
    expect(parsed?.lifetime_years).toBe(0)
    expect(parsed?.ports.grume.coefficient).toBe(0)
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
    expect(unitaryProcessFromJSON({ ports: {} })).toBeNull()
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
      ports: {
        sciage: { direction: 'output', coefficient: 0.52 },
        connexes: { coefficient: 0.48 },
      },
    })
    expect(parsed).toBeNull()
    // Direction inconnue, port non-objet, coefficient non numerique : meme verdict.
    expect(unitaryProcessFromJSON({
      central_node_id: 'S', ports: { p: { direction: 'inout' } }
    })).toBeNull()
    expect(unitaryProcessFromJSON({ central_node_id: 'S', ports: { p: 'input' } })).toBeNull()
    expect(unitaryProcessFromJSON({
      central_node_id: 'S', ports: { p: { direction: 'input', coefficient: '0.5' } }
    })).toBeNull()
    expect(unitaryProcessFromJSON({ central_node_id: 'S', ports: [] })).toBeNull()
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
    const { app, dump } = loadAndDump(baseJSON({ process: { ports: {} } }))
    expect(app.drawing_area.sankey.unitary_process).toBeNull()
    expect('process' in dump).toBe(false)
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
    expect(copied?.ports.sciage).not.toBe(original.ports.sciage)
    expect(copied?.nomenclature_ref).not.toBe(original.nomenclature_ref)
    expect(copied?.activity_reference).not.toBe(original.activity_reference)
    // Retyper un port de la copie ne touche pas l original.
    if (copied !== null) copied.ports.sciage.port_type = 'autre'
    expect(original.ports.sciage.port_type).toBe('sciage')
  })

  it('copier depuis un diagramme ordinaire efface la brique de la cible', () => {
    const { app: source } = loadAndDump(baseJSON())
    const { app: target } = loadAndDump(baseJSON({ process: fullProcess }))
    target.drawing_area.sankey.copyFrom(source.drawing_area.sankey)
    expect(target.drawing_area.sankey.unitary_process).toBeNull()
  })
})
