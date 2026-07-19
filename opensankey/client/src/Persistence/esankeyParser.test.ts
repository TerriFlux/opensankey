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
    <arrows>
      <arrow id="60">
        <sankeyArrowLabel visible="true" showValue="true" showUnit="true" labelFormat="{Quantity} {Unit}" />
      </arrow>
    </arrows>
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
    <edges>
      <keyValuePair>
        <graphArrowRef refId="40" />
        <arrowRef refId="60" />
      </keyValuePair>
    </edges>
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

  test('thème esankey posé sur le diagramme, fond du fichier repris', () => {
    expect(d.theme.id).toBe('esankey')
    expect(d.theme.palette.link_rule).toBe('flow')
    expect(d.theme.globals.couleur_fond_sankey).toBe('#FFFFFF')
  })

  test('patch du thème fusionné dans les styles écrits (loadTheme ne l\'applique pas)', () => {
    // Sans cette fusion, l'amorce interne de LinkStyle rallume les labels de
    // valeur de TOUS les flux (cf. recette stan_smfa).
    expect(d.style_link.default.value_label_is_visible).toBe(false)
    expect(d.style_link.default.shape_color_rule).toBe('flow')
    expect(d.style_node.default.shape_color).toBe('#D9D9D9')
    expect(d.style_node.default.shape_border_visible).toBe(true)
  })

  test('échelle et fond : maximumFlow/width → user_scale, backgroundColor -1 → blanc', () => {
    // 40 unités sur 80 px → 50 unités pour 100 px
    expect(d.user_scale).toBe(50)
    expect(d.couleur_fond_sankey).toBe('#FFFFFF')
    expect(d.version).toBe('0.9')
  })

  test('OS#1286 — registre d\'unités : coefficients conservés, défaut = unité de base', () => {
    expect(d.units).toBeDefined()
    const energy = d.units!.find(ut => ut.name === 'Energy')!
    expect(energy.default_unit).toBe('11') // MJ, isBasicUnit
    expect(energy.units).toEqual([
      { id: '11', name: 'MJ', coefficient: 1 },
      { id: '12', name: 'kWh', coefficient: 3.6 },
    ])
  })

  test('OS#1286 — showUnit → mode unit_model pointant l\'unité D\'ORIGINE du flow', () => {
    // Valeurs converties en base (MJ) mais chaque flux garde sa référence
    // d'unité d'origine : l'affichage reconvertit (÷ coefficient) et restitue
    // la quantité saisie dans e!Sankey avec son symbole.
    const elec = Object.values(d.links).find(l => l.value.data_value === 36)
    expect(elec?.local.label_unit_visible).toBe(true)
    expect(elec?.local.value_label_unit_type).toBe('unit_model')
    expect(elec?.local.label_unit).toBe('12') // kWh (10 kWh saisis)
    const heat = Object.values(d.links).find(l => l.value.data_value === 5)
    expect(heat?.local.label_unit).toBe('11') // MJ
  })
})

// Fixture « décor » : process invisible + process-image, commentaire de
// flèche, unité affichée, zones libres (texte, rectangle, image) et légende.
// Étendue pour A2/A4/A5 (attributs vérifiés sur les démos officielles e!Sankey
// 5 installées localement, cf. rapport de l'agent) : un 2e unitType (Mass,
// ratio maximumFlow/width différent du 1er → échelle locale attendue sur son
// flux), un process en forme arrondie (shapeType=1) et un en ellipse
// (shapeType=2), et deux `labelFormat` avec les mots-clés pourcentage.
const PNG_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg'
const FIXTURE_DECOR = `<?xml version="1.0" encoding="utf-8"?>
<document xmlns="${NS}" generator="e!Sankey">
  <userSettings netUnitMaximumWidth="200" />
  <netModel>
    <unitTypes>
      <unitType id="10" name="Power" used="true" width="100" maximumFlow="100" showUnit="true">
        <units><unit id="11" name="kW" coefficient="1" isBasicUnit="true" /></units>
      </unitType>
      <unitType id="12" name="Mass" used="true" width="50" maximumFlow="200" showUnit="true">
        <units><unit id="13" name="kg" coefficient="1" isBasicUnit="true" /></units>
      </unitType>
    </unitTypes>
    <entryGroup id="20" name="Root">
      <entries>
        <entry id="21" name="Gas"><unitTypeRef refId="10" /><brushColor argb="-16776961" /></entry>
        <entry id="25" name="Metal"><unitTypeRef refId="12" /><brushColor argb="-16711936" /></entry>
      </entries>
      <entryGroups />
    </entryGroup>
    <graphNodes>
      <graphProcess id="30" name="Source" />
      <graphProcess id="31" name="Puits" />
      <graphProcess id="32" name="Rond" />
    </graphNodes>
    <graphArrows>
      <graphArrow id="40" name="">
        <from><graphProcessRef refId="30" /></from>
        <to><graphProcessRef refId="31" /></to>
        <compartments>
          <flow id="41" name="Gas" quantity="60" source="0">
            <entryRef refId="21" /><unitRef refId="11" />
          </flow>
        </compartments>
      </graphArrow>
      <graphArrow id="42" name="">
        <from><graphProcessRef refId="31" /></from>
        <to><graphProcessRef refId="32" /></to>
        <compartments>
          <flow id="43" name="Metal" quantity="20" source="0">
            <entryRef refId="25" /><unitRef refId="13" />
          </flow>
        </compartments>
      </graphArrow>
    </graphArrows>
  </netModel>
  <net backgroundColor="-1">
    <processes>
      <process id="50" locationX="200" locationY="400" visible="false" shapeType="1">
        <label text="Source" />
      </process>
      <process id="51" locationX="500" locationY="400">
        <image filename="Images\\tmp1.tmp" />
        <label text="Puits" />
      </process>
      <process id="52" locationX="800" locationY="400" shapeType="2">
        <label text="Rond" />
      </process>
    </processes>
    <arrows>
      <arrow id="60">
        <sankeyArrowLabel visible="true" showValue="true" showUnit="true" text="60" labelFormat="{EntryName}: {PercentProcessSource} %" />
        <comment text="Mesure 2025&#xD;&#xA;source: compteur" visible="false" />
      </arrow>
      <arrow id="61">
        <sankeyArrowLabel visible="true" showValue="true" showUnit="true" text="20" labelFormat="{PercentProcessDestination}" />
      </arrow>
    </arrows>
    <shapes>
      <shape>
        <text locationX="100" locationY="100" sizeW="300" sizeH="60" text="Titre du&#xD;&#xA;diagramme" textColor="-16777216">
          <font name="Arial" size="18" style="1" />
        </text>
      </shape>
      <shape>
        <rectangle locationX="150" locationY="600" sizeW="400" sizeH="100" drawBorder="false">
          <brushColor argb="-2039584" />
        </rectangle>
      </shape>
      <shape>
        <picture locationX="480" locationY="300" sizeW="40" sizeH="40" transparency="88">
          <image filename="Images\\tmp1.tmp" />
        </picture>
      </shape>
    </shapes>
    <legend locationX="100" locationY="200" />
  </net>
  <logicalGraphicalObjectMapping>
    <nodes>
      <keyValuePair><graphProcessRef refId="30" /><processRef refId="50" /></keyValuePair>
      <keyValuePair><graphProcessRef refId="31" /><processRef refId="51" /></keyValuePair>
      <keyValuePair><graphProcessRef refId="32" /><processRef refId="52" /></keyValuePair>
    </nodes>
    <edges>
      <keyValuePair><graphArrowRef refId="40" /><arrowRef refId="60" /></keyValuePair>
      <keyValuePair><graphArrowRef refId="42" /><arrowRef refId="61" /></keyValuePair>
    </edges>
  </logicalGraphicalObjectMapping>
</document>`

describe('parseEsankeyXml — décor (zones libres, légende, tooltips, images)', () => {
  const d = parseEsankeyXml(FIXTURE_DECOR, { 'Images/tmp1.tmp': PNG_URI })

  test('process invisible → shape_visible false ; process-image → is_image', () => {
    const source = Object.values(d.nodes).find(n => n.name === 'Source')
    const puits = Object.values(d.nodes).find(n => n.name === 'Puits')
    expect(source?.local.shape_visible).toBe(false)
    expect(puits?.is_image).toBe(true)
    expect(puits?.image_src).toBe(PNG_URI)
  })

  test('commentaire de flèche → tooltip du flux (via le mapping edges)', () => {
    const link = Object.values(d.links)[0]
    expect(link.tooltip_text).toBe('Mesure 2025\nsource: compteur')
  })

  test('aucun label de valeur posé sur le flux ; unité préparée si activation manuelle', () => {
    const link = Object.values(d.links)[0]
    expect(link.local.label_visible).toBeUndefined()
    expect(link.local.label_unit_visible).toBe(true)
    // OS#1286 — la référence d'unité (id du registre) est posée, mais le
    // format pourcentage ({PercentProcessSource}) garde la PRIORITÉ sur le
    // type d'affichage : %OS écrase unit_model.
    expect(link.local.label_unit).toBe('11')
    expect(link.local.value_label_unit_type).toBe('%OS')
  })

  test('OS#1286 — unitTypes → registre d\'unités (clé units)', () => {
    expect(d.units).toBeDefined()
    expect(d.units!.map(ut => ut.name)).toEqual(['Power', 'Mass'])
    const power = d.units!.find(ut => ut.name === 'Power')!
    expect(power.id).toBe('10')
    expect(power.default_unit).toBe('11') // unité de base kW
    expect(power.units).toEqual([{ id: '11', name: 'kW', coefficient: 1 }])
  })

  test('zones libres → labels : texte (police), rectangle (fond), image', () => {
    const containers = Object.values(d.labels)
    expect(containers.length).toBe(3)
    const texte = containers.find(c => c.title === 'Titre du\ndiagramme')
    expect(texte?.name_label_font_size).toBe(18)
    expect(texte?.name_label_bold).toBe(true)
    expect(texte?.name_label_color).toBe('#000000')
    const rect = containers.find(c => c.color_visible === true)
    expect(rect?.color).toBe('#E0E0E0') // -2039584
    expect(rect?.transparent_border).toBe(true)
    const image = containers.find(c => c.is_image === true)
    expect(image?.image_src).toBe(PNG_URI)
    expect(image?.label_width).toBe(40)
    // transparency e!Sankey 88 → opacity 12 %
    expect(image?.opacity).toBe(12)
  })

  test('légende visible, position normalisée avec le reste', () => {
    // min X/Y de l'ensemble = (100, 100) (le texte) → décalage -50
    expect(d.legend).toEqual({ mask_legend: false, legend_dx: 50, legend_dy: 150 })
    const texte = Object.values(d.labels).find(c => c.title === 'Titre du\ndiagramme')
    expect(texte?.x).toBe(50)
    expect(texte?.y).toBe(50)
  })

  test('groupe de tags avec use_colors (colormap = couleurs des entries)', () => {
    expect(d.fluxTags[ESANKEY_ENTRIES_TAGG_ID].use_colors).toBe(true)
  })

  // A4 — formes de process alternatives (shapeType 1/2, manuel e!Sankey 5 p.45).
  test('shapeType=1 (rectangle arrondi) → border_radius ; shapeType=2 (ellipse) → shape', () => {
    const source = Object.values(d.nodes).find(n => n.name === 'Source')
    const rond = Object.values(d.nodes).find(n => n.name === 'Rond')
    expect(source?.local.shape_border_radius).toBe(10)
    expect(source?.local.shape).toBeUndefined() // reste 'rect' (défaut), pas de clé posée
    expect(rond?.local.shape).toBe('ellipse')
    expect(rond?.local.shape_border_radius).toBeUndefined()
  })

  // A2 — labels en pourcentage (format personnalisé à mots-clés, manuel p.34).
  test('{PercentProcessSource}/{PercentProcessDestination} → value_label_unit_type, value_option inchangé', () => {
    const gas = Object.values(d.links).find(l => l.value.data_value === 60)
    const metal = Object.values(d.links).find(l => l.value.data_value === 20)
    expect(gas?.local.value_label_unit_type).toBe('%OS')
    expect(metal?.local.value_label_unit_type).toBe('%ID')
    // value_option n'existe pas côté EsFlow (jamais posé) : data_value reste la
    // quantité physique, pas une contrainte MFA en %.
    expect(gas?.local.value_option).toBeUndefined()
  })

  // A5 — échelle indépendante par unitType (Power = référence, Mass a un ratio
  // maximumFlow/width différent → échelle locale sur son flux uniquement).
  test('unitType secondaire à ratio différent → shape_local_link_scale local, flux de référence inchangé', () => {
    const gas = Object.values(d.links).find(l => l.value.data_value === 60) // Power (référence)
    const metal = Object.values(d.links).find(l => l.value.data_value === 20) // Mass
    expect(d.user_scale).toBe(100) // Power : 100 maximumFlow / 100 width * 100
    expect(gas?.local.shape_local_link_scale).toBeUndefined()
    // Mass : 200 maximumFlow / 50 width * 100 = 400 → multiplicateur 400/100 = 4
    expect(metal?.local.shape_local_link_scale).toBe(4)
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

// Suite bonus, locale uniquement : parse toutes les démos e!Sankey si un corpus
// est disponible. Les fichiers .sankey livrés par e!Sankey sont propriétaires
// (et les cliparts sont sous licence tierce) : ils ne sont JAMAIS committés ni
// redistribués. Pointer le corpus via la variable d'environnement
// ESANKEY_CORPUS_DIR ; à défaut, on tente le dossier d'installation par défaut.
// Absent (cas CI) → la suite est skippée.
const DEMOS_DIR = process.env.ESANKEY_CORPUS_DIR
  || 'C:/Program Files/iPoint-systems/e!Sankey 5/demos'
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

  test('Building Energy Footprint : décor complet (zones libres, images, légende, process invisibles)', async () => {
    const f = 'Building Energy Footprint [en].sankey'
    if (!files.includes(f)) return
    const buffer = fs.readFileSync(path.join(DEMOS_DIR, f))
    const d = await loadEsankeyFile(buffer as unknown as ArrayBuffer)
    // 27 shapes dont textes, rectangles, images (les lignes sont ignorées)
    expect(Object.keys(d.labels).length).toBeGreaterThan(8)
    expect(Object.values(d.labels).some(c => c.is_image === true)).toBe(true)
    expect(Object.values(d.labels).some(c => typeof c.title === 'string' && (c.title as string).includes('Building Energy'))).toBe(true)
    // Légende présente et affichée
    expect(d.legend?.mask_legend).toBe(false)
    // Tous les process de cette démo sont invisibles (style « décor »)
    expect(Object.values(d.nodes).every(n => n.local.shape_visible === false)).toBe(true)
    // Aucun flux importé ne porte de label de valeur (décision user : chez
    // e!Sankey l'étiquette appartient à la flèche, pas au flux).
    const labelled = Object.values(d.links).filter(l => l.local.label_visible === true)
    expect(labelled.length).toBe(0)
  }, 30000)
})
