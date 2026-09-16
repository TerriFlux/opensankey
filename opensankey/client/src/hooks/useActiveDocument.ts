// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite & Vincent LE DOZE & Vincent CLAVEL for TerriFlux
// ==================================================================================================

import { useModelBinding } from './useModelBinding'
import { ACTIVE_DOCUMENT_TOPIC } from '../types/EventBus'
import type { Class_ApplicationData } from '../types/ApplicationData'

/**
 * os#1385 (lot 2, D3/D5) — LE DOCUMENT QUE CE COMPOSANT DOIT RENDRE : l'ACTIF.
 *
 * Un composant d'espace de travail (inspecteur, filtres, recherche, barre du bas,
 * annuler/enregistrer, bannières de vues) reçoit en props le document PRINCIPAL, parce que c'est
 * ce que l'arbre React lui a passé au montage. Ce n'est pas nécessairement celui que
 * l'utilisateur regarde : depuis le lot 0, une fenêtre de la grande zone peut montrer une autre
 * feuille, et depuis D5 toucher cette fenêtre la rend active. Le composant doit alors parler de
 * CE document-là.
 *
 * LE PATRON, en tête de composant, et une seule ligne :
 *
 *   const app_data = useActiveDocument(props.app_data)
 *
 * puis TOUTE lecture et TOUTE liaison passent par cette variable, avec `[app_data]` en dépendance
 * des `useModelBinding` / `useModelSlot` / `useEffect` qui lient un slot ou s'abonnent à un topic
 * de document — sans quoi le composant se re-rendrait avec le nouveau document tout en restant
 * abonné au bus de l'ancien.
 *
 * Ce que le composant lit d'HÔTE (`panels`, dialogues, injections de menus) arrive par la
 * délégation du lot 1 : il n'y a rien à distinguer, la configuration du document actif rend les
 * membres de l'hôte comme le faisait celle du principal.
 *
 * Retombe sur le document reçu quand l'espace de travail n'a pas d'actif (aucun document
 * enregistré — viewer en cours de montage, test) : un composant ne doit jamais se retrouver sans
 * modèle à lire.
 */
export function useActiveDocument(app_data: Class_ApplicationData): Class_ApplicationData {
  // Abonnement SEUL (pas de slot) : le crochet ne possède aucun emplacement du modèle, il écoute.
  // L'abonnement se fait par la configuration du document reçu, mais `ACTIVE_DOCUMENT_TOPIC` est
  // un topic d'HÔTE : il part et arrive sur le bus de l'espace de travail, donc le composant
  // l'entend quel que soit le document par lequel il s'est abonné — et il n'y a rien à
  // réabonner quand l'actif bascule, d'où l'absence de `deps` ici.
  useModelBinding(undefined, r => app_data.menu_configuration.subscribe(ACTIVE_DOCUMENT_TOPIC, r))
  return app_data.workspace.active ?? app_data
}
