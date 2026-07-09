// ==================================================================================================
// Portage TypeScript de `build/sankey.js` de SankeyMATIC — œuvre dérivée de
// https://github.com/nowthis/sankeymatic
//
// Copyright (c) 2014-2024, Steve Bogart, <sbogart@sankeymatic.com>
//
// ISC (Internet Software Consortium) License:
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS.
//
// IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING
// FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
// NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION
// WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
//
// Adaptations TypeScript : Copyright (c) 2026 TerriFlux (licence MIT du projet).
// ==================================================================================================
//
// Ce module reproduit l'algorithme de placement de SankeyMATIC :
//   1. affectation des nœuds à des « étages » (colonnes) par plus long chemin ;
//   2. insertion de nœuds FANTÔMES dans les étages traversés par un flux long,
//      afin qu'il réserve sa place verticale au lieu de passer derrière les nœuds ;
//   3. relaxation itérative (25 tours par défaut, amortis par alpha *= 0.99),
//      chaque tour parcourant les étages de gauche à droite puis de droite à gauche ;
//   4. tri des flux à l'intérieur de chaque nœud, du « plus mécontent » (pente la
//      plus forte) vers l'intérieur.
//
// Le module est volontairement SANS dépendance (les quatre helpers d3-array
// utilisés par l'original sont réécrits ici) : il est ainsi testable seul, et
// n'entraîne pas d3 dans le graphe de dépendances de la persistance.
//
// Repère de coordonnées : le layout travaille dans [0, width] x [0, height].
// C'est à l'appelant d'y ajouter les marges du diagramme.

/** Où accrocher les flux d'un nœud dont les entrées et sorties ne s'équilibrent pas. */
export type Type_SmAttachIncompletes = 'leading' | 'nearest' | 'trailing'

export interface SmLayoutConfig {
  width: number
  height: number
  nodeWidth: number
  /** node_h / 100 — 0 = « espacer au maximum », 1 = « aucun espacement ». */
  nodeHeightFactor: number
  /** node_spacing / 100 — fraction de l'espacement maximal réellement appliquée. */
  nodeSpacingFactor: number
  /** Force les nœuds sans entrée dans l'étage 0. */
  leftJustifyOrigins: boolean
  /** Force les nœuds sans sortie dans le dernier étage. */
  rightJustifyEndpoints: boolean
  /** `layout order automatic` (sinon : ordre exact des lignes source). */
  autoLayout: boolean
  attachIncompletesTo: Type_SmAttachIncompletes
  iterations: number
}

export interface SmLayoutNode {
  index: number
  name: string
  sourceRow: number
  isAShadow: boolean
  stage: number
  value: number
  totalIn: number
  totalOut: number
  flowsIn: SmLayoutFlow[]
  flowsOut: SmLayoutFlow[]
  x: number
  y: number
  dx: number
  dy: number
}

export interface SmLayoutFlow {
  index: number
  source: SmLayoutNode
  target: SmLayoutNode
  value: number
  sourceRow: number
  isAShadow: boolean
  hasAShadow: boolean
  /** Index du flux réel dont celui-ci est l'ombre (-1 si ce n'est pas une ombre). */
  shadowOf: number
  useForVisiblePlacing: boolean
  weightedValue: number
  /** Nombre d'étages traversés (target.stage - source.stage). */
  ds: number
  dx: number
  dy: number
  /** Décalage vertical du flux sous le bord haut de son nœud source. */
  sy: number
  /** Décalage vertical du flux sous le bord haut de son nœud cible. */
  ty: number
}

export interface SmLayoutInput {
  /** Dans l'ordre d'apparition dans la source. */
  nodes: { name: string, sourceRow: number }[]
  /** `source` / `target` = index dans `nodes`. */
  flows: { source: number, target: number, value: number, sourceRow: number }[]
}

export interface SmLayoutResult {
  /** Nœuds fantômes inclus — les filtrer sur `isAShadow` pour n'obtenir que les vrais. */
  nodes: SmLayoutNode[]
  flows: SmLayoutFlow[]
  stages: SmLayoutNode[][]
  /** Facteur d'échelle valeur -> pixels : hauteur d'un nœud = value * ky. */
  ky: number
}

// ------------------------------------------------------------------- Helpers

const sumBy = <T>(list: T[], f: (x: T) => number): number =>
  list.reduce((acc, x) => acc + f(x), 0)

const minBy = <T>(list: T[], f: (x: T) => number): number =>
  list.reduce((acc, x) => Math.min(acc, f(x)), Infinity)

const maxBy = <T>(list: T[], f: (x: T) => number): number =>
  list.reduce((acc, x) => Math.max(acc, f(x)), -Infinity)

/** Substitue MIN_VALUE à un dénominateur nul (comme `divide` dans sankey.js). */
const divide = (a: number, b: number): number => a / (b || Number.MIN_VALUE)

const valueSum = (list: { value: number }[]): number => sumBy(list, (d) => d.value)

const yCenter = (n: SmLayoutNode): number => n.y + n.dy / 2
const yBottom = (n: SmLayoutNode): number => n.y + n.dy

const sourceTop = (f: SmLayoutFlow): number => f.source.y + f.sy
const targetTop = (f: SmLayoutFlow): number => f.target.y + f.ty
const sourceCenter = (f: SmLayoutFlow): number => f.source.y + f.sy + f.dy / 2
const targetCenter = (f: SmLayoutFlow): number => f.target.y + f.ty + f.dy / 2
const sourceBottom = (f: SmLayoutFlow): number => f.source.y + f.sy + f.dy
const targetBottom = (f: SmLayoutFlow): number => f.target.y + f.ty + f.dy

const bySourceOrder = (a: { sourceRow: number }, b: { sourceRow: number }) => a.sourceRow - b.sourceRow
const byTopEdges = (a: SmLayoutNode, b: SmLayoutNode) => a.y - b.y

type Type_Placing = 'targets' | 'sources'
type Type_Edge = 'top' | 'bottom'

interface FlowSetStats {
  value: number
  sourcesWeight: number
  targetsWeight: number
  maxSourceStage: number
  minTargetStage: number
}

// ------------------------------------------------------------------- Layout

/**
 * Calcule le placement SankeyMATIC d'un graphe de flux.
 *
 * Les nœuds fantômes créés pour les flux traversant plusieurs étages sont
 * présents dans le résultat (`isAShadow`) : ils portent la réservation d'espace
 * vertical, mais ne doivent pas être rendus.
 */
export const computeSankeymaticLayout = (
  input: SmLayoutInput,
  cfg: SmLayoutConfig
): SmLayoutResult => {
  const nodes: SmLayoutNode[] = input.nodes.map((n, index) => ({
    index,
    name: n.name,
    sourceRow: n.sourceRow,
    isAShadow: false,
    stage: 0,
    value: 0,
    totalIn: 0,
    totalOut: 0,
    flowsIn: [],
    flowsOut: [],
    x: 0, y: 0, dx: 0, dy: 0,
  }))

  const flows: SmLayoutFlow[] = input.flows.map((f, index) => ({
    index,
    source: nodes[f.source],
    target: nodes[f.target],
    value: f.value,
    sourceRow: f.sourceRow,
    isAShadow: false,
    hasAShadow: false,
    shadowOf: -1,
    useForVisiblePlacing: true,
    weightedValue: 0,
    ds: 0,
    dx: 0, dy: 0, sy: 0, ty: 0,
  }))

  let stagesArr: SmLayoutNode[][] = []
  let maximumNodeSpacing = 0
  let actualNodeSpacing = 0
  let maxStage = -1
  let ky = 1

  const flowsOf = (n: SmLayoutNode, dir: 'in' | 'out') => (dir === 'in' ? n.flowsIn : n.flowsOut)
  const totalOf = (n: SmLayoutNode, dir: 'in' | 'out') => (dir === 'in' ? n.totalIn : n.totalOut)

  // ----------------------------------------------------------------- Setup

  const connectFlowsToNodes = () => {
    flows.forEach((f) => {
      f.source.flowsOut.push(f)
      f.target.flowsIn.push(f)
    })
  }

  const computeNodeValues = () => {
    nodes.forEach((n) => {
      n.totalIn = valueSum(n.flowsIn)
      n.totalOut = valueSum(n.flowsOut)
      n.value = Math.max(n.totalIn, n.totalOut, Number.MIN_VALUE)
    })
  }

  /**
   * Statistiques pondérées de l'ensemble des flux touchant un groupe de nœuds,
   * d'un côté donné. Sert à décider où ce groupe « voudrait » se placer.
   */
  const flowSetStats = (nodeList: SmLayoutNode[], dir: 'in' | 'out'): FlowSetStats => {
    const flowList = nodeList
      .map((n) => flowsOf(n, dir))
      .flat()
      .filter((f) => f.weightedValue > 0)
    if (flowList.length === 0) {
      return { value: 0, sourcesWeight: 0, targetsWeight: 0, maxSourceStage: 0, minTargetStage: 0 }
    }
    return {
      value: sumBy(flowList, (f) => f.weightedValue),
      sourcesWeight: sumBy(flowList, (f) => sourceCenter(f) * f.weightedValue),
      maxSourceStage: maxBy(flowList, (f) => f.source.stage),
      targetsWeight: sumBy(flowList, (f) => targetCenter(f) * f.weightedValue),
      minTargetStage: minBy(flowList, (f) => f.target.stage),
    }
  }

  /**
   * Calcule le décalage vertical (sy/ty) de chaque extrémité de flux, relatif au
   * bord haut de son nœud. Les flux sont placés « du dehors vers le dedans » :
   * à chaque tour on donne les bords haut et bas aux flux dont la pente serait
   * la plus mauvaise, puis on rétrécit la plage disponible.
   */
  const placeFlowsInsideNodes = (nodeList: SmLayoutNode[]) => {
    const sortFlows = (n: SmLayoutNode, placing: Type_Placing) => {
      const dir = placing === 'targets' ? 'in' : 'out'
      const stats = flowSetStats([n], dir)
      const flowsToSort = flowsOf(n, dir)
      const totalFlowValue = totalOf(n, dir)
      const totalFlowWeight = dir === 'in' ? stats.sourcesWeight : stats.targetsWeight
      const flowsRemaining = new Set(flowsToSort.map((f) => f.index))
      // Hauteur réellement occupée par les flux visibles accrochés ici (peut être
      // inférieure à n.dy quand le nœud est déséquilibré) :
      const totalFlowSpan = sumBy(
        flowsToSort.filter((f) => !f.isAShadow || n.isAShadow),
        (f) => f.dy
      )

      // On accroche les flux en HAUT, sauf si le nœud est déséquilibré ET que le
      // réglage (ou le barycentre des flux) demande le bas.
      const flowPosition: Type_Edge
        = totalFlowValue < n.value
          && (cfg.attachIncompletesTo === 'trailing'
            || (cfg.attachIncompletesTo === 'nearest'
              && divide(totalFlowWeight, totalFlowValue) > yCenter(n)))
          ? 'bottom'
          : 'top'

      // « upper » / « lower » sont visuels, pas numériques (l'axe y du SVG est inversé).
      const bounds = flowPosition === 'top'
        ? { upper: n.y, lower: n.y + totalFlowSpan }
        : { upper: yBottom(n) - totalFlowSpan, lower: yBottom(n) }

      const placeFlow = (f: SmLayoutFlow, newTopY: number) => {
        // Le flux peut avoir déjà été retiré de la file (cas d'une ombre qui
        // propage sa position au flux réel, lequel appartient à un autre étage).
        if (!flowsRemaining.has(f.index)) return
        if (placing === 'targets') f.ty = newTopY - f.target.y
        else f.sy = newTopY - f.source.y
        flowsRemaining.delete(f.index)
      }

      const placeFlowAt = (edge: Type_Edge, fIndex: number) => {
        const f = flows[fIndex]
        let newY = 0
        if (edge === 'top') {
          newY = bounds.upper
          if (f.useForVisiblePlacing || n.isAShadow) bounds.upper += f.dy
        } else {
          newY = bounds.lower - f.dy
          if (f.useForVisiblePlacing || n.isAShadow) bounds.lower = newY
        }
        placeFlow(f, newY)
        // Une ombre qui sert au placement visible reporte sa position sur le flux réel.
        if (f.useForVisiblePlacing && f.isAShadow) placeFlow(flows[f.shadowOf], newY)
      }

      const slopeOf = (edge: Type_Edge, f: SmLayoutFlow): number => {
        if (edge === 'top') {
          return placing === 'targets'
            ? (bounds.upper - sourceTop(f)) / f.dx
            : (targetTop(f) - bounds.upper) / f.dx
        }
        return placing === 'targets'
          ? (bounds.lower - sourceBottom(f)) / f.dx
          : (targetBottom(f) - bounds.lower) / f.dx
      }

      const slopeDir = (edge: Type_Edge): number => {
        if (edge === 'top') return placing === 'targets' ? -1 : 1
        return placing === 'targets' ? 1 : -1
      }

      /** Place le flux le plus mal loti (en pente) sur le bord demandé. */
      const placeUnhappiestFlowAt = (edge: Type_Edge): boolean => {
        if (!flowsRemaining.size) return false
        const dir_ = slopeDir(edge)
        const flowIndex = Array.from(flowsRemaining)
          // Les flux porteurs d'une ombre reçoivent leur position via celle-ci :
          .filter((i) => !flows[i].hasAShadow)
          .sort((a, b) => (
            (cfg.autoLayout
              ? (dir_ * (slopeOf(edge, flows[a]) - slopeOf(edge, flows[b]))
                || flows[a].dx - flows[b].dx)
              : 0)
            || flows[a].sourceRow - flows[b].sourceRow
          ))[0]
        if (flowIndex === undefined) return false
        placeFlowAt(edge, flowIndex)
        return true
      }

      while (flowsRemaining.size > 1) {
        const placedTop = placeUnhappiestFlowAt('top')
        // En ordre exact on remplit de haut en bas, sans alterner.
        const placedBottom = cfg.autoLayout ? placeUnhappiestFlowAt('bottom') : false
        // Garde-fou : si plus rien n'est plaçable (tous les flux restants portent
        // une ombre), on sort plutôt que de boucler indéfiniment.
        if (!placedTop && !placedBottom) break
      }
      flowsRemaining.forEach((i) => placeFlowAt('top', i))
    }

    // Les nœuds ont pu bouger depuis le placement initial : on rafraîchit les dx.
    // Valeur ABSOLUE, pour que l'ordre reste stable même si un nœud passe de
    // l'autre côté d'un voisin ; jamais 0, car il sert de dénominateur.
    flows.forEach((f) => { f.dx = Math.abs(f.target.x - f.source.x) || Number.MIN_VALUE })

    // On traite d'abord les nœuds ayant le MOINS de flux : un placement à 1 flux
    // est certain, à 2 il est simple… les cas durs héritent ainsi d'un décor déjà
    // largement contraint.
    const flowBatches: { n: SmLayoutNode, len: number, placing: Type_Placing }[] = [
      ...nodeList.filter((n) => n.flowsIn.length)
        .map((n) => ({ n, len: n.flowsIn.length, placing: 'targets' as Type_Placing })),
      ...nodeList.filter((n) => n.flowsOut.length)
        .map((n) => ({ n, len: n.flowsOut.length, placing: 'sources' as Type_Placing })),
    ]
    flowBatches.sort((a, b) => a.len - b.len).forEach((b) => sortFlows(b.n, b.placing))
  }

  /**
   * Affecte itérativement un étage (colonne) à chaque nœud : max(étage des
   * prédécesseurs) + 1, puis on pousse à droite tout nœud qui a de la place.
   * Crée enfin les nœuds/flux fantômes pour les flux traversant >1 étage.
   */
  const assignNodesToStages = () => {
    const nodesToCheckAgain = new Set<SmLayoutNode>()
    const updateNode = (n: SmLayoutNode) => {
      n.stage = maxStage
      n.flowsOut.forEach((f) => nodesToCheckAgain.add(f.target))
    }

    let nodesToPlace = nodes.slice()
    // Le garde sur maxStage évite la boucle infinie en présence d'un cycle.
    while (nodesToPlace.length && maxStage < nodes.length - 1) {
      maxStage += 1
      nodesToPlace.forEach(updateNode)
      nodesToPlace = Array.from(nodesToCheckAgain)
      nodesToCheckAgain.clear()
    }

    // Pousser à droite les nœuds source qui ont de la place.
    nodes
      .filter((n) => n.flowsOut.length).slice()
      .sort((a, b) => b.stage - a.stage)
      .forEach((n) => {
        const maxNewStage = minBy(n.flowsOut, (f) => f.target.stage) - 1
        if (n.stage < maxNewStage) n.stage = maxNewStage
      })

    if (cfg.leftJustifyOrigins) {
      nodes.filter((n) => !n.flowsIn.length).forEach((n) => { n.stage = 0 })
    }
    if (cfg.rightJustifyEndpoints) {
      nodes.filter((n) => !n.flowsOut.length).forEach((n) => { n.stage = maxStage })
    }

    flows.forEach((f) => { f.ds = f.target.stage - f.source.stage })

    // Nœuds FANTÔMES : un flux qui saute des étages y occupe malgré tout de la
    // place verticale, ce qui l'empêche de passer derrière les nœuds traversés.
    const shadowNodeNames = new Map<string, number>()
    flows.filter((f) => Math.abs(f.ds) > 1).forEach((f) => {
      const nodesForThisFlow: SmLayoutNode[] = [f.source]
      for (let i = 1; i < f.ds; i += 1) {
        const shadowStage = f.source.stage + i
        const newNodeName = `sh_${f.source.index}_${f.target.index}_s${shadowStage}`
        const fVal = Number(f.value)
        let shadowNode: SmLayoutNode
        const existing = shadowNodeNames.get(newNodeName)
        if (existing !== undefined) {
          // Plusieurs flux entre les deux mêmes nœuds partagent leur fantôme.
          shadowNode = nodes[existing]
          shadowNode.value += fVal
          shadowNode.totalIn += fVal
          shadowNode.totalOut += fVal
        } else {
          shadowNode = {
            index: nodes.length,
            name: newNodeName,
            // Même sourceRow que le flux d'origine : le fantôme se hisse au même
            // rang que lui dans l'ordre de l'étage.
            sourceRow: f.sourceRow,
            isAShadow: true,
            stage: shadowStage,
            value: fVal,
            totalIn: fVal,
            totalOut: fVal,
            flowsIn: [],
            flowsOut: [],
            x: 0, y: 0, dx: 0, dy: 0,
          }
          nodes.push(shadowNode)
          shadowNodeNames.set(newNodeName, shadowNode.index)
        }
        nodesForThisFlow.push(shadowNode)
      }
      nodesForThisFlow.push(f.target)

      for (let i = 1; i < nodesForThisFlow.length; i += 1) {
        const sourceNode = nodesForThisFlow[i - 1]
        const targetNode = nodesForThisFlow[i]
        const newFlow: SmLayoutFlow = {
          ...f,
          source: sourceNode,
          target: targetNode,
          index: flows.length,
          shadowOf: f.index,
          isAShadow: true,
          hasAShadow: false,
          // sourceRow artificiel : l'ombre reste priorisée AVEC le flux d'origine.
          sourceRow: Number(f.sourceRow) + i / (f.ds + 1),
          // La position de l'ombre ne se propage au flux réel qu'aux extrémités.
          useForVisiblePlacing:
            sourceNode.stage === f.source.stage || targetNode.stage === f.target.stage,
        }
        flows.push(newFlow)
        newFlow.source.flowsOut.push(newFlow)
        newFlow.target.flowsIn.push(newFlow)
      }

      f.useForVisiblePlacing = false
      f.hasAShadow = true
    })
  }

  const updateStagesArray = () => {
    const byStage = new Map<number, SmLayoutNode[]>()
    nodes.forEach((n) => {
      const g = byStage.get(n.stage)
      if (g) g.push(n)
      else byStage.set(n.stage, [n])
    })
    stagesArr = Array.from(byStage.entries())
      .sort((a, b) => a[0] - b[0])
      .map((e) => e[1].sort(bySourceOrder))
  }

  // ---------------------------------------------------------------- Placement

  const nodeSetStats = (nodeList: SmLayoutNode[]) => {
    const weight = sumBy(nodeList, (n) => yCenter(n) * n.value)
    const value = valueSum(nodeList)
    return { stage: nodeList[0].stage, weight, value, center: divide(weight, value) }
  }

  const initializeNodePositions = () => {
    const greatestNodeCount = maxBy(stagesArr, (s) => s.length)

    if (greatestNodeCount === 1) {
      // Cas particulier : un seul nœud par étage — l'espacement n'a pas de sens,
      // et la formule générale diviserait par zéro.
      maximumNodeSpacing = 0
      actualNodeSpacing = 0
      ky = cfg.nodeHeightFactor * minBy(stagesArr, (s) => divide(cfg.height, valueSum(s)))
    } else {
      // Si chaque nœud de l'étage le plus chargé recevait 1 pixel, combien de
      // pixels resterait-il ? (Au moins 2, sinon le curseur n'a plus de course.)
      const allAvailablePadding = Math.max(2, cfg.height - greatestNodeCount)
      maximumNodeSpacing
        = ((1 - cfg.nodeHeightFactor) * allAvailablePadding) / (greatestNodeCount - 1)
      actualNodeSpacing = maximumNodeSpacing * cfg.nodeSpacingFactor
      ky = minBy(
        stagesArr,
        (s) => divide(cfg.height - (s.length - 1) * maximumNodeSpacing, valueSum(s))
      )
    }
    // Arrive quand toutes les valeurs de nœuds sont nulles.
    if (!Number.isFinite(ky)) ky = 1

    flows.forEach((f) => {
      f.dy = f.value * ky
      f.weightedValue = f.hasAShadow ? 0 : f.value
    })
    nodes.forEach((n) => { n.dy = Math.max(n.value * ky, Number.MIN_VALUE) })

    stagesArr.forEach((s, stageIndex) => {
      const stageSize = valueSum(s) * ky + actualNodeSpacing * (s.length - 1)
      // Par défaut on centre l'étage ; s'il reçoit des flux, on le centre plutôt
      // sur ses sources. (À ce stade aucun flux n'est encore placé, donc on ne
      // peut pas utiliser les barycentres de flux : on prend ceux des nœuds.)
      let targetY = cfg.height / 2
      const allFlowsIn = s.map((n) => n.flowsIn).flat()
      if (allFlowsIn.length > 0) {
        const uniqueSourceNodes = new Set(
          allFlowsIn.map((f) => f.source)
            // Les fantômes sont dans tous les étages : ne pas regarder plus d'un
            // étage en arrière (et une boucle peut ramener le même étage).
            .filter((n) => n.stage >= stageIndex - 1)
        )
        if (uniqueSourceNodes.size > 0) {
          targetY = nodeSetStats(Array.from(uniqueSourceNodes)).center
        }
      }
      let nextNodePos = Math.max(0, Math.min(targetY - stageSize / 2, cfg.height - stageSize))
      s.forEach((n) => {
        n.y = nextNodePos
        nextNodePos = yBottom(n) + actualNodeSpacing
      })
    })

    const widthPerStage = maxStage > 0 ? (cfg.width - cfg.nodeWidth) / maxStage : 0
    nodes.forEach((n) => {
      n.x = widthPerStage * n.stage
      n.dx = cfg.nodeWidth
    })

    // Placement naïf initial des flux, pour que leurs poids soient mesurables
    // dès le premier tour ; placeFlowsInsideNodes corrigera.
    nodes.forEach((n) => {
      let sy = 0
      let ty = 0
      n.flowsOut.forEach((f) => {
        // Une ombre touchant un vrai nœud adopte la position de son flux réel
        // (fonctionne car les ombres SUIVENT toujours les flux réels).
        if (f.isAShadow && !n.isAShadow) f.sy = flows[f.shadowOf].sy
        else { f.sy = sy; sy += f.dy }
      })
      n.flowsIn.forEach((f) => {
        if (f.isAShadow && !n.isAShadow) f.ty = flows[f.shadowOf].ty
        else { f.ty = ty; ty += f.dy }
      })
    })
  }

  /** Où ce groupe de nœuds « voudrait » être ? Renvoie le décalage y à appliquer. */
  const findNodeGroupOffset = (nodeList: SmLayoutNode[]): number => {
    const statsIn = flowSetStats(nodeList, 'in')
    const statsOut = flowSetStats(nodeList, 'out')
    const totalIn = statsIn.value
    const totalOut = statsOut.value
    if (totalIn === 0 && totalOut === 0) return 0

    const nStats = nodeSetStats(nodeList)
    // Barycentre du groupe, MOINS celui des cibles des flux entrants, PLUS celui
    // de leurs sources. Si 100 % de la valeur du groupe entre par des flux, cela
    // vaut exactement « le barycentre de toutes les sources ».
    const projectedSourceCenter = divide(
      nStats.weight - statsIn.targetsWeight + statsIn.sourcesWeight,
      nStats.value
    )
    const projectedTargetCenter = divide(
      nStats.weight - statsOut.sourcesWeight + statsOut.targetsWeight,
      nStats.value
    )

    let goalY = 0
    if (totalOut === 0) {
      goalY = projectedSourceCenter
    } else if (totalIn === 0) {
      goalY = projectedTargetCenter
    } else {
      // Flux des deux côtés : on place le groupe sur la droite reliant les deux
      // barycentres, à l'abscisse de son propre étage.
      const startStage = statsIn.maxSourceStage
      const endStage = statsOut.minTargetStage
      const stageDistance = endStage - startStage
      const slopeBetweenCenters = stageDistance !== 0
        ? (projectedTargetCenter - projectedSourceCenter) / stageDistance
        : 0
      goalY = projectedSourceCenter + (nStats.stage - startStage) * slopeBetweenCenters
    }
    return goalY - nStats.center
  }

  /**
   * Garantit l'espacement minimal entre nœuds d'un étage, puis recentre les
   * groupes de nœuds devenus solidaires (collés) sur leurs propres connexions.
   */
  const updateStageCentering = (s: SmLayoutNode[]) => {
    const enforceValidNodePositions = () => {
      let yPos = 0
      s.forEach((n) => {
        if (n.y < yPos) n.y = yPos
        yPos = yBottom(n) + actualNodeSpacing
      })
      // Si on a débordé par le bas, on remonte.
      yPos = cfg.height
      s.slice().reverse().forEach((n) => {
        if (yBottom(n) > yPos) n.y = yPos - n.dy
        yPos = n.y - actualNodeSpacing
      })
    }

    // Deux nœuds triés en hauteur sont-ils collés (à un dixième de pixel près) ?
    const nodesAreAdjacent = (n1: SmLayoutNode, n2: SmLayoutNode) =>
      (n2.y - actualNodeSpacing - yBottom(n1)) < 0.1

    const centerNeighborGroups = () => {
      const neighborGroups: SmLayoutNode[][] = []
      s.forEach((n, i) => {
        if (i > 0 && nodesAreAdjacent(s[i - 1], n)) neighborGroups[neighborGroups.length - 1].push(n)
        else neighborGroups.push([n])
      })
      neighborGroups.filter((g) => g.length > 1).forEach((nodeGroup) => {
        const yOffset = findNodeGroupOffset(nodeGroup)
        nodeGroup.forEach((n) => { n.y += yOffset })
      })
    }

    s.sort(cfg.autoLayout ? byTopEdges : bySourceOrder)
    enforceValidNodePositions()
    centerNeighborGroups()
    enforceValidNodePositions()
    // On vient peut-être de créer de nouveaux voisins : un tour de plus.
    centerNeighborGroups()
    enforceValidNodePositions()
  }

  const processStages = (stageList: SmLayoutNode[][], factor: number) => {
    stageList.forEach((s) => {
      s.forEach((n) => { n.y += findNodeGroupOffset([n]) * factor })
      // Les positions de cet étage servent de poids dès l'étage suivant : on les
      // consolide (espacement + flux) tout de suite.
      updateStageCentering(s)
      placeFlowsInsideNodes(s)
    })
    // Certains choix locaux ne tiennent pas à l'échelle du diagramme : on refait
    // un placement de flux global en fin de tour.
    placeFlowsInsideNodes(nodes)
  }

  const reCenterDiagram = () => {
    const minY = minBy(nodes, (n) => n.y)
    const yH = maxBy(nodes, (n) => yBottom(n)) - minY
    if (yH < cfg.height) {
      const yOffset = cfg.height / 2 - (minY + yH / 2)
      nodes.forEach((n) => { n.y += yOffset })
    }
  }

  // ------------------------------------------------------------------- Exécution

  connectFlowsToNodes()
  computeNodeValues()
  assignNodesToStages()
  updateStagesArray()

  initializeNodePositions()
  stagesArr.forEach(updateStageCentering)
  placeFlowsInsideNodes(nodes)

  let alpha = 1
  for (let counter = 0; counter < cfg.iterations; counter += 1) {
    // Chaque tour pèse un peu moins que le précédent.
    alpha *= 0.99
    processStages(stagesArr, alpha)
    processStages(stagesArr.slice().reverse(), alpha)
    reCenterDiagram()
  }

  return { nodes, flows, stages: stagesArr, ky }
}
