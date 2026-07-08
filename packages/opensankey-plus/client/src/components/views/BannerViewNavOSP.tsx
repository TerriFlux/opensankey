// Standard libs
import React, { useEffect, useState } from 'react'
import {
  Box,
} from '@chakra-ui/react'

// OpenSankey Libs
import { default_main_sankey_id } from '@terriflux/opensankey/src/types/Utils'
import { Class_ViewTagGroup } from '@terriflux/opensankey/src/types/TagGroup'
import { Class_ApplicationDataOSP } from '../../types/ApplicationDataOSP'
import { TopbarNavSelect } from '@terriflux/opensankey/src/components/topmenus/Toolbar'

/**
 * Navigation entre vues (Préc. / sélecteur / Suiv.), rendue dans un bloc topbar
 * distinct du menu déroulant « Vues » (placée après « Aide »). Tout le bloc est
 * masqué tant qu'aucune vue n'existe : il n'y a alors rien à parcourir ni à
 * sélectionner (le sélecteur retomberait sur un champ vide).
 */
export const BannerViewNavOSP = ({ app_data }: { app_data: Class_ApplicationDataOSP }) => {
  const { t, menu_configuration_osp, drawing_area } = app_data
  const [, setCount] = useState(0)
  const refreshThis = () => setCount(a => a + 1)
  menu_configuration_osp.ref_to_banner_view_nav_updater.current = refreshThis

  // Re-render au toggle du tableur/doc (recentrage topbar).
  useEffect(() => {
    return app_data.menu_configuration.addMainZoneListener(refreshThis)
  }, [])

  const has_views = app_data.has_views
  const has_view_before = app_data.has_view_before
  const has_view_after = app_data.has_view_after

  // Pas de vues → rien à naviguer : on masque tout le bloc (et donc Préc./Suiv.).
  if (!has_views) return <></>

  const onPrevView = () => {
    const tmp = new KeyboardEvent('keydown', { key: 'F8' })
    if (document.onkeydown) document.onkeydown(tmp)
  }
  const onNextView = () => {
    const tmp = new KeyboardEvent('keydown', { key: 'F9' })
    if (document.onkeydown) document.onkeydown(tmp)
  }

  // Titre du bloc, calé en petit au-dessus du sélecteur (même mise en page que les
  // data tags en topbar) : nom du groupe de view tags s'il en existe un, sinon libellé
  // générique « Vues par défaut ».
  const view_taggs = drawing_area.sankey.getTagGroupsAsList('view_taggs') as unknown as Class_ViewTagGroup[]
  const title = view_taggs.length > 0 ? view_taggs[0].name : t('view.banner_default_title')

  // Options / valeur du sélecteur : ordre de navigation (le maître y figure en tête si l'option
  // show_master_in_views est active). Le maître courant reste toujours représentable même masqué.
  const master_name = app_data.master_view_name || t('view.actual')
  const viewLabel = (id: string) => id === default_main_sankey_id
    ? master_name
    : (app_data.views_dict[id]?.name ?? id)
  const value = (
    Object.keys(app_data.views_dict).includes(app_data.current_view_id) &&
    app_data.current_view_id !== default_main_sankey_id
  ) ? app_data.current_view_id : default_main_sankey_id
  const options = app_data.views_navigation_order.map(id => ({ value: id, label: viewLabel(id) }))
  if (!options.some(o => o.value === value)) options.unshift({ value, label: viewLabel(value) })

  const select = (view: string) => {
    app_data.setCurrentView(view)
    // Update views components (without updating save in cache button)
    app_data.menu_configuration_osp.updateComponentRelatedToViews()
  }

  return <Box className='BannerViewNav'>
    <TopbarNavSelect
      t={t}
      prefix={title}
      select_label={title}
      value={value}
      options={options}
      onChange={select}
      onPrev={onPrevView}
      onNext={onNextView}
      prev_disabled={!has_view_before}
      next_disabled={!has_view_after}
    />
  </Box>
}
