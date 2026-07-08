// ===========================================================================
// SankeyPlusViews — BARREL
// ---------------------------------------------------------------------------
// Ce fichier a été découpé (#245) : chaque composant / modal de vue vit désormais
// dans son propre fichier sous `./views/`. Ce module ne fait plus que ré-exporter
// les symboles publics pour préserver tous les imports externes existants
// (`from '.../components/SankeyPlusViews'`).
// ===========================================================================

// Helpers partagés (chargement Excel, rendu d'onglet, logo, bornes draggable…)
export {
  loadExcelFileAsSankeyJSON,
  renderApplyLayoutExtraTabOSP,
  logo_view,
} from './views/viewsShared'

// Composants et modales de vue
export { BannerViewsOSP } from './views/BannerViewsOSP'
export { BannerViewNavOSP } from './views/BannerViewNavOSP'
export { SelecteurView } from './views/SelecteurView'
export { ViewsConfig } from './views/ViewsConfig'
export { ModalViewNotSavedOSP } from './views/ModalViewNotSavedOSP'
export { ModalTransparentViewAttrOSP } from './views/ModalTransparentViewAttrOSP'
export { ModalCreateUnitaryViewOSP } from './views/ModalCreateUnitaryViewOSP'
