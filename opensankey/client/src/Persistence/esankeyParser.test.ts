import * as fs from 'fs'
import * as path from 'path'
import JSZip from 'jszip'
import { parseEsankeyXml, loadEsankeyFile, netFormatDecimalCount, ESANKEY_ENTRIES_TAGG_ID } from './esankeyParser'
import { Class_ApplicationData } from '../types/ApplicationData'

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
      <process id="50" locationX="100" locationY="300" backgroundLocationX="100" backgroundLocationY="300" backgroundSizeW="48" backgroundSizeH="112">
        <brushColor argb="-1073774768" />
        <penColor name="Black" argb="-16777216" hasPattern="true" Pattern="0" width="3" />
        <label text="Source A" />
      </process>
      <process id="51" locationX="400" locationY="320">
        <brushColor argb="-16777216" />
        <penColor name="Black" argb="-16777216" hasPattern="false" width="1" />
        <label text="Cible B" />
        <selectionNode boundaryX="400" boundaryY="320" boundaryW="72" boundaryH="64" />
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

  test('bordure de nœud : width/Pattern de <penColor> → shape_border_*', () => {
    const a = Object.values(d.nodes).find(n => n.name === 'Source A')
    const b = Object.values(d.nodes).find(n => n.name === 'Cible B')
    // Source A : width 3, Pattern 0 (solide), noir
    expect(a?.local.shape_border_visible).toBe(true)
    expect(a?.local.shape_border_thickness).toBe(3)
    expect(a?.local.shape_border_dashed).toBe(false)
    expect(a?.local.shape_border_color).toBe('#000000')
    expect(a?.local.shape_border_color_sustainable).toBe(true)
    // Cible B : width 1 (et pas le défaut 3 pointillés de l'appli)
    expect(b?.local.shape_border_thickness).toBe(1)
  })

  // Le <label><font> du process → gras/taille/couleur du name label du nœud
  // (e!Sankey met souvent ces titres en gras : sans ça, ils étaient rendus maigres).
  test('label de nom : <label><font style/size> + textColor → name_label_bold/font_size/color', () => {
    const withFont = FIXTURE.replace(
      '<label text="Source A" />',
      '<label text="Source A" textColor="-16776961"><font name="Arial" size="12" style="1" /></label>'
    )
    const df = parseEsankeyXml(withFont)
    const a = Object.values(df.nodes).find(n => n.name === 'Source A')
    const b = Object.values(df.nodes).find(n => n.name === 'Cible B')
    // Source A : font style=1 (gras), size 12 pt → 16 px (×4/3), textColor bleu
    expect(a?.local.name_label_bold).toBe(true)
    expect(a?.local.name_label_italic).toBeUndefined()
    expect(a?.local.name_label_font_size).toBe(16)
    expect(a?.local.name_label_color).toBe('#0000FF')
    // Cible B : label sans <font> ni textColor → aucune mise en forme posée
    expect(b?.local.name_label_bold).toBeUndefined()
    expect(b?.local.name_label_font_size).toBeUndefined()
    expect(b?.local.name_label_color).toBeUndefined()
  })

  // OS#1298 — la boîte réelle du process (backgroundSizeW/H, ou boundaryW/H du
  // <selectionNode> en fallback) dimensionne le nœud via node_width/node_height
  // (mappés vers shape_min_width/shape_min_height), sinon le nœud serait un point.
  test('OS#1298 — taille du nœud depuis la boîte (backgroundSize et fallback selectionNode)', () => {
    const a = Object.values(d.nodes).find(n => n.name === 'Source A')
    const b = Object.values(d.nodes).find(n => n.name === 'Cible B')
    // Source A : backgroundSizeW/H sur le <process>
    expect(a?.local.node_width).toBe(48)
    expect(a?.local.node_height).toBe(112)
    // Cible B : pas de backgroundSize → boundaryW/H du <selectionNode>
    expect(b?.local.node_width).toBe(72)
    expect(b?.local.node_height).toBe(64)
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

  // Ordre Z : `@zorder` e!Sankey (plus grand = par-dessus) → order_g_elements
  // (liste OpenSankey 1er plan → fond). C'est lui qui met les fonds de process
  // derrière les flux (démo « Erdgas Krankenhaus »). Variante locale : la
  // FIXTURE partagée reste SANS zorder (ses chaînes exactes servent de points
  // d'ancrage aux .replace() des autres suites).
  test('ordre Z : zorder → order_g_elements (zorder décroissant = 1er plan → fond)', () => {
    const withZ = FIXTURE
      .replace('<process id="50" locationX="100"', '<process id="50" zorder="0" locationX="100"')
      .replace('<process id="51" locationX="400"', '<process id="51" zorder="2" locationX="400"')
      .replace('<arrow id="60">', '<arrow id="60" zorder="1">')
    const dz = parseEsankeyXml(withZ)
    const a = Object.values(dz.nodes).find(n => n.name === 'Source A')
    const b = Object.values(dz.nodes).find(n => n.name === 'Cible B')
    const linkIds = Object.keys(dz.links)
    // process 51 (z=2) au 1er plan, la flèche 60 (z=1, ses 2 flux dans l'ordre
    // de déclaration), le process 50 (z=0) au fond.
    expect(dz.order_g_elements).toEqual([b?.id, ...linkIds, a?.id])
  })

  test('ordre Z : aucun zorder dans le fichier → order_g_elements absent', () => {
    expect(d.order_g_elements).toBeUndefined()
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

  test('transparence e!Sankey (alpha ARGB de l\'entry) → couleur aplatie sur le fond', () => {
    // -1073774768 = Coral (255,127,80) alpha 191 (~0.75). Aplati sur fond blanc
    // → couleur solide équivalente #FF9F7C (chaque entry a sa propre teinte).
    const withAlpha = FIXTURE.replace('argb="-256"', 'argb="-1073774768"')
    const dd = parseEsankeyXml(withAlpha)
    const tags = dd.fluxTags[ESANKEY_ENTRIES_TAGG_ID].tags
    expect(tags['id_Electricity'].color).toBe('#FF9F7C')
    // Le flux porte aussi la couleur aplatie.
    const elec = Object.values(dd.links)
      .find(l => l.value.tags[ESANKEY_ENTRIES_TAGG_ID]?.[0] === 'id_Electricity')
    expect(elec?.local.color).toBe('#FF9F7C')
    // Entry opaque (Heat, alpha 255) : couleur brute inchangée.
    expect(tags['id_Heat'].color).toBe('#FF0000')
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

  // os#1305 — « Scale to lower flow threshold » : plancher d'épaisseur des flux
  // fins. Seuil e!Sankey déjà en PX (établi sur les 4 démos actives du corpus,
  // cf. commentaire du parseur) → recopié TEL QUEL dans la clé racine
  // `minimum_flux` du JSON 0.9 (clamp px de la drawing area), sans conversion
  // par l'échelle (ici user_scale=50 : une conversion trahirait le test).
  test('os#1305 — scaleToLowerFlowTreashold sur le unitType de référence → minimum_flux (px)', () => {
    const withThreshold = FIXTURE.replace(
      '<unitType id="10" name="Energy" used="true" width="80" maximumFlow="40">',
      '<unitType id="10" name="Energy" used="true" width="80" maximumFlow="40" scaleToLowerFlowTreashold="true" lowerFlowTreashold="2">'
    )
    expect(parseEsankeyXml(withThreshold).minimum_flux).toBe(2)
  })

  test('os#1305 — réglage porté par <net> seul (attributs miroirs) → minimum_flux aussi', () => {
    const withNet = FIXTURE.replace(
      '<net backgroundColor="-1">',
      '<net backgroundColor="-1" scaleToLowerFlowTreashold="true" lowerFlowTreashold="1">'
    )
    expect(parseEsankeyXml(withNet).minimum_flux).toBe(1)
  })

  test('os#1305 — réglage absent ou explicitement false → pas de minimum_flux', () => {
    expect(d.minimum_flux).toBeUndefined()
    // false + seuil renseigné (cas de 97 démos du corpus) : rien à émettre
    const inactive = FIXTURE.replace(
      '<net backgroundColor="-1">',
      '<net backgroundColor="-1" scaleToLowerFlowTreashold="false" lowerFlowTreashold="2">'
    )
    expect(parseEsankeyXml(inactive).minimum_flux).toBeUndefined()
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

// os#1304 — format numérique des valeurs : le unitType e!Sankey porte un
// format .NET (`displayFormat`) → nombre de décimales posé par flux
// (value_label_custom_digit + value_label_nb_digit). Approximation assumée :
// format_value tronque les zéros de fin, donc les décimales FORCÉES (« 0.00 »)
// deviennent « jusqu'à N décimales » chez nous ; milliers non reproduits.
describe('os#1304 — unitType@displayFormat → décimales du label de valeur', () => {
  test('table de vérité .NET → décimales (les 8 formats du corpus)', () => {
    expect(netFormatDecimalCount('0')).toBe(0)
    expect(netFormatDecimalCount('0.#')).toBe(1)
    expect(netFormatDecimalCount('0.00')).toBe(2)
    expect(netFormatDecimalCount('0.0')).toBe(1)
    expect(netFormatDecimalCount('#,#.##')).toBe(2)
    expect(netFormatDecimalCount('0.##')).toBe(2)
    expect(netFormatDecimalCount('0,0.00')).toBe(2)
    expect(netFormatDecimalCount('#,0.#')).toBe(1)
    // Format absent → null : on ne pose rien, les défauts OpenSankey décident.
    expect(netFormatDecimalCount('')).toBe(null)
  })

  test('displayFormat « 0.# » → custom_digit + nb_digit 1 sur CHAQUE flux du unitType', () => {
    const withFormat = FIXTURE.replace(
      '<unitType id="10" name="Energy" used="true" width="80" maximumFlow="40">',
      '<unitType id="10" name="Energy" used="true" width="80" maximumFlow="40" displayFormat="0.#">'
    )
    const links = Object.values(parseEsankeyXml(withFormat).links)
    expect(links.length).toBe(2) // les 2 flows référencent le unitType 10
    links.forEach(l => {
      expect(l.local.value_label_custom_digit).toBe(true)
      expect(l.local.value_label_nb_digit).toBe(1)
    })
  })

  test('displayFormat entier « 0 » → nb_digit 0 (valeurs arrondies à l\'unité)', () => {
    const withFormat = FIXTURE.replace(
      '<unitType id="10" name="Energy" used="true" width="80" maximumFlow="40">',
      '<unitType id="10" name="Energy" used="true" width="80" maximumFlow="40" displayFormat="0">'
    )
    const link = Object.values(parseEsankeyXml(withFormat).links)[0]
    expect(link.local.value_label_custom_digit).toBe(true)
    expect(link.local.value_label_nb_digit).toBe(0)
  })

  test('sans displayFormat (FIXTURE brute) : aucune clé de décimales posée', () => {
    Object.values(parseEsankeyXml(FIXTURE).links).forEach(l => {
      expect(l.local.value_label_custom_digit).toBeUndefined()
      expect(l.local.value_label_nb_digit).toBeUndefined()
    })
  })
})

// os#1306 — masquage des zéros (net@hideZeroFlows / @hideZeroFlowProcesses).
// Le défaut OpenSankey masque DÉJÀ dynamiquement les flux nuls (porte
// is_not_zero) et les nœuds dont tous les flux sont nuls : le parseur ne pose
// `show_zero_links` que pour reproduire le défaut e!Sankey INVERSE (zéros
// visibles). Variantes de FIXTURE par .replace — la constante n'est jamais
// modifiée.
describe('os#1306 — masquage des zéros (hideZeroFlows)', () => {
  test('hideZeroFlows absent (défaut e!Sankey = zéros visibles) → show_zero_links posé', () => {
    const d = parseEsankeyXml(FIXTURE)
    expect(d.show_zero_links).toBe(true)
  })

  test('hideZeroFlows="false" explicite (87/101 démos) → show_zero_links posé', () => {
    const xml = FIXTURE.replace(
      '<net backgroundColor="-1">',
      '<net backgroundColor="-1" hideZeroFlows="false" hideZeroFlowProcesses="false">',
    )
    expect(parseEsankeyXml(xml).show_zero_links).toBe(true)
  })

  test('hideZeroFlows="true" → rien à poser, le défaut OpenSankey masque déjà les zéros', () => {
    const xml = FIXTURE.replace(
      '<net backgroundColor="-1">',
      '<net backgroundColor="-1" hideZeroFlows="true" hideZeroFlowProcesses="true">',
    )
    expect(parseEsankeyXml(xml).show_zero_links).toBeUndefined()
  })

  test('flow quantity=0 : flux bien créé (data_value 0) — masquage dynamique, pas structurel', () => {
    // Un fichier hideZeroFlows=true ne perd PAS ses flux nuls à l'import : ils
    // portent data_value 0 et c'est la porte is_not_zero qui les masque au
    // rendu (le flux réapparaît si la valeur est éditée). Aucun is_visible
    // figé (cas réel : « Bus Passengers », flow « Pax Alighting » à 0).
    const xml = FIXTURE
      .replace('<net backgroundColor="-1">', '<net backgroundColor="-1" hideZeroFlows="true">')
      .replace('quantity="5"', 'quantity="0"')
    const d = parseEsankeyXml(xml)
    expect(Object.keys(d.links).length).toBe(2)
    const zero = Object.values(d.links).find(l => l.value.data_value === 0)
    expect(zero).toBeDefined()
    expect(zero?.is_visible).toBe(true)
    expect(d.show_zero_links).toBeUndefined()
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
        <!-- os#1289 — pointe SOURCE seulement (toArrow=false, fromArrow=true) : le
             flux 40 (Source->Puits) doit perdre sa pointe cible par défaut et gagner
             une pointe source, taille reprise sur fromArrowLength (18). -->
        <sankeyLink toArrow="false" fromArrow="true" toArrowWidth="6" toArrowLength="10" fromArrowWidth="8" fromArrowLength="18" />
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
    <legend locationX="100" locationY="200">
      <textFont name="Tahoma" size="12" style="0" unit="3" charset="0" verticalFont="false" />
      <captionFont name="Tahoma" size="9" style="1" unit="3" charset="0" verticalFont="false" />
    </legend>
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

describe('parseEsankeyXml — couleurs par référence', () => {
  // Beaucoup de démos (« Bus Passengers On_Off » p.ex.) ne portent pas la couleur
  // d'une entry en clair mais via <brushColorRef refId> → <brushColor id argb>
  // définie ailleurs. On résout la référence via la palette du document.
  test('brushColorRef d\'une entry résolu via la palette (couleur du tag + du flux)', () => {
    const withRef = FIXTURE
      .replace('<brushColor argb="-256" />', '<brushColorRef refId="900" />')
      .replace('<net backgroundColor="-1">', '<net backgroundColor="-1"><brushColor id="900" name="Teal" argb="-16744320" />')
    const d2 = parseEsankeyXml(withRef)
    expect(d2.fluxTags[ESANKEY_ENTRIES_TAGG_ID].tags['id_Electricity'].color).toBe('#008080')
    const link = Object.values(d2.links).find(l => l.value.tags[ESANKEY_ENTRIES_TAGG_ID]?.[0] === 'id_Electricity')
    expect(link?.local.color).toBe('#008080')
  })
})

describe('parseEsankeyXml — palettes (OS#1294, jeux de couleurs)', () => {
  // Les jeux de couleurs e!Sankey (<colorSets>/<colorSet>/<colors>/<brushColor
  // id argb>) sont des <brushColor> à id comme les autres : la palette partagée
  // les indexe, donc un <brushColorRef> d'entry pointant une couleur de PALETTE
  // (et non une couleur définie « à plat ») est résolu sans traitement dédié.
  test('brushColorRef d\'une entry pointant une couleur de colorSet est résolu', () => {
    const withColorSet = FIXTURE
      .replace('<colorSets />',
        '<colorSets><colorSet id="800" name="Mass"><colors>' +
        '<brushColor id="901" name="Teal" argb="-16744320" hasBaseColor="false" />' +
        '</colors></colorSet></colorSets>')
      .replace('<brushColor argb="-256" />', '<brushColorRef refId="901" />')
    const d = parseEsankeyXml(withColorSet)
    expect(d.fluxTags[ESANKEY_ENTRIES_TAGG_ID].tags['id_Electricity'].color).toBe('#008080')
    const link = Object.values(d.links).find(l => l.value.tags[ESANKEY_ENTRIES_TAGG_ID]?.[0] === 'id_Electricity')
    expect(link?.local.color).toBe('#008080')
  })
})

describe('parseEsankeyXml — dégradé le long du flux (OS#1294)', () => {
  // gradientFromSource + gradientToDestination sur la flèche graphique → règle de
  // couleur 'gradient' d'OpenSankey (source→cible), posée via la clé legacy
  // `color_rule` du bloc local (→ shape_color_rule au chargement).
  test('gradientFromSource + gradientToDestination → color_rule gradient', () => {
    const withGradient = FIXTURE.replace(
      '<arrow id="60">',
      '<arrow id="60" gradientFromSource="true" gradientToDestination="true">')
    const d = parseEsankeyXml(withGradient)
    Object.values(d.links).forEach(l => {
      expect(l.local.color_rule).toBe('gradient')
    })
  })
  test('un seul bout de dégradé (ou aucun) → pas de color_rule posé', () => {
    const oneSide = FIXTURE.replace(
      '<arrow id="60">',
      '<arrow id="60" gradientFromSource="true">')
    const d1 = parseEsankeyXml(oneSide)
    expect(Object.values(d1.links)[0].local.color_rule).toBeUndefined()
    // Défaut (aucun attribut de dégradé) : rien posé.
    const d0 = parseEsankeyXml(FIXTURE)
    expect(Object.values(d0.links)[0].local.color_rule).toBeUndefined()
  })
})

describe('parseEsankeyXml — orientation des flux (arrowDirection)', () => {
  // arrowDirection e!Sankey : 2 = raccord horizontal (côté), 1/4 = vertical
  // (haut/bas). L'orientation d'un flux = [axe source][axe cible].
  test('nœud source vertical (1) → cible horizontale (2) = vh', () => {
    const withDir = FIXTURE
      .replace('<process id="50" locationX="100" locationY="300"', '<process id="50" locationX="100" locationY="300" arrowDirection="1"')
      .replace('<process id="51" locationX="400" locationY="320">', '<process id="51" locationX="400" locationY="320" arrowDirection="2">')
    const dv = parseEsankeyXml(withDir)
    expect(Object.values(dv.links)[0].local.orientation).toBe('vh')
  })
  test('deux nœuds horizontaux (défaut 2) → hh non posé', () => {
    const dv = parseEsankeyXml(FIXTURE)
    expect(Object.values(dv.links)[0].local.orientation).toBeUndefined()
  })
})

describe('parseEsankeyXml — jonction masquée à Distance négative (shape_link_inset)', () => {
  // e!Sankey n'emploie de « Distance » (port nodePadding) négative que sur des
  // process MASQUÉS : des jonctions fines et hautes qui rassemblent les flux
  // (vérifié sur les 120 démos ; CHP Hospital : boîte 16×160, padding -8). Le
  // nœud doit alors GARDER sa boîte (invisible) + recevoir l'inset — sinon il
  // collapserait en point, écrasant l'étalement vertical des flux. Les `<port>`
  // sont des enfants DIRECTS du `<process>` (pas de wrapper `<ports>`).
  const FIXTURE_HIDDEN_JUNCTION = `<?xml version="1.0" encoding="utf-8"?>
<document xmlns="${NS}" generator="e!Sankey" generatorVersion="5.2.0.16">
  <netModel>
    <unitTypes><unitType id="10" name="E" used="true" width="80" maximumFlow="40">
      <units><unit id="11" name="MJ" coefficient="1" isBasicUnit="true" /></units>
    </unitType></unitTypes>
    <entryGroup id="20" name="Root"><entries>
      <entry id="21" name="Flux"><unitTypeRef refId="10" /><brushColor argb="-256" /></entry>
    </entries></entryGroup>
    <graphNodes>
      <graphProcess id="30" name="Src" />
      <graphProcess id="31" name="Junction" />
    </graphNodes>
    <graphArrows>
      <graphArrow id="40" name="">
        <from><graphProcessRef refId="30" /></from>
        <to><graphProcessRef refId="31" /></to>
        <compartments><flow id="41" name="Flux" quantity="10"><entryRef refId="21" /><unitRef refId="11" /></flow></compartments>
      </graphArrow>
    </graphArrows>
  </netModel>
  <net backgroundColor="-1">
    <processes>
      <process id="50" locationX="100" locationY="300" backgroundSizeW="48" backgroundSizeH="48"><label text="Src" /></process>
      <process id="51" locationX="400" locationY="300" backgroundSizeW="16" backgroundSizeH="160" visible="false"><label text="Junction" />
        <port id="52" nodePadding="-8" />
      </process>
    </processes>
  </net>
  <logicalGraphicalObjectMapping>
    <nodes>
      <keyValuePair><graphProcessRef refId="30" /><processRef refId="50" /></keyValuePair>
      <keyValuePair><graphProcessRef refId="31" /><processRef refId="51" /></keyValuePair>
    </nodes>
  </logicalGraphicalObjectMapping>
</document>`

  const d = parseEsankeyXml(FIXTURE_HIDDEN_JUNCTION)

  test('jonction masquée + padding négatif → boîte CONSERVÉE (pas collapsée) + inset', () => {
    const j = Object.values(d.nodes).find(n => n.name === 'Junction')
    // Masquée (forme + bordure éteintes) mais boîte 16×160 posée → étalement vertical.
    expect(j?.local.shape_visible).toBe(false)
    expect(j?.local.shape_border_visible).toBe(false)
    expect(j?.local.node_width).toBe(16)
    expect(j?.local.node_height).toBe(160)
    // padding -8 → inset 8 (= demi-largeur : les flux se rejoignent au centre en x).
    expect(j?.local.shape_link_inset).toBe(8)
  })

  test('process visible sans port → aucun inset (défaut)', () => {
    const src = Object.values(d.nodes).find(n => n.name === 'Src')
    expect(src?.local.shape_link_inset).toBeUndefined()
  })
})

describe('parseEsankeyXml — coude droit (OS#1288)', () => {
  // Le `<sankeyLink>` du `<arrow>` porte la géométrie du tracé e!Sankey :
  // segment droit (px) à chaque bout puis virage court. On la mappe vers les
  // attributs de tangente/ancre OpenSankey pour raidir le coude des flux vh/hv.
  // Nœuds A(100,300) et B(400,320) → portée ≈ hypot(300,20) ≈ 300.67.
  const withElbow = (extra: string): string => FIXTURE
    .replace('<process id="50" locationX="100" locationY="300"', '<process id="50" locationX="100" locationY="300" arrowDirection="1"')
    .replace('<process id="51" locationX="400" locationY="320">', '<process id="51" locationX="400" locationY="320" arrowDirection="2">')
    .replace('<arrow id="60">', `<arrow id="60">${extra}`)

  test('flux vh : segment droit (horiz_shift), tangente de départ = 1, virage court côté cible', () => {
    const d = parseEsankeyXml(withElbow(
      '<sankeyLink sankeyStartSegmentLength="18" sankeyEndSegmentLength="18" curviness="10" orthogonal="false" adjustingStyle="Manual" />'))
    const link = Object.values(d.links)[0]
    expect(link.local.orientation).toBe('vh')
    // Segments droits 18 px / portée ≈ 300.67 ≈ 0.0599 (ratio de longueur).
    expect(link.local.left_horiz_shift as number).toBeCloseTo(0.0599, 3)
    expect(link.local.right_horiz_shift as number).toBeCloseTo(0.0599, 3)
    // COUDE (vh) : la tangente de départ doit atteindre le coin → forcée à 1,
    // sinon la courbe file en diagonale molle. Côté cible : virage court
    // (≈ 10/300.67 ≈ 0.0333).
    expect(link.local.starting_tangeant as number).toBe(1)
    expect(link.local.ending_tangeant as number).toBeCloseTo(0.0333, 3)
  })

  test('orthogonal=true : tangente de départ = 1, tangente cible serrée (≤ 0.06)', () => {
    const d = parseEsankeyXml(withElbow(
      '<sankeyLink sankeyStartSegmentLength="18" sankeyEndSegmentLength="18" curviness="40" orthogonal="true" />'))
    const link = Object.values(d.links)[0]
    // Coude vh : départ forcé à 1 pour un angle net.
    expect(link.local.starting_tangeant as number).toBe(1)
    // curviness 40/300.67 ≈ 0.133 mais orthogonal plafonne à 0.06 côté cible.
    expect(link.local.ending_tangeant as number).toBeLessThanOrEqual(0.06)
  })

  test('sans <sankeyLink> : aucun attribut de coude posé (rétrocompat)', () => {
    const d = parseEsankeyXml(FIXTURE)
    const link = Object.values(d.links)[0]
    expect(link.local.left_horiz_shift).toBeUndefined()
    expect(link.local.starting_tangeant).toBeUndefined()
  })
})

describe('parseEsankeyXml — points de contrôle (opensankey#1301)', () => {
  // Le <sankeyLink><points> porte la polyligne du tracé, SUR le tracé :
  // [ancre source, …coins…, ancre cible]. n ≥ 5 → tous les points intérieurs
  // (P1..P_{n-2}) deviennent des waypoints, segments d'attache collapsés.
  // Nœuds FIXTURE : A(100,300) source, B(400,320) cible.
  const withPoints = (pointsXml: string): string => FIXTURE
    .replace('<arrow id="60">',
      '<arrow id="60"><sankeyLink sankeyStartSegmentLength="50" sankeyEndSegmentLength="50" curviness="10">'
      + pointsXml + '</sankeyLink>')

  test('5 points → 3 waypoints (escalier), translatés avec le nœud, attaches collapsées', () => {
    // Escalier : A(100,300) → (150,300) → (150,200) → (350,200) → B(400,320).
    const d = parseEsankeyXml(withPoints(
      '<points length="5">'
      + '<value X="100" Y="300" /><value X="150" Y="300" /><value X="150" Y="200" />'
      + '<value X="350" Y="200" /><value X="400" Y="320" /></points>'))
    const link = Object.values(d.links)[0]
    const wps = link.local.shape_waypoints as Array<{ x: number, y: number }>
    expect(Array.isArray(wps)).toBe(true)
    expect(wps.length).toBe(3)
    // Escalier préservé (invariant par translation) : P1→P2 vertical, P2→P3 horizontal.
    expect(wps[0].x).toBeCloseTo(wps[1].x, 6)
    expect(wps[1].y).toBeCloseTo(wps[2].y, 6)
    // Translation COHÉRENTE avec les nœuds : P1(150,300) est à +50 en x du nœud
    // source A(100,300) ; après le même dx/dy, l'écart reste (+50, 0).
    const src = d.nodes[link.idSource]
    expect(wps[0].x - src.x).toBeCloseTo(50, 6)
    expect(wps[0].y - src.y).toBeCloseTo(0, 6)
    // Segments d'attache collapsés (les vrais coins sont les waypoints).
    expect(link.local.left_horiz_shift).toBe(0.01)
    expect(link.local.right_horiz_shift).toBe(0.01)
    // Flux ROUTÉ (opensankey#1301) : l'orientation n'est PAS posée — axe et côté
    // dérivent de la route au runtime (is_routed), pas de shape_orientation.
    expect(link.local.orientation).toBeUndefined()
  })

  test('4 points, segment milieu DIAGONAL (flux simple) → aucun waypoint (paramétrique)', () => {
    // Pas de coude orthogonal (le milieu (150,300)→(350,320) est diagonal).
    const d = parseEsankeyXml(withPoints(
      '<points length="4">'
      + '<value X="100" Y="300" /><value X="150" Y="300" />'
      + '<value X="350" Y="320" /><value X="400" Y="320" /></points>'))
    const link = Object.values(d.links)[0]
    expect(link.local.shape_waypoints).toBeUndefined()
  })

  test('4 points, COUDE ORTHOGONAL (H-V-H) → 2 waypoints (routé même en 4 points)', () => {
    // Boucle e!Sankey type HCl→neutralisation : droite, descendre, gauche.
    const d = parseEsankeyXml(withPoints(
      '<points length="4">'
      + '<value X="100" Y="300" /><value X="150" Y="300" />'
      + '<value X="150" Y="200" /><value X="100" Y="200" /></points>'))
    const link = Object.values(d.links)[0]
    const wps = link.local.shape_waypoints as Array<{ x: number, y: number }>
    expect(Array.isArray(wps)).toBe(true)
    expect(wps.length).toBe(2)
    // Coude : P1→P2 vertical (même x).
    expect(wps[0].x).toBeCloseTo(wps[1].x, 6)
  })

  test('détour QUASI-vertical (dérive ≤ 30 px, corpus Petroleum) → routé, 2 coins rectifiés', () => {
    // Motif « Crude Oil Exports » : part à droite, remonte (segments verticaux
    // dérivant de 8 px — la route arrondie e!Sankey n'a pas de coins parfaits),
    // revient à gauche. L'ancien seuil strict (1 px) classait ces segments en
    // diagonale → 0 coude compté → paramétrique mou au lieu du détour. Les 3 points
    // intérieurs dérivants sont RECTIFIÉS en 2 coins à 90° sur un même montant
    // vertical (sinon le runtime dessine des mini-S à rebours à chaque coin).
    const d = parseEsankeyXml(withPoints(
      '<points length="5">'
      + '<value X="100" Y="300" /><value X="270" Y="300" /><value X="278" Y="166" />'
      + '<value X="270" Y="30" /><value X="174" Y="30" /></points>'))
    const link = Object.values(d.links)[0]
    const wps = link.local.shape_waypoints as Array<{ x: number, y: number }>
    expect(Array.isArray(wps)).toBe(true)
    expect(wps.length).toBe(2)
    // Montant vertical exact : même x pour les deux coins (moyenne du run).
    expect(wps[0].x).toBeCloseTo(wps[1].x, 6)
    expect(link.local.orientation).toBeUndefined()
    // Mapping exact des extrémités : ancres épinglées aux ports P0/PN via les
    // offsets (sinon l'ancre ré-empilée ailleurs fait dépasser le montant puis
    // rebrousser au dernier coin). Accroches horizontales → offset en y.
    expect(link.local.shape_source_anchor_offset as number).toBeCloseTo(0, 6) // P0.y 300 − A.y 300
    expect(link.local.shape_target_anchor_offset as number).toBeCloseTo(-290, 6) // PN.y 30 − B.y 320
  })

  test('S-curve RAIDE (segment milieu dérivant > 30 px) → paramétrique, aucun waypoint', () => {
    // Milieu presque vertical (42 px de dérive sur 180) mais monotone : simple
    // courbe raide, pas un détour. Un seuil angulaire l'aurait happée à tort.
    const d = parseEsankeyXml(withPoints(
      '<points length="4">'
      + '<value X="100" Y="300" /><value X="150" Y="300" />'
      + '<value X="192" Y="120" /><value X="400" Y="120" /></points>'))
    const link = Object.values(d.links)[0]
    expect(link.local.shape_waypoints).toBeUndefined()
  })

  test('REBROUSSEMENT avec segment milieu diagonal → routé même avec un seul coude', () => {
    // Motif « Refined Products Imports → Transportation » : monte, se déporte en
    // diagonale, remonte, repart en ARRIÈRE (x s'inverse). Un seul coude
    // orthogonal compté, mais le rebroussement signe le détour.
    const d = parseEsankeyXml(withPoints(
      '<points length="5">'
      + '<value X="212" Y="400" /><value X="212" Y="288" /><value X="100" Y="240" />'
      + '<value X="100" Y="35" /><value X="188" Y="35" /></points>'))
    const link = Object.values(d.links)[0]
    const wps = link.local.shape_waypoints as Array<{ x: number, y: number }>
    expect(Array.isArray(wps)).toBe(true)
    expect(wps.length).toBe(3)
  })
})

describe('parseEsankeyXml — SA#294 : ancre masquée recalée (accroche verticale)', () => {
  // Une ancre In/Out invisible (process visible="false" avec une boîte) est
  // collapsée en point. Pour un voisin AU-DESSUS/DESSOUS (accroche verticale),
  // on recale le point sur le MILIEU du bord face au voisin (le coin décalait le
  // départ d'une demi-boîte → flux trop haut), et le label est ré-ancré au CENTRE
  // du point (name_label='middle'), stable quand le nœud grossit. Pour un voisin
  // LATÉRAL (flux horizontal), on NE recale PAS (sinon le flux droit descendrait).
  // Boîte de l'ancre (process 50) : x=100 y=300 w=48 h=112 → centre (124,356),
  // bord bas (124,412). Label absolu (110,320) taille 20×22 → centre (120,331).
  const hidden = (proc51: string): string => FIXTURE
    .replace('<process id="50" locationX="100"', '<process id="50" visible="false" locationX="100"')
    .replace('<label text="Source A" />', '<label text="Source A" locationX="110" locationY="320" sizeW="20" sizeH="22" />')
    .replace('<process id="51" locationX="400" locationY="320">', proc51)

  test('voisin en dessous → bord BAS-centre, label ancré au centre au-dessus du départ', () => {
    // Cible sous l'ancre (x≈centre, y=600) → axe vertical dominant → bord bas.
    const d = parseEsankeyXml(hidden('<process id="51" locationX="118" locationY="600">'))
    const inNode = Object.values(d.nodes).find(n => n.name === 'Source A')
    expect(inNode?.local.shape_visible).toBe(false)
    expect(inNode?.local.name_label_vert).toBe('middle')
    expect(inNode?.local.name_label_horiz).toBe('middle')
    // shift = centre du label − point d'accroche (bord bas-centre 124,412).
    expect(inNode?.local.name_label_horiz_shift).toBe(-4)  // 120 − 124
    expect(inNode?.local.name_label_vert_shift).toBe(-81)  // 331 − 412 (label AU-DESSUS)
  })

  test('voisin à droite → PAS de recalage (flux horizontal reste droit)', () => {
    // Cible par défaut (400,320), à droite → axe horizontal dominant → skip.
    const d = parseEsankeyXml(hidden('<process id="51" locationX="400" locationY="320">'))
    const inNode = Object.values(d.nodes).find(n => n.name === 'Source A')
    // Le label garde l'ancrage coin haut-gauche (applyNameLabelPos), non recentré.
    expect(inNode?.local.name_label_vert).toBe('top')
    expect(inNode?.local.name_label_horiz).toBe('left')
    expect(inNode?.local.name_label_horiz_shift).toBe(10)  // 110 − 100 (coin)
    expect(inNode?.local.name_label_vert_shift).toBe(20)   // 320 − 300 (coin)
  })
})


describe('parseEsankeyXml — process quasi-blanc BORDÉ reste visible (Depuration de Chlore)', () => {
  // Régression : e!Sankey dessine des process au fond quasi-blanc mais BORDÉS
  // (démo « Depuration de Chlore » : fond #F0F0F8, trait noir 3px). L'heuristique
  // d'ancre invisible (isNearWhiteFill) les masquait à tort — ils doivent rester
  // de vrais nœuds, visibles et bordés.
  // brushColor -1057951496 = 0xC0F0F0F8 → RGB #F0F0F8 (quasi-blanc, alpha ignoré).
  const NEAR_WHITE = '<brushColor argb="-1057951496" />'

  test('fond quasi-blanc + <penColor width 3> → nœud visible + bordure posée', () => {
    // Source A (id 50) : fond quasi-blanc, garde son penColor noir width 3.
    const xml = FIXTURE.replace('<brushColor argb="-1073774768" />', NEAR_WHITE)
    const d = parseEsankeyXml(xml)
    const a = Object.values(d.nodes).find(n => n.name === 'Source A')
    expect(a?.local.shape_visible).not.toBe(false) // pas masqué en ancre
    expect(a?.local.color).toBe('#F0F0F8')
    expect(a?.local.shape_border_visible).toBe(true)
    expect(a?.local.shape_border_thickness).toBe(3)
    expect(a?.local.shape_border_color).toBe('#000000')
  })

  test('fond quasi-blanc SANS bordure (width 0) → toujours masqué (ancre)', () => {
    const xml = FIXTURE
      .replace('<brushColor argb="-1073774768" />', NEAR_WHITE)
      .replace('<penColor name="Black" argb="-16777216" hasPattern="true" Pattern="0" width="3" />',
        '<penColor name="Black" argb="-16777216" hasPattern="false" width="0" />')
    const d = parseEsankeyXml(xml)
    const a = Object.values(d.nodes).find(n => n.name === 'Source A')
    expect(a?.local.shape_visible).toBe(false)
    expect(a?.local.shape_border_visible).toBe(false)
  })
})


describe('parseEsankeyXml — décor (zones libres, légende, tooltips, images)', () => {
  const d = parseEsankeyXml(FIXTURE_DECOR, { 'Images/tmp1.tmp': PNG_URI })

  test('process invisible → shape_visible false ; process-image → is_image', () => {
    const source = Object.values(d.nodes).find(n => n.name === 'Source')
    const puits = Object.values(d.nodes).find(n => n.name === 'Puits')
    expect(source?.local.shape_visible).toBe(false)
    expect(puits?.is_image).toBe(true)
    expect(puits?.image_src).toBe(PNG_URI)
  })

  // Régression « Energy Balance for a Country » : un process à IMAGE ne doit PAS
  // porter de bordure — l'image remplace la boîte, e!Sankey ne trace pas le
  // penColor sérialisé (case « Couleur ligne » inactive pour un process à image).
  test('process-image avec <penColor> → bordure masquée (l\'image remplace la boîte)', () => {
    // On injecte un penColor épais dans le process image « Puits » (id 51).
    const withPen = FIXTURE_DECOR.replace(
      '<image filename="Images\\tmp1.tmp" />\n        <label text="Puits" />',
      '<image filename="Images\\tmp1.tmp" />\n        <penColor name="Black" argb="-16777216" width="2" />\n        <label text="Puits" />')
    const dp = parseEsankeyXml(withPen, { 'Images/tmp1.tmp': PNG_URI })
    const puits = Object.values(dp.nodes).find(n => n.name === 'Puits')
    expect(puits?.is_image).toBe(true)
    expect(puits?.local.shape_border_visible).toBe(false)
  })

  test('même process SANS image mais avec <penColor> → bordure visible (vraie boîte)', () => {
    // Contraste : sans image, le penColor doit bien produire une bordure.
    const noImg = FIXTURE_DECOR.replace(
      '<image filename="Images\\tmp1.tmp" />\n        <label text="Puits" />',
      '<penColor name="Black" argb="-16777216" width="2" />\n        <label text="Puits" />')
    const dn = parseEsankeyXml(noImg) // pas d'image fournie
    const puits = Object.values(dn.nodes).find(n => n.name === 'Puits')
    expect(puits?.is_image).toBeUndefined()
    expect(puits?.local.shape_border_visible).toBe(true)
    expect(puits?.local.shape_border_thickness).toBe(2)
  })

  test('commentaire de flèche → tooltip du flux (via le mapping edges)', () => {
    const link = Object.values(d.links)[0]
    expect(link.tooltip_text).toBe('Mesure 2025\nsource: compteur')
  })

  // os#1289 — têtes de flux : sankeyLink/@toArrow → pointe cible (shape_is_arrow) ;
  // @fromArrow → « flèche en négatif » = encoche source (shape_source_notch),
  // taille par défaut (le mode ratio d'angle n'est PAS appliqué à l'import).
  test('os#1289 — sankeyLink : pointe cible désactivée, encoche source posée', () => {
    const withArrow = Object.values(d.links).find(l => l.value.data_value === 60) // graphArrow 40, arrow 60
    expect(withArrow?.local.shape_is_arrow).toBe(false)
    expect(withArrow?.local.shape_source_notch).toBe(true)
  })

  test('os#1289 — sankeyLink absent : défauts du style non touchés (pas de shape_is_arrow local)', () => {
    const withoutArrow = Object.values(d.links).find(l => l.value.data_value === 20) // graphArrow 42, arrow 61
    expect(withoutArrow?.local.shape_is_arrow).toBeUndefined()
    expect(withoutArrow?.local.shape_source_notch).toBeUndefined()
  })

  test('label de valeur visible (flèche mono-matériau à label affiché) ; unité posée', () => {
    const link = Object.values(d.links)[0]
    expect(link.local.value_label_is_visible).toBe(true)
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
    const texte = containers.find(c => String(c.name_label_fo_content ?? '').includes('Titre'))
    expect(texte?.name_label_font_size).toBe(24) // 18 pt → 24 px (×4/3)
    expect(texte?.name_label_bold).toBe(true)
    expect(texte?.name_label_color).toBe('#000000')
    // Multi-ligne dans le rich text (foreignObject) ; name/name_label_text portent
    // le texte SANS les \n (une ligne), source 'custom', visible.
    expect(texte?.name_label_source).toBe('custom')
    expect(texte?.name_label_is_visible).toBe(true)
    expect(texte?.name).toBe('Titre du diagramme')
    expect(texte?.name_label_text).toBe('Titre du diagramme')
    // Style baké dans chaque <p> du rich-text (les conteneurs forcent has_fo, le
    // rendu FO ignore les attributs plats) : taille/gras/couleur e!Sankey.
    expect(texte?.name_label_fo_content).toBe(
      '<p style="font-size:24px;font-weight:bold;color:#000000">Titre du</p>' +
      '<p style="font-size:24px;font-weight:bold;color:#000000">diagramme</p>')
    // Boîte agrandie pour englober le rich-text (padding 24 + 2 lignes × 24 px ×
    // 1.42, police convertie pt→px) et largeur +30 (padding horizontal) : 300 → 330.
    expect(texte?.label_height).toBe(93)
    expect(texte?.label_width).toBe(330)
    const rect = containers.find(c => c.color_visible === true)
    expect(rect?.color).toBe('#E0E0E0') // -2039584
    expect(rect?.transparent_border).toBe(true)
    const image = containers.find(c => c.is_image === true)
    expect(image?.image_src).toBe(PNG_URI)
    expect(image?.label_width).toBe(40)
    // transparency e!Sankey 88 → opacity 12 %
    expect(image?.opacity).toBe(12)
  })

  // Fusion : un <text> contenu dans un rectangle est absorbé (le fond porte le
  // texte) — sinon le fond recouvre le texte et intercepte les clics.
  test('fusion texte-dans-rectangle : une seule zone (fond + texte)', () => {
    const merged = FIXTURE_DECOR.replace(
      '<rectangle locationX="150" locationY="600" sizeW="400" sizeH="100" drawBorder="false">',
      '<rectangle locationX="80" locationY="90" sizeW="400" sizeH="120" drawBorder="false">'
    )
    const dm = parseEsankeyXml(merged, { 'Images/tmp1.tmp': PNG_URI })
    const containers = Object.values(dm.labels)
    // 2 zones au lieu de 3 : le texte est absorbé par le rectangle.
    expect(containers.length).toBe(2)
    const box = containers.find(c => c.color_visible === true)
    expect(box?.color).toBe('#E0E0E0') // le fond est conservé
    expect(box?.name_label_source).toBe('custom')
    expect(box?.name_label_fo_content).toBe(
      '<p style="font-size:24px;font-weight:bold;color:#000000">Titre du</p>' +
      '<p style="font-size:24px;font-weight:bold;color:#000000">diagramme</p>')
  })

  // Lignes vides préservées : e!Sankey sépare des blocs par des lignes blanches
  // (ex. démo Buslinie). On les rend en `<p><br></p>` pour garder l'espacement
  // (les filtrer remontait la ligne du bas), et la hauteur de boîte les compte.
  test('ligne vide dans un texte → <p><br></p> préservé, hauteur inclut la ligne vide', () => {
    const withBlank = FIXTURE_DECOR.replace(
      'text="Titre du&#xD;&#xA;diagramme"',
      'text="Haut&#xD;&#xA;&#xD;&#xA;Bas"'
    )
    const db = parseEsankeyXml(withBlank, { 'Images/tmp1.tmp': PNG_URI })
    const texte = Object.values(db.labels).find(c => String(c.name_label_fo_content ?? '').includes('Haut'))
    expect(texte?.name_label_fo_content).toBe(
      '<p style="font-size:24px;font-weight:bold;color:#000000">Haut</p>' +
      '<p><br></p>' +
      '<p style="font-size:24px;font-weight:bold;color:#000000">Bas</p>')
    // 3 lignes (dont la vide) × 24 px × 1.42 + 24 (police convertie pt→px).
    expect(texte?.label_height).toBe(127)
  })

  // Import d'un trait <line> → ligne libre (shape_type 'line', élément OS#1276).
  test('ligne : <line> → shape_type line (sens, couleur, épaisseur)', () => {
    const withLine = FIXTURE_DECOR.replace('</shapes>',
      '<shape><line locationX="10" locationY="20" sizeW="100" sizeH="50">' +
      '<penColor argb="-65536" width="3" />' +
      '<points length="2"><value X="10" Y="70" /><value X="110" Y="20" /></points>' +
      '</line></shape></shapes>')
    const dl = parseEsankeyXml(withLine, { 'Images/tmp1.tmp': PNG_URI })
    const line = Object.values(dl.labels).find(c => c.shape_type === 'line')
    expect(line).toBeDefined()
    expect(line?.shape_border_color).toBe('#FF0000') // argb -65536 = rouge
    expect(line?.shape_border_thickness).toBe(3)
    expect(line?.label_width).toBe(100)
    expect(line?.label_height).toBe(50)
    // 2 extrémités exactes (repère local, min=0) : (10,70)→(110,20) = (0,50)→(100,0)
    expect(line?.shape_line_x1).toBe(0)
    expect(line?.shape_line_y1).toBe(50)
    expect(line?.shape_line_x2).toBe(100)
    expect(line?.shape_line_y2).toBe(0)
  })

  // OS#1290 — traits pointillés : penColor@Pattern (shapes rectangle/line) et
  // sankeyLink/pen@dashStyle ou dashPattern (flux).
  describe('OS#1290 — traits pointillés', () => {
    test('rectangle : penColor Pattern!=0 → shape_border_dashed ; Pattern=0/absent → non posé', () => {
      const withDashedRect = FIXTURE_DECOR.replace(
        '<rectangle locationX="150" locationY="600" sizeW="400" sizeH="100" drawBorder="false">\n          <brushColor argb="-2039584" />\n        </rectangle>',
        '<rectangle locationX="150" locationY="600" sizeW="400" sizeH="100" drawBorder="true">' +
        '<brushColor argb="-2039584" />' +
        '<penColor name="Black (LineWidth: 3, Dash)" argb="-16777216" hasBaseColor="false" hasPattern="true" Pattern="1" width="3" />' +
        '</rectangle>'
      )
      const dd = parseEsankeyXml(withDashedRect, { 'Images/tmp1.tmp': PNG_URI })
      const rect = Object.values(dd.labels).find(c => c.color_visible === true)
      expect(rect?.shape_border_dashed).toBe(true)
      // Fixture de base (rectangle sans <penColor>, ou Pattern="0") : pas posé.
      const base = Object.values(d.labels).find(c => c.color_visible === true)
      expect(base?.shape_border_dashed).toBeUndefined()
    })

    test('ligne : penColor Pattern!=0 → shape_border_dashed sur la ligne', () => {
      const withDashedLine = FIXTURE_DECOR.replace('</shapes>',
        '<shape><line locationX="10" locationY="20" sizeW="100" sizeH="50">' +
        '<penColor argb="-65536" hasPattern="true" Pattern="1" width="3" />' +
        '<points length="2"><value X="10" Y="70" /><value X="110" Y="20" /></points>' +
        '</line></shape></shapes>')
      const dl = parseEsankeyXml(withDashedLine, { 'Images/tmp1.tmp': PNG_URI })
      const line = Object.values(dl.labels).find(c => c.shape_type === 'line')
      expect(line?.shape_border_dashed).toBe(true)
      // La ligne du test précédent (Pattern absent) ne pose rien.
      expect(Object.values(d.labels).find(c => c.shape_type === 'line')).toBeUndefined()
    })

    test('flux : sankeyLink/pen dashStyle!=0 → shape_border_dashed sur le flux', () => {
      // Arrow 60 porte déjà un <sankeyLink> (têtes de flèche, os#1289) : on lui
      // ajoute un <pen dashStyle="1"> pour valider la détection du pointillé.
      const withDashedArrow = FIXTURE_DECOR.replace(
        '<sankeyLink toArrow="false" fromArrow="true" toArrowWidth="6" toArrowLength="10" fromArrowWidth="8" fromArrowLength="18" />',
        '<sankeyLink toArrow="false" fromArrow="true" toArrowWidth="6" toArrowLength="10" fromArrowWidth="8" fromArrowLength="18"><pen dashStyle="1" width="1"><dashPattern length="0" /></pen></sankeyLink>'
      )
      const dArrow = parseEsankeyXml(withDashedArrow, { 'Images/tmp1.tmp': PNG_URI })
      const gasLink = Object.values(dArrow.links).find(l => l.value.data_value === 60)
      expect(gasLink?.local.shape_border_dashed).toBe(true)
      // Fixture de base (pas de <sankeyLink>) : rien posé.
      const baseLink = Object.values(d.links).find(l => l.value.data_value === 60)
      expect(baseLink?.local.shape_border_dashed).toBeUndefined()
    })

    test('flux : dashStyle=0 mais dashPattern non vide (Custom) → aussi détecté pointillé', () => {
      const withCustomDash = FIXTURE_DECOR.replace(
        '<arrow id="61">\n        <sankeyArrowLabel visible="true" showValue="true" showUnit="true" text="20" labelFormat="{PercentProcessDestination}" />\n      </arrow>',
        '<arrow id="61">' +
        '<sankeyArrowLabel visible="true" showValue="true" showUnit="true" text="20" labelFormat="{PercentProcessDestination}" />' +
        '<sankeyLink><pen dashStyle="0" width="1"><dashPattern length="2"><value V="4" /><value V="2" /></dashPattern></pen></sankeyLink>' +
        '</arrow>'
      )
      const dCustom = parseEsankeyXml(withCustomDash, { 'Images/tmp1.tmp': PNG_URI })
      const metalLink = Object.values(dCustom.links).find(l => l.value.data_value === 20)
      expect(metalLink?.local.shape_border_dashed).toBe(true)
    })
  })

  test('légende visible, position normalisée avec le reste', () => {
    // La zone de texte est agrandie pour englober le rich-text (padding/interligne
    // .ql-editor) et RECENTRÉE : son coin haut-gauche passe de (100,100) à (85,92)
    // — c'est le nouveau min de l'ensemble → décalage (-35,-42). Le texte, restant
    // le min, retombe à (50,50) ; la légende suit (legend_dx 100-35, legend_dy 200-42).
    // legend_police = 12 : lu BRUT sur <legend><textFont size="12"> — PAS de
    // conversion pt→px sur la légende (agrandir décalerait sa disposition). Le
    // <captionFont> voisin (taille du titre "Legend" du cadre) n'a pas
    // d'équivalent OpenSankey (cf. commentaire EsParsedDiagram.legend) : non repris.
    // legend_dy dépend de la boîte de la zone de texte (dont la police EST
    // convertie ×4/3) : plus haute → recentrage décalé (158 → 166).
    expect(d.legend).toEqual({ mask_legend: false, legend_dx: 65, legend_dy: 166, legend_police: 12 })
    const texte = Object.values(d.labels).find(c => c.title === 'Titre du diagramme')
    expect(texte?.x).toBe(50)
    expect(texte?.y).toBe(50)
  })

  test('OS#1296 — légende sans <textFont> : legend_police absent (pas de valeur inventée)', () => {
    const withoutFont = FIXTURE_DECOR.replace(
      /<legend locationX="100" locationY="200">[\s\S]*?<\/legend>/,
      '<legend locationX="100" locationY="200" />'
    )
    const dNoFont = parseEsankeyXml(withoutFont, { 'Images/tmp1.tmp': PNG_URI })
    expect(dNoFont.legend?.legend_police).toBeUndefined()
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

// OS#1287 — le <sankeyArrowLabel> porte la mise en forme du label de VALEUR :
// taille (<font size>), couleur (textColor argb), décalage perpendiculaire au
// tracé (offsetH) et position le long du tracé (segmentPercentage). On ne pose
// ces réglages QUE quand la flèche affiche sa valeur (showValue) ; ils
// complètent (sans en décider) la visibilité du label. Attributs vérifiés sur
// les démos officielles e!Sankey 5.
describe('parseEsankeyXml — OS#1287 taille/couleur/position du label de valeur', () => {
  // On enrichit le <sankeyArrowLabel> auto-fermant de la FIXTURE : taille de
  // police 9 (<font>), couleur bleue (-16776961), décalage perpendiculaire
  // positif (offsetH 15.5 → sous le flux) et position 91 % le long du tracé
  // (près de la cible).
  const withLabel = FIXTURE.replace(
    '<sankeyArrowLabel visible="true" showValue="true" showUnit="true" labelFormat="{Quantity} {Unit}" />',
    '<sankeyArrowLabel visible="true" showValue="true" showUnit="true" labelFormat="{Quantity} {Unit}"' +
    ' offsetH="15.5" segmentPercentage="91" textColor="-16776961">' +
    '<font name="Calibri" size="9" /></sankeyArrowLabel>'
  )
  const d = parseEsankeyXml(withLabel)
  const link = Object.values(d.links)[0]

  test('taille de police reprise de <font size>', () => {
    expect(link.local.value_label_font_size).toBe(12) // 9 pt → 12 px (×4/3)
  })

  test('couleur du texte reprise de textColor (argb signé → hex RGB)', () => {
    expect(link.local.value_label_color).toBe('#0000FF') // -16776961 = bleu
  })

  test('segmentPercentage 91 (près de la cible) → value_label_horiz = right', () => {
    expect(link.local.value_label_horiz).toBe('right')
  })

  test('offsetH positif (sous le flux horizontal) → value_label_vert = bottom', () => {
    expect(link.local.value_label_vert).toBe('bottom')
  })

  test('segmentPercentage bas → left ; offsetH négatif → top', () => {
    const withOther = FIXTURE.replace(
      '<sankeyArrowLabel visible="true" showValue="true" showUnit="true" labelFormat="{Quantity} {Unit}" />',
      '<sankeyArrowLabel visible="true" showValue="true" showUnit="true" labelFormat="{Quantity} {Unit}"' +
      ' offsetH="-8" segmentPercentage="5"><font size="7" /></sankeyArrowLabel>'
    )
    const other = Object.values(parseEsankeyXml(withOther).links)[0]
    expect(other.local.value_label_horiz).toBe('left')
    expect(other.local.value_label_vert).toBe('top')
    expect(other.local.value_label_font_size).toBe(9) // 7 pt → 9 px (round(7×4/3))
  })

  test('label sans mise en forme (FIXTURE brute) : aucune clé T/P/C posée', () => {
    const base = Object.values(parseEsankeyXml(FIXTURE).links)[0]
    expect(base.local.value_label_font_size).toBeUndefined()
    expect(base.local.value_label_color).toBeUndefined()
    expect(base.local.value_label_horiz).toBeUndefined()
    expect(base.local.value_label_vert).toBeUndefined()
  })

  test('locationX/Y présents (flèche mono-matériau) → position ABSOLUE, normalisée avec les nœuds', () => {
    // Boîte du label : coin haut-gauche (300, 380), 40×16. Mode absolu OpenSankey :
    // position_x = bord GAUCHE (anchor start), position_y = CENTRE vertical
    // (baseline middle) → (300, 388), puis même translation de normalisation que
    // les nœuds — dérivée ici du process « Source » (e!Sankey (200, 400)).
    const withPos = FIXTURE_DECOR.replace(
      '<sankeyArrowLabel visible="true" showValue="true" showUnit="true" text="60" labelFormat="{EntryName}: {PercentProcessSource} %" />',
      '<sankeyArrowLabel visible="true" showValue="true" showUnit="true" text="60" labelFormat="{EntryName}: {PercentProcessSource} %"' +
      ' locationX="300" locationY="380" sizeW="40" sizeH="16" segmentPercentage="91" offsetH="15.5" />'
    )
    const d2 = parseEsankeyXml(withPos)
    const src = Object.values(d2.nodes).find(n => n.name === 'Source')!
    const dx = src.x - 200
    const dy = src.y - 400
    const l = Object.values(d2.links).find(l2 => l2.value.data_value === 60)!
    expect(l.local.value_label_position_absolute).toBe(true)
    expect(l.local.value_label_position_x).toBe(300 + dx)
    expect(l.local.value_label_position_y).toBe(388 + dy)
    // Le mode absolu REMPLACE l'approximation par tiers (segmentPercentage/offsetH).
    expect(l.local.value_label_horiz).toBeUndefined()
    expect(l.local.value_label_vert).toBeUndefined()
  })

  test('flèche MULTI-matériaux : pas de position absolue (N labels superposés sinon), repli par tiers', () => {
    const withPos = FIXTURE.replace(
      '<sankeyArrowLabel visible="true" showValue="true" showUnit="true" labelFormat="{Quantity} {Unit}" />',
      '<sankeyArrowLabel visible="true" showValue="true" showUnit="true" labelFormat="{Quantity} {Unit}"' +
      ' locationX="220" locationY="330" sizeW="40" sizeH="16" segmentPercentage="91" offsetH="15.5" />'
    )
    const l = Object.values(parseEsankeyXml(withPos).links)[0]
    expect(l.local.value_label_position_absolute).toBeUndefined()
    expect(l.local.value_label_horiz).toBe('right')
    expect(l.local.value_label_vert).toBe('bottom')
  })
})

// OS#1291 — Places (E/S externes). Un process « Usine » émet un flux vers une
// place de SORTIE (invisible) et reçoit un flux d'une place d'ENTRÉE (verte).
// Côté logique les places sont des <graphPlace> (frères des <graphProcess>
// dans <graphNodes>), référencées dans <from>/<to> par <graphPlaceRef> ;
// côté graphique elles vivent dans <net>/<places>/<place> ; le mapping les
// relie dans la sous-section <nodes> via <graphPlaceRef>/<placeRef>.
const FIXTURE_PLACES = `<?xml version="1.0" encoding="utf-8"?>
<document xmlns="${NS}" generator="e!Sankey">
  <netModel>
    <unitTypes>
      <unitType id="10" name="Energy" used="true" width="80" maximumFlow="40">
        <units><unit id="11" name="MJ" coefficient="1" isBasicUnit="true" /></units>
      </unitType>
    </unitTypes>
    <entryGroup id="20" name="Root">
      <entries>
        <entry id="21" name="Elec"><unitTypeRef refId="10" /><brushColor argb="-256" /></entry>
      </entries>
      <entryGroups />
    </entryGroup>
    <graphNodes>
      <graphProcess id="30" name="Usine" />
      <graphPlace id="32" name="Sortie" />
      <graphPlace id="33" name="Entree" />
    </graphNodes>
    <graphArrows>
      <graphArrow id="40" name="">
        <from><graphProcessRef refId="30" /></from>
        <to><graphPlaceRef refId="32" /></to>
        <compartments>
          <flow id="41" name="Elec" quantity="7" source="0">
            <entryRef refId="21" /><unitRef refId="11" />
          </flow>
        </compartments>
      </graphArrow>
      <graphArrow id="42" name="">
        <from><graphPlaceRef refId="33" /></from>
        <to><graphProcessRef refId="30" /></to>
        <compartments>
          <flow id="43" name="Elec" quantity="4" source="0">
            <entryRef refId="21" /><unitRef refId="11" />
          </flow>
        </compartments>
      </graphArrow>
    </graphArrows>
  </netModel>
  <net backgroundColor="-1">
    <processes>
      <process id="50" locationX="300" locationY="200"><label text="Usine" /></process>
    </processes>
    <places>
      <place id="52" locationX="600" locationY="200" visible="false"><label text="Sortie" /></place>
      <place id="53" locationX="100" locationY="200"><brushColor argb="-16711936" /><label text="Entree" /></place>
    </places>
    <arrows />
  </net>
  <logicalGraphicalObjectMapping>
    <nodes>
      <keyValuePair><graphProcessRef refId="30" /><processRef refId="50" /></keyValuePair>
      <keyValuePair><graphPlaceRef refId="32" /><placeRef refId="52" /></keyValuePair>
      <keyValuePair><graphPlaceRef refId="33" /><placeRef refId="53" /></keyValuePair>
    </nodes>
    <edges />
  </logicalGraphicalObjectMapping>
</document>`

describe('parseEsankeyXml — places (OS#1291)', () => {
  const d = parseEsankeyXml(FIXTURE_PLACES)

  test('une place → un nœud (process + 2 places = 3 nœuds)', () => {
    expect(Object.keys(d.nodes).length).toBe(3)
    const names = Object.values(d.nodes).map(n => n.name).sort()
    expect(names).toEqual(['Entree', 'Sortie', 'Usine'])
  })

  test('flux process→place et place→process créés', () => {
    expect(Object.keys(d.links).length).toBe(2)
    const usine = Object.values(d.nodes).find(n => n.name === 'Usine')!
    const sortie = Object.values(d.nodes).find(n => n.name === 'Sortie')!
    const entree = Object.values(d.nodes).find(n => n.name === 'Entree')!
    const out = Object.values(d.links).find(l => l.value.data_value === 7)!
    const inp = Object.values(d.links).find(l => l.value.data_value === 4)!
    expect(out.idSource).toBe(usine.id)
    expect(out.idTarget).toBe(sortie.id)
    expect(inp.idSource).toBe(entree.id)
    expect(inp.idTarget).toBe(usine.id)
    expect(usine.output_value).toBe(7)
    expect(usine.input_value).toBe(4)
  })

  test('place : nœud compact (node_width), position normalisée, couleur/visibilité graphiques', () => {
    const usine = Object.values(d.nodes).find(n => n.name === 'Usine')!
    const sortie = Object.values(d.nodes).find(n => n.name === 'Sortie')!
    const entree = Object.values(d.nodes).find(n => n.name === 'Entree')!
    // Place sans image → stub compact ; le process garde sa largeur par défaut.
    expect(sortie.local.node_width).toBe(12)
    expect(entree.local.node_width).toBe(12)
    expect(usine.local.node_width).toBeUndefined()
    // visible="false" sur la place de sortie → shape_visible false.
    expect(sortie.local.shape_visible).toBe(false)
    // brushColor argb -16711936 = vert sur la place d'entrée.
    expect(entree.local.color).toBe('#00FF00')
    // Normalisation : min (100, 200) ramené à (50, 50).
    expect(entree.x).toBe(50)
    expect(entree.y).toBe(50)
    expect(usine.x).toBe(250)
    expect(sortie.x).toBe(550)
  })
})

// OS#1292 — Stocks : compartiments <stock> des graphProcess. Sémantique
// centrée process : inputQuantity = déstockage (entre dans le process),
// outputQuantity = stockage (sort du process) → Δ stock = output − input.
// Fixture : A porte 2 compartiments visibles (dont un en kWh, coefficient 3.6),
// B un stock d'entry TRANSPARENTE (donnée gardée, forme masquée), C un
// compartiment sans quantité (rien à mapper).
describe('parseEsankeyXml — stocks (opensankey#1292)', () => {
  const STOCK_FIXTURE = `<?xml version="1.0" encoding="utf-8"?>
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
        <entry id="23" name="Transparent" showEntry="true" showInLegend="false">
          <unitTypeRef refId="10" />
          <brushColor argb="16777215" />
        </entry>
      </entries>
      <entryGroups />
    </entryGroup>
    <graphNodes>
      <graphProcess id="30" name="A">
        <compartments>
          <stock id="35" name="Electricity" isCutOff="false" inputQuantity="5" outputQuantity="0">
            <entryRef refId="21" />
            <unitRef refId="11" />
          </stock>
          <stock id="36" name="Electricity" isCutOff="false" inputQuantity="0" outputQuantity="10">
            <entryRef refId="21" />
            <unitRef refId="12" />
          </stock>
        </compartments>
      </graphProcess>
      <graphProcess id="31" name="B">
        <compartments>
          <stock id="37" name="Transparent" isCutOff="false" inputQuantity="400" outputQuantity="0">
            <entryRef refId="23" />
            <unitRef refId="11" />
          </stock>
        </compartments>
      </graphProcess>
      <graphProcess id="32" name="C">
        <compartments>
          <stock id="38" name="Electricity" isCutOff="false" inputQuantity="0" outputQuantity="0">
            <entryRef refId="21" />
            <unitRef refId="11" />
          </stock>
        </compartments>
      </graphProcess>
    </graphNodes>
    <graphArrows>
      <graphArrow id="40" name="">
        <from><graphProcessRef refId="30" /></from>
        <to><graphProcessRef refId="31" /></to>
        <compartments>
          <flow id="41" name="Electricity" quantity="10" source="0">
            <entryRef refId="21" />
            <unitRef refId="11" />
          </flow>
        </compartments>
      </graphArrow>
    </graphArrows>
  </netModel>
  <net backgroundColor="-1">
    <processes />
    <arrows />
  </net>
  <logicalGraphicalObjectMapping>
    <nodes />
    <edges />
  </logicalGraphicalObjectMapping>
</document>`
  const d = parseEsankeyXml(STOCK_FIXTURE)
  const a = Object.values(d.nodes).find(n => n.name === 'A')!
  const b = Object.values(d.nodes).find(n => n.name === 'B')!
  const c = Object.values(d.nodes).find(n => n.name === 'C')!

  test('compartiments sommés, conversion d\'unité (donnée Δ sur le process)', () => {
    expect(a.has_stock).toBe(true)
    // −5 MJ (déstockage) + 10 kWh × 3.6 (stockage) = +31 MJ
    expect(a.stock_values?.stock_variation).toBeCloseTo(31)
  })

  test('libellé de stock activé en local, avec unité du registre', () => {
    // Le remplissage de style legacy résout stock_label_is_visible à FALSE :
    // le défaut config (true) ne suffit pas, l'import doit poser le local.
    expect(a.local.stock_label_is_visible).toBe(true)
    expect(a.local.stock_label_unit_visible).toBe(true)
    expect(a.local.stock_label_unit_type).toBe('unit_model')
    // Unité du premier compartiment non transparent (MJ, id 11).
    expect(a.local.stock_label_unit).toBe('11')
  })

  test('entry transparente : donnée gardée, libellé muet', () => {
    expect(b.has_stock).toBe(true)
    expect(b.stock_values?.stock_variation).toBe(-400)
    expect(b.local.stock_label_is_visible).toBeUndefined()
  })

  test('compartiment sans quantité : aucun stock posé', () => {
    expect(c.has_stock).toBeUndefined()
    expect(c.stock_values).toBeUndefined()
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

// Le corpus e!Sankey livre le MÊME diagramme en plusieurs langues (suffixe
// ` [xx]` : `Efficiency diagram example [en].sankey`, `… [de].sankey`…). On n'en
// garde qu'UNE variante par diagramme (langue préférée, anglais d'abord) : les
// autres langues ne parseraient rien de neuf. Même tri que la galerie e!Sankey
// (esankey_local_index / _ESANKEY_LANG_ORDER côté serveur).
const ESANKEY_LANG_ORDER = ['en', 'de', 'fr', 'es', 'it', 'zh', 'ja', 'pt', 'nl']
const dedupeByLanguage = (names: string[]): string[] => {
  const langRank = (lang: string): number => {
    const i = ESANKEY_LANG_ORDER.indexOf(lang)
    return i === -1 ? ESANKEY_LANG_ORDER.length : i
  }
  const best: { [base: string]: { name: string, rank: number } } = {}
  for (const name of names) {
    const m = /^(.*?)\s*\[([a-z]{2})\]\.sankey$/i.exec(name)
    const base = m ? m[1].trim() : name.replace(/\.sankey$/i, '')
    const rank = m ? langRank(m[2].toLowerCase()) : ESANKEY_LANG_ORDER.length
    if (!best[base] || rank < best[base].rank) best[base] = { name, rank }
  }
  return Object.values(best).map(b => b.name).sort()
}

describeDemos('loadEsankeyFile — démos e!Sankey 5 locales', () => {
  const files = fs.existsSync(DEMOS_DIR)
    ? dedupeByLanguage(fs.readdirSync(DEMOS_DIR).filter(f => f.endsWith('.sankey')))
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
    // Légende présente et affichée ; OS#1296 — cette démo porte un <textFont
    // size="11.25"> (Arial) distinct du <captionFont size="9"> (Tahoma, non
    // repris) : vérifie que c'est bien le textFont du contenu qui est lu.
    expect(d.legend?.mask_legend).toBe(false)
    expect(d.legend?.legend_police).toBe(11.25)
    // Tous les process de cette démo sont invisibles (style « décor »)
    expect(Object.values(d.nodes).every(n => n.local.shape_visible === false)).toBe(true)
    // Labels de valeur : visibles UNIQUEMENT sur les flèches mono-matériau
    // (4 dans cette démo) ; les flèches multi-matériaux (5 et 3 flows → 8 flux
    // parallèles) restent éteintes (l'étiquette e!Sankey appartient à la flèche,
    // les N parts se chevaucheraient).
    const labelled = Object.values(d.links).filter(l => l.local.value_label_is_visible === true)
    expect(labelled.length).toBe(4)
    expect(Object.keys(d.links).length).toBe(12)
    // Texture : les rectangles hachurés (<brushColor hasPattern pattern="3">)
    // importent shape_hatch = antidiagonal (\) sur la zone de texte.
    expect(Object.values(d.labels).some(c => c.shape_hatch === 'antidiagonal')).toBe(true)
  }, 30000)

  test('Efficiency diagram : noms de process masqués (<label visible=false>), labels % {PercentModel}', async () => {
    const f = 'Efficiency diagram example [en].sankey'
    if (!files.includes(f)) return
    const buffer = fs.readFileSync(path.join(DEMOS_DIR, f))
    const d = await loadEsankeyFile(buffer as unknown as ArrayBuffer)
    // Les 9 process portent <label visible="false"> : aucun nom affiché.
    expect(Object.keys(d.nodes).length).toBe(9)
    expect(Object.values(d.nodes).every(n => n.local.label_visible === false)).toBe(true)
    // Les 8 flèches (mono-matériau) affichent un % intégré (showPercentage=2 =
    // {PercentModel}) : label visible, unité texte '%', facteur = plus gros flux
    // du modèle en unité de base / 100 (2000 MJ × 0.27778 = 555.56 kWh → 5.556).
    // Affichage : 555.56/5.556 = « 100 % », 84, 76, 54, 18, 16, 8, 4.
    const links = Object.values(d.links)
    expect(links.length).toBe(8)
    expect(links.every(l => l.local.value_label_is_visible === true)).toBe(true)
    expect(links.every(l => l.local.value_label_unit_type === 'unit_name')).toBe(true)
    expect(links.every(l => l.local.label_unit === '%')).toBe(true)
    const factors = links.map(l => Number(l.local.label_unit_factor))
    factors.forEach(f => expect(f).toBeCloseTo(5.5556, 3))
    // Le % rendu = data_value / facteur : vérifie les 8 valeurs attendues.
    const pcts = links.map(l => Math.round(l.value.data_value / factors[0])).sort((a, b) => a - b)
    expect(pcts).toEqual([4, 8, 16, 18, 54, 76, 84, 100])
    // Placement : la boîte e!Sankey du label (locationX/Y, présente sur toutes
    // les flèches) est reportée en position ABSOLUE, dans le repère normalisé.
    expect(links.every(l => l.local.value_label_position_absolute === true)).toBe(true)
    expect(links.every(l => Number.isFinite(l.local.value_label_position_x as number))).toBe(true)
  }, 30000)

  test('Processes with Stocks : stocks importés (opensankey#1292)', async () => {
    const f = 'Processes with Stocks (pro version) [en].sankey'
    if (!files.includes(f)) return
    const buffer = fs.readFileSync(path.join(DEMOS_DIR, f))
    const d = await loadEsankeyFile(buffer as unknown as ArrayBuffer)
    const stocked = Object.values(d.nodes).filter(n => n.has_stock)
    // 6 process, tous porteurs d'un stock non nul (le compartiment 0/0 d'Item A
    // sur Assembly ne compte pas). Bilan global fermé : Σ Δ stock = 0.
    expect(stocked.length).toBe(6)
    const variations = stocked.map(n => n.stock_values!.stock_variation).sort((x, y) => x - y)
    expect(variations).toEqual([-400, -380, -180, 180, 380, 400])
    expect(variations.reduce((s, v) => s + v, 0)).toBe(0)
    // Assembly stocke 380 d'Item B (output vers le stock) → Δ positif.
    const assembly = stocked.find(n => n.name.includes('Assembly'))!
    expect(assembly.stock_values?.stock_variation).toBe(380)
    // Représentation visible : le LIBELLÉ de stock, activé sur les 3 process à
    // stock non transparent seulement (les 3 stocks « Transparent » —
    // équilibrage des sources/puits — restent muets, comme chez e!Sankey).
    const labelled = stocked.filter(n => n.local.stock_label_is_visible === true)
    expect(labelled.length).toBe(3)
    expect(labelled.map(n => n.stock_values!.stock_variation).sort((x, y) => x - y)).toEqual([-400, -180, 380])
    expect(labelled.every(n => n.local.stock_label_unit_type === 'unit_model')).toBe(true)
    // Vérité de bout en bout : après fromJSON, l'attribut RÉSOLU du nœud est
    // bien visible (le remplissage de style legacy le résolvait à false quand
    // l'import comptait sur le défaut config — c'est le bug « je ne vois
    // rien » d'origine).
    const app = new Class_ApplicationData(false)
    app.fromJSON(d as never)
    const nAssembly = app.drawing_area.sankey.nodes_list.find(n => n.name.includes('Assembly'))!
    expect(nAssembly.has_stock).toBe(true)
    expect(nAssembly.stock_value?.stockVariationData).toBe(380)
    expect(nAssembly.stock_label_is_visible).toBe(true)
    const nSource = app.drawing_area.sankey.nodes_list.find(n => n.name.includes('Source of Resource 1'))!
    expect(nSource.has_stock).toBe(true)
    expect(nSource.stock_label_is_visible).toBe(false)
  }, 30000)
})
