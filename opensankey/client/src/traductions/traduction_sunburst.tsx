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
        back_to: 'Back to {{name}}',
        members_count: '{{count}} members',
        level: 'Level {{index}}',
        nav: {
          dimension: 'Dimension « {{name}} »',
          cut_by: 'Split by {{level}}',
          clear_zoom: 'Remove this zoom (and the deeper ones)',
          pick_zoom: 'Choose the zoomed members at this level (the figure reads their sum)',
          drawing: 'How this dimension is drawn when it divides the chart',
          title: 'Navigation',
          toggle_part: 'Show or hide {{name}}'
        },
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
        back_to: 'Remonter à {{name}}',
        members_count: '{{count}} membres',
        level: 'Niveau {{index}}',
        nav: {
          dimension: 'Dimension « {{name}} »',
          cut_by: 'Découper par {{level}}',
          clear_zoom: 'Annuler ce zoom (et ceux en dessous)',
          pick_zoom: 'Choisir les membres zoomés à ce niveau (la figure lit leur somme)',
          drawing: 'Comment cette dimension se dessine quand elle découpe la couronne',
          title: 'Navigation',
          toggle_part: 'Afficher ou masquer {{name}}'
        },
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
        back_to: 'Volver a {{name}}',
        members_count: '{{count}} miembros',
        level: 'Nivel {{index}}',
        nav: {
          dimension: 'Dimensión « {{name}} »',
          cut_by: 'Dividir por {{level}}',
          clear_zoom: 'Anular este zoom (y los inferiores)',
          pick_zoom: 'Elegir los miembros ampliados en este nivel (la figura lee su suma)',
          drawing: 'Cómo se dibuja esta dimensión cuando divide el gráfico',
          title: 'Navegación',
          toggle_part: 'Mostrar u ocultar {{name}}'
        },
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
        back_to: 'Zurück zu {{name}}',
        members_count: '{{count}} Mitglieder',
        level: 'Ebene {{index}}',
        nav: {
          dimension: 'Dimension „{{name}}“',
          cut_by: 'Aufteilen nach {{level}}',
          clear_zoom: 'Diesen Zoom aufheben (und die darunter)',
          pick_zoom: 'Die gezoomten Mitglieder dieser Ebene wählen (die Grafik liest ihre Summe)',
          drawing: 'Wie diese Dimension gezeichnet wird, wenn sie die Grafik teilt',
          title: 'Navigation',
          toggle_part: '{{name}} ein- oder ausblenden'
        },
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
        back_to: 'Risalire a {{name}}',
        members_count: '{{count}} membri',
        level: 'Livello {{index}}',
        nav: {
          dimension: 'Dimensione « {{name}} »',
          cut_by: 'Suddividere per {{level}}',
          clear_zoom: 'Annullare questo zoom (e quelli sottostanti)',
          pick_zoom: 'Scegliere i membri ingranditi a questo livello (la figura ne legge la somma)',
          drawing: 'Come si disegna questa dimensione quando divide il grafico',
          title: 'Navigazione',
          toggle_part: 'Mostrare o nascondere {{name}}'
        },
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
        back_to: '返回 {{name}}',
        members_count: '{{count}} 个成员',
        level: '第 {{index}} 层',
        nav: {
          dimension: '维度“{{name}}”',
          cut_by: '按 {{level}} 划分',
          clear_zoom: '取消此缩放（及其下级）',
          pick_zoom: '选择此层级的缩放成员（图形读取其总和）',
          drawing: '此维度划分图形时的绘制方式',
          title: '导航',
          toggle_part: '显示或隐藏 {{name}}'
        },
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
        back_to: '{{name}} に戻る',
        members_count: '{{count}} 件のメンバー',
        level: 'レベル {{index}}',
        nav: {
          dimension: 'ディメンション「{{name}}」',
          cut_by: '{{level}} で分割',
          clear_zoom: 'このズームを解除（下位も）',
          pick_zoom: 'このレベルでズームするメンバーを選ぶ（図はその合計を表示）',
          drawing: 'この次元が図を分割するときの描き方',
          title: 'ナビゲーション',
          toggle_part: '{{name}} を表示・非表示'
        },
        group: {
          read: '階層'
        },
      }
    }
  }
}
