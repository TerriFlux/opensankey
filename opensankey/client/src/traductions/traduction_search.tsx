// OS#1273 (lot E1) — Libellés de la RECHERCHE d'élément dans le diagramme.
// Fichier dédié (comme traduction_guided_tour / traduction_inspector), fusionné
// par deep_assign_resources dans traduction.tsx.
//
// `search.*` : barre de recherche (Ctrl+F) filtrant nœuds, flux et zones de
// texte par nom/label, avec navigation entre résultats et recadrage caméra.

export const resources_search = {
  //=======================================================
  //EN
  //=======================================================
  en: {
    translation: {
      search: {
        title: 'Search an element',
        tooltip: 'Search a node, a flow or a text area (Ctrl+F)',
        placeholder: 'Search a node, a flow, an area…',
        no_result: 'No match',
        counter: '{{current}} / {{total}}',
        prev: 'Previous result',
        next: 'Next result',
        close: 'Close the search',
        only_visible: 'Visible elements only',
        type: {
          node: 'Node',
          link: 'Flow',
          container: 'Area'
        }
      }
    }
  },
  //=======================================================
  //FR
  //=======================================================
  fr: {
    translation: {
      search: {
        title: 'Rechercher un élément',
        tooltip: 'Rechercher un nœud, un flux ou une zone de texte (Ctrl+F)',
        placeholder: 'Rechercher un nœud, un flux, une zone…',
        no_result: 'Aucun résultat',
        counter: '{{current}} / {{total}}',
        prev: 'Résultat précédent',
        next: 'Résultat suivant',
        close: 'Fermer la recherche',
        only_visible: 'Éléments visibles uniquement',
        type: {
          node: 'Nœud',
          link: 'Flux',
          container: 'Zone'
        }
      }
    }
  },
  //=======================================================
  //ES
  //=======================================================
  es: {
    translation: {
      search: {
        title: 'Buscar un elemento',
        tooltip: 'Buscar un nodo, un flujo o una zona de texto (Ctrl+F)',
        placeholder: 'Buscar un nodo, un flujo, una zona…',
        no_result: 'Sin resultados',
        counter: '{{current}} / {{total}}',
        prev: 'Resultado anterior',
        next: 'Resultado siguiente',
        close: 'Cerrar la búsqueda',
        only_visible: 'Solo elementos visibles',
        type: {
          node: 'Nodo',
          link: 'Flujo',
          container: 'Zona'
        }
      }
    }
  },
  //=======================================================
  //DE
  //=======================================================
  de: {
    translation: {
      search: {
        title: 'Element suchen',
        tooltip: 'Einen Knoten, einen Fluss oder einen Textbereich suchen (Strg+F)',
        placeholder: 'Knoten, Fluss, Bereich suchen…',
        no_result: 'Kein Treffer',
        counter: '{{current}} / {{total}}',
        prev: 'Vorheriges Ergebnis',
        next: 'Nächstes Ergebnis',
        close: 'Suche schließen',
        only_visible: 'Nur sichtbare Elemente',
        type: {
          node: 'Knoten',
          link: 'Fluss',
          container: 'Bereich'
        }
      }
    }
  },
  //=======================================================
  //IT
  //=======================================================
  it: {
    translation: {
      search: {
        title: 'Cerca un elemento',
        tooltip: 'Cercare un nodo, un flusso o un\'area di testo (Ctrl+F)',
        placeholder: 'Cercare un nodo, un flusso, un\'area…',
        no_result: 'Nessun risultato',
        counter: '{{current}} / {{total}}',
        prev: 'Risultato precedente',
        next: 'Risultato successivo',
        close: 'Chiudere la ricerca',
        only_visible: 'Solo elementi visibili',
        type: {
          node: 'Nodo',
          link: 'Flusso',
          container: 'Area'
        }
      }
    }
  },
  'zh-CN': {
    translation: {
      search: {
        title: '搜索元素',
        tooltip: '搜索节点、流量或文本区（Ctrl+F）',
        placeholder: '搜索节点、流量或区域……',
        no_result: '无匹配',
        counter: '{{current}} / {{total}}',
        prev: '上一个结果',
        next: '下一个结果',
        close: '关闭搜索',
        only_visible: '仅可见元素',
        type: {
          node: '节点',
          link: '流量',
          container: '区域'
        }
      }
    }
  }
}
