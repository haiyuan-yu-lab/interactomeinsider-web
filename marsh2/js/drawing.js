function drawUniprot(uniprot, target_div, rect_color, i, callback) {
    $.ajax({
        type: 'POST',
        data: { uniprot: uniprot },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/linear_uniprot',
        success: function(result) {
            parsed = JSON.parse(result);

            $('#pinfo_uniprot_' + (i === 0 ? 'A' : 'B')).html('<a href="http://www.uniprot.org/uniprot/' + parsed.id + '" target="_blank">' + parsed.id + '</a>  <i class="fa fa-star' + (parsed.reviewed == 'reviewed' ? '' : '-o') + '" style="color:#222" data-toggle="tooltip" data-placement="right" title="' + (parsed.reviewed == 'reviewed' ? 'Reviewed' : 'Unreviewed') + '">');
            $('#pinfo_length_' + (i === 0 ? 'A' : 'B')).html(parsed.length);
            $('#pinfo_gene_' + (i === 0 ? 'A' : 'B')).html(parsed.gene);
            $('#pinfo_protein_' + (i === 0 ? 'A' : 'B')).html(parsed.protein);
            $('#pinfo_protein_' + (i === 0 ? 'A' : 'B')).attr('title', parsed.protein);


            $('#UniProt' + (i === 0 ? 'A' : 'B') + '_dropdown').html(parsed.id);
            $('#UniProt' + (i === 0 ? 'A' : 'B') + '_dropdown').val(parsed.id);

            $('#uniprot' + (i === 0 ? 'A' : 'B') + '_name').html(parsed.id);

            $('#uniProt' + (i === 0 ? 'A' : 'B') + '_LOR_table').html(parsed.id);


            if (i === 0) {
                geneA = parsed.gene;
                uniProtA = uniprot;
            } else {
                geneB = parsed.gene;
                uniProtB = uniprot;
            }

            uniprot_lm[i].margin = { top: 50, right: 30, bottom: 10, left: 10 };
            $(target_div).html('');
            $(target_div).width($(target_div).parent().width());
            $(target_div).height($(target_div).parent().height());

            uniprot_lm[i].width = $(target_div).parent().width() - uniprot_lm[i].margin.left - uniprot_lm[i].margin.right;
            uniprot_lm[i].height = $(target_div).parent().height() - uniprot_lm[i].margin.top - uniprot_lm[i].margin.bottom;

            uniprot_lm[i].layer1 = d3.select(target_div)
                .append('g')
                .attr("transform", "translate(" + uniprot_lm[i].margin.left + "," + uniprot_lm[i].margin.top + ")");


            uniprot_lm[i].layer2 = d3.select(target_div)
                .append('g')
                .attr("transform", "translate(" + uniprot_lm[i].margin.left + "," + uniprot_lm[i].margin.top + ")");


            uniprot_lm[i].layer3 = d3.select(target_div)
                .append('g')
                .attr("transform", "translate(" + uniprot_lm[i].margin.left + "," + uniprot_lm[i].margin.top + ")");


            uniprot_lm[i].layer4 = d3.select(target_div)
                .append('g')
                .attr("transform", "translate(" + uniprot_lm[i].margin.left + "," + uniprot_lm[i].margin.top + ")");



            uniprot_lm[i].xScale = d3.scale.linear().domain([0, parsed.length]).range([0, uniprot_lm[i].width]);

            uniprot_lm[i].rect = uniprot_lm[i].layer2.append('rect')
                .attr('height', 0)
                .style('fill', rect_color)
                .attr('width', uniprot_lm[i].xScale(parsed.length))
                .attr('y', 10)
                .transition()
                .duration(1000)
                .attr('height', 10)
                .attr('y', 30);

            // $('[data-toggle="tooltip"]').tooltip();

            $.ajax({
                type: 'POST',
                data: { uniprot: uniprot },
                url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/pfam',
                success: function(result) {
                    parsed = JSON.parse(result);


                    $.each(parsed, function(index, v) {
                        uniprot_lm[i].rect = uniprot_lm[i].layer2.append('rect')
                            .style('fill', rect_color)
                            .attr('x', uniprot_lm[i].xScale(v.Start))
                            .attr('width', 0)
                            .attr('height', 30)
                            .attr('y', 20)
                            .classed('domain_rect', true)
                            .transition()
                            .duration(1000)
                            .attr('width', uniprot_lm[i].xScale(v.Stop) - uniprot_lm[i].xScale(v.Start));
                    });

                    if (callback !== undefined) {
                        callback(i);
                    }
                }
            });

        }
    });
}

function draw_current_coverage_CC(i) {
    $(".coverage" + i.toString()).remove();
    carousel = cc_carousel;
    carousel_index = cc_index;
    uniprot_res = i === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;

    $.each(Array.apply(null, Array(uniprot_lm[i].xScale.domain()[1] + 2)).map(function(_, x) {
        return uniprot_res.indexOf(x.toString()) != -1;
    }), function(index, val) {
        if (!val) {
            uniprot_lm[i].rect = uniprot_lm[i].layer2.append('rect')
                .classed("coverage" + i.toString(), true)
                .style('fill', '#fff')
                .style('opacity', '0.4')
                .attr('x', uniprot_lm[i].xScale(index - 2))
                .attr('width', uniprot_lm[i].xScale(1))
                .attr('height', 50)
                .attr('y', 20);
        }
    });
}


function draw_current_coverage(i) {
    $(".coverage" + i.toString()).remove();
    carousel = i === 0 ? A_carousel : B_carousel;
    carousel_index = i === 0 ? A_index : B_index;
    if (carousel.length === 0) {
        return;
    }
    $.each(Array.apply(null, Array(uniprot_lm[i].xScale.domain()[1])).map(function(_, x) {
        return carousel[carousel_index].uniprot_res.indexOf(x.toString()) != -1;
    }), function(index, val) {
        if (!val) {
            uniprot_lm[i].rect = uniprot_lm[i].layer2.append('rect')
                .classed("coverage" + i.toString(), true)
                .style('fill', '#fff')
                .style('opacity', '0.8')
                .attr('x', uniprot_lm[i].xScale(index))
                .attr('width', uniprot_lm[i].xScale(1))
                .attr('height', 50)
                .attr('y', 10);
        }
    });
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}



function drawColoredModel_CC(chain_index) {
    glviewer = glviewerCC;
    carousel = cc_carousel;
    carousel_index = cc_index;

    basecolor = chain_index === 0 ? colorA_alt : colorB_alt;
    known_color = chain_index === 0 ? colorA_alt2 : colorB_alt2;

    chain = chain_index === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter;

    model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
    uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;

    all_res = [];
    $.each(glviewer.getModel().selectedAtoms({ chain: chain }), function(i, v) { all_res.push(v.resi); });
    var unique = all_res.filter(onlyUnique);


    drawCartoon_CC(chain_index);
    var all = [];
    resi = [];

    $.each($('.kpos' + (chain_index === 0 ? 'L' : '')), function(j, e) {
        resi[j] = model_res[uniprot_res.findIndex(function(x) {
            return x == $(e).text();
        })];
        all.push(resi[j]);
    });

    // var others = unique.filter(function(n) {
    //     return all.indexOf(n.toString()) == -1;
    // });

    // glviewer.addSurface($3Dmol.SurfaceType.MS, { color: known_color }, { resi: resi, chain: chain });
    // glviewer.addSurface($3Dmol.SurfaceType.MS, { color: basecolor }, { resi: others, chain: chain });

    var colorKnown = function(atom) {
        return all.indexOf(atom.resi.toString()) == -1 ? basecolor : known_color;
    };

    glviewer.addSurface($3Dmol.SurfaceType.MS, { colorfunc: colorKnown }, { resi: unique, chain: chain });

}

function drawModel_CC(chain_index) {
    glviewer = glviewerCC;
    carousel = cc_carousel;
    carousel_index = cc_index;

    basecolor = chain_index === 0 ? colorA_alt : colorB_alt;
    chain = chain_index === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter;

    model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
    uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;

    glviewer.addSurface($3Dmol.SurfaceType.MS, { color: basecolor }, { chain: chain });
}

function drawColoredCartoon_CC(chain_index) {
    var glviewer = glviewerCC;
    var carousel = cc_carousel;
    var carousel_index = cc_index;

    basecolor = chain_index === 0 ? colorA_alt : colorB_alt;
    known_color = chain_index === 0 ? colorA_alt2 : colorB_alt2;

    var chain = chain_index === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter;

    var model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
    var uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;


    var all = [];
    var resi = [];

    var all_res = [];
    $.each(glviewer.getModel().selectedAtoms({ chain: chain }), function(i, v) { all_res.push(v.resi); });
    var unique = all_res.filter(onlyUnique);


    $.each($('.kpos' + (chain_index === 0 ? 'L' : '')), function(j, e) {
        resi[j] = model_res[uniprot_res.findIndex(function(x) {
            return x == $(e).text();
        })];
        all.push(resi[j]);
    });


    drawCartoon_CC(chain_index);



    glviewer.setStyle({ chain: chain, resi: resi }, { cartoon: { color: known_color } });
}

function drawCartoon_CC(chain_index) {
    glviewer = glviewerCC;
    carousel = cc_carousel;
    carousel_index = cc_index;

    basecolor = chain_index === 0 ? colorA_alt : colorB_alt;
    chain = chain_index === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter;

    model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
    uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;

    glviewer.setStyle({ chain: chain }, { cartoon: { color: basecolor } });
}


function drawCurrentView_CC() {
    glviewerCC.setStyle({}, {});
    glviewerCC.removeAllSurfaces();

    $.each([0, 1], function(chain_index) {
        cc_chain_index = chain_index;
        switch (currentViewType[cc_chain_index]) {
            case 'coloredCartoon':
                drawColoredCartoon_CC(chain_index);
                break;

            case 'coloredModel':
                drawColoredModel_CC(chain_index);
                break;

            case 'cartoon':
                drawCartoon_CC(chain_index);
                break;

            case 'model':
                drawModel_CC(chain_index);
                break;
        }
    });
    // drawPersistent_CC();
    glviewerCC.render();
}







function drawColoredModel(chain_index) {
    carousel = chain_index === 0 ? A_carousel : B_carousel;
    carousel_index = chain_index === 0 ? A_index : B_index;
    glviewer = chain_index === 0 ? glviewerA : glviewerB;
    basecolor = chain_index === 0 ? colorA_alt : colorB_alt;
    known_color = chain_index === 0 ? colorA_alt2 : colorB_alt2;

    if (carousel.length === 0 || glviewer === undefined) {
        return;
    }

    glviewer.setStyle({}, {});
    glviewer.removeAllSurfaces();
    glviewer.render();

    drawCartoon(chain_index);

    chain = carousel[carousel_index].Chain === null ? ' ' : carousel[carousel_index].Chain;
    model_res = carousel[carousel_index].model_res;
    uniprot_res = carousel[carousel_index].uniprot_res;

    interface_to_color = chain_index === 0 ? interfaces[cutoff + 'A'] : interfaces[cutoff + 'B'];

    all_res = [];
    $.each(glviewer.getModel().selectedAtoms({ chain: chain }), function(i, v) { all_res.push(v.resi); });
    var unique = all_res.filter(onlyUnique);
    var all = [];
    resi = [];
    debug = model_res;

    $.each(interface_to_color, function(j, e) {
        resi[j] = model_res[uniprot_res.findIndex(function(x) {
            return x == e;
        })];
        all.push(resi[j]);
    });

    var colorKnown = function(atom) {
        return all.indexOf(atom.resi.toString()) == -1 ? basecolor : known_color;
    };

    glviewer.addSurface($3Dmol.SurfaceType.MS, { colorfunc: colorKnown }, { resi: unique, chain: chain });

}

function drawModel(chain_index) {
    carousel = chain_index === 0 ? A_carousel : B_carousel;
    carousel_index = chain_index === 0 ? A_index : B_index;
    glviewer = chain_index === 0 ? glviewerA : glviewerB;
    basecolor = chain_index === 0 ? colorA_alt : colorB_alt;

    if (carousel.length === 0) {
        return;
    }

    glviewer.setStyle({}, {});
    glviewer.removeAllSurfaces();
    glviewer.render();

    glviewer.addSurface($3Dmol.SurfaceType.MS, { color: basecolor }, {});
}

function drawColoredCartoon(chain_index) {

    carousel = chain_index === 0 ? A_carousel : B_carousel;
    carousel_index = chain_index === 0 ? A_index : B_index;
    glviewer = chain_index === 0 ? glviewerA : glviewerB;
    basecolor = chain_index === 0 ? colorA_alt : colorB_alt;
    known_color = chain_index === 0 ? colorA_alt2 : colorB_alt2;

    if (carousel.length === 0 || glviewer === undefined) {
        return;
    }

    glviewer.setStyle({}, {});
    glviewer.removeAllSurfaces();
    glviewer.render();

    drawCartoon(chain_index);

    chain = carousel[carousel_index].Chain === null ? ' ' : carousel[carousel_index].Chain;
    model_res = carousel[carousel_index].model_res;
    uniprot_res = carousel[carousel_index].uniprot_res;

    interface_to_color = chain_index === 0 ? interfaces[cutoff + 'A'] : interfaces[cutoff + 'B'];

    all_res = [];
    $.each(glviewer.getModel().selectedAtoms({ chain: chain }), function(i, v) { all_res.push(v.resi); });
    var unique = all_res.filter(onlyUnique);
    var all = [];
    resi = [];
    debug = model_res;

    $.each(interface_to_color, function(j, e) {
        resi[j] = model_res[uniprot_res.findIndex(function(x) {
            return x == e;
        })];
        all.push(resi[j]);
    });

    glviewer.setStyle({}, { cartoon: { color: basecolor } });
    glviewer.setStyle({ resi: all }, { cartoon: { color: known_color } });
    glviewer.render();
}

function drawCartoon(chain_index) {
    carousel = chain_index === 0 ? A_carousel : B_carousel;
    carousel_index = chain_index === 0 ? A_index : B_index;
    glviewer = chain_index === 0 ? glviewerA : glviewerB;
    basecolor = chain_index === 0 ? colorA_alt : colorB_alt;

    if (carousel.length === 0) {
        return;
    }

    glviewer.setStyle({}, {});
    glviewer.removeAllSurfaces();
    glviewer.render();

    glviewer.setStyle({}, { cartoon: { color: basecolor } });
    glviewer.render();
}

function drawCurrentView(chain_index) {
    switch (currentViewType[chain_index]) {
        case 'coloredCartoon':
            drawColoredCartoon(chain_index);
            break;

        case 'coloredModel':
            drawColoredModel(chain_index);
            break;

        case 'cartoon':
            drawCartoon(chain_index);
            break;

        case 'model':
            drawModel(chain_index);
            break;
    }
    // drawPersistent(chain_index + 1);
}