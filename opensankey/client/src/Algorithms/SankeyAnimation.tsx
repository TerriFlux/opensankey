// ==================================================================================================
// Animation Module for Sankey Diagrams - Simplified Version
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// ==================================================================================================
// Authors: Vincent CLAVEL, Julien ALAPETITE, Vincent LE DOZE for TerriFlux
// ==================================================================================================

import * as d3 from 'd3'
import { Class_NodeDimension } from '../Elements/NodeDimension'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_LinkElement } from '../Elements/Link'
import { Class_NodeElement } from '../Elements/Node'

/**
 * Classe simplifiée gérant les animations pour les diagrammes Sankey
 */
export class SankeyAnimation {
  private drawingArea: Class_DrawingArea
  private startNode: Class_NodeElement

  constructor(drawingArea: Class_DrawingArea, startNode: Class_NodeElement) {
    this.drawingArea = drawingArea
    this.startNode = startNode
  }

  /**
   * Lance l'animation à partir du nœud de départ
   */
  public launchAnimation(): void {
    // Prépare l'animation en grisant tous les nœuds sauf celui de départ
    this.prepareAnimation()

    // Lance l'animation récursive
    this.branchAnimate([], this.drawingArea.sankey.visible_nodes_list)

    // Programme la réinitialisation
    this.scheduleReset()
  }

  /**
   * Prépare l'animation en modifiant l'apparence initiale
   */
  private prepareAnimation(): void {
    // Grise tous les nœuds sauf celui de départ
    this.drawingArea.sankey.visible_nodes_list
      .filter((node: Class_NodeElement) => node !== this.startNode)
      .forEach((node: Class_NodeElement) => {
        node.d3_selection_g_shape?.selectAll('.node_shape').attr('fill', '#dddddd')
      })

    // Cache tous les liens avant l'animation
    this.drawingArea.sankey.visible_links_list.forEach((link: Class_LinkElement) => {
      link.d3_selection?.selectAll('.link_path').attr('stroke-opacity', 0)
      link.d3_selection?.selectAll('.link_arrow').attr('opacity', 0)
      link.d3_selection?.selectAll('.link_label').attr('display', 'none')
    })
  }

  /**
   * Calcule le délai pour les nœuds ayant plusieurs chemins d'accès
   */
  public calculateSiblingDelay(
    nodeData: Class_NodeElement,
    deep: number,
    linksToAvoid: Class_LinkElement[],
    displayNodes: Class_NodeElement[]
  ): number {
    // Cherche à savoir si un nœud qui reçoit directement le flux de nodeData
    // a aussi un chemin indirect vers ce même nœud
    // exemple : n0 -> n1 et n0 -> n2 -> n1

    const nextLinks = nodeData.output_links_list?.filter((link: Class_LinkElement) =>
      link.shape_is_recycling &&
      !linksToAvoid.includes(link) &&
      displayNodes.includes(link.target)
    ) || []

    let max = 0

    if (nodeData.id === this.startNode.id) {
      return deep - 1
    } else if (nextLinks.length > 0) {
      nextLinks.forEach((link: Class_LinkElement) => {
        const nextNode = link.target
        const updatedLinksToAvoid = [...linksToAvoid, link]
        const delay = this.calculateSiblingDelay(nextNode, deep + 1, updatedLinksToAvoid, displayNodes)
        max = Math.max(max, delay)
      })
    }

    return max
  }

  /**
   * Récupère récursivement la liste des descendants d'un nœud
   */
  public getDescendantNodes(node: Class_NodeElement): Class_NodeElement[] {
    let nodeList: Class_NodeElement[] = []

    const dimensionsAsParentPure = node.dimensions_as_parent_pure || []
    dimensionsAsParentPure.forEach((dimension: Class_NodeDimension) => {
      // Récupère les enfants directs
      const children = (dimension.children || []) as Class_NodeElement[]
      nodeList = [...nodeList, ...children];

      // Récupère les descendants des enfants
      (dimension.children || []).forEach((child) => {
        nodeList = [...nodeList, ...this.getDescendantNodes(child as Class_NodeElement)]
      })
    })

    // Supprime les doublons
    return [...new Set(nodeList)]
  }

  /**
   * Animation récursive des branches
   */
  private branchAnimate(
    nodeDisplay: Class_NodeElement[],
    nodeVisible: Class_NodeElement[]
  ): void {

    const glinks = this.drawingArea.d3_selection_elements_group?.selectAll('.gg_links')
      .filter((d) => {
        const cast_d = d as Class_LinkElement
        return cast_d.source?.id === this.startNode.id
      })

    glinks?.select('.link_path').attr('stroke-opacity', (l) => (l as Class_LinkElement).shape_opacity || 0.8)

    glinks?.selectAll('.link_path').each((d, i, nodes) => {
      const element = nodes[i] as SVGGeometryElement
      const totalLength = element.getTotalLength()
      const linkId = d3.select(element).attr('id')
      const linkClass = this.drawingArea?.sankey?.links_dict?.[linkId]

      d3.select(element)
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .style('stroke', linkClass?.getPathColorToUse?.() || '#999')
    })
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0)
      .on('end', (d, i, nodes) => {
        // 'this' = élément SVG, 'self' = instance SankeyAnimation
        const element = nodes[i] as SVGPathElement
        const linkId = d3.select(element).attr('id')?.replace('path_', '') || ''

        const animatedLink = this.drawingArea?.sankey?.links_dict?.[linkId]
        if (!animatedLink) return

        const targetNode = animatedLink.target

        // Remet la couleur originale du nœud cible
        if (targetNode?.d3_selection_g_shape && typeof targetNode.getShapeColorToUse === 'function') {
          targetNode.d3_selection_g_shape.select('.node_shape')
            .attr('fill', targetNode.getShapeColorToUse())
        }

        // Gère les flèches - CORRECTION: toujours rendre visible
        const arrow = animatedLink.d3_selection?.selectAll('.link_arrow')
        if (arrow) {
          // D'abord rendre visible
          arrow.attr('opacity', animatedLink.shape_opacity || 0.8)

          // Puis définir la couleur si possible
          if (targetNode) {
            const colorTarget = targetNode.shape_visible
              ? (targetNode.getShapeColorToUse?.() || '#999')
              : (targetNode.icon_is_visible ? targetNode.icon_color : 'grey')

            const isGradient = animatedLink.shape_color_rule === 'gradient'
            const color = isGradient ? colorTarget : (animatedLink.getPathColorToUse?.() || '#999')

            if (color) {
              arrow.attr('fill', color)
            }
          }
        }

        // Réaffiche les labels des liens
        animatedLink.d3_selection?.selectAll('.link_label').attr('display', '')

        if (targetNode && !nodeDisplay.includes(targetNode)) {
          nodeDisplay.push(targetNode)

          const delay = this.calculateSiblingDelay(targetNode, 0, [animatedLink], nodeVisible)

          setTimeout(() => {
            const targetAnimation = new SankeyAnimation(this.drawingArea, targetNode)
            targetAnimation.branchAnimate(nodeDisplay, nodeVisible)
          }, delay * 2000)
        }
      })
  }

  /**
   * Programme la réinitialisation du diagramme
   */
  private scheduleReset(): void {
    try {
      const echangeTag = this.drawingArea?.sankey?.node_taggs_dict?.['type de noeud']?.tags_dict?.['echange']
      const nodesToProcess = this.drawingArea?.sankey?.visible_nodes_list?.filter((node: Class_NodeElement) =>
        !echangeTag || !node.hasGivenTag?.(echangeTag)
      ) || []

      // Calcule l'index horizontal maximum pour déterminer la durée totale
      const horizontalIndexes: { [node_id: string]: number } = {}

      if (this.drawingArea?.nodePositioning?.computeHorizontalIndex) {
        this.drawingArea.nodePositioning.computeHorizontalIndex(
          this.startNode,
          nodesToProcess,
          0,
          [],
          [],
          horizontalIndexes
        )
      }

      // Calcule le temps total d'animation
      let totalAnimationTime = 500
      const maxAnimations = Object.values(horizontalIndexes).reduce((a, b) => Math.max(a, b), 0)
      totalAnimationTime += maxAnimations * 2000

      // Programme la réinitialisation (minimum 3 secondes)
      const resetTime = Math.max(totalAnimationTime, 3000)

      setTimeout(() => {
        if (this.drawingArea?.draw && typeof this.drawingArea.draw === 'function') {
          this.drawingArea.draw()
        }
      }, resetTime)
    } catch (error) {
      console.warn('Erreur lors de la programmation de la réinitialisation:', error)
      // Réinitialisation de secours après 5 secondes
      setTimeout(() => {
        if (this.drawingArea?.draw && typeof this.drawingArea.draw === 'function') {
          this.drawingArea.draw()
        }
      }, 5000)
    }
  }
}

/**
 * Factory function pour créer une animation Sankey
 */
export function createSankeyAnimation(drawingArea: Class_DrawingArea, startNode: Class_NodeElement): SankeyAnimation {
  return new SankeyAnimation(drawingArea, startNode)
}

/**
 * Fonction utilitaire pour lancer une animation depuis un nœud
 */
export function launchAnimationFromNode(node: Class_NodeElement): void {
  if (!node?.drawing_area) {
    console.warn('Impossible de lancer l\'animation: drawing_area manquant')
    return
  }

  const animation = new SankeyAnimation(node.drawing_area, node)
  animation.launchAnimation()
}