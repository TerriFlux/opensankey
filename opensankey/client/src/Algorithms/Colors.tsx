import * as d3 from 'd3'

import { Class_LinkElement } from '../Elements/Link'
import { Class_ApplicationData } from '../types/ApplicationData'
import { GetRandomInt, list_palette_color } from '../types/Utils'
import { Class_NodeBase } from '../Elements/NodeBase'

/**
 * Fonction générique pour appliquer des couleurs aléatoires à une liste d'éléments
 * @param elements - Liste des éléments (nodes ou links)
 * @param elementType - Type d'élément pour les noms de fonctions ('node' ou 'link')
 */
export const applyRandomColors = (
  app_data: Class_ApplicationData,
  elements: Class_LinkElement[] | Class_NodeBase[]
) => {
  const color_selected = list_palette_color[GetRandomInt(list_palette_color.length)]
  const size_color = elements.length
  const old_color = Object.fromEntries(elements.map(el => [el.id, el.shape_color]))
  
  // Fonction pour créer des indices aléatoires (Fisher-Yates shuffle)
  const createRandomIndices = (length: number): number[] => {
    const indices = Array.from({ length }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
  }
  
  const _applyRandomColors = () => {
    const randomIndices = createRandomIndices(size_color)
    
    for (let i = 0; i < size_color; i++) {
      const randomIndex = randomIndices[i]
      elements[i].shape_color = (d3.color(color_selected(randomIndex / size_color))?.formatHex() as string)
    }
  }
  
  const _revertColors = () => {
    elements.forEach(el => el.shape_color = old_color[el.id])
  }
  
  // Save undo/redo in data history
  app_data.history.saveUndo(_revertColors)
  app_data.history.saveRedo(_applyRandomColors)
  // Execute original attr mutation
  _applyRandomColors()
}