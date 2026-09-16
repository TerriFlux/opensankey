export const resources_loading_toasts = {
  //=======================================================
  //EN
  //=======================================================
  en: {
    translation: {
      toast: {
        default: {
          success: {
            title: 'Success',
            desc: 'Thank you for your patience'
          },
          loading: {
            title: 'Processing',
            desc: 'Please wait'
          },
          error: {
            title: 'Processing failed',
            desc: 'Please try again or contact contact@terriflux.fr if the problem persists'
          }
        },
        reset: {
          success: {
            title: 'Drawing area cleaned',
            desc: ''
          },
          loading: {
            title: 'Deleting drawing area',
            desc: ''
          },
        },
        draw: {
          success: {
            title: 'Ready to draw',
            desc: ''
          },
          loading: {
            title: 'Initialisation of drawing area',
            desc: ''
          },
        },
        save_in_cache: {
          success: {
            title: 'Finished',
          },
          loading: {
            title: 'Saving in cache',
          },
          error: {
            title: 'Error while trying to save',
          }
        },
        load_json: {
          success: {
            title: 'Diagram loaded',
          },
          loading: {
            title: 'Loading diagram...',
          },
          error: {
            title: 'Error while loading the diagram',
          }
        },
        save_as_json: {
          success: {
            title: 'Download will start shortly',
          },
          loading: {
            title: 'Preparing JSON file',
          },
          error: {
            title: 'Error while trying prepare file',
          }
        },
        save_as_excel: {
          success: {
            title: 'Download will start shortly',
          },
          loading: {
            title: 'Preparing Excel file',
          },
          error: {
            title: 'Error while trying prepare file',
          }
        },
        save_as_png: {
          success: {
            title: 'Download will start shortly',
          },
          loading: {
            title: 'Preparing PNG file',
          },
          error: {
            title: 'Error while trying prepare file',
          }
        },
        save_as_pdf: {
          success: {
            title: 'Download will start shortly',
          },
          loading: {
            title: 'Preparing PDF file',
          },
          error: {
            title: 'Error while trying prepare file',
          }
        },
        set_view: {
          success: {
            title: 'Ready',
          },
          loading: {
            title: 'Switching view',
          },
          error: {
            title: 'Error while loading the requested view',
          }
        },
        compute_auto_sankey: {
          success: {
            title: 'Nodes positions computed',
          },
          loading: {
            title: 'Computing nodes positions',
          },
        },
        value_edit: {
          collected_kept: {
            title: 'Collected data kept',
            desc: 'You have just corrected a reconciled result: the collected datum of the flow is left untouched. Switch the data layer to \'Collected\' to edit the input datum itself.'
          },
          result_dropped: {
            title: 'Reconciled result dropped',
            desc: 'The collected datum of this flow has changed: its reconciled result no longer follows from it and has been removed. Run the reconciliation again to obtain a new one.'
          }
        },
        clipboard: {
          cross_document: {
            title: 'Paste across documents',
            desc: 'What you copied comes from another document. Pasting from one document into another is not possible yet: copy it again from within this document.'
          }
        }
      },
    }
  },
  //=======================================================
  //FR
  //=======================================================
  fr: {
    translation: {
      toast: {
        default: {
          success: {
            title: 'Terminé',
            desc: 'Chargement terminé'
          },
          loading: {
            title: 'Traitement en cours',
            desc: 'Veuillez patienter'
          },
          error: {
            title: 'Echec lors du traitement',
            desc: 'Veuillez rééssayer ou contactez contact@terriflux.fr si le problème persiste'
          }
        },
        reset: {
          success: {
            title: 'Effacement terminé',
            desc: ''
          },
          loading: {
            title: 'Effacement des données',
            desc: ''
          },
        },
        draw: {
          success: {
            title: 'La zone de dessin est prête',
            desc: ''
          },
          loading: {
            title: 'Initialisation de la zone de dessin',
            desc: ''
          },
        },
        save_in_cache: {
          success: {
            title: 'Terminé',
          },
          loading: {
            title: 'Sauvegarde en cache',
          },
          error: {
            title: 'Echec lors de la sauvegarde',
          }
        },
        load_json: {
          success: {
            title: 'Diagramme chargé',
          },
          loading: {
            title: 'Chargement du diagramme...',
          },
          error: {
            title: 'Erreur lors du chargement du diagramme',
          }
        },
        save_as_json: {
          success: {
            title: 'Le téléchargement va démarrer...',
          },
          loading: {
            title: 'Conversion en JSON',
          },
          error: {
            title: 'Erreur lors de la conversion',
          }
        },
        save_as_excel: {
          success: {
            title: 'Le téléchargement va démarrer...',
          },
          loading: {
            title: 'Conversion en Excel',
          },
          error: {
            title: 'Erreur lors de la conversion',
          }
        },
        save_as_png: {
          success: {
            title: 'Le téléchargement va démarrer...',
          },
          loading: {
            title: 'Conversion en PNG',
          },
          error: {
            title: 'Erreur lors de la conversion',
          }
        },
        save_as_pdf: {
          success: {
            title: 'Le téléchargement va démarrer...',
          },
          loading: {
            title: 'Conversion en PDF',
          },
          error: {
            title: 'Erreur lors de la conversion',
          }
        },
        set_view: {
          success: {
            title: 'Vue prête',
          },
          loading: {
            title: 'Changement de vue',
          },
          error: {
            title: 'Erreur lors de la chargement de la vue demandée',
          }
        },
        compute_auto_sankey: {
          success: {
            title: 'Noeuds positionnés',
          },
          loading: {
            title: 'Recalcul des positions des noeuds',
          },
        },
        value_edit: {
          collected_kept: {
            title: 'Donnée collectée conservée',
            desc: 'Vous venez de corriger un résultat réconcilié : la donnée collectée du flux reste intacte. Basculez la couche de données sur « Collectées » pour modifier la donnée d\'entrée elle-même.'
          },
          result_dropped: {
            title: 'Résultat réconcilié périmé',
            desc: 'La donnée collectée de ce flux a changé : son résultat réconcilié n\'en découle plus et a été retiré. Relancez la réconciliation pour en obtenir un nouveau.'
          }
        },
        clipboard: {
          cross_document: {
            title: 'Coller entre documents',
            desc: 'Ce que vous avez copié vient d\'un autre document. Coller d\'un document à l\'autre n\'est pas encore possible : recopiez-le depuis ce document.'
          }
        }
      },
    }
  },
  //=======================================================
  //ES
  //=======================================================
  es: {
    translation: {
      toast: {
        default: {
          success: {
            title: 'Completado',
            desc: 'Gracias por su paciencia'
          },
          loading: {
            title: 'Procesando',
            desc: 'Por favor espere'
          },
          error: {
            title: 'Error en el procesamiento',
            desc: 'Por favor inténtelo de nuevo o contacte con contact@terriflux.fr si el problema persiste'
          }
        },
        reset: {
          success: {
            title: 'Área de dibujo limpia',
            desc: ''
          },
          loading: {
            title: 'Eliminando el área de dibujo',
            desc: ''
          },
        },
        draw: {
          success: {
            title: 'Listo para dibujar',
            desc: ''
          },
          loading: {
            title: 'Inicialización del área de dibujo',
            desc: ''
          },
        },
        save_in_cache: {
          success: {
            title: 'Terminado',
          },
          loading: {
            title: 'Guardando en caché',
          },
          error: {
            title: 'Error al intentar guardar',
          }
        },
        load_json: {
          success: {
            title: 'Diagrama cargado',
          },
          loading: {
            title: 'Cargando diagrama...',
          },
          error: {
            title: 'Error al cargar el diagrama',
          }
        },
        save_as_json: {
          success: {
            title: 'La descarga comenzará en breve',
          },
          loading: {
            title: 'Preparando archivo JSON',
          },
          error: {
            title: 'Error al preparar el archivo',
          }
        },
        save_as_excel: {
          success: {
            title: 'La descarga comenzará en breve',
          },
          loading: {
            title: 'Preparando archivo Excel',
          },
          error: {
            title: 'Error al preparar el archivo',
          }
        },
        save_as_png: {
          success: {
            title: 'La descarga comenzará en breve',
          },
          loading: {
            title: 'Preparando archivo PNG',
          },
          error: {
            title: 'Error al preparar el archivo',
          }
        },
        save_as_pdf: {
          success: {
            title: 'La descarga comenzará en breve',
          },
          loading: {
            title: 'Preparando archivo PDF',
          },
          error: {
            title: 'Error al preparar el archivo',
          }
        },
        set_view: {
          success: {
            title: 'Listo',
          },
          loading: {
            title: 'Cambiando de vista',
          },
          error: {
            title: 'Error al cargar la vista solicitada',
          }
        },
        compute_auto_sankey: {
          success: {
            title: 'Posiciones de los nodos calculadas',
          },
          loading: {
            title: 'Calculando posiciones de los nodos',
          },
        },
        value_edit: {
          collected_kept: {
            title: 'Dato recopilado conservado',
            desc: 'Acaba de corregir un resultado reconciliado: el dato recopilado del flujo permanece intacto. Cambie la capa de datos a «Recopilados» para modificar el propio dato de entrada.'
          },
          result_dropped: {
            title: 'Resultado reconciliado descartado',
            desc: 'El dato recopilado de este flujo ha cambiado: su resultado reconciliado ya no se deriva de él y se ha retirado. Vuelva a ejecutar la reconciliación para obtener uno nuevo.'
          }
        },
        clipboard: {
          cross_document: {
            title: 'Pegar entre documentos',
            desc: 'Lo que ha copiado procede de otro documento. Pegar de un documento a otro todavía no es posible: cópielo de nuevo desde este documento.'
          }
        }
      },
    }
  },
  //=======================================================
  //DE
  //=======================================================
  de: {
    translation: {
      toast: {
        default: {
          success: {
            title: 'Abgeschlossen',
            desc: 'Vielen Dank für Ihre Geduld'
          },
          loading: {
            title: 'Verarbeitung',
            desc: 'Bitte warten'
          },
          error: {
            title: 'Verarbeitung fehlgeschlagen',
            desc: 'Bitte versuchen Sie es erneut oder kontaktieren Sie contact@terriflux.fr, wenn das Problem weiterhin besteht'
          }
        },
        reset: {
          success: {
            title: 'Zeichenfläche bereinigt',
            desc: ''
          },
          loading: {
            title: 'Zeichenfläche wird gelöscht',
            desc: ''
          },
        },
        draw: {
          success: {
            title: 'Bereit zum Zeichnen',
            desc: ''
          },
          loading: {
            title: 'Initialisierung der Zeichenfläche',
            desc: ''
          },
        },
        save_in_cache: {
          success: {
            title: 'Abgeschlossen',
          },
          loading: {
            title: 'Im Cache speichern',
          },
          error: {
            title: 'Fehler beim Speichern',
          }
        },
        load_json: {
          success: {
            title: 'Diagramm geladen',
          },
          loading: {
            title: 'Diagramm wird geladen...',
          },
          error: {
            title: 'Fehler beim Laden des Diagramms',
          }
        },
        save_as_json: {
          success: {
            title: 'Der Download beginnt in Kürze',
          },
          loading: {
            title: 'JSON-Datei wird vorbereitet',
          },
          error: {
            title: 'Fehler bei der Dateivorbereitung',
          }
        },
        save_as_excel: {
          success: {
            title: 'Der Download beginnt in Kürze',
          },
          loading: {
            title: 'Excel-Datei wird vorbereitet',
          },
          error: {
            title: 'Fehler bei der Dateivorbereitung',
          }
        },
        save_as_png: {
          success: {
            title: 'Der Download beginnt in Kürze',
          },
          loading: {
            title: 'PNG-Datei wird vorbereitet',
          },
          error: {
            title: 'Fehler bei der Dateivorbereitung',
          }
        },
        save_as_pdf: {
          success: {
            title: 'Der Download beginnt in Kürze',
          },
          loading: {
            title: 'PDF-Datei wird vorbereitet',
          },
          error: {
            title: 'Fehler bei der Dateivorbereitung',
          }
        },
        set_view: {
          success: {
            title: 'Bereit',
          },
          loading: {
            title: 'Ansicht wird gewechselt',
          },
          error: {
            title: 'Fehler beim Laden der angeforderten Ansicht',
          }
        },
        compute_auto_sankey: {
          success: {
            title: 'Knotenpositionen berechnet',
          },
          loading: {
            title: 'Knotenpositionen werden berechnet',
          },
        },
        value_edit: {
          collected_kept: {
            title: 'Erfasster Wert bleibt erhalten',
            desc: 'Sie haben soeben ein abgeglichenes Ergebnis korrigiert: der erfasste Wert des Flusses bleibt unangetastet. Wechseln Sie die Datenebene auf „Erfasst“, um den Eingangswert selbst zu bearbeiten.'
          },
          result_dropped: {
            title: 'Abgeglichenes Ergebnis verworfen',
            desc: 'Der erfasste Wert dieses Flusses hat sich geändert: sein abgeglichenes Ergebnis folgt nicht mehr daraus und wurde entfernt. Führen Sie den Abgleich erneut aus, um ein neues zu erhalten.'
          }
        },
        clipboard: {
          cross_document: {
            title: 'Zwischen Dokumenten einfügen',
            desc: 'Das Kopierte stammt aus einem anderen Dokument. Das Einfügen von einem Dokument in ein anderes ist noch nicht möglich: Kopieren Sie es erneut aus diesem Dokument.'
          }
        }
      },
    }
  },
  //=======================================================
  //IT
  //=======================================================
  it: {
    translation: {
      toast: {
        default: {
          success: {
            title: 'Completato',
            desc: 'Grazie per la pazienza'
          },
          loading: {
            title: 'Elaborazione in corso',
            desc: 'Attendere prego'
          },
          error: {
            title: 'Elaborazione fallita',
            desc: 'Riprovare o contattare contact@terriflux.fr se il problema persiste'
          }
        },
        reset: {
          success: {
            title: 'Area di disegno pulita',
            desc: ''
          },
          loading: {
            title: 'Cancellazione dell\'area di disegno',
            desc: ''
          },
        },
        draw: {
          success: {
            title: 'Pronto per disegnare',
            desc: ''
          },
          loading: {
            title: 'Inizializzazione dell\'area di disegno',
            desc: ''
          },
        },
        save_in_cache: {
          success: {
            title: 'Completato',
          },
          loading: {
            title: 'Salvataggio nella cache',
          },
          error: {
            title: 'Errore durante il salvataggio',
          }
        },
        load_json: {
          success: {
            title: 'Diagramma caricato',
          },
          loading: {
            title: 'Caricamento del diagramma...',
          },
          error: {
            title: 'Errore durante il caricamento del diagramma',
          }
        },
        save_as_json: {
          success: {
            title: 'Il download inizierà a breve',
          },
          loading: {
            title: 'Preparazione file JSON',
          },
          error: {
            title: 'Errore durante la preparazione del file',
          }
        },
        save_as_excel: {
          success: {
            title: 'Il download inizierà a breve',
          },
          loading: {
            title: 'Preparazione file Excel',
          },
          error: {
            title: 'Errore durante la preparazione del file',
          }
        },
        save_as_png: {
          success: {
            title: 'Il download inizierà a breve',
          },
          loading: {
            title: 'Preparazione file PNG',
          },
          error: {
            title: 'Errore durante la preparazione del file',
          }
        },
        save_as_pdf: {
          success: {
            title: 'Il download inizierà a breve',
          },
          loading: {
            title: 'Preparazione file PDF',
          },
          error: {
            title: 'Errore durante la preparazione del file',
          }
        },
        set_view: {
          success: {
            title: 'Pronto',
          },
          loading: {
            title: 'Cambio di vista',
          },
          error: {
            title: 'Errore durante il caricamento della vista richiesta',
          }
        },
        compute_auto_sankey: {
          success: {
            title: 'Posizioni dei nodi calcolate',
          },
          loading: {
            title: 'Calcolo delle posizioni dei nodi',
          },
        },
        value_edit: {
          collected_kept: {
            title: 'Dato raccolto conservato',
            desc: 'Hai appena corretto un risultato riconciliato: il dato raccolto del flusso resta intatto. Cambia il livello di dati su «Raccolti» per modificare il dato di ingresso stesso.'
          },
          result_dropped: {
            title: 'Risultato riconciliato scartato',
            desc: 'Il dato raccolto di questo flusso è cambiato: il suo risultato riconciliato non ne deriva più ed è stato rimosso. Rilancia la riconciliazione per ottenerne uno nuovo.'
          }
        },
        clipboard: {
          cross_document: {
            title: 'Incollare tra documenti',
            desc: 'Ciò che avete copiato proviene da un altro documento. Incollare da un documento all\'altro non è ancora possibile: copiatelo di nuovo da questo documento.'
          }
        }
      },
    }
  },
  'zh-CN': {
    translation: {
      toast: {
        default: {
          success: {
            title: '成功',
            desc: '感谢您的耐心等待'
          },
          loading: {
            title: '处理中',
            desc: '请稍候'
          },
          error: {
            title: '处理失败',
            desc: '请重试；若问题持续存在，请联系 contact@terriflux.fr'
          }
        },
        reset: {
          success: {
            title: '绘图区已清空',
            desc: ''
          },
          loading: {
            title: '正在清除绘图区',
            desc: ''
          },
        },
        draw: {
          success: {
            title: '可以开始绘制',
            desc: ''
          },
          loading: {
            title: '正在初始化绘图区',
            desc: ''
          },
        },
        save_in_cache: {
          success: {
            title: '已完成',
          },
          loading: {
            title: '正在保存到缓存',
          },
          error: {
            title: '保存时出错',
          }
        },
        load_json: {
          success: {
            title: '图表已加载',
          },
          loading: {
            title: '正在加载图表……',
          },
          error: {
            title: '加载图表时出错',
          }
        },
        save_as_json: {
          success: {
            title: '下载即将开始',
          },
          loading: {
            title: '正在准备 JSON 文件',
          },
          error: {
            title: '准备文件时出错',
          }
        },
        save_as_excel: {
          success: {
            title: '下载即将开始',
          },
          loading: {
            title: '正在准备 Excel 文件',
          },
          error: {
            title: '准备文件时出错',
          }
        },
        save_as_png: {
          success: {
            title: '下载即将开始',
          },
          loading: {
            title: '正在准备 PNG 文件',
          },
          error: {
            title: '准备文件时出错',
          }
        },
        save_as_pdf: {
          success: {
            title: '下载即将开始',
          },
          loading: {
            title: '正在准备 PDF 文件',
          },
          error: {
            title: '准备文件时出错',
          }
        },
        set_view: {
          success: {
            title: '就绪',
          },
          loading: {
            title: '正在切换视图',
          },
          error: {
            title: '加载所请求的视图时出错',
          }
        },
        compute_auto_sankey: {
          success: {
            title: '节点位置已计算',
          },
          loading: {
            title: '正在计算节点位置',
          },
        },
        value_edit: {
          collected_kept: {
            title: '已保留采集数据',
            desc: '您刚刚修正的是协调后的结果：该流量的采集数据保持不变。若要修改输入数据本身，请将数据层切换为“采集”。'
          },
          result_dropped: {
            title: '协调结果已作废',
            desc: '该流量的采集数据已变更：其协调结果不再由其推导，已被移除。请重新运行协调以获得新结果。'
          }
        },
        clipboard: {
          cross_document: {
            title: '跨文档粘贴',
            desc: '您复制的内容来自另一个文档。目前还无法在两个文档之间粘贴：请在当前文档中重新复制。'
          }
        }
      },
    }
  },
  ja: {
    translation: {
      toast: {
        default: {
          success: {
            title: '成功',
            desc: 'お待ちいただきありがとうございました'
          },
          loading: {
            title: '処理中',
            desc: 'お待ちください'
          },
          error: {
            title: '処理に失敗しました',
            desc: 'もう一度お試しください。解消しない場合は contact@terriflux.fr までご連絡ください'
          }
        },
        reset: {
          success: {
            title: '描画エリアを空にしました',
            desc: ''
          },
          loading: {
            title: '描画エリアを消去中',
            desc: ''
          },
        },
        draw: {
          success: {
            title: '描画の準備ができました',
            desc: ''
          },
          loading: {
            title: '描画エリアを初期化中',
            desc: ''
          },
        },
        save_in_cache: {
          success: {
            title: '完了しました',
          },
          loading: {
            title: 'キャッシュに保存中',
          },
          error: {
            title: '保存中にエラーが発生しました',
          }
        },
        load_json: {
          success: {
            title: '図を読み込みました',
          },
          loading: {
            title: '図を読み込み中…',
          },
          error: {
            title: '図の読み込み中にエラーが発生しました',
          }
        },
        save_as_json: {
          success: {
            title: 'まもなくダウンロードが始まります',
          },
          loading: {
            title: 'JSON ファイルを準備中',
          },
          error: {
            title: 'ファイルの準備中にエラーが発生しました',
          }
        },
        save_as_excel: {
          success: {
            title: 'まもなくダウンロードが始まります',
          },
          loading: {
            title: 'Excel ファイルを準備中',
          },
          error: {
            title: 'ファイルの準備中にエラーが発生しました',
          }
        },
        save_as_png: {
          success: {
            title: 'まもなくダウンロードが始まります',
          },
          loading: {
            title: 'PNG ファイルを準備中',
          },
          error: {
            title: 'ファイルの準備中にエラーが発生しました',
          }
        },
        save_as_pdf: {
          success: {
            title: 'まもなくダウンロードが始まります',
          },
          loading: {
            title: 'PDF ファイルを準備中',
          },
          error: {
            title: 'ファイルの準備中にエラーが発生しました',
          }
        },
        set_view: {
          success: {
            title: '準備完了',
          },
          loading: {
            title: 'ビューを切り替え中',
          },
          error: {
            title: '指定されたビューの読み込み中にエラーが発生しました',
          }
        },
        compute_auto_sankey: {
          success: {
            title: 'ノードの位置を計算しました',
          },
          loading: {
            title: 'ノードの位置を計算中',
          },
        },
        value_edit: {
          collected_kept: {
            title: '収集データを保持しました',
            desc: '調整済みの結果を修正しました。このフローの収集データはそのまま保たれます。入力データ自体を編集するには、データ層を「収集」に切り替えてください。'
          },
          result_dropped: {
            title: '調整結果を破棄しました',
            desc: 'このフローの収集データが変わったため、調整結果はそれに由来しなくなり削除されました。新しい結果を得るには調整を再実行してください。'
          }
        },
        clipboard: {
          cross_document: {
            title: '文書間の貼り付け',
            desc: 'コピーした内容は別の文書のものです。文書間での貼り付けはまだできません。この文書内でコピーし直してください。'
          }
        }
      },
    }
  }
}
