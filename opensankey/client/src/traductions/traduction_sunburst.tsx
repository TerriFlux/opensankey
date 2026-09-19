// OS#1363 — Libellés du SUNBURST, représentation hiérarchique du diagramme. Fichier
// dédié (comme traduction_guided_tour), fusionné par deep_assign_resources dans
// traduction.tsx : le sunburst reste ainsi un module autonome, traductions comprises.

export const resources_sunburst = {
  //=======================================================
  //EN
  //=======================================================
  en: {
    translation: {
      sunburst: {
        title: 'Sunburst',
        empty: 'This diagram declares no node hierarchy.',
        others: 'Others',
        unallocated: 'Unallocated',
        scope: '{{count}} roots',
        roots_sum_hint: 'Centre = sum of independent roots',
        mismatch: '{{count}} parents do not match the sum of their children',
        truncated: 'Depth truncated',
        back: 'back',
        level: 'Level {{index}}',
        group: {
          read: 'Hierarchy'
        },
      }
    }
  },
  //=======================================================
  //FR
  //=======================================================
  fr: {
    translation: {
      sunburst: {
        title: 'Sunburst',
        empty: 'Ce diagramme ne déclare aucune hiérarchie de nœuds.',
        others: 'Autres',
        unallocated: 'Non réparti',
        scope: '{{count}} racines',
        roots_sum_hint: 'Centre = somme de racines indépendantes',
        mismatch: '{{count}} parents ne bouclent pas avec leurs enfants',
        truncated: 'Profondeur tronquée',
        back: 'remonter',
        level: 'Niveau {{index}}',
        group: {
          read: 'Hiérarchie'
        },
      }
    }
  },
  //=======================================================
  //ES
  //=======================================================
  es: {
    translation: {
      sunburst: {
        title: 'Sunburst',
        empty: 'Este diagrama no declara ninguna jerarquía de nodos.',
        others: 'Otros',
        unallocated: 'Sin asignar',
        scope: '{{count}} raíces',
        roots_sum_hint: 'Centro = suma de raíces independientes',
        mismatch: '{{count}} padres no cuadran con sus hijos',
        truncated: 'Profundidad truncada',
        back: 'volver',
        level: 'Nivel {{index}}',
        group: {
          read: 'Jerarquía'
        },
      }
    }
  },
  //=======================================================
  //DE
  //=======================================================
  de: {
    translation: {
      sunburst: {
        title: 'Sunburst',
        empty: 'Dieses Diagramm deklariert keine Knotenhierarchie.',
        others: 'Andere',
        unallocated: 'Nicht zugeordnet',
        scope: '{{count}} Wurzeln',
        roots_sum_hint: 'Zentrum = Summe unabhängiger Wurzeln',
        mismatch: '{{count}} Elternknoten stimmen nicht mit ihren Kindern überein',
        truncated: 'Tiefe abgeschnitten',
        back: 'zurück',
        level: 'Ebene {{index}}',
        group: {
          read: 'Hierarchie'
        },
      }
    }
  },
  //=======================================================
  //IT
  //=======================================================
  it: {
    translation: {
      sunburst: {
        title: 'Sunburst',
        empty: 'Questo diagramma non dichiara alcuna gerarchia di nodi.',
        others: 'Altri',
        unallocated: 'Non assegnato',
        scope: '{{count}} radici',
        roots_sum_hint: 'Centro = somma di radici indipendenti',
        mismatch: '{{count}} genitori non quadrano con i loro figli',
        truncated: 'Profondità troncata',
        back: 'risalire',
        level: 'Livello {{index}}',
        group: {
          read: 'Gerarchia'
        },
      }
    }
  },
  //=======================================================
  //ZH-CN
  //=======================================================
  'zh-CN': {
    translation: {
      sunburst: {
        title: '旭日图',
        empty: '该图未声明任何节点层级。',
        others: '其他',
        unallocated: '未分配',
        scope: '{{count}} 个根节点',
        roots_sum_hint: '中心 = 各独立根节点之和',
        mismatch: '{{count}} 个父节点与其子节点不平衡',
        truncated: '层级已截断',
        back: '返回',
        level: '第 {{index}} 层',
        group: {
          read: '层级'
        },
      }
    }
  },
  //=======================================================
  //JA
  //=======================================================
  ja: {
    translation: {
      sunburst: {
        title: 'サンバースト',
        empty: 'この図にはノード階層が定義されていません。',
        others: 'その他',
        unallocated: '未割当',
        scope: 'ルート {{count}} 件',
        roots_sum_hint: '中心 = 独立したルートの合計',
        mismatch: '{{count}} 件の親ノードが子ノードと一致しません',
        truncated: '深さを打ち切りました',
        back: '戻る',
        level: 'レベル {{index}}',
        group: {
          read: '階層'
        },
      }
    }
  }
}
