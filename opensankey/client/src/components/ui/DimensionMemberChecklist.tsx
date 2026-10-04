// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 04/10/2026 — LA LISTE À CASES D'UN NIVEAU, partagée (os#1511).
//
// C'est la liste du mode « Par niveau » du sélecteur de dimension (sa!850-852, éditeur) : « (Tout
// sélectionner) » à trois états fixe en tête, une recherche au-delà de `SEUIL_RECHERCHE` membres, les
// membres dans l'ordre reçu (stable), des cases (ou des radios pour un seul membre lu). Elle descend
// ici, dans OpenSankey, pour que le tableau de navigation d'une couronne — qui vit ici — choisisse les
// membres du zoom d'un niveau avec la MÊME liste (Julien : « réutilise la liste à cases du sélecteur
// Par niveau »). Le sélecteur de l'éditeur la monte sous son menu des niveaux.
//
// Elle ne sait rien de ce qu'elle règle : `apply` reçoit les membres cochés, `vider` dit « plus rien
// de coché » (l'appelant en fait un état EN ATTENTE, jamais une coupe vide), `selectAll` remplace
// « tout cocher » sans recherche (le sélecteur pose alors le niveau entier).

import React, { ReactNode } from 'react'
import { Box, Checkbox, Input, Radio, Text } from '@chakra-ui/react'

import type { Class_DataTag } from '../../types/Tag'
import { decocher, decocherVisibles, etatToutSelectionner } from '../../Algorithms/DimensionCut'

type Type_T = (key: string, options?: { [k: string]: unknown }) => unknown

/** Au-delà, la liste d'un niveau prend une recherche (comme le filtre d'Excel). */
export const SEUIL_RECHERCHE = 15

export const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const LISTE_MAX = '16rem'
export const ligne_style = { fontSize: '0.78rem', lineHeight: '1.45rem' }

export const DimensionMemberChecklist = ({ t, membres, chosen, single, apply, vider, selectAll, attente }: {
  t: Type_T,
  /** Les membres proposés, dans l'ordre où la liste les montre. */
  membres: Class_DataTag[],
  /** Ce que les cases montrent cochées (vide en attente). */
  chosen: ReadonlySet<string>,
  /** Un seul membre se lit à la fois : des radios. */
  single: boolean,
  /** Pose exactement ces membres (parmi `membres`). */
  apply: (ids: string[]) => void,
  /** Plus rien de coché : l'appelant passe en attente. */
  vider: () => void,
  /** « (Tout sélectionner) » sans recherche ; à défaut, `apply` de tous les membres. */
  selectAll?: () => void,
  /** La ligne qui dit l'attente, posée sous « (Tout sélectionner) ». */
  attente?: ReactNode,
}) => {
  const [recherche, setRecherche] = React.useState('')
  const q = sansAccents(recherche.trim())
  const visibles = q === '' ? membres : membres.filter(m => sansAccents(m.display_name).includes(q))
  const ids_visibles = visibles.map(m => m.id)
  const choisis = membres.filter(m => chosen.has(m.id)).map(m => m.id)

  const etat = etatToutSelectionner(ids_visibles, chosen)
  // Comme Excel : coché → tout décocher (attente) ; partiel ou vide → tout cocher. Avec une
  // recherche, seuls les membres filtrés sont concernés.
  const tout = () => {
    if (ids_visibles.length === 0) return
    if (etat === 'all') {
      const reste = decocherVisibles(choisis, ids_visibles)
      if (reste) apply(reste)
      else vider()
      return
    }
    if (q === '' && selectAll) selectAll()
    else apply(ids_visibles)
  }
  const basculer = (id: string, coche: boolean) => {
    if (coche) apply([...choisis, id])
    else {
      const reste = decocher(new Set(choisis), id)
      if (reste) apply(reste)
      else vider()
    }
  }

  return <>
    {/* « (Tout sélectionner) » FIXE en tête, hors de la zone qui défile (comme Excel) : sur une liste
        longue, il ne part pas avec les premiers membres. */}
    {!single && membres.length > 0
      ? <Box {...ligne_style} padding='0 0.4rem' className='DimensionMemberSelectAll'>
        <Checkbox
          size='sm'
          isChecked={etat === 'all'}
          isIndeterminate={etat === 'some'}
          isReadOnly={ids_visibles.length === 0}
          onChange={tout}
        >
          <Text as='span' ml='0.35rem' fontSize='0.78rem' fontStyle='italic'>
            {String(q === '' ? t('Banner.cut_select_all') : t('Banner.cut_select_results'))}
          </Text>
        </Checkbox>
      </Box>
      : null}
    {attente}
    {membres.length > SEUIL_RECHERCHE
      ? <Input size='xs' fontSize='0.78rem' placeholder={String(t('Banner.cut_search'))} value={recherche}
        onChange={e => setRecherche(e.target.value)} />
      : null}
    <Box maxHeight={LISTE_MAX} overflowY='auto' border='1px solid' borderColor='gray.200' borderRadius='4px'
      padding='0.2rem 0.4rem' className='DimensionMemberList'>
      {visibles.length === 0
        ? <Text fontSize='0.75rem' color='gray.500' padding='0.2rem'>{String(t('Banner.cut_no_match'))}</Text>
        : null}
      {visibles.map(m => {
        const coche = chosen.has(m.id)
        if (single) {
          return <Box key={m.id} {...ligne_style}>
            <Radio size='sm' isChecked={coche} onChange={() => { if (!coche) apply([m.id]) }} title={m.display_name}>
              <Text as='span' ml='0.35rem' fontSize='0.78rem'>{m.display_name}</Text>
            </Radio>
          </Box>
        }
        return <Box key={m.id} {...ligne_style} title={m.display_name}>
          <Checkbox size='sm' isChecked={coche} onChange={e => basculer(m.id, e.target.checked)}>
            <Text as='span' ml='0.35rem' fontSize='0.78rem'>{m.display_name}</Text>
          </Checkbox>
        </Box>
      })}
    </Box>
  </>
}
