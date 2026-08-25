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

/**
 * Import SankeyMATIC : applique le texte ET ouvre le dialogue de l'éditeur texte,
 * pour que la source reste visible et modifiable. Réservé aux points d'entrée
 * « import » — SankeyTextEditor applique depuis l'éditeur, déjà à l'écran.
 */
export const importSankeymaticText = (text: string, app_data: Class_ApplicationData): void => {
  applySankeymaticText(text, app_data)
  app_data.openSankeymaticEditor()
}

/**
 * Charge un modèle .txt depuis les assets de templates du backend, puis l'applique.
 * Contrairement à l'import, on n'ouvre PAS le Tableur : le dialogue des modèles
 * doit juste afficher le diagramme.
 */
export const loadSankeymaticTemplate = (
  file_path: string,
  app_data: Class_ApplicationData,
  // Avance automatique du diaporama de la galerie : marquée dans l'URL pour que
  // le journal d'usage la compte à part des chargements délibérés
  // (cf. server/usage_events.py et SankeyTemplates.assetUrl).
  from_slideshow = false
): void => {
  const url = window.location.origin + '/opensankey/menus/templates_asset/' + file_path
    + (from_slideshow ? '?origin=slideshow' : '')
  fetch(url)
    .then(response => response.text())
    .then(text => applySankeymaticText(text, app_data))
    .catch((error) => {
      console.error('Error in loadSankeymaticTemplate - ' + error.toString())
    })
}
