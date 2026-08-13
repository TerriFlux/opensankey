// #1255 — Textes de la visite guidée. Le scénario est court et actif (cf. types/GuidedTour.ts) :
// deux étapes où l'utilisateur FAIT le geste (tracer un flux, lui donner une valeur), puis des
// étapes de repérage. Chaque geste a deux variantes de texte : `first_*` sur diagramme vide (le
// tour attend le geste) et la variante descriptive quand le tour se déroule sur un diagramme
// existant (aucune attente).
//
// Règle de rédaction : une étape de REPÉRAGE ne doit pas s'écrire à l'impératif. Les textes hérités
// disaient « cliquez un nœud, un flux ou une zone » sur une étape où il n'y avait rien à cliquer —
// on y lisait une consigne, et cliquer ne menait à rien. Les étapes passives disent donc
// explicitement qu'il n'y a rien à y faire ; seules les étapes actives donnent un ordre.
//
// #1243 — `inspector` décrit l'inspecteur et son fil d'Ariane (le panneau dérive sa cible de la
// sélection) ; les clés de l'ex-matrice type×élément ont disparu avec elle.

export const resources_guided_tour = {
  //=======================================================
  //EN
  //=======================================================
  en: {
    translation: {
      guide: {
        guide: 'Guided tour',
        confirm_clear: 'The guided tour starts from a blank diagram, so your current diagram will be deleted — this cannot be undone. Save it first if you want to keep it.\n\nDelete it and start the tour? (Cancel: the tour still runs, on your diagram, without touching it.)',
        first_flow: 'Let\'s start with the gesture that matters most: draw a flow. Click in the drawing area, drag without releasing, then release — you have just created two nodes and the flow connecting them. The tour moves on as soon as it is done.',
        drawing_area: 'The drawing area. This is where your diagram lives. To draw a flow: click, drag without releasing, then release — two nodes and the flow connecting them appear. To extend the diagram faster, hover a node: four arrows appear, and clicking one creates the next node already connected.',
        first_value: 'Now give your flow a value: in this panel, the Value tab is open on your flow — type a number in the "Value" field, then confirm. This value drives the thickness of the flow, the very principle of a Sankey diagram. The tour moves on as soon as it is done.',
        link_value: 'The panel is open on the Value tab of your flow. The "Value" field drives the thickness of the flow — the very principle of a Sankey diagram.',
        inspector: 'This panel is the inspector: it always shows the settings of whatever is selected — here, your flow. Shape, label, value, styles: everything is edited from here. The breadcrumb at the top tells you what you are inspecting; with nothing selected it shows the View settings (page, grid, scale). Nothing to do here — carry on.',
        save_and_export: 'Remember to save: this button keeps your diagram in your browser cache so you can pick it up later. The File menu saves it as JSON or Excel, and the Export menu turns it into an image (PNG, PDF, SVG).',
        help_and_more: 'That covers the essentials. The Help menu holds the tutorials, the keyboard shortcuts and this tour if you ever want to run it again. Over to you!',
        tooltip: {
          guide: 'Start the guided tour: draw your first flow and discover the essentials of the interface.'
        }
      },
    }
  },
  //=======================================================
  //FR
  //=======================================================
  fr: {
    translation: {
      guide: {
        guide: 'Visite guidée',
        confirm_clear: 'La visite guidée part d\'un diagramme vierge : votre diagramme en cours sera donc supprimé, sans possibilité d\'annuler. Enregistrez-le d\'abord si vous souhaitez le garder.\n\nLe supprimer et démarrer la visite ? (Annuler : la visite se déroule quand même, sur votre diagramme, sans y toucher.)',
        first_flow: 'Commençons par le geste essentiel : tracez un flux. Cliquez dans la zone de dessin, faites glisser sans relâcher, puis relâchez — vous venez de créer deux nœuds et le flux qui les relie. La visite continue dès que c\'est fait.',
        drawing_area: 'La zone de dessin. C\'est ici que vit votre diagramme. Pour tracer un flux : cliquez, faites glisser sans relâcher, puis relâchez — deux nœuds et le flux qui les relie apparaissent. Pour prolonger le diagramme plus vite, survolez un nœud : quatre flèches apparaissent, et cliquer l\'une d\'elles crée le nœud suivant déjà relié.',
        first_value: 'Donnez maintenant une valeur à votre flux : dans ce panneau, l\'onglet Valeur est ouvert sur votre flux — saisissez un nombre dans le champ « Valeur », puis validez. C\'est cette valeur qui fait l\'épaisseur du flux, le principe même d\'un diagramme de Sankey. La visite continue dès que c\'est fait.',
        link_value: 'Le panneau est ouvert sur l\'onglet Valeur de votre flux. Le champ « Valeur » fait l\'épaisseur du flux — le principe même d\'un diagramme de Sankey.',
        inspector: 'Ce panneau est l\'inspecteur : il affiche toujours les réglages de ce qui est sélectionné — ici, votre flux. Forme, libellé, valeur, styles : tout se règle depuis là. Le fil d\'Ariane, en haut, indique ce que vous inspectez ; sans sélection, il affiche les réglages de la Vue (page, grille, échelle). Rien à faire ici — passez à la suite.',
        save_and_export: 'Pensez à enregistrer : ce bouton garde votre diagramme dans le cache de votre navigateur pour le reprendre plus tard. Le menu Fichier l\'enregistre en JSON ou Excel, et le menu Export le sort en image (PNG, PDF, SVG).',
        help_and_more: 'Vous avez fait le tour de l\'essentiel. Le menu Aide contient les tutoriels, les raccourcis clavier et cette visite si vous voulez la refaire. À vous de jouer !',
        tooltip: {
          guide: 'Commencez la visite guidée : tracez votre premier flux et découvrez l\'essentiel de l\'interface.'
        }
      },
    }
  },
  //=======================================================
  //ES
  //=======================================================
  es: {
    translation: {
      guide: {
        guide: 'Visita guiada',
        confirm_clear: 'La visita guiada parte de un diagrama en blanco, por lo que su diagrama actual se eliminará, sin posibilidad de deshacer. Guárdelo antes si desea conservarlo.\n\n¿Eliminarlo e iniciar la visita? (Cancelar: la visita se realiza igualmente, sobre su diagrama, sin tocarlo.)',
        first_flow: 'Empecemos por el gesto esencial: trace un flujo. Haga clic en el área de dibujo, arrastre sin soltar y luego suelte — acaba de crear dos nodos y el flujo que los une. La visita continúa en cuanto lo haya hecho.',
        drawing_area: 'El área de dibujo. Aquí es donde vive su diagrama. Para trazar un flujo: haga clic, arrastre sin soltar y luego suelte — aparecen dos nodos y el flujo que los une. Para ampliar el diagrama más rápido, pase el cursor sobre un nodo: aparecen cuatro flechas, y al hacer clic en una se crea el nodo siguiente ya conectado.',
        first_value: 'Ahora dé un valor a su flujo: en este panel, la pestaña Valor está abierta sobre su flujo — escriba un número en el campo «Valor» y confirme. Este valor determina el grosor del flujo, el principio mismo de un diagrama de Sankey. La visita continúa en cuanto lo haya hecho.',
        link_value: 'El panel está abierto en la pestaña Valor de su flujo. El campo «Valor» determina el grosor del flujo — el principio mismo de un diagrama de Sankey.',
        inspector: 'Este panel es el inspector: siempre muestra los ajustes de lo que está seleccionado — aquí, su flujo. Forma, etiqueta, valor, estilos: todo se configura desde aquí. La ruta de navegación, arriba, indica lo que está inspeccionando; sin selección, muestra los ajustes de la Vista (página, cuadrícula, escala). Nada que hacer aquí — continúe.',
        save_and_export: 'No olvide guardar: este botón conserva su diagrama en la caché del navegador para retomarlo más tarde. El menú Archivo lo guarda en JSON o Excel, y el menú Exportar lo convierte en imagen (PNG, PDF, SVG).',
        help_and_more: 'Con esto ya tiene lo esencial. El menú Ayuda contiene los tutoriales, los atajos de teclado y esta visita por si quiere repetirla. ¡Adelante!',
        tooltip: {
          guide: 'Inicie la visita guiada: trace su primer flujo y descubra lo esencial de la interfaz.'
        }
      },
    }
  },
  //=======================================================
  //DE
  //=======================================================
  de: {
    translation: {
      guide: {
        guide: 'Geführte Tour',
        confirm_clear: 'Die geführte Tour beginnt mit einem leeren Diagramm — Ihr aktuelles Diagramm wird daher gelöscht, ohne Möglichkeit zum Rückgängigmachen. Speichern Sie es vorher, wenn Sie es behalten möchten.\n\nLöschen und Tour starten? (Abbrechen: Die Tour läuft trotzdem, auf Ihrem Diagramm, ohne es anzutasten.)',
        first_flow: 'Beginnen wir mit der wichtigsten Geste: Zeichnen Sie einen Fluss. Klicken Sie in die Zeichenfläche, ziehen Sie ohne loszulassen und lassen Sie dann los — Sie haben soeben zwei Knoten und den Fluss dazwischen erstellt. Die Tour läuft weiter, sobald das erledigt ist.',
        drawing_area: 'Die Zeichenfläche. Hier lebt Ihr Diagramm. Um einen Fluss zu zeichnen: klicken, ohne loszulassen ziehen, dann loslassen — zwei Knoten und der Fluss dazwischen erscheinen. Schneller erweitern Sie das Diagramm, indem Sie einen Knoten überfahren: vier Pfeile erscheinen, und ein Klick darauf erzeugt den nächsten, bereits verbundenen Knoten.',
        first_value: 'Geben Sie Ihrem Fluss nun einen Wert: In diesem Panel ist der Tab «Wert» auf Ihrem Fluss geöffnet — tragen Sie eine Zahl in das Feld «Wert» ein und bestätigen Sie. Dieser Wert bestimmt die Dicke des Flusses, das Grundprinzip eines Sankey-Diagramms. Die Tour läuft weiter, sobald das erledigt ist.',
        link_value: 'Das Panel ist auf dem Tab «Wert» Ihres Flusses geöffnet. Das Feld «Wert» bestimmt die Dicke des Flusses — das Grundprinzip eines Sankey-Diagramms.',
        inspector: 'Dieses Panel ist der Inspektor: Er zeigt immer die Einstellungen des Ausgewählten — hier Ihren Fluss. Form, Beschriftung, Wert, Stile: alles wird von hier aus eingestellt. Der Navigationspfad oben zeigt an, was Sie inspizieren; ohne Auswahl zeigt er die Einstellungen der Ansicht (Seite, Raster, Maßstab). Hier gibt es nichts zu tun — weiter geht\'s.',
        save_and_export: 'Denken Sie ans Speichern: Diese Schaltfläche legt Ihr Diagramm im Browser-Cache ab, damit Sie später weiterarbeiten können. Das Datei-Menü speichert es als JSON oder Excel, das Export-Menü macht ein Bild daraus (PNG, PDF, SVG).',
        help_and_more: 'Das war das Wesentliche. Im Hilfe-Menü finden Sie die Tutorials, die Tastenkürzel und diese Tour, falls Sie sie noch einmal ansehen möchten. Viel Erfolg!',
        tooltip: {
          guide: 'Starten Sie die geführte Tour: Zeichnen Sie Ihren ersten Fluss und lernen Sie die Oberfläche kennen.'
        }
      },
    }
  },
  //=======================================================
  //IT
  //=======================================================
  it: {
    translation: {
      guide: {
        guide: 'Visita guidata',
        confirm_clear: 'La visita guidata parte da un diagramma vuoto: il vostro diagramma corrente verrà quindi eliminato, senza possibilità di annullare. Salvatelo prima se desiderate conservarlo.\n\nEliminarlo e avviare la visita? (Annulla: la visita si svolge comunque, sul vostro diagramma, senza toccarlo.)',
        first_flow: 'Cominciamo dal gesto essenziale: tracciate un flusso. Cliccate nell\'area di disegno, trascinate senza rilasciare, poi rilasciate — avete appena creato due nodi e il flusso che li collega. La visita prosegue non appena l\'avrete fatto.',
        drawing_area: 'L\'area di disegno. È qui che vive il vostro diagramma. Per tracciare un flusso: cliccate, trascinate senza rilasciare, poi rilasciate — compaiono due nodi e il flusso che li collega. Per estendere il diagramma più in fretta, passate il mouse su un nodo: compaiono quattro frecce e facendo clic su una si crea il nodo successivo già collegato.',
        first_value: 'Ora date un valore al vostro flusso: in questo pannello la scheda Valore è aperta sul vostro flusso — digitate un numero nel campo «Valore» e confermate. È questo valore a determinare lo spessore del flusso, il principio stesso di un diagramma di Sankey. La visita prosegue non appena l\'avrete fatto.',
        link_value: 'Il pannello è aperto sulla scheda Valore del vostro flusso. Il campo «Valore» determina lo spessore del flusso — il principio stesso di un diagramma di Sankey.',
        inspector: 'Questo pannello è l\'ispettore: mostra sempre le impostazioni di ciò che è selezionato — qui, il vostro flusso. Forma, etichetta, valore, stili: tutto si regola da qui. Il percorso di navigazione, in alto, indica ciò che state ispezionando; senza selezione mostra le impostazioni della Vista (pagina, griglia, scala). Nulla da fare qui — proseguite.',
        save_and_export: 'Ricordate di salvare: questo pulsante conserva il diagramma nella cache del browser per riprenderlo più tardi. Il menu File lo salva in JSON o Excel, e il menu Esporta lo trasforma in immagine (PNG, PDF, SVG).',
        help_and_more: 'Questo è l\'essenziale. Il menu Aiuto contiene i tutorial, le scorciatoie da tastiera e questa visita, se voleste rifarla. A voi!',
        tooltip: {
          guide: 'Avviate la visita guidata: tracciate il vostro primo flusso e scoprite l\'essenziale dell\'interfaccia.'
        }
      },
    }
  },
  'zh-CN': {
    translation: {
      guide: {
        guide: '引导游览',
        confirm_clear: '引导游览从空白图表开始，因此您当前的图表将被删除——此操作无法撤销。若要保留，请先保存。\n\n是否删除并开始游览？（取消：游览仍会进行，在您的图表上，且不作任何改动。）',
        first_flow: '我们先从最重要的操作开始：绘制一条流量。在绘图区中点击、按住拖动，然后松开——您刚刚创建了两个节点以及连接它们的流量。完成后游览会自动继续。',
        drawing_area: '绘图区。您的图表就在这里。绘制流量的方法：点击、按住拖动，然后松开——两个节点及连接它们的流量便会出现。若要更快地扩展图表，可将鼠标悬停在节点上：四个方向箭头会出现，点击其一即可创建已连接好的下一个节点。',
        first_value: '现在为流量赋值：在此面板中，“数值”选项卡已在您的流量上打开——在“数值”字段中输入一个数字，然后确认。该数值决定流量的粗细，这正是桑基图的核心原理。完成后游览会自动继续。',
        link_value: '面板已在您流量的“数值”选项卡上打开。“数值”字段决定流量的粗细——这正是桑基图的核心原理。',
        inspector: '这个面板是检查器：它始终显示当前所选对象的设置——此处是您的流量。形状、标签、数值、样式：一切都在这里编辑。顶部的面包屑会告诉您正在检查什么；未选中任何对象时，它显示视图设置（页面、网格、比例尺）。此处无需操作——继续吧。',
        save_and_export: '别忘了保存：该按钮会把您的图表保存在浏览器缓存中，方便日后继续。文件菜单可将其保存为 JSON 或 Excel，导出菜单则可将其转为图片（PNG、PDF、SVG）。',
        help_and_more: '要点到此为止。帮助菜单中有教程、键盘快捷键，以及本次游览（如需再次运行）。接下来就交给您了！',
        tooltip: {
          guide: '开始引导游览：绘制您的第一条流量，了解界面的核心要点。'
        }
      },
    }
  },
  ja: {
    translation: {
      guide: {
        guide: 'ガイドツアー',
        confirm_clear: 'ガイドツアーは白紙の図から始まるため、現在の図は削除されます — この操作は取り消せません。残しておきたい場合は先に保存してください。\n\n削除してツアーを開始しますか？（キャンセル：ツアーは現在の図の上で、図を変更せずに進みます。）',
        first_flow: 'まずは最も大切な操作から：フローを描いてみましょう。描画エリアでクリックし、押したままドラッグして、離してください — これで 2 つのノードと、それをつなぐフローができました。完了すると自動的に次へ進みます。',
        drawing_area: '描画エリアです。ここに図を描いていきます。フローの描き方：クリックし、押したままドラッグして、離す — 2 つのノードとそれをつなぐフローが現れます。図をもっと速く広げるには、ノードにマウスを重ねてください。4 つの矢印が現れ、クリックすると接続済みの次のノードが作成されます。',
        first_value: '次にフローへ値を入れます：このパネルでは、フローの「値」タブが開いています — 「値」の欄に数値を入力して確定してください。この値がフローの太さを決めます。これこそがサンキーダイアグラムの原理です。完了すると自動的に次へ進みます。',
        link_value: 'パネルはフローの「値」タブを開いています。「値」の欄がフローの太さを決めます — これこそがサンキーダイアグラムの原理です。',
        inspector: 'このパネルはインスペクタです：選択中のものの設定を常に表示します — ここではフローです。形状、ラベル、値、スタイル、すべてここで編集します。上部のパンくずが、いま何を見ているかを示します。何も選択していないときはビューの設定（ページ、グリッド、スケール）が表示されます。ここでの操作は不要です — そのまま進んでください。',
        save_and_export: '保存をお忘れなく：このボタンで図をブラウザのキャッシュに保存し、後から作業を再開できます。ファイルメニューからは JSON や Excel として保存でき、エクスポートメニューからは画像（PNG、PDF、SVG）にできます。',
        help_and_more: '要点は以上です。ヘルプメニューには、チュートリアル、キーボードショートカット、そしてこのツアーがあります。あとはご自由にどうぞ。',
        tooltip: {
          guide: 'ガイドツアーを開始：最初のフローを描きながら、画面の要点を確認します。'
        }
      },
    }
  }
}
