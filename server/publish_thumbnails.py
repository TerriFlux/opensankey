"""Génération automatique des miniatures de portfolio (`image_front.png`).

Au publish, la miniature affichée sur la carte de chaque filière est captée
directement depuis le **rendu réel du diagramme (1ʳᵉ vue)** par un navigateur
sans interface (Playwright + Chromium), au lieu d'un PNG déposé à la main. La
miniature reflète alors toujours l'état du JSON publié.

Deux garde-fous fondent le comportement :

* **Fallback rétro-compatible** — on ne génère la miniature que pour les dossiers
  qui n'ont PAS déjà un `image_front.*` fourni à la main : un PNG sur-mesure
  (cadrage choisi, logo) reste prioritaire. Aucune migration forcée.
* **Dégradation gracieuse** — si Playwright ou Chromium n'est pas installé sur
  l'environnement qui exécute le publish, on saute la génération (aucune
  miniature créée) sans jamais faire échouer le publish. Le comportement
  historique (carte sans image) est alors conservé.

Le rendu est fidèle par construction : c'est le vrai moteur de l'appli qui dessine
le diagramme dans un `<svg id="draw_zoom">` ; on capture cet élément en PNG. On ne
réimplémente aucun moteur de layout côté serveur.

Ce module est volontairement isolé (import paresseux de Playwright) afin que
`server.publish` puisse l'appeler sans dépendre de Playwright à l'import.
"""

from __future__ import annotations

import logging
import os
import threading
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote

logger = logging.getLogger(__name__)

# Nom du fichier de miniature généré (variante .png, comme les image_front manuelles).
GENERATED_THUMBNAIL_NAME = "image_front.png"
# Variantes manuelles reconnues : leur présence désactive la génération (fallback).
_MANUAL_IMAGE_VARIANTS = ("image_front.png", "image_front.jpg", "image_front.jpeg")

# Viewport de rendu : large et un peu panoramique, proche du cadrage d'une carte.
_DEFAULT_VIEWPORT = {"width": 1280, "height": 800}
# Sélecteur du SVG racine du diagramme (cf. DrawingArea.tsx : `.attr('id', 'draw_zoom')`).
_DIAGRAM_SVG_SELECTOR = "svg#draw_zoom"
# Le groupe de dessin ne reçoit ses formes (nœuds/flux) qu'une fois le rendu fait.
_DIAGRAM_DRAWN_SELECTOR = "svg#draw_zoom g#g_drawing *"

# Délais (ms) : temps max d'attente du rendu, puis courte stabilisation avant capture.
_RENDER_TIMEOUT_MS = 25_000
_SETTLE_MS = 600

# Masquage du « chrome » du viewer avant capture : titre, barres d'outils, timeline,
# et surtout tout menu/dialogue ouvert par défaut (ex. le sélecteur de hiérarchies,
# qui s'ouvre seul et masquerait une partie du diagramme). Règle robuste et
# indépendante des noms de classes générés (hachages emotion, instables entre
# builds) : on masque tout élément HTML (non-SVG) positionné en overlay au-dessus
# du diagramme, en préservant toujours le SVG lui-même et ses ancêtres. Il ne reste
# alors que le diagramme dessiné (nœuds, flux, légende, tout ce qui est rendu DANS
# le SVG).
_HIDE_CHROME_JS = r"""() => {
  const svg = document.querySelector('svg#draw_zoom');
  if (!svg) return 0;
  const keep = new Set();
  for (let el = svg; el; el = el.parentElement) keep.add(el);
  let hidden = 0;
  document.querySelectorAll('body *').forEach(el => {
    if (el.namespaceURI === 'http://www.w3.org/2000/svg') return;  // jamais le contenu SVG
    if (keep.has(el)) return;                                       // ni le SVG ni ses ancetres
    if (el.contains(svg)) return;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.position === 'absolute') {
      el.style.setProperty('display', 'none', 'important');
      hidden++;
    }
  });
  return hidden;
}"""


def thumbnails_enabled() -> bool:
    """Interrupteur d'environnement. `PUBLISH_THUMBNAILS=0` (ou false/no/off)
    désactive complètement la génération — utile pour un serveur sans Chromium
    ou pour un publish volontairement rapide."""
    val = os.environ.get("PUBLISH_THUMBNAILS")
    if val is None:
        return True
    return val.strip().lower() not in ("0", "false", "no", "off")


def _import_playwright():
    """Import paresseux de Playwright. Renvoie le module `sync_api` ou None si
    l'installation est absente (dégradation gracieuse)."""
    try:
        from playwright.sync_api import sync_playwright  # type: ignore
        return sync_playwright
    except Exception as e:  # ImportError, mais aussi erreurs de chargement natif
        logger.info("Playwright indisponible, miniatures non générées: %s", e)
        return None


def _has_manual_image(folder: Path) -> bool:
    """Vrai si un `image_front.*` a été déposé à la main dans le dossier
    (insensible à la casse, comme `_copy_logos` qui minusculise les noms)."""
    existing = {p.name.lower() for p in folder.iterdir() if p.is_file()}
    return any(v in existing for v in _MANUAL_IMAGE_VARIANTS)


def _has_diagram_data(folder: Path) -> bool:
    """Vrai si le dossier porte un diagramme publiable. Les données du viewer sont
    des JSON compressés servis par `fetch` : selon leur origine ils sont nommés
    `*.json.gz` (compressés au publish) ou simplement `*.gz` (déjà compressés dans
    le dossier source, cas des portfolios SOCLE). On reconnaît les deux via `*.gz`
    et on écarte le descripteur technique `resources.*`."""
    for p in folder.glob("*.gz"):
        if p.name.lower().startswith("resources."):
            continue
        return True
    return False


def find_thumbnail_targets(public_dir):
    """Liste les dossiers viewer éligibles à une miniature générée.

    Un dossier est éligible s'il contient un viewer (`index.html`) et des données
    de diagramme (`*.json.gz`) mais AUCUN `image_front.*` manuel. À appeler AVANT
    `generate_all_index_pages` (qui renomme les `index.html` viewer en
    `diagrams.html`) : à ce stade, chaque `index.html` est encore un viewer.

    Renvoie une liste de chemins relatifs POSIX (racine = "") vers ces dossiers.
    """
    public_dir = Path(public_dir)
    targets = []
    for index_html in public_dir.rglob("index.html"):
        folder = index_html.parent
        if _has_manual_image(folder):
            continue
        if not _has_diagram_data(folder):
            continue
        rel = folder.relative_to(public_dir).as_posix()
        targets.append("" if rel == "." else rel)
    targets.sort()
    return targets


class _QuietHandler(SimpleHTTPRequestHandler):
    """Handler statique silencieux. Point capital : on ne pose JAMAIS
    `Content-Encoding: gzip` sur les `.json.gz` — l'appli récupère les octets
    bruts via `fetch` puis les décompresse elle-même (pako). Un
    `Content-Encoding: gzip` ferait décompresser par le navigateur, et l'appli
    tenterait de décompresser des données déjà décompressées → échec du rendu.
    `SimpleHTTPRequestHandler` ne pose pas ce header par défaut : il suffit de ne
    pas l'ajouter."""

    def log_message(self, *args, **kwargs):  # noqa: D401 - silence
        pass


@contextmanager
def _serve_directory(directory):
    """Sert `directory` en HTTP sur 127.0.0.1:<port éphémère>, le temps du bloc.
    Renvoie l'URL de base (sans slash final)."""
    handler = partial(_QuietHandler, directory=str(directory))
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{port}"
    finally:
        httpd.shutdown()
        httpd.server_close()
        thread.join(timeout=5)


def _capture_folder(page, base_url, rel_path, out_file,
                    render_timeout_ms=_RENDER_TIMEOUT_MS, settle_ms=_SETTLE_MS):
    """Charge le viewer d'un dossier, attend le rendu de la 1ʳᵉ vue et capture le
    SVG du diagramme en PNG dans `out_file`. Renvoie True si capturé."""
    # Encoder chaque segment (un nom de dossier peut contenir espaces/accents).
    prefix = (quote(rel_path) + "/") if rel_path else ""
    url = base_url + "/" + prefix + "index.html"
    page.goto(url, wait_until="load", timeout=render_timeout_ms)
    # Attendre que le diagramme soit effectivement dessiné (nœuds/flux présents),
    # pas seulement que le SVG conteneur existe.
    page.wait_for_selector(_DIAGRAM_DRAWN_SELECTOR, timeout=render_timeout_ms,
                           state="attached")
    # Courte stabilisation (fit/zoom initial, transitions).
    page.wait_for_timeout(settle_ms)
    # Retirer le chrome du viewer (barres, timeline, menus ouverts) pour ne garder
    # que le diagramme, puis laisser le navigateur repeindre.
    page.evaluate(_HIDE_CHROME_JS)
    page.wait_for_timeout(150)
    svg = page.query_selector(_DIAGRAM_SVG_SELECTOR)
    if svg is None:
        return False
    svg.screenshot(path=str(out_file), type="png")
    return True


def generate_missing_thumbnails(public_dir, viewport=None,
                                render_timeout_ms=_RENDER_TIMEOUT_MS,
                                settle_ms=_SETTLE_MS):
    """Génère `image_front.png` pour chaque filière publiée dépourvue d'image
    manuelle, à partir du rendu réel de sa 1ʳᵉ vue.

    Sans effet (renvoie 0) si la génération est désactivée par environnement ou si
    Playwright/Chromium est indisponible : le publish continue normalement, cartes
    sans image comme avant. Toute erreur sur un dossier est isolée (les autres
    filières sont tout de même traitées).

    Renvoie le nombre de miniatures générées.
    """
    public_dir = Path(public_dir)
    if not thumbnails_enabled():
        logger.info("Miniatures désactivées (PUBLISH_THUMBNAILS).")
        return 0

    targets = find_thumbnail_targets(public_dir)
    if not targets:
        return 0

    sync_playwright = _import_playwright()
    if sync_playwright is None:
        logger.warning(
            "Playwright absent : %d miniature(s) non générée(s) (fallback : "
            "cartes sans image). Installer playwright + chromium pour activer.",
            len(targets))
        return 0

    generated = 0
    try:
        with sync_playwright() as p:
            try:
                browser = p.chromium.launch(headless=True)
            except Exception as e:
                logger.warning(
                    "Chromium indisponible (%s) : %d miniature(s) non générée(s). "
                    "Lancer `playwright install chromium`.", e, len(targets))
                return 0
            try:
                page = browser.new_page(viewport=viewport or _DEFAULT_VIEWPORT)
                with _serve_directory(public_dir) as base_url:
                    for rel in targets:
                        folder = public_dir if not rel else public_dir / rel
                        out_file = folder / GENERATED_THUMBNAIL_NAME
                        try:
                            ok = _capture_folder(page, base_url, rel, out_file,
                                                 render_timeout_ms, settle_ms)
                            if ok:
                                generated += 1
                                logger.info("Miniature générée: %s/%s",
                                            rel or ".", GENERATED_THUMBNAIL_NAME)
                            else:
                                logger.warning(
                                    "Miniature non capturée (SVG absent): %s", rel or ".")
                        except Exception as e:
                            logger.warning(
                                "Échec miniature %s: %s", rel or ".", e)
            finally:
                browser.close()
    except Exception as e:
        logger.warning("Génération des miniatures interrompue: %s", e)

    return generated
