import { MenuCondition } from './SankeyMenuContext'
import { default_main_sankey_id } from '../../types/Utils'

export const translations = {
  ProcessDialog: {
    writing_option: {
      en: 'Options for writing the Excel file',
      fr: 'Options d\'écriture du fichier excel',
      es: 'Opciones de escritura del archivo Excel',
      de: 'Optionen zum Schreiben der Excel-Datei',
      it: 'Opzioni di scrittura del file Excel',
      'zh-CN': '写入 Excel 文件的选项',
      ja: 'Excel ファイル書き出しのオプション'
    },
    title: {
      en: 'Reconciliation',
      fr: 'Réconciliation',
      es: 'Reconciliación',
      de: 'Abstimmung',
      it: 'Riconciliazione',
      'zh-CN': '数据调和',
      ja: 'データ調和'
    },
    success_status_optim: {
      en: 'Download results',
      fr: 'Télécharger les résultats',
      es: 'Descargar resultados',
      de: 'Ergebnisse herunterladen',
      it: 'Scarica risultati',
      'zh-CN': '下载结果',
      ja: '結果をダウンロード'
    },
    success_status_check_excel: {
      en: 'Verification finished',
      fr: 'Vérification terminée',
      es: 'Verificación finalizada',
      de: 'Überprüfung abgeschlossen',
      it: 'Verifica completata',
      'zh-CN': '校验完成',
      ja: '検証が完了しました'
    },
    success_status_create_ter: {
      en: 'Creation finished',
      fr: 'Création Terminée',
      es: 'Creación finalizada',
      de: 'Erstellung abgeschlossen',
      it: 'Creazione completata',
      'zh-CN': '创建完成',
      ja: '作成が完了しました'
    },
    fail_status_optim: {
      en: 'Fail to reconcile',
      fr: 'Echec de la réconciliation',
      es: 'Error en la reconciliación',
      de: 'Abstimmung fehlgeschlagen',
      it: 'Riconciliazione fallita',
      'zh-CN': '调和失败',
      ja: '調和に失敗しました'
    },
    fail_status_check_excel: {
      en: 'Fail to verify',
      fr: 'Echec de la vérification',
      es: 'Error en la verificación',
      de: 'Überprüfung fehlgeschlagen',
      it: 'Verifica fallita',
      'zh-CN': '校验失败',
      ja: '検証に失敗しました'
    },
    fail_status_create_ter: {
      en: 'Fail to create the TER',
      fr: 'Echec de la création',
      es: 'Error en la creación del TER',
      de: 'TER-Erstellung fehlgeschlagen',
      it: 'Creazione del TER fallita',
      'zh-CN': '创建 TER 失败',
      ja: 'TER の作成に失敗しました'
    },
    launch: {
      en: 'Launch',
      fr: 'Lancer',
      es: 'Iniciar',
      de: 'Starten',
      it: 'Avvia',
      'zh-CN': '启动',
      ja: '実行'
    },
    // SA#249 — messages par CODE d'erreur remonté par MFAProblem (mfa_problem_error.py). La
    // distinction qui compte pour l'utilisateur : « votre modèle est en cause, voici quoi
    // corriger » vs « c'est de notre côté, signalez-le nous ». Un code inconnu (version de
    // MFAProblem plus récente que le front) retombe sur le message générique d'échec.
    error_INFEASIBLE: {
      en: 'The model has no solution: its constraints contradict each other. Check the measured values and the constraints (ratios, min/max bounds) of the flows involved.',
      fr: 'Le modèle n\'a pas de solution : ses contraintes se contredisent. Vérifiez les valeurs mesurées et les contraintes (ratios, bornes min/max) des flux concernés.',
      es: 'El modelo no tiene solución: sus restricciones se contradicen. Revise los valores medidos y las restricciones (ratios, límites mín/máx) de los flujos implicados.',
      de: 'Das Modell hat keine Lösung: Seine Nebenbedingungen widersprechen sich. Prüfen Sie die Messwerte und die Nebenbedingungen (Verhältnisse, Min/Max-Grenzen) der betroffenen Flüsse.',
      it: 'Il modello non ha soluzione: i suoi vincoli si contraddicono. Verificate i valori misurati e i vincoli (rapporti, limiti min/max) dei flussi coinvolti.',
      'zh-CN': '模型无解：其约束相互矛盾。请检查相关流量的实测值与约束（比例、最小/最大界限）。',
      ja: 'モデルに解がありません：制約が互いに矛盾しています。対象となるフローの実測値と制約（比率、最小／最大の範囲）を確認してください。'
    },
    error_UNBOUNDED: {
      en: 'The model is under-constrained: the solution is unbounded. Add measured values or bounds to the free flows.',
      fr: 'Le modèle est sous-contraint : la solution est non bornée. Ajoutez des valeurs mesurées ou des bornes sur les flux libres.',
      es: 'El modelo está poco restringido: la solución no está acotada. Añada valores medidos o límites a los flujos libres.',
      de: 'Das Modell ist unterbestimmt: Die Lösung ist unbeschränkt. Fügen Sie Messwerte oder Grenzen für die freien Flüsse hinzu.',
      it: 'Il modello è sotto-vincolato: la soluzione non è limitata. Aggiungete valori misurati o limiti sui flussi liberi.',
      'zh-CN': '模型约束不足：解无界。请为自由流量添加实测值或界限。',
      ja: 'モデルの制約が不足しています：解が発散します。自由なフローに実測値または範囲を追加してください。'
    },
    error_BAD_CONSTRAINT: {
      en: 'The constraints could not be built from the model. Check the constraint sheets (ratios, min/max) and the node/flow names they reference.',
      fr: 'Les contraintes n\'ont pas pu être construites à partir du modèle. Vérifiez les feuilles de contraintes (ratios, min/max) et les noms de nœuds/flux qu\'elles référencent.',
      es: 'No se pudieron construir las restricciones a partir del modelo. Revise las hojas de restricciones (ratios, mín/máx) y los nombres de nodos/flujos que referencian.',
      de: 'Die Nebenbedingungen konnten nicht aus dem Modell erstellt werden. Prüfen Sie die Bedingungsblätter (Verhältnisse, Min/Max) und die dort referenzierten Knoten-/Flussnamen.',
      it: 'Non è stato possibile costruire i vincoli dal modello. Verificate i fogli dei vincoli (rapporti, min/max) e i nomi di nodi/flussi a cui fanno riferimento.',
      'zh-CN': '无法根据模型构建约束。请检查约束工作表（比例、最小/最大）以及其中引用的节点/流量名称。',
      ja: 'モデルから制約を構築できませんでした。制約シート（比率、最小／最大）と、そこで参照されているノード名／フロー名を確認してください。'
    },
    error_BAD_DATA: {
      en: 'The model data could not be loaded. Check the input file (or diagram) for missing or malformed values.',
      fr: 'Les données du modèle n\'ont pas pu être chargées. Vérifiez le fichier d\'entrée (ou le diagramme) : valeurs manquantes ou mal formées.',
      es: 'No se pudieron cargar los datos del modelo. Revise el archivo de entrada (o el diagrama): valores faltantes o mal formados.',
      de: 'Die Modelldaten konnten nicht geladen werden. Prüfen Sie die Eingabedatei (oder das Diagramm) auf fehlende oder fehlerhafte Werte.',
      it: 'Non è stato possibile caricare i dati del modello. Verificate il file di input (o il diagramma): valori mancanti o mal formati.',
      'zh-CN': '无法加载模型数据。请检查输入文件（或图表）中是否存在缺失或格式错误的数值。',
      ja: 'モデルのデータを読み込めませんでした。入力ファイル（または図）に欠損値や不正な値がないか確認してください。'
    },
    error_INCONSISTENT_STOCK_GRID: {
      en: 'A stock node declares a stock for only some of the data tag combinations. Make every stock node cover all combinations, or re-import the source file rather than an already-reconciled one.',
      fr: 'Un nœud de stock ne déclare un stock que pour une partie des combinaisons d\'étiquettes de données. Faites couvrir toutes les combinaisons à chaque nœud de stock, ou réimportez le fichier source plutôt qu\'un fichier déjà réconcilié.',
      es: 'Un nodo de stock declara stock solo para algunas combinaciones de etiquetas de datos. Haga que cada nodo de stock cubra todas las combinaciones, o reimporte el archivo fuente en lugar de uno ya reconciliado.',
      de: 'Ein Bestandsknoten deklariert einen Bestand nur für einen Teil der Daten-Tag-Kombinationen. Lassen Sie jeden Bestandsknoten alle Kombinationen abdecken, oder importieren Sie die Quelldatei erneut statt einer bereits abgeglichenen.',
      it: 'Un nodo di stock dichiara uno stock solo per alcune combinazioni di etichette dati. Fate coprire tutte le combinazioni a ogni nodo di stock, oppure reimportate il file sorgente invece di uno già riconciliato.',
      'zh-CN': '某个存量节点仅为部分数据标签组合声明了存量。请让每个存量节点覆盖全部组合，或重新导入源文件，而不是已调和过的文件。',
      ja: 'あるストックノードが、一部のデータタグの組み合わせにしかストックを宣言していません。すべてのストックノードがすべての組み合わせを網羅するようにするか、調和済みではない元のファイルを取り込み直してください。'
    },
    error_SINGULAR: {
      en: 'The system of equations is singular or ill-conditioned (often redundant or degenerate constraints). Try removing duplicate constraints; if it persists, report it to us.',
      fr: 'Le système d\'équations est singulier ou mal conditionné (souvent des contraintes redondantes ou dégénérées). Essayez de retirer les contraintes en double ; si cela persiste, signalez-le nous.',
      es: 'El sistema de ecuaciones es singular o está mal condicionado (a menudo restricciones redundantes o degeneradas). Intente eliminar las restricciones duplicadas; si persiste, comuníquenoslo.',
      de: 'Das Gleichungssystem ist singulär oder schlecht konditioniert (häufig redundante oder entartete Nebenbedingungen). Entfernen Sie doppelte Bedingungen; falls es bestehen bleibt, melden Sie es uns.',
      it: 'Il sistema di equazioni è singolare o mal condizionato (spesso vincoli ridondanti o degeneri). Provate a rimuovere i vincoli duplicati; se persiste, segnalatecelo.',
      'zh-CN': '方程组奇异或病态（通常是约束冗余或退化）。请尝试删除重复的约束；若问题依旧，请反馈给我们。',
      ja: '連立方程式が特異、または悪条件です（多くは制約の冗長や退化が原因です）。重複した制約を削除してみてください。それでも解消しない場合はご連絡ください。'
    },
    error_TIMEOUT: {
      en: 'The solver ran out of its computation budget. Try simplifying the model, or reduce the number of Monte-Carlo draws.',
      fr: 'Le solveur a épuisé son budget de calcul. Essayez de simplifier le modèle, ou réduisez le nombre de tirages Monte-Carlo.',
      es: 'El solucionador agotó su presupuesto de cálculo. Intente simplificar el modelo o reduzca el número de sorteos de Monte-Carlo.',
      de: 'Der Solver hat sein Rechenbudget erschöpft. Vereinfachen Sie das Modell oder verringern Sie die Anzahl der Monte-Carlo-Ziehungen.',
      it: 'Il solutore ha esaurito il suo budget di calcolo. Provate a semplificare il modello o riducete il numero di estrazioni Monte-Carlo.',
      'zh-CN': '求解器耗尽了计算预算。请尝试简化模型，或减少蒙特卡洛抽样次数。',
      ja: 'ソルバーが計算の上限に達しました。モデルを簡略化するか、モンテカルロの試行回数を減らしてください。'
    },
    error_SOLVER_ERROR: {
      en: 'The solver failed for a reason we could not identify. This is likely on our side: please send us the log (support@open-sankey.fr).',
      fr: 'Le solveur a échoué pour une raison que nous n\'avons pas su identifier. C\'est probablement de notre côté : envoyez-nous le journal (support@open-sankey.fr).',
      es: 'El solucionador falló por un motivo que no pudimos identificar. Probablemente sea de nuestro lado: envíenos el registro (support@open-sankey.fr).',
      de: 'Der Solver ist aus einem Grund gescheitert, den wir nicht ermitteln konnten. Das liegt wahrscheinlich an uns: Senden Sie uns bitte das Protokoll (support@open-sankey.fr).',
      it: 'Il solutore è fallito per un motivo che non siamo riusciti a identificare. Probabilmente è dalla nostra parte: inviateci il registro (support@open-sankey.fr).',
      'zh-CN': '求解器因无法识别的原因失败。这很可能是我们这边的问题：请将日志发送给我们（support@open-sankey.fr）。',
      ja: '原因を特定できない理由でソルバーが失敗しました。こちら側の問題である可能性が高いため、ログをお送りください（support@open-sankey.fr）。'
    },
    error_INTERNAL: {
      en: 'An unexpected error occurred. This is on our side: please send us the log (support@open-sankey.fr).',
      fr: 'Une erreur inattendue s\'est produite. C\'est de notre côté : envoyez-nous le journal (support@open-sankey.fr).',
      es: 'Se produjo un error inesperado. Es de nuestro lado: envíenos el registro (support@open-sankey.fr).',
      de: 'Ein unerwarteter Fehler ist aufgetreten. Das liegt an uns: Senden Sie uns bitte das Protokoll (support@open-sankey.fr).',
      it: 'Si è verificato un errore imprevisto. È dalla nostra parte: inviateci il registro (support@open-sankey.fr).',
      'zh-CN': '发生了意外错误。这是我们这边的问题：请将日志发送给我们（support@open-sankey.fr）。',
      ja: '予期しないエラーが発生しました。こちら側の問題です。ログをお送りください（support@open-sankey.fr）。'
    },
    with_reconciled_label: {
      en: 'Reconcile',
      fr: 'Réconcilier',
      es: 'Reconciliar',
      de: 'Abgleichen',
      it: 'Riconciliare',
      'zh-CN': '调和',
      ja: '調和'
    },
    with_reconciled_tooltip: {
      en: 'Run the standard reconciliation pass. Measured values may be adjusted to satisfy all mass balances.',
      fr: 'Lance la passe de réconciliation standard. Les valeurs mesurées peuvent être ajustées pour satisfaire tous les bilans matière.',
      es: 'Ejecuta la pasada de reconciliación estándar. Los valores medidos pueden ajustarse para satisfacer todos los balances de masa.',
      de: 'Führt den Standardabgleich aus. Messwerte können angepasst werden, damit alle Massenbilanzen erfüllt sind.',
      it: 'Esegue la riconciliazione standard. I valori misurati possono essere modificati per soddisfare tutti i bilanci di massa.',
      'zh-CN': '运行标准调和流程。实测值可能会被调整以满足所有质量平衡。',
      ja: '標準の調和処理を実行します。すべての物質収支を満たすため、実測値が調整されることがあります。'
    },
    with_completed_label: {
      en: 'Complete (no-redundancy)',
      fr: 'Compléter (sans redondance)',
      es: 'Completar (sin redundancia)',
      de: 'Vervollständigen (ohne Redundanz)',
      it: 'Completare (senza ridondanza)',
      'zh-CN': '补全（无冗余）',
      ja: '補完（冗長性なし）'
    },
    with_completed_tooltip: {
      en: 'Add a "Completed value" column to the analysis sheet: redundant balance constraints are dropped, measured values are preserved as-is, and only unknown flows are filled in.',
      fr: 'Ajoute une colonne « Valeur complétée » à la feuille d\'analyse : les bilans redondants sont retirés, les valeurs mesurées sont conservées telles quelles et seuls les flux inconnus sont complétés.',
      es: 'Añade una columna "Valor completado" a la hoja de análisis: se eliminan las restricciones redundantes, los valores medidos se conservan tal cual y solo se completan los flujos desconocidos.',
      de: 'Fügt der Analyseblatt eine Spalte „Vervollständigter Wert" hinzu: redundante Bilanzgleichungen werden entfernt, Messwerte bleiben unverändert und nur unbekannte Flüsse werden ergänzt.',
      it: 'Aggiunge una colonna « Valore completato » al foglio di analisi: i vincoli di bilancio ridondanti vengono rimossi, i valori misurati sono mantenuti invariati e vengono completati solo i flussi sconosciuti.',
      'zh-CN': '在分析工作表中添加“补全值”列：剔除冗余的平衡约束，实测值保持原样，仅补算未知流量。',
      ja: '分析シートに「補完値」の列を追加します：冗長な収支制約は除外され、実測値はそのまま保持され、未知のフローのみが補完されます。'
    },
    processing: {
      en: 'Processing...',
      fr: 'En traitement...',
      es: 'Procesando...',
      de: 'Verarbeitung...',
      it: 'Elaborazione...',
      'zh-CN': '处理中……',
      ja: '処理中…'
    },
    open_file: {
      en: 'Open the reconcilied file',
      fr: 'Ouvrir fichier réconcilié',
      es: 'Abrir el archivo reconciliado',
      de: 'Abgestimmte Datei öffnen',
      it: 'Apri il file riconciliato',
      'zh-CN': '打开已调和的文件',
      ja: '調和済みファイルを開く'
    },
    reset: {
      en: 'Reset',
      fr: 'Réinitialiser',
      es: 'Restablecer',
      de: 'Zurücksetzen',
      it: 'Reimposta',
      'zh-CN': '重置',
      ja: 'リセット'
    },
    success: {
      en: 'Success',
      fr: 'Succès',
      es: 'Éxito',
      de: 'Erfolg',
      it: 'Successo',
      'zh-CN': '成功',
      ja: '成功'
    },
    fail: {
      en: 'Failed',
      fr: 'Echec',
      es: 'Error',
      de: 'Fehlgeschlagen',
      it: 'Fallito',
      'zh-CN': '失败',
      ja: '失敗'
    },
    infos: {
      en: 'Infos',
      fr: 'Infos',
      es: 'Información',
      de: 'Infos',
      it: 'Info',
      'zh-CN': '信息',
      ja: '情報'
    },
    err: {
      en: 'Warnings',
      fr: 'Avertissements',
      es: 'Advertencias',
      de: 'Warnungen',
      it: 'Avvisi',
      'zh-CN': '警告',
      ja: '警告'
    },
    debug: {
      en: 'Debug',
      fr: 'Debug',
      es: 'Depuración',
      de: 'Debug',
      it: 'Debug',
      'zh-CN': '调试',
      ja: 'デバッグ'
    },
    input_parameters: {
      en: 'Input',
      fr: 'Entrée',
      es: 'Entrada',
      de: 'Eingabe',
      it: 'Ingresso',
      'zh-CN': '输入',
      ja: '入力'
    },
    output_parameters: {
      en: 'Output',
      fr: 'Sortie',
      es: 'Salida',
      de: 'Ausgabe',
      it: 'Uscita',
      'zh-CN': '输出',
      ja: '出力'
    },
    input_format: {
      en: 'Format',
      fr: 'Format',
      es: 'Formato',
      de: 'Format',
      it: 'Formato',
      'zh-CN': '格式',
      ja: '形式'
    },
    output_format: {
      en: 'Format',
      fr: 'Format',
      es: 'Formato',
      de: 'Format',
      it: 'Formato',
      'zh-CN': '格式',
      ja: '形式'
    },
    browse: {
      en: 'Browse...',
      fr: 'Parcourir...',
      es: 'Examinar...',
      de: 'Durchsuchen...',
      it: 'Sfoglia...',
      'zh-CN': '浏览……',
      ja: '参照…'
    },
    change_file: {
      en: 'Change...',
      fr: 'Changer...',
      es: 'Cambiar...',
      de: 'Ändern...',
      it: 'Cambia...',
      'zh-CN': '更改……',
      ja: '変更…'
    },
    no_file_selected: {
      en: 'No file selected',
      fr: 'Aucun fichier sélectionné',
      es: 'Ningún archivo seleccionado',
      de: 'Keine Datei ausgewählt',
      it: 'Nessun file selezionato',
      'zh-CN': '未选择文件',
      ja: 'ファイルが選択されていません'
    },
    select_file: {
      en: 'Please select a file',
      fr: 'Veuillez sélectionner un fichier',
      es: 'Seleccione un archivo',
      de: 'Bitte wählen Sie eine Datei aus',
      it: 'Selezionare un file',
      'zh-CN': '请选择一个文件',
      ja: 'ファイルを選択してください'
    },
    input_excel: {
      en: 'Entering excel file',
      fr: 'Fichier d\'entrée excel',
      es: 'Archivo Excel de entrada',
      de: 'Excel-Eingabedatei',
      it: 'File Excel di input',
      'zh-CN': '输入 Excel 文件',
      ja: '入力 Excel ファイル'
    },
    input_layout: {
      en: 'Layout file',
      fr: 'Diagramme de mise en page',
      es: 'Archivo de diseño',
      de: 'Layout-Datei',
      it: 'File di layout',
      'zh-CN': '布局文件',
      ja: 'レイアウトファイル'
    },
    check_scale_geo: {
      en: 'Scale\'s descent',
      fr: 'Descente d\'échelle',
      es: 'Descenso de escala',
      de: 'Skalenabstieg',
      it: 'Discesa di scala',
      'zh-CN': '尺度下推',
      ja: 'スケールの細分化'
    },
    input_scale_geo: {
      en: 'MFA file from supperior geographic level',
      fr: 'Fichier MFA du niveau géographique supérieur',
      es: 'Archivo MFA del nivel geográfico superior',
      de: 'MFA-Datei der übergeordneten geografischen Ebene',
      it: 'File MFA del livello geografico superiore',
      'zh-CN': '来自上级地理层级的 MFA 文件',
      ja: '上位の地理レベルの MFA ファイル'
    },
    check_analyse_uncert: {
      en: 'Uncertainty analysis',
      fr: 'Analyse d\'incertitude',
      es: 'Análisis de incertidumbre',
      de: 'Unsicherheitsanalyse',
      it: 'Analisi di incertezza',
      'zh-CN': '不确定性分析',
      ja: '不確実性の分析'
    },
    input_analyse_uncert: {
      en: 'Number of realisation',
      fr: 'Nombre de réalisations',
      es: 'Número de realizaciones',
      de: 'Anzahl der Realisierungen',
      it: 'Numero di realizzazioni',
      'zh-CN': '抽样次数',
      ja: '試行回数'
    },
    waiting_file: {
      en: 'Choose an input file',
      fr: 'Veuillez choisir un fichier d\'entrée',
      es: 'Elija un archivo de entrada',
      de: 'Wählen Sie eine Eingabedatei',
      it: 'Scegliere un file di input',
      'zh-CN': '选择一个输入文件',
      ja: '入力ファイルを選択してください'
    },
    reconciliation: {
      en: 'Reconciliation',
      fr: 'Réconciliation',
      es: 'Reconciliación',
      de: 'Abstimmung',
      it: 'Riconciliazione',
      'zh-CN': '数据调和',
      ja: 'データ調和'
    },
    completion: {
      en: 'Completion',
      fr: 'Complétion',
      es: 'Compleción',
      de: 'Vervollständigung',
      it: 'Completamento',
      'zh-CN': '补全',
      ja: '補完'
    },
    open_excel_file: {
      en: 'Open an excel file',
      fr: 'Ouvrir fichier excel',
      es: 'Abrir archivo Excel',
      de: 'Excel-Datei öffnen',
      it: 'Apri file Excel',
      'zh-CN': '打开 Excel 文件',
      ja: 'Excel ファイルを開く'
    },
    open_json_file: {
      en: 'Open a JSON file',
      fr: 'Ouvrir un fichier JSON',
      es: 'Abrir un archivo JSON',
      de: 'JSON-Datei öffnen',
      it: 'Apri un file JSON',
      'zh-CN': '打开 JSON 文件',
      ja: 'JSON ファイルを開く'
    },
    save_excel_file: {
      en: 'Save Excel',
      fr: 'Enregistrer Excel',
      es: 'Guardar Excel',
      de: 'Excel speichern',
      it: 'Salva Excel',
      'zh-CN': '保存 Excel',
      ja: 'Excel を保存'
    },
    save_json_file: {
      en: 'Save JSON',
      fr: 'Enregistrer JSON',
      es: 'Guardar JSON',
      de: 'JSON speichern',
      it: 'Salva JSON',
      'zh-CN': '保存 JSON',
      ja: 'JSON を保存'
    },
    create_index: {
      en: 'Document workbook',
      fr: 'Documenter le classeur',
      es: 'Documentar el libro',
      de: 'Arbeitsmappe dokumentieren',
      it: 'Documenta la cartella',
      'zh-CN': '工作簿说明',
      ja: 'ブックの説明'
    },
    create_ter_tes: {
      en: 'Create TER/TES sheet',
      fr: 'Créer l\'onglet TER/TES',
      es: 'Crear hoja TER/TES',
      de: 'TER/TES-Blatt erstellen',
      it: 'Crea foglio TER/TES',
      'zh-CN': '创建 TER/TES 工作表',
      ja: 'TER/TES シートを作成'
    },
    save: {
      en: 'Save',
      fr: 'Enregistrer',
      es: 'Guardar',
      de: 'Speichern',
      it: 'Salva',
      'zh-CN': '保存',
      ja: '保存'
    },
    input_file_excel: {
      en: 'Input file Excel',
      fr: 'Fichier d\'entrée excel',
      es: 'Archivo Excel de entrada',
      de: 'Excel-Eingabedatei',
      it: 'File Excel di input',
      'zh-CN': '输入文件 Excel',
      ja: '入力ファイル Excel'
    },
    input_file_json: {
      en: 'Input file JSON',
      fr: 'Fichier d\'entrée json',
      es: 'Archivo JSON de entrada',
      de: 'JSON-Eingabedatei',
      it: 'File JSON di input',
      'zh-CN': '输入文件 JSON',
      ja: '入力ファイル JSON'
    },
    load_example: {
      en: 'Load Example',
      fr: 'Chargement de l\'exemple',
      es: 'Cargar ejemplo',
      de: 'Beispiel laden',
      it: 'Carica esempio',
      'zh-CN': '加载示例',
      ja: '例を読み込む'
    },
    load_tutorial: {
      en: 'Loading tutorial',
      fr: 'Chargement du tutoriel',
      es: 'Cargando tutorial',
      de: 'Tutorial laden',
      it: 'Caricamento tutorial',
      'zh-CN': '正在加载教程',
      ja: 'チュートリアルを読み込み中'
    },
    no_input_file_detected: {
      en: 'No file has been selected',
      fr: 'Aucun fichier n\'a été sélectionné',
      es: 'No se ha seleccionado ningún archivo',
      de: 'Keine Datei ausgewählt',
      it: 'Nessun file selezionato',
      'zh-CN': '尚未选择任何文件',
      ja: 'ファイルが選択されていません'
    },
    waiting: {
      en: 'Please wait',
      fr: 'Veuillez patienter',
      es: 'Por favor espere',
      de: 'Bitte warten',
      it: 'Attendere prego',
      'zh-CN': '请稍候',
      ja: 'お待ちください'
    },
    old_app: {
      en: 'Legacy app.',
      fr: 'Version préc. app.',
      es: 'Aplicación anterior',
      de: 'Ältere App',
      it: 'App precedente',
      'zh-CN': '旧版应用',
      ja: '旧アプリ'
    },
    excel_sheets_to_ignore: {
      en: 'Excel sheets to ignore',
      fr: 'Onglets excel à ignorer',
      es: 'Hojas Excel a ignorar',
      de: 'Zu ignorierende Excel-Blätter',
      it: 'Fogli Excel da ignorare',
      'zh-CN': '要忽略的 Excel 工作表',
      ja: '無視する Excel シート'
    },

    layout_section: {
      en: 'Loading options',
      fr: 'Options chargement',
      es: 'Opciones de carga',
      de: 'Ladeoptionen',
      it: 'Opzioni di caricamento',
      'zh-CN': '加载选项',
      ja: '読み込みオプション'
    },
    layout_from_displayed: {
      en: 'From displayed sankey',
      fr: 'A partir du sankey affiché',
      es: 'Desde el sankey mostrado',
      de: 'Vom angezeigten Sankey',
      it: 'Dal sankey visualizzato',
      'zh-CN': '来自当前显示的桑基图',
      ja: '表示中のサンキーから'
    },
    layout_from_displayed_tt: {
      en: 'Keep node positions from the currently displayed sankey instead of computing a new layout',
      fr: 'Conserver les positions des nœuds du sankey actuellement affiché au lieu de calculer une nouvelle mise en page',
      es: 'Conservar las posiciones de los nodos del sankey actualmente mostrado en lugar de calcular un nuevo diseño',
      de: 'Knotenpositionen des aktuell angezeigten Sankeys beibehalten statt ein neues Layout zu berechnen',
      it: 'Mantenere le posizioni dei nodi dal sankey attualmente visualizzato invece di calcolare un nuovo layout',
      'zh-CN': '保留当前显示的桑基图中的节点位置，而不重新计算布局',
      ja: 'レイアウトを再計算せず、現在表示中のサンキーのノード位置を維持します'
    },
    layout_h_spacing: {
      en: 'Horizontal spacing',
      fr: 'Ecart horizontal',
      es: 'Espaciado horizontal',
      de: 'Horizontaler Abstand',
      it: 'Spaziatura orizzontale',
      'zh-CN': '水平间距',
      ja: '水平方向の間隔'
    },
    layout_h_spacing_tt: {
      en: 'Horizontal distance (in pixels) between node columns',
      fr: 'Distance horizontale (en pixels) entre les colonnes de nœuds',
      es: 'Distancia horizontal (en píxeles) entre las columnas de nodos',
      de: 'Horizontaler Abstand (in Pixeln) zwischen Knotenspalten',
      it: 'Distanza orizzontale (in pixel) tra le colonne dei nodi',
      'zh-CN': '节点列之间的水平距离（像素）',
      ja: 'ノードの列と列の間の水平距離（ピクセル）'
    },
    layout_v_spacing: {
      en: 'Vertical spacing',
      fr: 'Ecart vertical',
      es: 'Espaciado vertical',
      de: 'Vertikaler Abstand',
      it: 'Spaziatura verticale',
      'zh-CN': '垂直间距',
      ja: '垂直方向の間隔'
    },
    layout_v_spacing_tt: {
      en: 'Vertical distance (in pixels) between nodes within the same column',
      fr: 'Distance verticale (en pixels) entre les nœuds d\'une même colonne',
      es: 'Distancia vertical (en píxeles) entre los nodos de una misma columna',
      de: 'Vertikaler Abstand (in Pixeln) zwischen Knoten innerhalb derselben Spalte',
      it: 'Distanza verticale (in pixel) tra i nodi della stessa colonna',
      'zh-CN': '同一列内节点之间的垂直距离（像素）',
      ja: '同じ列内のノード同士の垂直距離（ピクセル）'
    },
    layout_sources: {
      en: 'Source nodes',
      fr: 'Nœuds sans entrée',
      es: 'Nodos fuente',
      de: 'Quellknoten',
      it: 'Nodi sorgente',
      'zh-CN': '源节点',
      ja: '始点ノード'
    },
    layout_sources_tt: {
      en: 'Placement of nodes with no incoming flow: just before their first successor, or pinned to the left extremity of the diagram',
      fr: 'Placement des nœuds sans flux entrant : juste avant leur premier successeur, ou collés à l\'extrémité gauche du diagramme',
      es: 'Ubicación de los nodos sin flujo entrante: justo antes de su primer sucesor, o fijados al extremo izquierdo del diagrama',
      de: 'Platzierung von Knoten ohne eingehenden Fluss: direkt vor ihrem ersten Nachfolger oder am linken Rand des Diagramms fixiert',
      it: 'Posizionamento dei nodi senza flusso in ingresso: appena prima del primo successore, o fissati all\'estremità sinistra del diagramma',
      'zh-CN': '无进入流量的节点的放置方式：紧邻其第一个后继节点之前，或固定在图表最左端',
      ja: '入力フローを持たないノードの配置：最初の後続ノードの直前、または図の左端に固定'
    },
    layout_sinks: {
      en: 'Sink nodes',
      fr: 'Nœuds sans sortie',
      es: 'Nodos sumidero',
      de: 'Senkenknoten',
      it: 'Nodi pozzo',
      'zh-CN': '汇节点',
      ja: '終点ノード'
    },
    layout_sinks_tt: {
      en: 'Placement of nodes with no outgoing flow: just after their last predecessor, or pinned to the right extremity of the diagram',
      fr: 'Placement des nœuds sans flux sortant : juste après leur dernier prédécesseur, ou collés à l\'extrémité droite du diagramme',
      es: 'Ubicación de los nodos sin flujo saliente: justo después de su último predecesor, o fijados al extremo derecho del diagrama',
      de: 'Platzierung von Knoten ohne ausgehenden Fluss: direkt nach ihrem letzten Vorgänger oder am rechten Rand des Diagramms fixiert',
      it: 'Posizionamento dei nodi senza flusso in uscita: appena dopo l\'ultimo predecessore, o fissati all\'estremità destra del diagramma',
      'zh-CN': '无流出流量的节点的放置方式：紧随其最后一个前驱节点之后，或固定在图表最右端',
      ja: '出力フローを持たないノードの配置：最後の先行ノードの直後、または図の右端に固定'
    },
    layout_before_neighbor: {
      en: 'Column before neighbor',
      fr: 'Colonne avant voisin',
      es: 'Columna antes del vecino',
      de: 'Spalte vor Nachbar',
      it: 'Colonna prima del vicino',
      'zh-CN': '相邻节点前一列',
      ja: '隣接ノードの手前の列'
    },
    layout_left_extremity: {
      en: 'Left extremity',
      fr: 'Extrémité gauche',
      es: 'Extremo izquierdo',
      de: 'Linkes Ende',
      it: 'Estremità sinistra',
      'zh-CN': '最左端',
      ja: '左端'
    },
    layout_after_neighbor: {
      en: 'Column after neighbor',
      fr: 'Colonne après voisin',
      es: 'Columna después del vecino',
      de: 'Spalte nach Nachbar',
      it: 'Colonna dopo il vicino',
      'zh-CN': '相邻节点后一列',
      ja: '隣接ノードの次の列'
    },
    layout_right_extremity: {
      en: 'Right extremity',
      fr: 'Extrémité droite',
      es: 'Extremo derecho',
      de: 'Rechtes Ende',
      it: 'Estremità destra',
      'zh-CN': '最右端',
      ja: '右端'
    },
    layout_mode: {
      en: 'Mode',
      fr: 'Mode',
      es: 'Modo',
      de: 'Modus',
      it: 'Modalità',
      'zh-CN': '模式',
      ja: 'モード'
    },
    layout_mode_tt: {
      en: 'Center: vertical centering of nodes within each column. Minimize crossings: tries to reduce the number of link crossings (slower)',
      fr: 'Centrer : centrage vertical des nœuds dans chaque colonne. Minimiser les croisements : tente de réduire le nombre de croisements de flux (plus lent)',
      es: 'Centrar: centrado vertical de los nodos en cada columna. Minimizar cruces: intenta reducir el número de cruces de flujos (más lento)',
      de: 'Zentrieren: vertikale Zentrierung der Knoten in jeder Spalte. Kreuzungen minimieren: versucht die Anzahl der Flusskreuzungen zu reduzieren (langsamer)',
      it: 'Centra: centramento verticale dei nodi in ogni colonna. Minimizza incroci: cerca di ridurre il numero di incroci dei flussi (più lento)',
      'zh-CN': '居中：使节点在各列内垂直居中。最小化交叉：尝试减少流量交叉的数量（速度较慢）',
      ja: '中央揃え：各列の中でノードを垂直方向に中央揃えします。交差を最小化：フローの交差の数を減らそうとします（低速）'
    },
    layout_center: {
      en: 'Center nodes',
      fr: 'Centrer les nœuds',
      es: 'Centrar nodos',
      de: 'Knoten zentrieren',
      it: 'Centra nodi',
      'zh-CN': '节点居中',
      ja: 'ノードを中央揃え'
    },
    layout_minimize: {
      en: 'Minimize crossings',
      fr: 'Minimiser les croisements',
      es: 'Minimizar cruces',
      de: 'Kreuzungen minimieren',
      it: 'Minimizza incroci',
      'zh-CN': '最小化交叉',
      ja: '交差を最小化'
    },
    layout_recycling: {
      en: 'Recycling',
      fr: 'Recyclage',
      es: 'Reciclaje',
      de: 'Recycling',
      it: 'Riciclo',
      'zh-CN': '回流',
      ja: 'リサイクル'
    },
    layout_recycling_tt: {
      en: 'Auto: after a node is moved, a flow whose target is no longer to the right of its source becomes a recycling flow, and vice versa. No node is moved, and flows you locked keep their status. Frozen: recycling statuses stay as they are.',
      fr: 'Auto : après un déplacement de nœud, un flux dont la cible n\'est plus à droite de sa source passe en recyclage, et inversement. Aucun nœud n\'est déplacé, et les flux que vous avez verrouillés gardent leur statut. Figé : les statuts de recyclage restent en l\'état.',
      es: 'Auto: tras mover un nodo, un flujo cuyo destino ya no está a la derecha de su origen pasa a reciclaje, y viceversa. No se mueve ningún nodo y los flujos bloqueados mantienen su estado. Fijo: los estados de reciclaje no cambian.',
      de: 'Auto: Nach dem Verschieben eines Knotens wird ein Fluss, dessen Ziel nicht mehr rechts von seiner Quelle liegt, zum Recycling-Fluss und umgekehrt. Kein Knoten wird verschoben, gesperrte Flüsse behalten ihren Status. Eingefroren: Recycling-Status bleibt unverändert.',
      it: 'Auto: dopo lo spostamento di un nodo, un flusso la cui destinazione non è più a destra della sorgente passa a riciclo, e viceversa. Nessun nodo viene spostato e i flussi bloccati mantengono il loro stato. Congelato: gli stati di riciclo restano invariati.',
      'zh-CN': '自动：节点移动后，若某流量的目标不再位于其源的右侧，则该流量变为回流，反之亦然。不会移动任何节点，且您锁定的流量保持其状态。冻结：回流状态保持不变。',
      ja: '自動：ノードを動かした後、終点が始点より右になくなったフローはリサイクルフローになり、その逆も同様です。ノードは動かず、固定したフローは状態を保ちます。固定：リサイクルの状態は現状のまま維持されます。'
    },
    layout_recycling_auto: {
      en: 'Auto',
      fr: 'Auto',
      es: 'Auto',
      de: 'Auto',
      it: 'Auto',
      'zh-CN': '自动',
      ja: '自動'
    },
    layout_recycling_frozen: {
      en: 'Frozen',
      fr: 'Figé',
      es: 'Fijo',
      de: 'Eingefroren',
      it: 'Congelato',
      'zh-CN': '冻结',
      ja: '固定'
    },
    layout_reset: {
      en: 'Reset to default',
      fr: 'Réinitialiser au défaut',
      es: 'Restablecer valores predeterminados',
      de: 'Auf Standard zurücksetzen',
      it: 'Ripristina predefiniti',
      'zh-CN': '恢复默认',
      ja: '既定値に戻す'
    },
    layout_reset_tt: {
      en: 'Reset all layout options to their default values',
      fr: 'Remettre toutes les options de mise en page à leurs valeurs par défaut',
      es: 'Restablecer todas las opciones de diseño a sus valores predeterminados',
      de: 'Alle Layout-Optionen auf ihre Standardwerte zurücksetzen',
      it: 'Reimpostare tutte le opzioni di layout ai valori predefiniti',
      'zh-CN': '将所有布局选项重置为默认值',
      ja: 'レイアウトのオプションをすべて既定値に戻します'
    },
    layout_apply: {
      en: 'Apply layout',
      fr: 'Mise en page',
      es: 'Aplicar diseño',
      de: 'Layout anwenden',
      it: 'Applica layout',
      'zh-CN': '应用布局',
      ja: 'レイアウトを適用'
    },
    layout_apply_tt: {
      en: 'Run the automatic layout computation with the options above',
      fr: 'Lancer le calcul de la mise en page automatique avec les options ci-dessus',
      es: 'Ejecutar el cálculo de diseño automático con las opciones anteriores',
      de: 'Die automatische Layout-Berechnung mit den obigen Optionen ausführen',
      it: 'Eseguire il calcolo del layout automatico con le opzioni sopra indicate',
      'zh-CN': '使用以上选项运行自动布局计算',
      ja: '上記のオプションで自動レイアウトの計算を実行します'
    },

    input_options: {
      en: 'Input file options',
      fr: 'Options d\'entrée',
      es: 'Opciones de archivo de entrada',
      de: 'Eingabedatei-Optionen',
      it: 'Opzioni file di input',
      'zh-CN': '输入文件选项',
      ja: '入力ファイルのオプション'
    },
    output_options: {
      en: 'Output file options',
      fr: 'Options d\'enregistrement',
      es: 'Opciones de archivo de salida',
      de: 'Ausgabedatei-Optionen',
      it: 'Opzioni file di output',
      'zh-CN': '输出文件选项',
      ja: '出力ファイルのオプション'
    },
    load: {
      fr: 'Ouvrir',
      en: 'Open',
      es: 'Abrir',
      de: 'Öffnen',
      it: 'Apri',
      'zh-CN': '打开',
      ja: '開く'
    },
    file_converter: {
      fr: 'Édition de fichier',
      en: 'File editing',
      es: 'Edición de archivo',
      de: 'Dateibearbeitung',
      it: 'Modifica file',
      'zh-CN': '文件编辑',
      ja: 'ファイルの編集'
    },
    log_infos: {
      fr: 'Infos',
      en: 'Infos',
      es: 'Información',
      de: 'Infos',
      it: 'Info',
      'zh-CN': '信息',
      ja: '情報'
    },
    log_warnings: {
      fr: 'Warnings',
      en: 'Warnings',
      es: 'Advertencias',
      de: 'Warnungen',
      it: 'Avvisi',
      'zh-CN': '警告',
      ja: '警告'
    },
    log_errors: {
      fr: 'Erreurs',
      en: 'Errors',
      es: 'Errores',
      de: 'Fehler',
      it: 'Errori',
      'zh-CN': '错误',
      ja: 'エラー'
    },
    log_debug: {
      fr: 'Debug',
      en: 'Debug',
      es: 'Depuración',
      de: 'Debug',
      it: 'Debug',
      'zh-CN': '调试',
      ja: 'デバッグ'
    },
    warnings_to_read: {
      fr: 'Cliquer pour n\'afficher que les warnings',
      en: 'Click to show only warnings',
      es: 'Haga clic para mostrar solo las advertencias',
      de: 'Klicken, um nur Warnungen anzuzeigen',
      it: 'Clicca per mostrare solo gli avvisi',
      'zh-CN': '点击仅显示警告',
      ja: 'クリックすると警告のみを表示します'
    }
  }
}

export type OptionGroup =
  | 'autocorrection'
  | 'sheets'
  | 'content'
  | 'merge'
  | 'presentation'
  | 'solver'

// Ordre d'affichage imposé des groupes dans la boîte de dialogue.
export const OPTION_GROUP_ORDER: OptionGroup[] = [
  'merge',
  'autocorrection',
  'sheets',
  'content',
  'presentation',
  'solver',
]

export type OptionDirection = 'input' | 'output'

type LocalizedLabel = { en: string; fr: string; es: string; de: string; it: string; 'zh-CN'?: string; ja?: string }
type DirectedLabel = Record<OptionDirection, LocalizedLabel>

// Libellés directionnels : chaque groupe a une variante « lecture » et « écriture »
// pour distinguer l'usage même quand il n'apparaît que d'un seul côté.
export const OPTION_GROUP_LABELS: Record<OptionGroup, DirectedLabel> = {
  autocorrection: {
    input: { en: 'Autocompletion / autocorrection', fr: 'Autocomplétion / autocorrection', es: 'Autocompletado / autocorrección', de: 'Autovervollständigung / Autokorrektur', it: 'Autocompletamento / autocorrezione',
      'zh-CN': '自动补全 / 自动纠正',
      ja: '自動補完／自動修正' },
    output: { en: 'Autocompletion / autocorrection', fr: 'Autocomplétion / autocorrection', es: 'Autocompletado / autocorrección', de: 'Autovervollständigung / Autokorrektur', it: 'Autocompletamento / autocorrezione',
      'zh-CN': '自动补全 / 自动纠正',
      ja: '自動補完／自動修正' },
  },
  sheets: {
    input: { en: 'Read sheets', fr: 'Onglets lus', es: 'Hojas leídas', de: 'Gelesene Blätter', it: 'Fogli letti',
      'zh-CN': '读取的工作表',
      ja: '読み込むシート' },
    output: { en: 'Written sheets', fr: 'Onglets écrits', es: 'Hojas escritas', de: 'Geschriebene Blätter', it: 'Fogli scritti',
      'zh-CN': '写入的工作表',
      ja: '書き出すシート' },
  },
  content: {
    input: { en: 'Read content', fr: 'Contenu lu', es: 'Contenido leído', de: 'Gelesener Inhalt', it: 'Contenuto letto',
      'zh-CN': '读取的内容',
      ja: '読み込む内容' },
    output: { en: 'Written content', fr: 'Contenu écrit', es: 'Contenido escrito', de: 'Geschriebener Inhalt', it: 'Contenuto scritto',
      'zh-CN': '写入的内容',
      ja: '書き出す内容' },
  },
  merge: {
    input: { en: 'Merge (read)', fr: 'Fusion (lecture)', es: 'Fusión (lectura)', de: 'Zusammenführen (Lesen)', it: 'Unione (lettura)',
      'zh-CN': '合并（读取）',
      ja: 'マージ（読み込み）' },
    output: { en: 'Merge with existing file', fr: 'Fusion avec fichier existant', es: 'Fusionar con archivo existente', de: 'Mit vorhandener Datei zusammenführen', it: 'Unione con file esistente',
      'zh-CN': '与现有文件合并',
      ja: '既存のファイルとマージ' },
  },
  presentation: {
    input: { en: 'Presentation (read)', fr: 'Présentation (lecture)', es: 'Presentación (lectura)', de: 'Präsentation (Lesen)', it: 'Presentazione (lettura)',
      'zh-CN': '呈现（读取）',
      ja: '表示（読み込み）' },
    output: { en: 'Presentation (write)', fr: 'Présentation (écriture)', es: 'Presentación (escritura)', de: 'Präsentation (Schreiben)', it: 'Presentazione (scrittura)',
      'zh-CN': '呈现（写入）',
      ja: '表示（書き出し）' },
  },
  solver: {
    input: { en: 'Solver', fr: 'Solveur', es: 'Solver', de: 'Solver', it: 'Solver',
      'zh-CN': '求解器',
      ja: 'ソルバー' },
    output: { en: 'Solver', fr: 'Solveur', es: 'Solver', de: 'Solver', it: 'Solver',
      'zh-CN': '求解器',
      ja: 'ソルバー' },
  },
}

export interface FormatAttributeConfig<T> {
  default: T
  type: () => T
  labels: { en: string; fr: string; es?: string; de?: string; it?: string; 'zh-CN'?: string; ja?: string }
  tooltips: { en: string; fr: string; es?: string; de?: string; it?: string; 'zh-CN'?: string; ja?: string }
  visibilityConditions?: MenuCondition[]
  // When these evaluate true the checkbox/input is rendered as disabled. The
  // dialog parent component additionally enforces `forcedValueWhenDisabled`
  // on the bucket so the option keeps a coherent value while the user can
  // see why it's locked (cf. SA #136: TER off forces include-all-flux on).
  disabledConditions?: MenuCondition[]
  forcedValueWhenDisabled?: T
  // Optional alternate tooltip displayed when the option is disabled by
  // disabledConditions. Falls back to `tooltips` when absent.
  disabledTooltip?: { en: string; fr: string; es?: string; de?: string; it?: string; 'zh-CN'?: string; ja?: string }
  group?: OptionGroup
  // Force a row break in the auto-generated options renderer before rendering
  // this option's unit (parent + visibility-conditioned children).
  breakBefore?: boolean
  // For string-typed options rendered as a ComboBox/Select (mutually exclusive
  // choices). Each entry maps a stored value to its localized label. When set,
  // the renderer draws a <Select> instead of a checkbox/number input.
  selectOptions?: { value: string; labels: { en: string; fr: string; es?: string; de?: string; it?: string; 'zh-CN'?: string; ja?: string } }[]
}
export type FormatConfigStructure = Record<string, FormatAttributeConfig<boolean | number | string> | object>
// ==================================================================================================
// OPTIONS D'ENTRÉE (INPUT)
// ==================================================================================================

export const INPUT_ATTRIBUTES_CONFIG: FormatConfigStructure = {
  // =================== BASE (communes à tous les formats) ===================
  base: {
    create_new_nodes: {
      group: 'autocorrection',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Create nodes from fluxes',
        fr: 'Créer les nœuds depuis les flux',
        es: 'Crear nodos desde los flujos',
        de: 'Knoten aus Flüssen erstellen',
        it: 'Creare nodi dai flussi',
        'zh-CN': '由流量创建节点',
        ja: 'フローからノードを作成'
      },
      tooltips: {
        en: 'If checked: nodes referenced in fluxes but absent from the nodes sheet are silently created and listed in the info log (details in the debug tab). If unchecked: the load fails with a summary error.',
        fr: 'Si coché : les nœuds référencés dans les flux mais absents de l\'onglet nœuds sont créés silencieusement et listés dans les infos (détail dans l\'onglet debug). Si décoché : le chargement échoue avec un récapitulatif.',
        es: 'Si está marcado: los nodos referenciados en los flujos pero ausentes de la hoja de nodos se crean silenciosamente y se listan en el registro de información (detalles en la pestaña de depuración). Si no está marcado: la carga falla con un error resumen.',
        de: 'Wenn aktiviert: Knoten, die in Flüssen referenziert aber im Knotenblatt nicht vorhanden sind, werden still erstellt und im Info-Log aufgelistet (Details im Debug-Tab). Wenn deaktiviert: das Laden schlägt mit einer Zusammenfassung fehl.',
        it: 'Se selezionato: i nodi referenziati nei flussi ma assenti dal foglio nodi vengono creati silenziosamente ed elencati nel registro informazioni (dettagli nella scheda debug). Se non selezionato: il caricamento fallisce con un errore riepilogativo.',
        'zh-CN': '若勾选：流量中引用但节点工作表中缺失的节点将被静默创建，并记录在信息日志中（详情见调试选项卡）。若不勾选：加载失败并给出汇总错误。',
        ja: 'オンの場合：フローで参照されているがノードシートにないノードを黙って作成し、情報ログに一覧表示します（詳細はデバッグタブ）。オフの場合：読み込みは要約エラーで失敗します。'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    create_new_flux: {
      group: 'autocorrection',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Create fluxes from secondary sheets',
        fr: 'Créer les flux depuis les onglets secondaires',
        es: 'Crear flujos desde las hojas secundarias',
        de: 'Flüsse aus sekundären Blättern erstellen',
        it: 'Creare flussi dai fogli secondari',
        'zh-CN': '由辅助工作表创建流量',
        ja: '補助シートからフローを作成'
      },
      tooltips: {
        en: 'If checked: fluxes referenced in data/constraints/min-max sheets but absent from base sheets (results, matrix) are silently created and listed in the info log (details in the debug tab). If unchecked: the load fails.',
        fr: 'Si coché : les flux référencés dans les onglets données/contraintes/min-max mais absents des onglets de base (résultats, matrice) sont créés silencieusement et listés dans les infos (détail dans l\'onglet debug). Si décoché : le chargement échoue.',
        es: 'Si está marcado: los flujos referenciados en las hojas de datos/restricciones/min-max pero ausentes de las hojas base (resultados, matriz) se crean silenciosamente y se listan en el registro de información. Si no está marcado: la carga falla.',
        de: 'Wenn aktiviert: Flüsse, die in Daten-/Einschränkungs-/Min-Max-Blättern referenziert aber in Basisblättern (Ergebnisse, Matrix) nicht vorhanden sind, werden still erstellt und im Info-Log aufgelistet. Wenn deaktiviert: das Laden schlägt fehl.',
        it: 'Se selezionato: i flussi referenziati nei fogli dati/vincoli/min-max ma assenti dai fogli base (risultati, matrice) vengono creati silenziosamente ed elencati nel registro informazioni. Se non selezionato: il caricamento fallisce.',
        'zh-CN': '若勾选：在数据/约束/最小-最大工作表中引用但基础工作表（结果、矩阵）中缺失的流量将被静默创建，并记录在信息日志中（详情见调试选项卡）。若不勾选：加载失败。',
        ja: 'オンの場合：データ／制約／最小最大シートで参照されているが基本シート（結果、行列）にないフローを黙って作成し、情報ログに一覧表示します（詳細はデバッグタブ）。オフの場合：読み込みは失敗します。'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    propagate_flux_to_children: {
      group: 'autocorrection',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Propagate fluxes to children',
        fr: 'Propager les flux aux enfants',
        es: 'Propagar flujos a los hijos',
        de: 'Flüsse an Kinder weitergeben',
        it: 'Propagare i flussi ai figli',
        'zh-CN': '将流量传播到子节点',
        ja: 'フローを子ノードへ伝播'
      },
      tooltips: {
        en: 'Create child fluxes when they exist only on parent nodes',
        fr: 'Créer les flux enfants lorsqu\'ils n\'existent que sur les nœuds parents',
        es: 'Crear flujos hijos cuando existen solo en los nodos padre',
        de: 'Kindflüsse erstellen, wenn sie nur auf Elternknoten existieren',
        it: 'Creare flussi figli quando esistono solo sui nodi genitore',
        'zh-CN': '当流量仅存在于父节点上时创建子流量',
        ja: '親ノードにしか存在しないフローについて、子フローを作成します'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    propagate_flux_to_parent: {
      group: 'autocorrection',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Propagate fluxes to parents',
        fr: 'Propager les flux aux parents',
        es: 'Propagar flujos a los padres',
        de: 'Flüsse an Eltern weitergeben',
        it: 'Propagare i flussi ai genitori',
        'zh-CN': '将流量传播到父节点',
        ja: 'フローを親ノードへ伝播'
      },
      tooltips: {
        en: 'Create parent fluxes when they exist only on child nodes',
        fr: 'Créer les flux parents lorsqu\'ils n\'existent que sur les n\u0153uds enfants',
        es: 'Crear flujos padres cuando existen solo en los nodos hijos',
        de: 'Elternflüsse erstellen, wenn sie nur auf Kindknoten existieren',
        it: 'Creare flussi genitori quando esistono solo sui nodi figli',
        'zh-CN': '当流量仅存在于子节点上时创建父流量',
        ja: '子ノードにしか存在しないフローについて、親フローを作成します'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    // #161 — master toggle. Checked (default) = legacy: the diagram structure is
    // propagated across every dataTag. Unchecked = keep only the (flux, dataTag)
    // combinations present in the input; a flux absent for a dataTag is treated
    // as non-existent (reconciled to 0). Per-group overrides live on each dataTag
    // group (Tags sheet column "Propager la structure" / tag-group editor).
    propagate_datatag_structure: {
      group: 'autocorrection',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Propagate structure across dataTags',
        fr: 'Propager la structure sur les dataTags',
        es: 'Propagar la estructura a través de los dataTags',
        de: 'Struktur über dataTags hinweg propagieren',
        it: 'Propagare la struttura tra i dataTag',
        'zh-CN': '跨数据标签传播结构',
        ja: 'データタグ間で構造を伝播'
      },
      tooltips: {
        en: 'When unchecked, keep only the (flux, dataTag) combinations present in the input; a flux absent for a dataTag does not exist there (reconciled to 0)',
        fr: 'Décoché : ne conserver que les combinaisons (flux, dataTag) présentes dans l\'entrée ; un flux absent pour un dataTag n\'y existe pas (réconcilié à 0)',
        es: 'Sin marcar: conservar solo las combinaciones (flujo, dataTag) presentes en la entrada; un flujo ausente para un dataTag no existe (reconciliado a 0)',
        de: 'Nicht markiert: nur die im Input vorhandenen (Fluss, dataTag)-Kombinationen behalten; ein für einen dataTag fehlender Fluss existiert dort nicht (auf 0 abgeglichen)',
        it: 'Deselezionato: mantenere solo le combinazioni (flusso, dataTag) presenti nell\'input; un flusso assente per un dataTag non esiste (riconciliato a 0)',
        'zh-CN': '不勾选时，仅保留输入中存在的（流量，数据标签）组合；某数据标签下缺失的流量在该处不存在（调和为 0）',
        ja: 'オフの場合、入力に存在する（フロー, データタグ）の組み合わせだけを保持します。あるデータタグに存在しないフローは、そこでは存在しないものとして扱われます（調和結果は 0）'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    autofix_parenthood_mat_balance: {
      group: 'autocorrection',
      breakBefore: true,
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Fix matter balance parent/children incoherence',
        fr: 'Corriger l\'incohérence balance matière parent/enfants',
        es: 'Corregir la incoherencia del balance de materia padre/hijos',
        de: 'Materialbilanz-Inkonsistenz Eltern/Kinder korrigieren',
        it: 'Correggere l\'incoerenza del bilancio materia genitore/figli',
        'zh-CN': '修正父/子节点物质平衡的不一致',
        ja: '親子ノード間の物質収支の不整合を修正'
      },
      tooltips: {
        en: 'If checked: when a parent node has mat_balance=1 but some children have mat_balance!=1, children are aligned to 1 (lift strategy). Otherwise: warning only.',
        fr: 'Si coché : lorsqu\'un nœud parent a mat_balance=1 mais que certains enfants ont mat_balance!=1, les enfants sont alignés à 1 (stratégie lift). Sinon : simple avertissement.',
        es: 'Si está marcado: cuando un nodo padre tiene mat_balance=1 pero algunos hijos tienen mat_balance!=1, los hijos se alinean a 1 (estrategia lift). De lo contrario: solo advertencia.',
        de: 'Wenn aktiviert: hat ein Elternknoten mat_balance=1, aber einige Kinder mat_balance!=1, werden die Kinder auf 1 angeglichen (lift-Strategie). Andernfalls: nur Warnung.',
        it: 'Se selezionato: quando un nodo genitore ha mat_balance=1 ma alcuni figli hanno mat_balance!=1, i figli vengono allineati a 1 (strategia lift). Altrimenti: solo avviso.',
        'zh-CN': '若勾选：当父节点 mat_balance=1 而部分子节点 mat_balance!=1 时，将子节点对齐为 1（提升策略）。否则：仅发出警告。',
        ja: 'オンの場合：親ノードが mat_balance=1 なのに一部の子が mat_balance≠1 のとき、子を 1 に揃えます（引き上げ方式）。オフの場合：警告のみ。'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    autofix_constraint_redundancies: {
      group: 'autocorrection',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Deduplicate redundant constraint references',
        fr: 'Dédupliquer les références redondantes dans les contraintes',
        es: 'Deduplicar referencias redundantes en las restricciones',
        de: 'Redundante Constraint-Referenzen deduplizieren',
        it: 'Deduplicare i riferimenti ridondanti nei vincoli',
        'zh-CN': '去除冗余的约束引用',
        ja: '重複した制約の参照を除去'
      },
      tooltips: {
        en: 'If checked: when a constraint id references the same data more than once, keep only the first occurrence (dedup_first strategy). Otherwise: load fails.',
        fr: 'Si coché : lorsqu\'un id de contrainte référence plusieurs fois la même donnée, seule la première occurrence est conservée (stratégie dedup_first). Sinon : le chargement échoue.',
        es: 'Si está marcado: cuando un id de restricción referencia los mismos datos más de una vez, solo se conserva la primera ocurrencia (estrategia dedup_first). De lo contrario: la carga falla.',
        de: 'Wenn aktiviert: referenziert eine Constraint-ID dieselben Daten mehrfach, wird nur das erste Vorkommen behalten (dedup_first-Strategie). Andernfalls: das Laden schlägt fehl.',
        it: 'Se selezionato: quando un id di vincolo fa riferimento agli stessi dati più volte, viene mantenuta solo la prima occorrenza (strategia dedup_first). Altrimenti: il caricamento fallisce.',
        'zh-CN': '若勾选：当某个约束 id 多次引用同一数据时，仅保留第一次出现（dedup_first 策略）。否则：加载失败。',
        ja: 'オンの場合：ある制約 ID が同じデータを複数回参照しているとき、最初の 1 件だけを残します（dedup_first 方式）。オフの場合：読み込みに失敗します。'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    allow_flux_to_descendant: {
      group: 'autocorrection',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Allow fluxes from a node to its descendants',
        fr: 'Autoriser les flux d\'un nœud vers ses descendants',
        es: 'Permitir flujos de un nodo hacia sus descendientes',
        de: 'Flüsse von einem Knoten zu seinen Nachfahren erlauben',
        it: 'Consentire flussi da un nodo verso i suoi discendenti',
        'zh-CN': '允许节点与其后代之间的流量',
        ja: 'ノードからその子孫へのフローを許可'
      },
      tooltips: {
        en: 'If checked: fluxes that connect a node to one of its own hierarchical descendants (or vice-versa) are kept as-is and highlighted in red on the corrected output. Otherwise: load fails, naming the offending flux.',
        fr: 'Si coché : les flux qui relient un nœud à un de ses descendants hiérarchiques (ou inversement) sont conservés tels quels et surlignés en rouge sur la sortie corrigée. Sinon : le chargement échoue en nommant le flux fautif.',
        es: 'Si está marcado: los flujos que conectan un nodo con uno de sus descendientes jerárquicos (o viceversa) se conservan tal cual y se resaltan en rojo en la salida corregida. De lo contrario: la carga falla, nombrando el flujo problemático.',
        de: 'Wenn aktiviert: Flüsse, die einen Knoten mit einem seiner hierarchischen Nachfahren verbinden (oder umgekehrt), werden unverändert beibehalten und in der korrigierten Ausgabe rot hervorgehoben. Andernfalls: das Laden schlägt fehl und nennt den problematischen Fluss.',
        it: 'Se selezionato: i flussi che collegano un nodo a uno dei suoi discendenti gerarchici (o viceversa) vengono mantenuti così come sono ed evidenziati in rosso nell\'output corretto. Altrimenti: il caricamento fallisce, indicando il flusso problematico.',
        'zh-CN': '若勾选：连接某节点与其自身层级后代（或反之）的流量将原样保留，并在校正后的输出中以红色高亮。否则：加载失败并指出有问题的流量。',
        ja: 'オンの場合：あるノードとその階層上の子孫（またはその逆）をつなぐフローをそのまま保持し、修正後の出力で赤く強調します。オフの場合：該当フロー名を示して読み込みに失敗します。'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    autonormalize_ratio_constraints: {
      group: 'autocorrection',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Renormalize ratio constraints whose sum is close to 1',
        fr: 'Renormaliser les contraintes ratio dont la somme est proche de 1',
        es: 'Renormalizar las restricciones ratio cuya suma es cercana a 1',
        de: 'Verhältnis-Constraints renormalisieren, deren Summe nahe 1 liegt',
        it: 'Rinormalizzare i vincoli ratio la cui somma è vicina a 1',
        'zh-CN': '重新归一化总和接近 1 的比例约束',
        ja: '合計が 1 に近い比率制約を正規化'
      },
      tooltips: {
        en: 'If checked: when share-of-input ratio_flux constraints on a node sum to a value close to 1 (within ±1e-3) but not exactly 1, each ratio is rescaled by 1/sum so they sum to 1 exactly; otherwise the reference flux would be forced to 0 by mass balance. Sums farther than ±1e-3 from 1 always trigger a warning and are never auto-corrected. If unchecked: load aborts on the near-1 case.',
        fr: 'Si coché : lorsque les contraintes ratio_flux de répartition d\'un nœud somment à une valeur proche de 1 (à ±1e-3 près) mais non exactement 1, chaque ratio est rééchelonné par 1/somme pour sommer exactement à 1 ; sinon le flux de référence serait forcé à 0 par la conservation de masse. Les sommes plus éloignées que ±1e-3 de 1 déclenchent toujours un avertissement et ne sont jamais auto-corrigées. Si décoché : le chargement échoue sur le cas proche de 1.',
        es: 'Si está marcado: cuando las restricciones ratio_flux de reparto de un nodo suman un valor cercano a 1 (dentro de ±1e-3) pero no exactamente 1, cada ratio se reescala por 1/suma para sumar exactamente a 1; de lo contrario el flujo de referencia se forzaría a 0 por el balance de masa. Las sumas más lejanas que ±1e-3 de 1 siempre generan una advertencia y nunca se autocorrigen. Si no está marcado: la carga falla en el caso cercano a 1.',
        de: 'Wenn aktiviert: wenn ratio_flux-Aufteilungs-Constraints an einem Knoten zu einem Wert nahe 1 (innerhalb ±1e-3) aber nicht genau 1 summieren, wird jeder Quotient mit 1/Summe skaliert, sodass die Summe genau 1 ergibt; andernfalls würde der Referenzfluss durch die Massenbilanz auf 0 gezwungen. Summen weiter als ±1e-3 von 1 entfernt lösen immer eine Warnung aus und werden nie autokorrigiert. Wenn deaktiviert: das Laden schlägt im Nahe-1-Fall fehl.',
        it: 'Se selezionato: quando i vincoli ratio_flux di ripartizione di un nodo sommano a un valore vicino a 1 (entro ±1e-3) ma non esattamente 1, ogni ratio viene riscalato per 1/somma per sommare esattamente a 1; altrimenti il flusso di riferimento sarebbe forzato a 0 dal bilancio di massa. Le somme più lontane di ±1e-3 da 1 generano sempre un avviso e non vengono mai autocorrette. Se non selezionato: il caricamento fallisce sul caso vicino a 1.',
        'zh-CN': '若勾选：当某节点上的输入占比 ratio_flux 约束之和接近 1（±1e-3 以内）但不精确等于 1 时，每个比例将按 1/总和 重新缩放，使其精确求和为 1；否则参考流量会因质量平衡被强制为 0。与 1 相差超过 ±1e-3 的总和始终触发警告，且永不自动校正。若不勾选：在接近 1 的情形下加载中止。',
        ja: 'オンの場合：あるノードの入力割合 ratio_flux 制約の合計が 1 に近い（±1e-3 以内）が厳密に 1 でないとき、各比率を 1/合計 で調整し、合計をちょうど 1 にします。そうしないと、物質収支によって基準フローが 0 に固定されてしまいます。1 から ±1e-3 を超えて離れた合計は常に警告となり、自動修正されることはありません。オフの場合：1 に近いケースで読み込みを中止します。'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    autofix_ter_duplicate_entries: {
      group: 'autocorrection',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Merge (union) inconsistent duplicated TER entries',
        fr: 'Fusionner (union) les doublons incohérents du TER',
        es: 'Fusionar (unión) las entradas duplicadas incoherentes del TER',
        de: 'Inkonsistente doppelte TER-Einträge zusammenführen (Vereinigung)',
        it: 'Unire (unione) le voci duplicate incoerenti del TER',
        'zh-CN': '以并集合并不一致的重复 TER 条目',
        ja: '矛盾する重複 TER 項目を和集合で統合'
      },
      tooltips: {
        en: 'If checked: when a node that is a parent along several dimensions appears more than once in the TER (supply-use table) with copies whose crosses differ, the copies are merged by union (a flux is kept if present in at least one copy) and a warning lists the re-incorporated fluxes. If unchecked: load fails, listing the inconsistent fluxes (cross present in one copy only).',
        fr: 'Si coché : quand un nœud parent selon plusieurs dimensions apparaît plusieurs fois dans le TER (table emplois-ressources) avec des copies dont les croix diffèrent, les copies sont fusionnées par union (un flux est conservé s\'il est présent dans au moins une copie) et un avertissement liste les flux ré-incorporés. Si décoché : le chargement échoue en listant les flux incohérents (croix présente dans une seule copie).',
        es: 'Si está marcado: cuando un nodo padre según varias dimensiones aparece varias veces en el TER (tabla empleos-recursos) con copias cuyas cruces difieren, las copias se fusionan por unión (un flujo se conserva si está presente en al menos una copia) y una advertencia lista los flujos reincorporados. Si no está marcado: la carga falla, listando los flujos incoherentes (cruz presente en una sola copia).',
        de: 'Wenn aktiviert: wenn ein Knoten, der entlang mehrerer Dimensionen ein Elternknoten ist, mehrfach in der TER (Aufkommens-Verwendungs-Tabelle) mit Kopien erscheint, deren Kreuze sich unterscheiden, werden die Kopien durch Vereinigung zusammengeführt (ein Fluss bleibt erhalten, wenn er in mindestens einer Kopie vorhanden ist) und eine Warnung listet die wieder aufgenommenen Flüsse auf. Wenn deaktiviert: das Laden schlägt fehl und listet die inkonsistenten Flüsse auf (Kreuz nur in einer Kopie vorhanden).',
        it: 'Se selezionato: quando un nodo padre secondo più dimensioni appare più volte nel TER (tabella impieghi-risorse) con copie le cui croci differiscono, le copie vengono unite per unione (un flusso è mantenuto se presente in almeno una copia) e un avviso elenca i flussi reincorporati. Se non selezionato: il caricamento fallisce, elencando i flussi incoerenti (croce presente in una sola copia).',
        'zh-CN': '若勾选：当某节点在多个维度上均为父节点、并在 TER（供给使用表）中多次出现且各副本的交叉项不同时，将按并集合并这些副本（只要至少一个副本中存在某流量即予保留），并以警告列出被重新纳入的流量。若不勾选：加载失败并列出不一致的流量（交叉项仅存在于某一个副本中）。',
        ja: 'オンの場合：複数の次元で親となるノードが TER（供給使用表）に複数回現れ、コピーごとにクロスが異なるとき、和集合で統合し（いずれかのコピーに存在するフローを残す）、取り込み直したフローを警告で一覧表示します。オフの場合：矛盾するフロー（片方のコピーにしかクロスがないもの）を列挙して読み込みに失敗します。'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    typo_strict: {
      group: 'autocorrection',
      breakBefore: true,
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Strict typo check on node names',
        fr: 'Vérification stricte des typos de noms de nœuds',
        es: 'Verificación estricta de erratas en los nombres de nodos',
        de: 'Strenge Tippfehlerprüfung bei Knotennamen',
        it: 'Verifica rigorosa dei refusi nei nomi dei nodi',
        'zh-CN': '节点名称的严格拼写检查',
        ja: 'ノード名の表記ゆれを厳密にチェック'
      },
      tooltips: {
        en: 'If checked: two node labels that differ only by spaces, spacing around punctuation, case or accents make the load fail (the typo must be fixed in the file). If unchecked: the offending label is assimilated to the existing node and a warning is emitted.',
        fr: 'Si coché : deux libellés de nœud qui ne diffèrent que par des espaces, de la ponctuation, la casse ou les accents font échouer le chargement (la typo doit être corrigée dans le fichier). Si décoché : le libellé fautif est assimilé au nœud existant et un avertissement est émis.',
        es: 'Si está marcado: dos etiquetas de nodo que difieren solo por espacios, puntuación, mayúsculas o acentos hacen que la carga falle (la errata debe corregirse en el archivo). Si no está marcado: la etiqueta problemática se asimila al nodo existente y se emite una advertencia.',
        de: 'Wenn aktiviert: zwei Knotenbezeichnungen, die sich nur durch Leerzeichen, Interpunktion, Groß-/Kleinschreibung oder Akzente unterscheiden, lassen das Laden fehlschlagen (der Tippfehler muss in der Datei korrigiert werden). Wenn deaktiviert: die betroffene Bezeichnung wird dem vorhandenen Knoten zugeordnet und eine Warnung ausgegeben.',
        it: 'Se selezionato: due etichette di nodo che differiscono solo per spazi, punteggiatura, maiuscole/minuscole o accenti fanno fallire il caricamento (il refuso va corretto nel file). Se non selezionato: l\'etichetta problematica viene assimilata al nodo esistente e viene emesso un avviso.',
        'zh-CN': '若勾选：两个仅在空格、标点前后间距、大小写或重音上有差异的节点标签将导致加载失败（必须在文件中修正拼写）。若不勾选：有问题的标签会被并入已有节点，并发出警告。',
        ja: 'オンの場合：空白、句読点前後の間隔、大文字小文字、アクセントだけが異なる 2 つのノード名があると読み込みに失敗します（ファイル側で修正が必要です）。オフの場合：該当する名前は既存ノードに同一視され、警告が出ます。'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    autocorrect_typo: {
      group: 'autocorrection',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Auto-correct node name typos',
        fr: 'Auto-corriger les typos de noms de nœuds',
        es: 'Autocorregir las erratas en los nombres de nodos',
        de: 'Tippfehler in Knotennamen automatisch korrigieren',
        it: 'Correggere automaticamente i refusi nei nomi dei nodi',
        'zh-CN': '自动纠正节点名称拼写',
        ja: 'ノード名の表記ゆれを自動修正'
      },
      tooltips: {
        en: 'If checked (and "strict typo check" unchecked): labels assimilated to an existing node are corrected to the canonical name and highlighted in red on the corrected output. Otherwise: warning only, no highlight.',
        fr: 'Si coché (et « vérification stricte des typos » décochée) : les libellés assimilés à un nœud existant sont corrigés vers le nom canonique et surlignés en rouge sur la sortie corrigée. Sinon : simple avertissement sans surlignage.',
        es: 'Si está marcado (y "verificación estricta de erratas" desmarcada): las etiquetas asimiladas a un nodo existente se corrigen al nombre canónico y se resaltan en rojo en la salida corregida. De lo contrario: solo advertencia, sin resaltado.',
        de: 'Wenn aktiviert (und „strenge Tippfehlerprüfung“ deaktiviert): dem vorhandenen Knoten zugeordnete Bezeichnungen werden auf den kanonischen Namen korrigiert und in der korrigierten Ausgabe rot hervorgehoben. Andernfalls: nur Warnung, keine Hervorhebung.',
        it: 'Se selezionato (e "verifica rigorosa dei refusi" deselezionata): le etichette assimilate a un nodo esistente vengono corrette al nome canonico ed evidenziate in rosso nell\'output corretto. Altrimenti: solo avviso, senza evidenziazione.',
        'zh-CN': '若勾选（且未勾选“严格拼写检查”）：被并入已有节点的标签将被修正为规范名称，并在校正后的输出中以红色高亮。否则：仅发出警告，不高亮。',
        ja: 'オンの場合（かつ「表記ゆれの厳密チェック」がオフのとき）：既存ノードに同一視された名前を正規の名称に修正し、修正後の出力で赤く強調します。オフの場合：警告のみで強調はしません。'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' }
      ]
    } satisfies FormatAttributeConfig<boolean>
  },

  // =================== EXCEL ===================
  excel: {
    // Charger l'Excel dans la seule vue courante au lieu de réinitialiser tout
    // le diagramme. Visible (et coché par défaut) uniquement quand on est dans
    // une vue (drawing_area != maître) ; sur le diagramme principal l'import
    // remplace tout comme avant. Câblé dans le calcul de ``view_only`` du
    // chargement (PersistenceProcessDialog).
    only_current_view: {
      group: 'content',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Load only into the current view',
        fr: 'Charger seulement dans la vue courante',
        es: 'Cargar solo en la vista actual',
        de: 'Nur in die aktuelle Ansicht laden',
        it: 'Caricare solo nella vista corrente',
        'zh-CN': '仅加载到当前视图',
        ja: '現在のビューにのみ読み込む'
      },
      tooltips: {
        en: 'If checked: the Excel file is loaded into the current view only, without resetting the master diagram or the other views. If unchecked: loading replaces the whole diagram (all views).',
        fr: 'Si coché : le fichier Excel est chargé uniquement dans la vue courante, sans réinitialiser le diagramme maître ni les autres vues. Si décoché : le chargement remplace tout le diagramme (toutes les vues).',
        es: 'Si está marcado: el archivo Excel se carga solo en la vista actual, sin reiniciar el diagrama maestro ni las demás vistas. Si no está marcado: la carga reemplaza todo el diagrama (todas las vistas).',
        de: 'Wenn aktiviert: die Excel-Datei wird nur in die aktuelle Ansicht geladen, ohne das Master-Diagramm oder die anderen Ansichten zurückzusetzen. Wenn deaktiviert: das Laden ersetzt das gesamte Diagramm (alle Ansichten).',
        it: 'Se selezionato: il file Excel viene caricato solo nella vista corrente, senza reimpostare il diagramma master o le altre viste. Se non selezionato: il caricamento sostituisce l\'intero diagramma (tutte le viste).',
        'zh-CN': '若勾选：Excel 文件仅加载到当前视图，不重置主图或其他视图。若不勾选：加载将替换整个图表（所有视图）。',
        ja: 'オンの場合：Excel ファイルは現在のビューにだけ読み込まれ、マスターの図や他のビューはリセットされません。オフの場合：読み込みによって図全体（すべてのビュー）が置き換わります。'
      },
      visibilityConditions: [
        { type: 'custom', customCheck: (app_data) => app_data.drawing_area.id !== default_main_sankey_id }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    with_nodes_sheets: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheets nodes',
        fr: 'Onglets nœuds',
        es: 'Hojas de nodos',
        de: 'Knotenblätter',
        it: 'Fogli nodi',
        'zh-CN': '节点工作表',
        ja: 'ノードのシート'
      },
      tooltips: {
        en: 'Load nodes-related sheets from the Excel file. Uncheck to skip loading them.',
        fr: 'Charger les onglets liés aux nœuds depuis le fichier Excel. Décocher pour ne pas les charger.',
        es: 'Cargar las hojas relacionadas con los nodos desde el archivo Excel. Desmarcar para no cargarlas.',
        de: 'Knotenbezogene Blätter aus der Excel-Datei laden. Deaktivieren, um sie nicht zu laden.',
        it: 'Caricare i fogli relativi ai nodi dal file Excel. Deselezionare per non caricarli.',
        'zh-CN': '从 Excel 文件加载与节点相关的工作表。取消勾选则跳过加载。',
        ja: 'Excel ファイルからノード関連のシートを読み込みます。オフにすると読み込みません。'
      }
    } satisfies FormatAttributeConfig<boolean>,

    activate_data_table: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheet(s) data',
        fr: 'Onglet(s) données',
        es: 'Hoja(s) de datos',
        de: 'Datenblatt(blätter)',
        it: 'Foglio(i) dati',
        'zh-CN': '数据工作表',
        ja: 'データのシート'
      },
      tooltips: {
        en: 'Load DATA_SHEET table from the Excel file. Uncheck to skip loading it.',
        fr: 'Charger le tableau DATA_SHEET depuis le fichier Excel. Décocher pour ne pas le charger.',
        es: 'Cargar la tabla DATA_SHEET desde el archivo Excel. Desmarcar para no cargarla.',
        de: 'DATA_SHEET-Tabelle aus der Excel-Datei laden. Deaktivieren, um sie nicht zu laden.',
        it: 'Caricare la tabella DATA_SHEET dal file Excel. Deselezionare per non caricarla.',
        'zh-CN': '从 Excel 文件加载 DATA_SHEET 表。取消勾选则跳过加载。',
        ja: 'Excel ファイルから DATA_SHEET の表を読み込みます。オフにすると読み込みません。'
      }
    } satisfies FormatAttributeConfig<boolean>,

    activate_flux_matrix: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheet(s) SUT or IOT',
        fr: 'Onglet(s) TER ou TES',
        es: 'Hoja(s) SUT o IOT',
        de: 'Blatt(blätter) SUT oder IOT',
        it: 'Foglio(i) SUT o IOT',
        'zh-CN': 'SUT 或 IOT 工作表',
        ja: 'SUT または IOT のシート'
      },
      tooltips: {
        en: 'Load IO_SHEET / TER_SHEET table from the Excel file. Uncheck to skip loading it.',
        fr: 'Charger le tableau IO_SHEET / TER_SHEET depuis le fichier Excel. Décocher pour ne pas le charger.',
        es: 'Cargar la tabla IO_SHEET / TER_SHEET desde el archivo Excel. Desmarcar para no cargarla.',
        de: 'IO_SHEET / TER_SHEET-Tabelle aus der Excel-Datei laden. Deaktivieren, um sie nicht zu laden.',
        it: 'Caricare la tabella IO_SHEET / TER_SHEET dal file Excel. Deselezionare per non caricarla.',
        'zh-CN': '从 Excel 文件加载 IO_SHEET / TER_SHEET 表。取消勾选则跳过加载。',
        ja: 'Excel ファイルから IO_SHEET / TER_SHEET の表を読み込みます。オフにすると読み込みません。'
      }
    } satisfies FormatAttributeConfig<boolean>,

    layout: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheet layout',
        fr: 'Onglet mise en page',
        es: 'Hoja de diseño',
        de: 'Layout-Blatt',
        it: 'Foglio layout',
        'zh-CN': '布局工作表',
        ja: 'レイアウトのシート'
      },
      tooltips: {
        en: 'Load the hidden "layout" sheet (saved diagram positions and styles) from the Excel file. Uncheck to ignore the saved layout and recompute an automatic one.',
        fr: 'Charger l\'onglet caché « layout » (positions et styles du diagramme sauvegardés) depuis le fichier Excel. Décocher pour ignorer la mise en page sauvegardée et en recalculer une automatiquement.',
        es: 'Cargar la hoja oculta «layout» (posiciones y estilos del diagrama guardados) desde el archivo Excel. Desmarcar para ignorar el diseño guardado y recalcular uno automático.',
        de: 'Das versteckte „layout"-Blatt (gespeicherte Diagrammpositionen und -stile) aus der Excel-Datei laden. Deaktivieren, um das gespeicherte Layout zu ignorieren und ein automatisches neu zu berechnen.',
        it: 'Caricare il foglio nascosto «layout» (posizioni e stili del diagramma salvati) dal file Excel. Deselezionare per ignorare il layout salvato e ricalcolarne uno automatico.',
        'zh-CN': '从 Excel 文件加载隐藏的 “layout” 工作表（已保存的图表位置与样式）。取消勾选则忽略已保存的布局，并重新计算自动布局。',
        ja: 'Excel ファイルから隠しシート「layout」（保存された図の位置とスタイル）を読み込みます。オフにすると保存されたレイアウトを無視し、自動レイアウトを計算し直します。'
      }
    } satisfies FormatAttributeConfig<boolean>,

    // « Charger seulement la mise en page » : court-circuite tout le parse SEP
    // (nœuds/données/TER) côté serveur et charge directement le JSON complet
    // stocké dans l'onglet caché « layout », exactement comme l'ouverture d'un
    // fichier JSON (remplacement total, pas de réconciliation). Câblé serveur
    // (conversion_thread, short-circuit only_layout) + client (handleFinish →
    // app_data.fromJSON). Override les autres cases « Onglets lus ».
    only_layout: {
      group: 'sheets',
      breakBefore: true,
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Load only the layout (like a JSON)',
        fr: 'Charger seulement la mise en page (comme un JSON)',
        es: 'Cargar solo el diseño (como un JSON)',
        de: 'Nur das Layout laden (wie ein JSON)',
        it: 'Caricare solo il layout (come un JSON)',
        'zh-CN': '仅加载布局（如同 JSON）',
        ja: 'レイアウトのみ読み込む（JSON と同様）'
      },
      tooltips: {
        en: 'If checked: the structural sheets (nodes, data, SUT/IOT) are NOT parsed. Only the hidden "layout" sheet — which already stores a complete diagram — is read and loaded as-is, exactly like opening a JSON file. Fast, no reconciliation, and works even if the structural sheets contain errors. Requires the Excel to contain a layout sheet (i.e. it was exported from the app). The other "Read sheets" options above are ignored.',
        fr: 'Si coché : les onglets structurels (nœuds, données, TER/TES) ne sont PAS analysés. Seul l\'onglet caché « layout » — qui contient déjà un diagramme complet — est lu et chargé tel quel, exactement comme l\'ouverture d\'un fichier JSON. Rapide, sans réconciliation, et fonctionne même si les onglets structurels contiennent des erreurs. Nécessite que l\'Excel contienne un onglet layout (export depuis l\'application). Les autres options « Onglets lus » ci-dessus sont ignorées.',
        es: 'Si está marcado: las hojas estructurales (nodos, datos, SUT/IOT) NO se analizan. Solo se lee la hoja oculta «layout» —que ya contiene un diagrama completo— y se carga tal cual, exactamente como abrir un archivo JSON. Rápido, sin reconciliación, y funciona aunque las hojas estructurales tengan errores. Requiere que el Excel contenga una hoja layout (exportado desde la aplicación). Las demás opciones «Hojas leídas» anteriores se ignoran.',
        de: 'Wenn aktiviert: die strukturellen Blätter (Knoten, Daten, SUT/IOT) werden NICHT geparst. Nur das versteckte „layout"-Blatt — das bereits ein vollständiges Diagramm enthält — wird gelesen und unverändert geladen, genau wie das Öffnen einer JSON-Datei. Schnell, ohne Abgleich, und funktioniert auch wenn die strukturellen Blätter Fehler enthalten. Erfordert, dass die Excel-Datei ein layout-Blatt enthält (aus der Anwendung exportiert). Die anderen „Gelesene Blätter"-Optionen oben werden ignoriert.',
        it: 'Se selezionato: i fogli strutturali (nodi, dati, SUT/IOT) NON vengono analizzati. Viene letto solo il foglio nascosto «layout» — che contiene già un diagramma completo — e caricato così com\'è, esattamente come aprire un file JSON. Veloce, senza riconciliazione, e funziona anche se i fogli strutturali contengono errori. Richiede che l\'Excel contenga un foglio layout (esportato dall\'applicazione). Le altre opzioni «Fogli letti» sopra vengono ignorate.',
        'zh-CN': '若勾选：不解析结构工作表（节点、数据、SUT/IOT）。仅读取隐藏的 “layout” 工作表——其中已存有完整图表——并原样加载，效果与打开 JSON 文件完全相同。速度快、无需调和，即使结构工作表存在错误也可使用。要求 Excel 中包含 layout 工作表（即由本应用导出）。上方其他“读取的工作表”选项将被忽略。',
        ja: 'オンの場合：構造シート（ノード、データ、SUT/IOT）は解析しません。すでに完全な図を保持している隠しシート「layout」だけを読み、JSON ファイルを開くのとまったく同じようにそのまま読み込みます。高速で調和も不要、構造シートにエラーがあっても動作します。Excel に layout シートが含まれていること（つまり本アプリから書き出されたものであること）が前提です。上記の「読み込むシート」の他のオプションは無視されます。'
      },
      // Limité au chemin « ouverture » (excel → json). Le court-circuit serveur
      // n'écrit qu'un JSON ; en sortie excel (convertisseur) il lèverait une
      // erreur, donc on masque l'option dans ce contexte.
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'excel' },
        { type: 'optionProperty', property: '_output_format', operator: '==', value: 'json' }
      ]
    } satisfies FormatAttributeConfig<boolean>
  },

  // =================== JSON ===================
  json: {
    only_current_view: {
      group: 'content',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Only current view',
        fr: 'Seulement la vue courante',
        es: 'Solo la vista actual',
        de: 'Nur aktuelle Ansicht',
        it: 'Solo la vista corrente',
        'zh-CN': '仅当前视图',
        ja: '現在のビューのみ'
      },
      tooltips: {
        en: 'Load only the current view',
        fr: 'Charger seulement la vue courante',
        es: 'Cargar solo la vista actual',
        de: 'Nur die aktuelle Ansicht laden',
        it: 'Caricare solo la vista corrente',
        'zh-CN': '仅加载当前视图',
        ja: '現在のビューのみ読み込む'
      }
    } satisfies FormatAttributeConfig<boolean>
  },

  blob: {
    only_current_view: {
      group: 'content',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Only current view',
        fr: 'Seulement la vue courante',
        es: 'Solo la vista actual',
        de: 'Nur aktuelle Ansicht',
        it: 'Solo la vista corrente',
        'zh-CN': '仅当前视图',
        ja: '現在のビューのみ'
      },
      tooltips: {
        en: 'Only consider the current view of the in-memory Sankey',
        fr: 'Considérer seulement la vue courante du Sankey en mémoire',
        es: 'Considerar solo la vista actual del Sankey en memoria',
        de: 'Nur die aktuelle Ansicht des Sankey im Speicher berücksichtigen',
        it: 'Considerare solo la vista corrente del Sankey in memoria',
        'zh-CN': '仅考虑内存中桑基图的当前视图',
        ja: 'メモリ上のサンキーの現在のビューのみを対象とします'
      }
    } satisfies FormatAttributeConfig<boolean>
  },
  example_excel: {},
  example_json: {}
} as const

// Définir base en dehors
const BASE_OUTPUT_CONFIG: FormatConfigStructure = {

  // ``save_only_visible_elements`` n'apparaît que lorsque le format d'entrée
  // est ``blob`` (Sankey courant) — c'est à ce moment-là que la sélection
  // visible/invisible a un sens. La condition est évaluée via la clé
  // synthétique ``_input_format`` injectée dans mergedOptions par
  // AutoGeneratedOptions.
  save_only_visible_elements: {
    // Pas de ``group`` : rendu seul, au-dessus des sections nommées (cf. la
    // logique UNGROUPED de PersistenceProcessDialogOptions qui place les
    // attributs sans groupe en tête de liste).
    default: false,
    type: (() => false) as (() => boolean),
    labels: {
      en: 'Only save visible elements',
      fr: 'Enregistrer que les éléments visibles',
      es: 'Guardar solo los elementos visibles',
      de: 'Nur sichtbare Elemente speichern',
      it: 'Salva solo gli elementi visibili',
      'zh-CN': '仅保存可见元素',
      ja: '表示中の要素のみを保存'
    },
    tooltips: {
      en: 'Export only visible elements in the diagram',
      fr: 'Exporter uniquement les éléments visibles dans le diagramme',
      es: 'Exportar solo los elementos visibles en el diagrama',
      de: 'Nur sichtbare Elemente im Diagramm exportieren',
      it: 'Esportare solo gli elementi visibili nel diagramma',
      'zh-CN': '仅导出图表中可见的元素',
      ja: '図の中で表示されている要素のみをエクスポートします'
    },
    visibilityConditions: [
      { type: 'optionProperty', property: '_input_format', operator: '==', value: 'blob' }
    ]
  } satisfies FormatAttributeConfig<boolean>,

  // ============================ SOLVEUR (réconciliation MFA) ============================
  // Synthétique : `_solver_options_enabled` est injecté par AutoGeneratedOptions
  // depuis le dialogue parent uniquement quand le converter actif cible le
  // solveur de réconciliation. Les options ci-dessous ne sont matérialisées dans
  // FormData que si le dialogue les rend visibles (cf. PersistenceProcessDialog).
  enable_uncertainty: {
    group: 'solver',
    default: false,
    type: (() => false) as (() => boolean),
    labels: {
      en: 'Enable Monte-Carlo',
      fr: 'Activer Monte-Carlo',
      es: 'Activar Monte-Carlo',
      de: 'Monte-Carlo aktivieren',
      it: 'Attivare Monte-Carlo',
      'zh-CN': '启用蒙特卡洛',
      ja: 'モンテカルロを有効にする'
    },
    tooltips: {
      en: 'Run a Monte-Carlo simulation around the reconciled point to propagate input uncertainties.',
      fr: 'Lancer une simulation Monte-Carlo autour du point réconcilié pour propager les incertitudes des entrées.',
      es: 'Ejecutar una simulación Monte-Carlo alrededor del punto reconciliado para propagar las incertidumbres de las entradas.',
      de: 'Eine Monte-Carlo-Simulation um den abgestimmten Punkt herum durchführen, um die Unsicherheiten der Eingaben zu propagieren.',
      it: 'Eseguire una simulazione Monte-Carlo attorno al punto riconciliato per propagare le incertezze degli input.',
      'zh-CN': '在调和结果附近运行蒙特卡洛模拟，以传播输入的不确定性。',
      ja: '調和後の点の周辺でモンテカルロシミュレーションを実行し、入力の不確実性を伝播させます。'
    },
    visibilityConditions: [
      { type: 'optionProperty', property: '_solver_options_enabled', operator: '==', value: true }
    ]
  } satisfies FormatAttributeConfig<boolean>,

  nb_realisations: {
    group: 'solver',
    default: 100,
    type: (() => 100) as (() => number),
    labels: {
      en: 'Number of realisations',
      fr: 'Nombre de réalisations',
      es: 'Número de realizaciones',
      de: 'Anzahl der Realisierungen',
      it: 'Numero di realizzazioni',
      'zh-CN': '抽样次数',
      ja: '試行回数'
    },
    tooltips: {
      en: 'How many Monte-Carlo realisations to draw around the reconciled point.',
      fr: 'Nombre de réalisations Monte-Carlo tirées autour du point réconcilié.',
      es: 'Número de realizaciones Monte-Carlo extraídas alrededor del punto reconciliado.',
      de: 'Anzahl der um den abgestimmten Punkt herum gezogenen Monte-Carlo-Realisierungen.',
      it: 'Numero di realizzazioni Monte-Carlo estratte attorno al punto riconciliato.',
      'zh-CN': '在调和结果附近抽取的蒙特卡洛样本数量。',
      ja: '調和後の点の周辺で行うモンテカルロの試行回数。'
    },
    visibilityConditions: [
      { type: 'optionProperty', property: '_solver_options_enabled', operator: '==', value: true },
      { type: 'optionProperty', property: 'enable_uncertainty', operator: '==', value: true }
    ]
  } satisfies FormatAttributeConfig<number>,

  record_simulations: {
    group: 'solver',
    default: false,
    type: (() => true) as (() => boolean),
    labels: {
      en: 'Record simulations in output',
      fr: 'Enregistrer les simulations dans le fichier de sortie',
      es: 'Registrar las simulaciones en el archivo de salida',
      de: 'Simulationen in der Ausgabedatei speichern',
      it: 'Registrare le simulazioni nel file di output',
      'zh-CN': '在输出中记录模拟结果',
      ja: 'シミュレーション結果を出力に記録'
    },
    tooltips: {
      en: 'Persist every Monte-Carlo realisation in the output file (one column per draw, one row per flow). Off by default — the sheet can blow up to 1000+ columns.',
      fr: 'Persister chaque réalisation Monte-Carlo dans le fichier de sortie (une colonne par tirage, une ligne par flux). Désactivé par défaut — l\'onglet peut faire 1000+ colonnes.',
      es: 'Persistir cada realización Monte-Carlo en el archivo de salida (una columna por tirada, una fila por flujo). Desactivado por defecto — la hoja puede tener más de 1000 columnas.',
      de: 'Jede Monte-Carlo-Realisierung in der Ausgabedatei speichern (eine Spalte pro Ziehung, eine Zeile pro Fluss). Standardmäßig deaktiviert — das Blatt kann 1000+ Spalten haben.',
      it: 'Persistere ogni realizzazione Monte-Carlo nel file di output (una colonna per estrazione, una riga per flusso). Disattivato per impostazione predefinita — il foglio può avere 1000+ colonne.',
      'zh-CN': '将每一次蒙特卡洛抽样保存到输出文件中（每次抽样一列，每条流量一行）。默认关闭——该工作表可能膨胀到 1000 列以上。',
      ja: 'モンテカルロの各試行を出力ファイルに保存します（試行ごとに 1 列、フローごとに 1 行）。既定ではオフです — シートが 1000 列を超えることがあります。'
    },
    visibilityConditions: [
      { type: 'optionProperty', property: '_solver_options_enabled', operator: '==', value: true },
      { type: 'optionProperty', property: 'enable_uncertainty', operator: '==', value: true }
    ]
  } satisfies FormatAttributeConfig<boolean>,

  debug_mode: {
    group: 'solver',
    default: false,
    type: (() => false) as (() => boolean),
    labels: {
      en: 'Debug mode (Ai table + constraints_summary.txt)',
      fr: 'Mode debug (table Ai + constraints_summary.txt)',
      es: 'Modo debug (tabla Ai + constraints_summary.txt)',
      de: 'Debug-Modus (Ai-Tabelle + constraints_summary.txt)',
      it: 'Modalità debug (tabella Ai + constraints_summary.txt)',
      'zh-CN': '调试模式（Ai 表 + constraints_summary.txt）',
      ja: 'デバッグモード（Ai 表 + constraints_summary.txt）'
    },
    tooltips: {
      en: 'Add the Ai constraint matrix sheet and write a constraints_summary.txt next to the output file.',
      fr: 'Ajouter la feuille de la matrice de contraintes Ai et écrire un fichier constraints_summary.txt à côté de la sortie.',
      es: 'Añadir la hoja de la matriz de restricciones Ai y escribir un archivo constraints_summary.txt junto a la salida.',
      de: 'Das Ai-Beschränkungsmatrix-Blatt hinzufügen und eine Datei constraints_summary.txt neben der Ausgabe schreiben.',
      it: 'Aggiungere il foglio della matrice di vincoli Ai e scrivere un file constraints_summary.txt accanto all\'output.',
      'zh-CN': '添加 Ai 约束矩阵工作表，并在输出文件旁写入 constraints_summary.txt。',
      ja: 'Ai 制約行列のシートを追加し、出力ファイルの隣に constraints_summary.txt を書き出します。'
    },
    visibilityConditions: [
      { type: 'optionProperty', property: '_solver_options_enabled', operator: '==', value: true }
    ]
  } satisfies FormatAttributeConfig<boolean>,

  with_reconciled: {
    group: 'solver',
    default: true,
    type: (() => true) as (() => boolean),
    labels: {
      en: 'Reconcile',
      fr: 'Réconcilier',
      es: 'Reconciliar',
      de: 'Abgleichen',
      it: 'Riconciliare',
      'zh-CN': '调和',
      ja: '調和'
    },
    tooltips: {
      en: 'Run the standard reconciliation pass. Measured values may be adjusted to satisfy all mass balances.',
      fr: 'Lance la passe de réconciliation standard. Les valeurs mesurées peuvent être ajustées pour satisfaire tous les bilans matière.',
      es: 'Ejecuta la pasada de reconciliación estándar. Los valores medidos pueden ajustarse para satisfacer todos los balances de masa.',
      de: 'Führt den Standardabgleich aus. Messwerte können angepasst werden, damit alle Massenbilanzen erfüllt sind.',
      it: 'Esegue la riconciliazione standard. I valori misurati possono essere modificati per soddisfare tutti i bilanci di massa.',
      'zh-CN': '运行标准调和流程。实测值可能会被调整以满足所有质量平衡。',
      ja: '標準の調和処理を実行します。すべての物質収支を満たすため、実測値が調整されることがあります。'
    },
    visibilityConditions: [
      { type: 'optionProperty', property: '_solver_options_enabled', operator: '==', value: true }
    ]
  } satisfies FormatAttributeConfig<boolean>,

  with_completed: {
    group: 'solver',
    default: false,
    type: (() => false) as (() => boolean),
    labels: {
      en: 'Complete (no-redundancy)',
      fr: 'Compléter (sans redondance)',
      es: 'Completar (sin redundancia)',
      de: 'Vervollständigen (ohne Redundanz)',
      it: 'Completare (senza ridondanza)',
      'zh-CN': '补全（无冗余）',
      ja: '補完（冗長性なし）'
    },
    tooltips: {
      en: 'Add a "Completed value" column to the analysis sheet: redundant balance constraints are dropped, measured values are preserved as-is, and only unknown flows are filled in.',
      fr: 'Ajoute une colonne « Valeur complétée » à la feuille d\'analyse : les bilans redondants sont retirés, les valeurs mesurées sont conservées telles quelles et seuls les flux inconnus sont complétés.',
      es: 'Añade una columna "Valor completado" a la hoja de análisis: se eliminan las restricciones redundantes, los valores medidos se conservan tal cual y solo se completan los flujos desconocidos.',
      de: 'Fügt der Analyseblatt eine Spalte „Vervollständigter Wert" hinzu: redundante Bilanzgleichungen werden entfernt, Messwerte bleiben unverändert und nur unbekannte Flüsse werden ergänzt.',
      it: 'Aggiunge una colonna « Valore completato » al foglio di analisi: i vincoli di bilancio ridondanti vengono rimossi, i valori misurati sono mantenuti invariati e vengono completati solo i flussi sconosciuti.',
      'zh-CN': '在分析工作表中添加“补全值”列：剔除冗余的平衡约束，实测值保持原样，仅补算未知流量。',
      ja: '分析シートに「補完値」の列を追加します：冗長な収支制約は除外され、実測値はそのまま保持され、未知のフローのみが補完されます。'
    },
    visibilityConditions: [
      { type: 'optionProperty', property: '_solver_options_enabled', operator: '==', value: true }
    ]
  } satisfies FormatAttributeConfig<boolean>,

  skip_rref: {
    group: 'solver',
    default: false,
    type: (() => false) as (() => boolean),
    labels: {
      en: 'Skip RREF (raw constraint matrix)',
      fr: 'Ignorer la RREF (matrice de contraintes brute)',
      es: 'Omitir RREF (matriz de restricciones bruta)',
      de: 'RREF überspringen (rohe Beschränkungsmatrix)',
      it: 'Saltare RREF (matrice di vincoli grezza)',
      'zh-CN': '跳过 RREF（原始约束矩阵）',
      ja: 'RREF を省略（生の制約行列）'
    },
    tooltips: {
      en: 'Skip the RREF / variable-classification preprocessing and minimise directly on the raw constraint matrix. Faster on large models. Disables interval computation and the redundant/determinable/free distinction (variables are tagged `mesuré` or `brut`). Incompatible with Monte-Carlo uncertainty analysis.',
      fr: 'Ignorer le prétraitement RREF / classification des variables et minimiser directement sur la matrice de contraintes brute. Plus rapide sur les gros modèles. Désactive le calcul d\'intervalles et la distinction redondant/déterminé/libre (les variables sont étiquetées `mesuré` ou `brut`). Incompatible avec l\'analyse Monte-Carlo.',
      es: 'Omitir el preprocesamiento RREF / clasificación de variables y minimizar directamente sobre la matriz de restricciones bruta. Más rápido en modelos grandes. Desactiva el cálculo de intervalos y la distinción redundante/determinable/libre (las variables se etiquetan `mesuré` o `brut`). Incompatible con el análisis Monte-Carlo.',
      de: 'Die RREF-Vorverarbeitung / Variablenklassifizierung überspringen und direkt auf der rohen Beschränkungsmatrix minimieren. Schneller bei großen Modellen. Deaktiviert die Intervallberechnung und die Unterscheidung zwischen redundant/bestimmbar/frei (Variablen werden als `mesuré` oder `brut` gekennzeichnet). Inkompatibel mit der Monte-Carlo-Analyse.',
      it: 'Saltare la preelaborazione RREF / classificazione delle variabili e minimizzare direttamente sulla matrice di vincoli grezza. Più veloce sui modelli grandi. Disabilita il calcolo degli intervalli e la distinzione tra ridondante/determinabile/libero (le variabili sono etichettate `mesuré` o `brut`). Incompatibile con l\'analisi Monte-Carlo.',
      'zh-CN': '跳过 RREF / 变量分类预处理，直接在原始约束矩阵上进行最小化。在大型模型上更快。会禁用区间计算以及冗余/可确定/自由变量的区分（变量被标记为 `mesuré` 或 `brut`）。与蒙特卡洛不确定性分析不兼容。',
      ja: 'RREF／変数分類の前処理を省略し、生の制約行列で直接最小化します。大きなモデルでは高速です。区間の計算と、冗長／確定可能／自由の区別は無効になります（変数は `mesuré` または `brut` と付けられます）。モンテカルロによる不確実性分析とは併用できません。'
    },
    visibilityConditions: [
      { type: 'optionProperty', property: '_solver_options_enabled', operator: '==', value: true }
    ]
  } satisfies FormatAttributeConfig<boolean>,

  example_excel: {},
  example_json: {}
} as const

export const OUTPUT_ATTRIBUTES_CONFIG: FormatConfigStructure = {
  base: {
    ...BASE_OUTPUT_CONFIG,
  },
  excel: {
    keep_other_sheets: {
      group: 'merge',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Keep other sheets from input',
        fr: 'Conserver les autres onglets du fichier d\'entrée',
        es: 'Conservar las otras hojas del archivo de entrada',
        de: 'Andere Blätter aus der Eingabedatei beibehalten',
        it: 'Mantenere gli altri fogli del file di input',
        'zh-CN': '保留输入文件中的其他工作表',
        ja: '入力の他のシートを残す'
      },
      tooltips: {
        en: 'Copy sheets from the input Excel file that are not part of the SankeyExcelParser format into the output file. Only relevant when input is Excel.',
        fr: 'Copier les onglets du fichier Excel d\'entrée qui ne font pas partie du format SankeyExcelParser dans le fichier de sortie. Uniquement pertinent si l\'entrée est Excel.',
        es: 'Copiar las hojas del archivo Excel de entrada que no forman parte del formato SankeyExcelParser en el archivo de salida. Solo relevante si la entrada es Excel.',
        de: 'Blätter aus der Excel-Eingabedatei, die nicht zum SankeyExcelParser-Format gehören, in die Ausgabedatei kopieren. Nur relevant, wenn die Eingabe Excel ist.',
        it: 'Copiare i fogli del file Excel di input che non fanno parte del formato SankeyExcelParser nel file di output. Rilevante solo se l\'input è Excel.',
        'zh-CN': '将输入 Excel 文件中不属于 SankeyExcelParser 格式的工作表复制到输出文件。仅当输入为 Excel 时有意义。',
        ja: '入力 Excel ファイルのうち SankeyExcelParser の形式に属さないシートを出力ファイルにコピーします。入力が Excel のときのみ意味があります。'
      }
    } satisfies FormatAttributeConfig<boolean>,

    rewrite_format_sheets: {
      group: 'merge',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Rewrite OpenSankey-specific sheets',
        fr: 'Réécrire les onglets spécifiques OpenSankey',
        es: 'Reescribir las hojas específicas de OpenSankey',
        de: 'OpenSankey-spezifische Blätter neu schreiben',
        it: 'Riscrivere i fogli specifici di OpenSankey',
        'zh-CN': '重写 OpenSankey 专有工作表',
        ja: 'OpenSankey 固有のシートを書き直す'
      },
      tooltips: {
        en: 'Write SankeyExcelParser-format sheets (nodes, data, IO/TER, tags, layout, ...) to the output. Uncheck to leave the ones already present in the input file untouched; sheets not yet in the file (e.g. post-solver results) are still written. Has no effect on a fresh output — only meaningful when keeping other sheets from the input.',
        fr: 'Écrire les onglets du format SankeyExcelParser (nœuds, données, IO/TER, tags, mise en page, ...) dans la sortie. Décocher pour laisser intacts ceux déjà présents dans le fichier d\'entrée ; les onglets nouveaux (pas encore dans le fichier, ex : résultats post-solveur) restent écrits. Sans effet sur une sortie vierge — utile uniquement si on conserve les autres onglets de l\'entrée.',
        es: 'Escribir las hojas del formato SankeyExcelParser (nodos, datos, IO/TER, etiquetas, diseño, ...) en la salida. Desmarcar para dejar intactas las que ya están presentes en el archivo de entrada; las hojas aún no presentes en el archivo (p. ej. resultados tras el solver) se siguen escribiendo. Sin efecto en una salida nueva — útil solo si se conservan las otras hojas de la entrada.',
        de: 'SankeyExcelParser-Format-Blätter (Knoten, Daten, IO/TER, Tags, Layout, ...) in die Ausgabe schreiben. Deaktivieren, um die bereits in der Eingabedatei vorhandenen unverändert zu lassen; noch nicht in der Datei enthaltene Blätter (z. B. Ergebnisse nach dem Solver) werden weiterhin geschrieben. Ohne Wirkung bei einer neuen Ausgabe — nur sinnvoll, wenn andere Blätter aus der Eingabe behalten werden.',
        it: 'Scrivere i fogli del formato SankeyExcelParser (nodi, dati, IO/TER, tag, layout, ...) nell\'output. Deselezionare per lasciare intatti quelli già presenti nel file di input; i fogli non ancora presenti nel file (es. risultati dopo il solver) vengono comunque scritti. Nessun effetto su un output nuovo — utile solo se si mantengono gli altri fogli dell\'input.',
        'zh-CN': '将 SankeyExcelParser 格式的工作表（节点、数据、IO/TER、标签、布局……）写入输出。取消勾选则保持输入文件中已有的工作表不变；文件中尚不存在的工作表（如求解后的结果）仍会写入。对全新的输出没有影响——仅在保留输入的其他工作表时才有意义。',
        ja: 'SankeyExcelParser 形式のシート（ノード、データ、IO/TER、タグ、レイアウトなど）を出力に書き出します。オフにすると、入力ファイルにすでにあるシートはそのまま残します。ファイルにまだないシート（ソルバー実行後の結果など）は引き続き書き出されます。新規の出力には影響しません — 入力の他のシートを残す場合にのみ意味があります。'
      }
    } satisfies FormatAttributeConfig<boolean>,

    preserve_extra_columns: {
      group: 'merge',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Preserve user-added columns',
        fr: 'Préserver les colonnes additionnelles',
        es: 'Preservar las columnas añadidas',
        de: 'Benutzerdefinierte Spalten beibehalten',
        it: 'Conservare le colonne aggiunte',
        'zh-CN': '保留用户添加的列',
        ja: 'ユーザーが追加した列を保持'
      },
      tooltips: {
        en: 'Best-effort: columns present in the input file but unknown to SankeyExcelParser are stashed at read time and re-added to the regenerated sheets via a left-join on the natural row key (e.g. constraint ID, node name, origin/destination). Rows added by the solver get empty cells; deleted rows lose their values; renamed keys break the join. Toggled at write time but propagated to the read phase server-side so the stash can happen.',
        fr: 'Best-effort : les colonnes présentes dans le fichier d\'entrée et inconnues de SankeyExcelParser sont mémorisées à la lecture puis réintroduites dans les feuilles régénérées via une jointure sur la clé naturelle de chaque ligne (ex : ID de contrainte, nom de nœud, origine/destination). Les lignes ajoutées par le solveur sortent avec des cellules vides ; les lignes supprimées perdent leurs valeurs ; un renommage de clé casse la jointure. Décidée à l\'écriture mais propagée côté serveur à la phase de lecture pour que la mémorisation puisse avoir lieu.',
        es: 'Best-effort: las columnas presentes en el archivo de entrada pero desconocidas para SankeyExcelParser se almacenan al leer y se reintroducen en las hojas regeneradas mediante un left-join sobre la clave natural de cada fila. Las filas añadidas por el solver tienen celdas vacías; las eliminadas pierden sus valores; los renombres rompen la unión.',
        de: 'Best-effort: Spalten, die in der Eingabedatei vorhanden, aber SankeyExcelParser unbekannt sind, werden beim Lesen zwischengespeichert und in den neu erzeugten Blättern über einen Left-Join auf den natürlichen Zeilenschlüssel wiederhergestellt. Vom Solver hinzugefügte Zeilen erhalten leere Zellen; gelöschte Zeilen verlieren ihre Werte; Umbenennungen brechen den Join.',
        it: 'Best-effort: le colonne presenti nel file di input ma sconosciute a SankeyExcelParser vengono memorizzate alla lettura e reinserite nei fogli rigenerati tramite un left-join sulla chiave naturale di ciascuna riga. Le righe aggiunte dal solver escono con celle vuote; le righe eliminate perdono i loro valori; i rinominamenti rompono il join.',
        'zh-CN': '尽力而为：输入文件中存在但 SankeyExcelParser 不认识的列会在读取时暂存，并通过按自然行键（如约束 ID、节点名称、起点/终点）左连接重新添加到重新生成的工作表中。求解器新增的行将得到空单元格；被删除的行会丢失其值；键被重命名则连接失效。该选项在写入时切换，但会在服务端传播到读取阶段，以便完成暂存。',
        ja: 'ベストエフォート：入力ファイルにあるが SankeyExcelParser が知らない列を読み込み時に退避し、行の自然キー（制約 ID、ノード名、始点／終点など）での左結合により、再生成したシートへ戻します。ソルバーが追加した行のセルは空になり、削除された行の値は失われ、キーの名称変更で結合は壊れます。書き出し時に切り替えますが、退避のためサーバー側で読み込み段階にも伝えられます。'
      }
    } satisfies FormatAttributeConfig<boolean>,

    with_sheet_formating: {
      group: 'merge',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheet formatting',
        fr: 'Formattage des onglets',
        es: 'Formato de hojas',
        de: 'Blattformatierung',
        it: 'Formattazione fogli',
        'zh-CN': '工作表格式化',
        ja: 'シートの書式設定'
      },
      tooltips: {
        en: 'Activate auto formatting and colorizing of sheets',
        fr: 'Activer le formatage automatique et la colorisation des feuilles',
        es: 'Activar el formato y coloreado automático de las hojas',
        de: 'Automatische Formatierung und Einfärbung der Blätter aktivieren',
        it: 'Attivare la formattazione automatica e la colorazione dei fogli',
        'zh-CN': '启用工作表的自动格式化与着色',
        ja: 'シートの自動書式設定と着色を有効にします'
      }
    } satisfies FormatAttributeConfig<boolean>,

    with_index_sheet: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Index sheet',
        fr: 'Onglet Index',
        es: 'Hoja Índice',
        de: 'Index-Blatt',
        it: 'Foglio Index',
        'zh-CN': '索引工作表',
        ja: 'Index シート'
      },
      tooltips: {
        en: 'Write an Index sheet listing all written sheets with their type and options. Required for the file to be re-loaded in Index-driven mode. When the input file already had an Index, the user\'s original column labels and Type/Options values are preserved automatically.',
        fr: 'Écrire un onglet Index qui liste toutes les feuilles écrites avec leur type et leurs options. Nécessaire pour pouvoir recharger le fichier en mode Index-driven. Quand le fichier d\'entrée avait déjà un Index, les libellés de colonnes et les valeurs Type/Options de l\'utilisateur sont préservés automatiquement.',
        es: 'Escribir una hoja Índice que enumera todas las hojas escritas con su tipo y opciones. Necesaria para poder recargar el archivo en modo Index-driven. Cuando el archivo de entrada ya tenía un Índice, las etiquetas de columnas y los valores Type/Options del usuario se preservan automáticamente.',
        de: 'Ein Index-Blatt schreiben, das alle geschriebenen Blätter mit Typ und Optionen auflistet. Erforderlich, um die Datei im Index-driven-Modus neu zu laden. Wenn die Eingabedatei bereits einen Index hatte, werden die ursprünglichen Spaltenbeschriftungen und Type/Options-Werte des Benutzers automatisch beibehalten.',
        it: 'Scrivere un foglio Index che elenca tutti i fogli scritti con il loro tipo e le loro opzioni. Necessario per poter ricaricare il file in modalità Index-driven. Quando il file di input aveva già un Index, le etichette delle colonne e i valori Type/Options dell\'utente vengono preservati automaticamente.',
        'zh-CN': '写入一个 Index 工作表，列出所有已写入的工作表及其类型与选项。以索引驱动模式重新加载文件时必须有它。当输入文件已有 Index 时，用户原有的列标签及 Type/Options 值会被自动保留。',
        ja: '書き出したすべてのシートを、その種別とオプションとともに一覧する Index シートを書き出します。Index 主導モードでファイルを読み直すために必要です。入力ファイルにすでに Index があった場合、ユーザー独自の列ラベルと Type/Options の値は自動的に保持されます。'
      }
    } satisfies FormatAttributeConfig<boolean>,

    with_description_sheet: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Read-me sheet',
        fr: 'Onglet Lisez-moi',
        es: 'Hoja Léeme',
        de: 'Lies-mich-Blatt',
        it: 'Foglio Leggimi',
        'zh-CN': 'Read-me 工作表',
        ja: 'Read-me シート'
      },
      tooltips: {
        en: 'Write a contextual Read-me sheet (placed first in the workbook) that documents only the sheets and columns actually present, with hyperlinks to the full online documentation for everything not listed inline. Purely decorative — ignored at re-load.',
        fr: 'Écrire un onglet Lisez-moi contextuel (placé en première position du classeur) qui ne documente que les feuilles et colonnes effectivement présentes, avec des hyperliens vers la documentation complète en ligne pour tout ce qui n\'est pas listé. Purement décoratif — ignoré au rechargement.',
        es: 'Escribir una hoja Léeme contextual (situada en primera posición del libro) que solo documenta las hojas y columnas realmente presentes, con hiperenlaces a la documentación completa en línea para todo lo demás. Puramente decorativa — ignorada al recargar.',
        de: 'Ein kontextuelles Lies-mich-Blatt schreiben (an erster Stelle der Arbeitsmappe), das nur die tatsächlich vorhandenen Blätter und Spalten dokumentiert, mit Hyperlinks zur vollständigen Online-Dokumentation für alles Übrige. Rein dekorativ — beim erneuten Laden ignoriert.',
        it: 'Scrivere un foglio Leggimi contestuale (posto in prima posizione nella cartella) che documenta solo i fogli e le colonne effettivamente presenti, con collegamenti ipertestuali alla documentazione completa online per tutto il resto. Puramente decorativo — ignorato al ricaricamento.',
        'zh-CN': '写入一个上下文相关的 Read-me 工作表（置于工作簿最前），仅记录实际存在的工作表与列，并为其中未列出的内容提供指向完整在线文档的超链接。纯装饰性——重新加载时会被忽略。',
        ja: '実際に存在するシートと列だけを説明する Read-me シートを（ブックの先頭に）書き出します。そこに載らない内容には、オンライン文書へのリンクを付けます。純粋な装飾で、読み直しの際は無視されます。'
      }
    } satisfies FormatAttributeConfig<boolean>,

    layout: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Sheet layout',
        fr: 'Onglet mise en page',
        es: 'Hoja de diseño',
        de: 'Layout-Blatt',
        it: 'Foglio layout',
        'zh-CN': '布局工作表',
        ja: 'レイアウトのシート'
      },
      tooltips: {
        en: 'Sheet containing diagram layout',
        fr: 'Onglet qui contient la mise en page du diagramme',
        es: 'Hoja que contiene el diseño del diagrama',
        de: 'Blatt mit dem Diagramm-Layout',
        it: 'Foglio contenente il layout del diagramma',
        'zh-CN': '包含图表布局的工作表',
        ja: '図のレイアウトを含むシート'
      }
    } satisfies FormatAttributeConfig<boolean>,

    with_nodes_sheets: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      breakBefore: true,
      labels: {
        en: 'Sheets nodes',
        fr: 'Onglets nœuds',
        es: 'Hojas de nodos',
        de: 'Knotenblätter',
        it: 'Fogli nodi',
        'zh-CN': '节点工作表',
        ja: 'ノードのシート'
      },
      tooltips: {
        en: 'Activate writing of nodes related sheets',
        fr: 'Activer l\'écriture des feuilles liées aux nœuds',
        es: 'Activar la escritura de las hojas relacionadas con los nodos',
        de: 'Schreiben von knotenbezogenen Blättern aktivieren',
        it: 'Attivare la scrittura dei fogli relativi ai nodi',
        'zh-CN': '启用写入与节点相关的工作表',
        ja: 'ノード関連のシートの書き出しを有効にします'
      }
    } satisfies FormatAttributeConfig<boolean>,

    nodes_sheet_format: {
      group: 'sheets',
      default: 'auto',
      type: (() => 'auto') as (() => string),
      labels: {
        en: 'Nodes sheet format',
        fr: 'Format',
        es: 'Formato de las hojas de nodos',
        de: 'Format der Knotenblätter',
        it: 'Formato dei fogli nodi',
        'zh-CN': '节点工作表格式',
        ja: 'ノードシートの形式'
      },
      tooltips: {
        en: 'Layout of the node-definition sheet(s). "Automatic" keeps the historical behavior (single nodes sheet, split into Products/Sectors/Exchanges when the node-type tag is present). The other choices force a specific layout.',
        fr: 'Disposition de la (des) feuille(s) de définition des nœuds. « Automatique » conserve le comportement historique (feuille nœuds unique, séparée en Produits/Secteurs/Échanges si le tag de type de nœud est présent). Les autres choix forcent une disposition précise.',
        es: 'Disposición de la(s) hoja(s) de definición de nodos. «Automático» mantiene el comportamiento histórico (hoja única de nodos, dividida en Productos/Sectores/Intercambios si está presente la etiqueta de tipo de nodo). Las demás opciones fuerzan una disposición concreta.',
        de: 'Layout der Knotendefinitionsblätter. „Automatisch" behält das bisherige Verhalten bei (einzelnes Knotenblatt, aufgeteilt in Produkte/Sektoren/Austausch, wenn das Knotentyp-Tag vorhanden ist). Die anderen Optionen erzwingen ein bestimmtes Layout.',
        it: 'Disposizione del(i) foglio(i) di definizione dei nodi. «Automatico» mantiene il comportamento storico (foglio nodi unico, suddiviso in Prodotti/Settori/Scambi se è presente il tag tipo di nodo). Le altre scelte forzano una disposizione specifica.',
        'zh-CN': '节点定义工作表的布局。“自动”保持历史行为（单个节点工作表，当存在节点类型标签时拆分为产品/部门/交换）。其他选项则强制指定布局。',
        ja: 'ノード定義シートのレイアウト。「自動」は従来の動作を維持します（単一のノードシート。ノード種別タグがある場合は 製品／部門／交換 に分割）。他の選択肢は特定のレイアウトを強制します。'
      },
      selectOptions: [
        {
          value: 'auto',
          labels: {
            en: 'Automatic (by node-type tag)',
            fr: 'Automatique (selon le tag type de nœud)',
            es: 'Automático (según la etiqueta de tipo de nodo)',
            de: 'Automatisch (nach Knotentyp-Tag)',
            it: 'Automatico (in base al tag tipo di nodo)',
            'zh-CN': '自动（按节点类型标签）',
            ja: '自動（ノード種別タグによる）'
          }
        },
        {
          value: 'nodes',
          labels: {
            en: 'Single nodes sheet',
            fr: 'Feuille nœuds unique',
            es: 'Hoja única de nodos',
            de: 'Einzelnes Knotenblatt',
            it: 'Foglio nodi unico',
            'zh-CN': '单个节点工作表',
            ja: '単一のノードシート'
          }
        },
        {
          value: 'products_sectors',
          labels: {
            en: 'Products / Sectors / Exchanges',
            fr: 'Produits / Secteurs / Échanges',
            es: 'Productos / Sectores / Intercambios',
            de: 'Produkte / Sektoren / Austausch',
            it: 'Prodotti / Settori / Scambi',
            'zh-CN': '产品 / 部门 / 交换',
            ja: '製品 / 部門 / 交換'
          }
        },
        {
          value: 'nodes_agg',
          labels: {
            en: 'Aggregated nodes (nodes agg)',
            fr: 'Nœuds agrégés (nodes agg)',
            es: 'Nodos agregados (nodes agg)',
            de: 'Aggregierte Knoten (nodes agg)',
            it: 'Nodi aggregati (nodes agg)',
            'zh-CN': '聚合节点（nodes agg）',
            ja: '集約ノード（nodes agg）'
          }
        }
      ],
      visibilityConditions: [
        { type: 'optionProperty', property: 'with_nodes_sheets', operator: '==', value: true }
      ]
    } satisfies FormatAttributeConfig<string>,

    activate_data_table: {
      group: 'sheets',
      default: true,
      type: (() => true) as (() => boolean),
      breakBefore: true,
      labels: {
        en: 'Sheet(s) data',
        fr: 'Onglet(s) données',
        es: 'Hoja(s) de datos',
        de: 'Datenblatt(blätter)',
        it: 'Foglio(i) dati',
        'zh-CN': '数据工作表',
        ja: 'データのシート'
      },
      tooltips: {
        en: 'Activate writing of DATA_SHEET table',
        fr: 'Activer l\'écriture du tableau DATA_SHEET',
        es: 'Activar la escritura de la tabla DATA_SHEET',
        de: 'Schreiben der DATA_SHEET-Tabelle aktivieren',
        it: 'Attivare la scrittura della tabella DATA_SHEET',
        'zh-CN': '启用写入 DATA_SHEET 表',
        ja: 'DATA_SHEET の表の書き出しを有効にします'
      },
      // [SA #136] Forced ON when the TER/IO sheet is unchecked, otherwise
      // propagated/auto-corrected flux would have nowhere to live in the
      // output (and the red highlight would have nothing to color).
      disabledConditions: [
        { type: 'optionProperty', property: 'activate_flux_matrix', operator: '==', value: false },
      ],
      forcedValueWhenDisabled: true,
      disabledTooltip: {
        en: 'Forced on: when the TER/IO sheet is off, the data sheet must hold every flux so propagated/corrected flux remain visible.',
        fr: 'Forcé activé : quand l\'onglet TER/TES est décoché, l\'onglet données doit contenir tous les flux pour que les flux propagés/corrigés restent visibles.',
        es: 'Forzado activado: cuando la hoja TER/IO está desactivada, la hoja de datos debe contener todos los flujos para que los flujos propagados/corregidos permanezcan visibles.',
        de: 'Erzwungen aktiv: wenn das TER/IO-Blatt deaktiviert ist, muss das Datenblatt alle Flüsse enthalten, damit propagierte/korrigierte Flüsse sichtbar bleiben.',
        it: 'Forzato attivo: quando il foglio TER/IO è disattivato, il foglio dati deve contenere tutti i flussi affinché i flussi propagati/corretti rimangano visibili.',
        'zh-CN': '强制启用：当 TER/IO 工作表关闭时，数据工作表必须包含全部流量，以便传播/校正后的流量仍然可见。',
        ja: '強制的にオン：TER/IO シートがオフのとき、伝播・修正されたフローが見えるよう、データシートがすべてのフローを保持する必要があります。',
      },
    } satisfies FormatAttributeConfig<boolean>,

    data_table_with_all_flux: {
      group: 'sheets',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Include flux without data',
        fr: 'Inclure les flux sans données',
        es: 'Incluir flujos sin datos',
        de: 'Flüsse ohne Daten einbeziehen',
        it: 'Includere flussi senza dati',
        'zh-CN': '包含无数据的流量',
        ja: 'データのないフローも含める'
      },
      tooltips: {
        en: 'Activate writing of all flux in DATA_SHEET table',
        fr: 'Activer l\'écriture de tous les flux dans le tableau DATA_SHEET',
        es: 'Activar la escritura de todos los flujos en la tabla DATA_SHEET',
        de: 'Schreiben aller Flüsse in der DATA_SHEET-Tabelle aktivieren',
        it: 'Attivare la scrittura di tutti i flussi nella tabella DATA_SHEET',
        'zh-CN': '启用在 DATA_SHEET 表中写入全部流量',
        ja: 'DATA_SHEET の表にすべてのフローを書き出します'
      },
      // Utiliser le nouveau système de conditions
      visibilityConditions: [
        {
          type: 'optionProperty',
          property: 'activate_data_table',
          operator: '==',
          value: true
        }
      ],
      // [SA #136] Forced ON when TER/IO is off so propagated/corrected flux
      // (that have no data values yet) are emitted into the data sheet.
      disabledConditions: [
        { type: 'optionProperty', property: 'activate_flux_matrix', operator: '==', value: false },
      ],
      forcedValueWhenDisabled: true,
      disabledTooltip: {
        en: 'Forced on: with the TER/IO sheet off, the data sheet must include every flux to surface those without data values yet.',
        fr: 'Forcé activé : avec l\'onglet TER/TES décoché, l\'onglet données doit inclure tous les flux pour que ceux sans valeurs apparaissent.',
        es: 'Forzado activado: con la hoja TER/IO desactivada, la hoja de datos debe incluir todos los flujos para mostrar aquellos sin valores.',
        de: 'Erzwungen aktiv: bei deaktiviertem TER/IO-Blatt muss das Datenblatt alle Flüsse enthalten, um auch jene ohne Werte zu zeigen.',
        it: 'Forzato attivo: con il foglio TER/IO disattivato, il foglio dati deve includere tutti i flussi per mostrare quelli senza valori.',
        'zh-CN': '强制启用：TER/IO 工作表关闭时，数据工作表必须包含全部流量，以呈现那些尚无数据值的流量。',
        ja: '強制的にオン：TER/IO シートがオフのとき、まだ値のないフローを示すため、データシートがすべてのフローを含む必要があります。',
      },
    } satisfies FormatAttributeConfig<boolean>,

    data_table_only_leaf_flux: {
      group: 'sheets',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Only leaf flux',
        fr: 'Uniquement Flux feuilles',
        es: 'Solo flujos hoja',
        de: 'Nur Blattflüsse',
        it: 'Solo flussi foglia',
        'zh-CN': '仅叶子流量',
        ja: '末端フローのみ'
      },
      tooltips: {
        en: 'Restrict DATA_SHEET rows to flux whose origin and destination are both leaf nodes (no children in the hierarchy).',
        fr: 'Restreindre les lignes du tableau DATA_SHEET aux flux dont l\'origine et la destination sont toutes deux des nœuds feuilles (sans enfants dans la hiérarchie).',
        es: 'Restringir las filas de DATA_SHEET a flujos cuyo origen y destino son ambos nodos hoja (sin hijos en la jerarquía).',
        de: 'DATA_SHEET-Zeilen auf Flüsse beschränken, deren Ursprung und Ziel beide Blattknoten sind (ohne Kinder in der Hierarchie).',
        it: 'Limitare le righe di DATA_SHEET ai flussi la cui origine e destinazione sono entrambi nodi foglia (senza figli nella gerarchia).',
        'zh-CN': '将 DATA_SHEET 的行限制为起点和终点均为叶子节点（层级中无子节点）的流量。',
        ja: 'DATA_SHEET の行を、始点・終点がいずれも末端ノード（階層上の子を持たないノード）であるフローに限定します。'
      },
      visibilityConditions: [
        {
          type: 'optionProperty',
          property: 'activate_data_table',
          operator: '==',
          value: true
        }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    activate_flux_matrix: {
      group: 'sheets',
      default: true,
      type: (() => false) as (() => boolean),
      breakBefore: true,
      labels: {
        en: 'Sheets SUT or IOT',
        fr: 'Onglet(s) TER ou TES',
        es: 'Hojas SUT o IOT',
        de: 'Blätter SUT oder IOT',
        it: 'Fogli SUT o IOT',
        'zh-CN': 'SUT 或 IOT 工作表',
        ja: 'SUT または IOT のシート'
      },
      tooltips: {
        en: 'Activate writing of IO_SHEET / TER_SHEET table',
        fr: 'Activer l\'écriture du tableau IO_SHEET / TER_SHEET',
        es: 'Activar la escritura de la tabla IO_SHEET / TER_SHEET',
        de: 'Schreiben der IO_SHEET / TER_SHEET-Tabelle aktivieren',
        it: 'Attivare la scrittura della tabella IO_SHEET / TER_SHEET',
        'zh-CN': '启用写入 IO_SHEET / TER_SHEET 表',
        ja: 'IO_SHEET / TER_SHEET の表の書き出しを有効にします'
      }
    } satisfies FormatAttributeConfig<boolean>,

    flux_matrix_with_data: {
      group: 'sheets',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'With data',
        fr: 'Avec données',
        es: 'Con datos',
        de: 'Mit Daten',
        it: 'Con dati',
        'zh-CN': '含数据',
        ja: 'データ付き'
      },
      tooltips: {
        en: 'Activate writing of data in IO_SHEET / TER_SHEET table',
        fr: 'Activer l\'écriture des données dans le tableau IO_SHEET / TER_SHEET',
        es: 'Activar la escritura de datos en la tabla IO_SHEET / TER_SHEET',
        de: 'Schreiben von Daten in der IO_SHEET / TER_SHEET-Tabelle aktivieren',
        it: 'Attivare la scrittura dei dati nella tabella IO_SHEET / TER_SHEET',
        'zh-CN': '启用在 IO_SHEET / TER_SHEET 表中写入数据',
        ja: 'IO_SHEET / TER_SHEET の表にデータを書き出します'
      },
      visibilityConditions: [
        {
          type: 'optionProperty',
          property: 'activate_flux_matrix',
          operator: '==',
          value: true
        }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    flux_matrix_only_leaf_flux: {
      group: 'sheets',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Only leaf flux',
        fr: 'Uniquement Flux feuilles',
        es: 'Solo flujos hoja',
        de: 'Nur Blattflüsse',
        it: 'Solo flussi foglia',
        'zh-CN': '仅叶子流量',
        ja: '末端フローのみ'
      },
      tooltips: {
        en: 'Restrict the IO/TER matrix to leaf nodes (nodes without children) on both axes.',
        fr: 'Restreindre la matrice IO/TER aux nœuds feuilles (sans enfants) sur les deux axes.',
        es: 'Restringir la matriz IO/TER a los nodos hoja (sin hijos) en ambos ejes.',
        de: 'IO/TER-Matrix auf Blattknoten (ohne Kinder) auf beiden Achsen beschränken.',
        it: 'Limitare la matrice IO/TER ai nodi foglia (senza figli) su entrambi gli assi.',
        'zh-CN': '将 IO/TER 矩阵的两个坐标轴都限制为叶子节点（无子节点的节点）。',
        ja: 'IO/TER 行列の両方の軸を、末端ノード（子を持たないノード）に限定します。'
      },
      visibilityConditions: [
        {
          type: 'optionProperty',
          property: 'activate_flux_matrix',
          operator: '==',
          value: true
        }
      ]
    } satisfies FormatAttributeConfig<boolean>,
  },
  json: {
    with_values: {
      group: 'content',
      default: true,
      type: (() => true) as (() => boolean),
      labels: {
        en: 'Save with links\' values',
        fr: 'Enregistrer avec les valeurs des flux',
        es: 'Guardar con los valores de los flujos',
        de: 'Mit Flusswerten speichern',
        it: 'Salva con i valori dei flussi',
        'zh-CN': '保存时包含流量数值',
        ja: 'フローの値も保存'
      },
      tooltips: {
        en: 'Include link values in the export',
        fr: 'Inclure les valeurs des flux dans l\'export',
        es: 'Incluir los valores de los flujos en la exportación',
        de: 'Flusswerte in den Export einbeziehen',
        it: 'Includere i valori dei flussi nell\'esportazione',
        'zh-CN': '在导出中包含流量数值',
        ja: 'エクスポートにフローの値を含めます'
      }
    } satisfies FormatAttributeConfig<boolean>,

    // OSP only: when checked, the blob→json save writes one standalone JSON per
    // view (master included), packaged in a single zip, instead of a single
    // multi-view file. Routed through menu_configuration.save_all_views_as_json,
    // injected by OpenSankey+. Visible only when saving the current sankey
    // (input blob) and the diagram actually has views.
    save_one_json_per_view: {
      group: 'content',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'One JSON per view (zip)',
        fr: 'Un JSON par vue (zip)',
        es: 'Un JSON por vista (zip)',
        de: 'Ein JSON pro Ansicht (zip)',
        it: 'Un JSON per vista (zip)',
        'zh-CN': '每个视图一个 JSON（zip）',
        ja: 'ビューごとに JSON（zip）'
      },
      tooltips: {
        en: 'Save one standalone JSON file per view (master included), packaged in a single zip, instead of a single multi-view file. Each file re-opens on its own.',
        fr: 'Enregistrer un fichier JSON autonome par vue (master inclus), regroupés dans un seul zip, au lieu d\'un unique fichier multi-vues. Chaque fichier se rouvre indépendamment.',
        es: 'Guardar un archivo JSON independiente por vista (master incluido), agrupados en un solo zip, en lugar de un único archivo multivista. Cada archivo se reabre por sí solo.',
        de: 'Eine eigenständige JSON-Datei pro Ansicht (Master inbegriffen) in einem einzigen Zip speichern, statt einer einzelnen Multi-View-Datei. Jede Datei lässt sich eigenständig wieder öffnen.',
        it: 'Salvare un file JSON autonomo per vista (master incluso), raggruppati in un unico zip, invece di un singolo file multi-vista. Ogni file si riapre da solo.',
        'zh-CN': '为每个视图（含主数据）保存一个独立的 JSON 文件，打包为单个 zip，而非单一的多视图文件。每个文件均可单独打开。',
        ja: '1 つのマルチビューのファイルではなく、ビューごと（マスターを含む）に独立した JSON ファイルを保存し、1 つの zip にまとめます。各ファイルは単独で開けます。'
      },
      visibilityConditions: [
        { type: 'optionProperty', property: '_input_format', operator: '==', value: 'blob' },
        { type: 'custom', customCheck: (app_data) => (app_data as unknown as { has_views?: boolean }).has_views === true }
      ]
    } satisfies FormatAttributeConfig<boolean>,

    keep_siblings: {
      group: 'content',
      default: false,
      type: (() => false) as (() => boolean),
      labels: {
        en: 'Keep siblings',
        fr: 'Conserver les frères',
        es: 'Conservar hermanos',
        de: 'Geschwister beibehalten',
        it: 'Conserva fratelli',
        'zh-CN': '保留同级节点',
        ja: '兄弟ノードを残す'
      },
      tooltips: {
        en: 'Keep sibling nodes in the export',
        fr: 'Conserver les nœuds frères dans l\'export',
        es: 'Conservar los nodos hermanos en la exportación',
        de: 'Geschwisterknoten im Export beibehalten',
        it: 'Conservare i nodi fratelli nell\'esportazione',
        'zh-CN': '在导出中保留同级节点',
        ja: 'エクスポートに兄弟ノードを含めます'
      }
    } satisfies FormatAttributeConfig<boolean>,

    compression: {
      group: 'content',
      default: 'gzip',
      type: (() => 'gzip') as (() => string),
      labels: {
        en: 'Compression',
        fr: 'Compression',
        es: 'Compresión',
        de: 'Komprimierung',
        it: 'Compressione',
        'zh-CN': '压缩',
        ja: '圧縮'
      },
      tooltips: {
        en: 'Output format: plain JSON (.json) or gzip-compressed JSON (.json.gz). The compressed file is smaller and can be reloaded directly.',
        fr: 'Format de sortie : JSON brut (.json) ou JSON compressé en gzip (.json.gz). Le fichier compressé est plus léger et peut être rechargé directement.',
        es: 'Formato de salida: JSON sin comprimir (.json) o JSON comprimido en gzip (.json.gz). El archivo comprimido es más ligero y puede recargarse directamente.',
        de: 'Ausgabeformat: reines JSON (.json) oder gzip-komprimiertes JSON (.json.gz). Die komprimierte Datei ist kleiner und kann direkt neu geladen werden.',
        it: 'Formato di output: JSON semplice (.json) o JSON compresso in gzip (.json.gz). Il file compresso è più leggero e può essere ricaricato direttamente.',
        'zh-CN': '输出格式：普通 JSON（.json）或 gzip 压缩的 JSON（.json.gz）。压缩文件更小，且可直接重新加载。',
        ja: '出力形式：通常の JSON（.json）または gzip 圧縮された JSON（.json.gz）。圧縮ファイルは小さく、そのまま読み込めます。'
      },
      selectOptions: [
        {
          value: 'none',
          labels: {
            en: 'None (.json)',
            fr: 'Aucune (.json)',
            es: 'Ninguna (.json)',
            de: 'Keine (.json)',
            it: 'Nessuna (.json)',
            'zh-CN': '无（.json）',
            ja: 'なし（.json）'
          }
        },
        {
          value: 'gzip',
          labels: {
            en: 'gzip (.json.gz)',
            fr: 'gzip (.json.gz)',
            es: 'gzip (.json.gz)',
            de: 'gzip (.json.gz)',
            it: 'gzip (.json.gz)',
            'zh-CN': 'gzip（.json.gz）',
            ja: 'gzip（.json.gz）'
          }
        }
      ]
    } satisfies FormatAttributeConfig<string>
  },

  blob: {},
  example_excel: {},
  example_json: {}
} as const

export type FormatType = 'base' | 'excel' | 'json' | 'blob' | 'example_excel' | 'example_json'

// Valeurs par défaut pour chaque format
export const getDefaultOutputOptions = (config: FormatAttributeConfig<boolean | number | string> | object): Record<string, unknown> => {
  return Object.keys(config).reduce((acc, key) => {
    // @ts-expect-error Type inference limitation
    acc[key] = config[key].default
    return acc
  }, {} as Record<string, unknown>)
}

export const getDefaultInputOptions = (config: FormatAttributeConfig<boolean | number | string> | object): Record<string, unknown> => {
  return Object.keys(config).reduce((acc, key) => {
    // @ts-expect-error Type inference limitation
    acc[key] = config[key].default
    return acc
  }, {} as Record<string, unknown>)
}

// export type ConfigAttribute<C, F extends FormatType, K> =
//   C extends typeof OUTPUT_ATTRIBUTES_CONFIG | typeof INPUT_ATTRIBUTES_CONFIG
//   ? K extends keyof C[F]
//   ? C[F][K]
//   : never
//   : never

// // Type helper pour garantir qu'on a bien un FormatAttributeConfig
// export type ExtractAttributeConfig<T> = T extends FormatAttributeConfig<infer U> ? FormatAttributeConfig<U> : never

// DialogConfigs.ts (ajouter à la fin)

export interface ConverterConfig {
  // Textes
  title: string
  launch_button_label: string
  success_status?: string
  failure_status?: string
  // Backend
  server_endpoint: string

  // Racine de résolution serveur des fichiers d'exemple (input_format
  // example_excel / example_json). 'sankeydata' (défaut) = templates + tutoriels
  // migrés dans le submodule SankeyData (env SANKEY_DATA) ; 'mfadata' = contenu
  // de la sankeythèque (Etudes/Clients), servi par /menus/examples depuis
  // MFAData et pas encore migré. Forwardé tel quel dans le form_data du launch.
  example_root?: 'sankeydata' | 'mfadata'

  input: {
    required: boolean
    format: {
      options?: FormatType[]
    }
  }
  output: {
    required: boolean
    format: {
      options?: FormatType[]
    }
  }

  // Optional per-attribute overrides applied on top of getDefault*Options when
  // initialize() resets the dialog state. Used by shortcut configs (e.g.
  // create_index, create_ter) to pre-select a subset of sheets/options instead
  // of starting from the global defaults. Keys are attribute names from
  // OUTPUT_ATTRIBUTES_CONFIG / INPUT_ATTRIBUTES_CONFIG.
  output_overrides_excel?: Record<string, unknown>
  output_overrides_json?: Record<string, unknown>
  output_overrides_base?: Record<string, unknown>
  input_overrides_excel?: Record<string, unknown>
  input_overrides_json?: Record<string, unknown>
  input_overrides_base?: Record<string, unknown>

  // Optional whitelist of attribute keys to render in the dialog options panel.
  // When set, the dialog only shows checkboxes for these keys; other attributes
  // keep their default/override values silently. Used by shortcuts like
  // create_index that should expose only "Index" + "Read-me" toggles.
  output_options_visible_excel?: string[]
  output_options_visible_json?: string[]
  output_options_visible_base?: string[]
  input_options_visible_excel?: string[]
  input_options_visible_json?: string[]
  input_options_visible_base?: string[]

  // Suppress the Layout tab. The default heuristic shows it whenever an Excel
  // input could feed the in-app sankey, which is wrong for pure save-to-file
  // shortcuts (create_index/ter/tes) where no diagram is reloaded.
  hide_layout_tab?: boolean

  // Force the terminal to stay open at the end of the process: no auto-save,
  // no auto-close. The user reads the log and clicks Télécharger / Réinit
  // explicitly. Used by ad-hoc shortcuts (create_index) where the verbose log
  // is the actual feedback.
  keep_terminal_open?: boolean
}

export const hasOptionsFormat = (
  format: { fixed?: FormatType; options?: FormatType[] }
): format is { options: FormatType[] } => {
  return format.options !== undefined
}

// Helper pour obtenir le format initial
export const getInitialFormat = (
  format: { fixed?: FormatType; options?: FormatType[] },
  defaultFormat: FormatType
): FormatType => {
  if (hasOptionsFormat(format) && format.options.length > 0) {
    return format.options[0]
  }
  return defaultFormat
}

// Configurations prédéfinies
// Keys peeled out of output_options_base before POST-ing to the reconciliation
// endpoint and packed into the dedicated ``solver_options`` form field. Kept
// here so both the dialog (UI rendering / form-data wiring) and any future
// caller share a single source of truth.
export const SOLVER_OPTION_KEYS = [
  'enable_uncertainty',
  'nb_realisations',
  'record_simulations',
  'debug_mode',
  'skip_rref',
  'with_reconciled',
  'with_completed',
] as const

// IID=162: the input (autocorrection) options persisted in the workbook
// "Options de réconciliation" sheet — the full group='autocorrection' set that
// load_sankey consumes and that decides whether the load/reconciliation
// succeeds, so they can be frozen in the file and pre-fill the dialog. Single
// source of truth shared with the parser's MFA_INPUT_OPTION_KEYS
// (SankeyExcelParser io_excel_constants). Keep in sync with the keys declared in
// INPUT_ATTRIBUTES_CONFIG.base above.
export const INPUT_OPTION_KEYS = [
  'create_new_nodes',
  'create_new_flux',
  'propagate_flux_to_children',
  'propagate_flux_to_parent',
  'autofix_parenthood_mat_balance',
  'autofix_constraint_redundancies',
  'allow_flux_to_descendant',
  'autonormalize_ratio_constraints',
  'autofix_ter_duplicate_entries',
  'typo_strict',
  'autocorrect_typo',
  'propagate_datatag_structure',
] as const

export const CONVERTER_CONFIGS = {
  // Convertisseur universel (tous les choix)
  universal: {
    title: 'ProcessDialog.file_converter',
    launch_button_label: 'ProcessDialog.launch',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: true,
      format: {
        options: ['excel', 'json', 'blob']
      },
    },
    output: {
      required: true,
      format: {
        options: ['excel', 'json']
      },
    },
  } satisfies ConverterConfig,
  load_excel: {
    title: 'ProcessDialog.open_excel_file',
    launch_button_label: 'ProcessDialog.load',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: true,
      format: {
        options: ['excel']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['json']  // Format fixe
      },
    },
  } satisfies ConverterConfig,
  load_json: {
    title: 'ProcessDialog.open_json_file',
    launch_button_label: 'ProcessDialog.load',
    server_endpoint: '',
    input: {
      required: true,
      format: {
        options: ['json']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['blob']  // Format fixe
      },
    },
  } satisfies ConverterConfig,
  save_json: {
    title: 'ProcessDialog.save_json_file',
    launch_button_label: 'ProcessDialog.save',
    server_endpoint: '',
    input: {
      required: false,
      format: {
        options: ['blob']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: true,
      format: {
        options: ['json']  // Format fixe
      },
    }
  } satisfies ConverterConfig,
  load_example_json: {
    title: 'ProcessDialog.load_example',
    launch_button_label: 'ProcessDialog.load',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: false,
      format: {
        options: ['example_json']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['json']  // Format fixe
      },
    }
  } satisfies ConverterConfig,
  load_tutorial: {
    title: 'ProcessDialog.load_tutorial',
    launch_button_label: 'ProcessDialog.load',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: false,
      format: {
        options: ['example_json']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['json']  // Format fixe
      },
    }
  } satisfies ConverterConfig,
  load_example_excel: {
    title: 'ProcessDialog.load_example',
    launch_button_label: 'ProcessDialog.load',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: false,
      format: {
        options: ['example_excel']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['json']  // Format fixe
      },
    }
  } satisfies ConverterConfig,
  // Sankeythèque : mêmes dialogues que load_example_* mais le contenu
  // (Etudes/Clients) est servi par /menus/examples depuis MFAData et n'est pas
  // encore migré vers SankeyData → example_root: 'mfadata' pour que
  // convert/launch résolve le file_name contre MFAData et non SANKEY_DATA.
  load_sankeytheque_json: {
    title: 'ProcessDialog.load_example',
    launch_button_label: 'ProcessDialog.load',
    server_endpoint: '/opensankey/convert/launch',
    example_root: 'mfadata',
    input: {
      required: false,
      format: {
        options: ['example_json']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['json']  // Format fixe
      },
    }
  } satisfies ConverterConfig,
  load_sankeytheque_excel: {
    title: 'ProcessDialog.load_example',
    launch_button_label: 'ProcessDialog.load',
    server_endpoint: '/opensankey/convert/launch',
    example_root: 'mfadata',
    input: {
      required: false,
      format: {
        options: ['example_excel']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['json']  // Format fixe
      },
    }
  } satisfies ConverterConfig,
  save_excel: {
    title: 'ProcessDialog.save_excel_file',
    launch_button_label: 'ProcessDialog.save',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: false,
      format: {
        options: ['blob']  // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: true,
      format: {
        options: ['excel']  // Format fixe
      },
    }
  } satisfies ConverterConfig,

  // Shortcut: Excel save dialog focused on the Index sheet. Source picker shows
  // both options ('blob' = current diagram, 'excel' = pick a file), so the
  // input section actually renders we keep input.required = true (otherwise
  // FileFormatSection short-circuits and no selector is drawn). The output
  // options panel is narrowed to just two toggles (Index + Read-me); the
  // "Contenu écrit" / "Contenu lu" sections are suppressed entirely by passing
  // empty whitelists for the base buckets, and the Excel read options are
  // suppressed too since the user only picks a file, not how to parse it.
  create_index: {
    title: 'ProcessDialog.create_index',
    launch_button_label: 'ProcessDialog.save',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: true,
      format: { options: ['excel'] },
    },
    output: {
      required: true,
      format: { options: ['excel'] },
    },
    // Ad-hoc Index builder: backend reads only the workbook's tab list and
    // emits a fresh Index (and optionally Lisez-moi) from the matched sheet
    // names — no Sankey parsing/re-emission. This sidesteps the data-merge
    // limitation where multiple "Valeurs"-typed tabs collapse into one on
    // round-trip. The other output overrides below are only honored by the
    // legacy round-trip path and are ignored when create_index_only is on.
    output_overrides_excel: {
      create_index_only: true,
      with_index_sheet: true,
      with_description_sheet: true,
      with_sheet_formating: true,
      with_nodes_sheets: true,
      layout: true,
      activate_data_table: true,
      activate_flux_matrix: true,
      keep_other_sheets: true,
      rewrite_format_sheets: false,
    },
    // Index/Read-me only need raw structure — drop the strict validation that
    // would otherwise raise when an input file references unknown nodes/fluxes.
    // Hidden from the user (input_options_visible_base = []) but still applied.
    input_overrides_base: {
      error_on_new_nodes: false,
      error_on_new_flux: false,
    },
    output_options_visible_excel: ['with_index_sheet', 'with_description_sheet', 'with_sheet_formating'],
    output_options_visible_base: [],
    input_options_visible_excel: [],
    input_options_visible_base: [],
    hide_layout_tab: true,
    keep_terminal_open: true,
  } satisfies ConverterConfig,

  // Shortcut: add the TER/TES (flux matrix) sheet to a workbook that doesn't
  // have one. Same hidden options as create_index — every existing sheet stays
  // intact (rewrite_format_sheets=false), error_on_new_* off so loading a
  // partial input doesn't raise, layout tab suppressed. The only checkbox
  // exposed to the user is "Onglet TER ou TES" (activate_flux_matrix). The
  // backend auto-decides between IO and TER layout based on the diagram's
  // node-type tags (cf. xl_write_matrix_sheet, ok_for_ter heuristic), so
  // there is no separate "TES" config — a single shortcut covers both.
  create_ter_tes: {
    title: 'ProcessDialog.create_ter_tes',
    launch_button_label: 'ProcessDialog.save',
    server_endpoint: '/opensankey/convert/launch',
    input: {
      required: true,
      format: { options: ['blob', 'excel'] },
    },
    output: {
      required: true,
      format: { options: ['excel'] },
    },
    output_overrides_excel: {
      with_index_sheet: true,
      with_description_sheet: true,
      with_nodes_sheets: true,
      layout: true,
      activate_data_table: true,
      activate_flux_matrix: true,
      keep_other_sheets: true,
      rewrite_format_sheets: false,
    },
    input_overrides_base: {
      error_on_new_nodes: false,
      error_on_new_flux: false,
    },
    output_options_visible_excel: [
      'activate_flux_matrix',
      'flux_matrix_with_data',
      'flux_matrix_only_leaf_flux',
    ],
    output_options_visible_base: [],
    input_options_visible_excel: [],
    input_options_visible_base: [],
    hide_layout_tab: true,
  } satisfies ConverterConfig,

  reconciliation: {
    title: 'ProcessDialog.reconciliation',
    launch_button_label: 'ProcessDialog.launch',
    server_endpoint: '/optimize/launch_optim',
    input: {
      required: true,
      format: {
        options: ['excel', 'json', 'blob'] // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: true,
      format: {
        options: ['excel', 'json']  // Format fixe
      },
    },
  } satisfies ConverterConfig,
  reconciliation_sankey: {
    title: 'ProcessDialog.reconciliation',
    launch_button_label: 'ProcessDialog.launch',
    server_endpoint: '/optimize/launch_optim',
    input: {
      required: false,
      format: {
        options: ['blob'] // Format fixe, pas de sélecteur
      },
    },
    output: {
      required: false,
      format: {
        options: ['blob']  // Format fixe
      },
    },
  } satisfies ConverterConfig,
} as const

export type ConverterConfigKey = keyof typeof CONVERTER_CONFIGS