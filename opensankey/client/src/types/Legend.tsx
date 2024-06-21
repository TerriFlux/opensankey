import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'

import { Class_DrawingArea } from './DrawingArea'
import { Class_Element } from './Element'
import { Class_MenuConfig } from './MenuConfig'
import { Type_ElementPosition, default_element_color, default_element_position } from './Utils'


export class Class_Legend extends Class_Element {
    // Legend Class attributes
    private _masked: boolean = false
    private _display_legend_scale: boolean = false
    private _legend_police: number = 16
    private _legend_bg_border: boolean = true
    private _legend_bg_color: string = default_element_color
    private _legend_bg_opacity: number = 100
    private _legend_show_dataTags: boolean = false
    private _node_label_separator: string = ''
    private _width: number = 180

    protected _display: {
        drawing_area: Class_DrawingArea,
        position: Type_ElementPosition,
    }

    /**Attribute for legend content positionning 
       Souldn't have getter & setter public because the variable is only use & computed when we draw the legend  */
    private dx = 0
    /**Attribute for legend content positionning 
       Souldn't have getter & setter public because the variable is only use & computed when we draw the legend  */
    private dy = 0

    constructor(
        drawing_area: Class_DrawingArea,
        menu_config: Class_MenuConfig,
    ) {
        super('legend_area', menu_config, 'grp_legend')


        this._display = {
            drawing_area: drawing_area,
            position: structuredClone(default_element_position)
        }
    }

    // ============== Method ================
    public draw() {
        // Heritance of draw function
        super.draw()
        // Update class attributes
        this.d3_selection?.attr('class', 'ggrp_legend')
        // Apply styles
        console.log(this._masked)
        this.d3_selection?.style('display', this._masked ? 'none' : '')

        // Draw Background 
        this.drawLegendBg()

        // Reset content positionning
        this.dx = 0
        this.dy = 0

        // Draw tag color pallette applied to sankey
        this.drawTagDisplayed()

    }

    private drawLegendBg() {
        this.d3_selection?.select('.g_drag_zone_leg').remove()
        this.d3_selection?.append('g')
            .attr('class', 'g_drag_zone_leg')
            .append('rect')
            .attr('class', 'zone_for_dragging')
            .attr('width', this._width)
            .attr('height', this._width)
            .attr('rx', '2px')
            .attr('ry', '2px')
            .attr('stroke-dasharray', () => '')
            .attr('stroke', this._legend_bg_border ? this._legend_bg_color : 'none')
            .attr('stroke-width', this._legend_bg_border ? 1 : 0)
            .attr('fill', this._legend_bg_color)
            .attr('fill-opacity', this._legend_bg_opacity / 100)
            .on('mouseover', () => {

                d3.select('.opensankey #g_legend .zone_for_dragging').attr('stroke-dasharray', '6,6')
                d3.select('.opensankey #g_legend .zone_for_dragging').attr('stroke', this._legend_bg_color)
            })
            .on('mouseleave', () => {
                d3.select('.opensankey #g_legend .zone_for_dragging').attr('stroke-dasharray', 'unherit')
                d3.select('.opensankey #g_legend .zone_for_dragging').attr('stroke', this._legend_bg_border ? this._legend_bg_color : 'none')

            })
            .on('mousedown', () => {
                this.setSelected()
                d3.select('.opensankey #g_legend .zone_for_dragging').attr('stroke-dasharray', () => '6,6')
                let h = document.getElementById('g_legend')?.getBoundingClientRect().height
                h = h ? h : 50

                //   draw_legend_handles(applicationData,legend_clicked.current ,h,ComponentUpdater,reDrawLegend,resizeCanvas)
            })
    }
    private drawTagDisplayed() {
        const { node_taggs, flux_taggs, data_taggs, nodesColorMap, linksColorMap, nodes_dict, links_dict } = this.drawing_area.sankey
        const wrap = textwrap()
            .bounds({ height: 100, width: this._width })
            .method('tspans')
        // Get all grp tag insind one variable
        const all_tags = Object.assign({}, node_taggs, flux_taggs, data_taggs)
        console.log(all_tags)
        Object.entries(all_tags).filter(tag_group => tag_group[1].show_legend).forEach(tag_group => {
            // Ajout du tagGroup.name
            this.d3_selection?.append('text')
                .attr('id', 'GrpTag_title_' + tag_group[0])
                .attr('transform', function () {
                    return 'translate(' + this.dx + ',' + this.dy + ' )'
                })
                .attr('x', 0)
                .attr('y', 5 + this._legend_police)
                .text(tag_group[1].name)
                .attr('style', 'font-weight:bold;font-size:' + this._legend_police + 'px')
                .call(wrap)

            if (document.getElementById('GrpTag_title_' + tag_group[0])?.getElementsByTagName('tspan')[0].innerHTML === '') {
                document.getElementById('GrpTag_title_' + tag_group[0])?.setAttribute('y', '5')
            }

            this.dy += document.getElementById('GrpTag_title_' + tag_group[0])?.getBoundingClientRect().height ?? 0
            const legendElements2 = this.d3_selection?.append('g').attr('transform', 'translate(0,' + this._legend_police + ')')

            Object.entries(tag_group[1].tags)
                .filter((d) => d[1].selected)
                // .filter(tag => {
                //     // Filter tag that have elements associated to them displayed (nodes,links) 
                //     if ( Object.keys(flux_taggs).includes(linksColorMap) && Object.keys(flux_taggs).includes(tag_group[0]) ) {
                //         const t = Object.values(links_dict).filter(l => {
                //             const tmp = GetLinkValue(data, l.idLink)
                //             return (
                //                 LinkVisible(l, data, display_nodes) &&
                //                 tmp.tags[linksColorMap] &&
                //                 tmp.tags[linksColorMap].includes(tag[1])
                //             )
                //         }).length
                //         return t > 0
                //     }
                //     if ( Object.keys(node_taggs).includes(nodesColorMap) && Object.keys(node_taggs).includes(tag_group[0]) ) {
                //         const node_visible = NodeVisibleOnsSvg()
                //         const t2 = Object.values(nodes_dict).filter(n => {
                //             return (
                //                 n.tags[nodesColorMap] &&
                //                 n.tags[nodesColorMap].includes(tag[1]) &&
                //                 node_visible.includes(n.idNode) &&
                //                 (n.position !== 'relative')
                //             )
                //         }).length
                //         return t2 > 0
                //     }
                //     if (linksColorMap && linksColorMap.includes('dataTags_')) {
                //         return true
                //     }
                //     return false
                // })
                .forEach((tag) => {
                    const tagElement = legendElements2?.append('g')
                        .attr('id', 'tag_' + tag[1].name.replaceAll(' ', '__')
                        )
                        .attr('transform', () => {
                            return 'translate(' + this.dx + ',' + (this.dy) + ')'
                        })

                    //=========== TODO re implements event on tag displayed elements ========================

                    // .on('mouseover', () => {

                    //     //Recherche les noeuds liés à des flux dont on survole la légende d'étiquette
                    //     const nodes_tied_to_link_hovered = ([] as string[])
                    //     Object.values(links_dict).filter(l => {
                    //         const tmp = GetLinkValue(data, l.idLink)
                    //         return tmp.tags[tag_group[0]] && tmp.tags[tag_group[0]].includes(tag[1])
                    //     }).forEach(el => {
                    //         nodes_tied_to_link_hovered.push(el.idSource)
                    //         nodes_tied_to_link_hovered.push(el.idTarget)
                    //     })
                    //     //Reduit l'opacité de tous les flux qui n'ont pas l'étiquette survolé
                    //     Object.values(links_dict).filter(l => {
                    //         const tmp = GetLinkValue(data, l.idLink)
                    //         return !(tmp.tags[tag_group[0]] && tmp.tags[tag_group[0]].includes(tag[1]))
                    //     }).forEach(el => {
                    //         d3.selectAll(' .opensankey #path_' + el.idLink).attr('stroke-opacity', 0.1)
                    //         d3.selectAll(' .opensankey #gg_' + el.idLink + ' text').style('opacity', 0.1)
                    //         d3.selectAll(' .opensankey #path_' + el.idLink + '_arrow').attr('stroke-opacity', 0.1)
                    //         d3.selectAll(' .opensankey #path_' + el.idLink + '_arrow').attr('opacity', 0.1)
                    //     })

                    //     //Recupère le groupTag actif, si il existe, en régardant lequel a sa légende d'afficher (pour le moment il ne peut y avoir que un groupTag de sélectionné à a fois)
                    //     const tmp = Object.entries(node_taggs).filter(n => {
                    //         return n[1].show_legend
                    //     })

                    //     let link_tied_to_node_hovered = ([] as string[])
                    //     const tmp2 = (tmp.length > 0) ? tmp[0][0] : ''

                    //     if (tmp.length > 0) {
                    //         //Récupère les flux entrant/sortant  des noeuds dont on survole l'étiquette
                    //         Object.values(nodes_dict).filter(n => {
                    //             return (n.tags[tmp2] && n.tags[tmp2].includes(tag[1]))
                    //         }).forEach(el => {
                    //             link_tied_to_node_hovered = link_tied_to_node_hovered.concat(el.outputLinksId)
                    //             link_tied_to_node_hovered = link_tied_to_node_hovered.concat(el.inputLinksId)
                    //         })

                    //         //Reduit l'opacité de tous les flux qui ne sont pas rattaché à un noeuds survolé par l'étiquette
                    //         Object.values(links_dict).filter(l => {
                    //             return link_tied_to_node_hovered.includes(l.idLink)
                    //         }).forEach(el => {
                    //             d3.selectAll(' .opensankey #path_' + el.idLink).attr('stroke-opacity', 0.85)
                    //             d3.selectAll(' .opensankey #path_' + el.idLink + '_arrow').attr('stroke-opacity', 0.85)
                    //             d3.selectAll(' .opensankey #path_' + el.idLink + '_arrow').attr('opacity', 0.85)
                    //             d3.selectAll(' .opensankey #gg_' + el.idLink + ' text').style('opacity', 1)

                    //         })

                    //         //Reduit l'opacité de tous les noeuds qui n'ont pas l'étiquette
                    //         Object.values(nodes_dict).filter(n => {
                    //             return ((n.tags[tmp2] && !n.tags[tmp2].includes(tag[1]) && !nodes_tied_to_link_hovered.includes(n.idNode)) || (!n.tags[tmp2]))
                    //         }).forEach(el => {
                    //             d3.selectAll(' .opensankey #ggg_' + el.idNode).attr('opacity', 0.1)

                    //         })
                    //     } else {
                    //         Object.values(nodes_dict)
                    //             .filter(n => !nodes_tied_to_link_hovered.includes(n.idNode))
                    //             .forEach(el => {

                    //                 d3.selectAll(' .opensankey #ggg_' + el.idNode).attr('opacity', 0.1)
                    //             })
                    //     }

                    // })
                    // .on('mouseout', () => {
                    //     d3.selectAll(' .opensankey .link').attr('stroke-opacity', 0.85)
                    //     d3.selectAll(' .opensankey .arrow').attr('stroke-opacity', 0.85)
                    //     d3.selectAll(' .opensankey .arrow').attr('opacity', 0.85)
                    //     d3.selectAll(' .opensankey .gg_links text').style('opacity', 1)
                    //     d3.selectAll(' .opensankey .ggg_nodes').attr('opacity', 1)
                    // }).on('contextmenu', (evt) => {
                    //     if (!window.SankeyToolsStatic) {
                    //         evt.preventDefault()
                    //         pointer_pos.current = [evt.pageX, evt.pageY]
                    //         tagContext.current![0][1](tag[0])
                    //     }
                    // })

                    // Ajout du shape
                    tagElement?.append('rect')
                        .attr('width', this._legend_police)
                        .attr('height', this._legend_police)
                        .attr('x', 0)
                        .attr('y', -0.75 * this._legend_police)
                        .attr('rx', 3)
                        .attr('ry', 3)
                        .style('fill', () => (tag as [string, { color: string }])[1].color)
                        .style('fill-opacity', 1)

                    // Ajout du label
                    tagElement?.append('text')
                        .attr('x', 35)
                        .attr('y', 0)
                        .attr('font-size', this._legend_police + 'px')
                        .text(() => { return tag[1].name })
                        .call(wrap)

                    this.dy += document.getElementById('tag_' + tag[1].name.replaceAll(' ', '__'))?.getBoundingClientRect().height ?? 0
                })

            // Add shift for next group tag
        })
        const show_data = Object.values(data_taggs).filter(d => d.show_legend).length == 0

        if (this._legend_show_dataTags && show_data) {
            this.dy += this._legend_police
            Object.entries(data_taggs).forEach(tag_group => {
                // Ajout du tagGroup.name
                this.d3_selection?.append('text')
                    .attr('id', 'leg_dataTag_' + tag_group[0])
                    .attr('transform', 'translate(0,' + this.dy + ' )')
                    .attr('x', 0)
                    .attr('y', 0)
                    .text((tag_group[1].name + ' : ' + Object.values(tag_group[1].tags).filter(t => t.selected).map(t => t.name).join(', ')))
                    .attr('style', ('font-size:' + this._legend_police + 'px;'))
                    .call(wrap)

                this.dy += document.getElementById('leg_dataTag_' + tag_group[0])?.getBoundingClientRect().height ?? 0
            })
        }
    }

    // =========== Getter & Setter ===============

    public get masked(): boolean { return this._masked }
    public set masked(value: boolean) { this._masked = value; this.reset() }

    public get display_legend_scale(): boolean { return this._display_legend_scale }
    public set display_legend_scale(value: boolean) { this._display_legend_scale = value; this.reset() }

    public get legend_police(): number { return this._legend_police }
    public set legend_police(value: number) { this._legend_police = value; this.reset() }

    public get legend_bg_border(): boolean { return this._legend_bg_border }
    public set legend_bg_border(value: boolean) { this._legend_bg_border = value; this.reset() }

    public get legend_bg_color(): string { return this._legend_bg_color }
    public set legend_bg_color(value: string) { this._legend_bg_color = value; this.reset() }

    public get legend_bg_opacity(): number { return this._legend_bg_opacity }
    public set legend_bg_opacity(value: number) { this._legend_bg_opacity = value; this.reset() }

    public get legend_show_dataTags(): boolean { return this._legend_show_dataTags }
    public set legend_show_dataTags(value: boolean) { this._legend_show_dataTags = value; this.reset() }

    public get node_label_separator(): string { return this._node_label_separator }
    public set node_label_separator(value: string) { this._node_label_separator = value; this.reset() }

    public get width(): number { return this._width }
    public set width(value: number) { this._width = value; this.reset() }


}