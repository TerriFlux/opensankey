import * as fs from 'fs'
import * as path from 'path'
import JSZip from 'jszip'
import { parseEsankeyXml, loadEsankeyFile, ESANKEY_ENTRIES_TAGG_ID } from './esankeyParser'

// Valide le parseur e!Sankey sur des fixtures minimales fabriquées main (les
// démos livrées avec e!Sankey sont propriétaires : jamais committées). Une
// suite bonus tourne sur les démos locales si e!Sankey 5 est installé.

const NS = 'http://www.ifu.com/eSankey/v5.3.0'

// Fixture minimale : 2 process (A, B), 1 flèche portant 2 flows (2 entries,
// unités kWh (coefficient 3.6 vers MJ) et MJ). Noms logiques vides : les noms
// affichés viennent des labels graphiques via le mapping logique↔graphique.
const FIXTURE = `<?xml version="1.0" encoding="utf-8"?>
<document xmlns="${NS}" generator="e!Sankey" generatorVersion="5.2.0.16">
  <userSettings netUnitMaximumWidth="200" scaleMode="0" />
  <netModel>
    <colorSets />
    <unitTypes>
      <unitType id="10" name="Energy" used="true" width="80" maximumFlow="40">
        <units>
          <unit id="11" name="MJ" coefficient="1" isBasicUnit="true" />
          <unit id="12" name="kWh" coefficient="3.6" isBasicUnit="false" />
        </units>
      </unitType>
    </unitTypes>
    <entryGroup id="20" name="Root">
      <entries>
        <entry id="21" name="Electricity" showEntry="true">
          <unitTypeRef refId="10" />
          <brushColor argb="-256" />
        </entry>
      </entries>
      <entryGroups>
        <entryGroup id="22" name="Heat group">
          <entries>
            <entry id="23" name="Heat">
              <unitTypeRef refId="10" />
              <brushColor argb="-65536" />
            </entry>
          </entries>
          <entryGroups />
        </entryGroup>
      </entryGroups>
    </entryGroup>
    <graphNodes>
      <graphProcess id="30" name="" />
      <graphProcess id="31" name="" />
    </graphNodes>
    <graphArrows>
      <graphArrow id="40" name="">
        <from><graphProcessRef refId="30" /></from>
        <to><graphProcessRef refId="31" /></to>
        <compartments>
          <flow id="41" name="Electricity" quantity="10" source="0">
            <entryRef refId="21" />
            <unitRef refId="12" />
          </flow>
          <flow id="42" name="Heat" quantity="5" source="0">
            <entryRef refId="23" />
            <unitRef refId="11" />
          </flow>
        </compartments>
      </graphArrow>
    </graphArrows>
  </netModel>
  <net backgroundColor="-1">
    <processes>
      <process id="50" locationX="100" locationY="300">
        <brushColor argb="-1073774768" />
        <label text="Source A" />
      </process>
      <process id="51" locationX="400" locationY="320">
        <brushColor argb="-16777216" />
        <label text="Cible B" />
      </process>
    </processes>
    <arrows />
  </net>
  <logicalGraphicalObjectMapping>
    <nodes>
      <keyValuePair>
        <graphProcessRef refId="30" />
        <processRef refId="50" />
      </keyValuePair>
      <keyValuePair>
        <graphProcessRef refId="31" />
        <processRef refId="51" />
      </keyValuePair>
    </nodes>
    <edges />
  </logicalGraphicalObjectMapping>
</document>`

describe('parseEsankeyXml — fixture minimale', () => {
  const d = parseEsankeyXml(FIXTURE)

  test('nœuds : noms depuis les labels graphiques, positions normalisées', () => {
    expect(Object.keys(d.nodes).length).toBe(2)
    const names = Object.values(d.nodes).map(n => n.name).sort()
    expect(names).toEqual(['Cible B', 'Source A'])
    // Normalisation : min (100, 300) ramené à (50, 50)
    const a = Object.values(d.nodes).find(n => n.name === 'Source A')
    const b = Object.values(d.nodes).find(n => n.name === 'Cible B')
    expect(a?.x).toBe(50)
    expect(a?.y).toBe(50)
    expect(b?.x).toBe(350)
    expect(b?.y).toBe(70)
  })

  test('couleurs de nœuds : argb signé → hex RGB', () => {
    const a = Object.values(d.nodes).find(n => n.name === 'Source A')
    const b = Object.values(d.nodes).find(n => n.name === 'Cible B')
    expect(a?.local.color).toBe('#FF7F50') // Coral, alpha ignoré
    expect(b?.local.color).toBe('#000000') // -16777216 = noir opaque
  })

  test('flèche multi-matériaux → un flux par flow, valeurs en unité de base', () => {
    expect(Object.keys(d.links).length).toBe(2)
    const values = Object.values(d.links).map(l => l.value.data_value).sort((x, y) => x - y)
    // 10 kWh × 3.6 = 36 MJ ; 5 MJ × 1 = 5 MJ
    expect(values).toEqual([5, 36])
    // Source/cible identiques pour les deux flux
    Object.values(d.links).forEach(l => {
      expect(d.nodes[l.idSource].name).toBe('Source A')
      expect(d.nodes[l.idTarget].name).toBe('Cible B')
    })
  })

  test('entries → tags de flux (groupe unique), couleur reprise sur le flux', () => {
    const group = d.fluxTags[ESANKEY_ENTRIES_TAGG_ID]
    expect(group).toBeDefined()
    expect(Object.values(group.tags).map(t => t.name).sort()).toEqual(['Electricity', 'Heat'])
    const elec = Object.values(d.links).find(l => l.value.data_value === 36)
    expect(elec?.local.color).toBe('#FFFF00') // -256 = jaune
    expect(elec?.value.tags[ESANKEY_ENTRIES_TAGG_ID]).toEqual(['id_Electricity'])
    const heat = Object.values(d.links).find(l => l.value.data_value === 5)
    expect(heat?.local.color).toBe('#FF0000') // -65536 = rouge
    expect(heat?.value.tags[ESANKEY_ENTRIES_TAGG_ID]).toEqual(['id_Heat'])
  })

  test('valeurs agrégées des nœuds cohérentes', () => {
    const a = Object.values(d.nodes).find(n => n.name === 'Source A')
    const b = Object.values(d.nodes).find(n => n.name === 'Cible B')
    expect(a?.output_value).toBe(41)
    expect(b?.input_value).toBe(41)
    expect(a?.links_order.length).toBe(2)
  })

  test('échelle et fond : maximumFlow/width → user_scale, backgroundColor -1 → blanc', () => {
    // 40 unités sur 80 px → 50 unités pour 100 px
    expect(d.user_scale).toBe(50)
    expect(d.couleur_fond_sankey).toBe('#FFFFFF')
    expect(d.version).toBe('0.9')
  })
})

describe('parseEsankeyXml — erreurs', () => {
  test('XML non e!Sankey rejeté', () => {
    expect(() => parseEsankeyXml('<foo><bar/></foo>')).toThrow()
  })
})

describe('loadEsankeyFile — dézippage', () => {
  test('ZIP avec esankey.xml accepté, ZIP sans rejeté', async () => {
    const zip = new JSZip()
    zip.file('esankey.xml', FIXTURE)
    zip.file('esankey.xml.signature', '<Signature/>')
    const buffer = await zip.generateAsync({ type: 'arraybuffer' })
    const d = await loadEsankeyFile(buffer)
    expect(Object.keys(d.nodes).length).toBe(2)

    const empty = new JSZip()
    empty.file('autre.txt', 'x')
    const badBuffer = await empty.generateAsync({ type: 'arraybuffer' })
    await expect(loadEsankeyFile(badBuffer)).rejects.toThrow('esankey.xml')
  })
})

// Suite bonus, locale uniquement : parse toutes les démos de l'installation
// e!Sankey 5 si présente (jamais en CI — fichiers propriétaires non committés).
const DEMOS_DIR = 'C:/Program Files/iPoint-systems/e!Sankey 5/demos'
const describeDemos = fs.existsSync(DEMOS_DIR) ? describe : describe.skip

describeDemos('loadEsankeyFile — démos e!Sankey 5 locales', () => {
  const files = fs.existsSync(DEMOS_DIR)
    ? fs.readdirSync(DEMOS_DIR).filter(f => f.endsWith('.sankey'))
    : []

  test(`toutes les démos (${files.length}) parsent sans erreur`, async () => {
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      // Buffer Node passé tel quel (JSZip l'accepte) : un ArrayBuffer slicé
      // vient d'un autre realm que celui de jsdom et JSZip le rejette.
      const buffer = fs.readFileSync(path.join(DEMOS_DIR, f))
      const d = await loadEsankeyFile(buffer as unknown as ArrayBuffer)
      expect(Object.keys(d.nodes).length).toBeGreaterThan(0)
      expect(Object.keys(d.links).length).toBeGreaterThan(0)
      const bad = Object.values(d.links).filter(l => !Number.isFinite(l.value.data_value))
      expect(bad).toEqual([])
    }
  }, 60000)
})
