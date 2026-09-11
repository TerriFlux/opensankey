import * as fs from 'fs'
import * as path from 'path'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'
import { diffPaths, findCorpusDir, readCorpusIndex, readCorpusJSON } from './corpusHarness'
import { drawAndFingerprint, installJsdomRenderStubs } from './renderFingerprint'

// #530 — Golden du RENDU, sur le corpus multi-époques (SankeyData/corpus).
//
// Ce que les trois autres suites « corpus » ne voient pas : corpusFirstLoad fige le résultat des
// MIGRATIONS (`toJSON(load(f))`), corpusRoundTrip un POINT FIXE du dump, corpusCrossDump l'accord
// TS/Python — tous sur le JSON. Or la contrainte dure du chantier « fiabilité / légende » est
// d'un autre ordre : **un ancien diagramme doit s'afficher exactement comme avant**. Une règle de
// rendu nouvelle (opacité déduite d'une étiquette, ligne de définition dans la légende, tireté
// dérivé du statut de détermination) laisse le JSON strictement inchangé, garde les 24 goldens au
// vert, et change pourtant ce que l'utilisateur voit.
//
// Sans instrument, chaque ticket de rendu se recette à l'œil sur un diagramme choisi par le
// développeur : c'est le mode d'échec du #388 (quatre relevés « tout invariant » contre
// l'utilisateur) et du #425 (« restaurer un comportement se prouve par rejeu mesuré »).
//
// Ce qui est figé, et RIEN d'autre (cf. renderFingerprint.ts) : par nœud et par flux la
// visibilité, la couleur peinte et l'opacité effective ; par zone de légende son texte.
//
// La CONTRE-ÉPREUVE de l'instrument — il doit échouer quand une opacité, une couleur, une
// visibilité ou un texte de légende change — vit dans `renderFingerprint.selfCheck.test.ts` :
// un golden qui ne sait pas rougir ne mesure rien.
//
// Régénérer après un changement VOULU (et inspecter le diff rapporté !) :
//   UPDATE_RENDER_FINGERPRINT=1 pnpm --filter @terriflux/opensankey run test -- corpusRenderFingerprint

installJsdomRenderStubs()

const GOLDEN_DIR = 'ref_render'

function goldenPath(corpus_dir: string, rel: string): string {
  // Un golden par fichier de corpus, à plat (le '/' de l'arborescence devient '__').
  return path.join(corpus_dir, GOLDEN_DIR, rel.replace(/[/\\]/g, '__').replace(/\.gz$/, '') + '.golden.json')
}

function writeGolden(abs: string, json: Type_JSON): void {
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, JSON.stringify(json, null, 2))
}

const corpusDir = findCorpusDir()
const describeOrSkip = corpusDir ? describe : describe.skip

describeOrSkip('#530 — golden du rendu (ce que le diagramme affiche)', () => {
  if (!corpusDir) {
    // eslint-disable-next-line no-console
    console.warn('[#530] SankeyData/corpus introuvable — suite skippée (checkout OpenSankey standalone).')
    return
  }

  const entries = readCorpusIndex(corpusDir)
  const update = !!process.env.UPDATE_RENDER_FINGERPRINT

  it.each(entries)('rendu figé : %s', (rel) => {
    const print = drawAndFingerprint(
      readCorpusJSON(path.join(corpusDir as string, rel)),
      () => new Class_ApplicationData(false)
    )
    const golden_file = goldenPath(corpusDir as string, rel)

    if (update) {
      writeGolden(golden_file, print)
      return
    }

    if (!fs.existsSync(golden_file)) {
      // Une référence absente NE DOIT PAS faire passer le test en silence (le harnais MFA a ce
      // défaut, cf. mfa#43) : sans golden, ce test ne protège rien.
      throw new Error(
        `Golden de rendu manquant : ${path.relative(corpusDir as string, golden_file)}\n` +
        'Générer avec UPDATE_RENDER_FINGERPRINT=1, puis INSPECTER le diff avant de committer.'
      )
    }

    const golden = JSON.parse(fs.readFileSync(golden_file, 'utf-8')) as Type_JSON
    const diffs = diffPaths(golden, print)
    if (diffs.length > 0) {
      throw new Error(
        `Le RENDU de ${rel} a changé (${diffs.length}+ chemins) :\n` +
        diffs.slice(0, 40).join('\n') +
        '\n\nSi le changement est VOULU : UPDATE_RENDER_FINGERPRINT=1 puis relire le diff golden.'
      )
    }
  }, 120000)
})
