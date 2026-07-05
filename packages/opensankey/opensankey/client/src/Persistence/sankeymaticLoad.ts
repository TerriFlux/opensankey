// Chargement d'un modèle SankeyMATIC natif (.txt) 100 % côté front : on récupère
// le texte servi par le backend (templates_asset), on le parse avec le parseur
// TypeScript et on l'injecte via fromJSON. Aucun aller-retour Python.

import { Class_ApplicationData } from '../types/ApplicationData'
import { parseSankeymaticText } from './sankeymaticParser'

/** Parse un texte SankeyMATIC natif et l'applique au diagramme (remplacement). */
export const applySankeymaticText = (text: string, app_data: Class_ApplicationData): void => {
  const diagram = parseSankeymaticText(text)
  app_data.fromJSON(diagram as never)
}

/** Charge un modèle .txt depuis les assets de templates du backend, puis l'applique. */
export const loadSankeymaticTemplate = (file_path: string, app_data: Class_ApplicationData): void => {
  const url = window.location.origin + '/opensankey/menus/templates_asset/' + file_path
  fetch(url)
    .then(response => response.text())
    .then(text => applySankeymaticText(text, app_data))
    .catch((error) => {
      console.error('Error in loadSankeymaticTemplate - ' + error.toString())
    })
}
