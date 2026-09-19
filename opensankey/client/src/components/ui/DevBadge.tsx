// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1431 — LA PASTILLE « dev » (retour de Julien, 19/09 : « il faudrait que ce soit marqué dev,
// on avait ça avant »).
//
// Une commande réservée au mode développeur (`has_sankey_dev`) se reconnaît à cette pastille, posée
// à côté de son libellé, PARTOUT où elle paraît. Sans elle, un réglage de contrôle interne — révéler
// tous les flux porteurs de données, créer un groupe de niveaux — se lit comme un réglage du
// produit, et l'auteur qui le voit chez lui l'attend chez ses lecteurs. Un seul composant, pour que
// la marque soit la même d'une surface à l'autre.

import React from 'react'
import { Badge } from '@chakra-ui/react'

export const DevBadge = () => <Badge
  colorScheme='orange'
  variant='subtle'
  fontSize='0.55rem'
  lineHeight='1'
  paddingInline='0.25rem'
  paddingBlock='0.1rem'
  marginLeft='0.3rem'
  textTransform='lowercase'
  verticalAlign='middle'
  title='Mode développeur'
>
  dev
</Badge>
