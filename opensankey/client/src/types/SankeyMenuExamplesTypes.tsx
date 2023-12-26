// /**
//  * Description placeholder
//  *
//  * @type {*}
//  */
// const ExempleMenuDictTypes = PropTypes.objectOf(PropTypes.element.isRequired).isRequired
// /**
//  * Description placeholder
//  *
//  * @typedef {ExempleMenuTypes}
//  */
// type ExempleMenuTypes = InferProps<typeof ExempleMenuDictTypes>

/**
//  * Description placeholder
//  *
//  * @type {{ exemple_menu: any; url_prefix: any; data: any; set_data: any; current_path: any; multi_selected_nodes: any; multi_selected_links: any; multi_selected_label: any; launch: any; }}
//  */
// const ExempleItemPropTypes = {
//   exemple_menu : PropTypes.oneOf([PropTypes.element.isRequired,ExempleMenuDictTypes]).isRequired, 
//   url_prefix : PropTypes.string.isRequired, 
//   data : PropTypes.shape(SankeyDataPropTypes).isRequired, 
//   set_data : PropTypes.func.isRequired, 
//   current_path : PropTypes.string.isRequired, 
//   multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
//   multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
//   launch: PropTypes.func.isRequired,
//   Reinitialization: PropTypes.func.isRequired,
//   convert_data:PropTypes.func.isRequired,
//   DefaultSankeyData:PropTypes.func.isRequired

// }

// // /**
//  * Description placeholder
//  *
//  * @typedef {ExempleItemTypes}
//  */
// type ExempleItemTypes = InferProps<typeof ExempleItemPropTypes>

//**