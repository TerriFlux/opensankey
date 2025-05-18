// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================
import React, { FunctionComponent, useRef, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup, Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text
} from '@chakra-ui/react';
import { Class_NodeDimension } from '../../Elements/NodeDimension';
import { Type_GenericApplicationData } from '../../types/Types'


export const AggregationModal: FunctionComponent<AgregationModalTypes> = (
  { new_data }
) => {
  const [, setForce] = useState(0);
  const [show_agregation, set_show_agregation] = useState(false);
  const selected_grp = useRef<Class_NodeDimension | undefined>();
  const closeModal = () => {
    new_data.drawing_area.node_contextualised = undefined;
    new_data.drawing_area.purgeSelection();
    new_data.menu_configuration.ref_to_menu_context_nodes_updater.current();
    set_show_agregation(false);
  };
  new_data.menu_configuration.ref_to_updater_node_agregate.current = (b: boolean) => set_show_agregation(b);
  if (new_data.drawing_area.node_contextualised) {
    const list_parent_dim = new_data.drawing_area.node_contextualised.dimensions_as_child;
    if (selected_grp.current == null || selected_grp.current == undefined) {
      selected_grp.current = list_parent_dim[0];
      setForce(a => a + 1);
    }
    return (
      <Modal
        isOpen={show_agregation}
        onClose={closeModal}
        variant='modal_dialog'
      >
        <ModalOverlay />
        <ModalContent
          maxWidth='inherit'
        >
          <ModalHeader>
            {new_data.t('Noeud.title_aggreg')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            width='100%'
          >
            <Box
              display='grid'
              gridAutoFlow='row'
              gridRowGap='0.25rem'
              width='calc(100% - 2rem)'
            >
              <Select
                onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                  const idx_new_selected_grp = list_parent_dim.map(dim => dim.id).indexOf(evt.target.value);
                  selected_grp.current = (list_parent_dim[idx_new_selected_grp]);
                  setForce(a => a + 1);
                }}
                value={selected_grp.current?.id}
                width='100%'
              >
                {list_parent_dim.map(
                  (cur_dim_name, i) => <option key={i} value={cur_dim_name.id}>{cur_dim_name.child_level_tagg.name}</option>
                )}
              </Select>
              <Text>{new_data.t('Noeud.text_agreg')}</Text>
              {<Text>{selected_grp.current?.parent.name}</Text>}
            </Box>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button
                variant="menuconfigpanel_option_button_secondary"
                isActive
                size='sizeButtonDialog'
                onClick={() => {
                  new_data.drawing_area.node_contextualised?.drawParent((selected_grp.current?.id ?? ''));
                  // new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())//Redraw all node visible because some link position where not computed before disaggregation
                  closeModal();
                }}
              >
                {new_data.t('Noeud.aggreg')}
              </Button>
              <Button
                variant="menuconfigpanel_del_button"
                size='sizeButtonDialog'
                onClick={() => {
                  closeModal();
                }}
              >
                {new_data.t('Menu.annuler')}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
};export type AgregationModalTypes = {
  new_data: Type_GenericApplicationData
}

export const DisaggregationModal: FunctionComponent<AgregationModalTypes> = (
  { new_data }
) => {
  const [, setForce] = useState(0)
  const [show_agregation, set_show_agregation] = useState(false)
  const selected_grp = useRef<Class_NodeDimension | undefined>()
  const closeModal = () => {
    new_data.drawing_area.node_contextualised = undefined
    new_data.drawing_area.purgeSelection()
    new_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
    set_show_agregation(false)
  }
  new_data.menu_configuration.ref_to_updater_node_disagregate.current = (b: boolean) => set_show_agregation(b)
  if (new_data.drawing_area.node_contextualised) {
    const list_child_dim = new_data.drawing_area.node_contextualised.dimensions_as_parent
    if (selected_grp.current == null || selected_grp.current == undefined) {
      selected_grp.current = list_child_dim[0]
      setForce(a => a + 1)
    }
    return (
      <Modal
        isOpen={show_agregation}
        onClose={closeModal}
        variant='modal_dialog'
      >
        <ModalOverlay />
        <ModalContent
          maxWidth='inherit'
        >
          <ModalHeader>
            {new_data.t('Noeud.title_desaggreg')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            width='100%'
          >
            <Box
              display='grid'
              gridAutoFlow='row'
              gridRowGap='0.25rem'
              width='calc(100% - 2rem)'
            >
              <Select
                onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                  const idx_new_selected_grp = list_child_dim.map(dim => dim.id).indexOf(evt.target.value)
                  selected_grp.current = (list_child_dim[idx_new_selected_grp])
                  setForce(a => a + 1)
                } }
                value={selected_grp.current?.id}
                width='100%'
              >
                {list_child_dim.map(
                  (cur_dim_name, i) => <option key={i} value={cur_dim_name.id}>{cur_dim_name.child_level_tagg.name}</option>
                )}
              </Select>
              <Text>{new_data.t('Noeud.text_desagreg')}</Text>
              {selected_grp.current?.children.map(child_name => <Text>{child_name.name}</Text>)}
            </Box>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button
                variant="menuconfigpanel_option_button_secondary"
                isActive
                size='sizeButtonDialog'
                onClick={() => {
                  new_data.drawing_area.node_contextualised?.drawChildren((selected_grp.current?.id ?? ''))
                  // new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())//Redraw all node visible because some link position where not computed before disaggregation
                  closeModal()
                } }
              >
                {new_data.t('Noeud.desaggreg')}
              </Button>
              <Button
                variant="menuconfigpanel_del_button"
                size='sizeButtonDialog'
                onClick={() => {
                  closeModal()
                } }
              >
                {new_data.t('Menu.annuler')}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }

}

