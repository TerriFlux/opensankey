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
        opt_dimension: 'First hierarchy',
        opt_chain_axes: 'Chain the other hierarchies',
        opt_value_mode: 'Arc value',
        opt_value_sum: 'Sum of children',
        opt_value_declared: 'Node value',
        opt_max_depth: 'Rings',
        hint_sum: 'Each arc is worth the sum of its children; the gap with the node value is reported.',
        hint_declared: 'Each arc is worth its node value; what the children do not cover becomes an “Unallocated” sector.'
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
        opt_dimension: 'Première hiérarchie',
        opt_chain_axes: 'Enchaîner les autres hiérarchies',
        opt_value_mode: 'Valeur de l’arc',
        opt_value_sum: 'Somme des enfants',
        opt_value_declared: 'Valeur du nœud',
        opt_max_depth: 'Anneaux',
        hint_sum: 'Chaque arc vaut la somme de ses enfants ; l’écart avec la valeur du nœud est signalé.',
        hint_declared: 'Chaque arc vaut la valeur de son nœud ; ce que les enfants ne couvrent pas devient un secteur « Non réparti ».'
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
        opt_dimension: 'Primera jerarquía',
        opt_chain_axes: 'Encadenar las demás jerarquías',
        opt_value_mode: 'Valor del arco',
        opt_value_sum: 'Suma de los hijos',
        opt_value_declared: 'Valor del nodo',
        opt_max_depth: 'Anillos',
        hint_sum: 'Cada arco vale la suma de sus hijos; se indica la diferencia con el valor del nodo.',
        hint_declared: 'Cada arco vale el valor de su nodo; lo que los hijos no cubren se vuelve un sector «Sin asignar».'
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
        opt_dimension: 'Erste Hierarchie',
        opt_chain_axes: 'Weitere Hierarchien verketten',
        opt_value_mode: 'Wert des Bogens',
        opt_value_sum: 'Summe der Kinder',
        opt_value_declared: 'Knotenwert',
        opt_max_depth: 'Ringe',
        hint_sum: 'Jeder Bogen entspricht der Summe seiner Kinder; die Abweichung zum Knotenwert wird gemeldet.',
        hint_declared: 'Jeder Bogen entspricht seinem Knotenwert; was die Kinder nicht abdecken, wird zum Sektor „Nicht zugeordnet“.'
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
        opt_dimension: 'Prima gerarchia',
        opt_chain_axes: 'Concatenare le altre gerarchie',
        opt_value_mode: 'Valore dell’arco',
        opt_value_sum: 'Somma dei figli',
        opt_value_declared: 'Valore del nodo',
        opt_max_depth: 'Anelli',
        hint_sum: 'Ogni arco vale la somma dei suoi figli; lo scarto con il valore del nodo viene segnalato.',
        hint_declared: 'Ogni arco vale il valore del suo nodo; ciò che i figli non coprono diventa un settore «Non assegnato».'
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
        opt_dimension: '首个层级',
        opt_chain_axes: '串联其他层级',
        opt_value_mode: '扇区取值',
        opt_value_sum: '子节点之和',
        opt_value_declared: '节点自身值',
        opt_max_depth: '环数',
        hint_sum: '每个扇区等于其子节点之和；与节点自身值的差异会被标注。',
        hint_declared: '每个扇区等于其节点自身值；子节点未覆盖的部分成为「未分配」扇区。'
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
        opt_dimension: '最初の階層',
        opt_chain_axes: '他の階層を連結する',
        opt_value_mode: '扇形の値',
        opt_value_sum: '子ノードの合計',
        opt_value_declared: 'ノードの値',
        opt_max_depth: 'リング数',
        hint_sum: '各扇形は子ノードの合計です。ノードの値との差は注記されます。',
        hint_declared: '各扇形はノードの値です。子ノードが覆わない分は「未割当」の扇形になります。'
      }
    }
  }
}
