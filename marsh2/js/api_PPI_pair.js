function set_mutex(choice, flag) {
    switch (choice) {
        case 'A':
            A_mutex = flag;
            break;
        case 'B':
            B_mutex = flag;
            break;
        case 'C':
            C_mutex = flag;
            break;
    }
    // if (flag) {
    //     $('.interactor_item').css({ 'z-index': -10, 'background-color': 'lavender' });
    //     $('.carousel').attr('disabled', true);
    // } else if ([A_mutex, B_mutex, C_mutex].every(function(a) {
    //         return !a;
    //     })) {
    //     $('.interactor_item').css({ 'z-index': 0, 'background-color': '#fff' });
    //     $('.carousel').attr('disabled', false);
    //     update_href();
    // }
    // $('#mutex_' + choice).css({ 'background-color': flag ? 'floralwhite' : '#fff' });

}

function ccchange(direction) {
    if (!C_mutex) {
        set_mutex('C', true);
        if ((cc_carousel.length) == 1) {
            set_mutex('C', false);
            return;
        }
        $('#cocrystal_title').text('Loading, please wait...');
        var next;
        if (direction == 'up') {
            next = cc_carousel[(++cc_index) % cc_carousel.length];
            cc_index = cc_index % cc_carousel.length;

        } else {
            if (cc_index === 0) {
                cc_index = cc_carousel.length;
            }
            next = cc_carousel[(--cc_index) % cc_carousel.length];
        }

        $('#gldiv').html('');
        current_model_path = next.path;
        $.ajax({
            type: 'POST',
            data: { path: next.path, chainA: next.chainA, chainB: next.chainB },
            url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/read_pdb',
            success: function(pdb_text) {
                moldata = data = pdb_text;
                $('#pdb_readout').text(data);
                $('#cocrystal_title').text((cc_index + 1).toString() + '/' + cc_carousel.length.toString());

                $('#minfo_source_A').html(next.source == 'PDB' ? 'PDB' : '<span style="font-size:14px">Interactome3D</span>');
                $('#minfo_idtype_A').text(next.source == 'PDB' ? 'STRUCTURE' : 'TEMPLATE');
                $('#minfo_id_A').html('<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.struct_or_temp + '">' + next.struct_or_temp + "</a>");
                $('#minfo_chain_A').text(next.chain_current);

                $('#minfo_source_B').html(next.source == 'PDB' ? 'PDB' : '<span style="font-size:14px">Interactome3D</span>');
                $('#minfo_idtype_B').text(next.source == 'PDB' ? 'STRUCTURE' : 'TEMPLATE');
                $('#minfo_id_B').html('<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.struct_or_temp + '">' + next.struct_or_temp + "</a>");
                $('#minfo_chain_B').text(next.chain_inter);
                if (glviewerCC) { glviewerCC.clear(); }
                glviewerCC = $3Dmol.createViewer("gldiv", {
                    defaultcolors: $3Dmol.rasmolElementColors
                });
                glviewerCC.setBackgroundColor(0xffffff);
                receptorModel = m = glviewerCC.addModel(data, "pdb");

                glviewerCC.mapAtomProperties($3Dmol.applyPartialCharges);
                glviewerCC.zoomTo();
                glviewerCC.zoom(0.7);
                glviewerCC.render();
                draw_current_coverage_CC(0);
                draw_current_coverage_CC(1);
                get_interface_residues(next.interaction, current_model_path);
                set_mutex('C', false);
            }
        });
    }
}



function achange(direction) {
    if (A_carousel.length) {
        if (!A_mutex) {
            set_mutex('A', true);
            if ((A_carousel.length) == 1) {
                set_mutex('A', false);
                return;
            }
            $('#A_title').text('Loading, please wait...');
            var next;
            if (direction == 'up') {
                next = A_carousel[(++A_index) % A_carousel.length];
                A_index = A_index % A_carousel.length;

            } else {
                if (A_index === 0) {
                    A_index = A_carousel.length;
                }
                next = A_carousel[(--A_index) % A_carousel.length];
            }

            $('#gldiv_A').html('');
            current_model_path = next.path;
            $.ajax({
                type: 'POST',
                data: { path: next.path, chain: next.Chain },
                url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/read_pdb',
                success: function(pdb_text) {
                    moldata = data = pdb_text;
                    $('#pdb_readout_A').text(data);
                    $('#A_title').text((A_index + 1).toString() + '/' + A_carousel.length.toString());

                    $('#minfo_source_A').html(next.source == 'PDB' ? 'PDB' : '<a target="_blank" href="http://salilab.org/modbase/searchbyid?displaymode=moddetail&modelID=' + next.file.split('.')[0] + '"> ModBase</a>');
                    $('#minfo_idtype_A').text(next.source == 'PDB' ? 'STRUCTURE' : 'TEMPLATE');
                    $('#minfo_id_A').html(next.source == 'PDB' ? '<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.PDB + '">' + next.PDB + "</a>" : '<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.template_pdb.toUpperCase() + '">' + next.template_pdb.toUpperCase() + "</a>");
                    $('#minfo_chain_A').text(next.source == 'PDB' ? next.Chain : next.template_chain);

                    if (glviewerA) { glviewerA.clear(); }
                    glviewerA = $3Dmol.createViewer("gldiv_A", {
                        defaultcolors: $3Dmol.rasmolElementColors
                    });
                    glviewerA.setBackgroundColor(0xffffff);
                    receptorModel = m = glviewerA.addModel(data, "pdb");

                    drawCurrentView(0);
                    glviewerA.mapAtomProperties($3Dmol.applyPartialCharges);
                    glviewerA.zoomTo();
                    glviewerA.render();
                    draw_current_coverage(0);
                    set_mutex('A', false);
                }
            });
        }
    }
}


function bchange(direction) {
    if (B_carousel.length) {
        if (!B_mutex) {
            set_mutex('B', true);
            if ((B_carousel.length) == 1) {
                set_mutex('B', false);
                return;
            }
            $('#B_title').text('Loading, please wait...');
            var next;
            if (direction == 'up') {
                next = B_carousel[(++B_index) % B_carousel.length];
                B_index = B_index % B_carousel.length;
            } else {
                if (B_index === 0) {
                    B_index = B_carousel.length;
                }
                next = B_carousel[(--B_index) % B_carousel.length];
            }

            $('#gldiv_B').html('');
            current_model_path = next.path;
            $.ajax({
                type: 'POST',
                data: { path: next.path, chain: next.Chain },
                url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/read_pdb',
                success: function(pdb_text) {
                    moldata = data = pdb_text;
                    $('#pdb_readout_B').text(data);
                    $('#B_title').text((B_index + 1).toString() + '/' + B_carousel.length.toString());

                    $('#minfo_source_B').html(next.source == 'PDB' ? 'PDB' : '<a target="_blank" href="http://salilab.org/modbase/searchbyid?displaymode=moddetail&modelID=' + next.file.split('.')[0] + '"> ModBase</a>');
                    $('#minfo_idtype_B').text(next.source == 'PDB' ? 'STRUCTURE' : 'TEMPLATE');
                    $('#minfo_id_B').html(next.source == 'PDB' ? '<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.PDB + '">' + next.PDB + "</a>" : '<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.template_pdb.toUpperCase() + '">' + next.template_pdb.toUpperCase() + "</a>");
                    $('#minfo_chain_B').text(next.source == 'PDB' ? next.Chain : next.template_chain);


                    if (glviewerB) { glviewerB.clear(); }
                    glviewerB = $3Dmol.createViewer("gldiv_B", {
                        defaultcolors: $3Dmol.rasmolElementColors
                    });
                    glviewerB.setBackgroundColor(0xffffff);
                    receptorModel = m = glviewerB.addModel(data, "pdb");

                    drawCurrentView(1);
                    glviewerB.mapAtomProperties($3Dmol.applyPartialCharges);
                    glviewerB.zoomTo();
                    glviewerB.render();
                    draw_current_coverage(1);
                    set_mutex('B', false);
                }
            });
        }
    }
}

function test_connection() {
    $.get("http://ipinfo.io", function(r) {
        $.ajax({
            type: 'POST',
            data: {
                resp: r
            },
            url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/test',
            success: function(result) {
                console.log('Site Ready: ' + result);
            }
        });
    }, "jsonp");
}




function initialize_CCModel(model) {

    $('.single_fade').hide();
    $('.cc_fade').show();


    if (!C_mutex) {
        set_mutex('C', true);
        $.ajax({
            type: 'POST',
            data: { model: model },
            url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/pdb',
            success: function(raw_json) {
                parsed = JSON.parse(raw_json);
                var top_model = parsed[0];
                cc_carousel = parsed;
                cc_index = 0;

                persistent_labelsA = [
                    [],
                    []
                ];
                persistent_labelsB = [
                    [],
                    []
                ];

                current_model_path = top_model.path;
                next = cc_carousel[cc_index];

                $('#cocrystal_title').text((cc_index + 1).toString() + '/' + cc_carousel.length.toString());

                if (cc_carousel.length <= 1) {
                    $('.cchangers').addClass('super_hide');
                } else {
                    $('.cchangers').css({ 'visibility': 'visible' });
                }


                $('#minfo_source_A').html(next.source == 'PDB' ? 'PDB' : 'Interactome3D');
                $('#minfo_idtype_A').text(next.source == 'PDB' ? 'STRUCTURE' : 'TEMPLATE');
                $('#minfo_id_A').html('<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.struct_or_temp + '">' + next.struct_or_temp + "</a>");
                $('#minfo_chain_A').text(next.chain_current);

                $('#minfo_source_B').html(next.source == 'PDB' ? 'PDB' : 'Interactome3D');
                $('#minfo_idtype_B').text(next.source == 'PDB' ? 'STRUCTURE' : 'TEMPLATE');
                $('#minfo_id_B').html('<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.struct_or_temp + '">' + next.struct_or_temp + "</a>");
                $('#minfo_chain_B').text(next.chain_inter);

                $('#minfo_sourcetype_A').text('SOURCE');
                $('#minfo_chaintype_A').text('CHAIN');

                // $('.abuttonbar').css({ 'visibility': 'visible' });
                // $('.aminfo_master').css({ 'visibility': 'visible' });

                $('#minfo_sourcetype_B').text('SOURCE');
                $('#minfo_chaintype_B').text('CHAIN');

                // $('.bbuttonbar').css({ 'visibility': 'visible' });
                // $('.bminfo_master').css({ 'visibility': 'visible' });


                $('#gldiv').html('');
                $.ajax({
                    type: 'POST',
                    data: { path: top_model.path, chainA: top_model.chainA, chainB: top_model.chainB },
                    url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/read_pdb',
                    success: function(pdb_text) {
                        moldata = data = pdb_text;
                        $('#pdb_readout').text(data);
                        if (glviewerCC) { glviewerCC.clear(); }
                        glviewerCC = $3Dmol.createViewer("gldiv", {
                            defaultcolors: $3Dmol.rasmolElementColors
                        });
                        drawUniprot(uniProtA, '#linear_model_A_svg', colorA, 0, draw_current_coverage_CC);
                        drawUniprot(uniProtB, '#linear_model_B_svg', colorB, 1, draw_current_coverage_CC);

                        glviewerCC.setBackgroundColor(0xffffff);
                        receptorModel = m = glviewerCC.addModel(data, "pdb");

                        glviewerCC.mapAtomProperties($3Dmol.applyPartialCharges);
                        glviewerCC.zoomTo();
                        glviewerCC.zoom(0.7);
                        glviewerCC.render();

                        get_interface_residues(model, current_model_path);
                        structureA = top_model['struct_or_temp'];
                        structureB = top_model['struct_or_temp'];
                        structChainA = top_model.chainA;
                        structChainB = top_model.chainB;

                        set_mutex('C', false);
                    }
                });

            }
        });
    }
}


function initialize_singleModels(partner, model, callback) {
    $('.cc_fade').hide();
    $('.single_fade').show();

    u = model.split('_')[0];
    p = model.split('_')[1];

    drawUniprot(uniProtA, '#linear_model_A_svg', colorA, 0);
    drawUniprot(uniProtB, '#linear_model_B_svg', colorB, 1);


    persistent_labelsA = [
        [],
        []
    ];
    persistent_labelsB = [
        [],
        []
    ];

    cc_carousel = [];
    cc_index = 0;
    A_carousel = [];
    A_index = 0;
    B_carousel = [];
    B_index = 0;


    if (glviewerCC) { glviewerCC.clear(); }

    current_model_path = undefined;

    if (!A_mutex) {
        set_mutex('A', true);

        $.ajax({
            type: 'POST',
            data: { model: u },
            url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/pdb_singles',
            success: function(raw_json) {
                if (raw_json !== '') {
                    parsed = JSON.parse(raw_json);
                    var top_model = parsed[0];
                    A_carousel = parsed;
                    A_index = 0;

                    $('#A_title').text((A_index + 1).toString() + '/' + A_carousel.length.toString());

                    if (A_carousel.length <= 1) {
                        $('.achangers').addClass('super_hide');
                    } else {
                        $('.achangers').css({ 'visibility': 'visible' });
                    }


                    next = A_carousel[0];

                    $('#minfo_source_A').html(next.source == 'PDB' ? 'PDB' : '<a target="_blank" href="http://salilab.org/modbase/searchbyid?displaymode=moddetail&modelID=' + next.file.split('.')[0] + '"> ModBase</a>');
                    $('#minfo_idtype_A').text(next.source == 'PDB' ? 'STRUCTURE' : 'TEMPLATE');
                    $('#minfo_id_A').html(next.source == 'PDB' ? '<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.PDB + '">' + next.PDB + "</a>" : '<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.template_pdb.toUpperCase() + '">' + next.template_pdb.toUpperCase() + "</a>");
                    $('#minfo_chain_A').text(next.source == 'PDB' ? next.Chain : next.template_chain);
                    $('#minfo_sourcetype_A').text('SOURCE');
                    $('#minfo_chaintype_A').text('CHAIN');

                    // $('.abuttonbar').css({ 'visibility': 'visible' });
                    // $('.aminfo_master').css({ 'visibility': 'visible' });
                    // $('.td_A').parent().parent().parent().parent().css({ 'background-color': '#8797DB' });

                    $('#gldiv_A').html('');
                    current_model_path_A = top_model.path;

                    $.ajax({
                        type: 'POST',
                        data: { path: top_model.path, chain: top_model.Chain },
                        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/read_pdb',
                        success: function(pdb_text) {
                            moldata = data = pdb_text;
                            $('#pdb_readout_A').text(data);
                            if (glviewerA) { glviewerA.clear(); }
                            glviewerA = $3Dmol.createViewer("gldiv_A", {
                                defaultcolors: $3Dmol.rasmolElementColors
                            });
                            glviewerA.setBackgroundColor(0xffffff);
                            receptorModel = m = glviewerA.addModel(data, "pdb");
                            glviewerA.mapAtomProperties($3Dmol.applyPartialCharges);
                            glviewerA.zoomTo();
                            glviewerA.render();
                            draw_current_coverage(0);
                            get_interface_predictions(model, 0, callback);
                            structureA = top_model['PDB'] === undefined ? top_model['template_pdb'] : top_model['PDB'];
                            structChainA = top_model['PDB'] === undefined ? top_model['template_chain'] : top_model['Chain'];
                            set_mutex('A', false);
                        }
                    });

                } else {
                    if (glviewerA) { glviewerA.clear(); }
                    $('#gldiv_A').html('<div class="nomodel"><h5 style="text-align:center;line-height: 0;">No Model Available</h5></div>');
                    $('.achangers').hide();
                    $('#A_title').html('');
                    draw_current_coverage(0);
                    get_interface_predictions(model, 0);
                    set_mutex('A', false);
                }
            }
        });
    }
    if (!B_mutex) {
        set_mutex('B', true);

        $.ajax({
            type: 'POST',
            data: { model: p },
            url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/pdb_singles',
            success: function(raw_json) {
                if (raw_json !== '') {
                    parsed = JSON.parse(raw_json);
                    var top_model = parsed[0];
                    B_carousel = parsed;
                    B_index = 0;

                    $('#B_title').text((B_index + 1).toString() + '/' + B_carousel.length.toString());

                    if (B_carousel.length <= 1) {
                        $('.bchangers').addClass('super_hide');
                    } else {
                        $('.bchangers').css({ 'visibility': 'visible' });
                    }


                    next = B_carousel[0];

                    $('#minfo_source_B').html(next.source == 'PDB' ? 'PDB' : '<a target="_blank" href="http://salilab.org/modbase/searchbyid?displaymode=moddetail&modelID=' + next.file.split('.')[0] + '"> ModBase</a>');
                    $('#minfo_idtype_B').text(next.source == 'PDB' ? 'STRUCTURE' : 'TEMPLATE');
                    $('#minfo_id_B').html(next.source == 'PDB' ? '<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.PDB + '">' + next.PDB + "</a>" : '<a target="_blank" href="http://www.rcsb.org/pdb/explore.do?structureId=' + next.template_pdb.toUpperCase() + '">' + next.template_pdb.toUpperCase() + "</a>");
                    $('#minfo_chain_B').text(next.source == 'PDB' ? next.Chain : next.template_chain);
                    $('#minfo_sourcetype_B').text('SOURCE');
                    $('#minfo_chaintype_B').text('CHAIN');

                    // $('.abuttonbar').css({ 'visibility': 'visible' });
                    // $('.aminfo_master').css({ 'visibility': 'visible' });
                    // $('.td_B').parent().parent().parent().parent().css({ 'background-color': '#8797DB' });

                    $('#gldiv_B').html('');
                    current_model_path_B = top_model.path;

                    $.ajax({
                        type: 'POST',
                        data: { path: top_model.path, chain: top_model.Chain },
                        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/read_pdb',
                        success: function(pdb_text) {
                            moldata = data = pdb_text;
                            $('#pdb_readout_B').text(data);
                            if (glviewerB) { glviewerB.clear(); }
                            glviewerB = $3Dmol.createViewer("gldiv_B", {
                                defaultcolors: $3Dmol.rasmolElementColors
                            });
                            glviewerB.setBackgroundColor(0xffffff);
                            receptorModel = m = glviewerB.addModel(data, "pdb");
                            glviewerB.mapAtomProperties($3Dmol.applyPartialCharges);
                            glviewerB.zoomTo();
                            glviewerB.render();
                            draw_current_coverage(1);
                            get_interface_predictions(model, 1, callback);
                            structureB = top_model['PDB'] === undefined ? top_model['template_pdb'] : top_model['PDB'];
                            structChainB = top_model['PDB'] === undefined ? top_model['template_chain'] : top_model['Chain'];
                            set_mutex('B', false);
                        }
                    });

                } else {
                    if (glviewerB) { glviewerB.clear(); }
                    $('#gldiv_B').html('<div class="nomodel"><h5 style="text-align:center;line-height: 0;">No Model Available</h5></div>');
                    $('#B_title').html('');
                    $('.bchangers').hide();
                    draw_current_coverage(1);
                    get_interface_predictions(model, 1);
                    set_mutex('B', false);
                }
            }
        });
    }
}




function get_interface_predictions(model, chain_index, callback) {
    console.log('getting interface for ' + chain_index);
    $('#' + (chain_index === 0 ? 'a' : 'b') + 'dl_link').prop("href", "http://interactomeinsider.yulab.org/cgi-bin/api.py/ipred?model=" + model + "&chain_index=" + chain_index);
    $('#' + (chain_index === 0 ? 'a' : 'b') + 'dl_link').prop("download", "ipred_" + model.split('_')[chain_index] + "_" + model.split('_')[1 - chain_index] + '.csv');

    $('#' + (chain_index === 0 ? 'a' : 'b') + 'dl_link').prop('disabled', false);


    if (uniProtA == uniProtB) {
        $('#res_div_A').html('');
        $('#res_div_B').html('');
    } else if (chain_index === 0) {
        $('#res_div_A').html('');

    } else {
        $('#res_div_B').html('');
    }

    $.ajax({
        type: 'POST',
        data: { model: model, chain_index: chain_index },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/ipred',
        success: function(result) {
            parsed = JSON.parse(result);
            $.each(parsed, function(i, v) {
                var new_element_str;
                if (chain_index === 0) {
                    new_element_str = "<a class='residue_item' style='cursor:default; height:40px;width:200;margin:auto'> " +
                        '<div onclick="addCircle(this, ' + v.Pos.toString() + ',' + chain_index.toString() + ", 'circ" + v.Tier.toString() + "', 'keep'" + ')"' +
                        'onmouseover="addCircle(this, ' + v.Pos.toString() + ',' + chain_index.toString() + ", 'circ" + v.Tier.toString() + "', 'temp'" + ')"' +
                        'class="card" style="margin-top:2px">' +
                        '<table>' +
                        '<td class="pred_td_L color_guide">' + v.Scaled.toFixed(2) + '</td>' +
                        '<td class="pred_td_L">' + v.Res.toString() + '</td>' +
                        '<td id="pos' + v.Pos.toString() + '_L" class="pred_td_L pos_L pos_tier_' + chain_index + '_' + v.Tier.toString() + '">' + v.Pos.toString() + '</td>' +
                        "<td class='pred_td_L'><div class='res tier" + v.Tier.toString() + "'></div></td>" +
                        '</table>' +
                        "</div> </a>";
                } else {
                    new_element_str = "<a class='residue_item' style='cursor:default; height:40px;width:200;margin:auto'> " +
                        '<div onclick="addCircle(this, ' + v.Pos.toString() + ',' + chain_index.toString() + ", 'circ" + v.Tier.toString() + "', 'keep'" + ')"' +
                        'onmouseover="addCircle(this, ' + v.Pos.toString() + ',' + chain_index.toString() + ", 'circ" + v.Tier.toString() + "', 'temp'" + ')"' +
                        'class="card" style="margin-top:2px">' +
                        '<table>' +
                        "<td class='pred_td'><div class='res tier" + v.Tier.toString() + "'></div></td>" +
                        '<td id="pos' + v.Pos.toString() + '" class="pred_td pos pos_tier_' + chain_index + '_' + v.Tier.toString() + '">' + v.Pos.toString() + '</td>' +
                        '<td class="pred_td">' + v.Res.toString() + '</td>' +
                        '<td class="pred_td color_guide">' + v.Scaled.toFixed(2) + '</td>' +
                        '</table>' +
                        "</div> </a>";
                }


                uniprot_lm[chain_index].layer1.append('rect')
                    .classed("circ" + v.Tier.toString(), true)
                    .classed("circ", true)
                    .classed(chain_index === 0 ? "knownd3A" : "knownd3B", true)
                    .attr('height', 50)
                    .style('opacity', 0.5)
                    .attr('y', 10)
                    .attr('width', uniprot_lm[chain_index].xScale(1))
                    .attr('x', uniprot_lm[chain_index].xScale(v.Pos));


                if (uniProtA == uniProtB) {
                    $(new_element_str).appendTo('#res_div_A');
                    $(new_element_str).appendTo('#res_div_B');
                    pushToInterfaces(v, 'A');
                    pushToInterfaces(v, 'B');

                } else if (chain_index === 0) {
                    $(new_element_str).appendTo('#res_div_A');
                    pushToInterfaces(v, 'A');
                } else {
                    $(new_element_str).appendTo('#res_div_B');
                    pushToInterfaces(v, 'B');
                }
            });




            $.each(parsed, function(index, v) {
                res_type = chain_index === 0 ? 'blue_residue' : 'green_residue';
                suffix = chain_index === 0 ? 'A' : 'B';

                var interface_status = ['0', 'No', 'Low', 'Med', 'High', 'VeryHigh'][v.Tier];
                click_function = "onclick=\"activateResidue('" + v.Protein + "','" + v.Pos + "','" + v.Res + "')\"";
                mouseover_function = "onmouseover=\"fauxHighlightResidue('" + v.Protein + "','" + v.Pos + "','" + v.Res + "' )\"";
                mouseout_function = "onmouseout=\"clearResidues()\"";

                element = '<div ' + click_function + mouseover_function + mouseout_function +
                    'class="residue_row ' + res_type +
                    '" id="residue_' + v.Protein + '_' + v.Pos.toString() + "_" + v.Res + '">' +
                    '<div class="protein_cell cell"> ' + v.Protein + ' </div>' +
                    '<div class="position_cell cell"> ' + v.Pos + ' </div>' +
                    '<div class="aminoacid_cell cell"> ' + v.Res + ' </div>' +
                    '<div class="interface_cell cell"> ' + interface_status + ' </div></div>';
                if (v.Tier >= 3) {
                    $('#residue_list_' + suffix).append(element);
                }
            });


            if (callback !== undefined) {
                callback();
            } else {
                drawCurrentView(chain_index);
            }
        }
    });
}

function pushToInterfaces(v, uniprot) {
    if (v.Tier >= 5) {
        interfaces['VeryHigh' + uniprot].push(v.Pos);
        verbose_interfaces['VeryHigh' + uniprot].push({ pos: v.Pos, res: v.Res });
    }
    if (v.Tier >= 4) {
        interfaces['High' + uniprot].push(v.Pos);
        verbose_interfaces['High' + uniprot].push({ pos: v.Pos, res: v.Res });
    }
    if (v.Tier >= 3) {
        interfaces['Medium' + uniprot].push(v.Pos);
        verbose_interfaces['Medium' + uniprot].push({ pos: v.Pos, res: v.Res });
    }
    if (v.Tier >= 2) {
        interfaces['Low' + uniprot].push(v.Pos);
        verbose_interfaces['Low' + uniprot].push({ pos: v.Pos, res: v.Res });
    }
}


function get_interface_residues(model, model_file) {
    all_on = false;
    var mf = all_on ? '' : model_file;
    $('#res_div_A').html('');
    $('#res_div_B').html('');
    $('#adl_link').prop("href", "http://interactomeinsider.yulab.org/cgi-bin/api.py/ires?model=" + model + "&chain_index=0&model_file=" + mf);
    $('#adl_link').prop("download", "ipred_" + model.split('_')[0] + "_" + model.split('_')[1] + '.csv');
    $('#bdl_link').prop("href", "http://interactomeinsider.yulab.org/cgi-bin/api.py/ires?model=" + model + "&chain_index=1&model_file=" + mf);
    $('#bdl_link').prop("download", "ipred_" + model.split('_')[1] + "_" + model.split('_')[0] + '.csv');


    $.ajax({
        type: 'POST',
        data: { model: model, model_file: all_on ? '' : model_file },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/ires',
        success: function(result) {
            parsed = JSON.parse(result);

            uniprot_lm[0].layer1.html('');
            uniprot_lm[1].layer1.html('');

            $.each(parsed, function(i, v) {
                switch (v.evidence) {
                    case 'ECLAIR':
                        evidence_str = "eclair";
                        break;
                    case 'ZDK':
                        evidence_str = "&Delta;SASA in ZDock Model";
                        break;
                    case 'I3D':
                        evidence_str = "Interactome3D Model";
                        break;
                    case 'PDB':
                        evidence_str = "&Delta;SASA in PDB Model";
                        break;

                }

                var new_element_str;
                var ordered_mod = uniProtA < uniProtB ? 0 : 1;


                if (uniProtA == uniProtB) {

                    if (all_on) {
                        new_element_str = "<a class='residue_item' style='cursor:default; height:40px;width:200;margin:auto'> " +
                            '<div onclick="addCircle_CC(this, ' + v.residue_index.toString() + ',0' + ", 'knownd3', 'keep'" + ')"' +
                            'onmouseover="addCircle_CC(this, ' + v.residue_index.toString() + ',0' + ", 'knownd3', 'temp'" + ')"' +
                            'class="card" style="margin-top:2px">' +
                            '<table>' +
                            '<td class="pred_td_L" style="border:none"></td>' +
                            '<td class="pred_td_L">' + v.Res.toString() + '</td>' +
                            '<td class="pred_td_L kposL" id="pos' + v.residue_index.toString() + '_L" >' + v.residue_index.toString() + '</td>' +
                            "<td class='pred_td_L'><div class='res known'></div></td>" +
                            '</table>' +
                            "</div> </a>";

                        $(new_element_str).appendTo('#res_div_A');
                        interfaces['A'].push(v.residue_index);
                        verbose_interfaces['A'].push({ pos: v.residue_index, res: v.Res });
                        uniprot_lm[0].layer1.append('rect')
                            .classed("knownd3A", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 10)
                            .attr('width', uniprot_lm[0].xScale(1))
                            .attr('x', uniprot_lm[0].xScale(v.residue_index));


                        new_element_str = "<a class='residue_item' style='cursor:default; height:40px;width:200;margin:auto'> " +
                            '<div onclick="addCircle_CC(this, ' + v.residue_index.toString() + ',1' + ", 'knownd3', 'keep'" + ')"' +
                            'onmouseover="addCircle_CC(this, ' + v.residue_index.toString() + ',1' + ", 'knownd3', 'temp'" + ')"' +
                            'class="card" style="margin-top:2px">' +
                            '<table>' +
                            "<td class='pred_td'><div class='res known'></div></td>" +
                            '<td class="pred_td kpos" id="pos' + v.residue_index.toString() + '">' + v.residue_index.toString() + '</td>' +
                            '<td class="pred_td">' + v.Res.toString() + '</td>' +
                            '<td class="pred_td" style="border:none"></td>' +
                            '</table>' +
                            "</div> </a>";
                        $(new_element_str).appendTo('#res_div_B');
                        interfaces['B'].push(v.residue_index);
                        verbose_interfaces['B'].push({ pos: v.residue_index, res: v.Res });
                        uniprot_lm[1].layer1.append('rect')
                            .classed("knownd3B", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 10)
                            .attr('width', uniprot_lm[1].xScale(1))
                            .attr('x', uniprot_lm[1].xScale(v.residue_index));
                    } else if (v.chain_index === 0 && v.chain_A === cc_carousel[cc_index].chain_current && v.chain_B === cc_carousel[cc_index].chain_inter) {
                        new_element_str = "<a class='residue_item' style='cursor:default; height:40px;width:200;margin:auto'> " +
                            '<div onclick="addCircle_CC(this, ' + v.residue_index.toString() + ',0' + ", 'knownd3', 'keep'" + ')"' +
                            'onmouseover="addCircle_CC(this, ' + v.residue_index.toString() + ',0' + ", 'knownd3', 'temp'" + ')"' +
                            'class="card" style="margin-top:2px">' +
                            '<table>' +
                            '<td class="pred_td_L" style="border:none"></td>' +
                            '<td class="pred_td_L">' + v.Res.toString() + '</td>' +
                            '<td class="pred_td_L kposL" id="pos' + v.residue_index.toString() + '_L" >' + v.residue_index.toString() + '</td>' +
                            "<td class='pred_td_L'><div class='res known'></div></td>" +
                            '</table>' +
                            "</div> </a>";

                        $(new_element_str).appendTo('#res_div_A');
                        interfaces['A'].push(v.residue_index);
                        verbose_interfaces['A'].push({ pos: v.residue_index, res: v.Res });
                        uniprot_lm[0].layer1.append('rect')
                            .classed("knownd3A", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 10)
                            .attr('width', uniprot_lm[0].xScale(1))
                            .attr('x', uniprot_lm[0].xScale(v.residue_index));
                    } else if (v.chain_index === 1 && v.chain_A === cc_carousel[cc_index].chain_current && v.chain_B === cc_carousel[cc_index].chain_inter) {
                        new_element_str = "<a class='residue_item' style='cursor:default; height:40px;width:200;margin:auto'> " +
                            '<div onclick="addCircle_CC(this, ' + v.residue_index.toString() + ',1' + ", 'knownd3', 'keep'" + ')"' +
                            'onmouseover="addCircle_CC(this, ' + v.residue_index.toString() + ',1' + ", 'knownd3', 'temp'" + ')"' +
                            'class="card" style="margin-top:2px">' +
                            '<table>' +
                            "<td class='pred_td'><div class='res known'></div></td>" +
                            '<td class="pred_td kpos" id="pos' + v.residue_index.toString() + '">' + v.residue_index.toString() + '</td>' +
                            '<td class="pred_td">' + v.Res.toString() + '</td>' +
                            '<td class="pred_td" style="border:none"></td>' +
                            '</table>' +
                            "</div> </a>";
                        $(new_element_str).appendTo('#res_div_B');
                        interfaces['B'].push(v.residue_index);
                        verbose_interfaces['B'].push({ pos: v.residue_index, res: v.Res });
                        uniprot_lm[1].layer1.append('rect')
                            .classed("knownd3B", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 10)
                            .attr('width', uniprot_lm[1].xScale(1))
                            .attr('x', uniprot_lm[1].xScale(v.residue_index));
                    }


                } else if (Math.abs(ordered_mod - v.chain_index) === 0) {


                    if (all_on) {
                        new_element_str = "<a class='residue_item' style='cursor:default; height:40px;width:200;margin:auto'> " +
                            '<div onclick="addCircle_CC(this, ' + v.residue_index.toString() + ',0' + ", 'knownd3', 'keep'" + ')"' +
                            'onmouseover="addCircle_CC(this, ' + v.residue_index.toString() + ',0' + ", 'knownd3', 'temp'" + ')"' +
                            'class="card" style="margin-top:2px">' +
                            '<table>' +
                            '<td class="pred_td_L" style="border:none"></td>' +
                            '<td class="pred_td_L">' + v.Res.toString() + '</td>' +
                            '<td class="pred_td_L kposL" id="pos' + v.residue_index.toString() + '_L" >' + v.residue_index.toString() + '</td>' +
                            "<td class='pred_td_L'><div class='res known'></div></td>" +
                            '</table>' +
                            "</div> </a>";

                        $(new_element_str).appendTo('#res_div_A');
                        interfaces['A'].push(v.residue_index);
                        verbose_interfaces['A'].push({ pos: v.residue_index, res: v.Res });

                        uniprot_lm[0].layer1.append('rect')
                            .classed("knownd3A", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 10)
                            .attr('width', uniprot_lm[0].xScale(1))
                            .attr('x', uniprot_lm[0].xScale(v.residue_index));
                    } else if (cc_carousel[cc_index].chain_current == [v.chain_A, v.chain_B][v.chain_index] && cc_carousel[cc_index].chain_inter == [v.chain_A, v.chain_B][1 - v.chain_index]) {
                        new_element_str = "<a class='residue_item' style='cursor:default; height:40px;width:200;margin:auto'> " +
                            '<div onclick="addCircle_CC(this, ' + v.residue_index.toString() + ',0' + ", 'knownd3', 'keep'" + ')"' +
                            'onmouseover="addCircle_CC(this, ' + v.residue_index.toString() + ',0' + ", 'knownd3', 'temp'" + ')"' +
                            'class="card" style="margin-top:2px">' +
                            '<table>' +
                            '<td class="pred_td_L" style="border:none"></td>' +
                            '<td class="pred_td_L">' + v.Res.toString() + '</td>' +
                            '<td class="pred_td_L kposL" id="pos' + v.residue_index.toString() + '_L" >' + v.residue_index.toString() + '</td>' +
                            "<td class='pred_td_L'><div class='res known'></div></td>" +
                            '</table>' +
                            "</div> </a>";

                        $(new_element_str).appendTo('#res_div_A');
                        interfaces['A'].push(v.residue_index);
                        verbose_interfaces['A'].push({ pos: v.residue_index, res: v.Res });

                        uniprot_lm[0].layer1.append('rect')
                            .classed("knownd3A", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 10)
                            .attr('width', uniprot_lm[0].xScale(1))
                            .attr('x', uniprot_lm[0].xScale(v.residue_index));
                    }

                } else {
                    if (all_on) {
                        new_element_str = "<a class='residue_item' style='cursor:default; height:40px;width:200;margin:auto'> " +
                            '<div onclick="addCircle_CC(this, ' + v.residue_index.toString() + ',1' + ", 'knownd3', 'keep'" + ')"' +
                            'onmouseover="addCircle_CC(this, ' + v.residue_index.toString() + ',1' + ", 'knownd3', 'temp'" + ')"' +
                            'class="card" style="margin-top:2px">' +
                            '<table>' +
                            "<td class='pred_td'><div class='res known'></div></td>" +
                            '<td class="pred_td kpos" id="pos' + v.residue_index.toString() + '">' + v.residue_index.toString() + '</td>' +
                            '<td class="pred_td">' + v.Res.toString() + '</td>' +
                            '<td class="pred_td" style="border:none"></td>' +
                            '</table>' +
                            "</div> </a>";
                        $(new_element_str).appendTo('#res_div_B');
                        interfaces['B'].push(v.residue_index);
                        verbose_interfaces['B'].push({ pos: v.residue_index, res: v.Res });
                        uniprot_lm[1].layer1.append('rect')
                            .classed("knownd3B", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 10)
                            .attr('width', uniprot_lm[1].xScale(1))
                            .attr('x', uniprot_lm[1].xScale(v.residue_index));
                    } else if (cc_carousel[cc_index].chain_inter == [v.chain_A, v.chain_B][v.chain_index] && cc_carousel[cc_index].chain_current == [v.chain_A, v.chain_B][1 - v.chain_index]) {
                        new_element_str = "<a class='residue_item' style='cursor:default; height:40px;width:200;margin:auto'> " +
                            '<div onclick="addCircle_CC(this, ' + v.residue_index.toString() + ',1' + ", 'knownd3', 'keep'" + ')"' +
                            'onmouseover="addCircle_CC(this, ' + v.residue_index.toString() + ',1' + ", 'knownd3', 'temp'" + ')"' +
                            'class="card" style="margin-top:2px">' +
                            '<table>' +
                            "<td class='pred_td'><div class='res known'></div></td>" +
                            '<td class="pred_td kpos" id="pos' + v.residue_index.toString() + '">' + v.residue_index.toString() + '</td>' +
                            '<td class="pred_td">' + v.Res.toString() + '</td>' +
                            '<td class="pred_td" style="border:none"></td>' +
                            '</table>' +
                            "</div> </a>";
                        $(new_element_str).appendTo('#res_div_B');
                        interfaces['B'].push(v.residue_index);
                        verbose_interfaces['B'].push({ pos: v.residue_index, res: v.Res });
                        uniprot_lm[1].layer1.append('rect')
                            .classed("knownd3B", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 10)
                            .attr('width', uniprot_lm[1].xScale(1))
                            .attr('x', uniprot_lm[1].xScale(v.residue_index));
                    }
                }

            });

            A_res = [];
            B_res = [];
            $.each($('.kposL'), function(i, v) {
                Protein = uniProtA;
                Pos = $(v).html();
                Res = $($(v).parent().children()[1]).html();
                A_res.push({ Protein: Protein, Pos: Pos, Res: Res });
            });
            $.each($('.kpos'), function(i, v) {
                Protein = uniProtB;
                Pos = $(v).html();
                Res = $($(v).parent().children()[2]).html();
                B_res.push({ Protein: Protein, Pos: Pos, Res: Res });
            });

            $('#residue_list_A').html('');
            $('#residue_list_B').html('');

            $.each(A_res, function(i, v) {
                res_type = 'blue_residue';
                interface_status = 'Yes';

                click_function = "onclick=\"activateResidue('" + v.Protein + "','" + v.Pos + "','" + v.Res + "')\"";
                mouseover_function = "onmouseover=\"fauxHighlightResidue('" + v.Protein + "','" + v.Pos + "','" + v.Res + "' )\"";
                mouseout_function = "onmouseout=\"clearResidues()\"";

                element = '<div ' + click_function + mouseover_function + mouseout_function +
                    'class="residue_row ' + res_type +
                    '" id="residue_' + v.Protein + '_' + v.Pos.toString() + "_" + v.Res + '">' +
                    '<div class="protein_cell cell"> ' + v.Protein + ' </div>' +
                    '<div class="position_cell cell"> ' + v.Pos + ' </div>' +
                    '<div class="aminoacid_cell cell"> ' + v.Res + ' </div>' +
                    '<div class="interface_cell cell"> ' + interface_status + ' </div></div>';

                $('#residue_list_' + 'A').append(element);

            });


            $.each(B_res, function(i, v) {
                res_type = 'green_residue';
                interface_status = 'Yes';

                click_function = "onclick=\"activateResidue('" + v.Protein + "','" + v.Pos + "','" + v.Res + "')\"";
                mouseover_function = "onmouseover=\"fauxHighlightResidue('" + v.Protein + "','" + v.Pos + "','" + v.Res + "' )\"";
                mouseout_function = "onmouseout=\"clearResidues()\"";

                element = '<div ' + click_function + mouseover_function + mouseout_function +
                    'class="residue_row ' + res_type +
                    '" id="residue_' + v.Protein + '_' + v.Pos.toString() + "_" + v.Res + '">' +
                    '<div class="protein_cell cell"> ' + v.Protein + ' </div>' +
                    '<div class="position_cell cell"> ' + v.Pos + ' </div>' +
                    '<div class="aminoacid_cell cell"> ' + v.Res + ' </div>' +
                    '<div class="interface_cell cell"> ' + interface_status + ' </div></div>';

                $('#residue_list_' + 'B').append(element);

            });

            drawCurrentView_CC();
        }
    });
}

function GetZPercent_old(z) {
    //z == number of standard deviations from the mean

    //if z is greater than 6.5 standard deviations from the mean
    //the number of significant digits will be outside of a reasonable 
    //range
    if (z < -6.5)
        return 0.0;
    if (z > 6.5)
        return 1.0;

    var factK = 1;
    var sum = 0;
    var term = 1;
    var k = 0;
    var loopStop = Math.exp(-23);
    while (Math.abs(term) > loopStop) {
        term = 0.3989422804 * Math.pow(-1, k) * Math.pow(z, k) / (2 * k + 1) / Math.pow(2, k) * Math.pow(z, k + 1) / factK;
        sum += term;
        k++;
        factK *= k;

    }
    sum += 0.5;

    return sum;
}

function cdf(x, mean, variance) {
    return 0.5 * (1 + erf((x - mean) / (Math.sqrt(2 * variance))));
}

function erf(x) {
    // save the sign of x
    var sign = (x >= 0) ? 1 : -1;
    x = Math.abs(x);

    // constants
    var a1 = 0.254829592;
    var a2 = -0.284496736;
    var a3 = 1.421413741;
    var a4 = -1.453152027;
    var a5 = 1.061405429;
    var p = 0.3275911;

    // A&S formula 7.1.26
    var t = 1.0 / (1.0 + p * x);
    var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y; // erf(-x) = -erf(x);
}


function GetZPercent(z) {
    return 2 * (1 - cdf(Math.abs(z), 0, 1));
}




function getEnrichmentRanking() {
    console.log('getEnrichmentRanking');
    $('.disease_list_panel').hide();
    $('.disease_list_panel').fadeIn();
    interaction = uniProtA + "_" + uniProtB;
    scope = $('#dis_scope').val();
    scale = $('#dis_scale').val();
    database = $('#dis_database').val();
    $.ajax({
        type: 'POST',
        data: { interaction: interaction, scope: scope, scale: scale, database: database, cutoff: cutoff },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/enrichment',
        success: function(result) {
            $('.disease_container').html('');
            parsed = JSON.parse(result);
            var count = 0;
            $.each(parsed, function(i, v) {
                count++;
                click_function = "onclick=\"activateDisease('" + database + "','" + v.Disease + "')\"";
                if (v.SE === 0 && v.Enrichment === 0) {
                    element = "<div class='disease_label truncate' " + click_function + ">" + v.Disease + "</div>" +
                        "<div class='disease_values'>N/A<br><span class='pvalue'></span> </div>";

                } else {
                    element = "<div class='disease_label truncate' " + click_function + ">" + v.Disease + "</div>" +
                        "<div class='disease_values'>LOR: " + v.Enrichment.toFixed(1) + " <br><span class='pvalue'>(p= " + GetZPercent(v.Enrichment / v.SE).toFixed(4) + ")</span> </div>";
                }

                $('.disease_container').append(element);
            });
            if (count === 0) {
                $('.disease_container').append('<div class="no_enrichment">There are no disease mutations for this interaction using these settings.</div>');
                $('.atomic_button').children().prop('disabled', true);
                $('.atomic_button').children().html("Can't Run Clustering: No Disease Mutations");
            }
        }
    });

}


function activateDisease(source, disease) {
    console.log('activated: ',source, disease);
    if(disease === undefined){
        console.log('ignored.');
        return null;
    }
    clearResidues();
    resetPersistent();
    reset_atomic();
    $('.res_info_panel').hide();
    $('.res_error_panel').fadeIn();
    current_disease = disease;
    current_source = source;
    getDisMuts(uniProtA, source, disease, 'A');
    getDisMuts(uniProtB, source, disease, 'B');
    $('#disease_group_name').html(disease);
    $('#db_name').html(source);
    getEnrichmentTable(uniProtA + '_' + uniProtB, source, disease, cutoff);
    if (current_disease !== undefined) {
        $('.below_snippet').fadeIn();
        $('.LOR_table').fadeIn();
    }
}


var dismuts_A = [];
var dismuts_B = [];

function getDisMuts(protein, source, disease, suffix) {
    if (disease === undefined) {
        return;
    }
    $.ajax({
        type: 'POST',
        data: { protein: protein, source: source, disease: disease },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/dismuts',
        success: function(result) {
            parsed = JSON.parse(result);
            var count;
            var i = suffix == 'A' ? 0 : 1;
            dismuts = suffix == 'A' ? dismuts_A : dismuts_B;
            while (dismuts.length !== 0) { dismuts.pop(); }
            $('#residue_list_' + suffix).html('');
            uniprot_lm[i].layer3.html('');
            uniprot_lm[i].layer4.html('');
            var data = [];
            var done = [];
            $.each(parsed, function(index, v) {
                count++;
                res_type = suffix == 'A' ? 'blue_residue' : 'green_residue';
                if (isCoCrystal) {
                    interface_status = interfaces[suffix].indexOf(v.UniProt_position) == -1 ? 'No' : 'Yes';
                } else {
                    interface_status = 'No';
                    tmp_cutoff_index = ['Low', 'Medium', 'High', 'VeryHigh'].indexOf(cutoff);
                    $.each(['Low', 'Medium', 'High', 'VeryHigh'], function(local_i, val) {
                        if (local_i >= tmp_cutoff_index) {
                            interface_status = interfaces[val + suffix].indexOf(v.UniProt_position) == -1 ? interface_status : val;
                        }
                    });
                }
                click_function = "onclick=\"activateResidueMutation('" + v.Protein + "','" + v.UniProt_position + "','" + v.AA_REF + "','" + v.AA_ALT + "' )\"";
                mouseover_function = "onmouseover=\"fauxHighlightResidue('" + v.Protein + "','" + v.UniProt_position + "','" + v.AA_REF + "' )\"";
                mouseout_function = "onmouseout=\"clearResidues()\"";

                element = '<div ' + click_function + mouseover_function + mouseout_function +
                    'class="residue_row ' + res_type +
                    '" id="residue_' + v.Protein + '_' + v.UniProt_position.toString() + "_" + v.AA_REF + "_" + v.AA_ALT + '">' +
                    '<div class="protein_cell cell"> ' + v.Protein + ' </div>' +
                    '<div class="position_cell cell"> ' + v.UniProt_position + ' </div>' +
                    '<div class="aminoacid_cell cell"> ' + v.AA_REF + ' > ' + v.AA_ALT + '</div>' +
                    '<div class="interface_cell cell"> ' + interface_status + ' </div></div>';
                $('#residue_list_' + suffix).append(element);
                if (done.indexOf(v.UniProt_position) == -1) {
                    data.push(v);
                    done.push(v.UniProt_position);
                }
                dismuts.push(v.UniProt_position);
            });



            var gs_bg = uniprot_lm[i].layer3.selectAll('g')
                .data(data)
                .enter()
                .append('g')
                .attr("class", function(d) {
                    return "mutations mut_" + d.Protein + '_' + d.AA_REF + d.UniProt_position;
                });


            var gs = uniprot_lm[i].layer4.selectAll('g')
                .data(data)
                .enter()
                .append('g')
                .attr("class", function(d) {
                    return "mutations mut_" + d.Protein + '_' + d.AA_REF + d.UniProt_position;
                });


            var rects = gs.append('rect')
                .style('fill', '#ff9999')
                .style('opacity', 0.0)
                .attr('x', function(d) {
                    return uniprot_lm[i].xScale(d.UniProt_position) - 1;
                })
                .attr('y', 0)
                .attr('width', 3)
                .attr('height', 40);

            var triangles = gs.append("path")
                .attr('class', 'triangle')
                .style('fill', '#FF9999')
                .style('opacity', 0.0)
                .attr("transform", function(d) {
                    return "translate(" + (uniprot_lm[i].xScale(d.UniProt_position) + 0.5) + ", 0)";
                })
                .attr("d", d3.svg.symbol().type("triangle-down"));

            var rects_bg = gs_bg.append('rect')
                .style('fill', '#FF9999')
                .attr('x', function(d) {
                    return uniprot_lm[i].xScale(d.UniProt_position) - 1;
                })
                .attr('y', 0)
                .attr('width', 3)
                .attr('height', 40);

            var triangles_bg = gs_bg.append("path")
                .attr('class', 'triangle')
                .style('fill', '#ff9999')
                .attr("transform", function(d) {
                    return "translate(" + (uniprot_lm[i].xScale(d.UniProt_position) + 0.5) + ", 0)";
                })
                .attr("d", d3.svg.symbol().type("triangle-down"));

            var voronoi = d3.geom.voronoi()
                .x(function(d) {
                    return uniprot_lm[i].xScale(d.UniProt_position);
                })
                .y(0)
                .clipExtent([
                    [-20, -20],
                    [uniprot_lm[i].width, uniprot_lm[i].height]
                ]);

            gs.append('path')
                .data(voronoi(data))
                .attr("d", function(d, i) {
                    return "M" + d.join("L") + "Z";
                })
                .datum(function(d, i) {
                    return d.point;
                })
                .attr("class", function(d, i) {
                    return "voronoi mut_" + d.Protein + '_' + d.AA_REF + d.UniProt_position;
                })
                // .style("stroke", "#2074A0")
                .style("fill", "none")
                .style("pointer-events", "all")
                .on("mouseover", highlightResidue)
                .on("mouseout", clearResidues)
                .on("click", clickLinearResidue);
        }
    });
}


function highlightResidue(d) {
    class_selector = "g.mut_" + d.Protein + '_' + d.AA_REF + d.UniProt_position;
    d3.selectAll(class_selector + " .triangle, " + class_selector + ' rect').classed('temp_selected', true);
}

function fauxHighlightResidue(protein, pos, ref) {
    class_selector = "g.mut_" + protein + '_' + ref + pos;
    d3.selectAll(class_selector + " .triangle, " + class_selector + ' rect').classed('temp_selected', true);
}

function clickLinearResidue(d) {
    class_selector = "g.mut_" + d.Protein + '_' + d.AA_REF + d.UniProt_position;
    d3.selectAll('.perm_selected').classed('perm_selected', false);
    d3.selectAll(class_selector + " .triangle, " + class_selector + ' rect').classed('perm_selected', true);
    activateResidueMutation(d.Protein, d.UniProt_position, d.AA_REF, d.AA_ALT, true);
}


function fauxClickLinearResidue(protein, pos, ref) {
    class_selector = "g.mut_" + protein + '_' + ref + pos;
    d3.selectAll('.perm_selected').classed('perm_selected', false);
    d3.selectAll(class_selector + " .triangle, " + class_selector + ' rect').classed('perm_selected', true);
}


function clearResidues(d) {
    d3.selectAll('.temp_selected').classed('temp_selected', false);
}



var amino_dict = {
    Charged: ['R', 'K', 'D', 'E'],
    Polar: ['Q', 'N', 'H', 'S', 'T', 'Y', 'C', 'M', 'W'],
    Hydrophobic: ['A', 'I', 'L', 'F', 'V', 'P', 'G']
};

function polar(aa) {
    return amino_dict['Polar'].indexOf(aa) == -1 ? 'Non-Polar' : 'Polar';
}

function charge(aa) {
    return amino_dict['Charged'].indexOf(aa) == -1 ? 'Neutral' : 'Charged';
}

function hydro(aa) {
    return amino_dict['Hydrophobic'].indexOf(aa) == -1 ? 'Hydrophilic' : 'Hydrophobic';
}


function activateResidue(protein, pos, ref, avoid_recursion) {
    $('.resinfo_span').html("<img class='res_loader' src='img/loader.gif'/>");
    $('.res_error_panel').hide();
    $('.res_info_panel').hide();
    $('#residue_only_panel').fadeIn();
    $('.residue_row').removeClass('selected_resrow');
    $('#residue_' + protein + '_' + pos + '_' + ref).addClass('selected_resrow');
    $('#resinfo_protein').html(protein);
    $('#resinfo_residue').html(ref);

    $('#polarREF2').html(ref == '*' ? '\\' : polar(ref));
    $('#chargeREF2').html(ref == '*' ? '\\' : charge(ref));
    $('#hydroREF2').html(ref == '*' ? '\\' : hydro(ref));
    $('#resovalREF2').html(ref);

    clck = "show_variant('" + protein + "','" + pos + "')";
    $('.var_more').attr('onclick', clck);

    clck = "show_dismut('" + protein + "','" + pos + "')";
    $('.dis_more').attr('onclick', clck);


    get_variant(protein, pos);
    get_dismut(protein, pos);
    struct = protein == uniProtA ? structureA : structureB;
    chain = protein == uniProtA ? structChainA : structChainB;

    var res_in_model;

    if (isCoCrystal) {
        carousel = cc_carousel;
        carousel_index = cc_index;
        res_in_model = protein == uniProtA ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;
    } else {
        carousel = protein == uniProtA ? A_carousel : B_carousel;
        carousel_index = protein == uniProtA ? A_index : B_index;
        res_in_model = carousel[carousel_index].uniprot_res;
    }

    persistent = protein == uniProtA ? persistent_labelsA : persistent_labelsB;


    persistent[0] = [];
    addToPersistent(pos, protein == uniProtA ? 0 : protein == uniProtB ? 1 : undefined);


    $.ajax({
        type: 'POST',
        data: { protein: protein, pos: pos, ref: ref, structure: struct, chain: chain, interaction: interaction },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/panel_features_single',
        success: function(result) {
            parsed = JSON.parse(result);
            console.log(parsed);
            if (res_in_model.indexOf(pos) == -1) {
                $('#sasa_value2').html('N/A');
            } else {
                $('#sasa_value2').html(parsed.surface);
            }
            $('#jensen_shannon_value2').html(parsed.JS === null ? 'N/A' : parsed['JS'].toFixed(2));
            if (isCoCrystal) {
                $('#features').hide();
                $('#sasa_value2').html('Yes');
            } else {
                $('#features').html('Interface Prediction Performed Using ' + parsed.features);
            }
        }
    });


    if (avoid_recursion !== true) {
        fauxClickLinearResidue(protein, pos, ref);
    }
}

function activateResidueMutation(protein, pos, ref, alt, avoid_recursion) {
    $('.bioshift').removeClass('bioshift');
    $('.resinfo_span').html("<img class='res_loader' src='img/loader.gif'/>");
    $('.res_error_panel').hide();
    $('.res_info_panel').hide();
    $('#residue_mut_panel').fadeIn();
    var escaper = alt == '*' ? '\\' : '';
    $('.residue_row').removeClass('selected_resrow');
    $('#residue_' + protein + '_' + pos + '_' + ref + '_' + escaper + alt).addClass('selected_resrow');
    $('#resinfo_protein').html(protein);
    $('#resinfo_residue').html(ref + ' > ' + alt);
    $('#polarREF').html(ref == '*' ? '\\' : polar(ref));
    $('#chargeREF').html(ref == '*' ? '\\' : charge(ref));
    $('#hydroREF').html(ref == '*' ? '\\' : hydro(ref));
    $('#polarALT').html(alt == '*' ? '*' : polar(alt));
    $('#chargeALT').html(alt == '*' ? '*' : charge(alt));
    $('#hydroALT').html(alt == '*' ? '*' : hydro(alt));

    clck = "show_variant('" + protein + "','" + pos + "')";
    $('.var_more').attr('onclick', clck);

    clck = "show_dismut('" + protein + "','" + pos + "')";
    $('.dis_more').attr('onclick', clck);


    get_variant(protein, pos);
    get_dismut(protein, pos);
    if (polar(alt) !== polar(ref)) {
        $('#polarALT').addClass('bioshift');
    }
    if (charge(alt) !== charge(ref)) {
        $('#chargeALT').addClass('bioshift');
    }
    if (hydro(alt) !== hydro(ref)) {
        $('#hydroALT').addClass('bioshift');
    }


    $('#resovalREF').html(ref);
    $('#resovalALT').html(alt);
    struct = protein == uniProtA ? structureA : structureB;
    chain = protein == uniProtA ? structChainA : structChainB;

    persistent = protein == uniProtA ? persistent_labelsA : persistent_labelsB;


    persistent[0] = [];
    addToPersistent(pos, protein == uniProtA ? 0 : protein == uniProtB ? 1 : undefined);

    var res_in_model;

    if (isCoCrystal) {
        carousel = cc_carousel;
        carousel_index = cc_index;
        res_in_model = protein == uniProtA ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;
    } else {
        carousel = protein == uniProtA ? A_carousel : B_carousel;
        carousel_index = protein == uniProtA ? A_index : B_index;
        res_in_model = carousel[carousel_index].uniprot_res;
    }




    $.ajax({
        type: 'POST',
        data: { protein: protein, pos: pos, ref: ref, alt: alt, structure: struct, chain: chain },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/panel_features',
        success: function(result) {
            parsed = JSON.parse(result);
            $('#pph2_value').html(parsed.pph2 === null ? 'N/A' : parsed.pph2.toFixed(2));
            $('#sift_value').html(parsed.sift === null ? 'N/A' : parsed.sift.toFixed(2));
            $('#grantham_value').html(parsed.grantham === null ? 'N/A' : parsed.grantham.toFixed(0));

            if (res_in_model.indexOf(pos) == -1) {
                $('#sasa_value').html('N/A');
            } else {
                $('#sasa_value').html(parsed.surface);
            }
            $('#jensen_shannon_value').html(parsed.JS === null ? 'N/A' : parsed['JS'].toFixed(2));


        }
    });

    if (avoid_recursion !== true) {
        fauxClickLinearResidue(protein, pos, ref);
    }
}

var debug;

function getEnrichmentTable(interaction, source, disease, suffix) {
    if (disease === undefined) {
        return;
    }
    $.ajax({
        type: 'POST',
        data: { interaction: interaction, source: source, disease: disease, cutoff: suffix },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/enrichment_table',
        success: function(result) {
            parsed = JSON.parse(result);
            a_target = uniProtA < uniProtB ? 'A' : 'B';
            b_target = uniProtA < uniProtB ? 'B' : 'A';

            $('#uniProt' + a_target + '_LOR1').html(parsed[0].Dom_A === null ? '' : parsed[0].Dom_A.toFixed(1) + '<br>');
            $('#uniProt' + a_target + '_LOR2').html(parsed[0].Res_A === null ? '' : parsed[0].Res_A.toFixed(1) + '<br>');

            $('#uniProt' + a_target + '_ERR1').html(parsed[0].Dom_A_SE === null ? '' : '(p=' + GetZPercent(parsed[0].Dom_A / parsed[0].Dom_A_SE).toFixed(4) + ')');
            $('#uniProt' + a_target + '_ERR2').html(parsed[0].Res_A_SE === null ? '' : '(p=' + GetZPercent(parsed[0].Res_A / parsed[0].Res_A_SE).toFixed(4) + ')');

            $('#uniProt' + b_target + '_LOR1').html(parsed[0].Dom_B === null ? '' : parsed[0].Dom_B.toFixed(1) + '<br>');
            $('#uniProt' + b_target + '_LOR2').html(parsed[0].Res_B === null ? '' : parsed[0].Res_B.toFixed(1) + '<br>');

            $('#uniProt' + b_target + '_ERR1').html(parsed[0].Dom_B_SE === null ? '' : '(p=' + GetZPercent(parsed[0].Dom_B / parsed[0].Dom_B_SE).toFixed(4) + ')');
            $('#uniProt' + b_target + '_ERR2').html(parsed[0].Res_B_SE === null ? '' : '(p=' + GetZPercent(parsed[0].Res_B / parsed[0].Res_B_SE).toFixed(4) + ')');

            $('#uniProtAB_LOR1').html(parsed[0].Dom_AB === null ? '' : parsed[0].Dom_AB.toFixed(1) + '<br>');
            $('#uniProtAB_LOR2').html(parsed[0].Res_AB === null ? '' : parsed[0].Res_AB.toFixed(1) + '<br>');

            $('#uniProtAB_ERR1').html(parsed[0].Dom_AB_SE === null ? '' : '(p=' + GetZPercent(parsed[0].Dom_AB / parsed[0].Dom_AB_SE).toFixed(4) + ')');
            $('#uniProtAB_ERR2').html(parsed[0].Res_AB_SE === null ? '' : '(p=' + GetZPercent(parsed[0].Res_AB / parsed[0].Res_AB_SE).toFixed(4) + ')');


            $('#uniProt' + a_target + '_LOR1_sign').html(parsed[0].Dom_A === null ? '<span class="table_na">N/A</span>' : ' ');
            $('#uniProt' + a_target + '_LOR2_sign').html(parsed[0].Res_A === null ? '<span class="table_na">N/A</span>' : ' ');
            $('#uniProt' + b_target + '_LOR1_sign').html(parsed[0].Dom_B === null ? '<span class="table_na">N/A</span>' : ' ');
            $('#uniProt' + b_target + '_LOR2_sign').html(parsed[0].Res_B === null ? '<span class="table_na">N/A</span>' : ' ');
            $('#uniProtAB_LOR1_sign').html(parsed[0].Dom_AB === null ? '<span class="table_na">N/A</span>' : ' ');
            $('#uniProtAB_LOR2_sign').html(parsed[0].Res_AB === null ? '<span class="table_na">N/A</span>' : ' ');
        }
    });
}

function addToPersistent(uniprot_pos, chain_index) {
    if ((chain_index === 0 ? structureA : structureB) === undefined) {
        return;
    }
    if (isCoCrystal) {
        carousel = cc_carousel;
        carousel_index = cc_index;
        model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
        uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;
        modelPos = mapItem(uniprot_res, model_res, uniprot_pos);

    } else {
        carousel = chain_index === 0 ? A_carousel : B_carousel;
        carousel_index = chain_index === 0 ? A_index : B_index;
        modelPos = mapItem(carousel[carousel_index].uniprot_res, carousel[carousel_index].model_res, uniprot_pos);
    }


    persistent = chain_index === 0 ? persistent_labelsA : persistent_labelsB;


    if (persistent[0].indexOf(modelPos) == -1) {
        persistent[0].push(modelPos);
    }
    drawLabels(chain_index);
}


function removeFromPersistent(uniprot_pos, chain_index) {
    if (isCoCrystal) {
        carousel = cc_carousel;
        carousel_index = cc_index;
        model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
        uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;
        modelPos = mapItem(uniprot_res, model_res, uniprot_pos);
    } else {
        carousel = chain_index === 0 ? A_carousel : B_carousel;
        carousel_index = chain_index === 0 ? A_index : B_index;
        modelPos = mapItem(carousel[carousel_index].uniprot_res, carousel[carousel_index].model_res, uniprot_pos);

    }

    persistent = chain_index === 0 ? persistent_labelsA : persistent_labelsB;
    if (persistent[0].indexOf(modelPos) != -1) {
        persistent[0].splice(persistent[0].indexOf(modelPos), 1);
    }
    drawLabels(chain_index);
}


function resetPersistent() {
    persistent_labelsA = [
        [],
        []
    ];
    persistent_labelsB = [
        [],
        []
    ];
    drawLabels(0);
    drawLabels(1);
}




function mapItem(array_source, array_destination, item) {
    var item_index = array_source.findIndex(function(x) {
        return x == item;
    });
    return array_destination[item_index];
}


function drawLabels(chain_index) {
    if (isCoCrystal) {
        carousel = cc_carousel;
        carousel_index = cc_index;
        glviewer = glviewerCC;
    } else {
        carousel = chain_index === 0 ? A_carousel : B_carousel;
        carousel_index = chain_index === 0 ? A_index : B_index;
        glviewer = chain_index === 0 ? glviewerA : glviewerB;
    }
    persistent = chain_index === 0 ? persistent_labelsA : persistent_labelsB;
    basecolor = chain_index === 0 ? colorA_alt : colorB_alt;

    if (glviewer === undefined || glviewer.getModel() === undefined) {
        return;
    }

    glviewer.removeAllLabels();
    glviewer.removeAllShapes();

    glviewer.render();

    var atoms;
    if (isCoCrystal) {
        if (isHomoDimer) {
            atoms = glviewer.getModel().selectedAtoms({ atom: "CA", resi: persistent[0], chain: [carousel[carousel_index].chain_current, carousel[carousel_index].chain_inter] });
        } else {
            atoms = glviewer.getModel().selectedAtoms({ atom: "CA", resi: persistent[0], chain: chain_index === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter });
        }

    } else {
        atoms = glviewer.getModel().selectedAtoms({ atom: "CA", resi: persistent[0] });
    }
    var labels = [];

    for (var a in atoms) {
        var atom = atoms[a];
        // Create label at alpha carbon's position displaying atom's residue
        if (isCoCrystal) {
            model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
            uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;
            uniprotPos = mapItem(model_res, uniprot_res, atom.resi);

        } else {
            uniprotPos = mapItem(carousel[carousel_index].model_res, carousel[carousel_index].uniprot_res, atom.resi);
        }

        var labelText = atom.resn + " " + uniprotPos;

        var l = glviewer.addLabel(labelText, {
            fontSize: 12,
            backgroundOpacity: 0.8,
            backgroundColor: 0xff0000,
            inFront: true,
            position: {
                x: atom.x,
                y: atom.y,
                z: atom.z
            }
        });

        // var l2 = glviewer.addLabel('---', {
        //     fontSize: 16,
        //     backgroundOpacity: 1.0,
        //     backgroundColor: 0xff0000,
        //     inFront: false,
        //     position: {
        //         x: atom.x,
        //         y: atom.y,
        //         z: atom.z
        //     }
        // });

        glviewer.addSphere({ center: { x: atom.x, y: atom.y, z: atom.z }, radius: 3, color: 'red' });


        labels.push(l);
    }
    glviewer.render();
}


function initialize(uniProtA, uniProtB) {
    $.ajax({
        type: 'POST',
        data: { u1: uniProtA, u2: uniProtB },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/isDocked',
        success: function(result) {
            if (result === '1') {
                $('#pred_slider_wrapper').hide();
                $('#gldiv_A').hide();
                $('#gldiv_B').hide();
                $('#gldiv').show();
                cutoff = 'CC';
                initialize_CCModel(uniProtA + '_' + uniProtB);
                isCoCrystal = true;
                $('#features').hide();
                $('#dl_link').attr('target', '_blank');
                $('#dl_link').attr('download', uniProtA + '_' + uniProtB + '.csv');
                $('#dl_link').attr('href', 'http://interactomeinsider.yulab.org/cgi-bin/api.py/ires?model=' +
                    uniProtA + '_' + uniProtB);

                $('#dl_link_bed').attr('target', '_blank');
                $('#dl_link_bed').attr('download', uniProtA + '_' + uniProtB + '.bed');
                $('#dl_link_bed').attr('href', 'http://interactomeinsider.yulab.org/bed/by_pair/' +
                    uniProtA + '_' + uniProtB+'.bed');

            } else {
                initialize_singleModels(uniProtB, uniProtA + '_' + uniProtB, function() { $('#pred_button_' + cutoff).click(); });
                isCoCrystal = false;
                $('#dl_link').attr('target', '_blank');
                $('#dl_link').attr('download', uniProtA + '_' + uniProtB + '.csv');
                $('#dl_link').attr('href', 'http://interactomeinsider.yulab.org/cgi-bin/api.py/ipred?model=' +
                    uniProtA + '_' + uniProtB);


                $('#dl_link_bed').attr('target', '_blank');
                $('#dl_link_bed').attr('download', uniProtA + '_' + uniProtB + '.bed');
                $('#dl_link_bed').attr('href', 'http://interactomeinsider.yulab.org/bed/by_pair/' +
                    uniProtA + '_' + uniProtB+'.bed');

                
                $('#evidence_name').html('ECLAIR');
                // setTimeout(function() {
                //     var high_cutoff = 5;
                //     var med_cutoff = 5;

                //     if ((interfaces['HighA'].length < high_cutoff) || (interfaces['HighB'].length < high_cutoff)) {
                //         cutoff = 'Medium';
                //         if ((interfaces['MediumA'].length < med_cutoff) || (interfaces['MediumB'].length < med_cutoff)) {
                //             cutoff = 'Low';
                //         }
                //     }
                //     setCutoff(cutoff);
                // }, 6000);
            }
        }
    });
}

function get_variant(Protein, Pos) {
    $.ajax({
        type: 'POST',
        data: { Protein: Protein, Pos: Pos },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/variants',
        success: function(result) {
            parsed = JSON.parse(result);
            $('#1000Genomes_container').html(parsed['1k']);
            $('#ESP_container').html(parsed['ESP']);
            $('#UniVar_container').html(parsed['UniProt']);
            $('#which_uniprot').html(Protein);
            $('#which_pos').html(Pos);
        }
    });
}


function show_variant(Protein, Pos) {
    get_variant(Protein, Pos);
    $('.overlay').fadeIn();
    $('.mut_over').hide();
    $('.var_over').show();
    $('.main').css({ 'opacity': 0.8 });
    $('#which_uniprot').html(Protein);
    $('#which_pos').html(Pos);
}

function show_dismut(Protein, Pos) {
    get_dismut(Protein, Pos);
    $('.overlay').fadeIn();
    $('.var_over').hide();
    $('.mut_over').show();
    $('.main').css({ 'opacity': 0.8 });
    $('#which_uniprot').html(Protein);
    $('#which_pos').html(Pos);
}



function get_dismut(Protein, Pos) {
    $.ajax({
        type: 'POST',
        data: { Protein: Protein, Pos: Pos, mutcode: mutcode },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/dismut_atpos',
        success: function(result) {
            parsed = JSON.parse(result);
            $('#dismut_container').html(parsed);
            $('#which_uniprot').html(Protein);
            $('#which_pos').html(Pos);
        }
    });
}

function get_clusters_single(index) {
    console.log('Running Clustering:', index);
    var suffix = index === 0 ? 'A' : 'B';
    var uniprot_length = $('#pinfo_length_' + (index === 0 ? 'A' : 'B')).html();
    var dismuts = index === 0 ? dismuts_A : dismuts_B;
    if (dismuts.length === 0) {
        console.log('No Disease Mutations Found for ' + suffix);
        $('#atomic' + index).html('<span class="table_na">N/A</span>');
        clusters[suffix] = null;
        return;
    }


    var protein = index === 0 ? uniProtA : uniProtB;
    var struct = index === 0 ? structureA : structureB;

    if (isCoCrystal) {
        carousel = cc_carousel;
        carousel_index = cc_index;
        path = carousel[carousel_index].path;
        chain = index === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter;
        prefix = index === 0 ? 'current' : 'interactor';
        uniprot_res = carousel[carousel_index][prefix + '_uniprot_res'].join(',');
        model_res = carousel[carousel_index][prefix + '_model_res'].join(',');
        inter_res = interfaces[suffix].join(',');

    } else {
        carousel = index === 0 ? A_carousel : B_carousel;
        carousel_index = index === 0 ? A_index : B_index;
        path = carousel[carousel_index].path;
        chain = carousel[carousel_index].Chain;
        uniprot_res = carousel[carousel_index].uniprot_res.join(',');
        model_res = carousel[carousel_index].model_res.join(',');
        inter_res = interfaces[cutoff + suffix].join(',');
    }

    mutations = dismuts.map(function(v) {
        return chain + ':' + v;
    }).join(',');


    $.ajax({
        type: 'POST',
        data: {
            uniprot_length: uniprot_length,
            mutations: mutations,
            path: path,
            chain: chain,
            uniprot_res: uniprot_res,
            model_res: model_res,
            interfaces: inter_res
        },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/single_clustering',
        success: function(result) {
            parsed = JSON.parse(result);
            console.log(suffix, parsed);
            clusters[suffix] = parsed;
            if (parsed === null) {
                $('#atomic' + index).html('<span class="table_na" style="font-weight:500">No Significant Interface Clusters</span>');
            } else {
                pre_tag = '<a class="cluster_link" onclick="activateCluster(' + "'" + suffix + "','" + "Protein: " + protein + "_break_Structure: " + struct + '_break_Disease: ' + current_disease + "','" + protein + "'" + ')">';
                $('#atomic' + index).html(pre_tag + 'N=' + parsed['n_res'] + ' Cluster' + ' (p=' + parsed['pval'].toFixed(4) + ')</a>');
            }
        }
    });
}



function get_clusters_pair() {
    chainA = cc_carousel[cc_index].chain_current;
    chainB = cc_carousel[cc_index].chain_inter;
    lengthA = $('#pinfo_length_A').html();
    lengthB = $('#pinfo_length_B').html();



    if ((dismuts_A.length === 0) && (dismuts_B.length === 0)) {
        $('.coatomic').html('<span class="table_na">N/A</span>');
        clusters['CC'] = null;
        return;
    }


    carousel = cc_carousel;
    carousel_index = cc_index;

    path = carousel[carousel_index].path;

    uniprot_resA = carousel[carousel_index]['current_uniprot_res'].join(',');
    model_resA = carousel[carousel_index]['current_model_res'].join(',');
    interfacesA = interfaces['A'].join(',');

    uniprot_resB = carousel[carousel_index]['interactor_uniprot_res'].join(',');
    model_resB = carousel[carousel_index]['interactor_model_res'].join(',');
    interfacesB = interfaces['B'].join(',');


    mutationsA = dismuts_A.map(function(v) {
        return chainA + ':' + v;
    }).join(',');

    mutationsB = dismuts_B.map(function(v) {
        return chainB + ':' + v;
    }).join(',');

    mutations = [mutationsA, mutationsB].join(',');


    $.ajax({
        type: 'POST',
        data: {
            chainA: chainA,
            chainB: chainB,
            lengthA: lengthA,
            lengthB: lengthB,
            uniprot_resA: uniprot_resA,
            model_resA: model_resA,
            uniprot_resB: uniprot_resB,
            model_resB: model_resB,
            mutations: mutations,
            interfacesA: interfacesA,
            interfacesB: interfacesB,
            path: path
        },
        url: 'http://interactomeinsider.yulab.org/cgi-bin/api.py/pair_clustering',
        success: function(result) {
            parsed = JSON.parse(result);
            console.log(parsed);
            clusters['CC'] = parsed;
            if (parsed === null) {
                $('.coatomic').html('<span class="table_na" style="font-weight:500">No Significant Interface Clusters</span>');
            } else {
                pre_tag = '<a class="cluster_link" onclick="activateCluster(' + "'CC'" + ',' + "'Interaction:" + carousel[cc_index].interaction + ' Model: ' + structureA + "',null" + ')">';
                $('.coatomic').html(pre_tag + 'N=' + parsed['n_res'] + ' Cluster' + ' (p=' + parsed['pval'].toFixed(4) + ')</a>');
            }
        }
    });
}