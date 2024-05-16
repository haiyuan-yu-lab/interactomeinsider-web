function update_href() {
    location.hash = current_taxa + '_' + current_gene_name + '_' + current_interactor_gene_name;
}


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
    if (flag) {
        $('.interactor_item').css({ 'z-index': -10, 'background-color': 'lavender' });
        $('.carousel').attr('disabled', true);
    } else if ([A_mutex, B_mutex, C_mutex].every(function(a) {
            return !a;
        })) {
        $('.interactor_item').css({ 'z-index': 0, 'background-color': '#fff' });
        $('.carousel').attr('disabled', false);
        update_href();
    }
    $('#mutex_' + choice).css({ 'background-color': flag ? 'floralwhite' : '#fff' });

}

function test_environment() {
    $.ajax({
        type: 'POST',
        url: 'http://marsh2.yulab.org/cgi-bin/api.py/test',
        success: function(result) {

        }
    });
}

function ccchange(direction) {
    if (!C_mutex) {
        set_mutex('C', true);
        if ((cc_carousel.length) == 1) {
            set_mutex('C', false);
            return;
        }
        $('#cocrystal_title').text('...');
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
            url: 'http://marsh2.yulab.org/cgi-bin/api.py/read_pdb',
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
            $('#A_title').text('...');
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

            $("#d3_network_container").fadeOut('fast');
            $("#network_div").fadeOut('fast');
            $('#gldiv_A').html('');
            current_model_path = next.path;
            $.ajax({
                type: 'POST',
                data: { path: next.path, chain: next.Chain },
                url: 'http://marsh2.yulab.org/cgi-bin/api.py/read_pdb',
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
            $('#B_title').text('...');
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

            $("#d3_network_container").fadeOut('fast');
            $("#network_div").fadeOut('fast');
            $('#gldiv_B').html('');
            current_model_path = next.path;
            $.ajax({
                type: 'POST',
                data: { path: next.path, chain: next.Chain },
                url: 'http://marsh2.yulab.org/cgi-bin/api.py/read_pdb',
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
                resp:r
            },
            url: 'http://marsh2.yulab.org/cgi-bin/api.py/test',
            success: function(result) {
                console.log('Site Ready: ' + result);
            }
        });
    }, "jsonp");
}



function labelResidue(chain_index, uniprotPos) {
    carousel = chain_index === 0 ? A_carousel : B_carousel;
    carousel_index = chain_index === 0 ? A_index : B_index;
    glviewer = chain_index === 0 ? glviewerA : glviewerB;
    basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;

    if (carousel.length === 0) {
        return;
    }

    model_position = carousel[carousel_index].model_res[carousel[carousel_index].uniprot_res.findIndex(function(x) {
        return x == uniprotPos;
    })];

    glviewer.removeAllLabels();
    var atoms = glviewer.getModel().selectedAtoms({ atom: "CA", resi: [model_position] });
    var labels = [];

    for (var a in atoms) {
        var atom = atoms[a];
        // Create label at alpha carbon's position displaying atom's residue
        var labelText = atom.resn + " " + uniprotPos;

        var l = glviewer.addLabel(labelText, {
            fontSize: 12,
            position: {
                x: atom.x,
                y: atom.y,
                z: atom.z
            }
        });

        labels.push(l);
    }
    drawLabels(chain_index);
    glviewer.render();
}

function labelResidue_CC(chain_index, uniprotPos) {
    carousel = cc_carousel;
    carousel_index = cc_index;
    model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
    uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;
    chain = chain_index === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter;
    glviewer = glviewerCC;

    basecolor = 0xFF3232;

    model_position = mapItem(uniprot_res, model_res, uniprotPos);

    glviewer.removeAllLabels();
    var atoms = glviewer.getModel().selectedAtoms({ chain: chain, atom: "CA", resi: [model_position] });
    var labels = [];

    for (var a in atoms) {
        var atom = atoms[a];
        // Create label at alpha carbon's position displaying atom's residue
        var labelText = atom.resn + " " + uniprotPos;

        var l = glviewer.addLabel(labelText, {
            fontSize: 12,
            position: {
                x: atom.x,
                y: atom.y,
                z: atom.z
            }
        });

        labels.push(l);
    }
    drawLabels_CC();
    glviewer.render();
}


function mapItem(array_source, array_destination, item) {
    var item_index = array_source.findIndex(function(x) {
        return x == item;
    });
    return array_destination[item_index];
}


function drawLabels_CC() {

    glviewer = glviewerCC;
    carousel = cc_carousel;
    carousel_index = cc_index;
    glviewer.removeAllLabels();


    $.each([0, 1], function(chain_index) {

        model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
        uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;
        chain = chain_index === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter;
        basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;
        persistent = persistent_labelsCC[chain_index];


        var atoms = glviewer.getModel().selectedAtoms({ chain: chain, atom: "CA", resi: persistent[0] });
        var labels = [];

        for (var a in atoms) {
            var atom = atoms[a];
            // Create label at alpha carbon's position displaying atom's residue
            uniprotPos = mapItem(model_res, uniprot_res, atom.resi);

            var labelText = atom.resn + " " + uniprotPos;

            var l = glviewer.addLabel(labelText, {
                fontSize: 12,
                backgroundOpacity: 0.8,
                position: {
                    x: atom.x,
                    y: atom.y,
                    z: atom.z
                }
            });

            labels.push(l);
        }
    });
}


function drawLabels(chain_index) {
    carousel = chain_index === 0 ? A_carousel : B_carousel;
    carousel_index = chain_index === 0 ? A_index : B_index;
    glviewer = chain_index === 0 ? glviewerA : glviewerB;
    persistent = chain_index === 0 ? persistent_labelsA : persistent_labelsB;
    basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;

    if (glviewer === undefined || glviewer.getModel() === undefined) {
        return;
    }

    glviewer.removeAllLabels();
    glviewer.render();

    var atoms = glviewer.getModel().selectedAtoms({ atom: "CA", resi: persistent[0] });
    var labels = [];

    for (var a in atoms) {
        var atom = atoms[a];
        // Create label at alpha carbon's position displaying atom's residue
        uniprotPos = mapItem(carousel[carousel_index].model_res, carousel[carousel_index].uniprot_res, atom.resi);

        var labelText = atom.resn + " " + uniprotPos;

        var l = glviewer.addLabel(labelText, {
            fontSize: 12,
            backgroundOpacity: 0.8,
            position: {
                x: atom.x,
                y: atom.y,
                z: atom.z
            }
        });

        labels.push(l);
    }
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
    drawPersistent(chain_index + 1);
}

function drawCurrentView_CC() {
    glviewerCC.setStyle({}, {});
    glviewerCC.removeAllSurfaces();

    $.each([0, 1], function(chain_index) {
        cc_chain_index = chain_index + 2;
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
    drawPersistent_CC();
    glviewerCC.render();
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function drawColoredModel_CC(chain_index) {
    glviewer = glviewerCC;
    carousel = cc_carousel;
    carousel_index = cc_index;

    basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;
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

    var others = unique.filter(function(n) {
        return all.indexOf(n.toString()) == -1;
    });

    glviewer.addSurface($3Dmol.SurfaceType.MS, { color: known_color }, { resi: resi, chain: chain });
    glviewer.addSurface($3Dmol.SurfaceType.MS, { color: basecolor }, { resi: others, chain: chain });

}





function drawColoredModel(chain_index) {
    carousel = chain_index === 0 ? A_carousel : B_carousel;
    carousel_index = chain_index === 0 ? A_index : B_index;
    glviewer = chain_index === 0 ? glviewerA : glviewerB;
    basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;

    if (carousel.length === 0) {
        return;
    }

    glviewer.setStyle({}, {});
    glviewer.removeAllSurfaces();
    glviewer.render();

    drawCartoon(chain_index);
    var all = [];
    var drawable = [];
    var drawable_color = [];

    $.each(['1', '2', '3', '4', '5'], function(i, num) {
        resi = [];
        switch (num) {
            case '1':
                color = '0x404040';
                break;

            case '2':
                color = '0x9AC4F8';
                break;

            case '3':
                color = '0xFFC55B';
                break;

            case '4':
                color = '0xFF925B';
                break;

            case '5':
                color = '0xFF3232';
                break;
        }
        $.each($('.pos_tier_' + chain_index + '_' + num), function(j, e) {
            resi[j] = carousel[carousel_index].model_res[carousel[carousel_index].uniprot_res.findIndex(function(x) {
                return x == $(e).text();
            })];
            all.push(resi[j]);
        });
        drawable.push(resi);
        drawable_color.push(color);
    });

    all_res = [];
    $.each(glviewer.getModel().selectedAtoms({}), function(i, v) { all_res.push(v.resi); });
    var unique = all_res.filter(onlyUnique);

    var others = unique.filter(function(n) {
        return all.indexOf(n.toString()) == -1;
    });

    glviewer.addSurface($3Dmol.SurfaceType.MS, { color: basecolor }, { resi: others });

    $.each(drawable, function(i, resi) {
        color = drawable_color[i];
        glviewer.addSurface($3Dmol.SurfaceType.MS, { color: color }, { resi: resi });
    });


}


function drawModel_CC(chain_index) {
    glviewer = glviewerCC;
    carousel = cc_carousel;
    carousel_index = cc_index;

    basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;
    chain = chain_index === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter;

    model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
    uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;

    glviewer.addSurface($3Dmol.SurfaceType.MS, { color: basecolor }, { chain: chain });
}


function drawModel(chain_index) {
    carousel = chain_index === 0 ? A_carousel : B_carousel;
    carousel_index = chain_index === 0 ? A_index : B_index;
    glviewer = chain_index === 0 ? glviewerA : glviewerB;
    basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;

    if (carousel.length === 0) {
        return;
    }

    glviewer.setStyle({}, {});
    glviewer.removeAllSurfaces();
    glviewer.render();

    glviewer.addSurface($3Dmol.SurfaceType.MS, { color: basecolor }, {});
}


function drawColoredCartoon_CC(chain_index) {
    var glviewer = glviewerCC;
    var carousel = cc_carousel;
    var carousel_index = cc_index;

    var basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;
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


function drawColoredCartoon(chain_index) {
    carousel = chain_index === 0 ? A_carousel : B_carousel;
    carousel_index = chain_index === 0 ? A_index : B_index;
    glviewer = chain_index === 0 ? glviewerA : glviewerB;
    basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;

    if (carousel.length === 0) {
        return;
    }

    glviewer.setStyle({}, { cartoon: { color: basecolor } });
    glviewer.removeAllSurfaces();
    glviewer.render();

    var all = [];
    $.each(['1', '2', '3', '4', '5'], function(i, num) {
        resi = [];
        switch (num) {
            case '1':
                color = '0x404040';
                break;

            case '2':
                color = '0x9AC4F8';
                break;

            case '3':
                color = '0xFFC55B';
                break;

            case '4':
                color = '0xFF925B';
                break;

            case '5':
                color = '0xFF3232';
                break;
        }
        $.each($('.pos_tier_' + chain_index + '_' + num), function(j, e) {
            resi[j] = carousel[carousel_index].model_res[carousel[carousel_index].uniprot_res.findIndex(function(x) {
                return x == $(e).text();
            })];
            all.push(resi[j]);
        });
        glviewer.setStyle({ resi: resi }, { cartoon: { color: color } });
    });


    glviewer.render();
}

function drawCartoon_CC(chain_index) {
    glviewer = glviewerCC;
    carousel = cc_carousel;
    carousel_index = cc_index;

    basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;
    chain = chain_index === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter;

    model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
    uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;


    glviewer.setStyle({ chain: chain }, { cartoon: { color: basecolor } });
}



function drawCartoon(chain_index) {
    carousel = chain_index === 0 ? A_carousel : B_carousel;
    carousel_index = chain_index === 0 ? A_index : B_index;
    glviewer = chain_index === 0 ? glviewerA : glviewerB;
    basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;

    if (carousel.length === 0) {
        return;
    }

    glviewer.setStyle({}, {});
    glviewer.removeAllSurfaces();
    glviewer.render();

    glviewer.setStyle({}, { cartoon: { color: basecolor } });
    glviewer.render();
}

function addCircle_CC(caller, uniprotPos, i, extra_classes, type_of_circle) {
    uniprot_lm[i].layer3.selectAll('path').remove();

    uniprot_lm[i].layer3.append('path')
        .attr('d', function(d) {
            var x = uniprot_lm[i].xScale(uniprotPos),
                y = 50;
            return 'M ' + x + ' ' + y + ' l 6 6 l -12 0 z';
        })
        .classed(extra_classes, true);

    carousel = cc_carousel;
    carousel_index = cc_index;
    var model_res = (i === 0) ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
    var uniprot_res = (i === 0) ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;
    chain = i === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter;

    var model_pos = mapItem(uniprot_res, model_res, uniprotPos);


    var color = 0xFF3232;


    if (model_pos !== undefined) {
        if (type_of_circle != 'temp') {
            addToModel_CC(model_pos, chain, i, color);
        }
    }
    drawPersistent_CC();
}



function addCircle(caller, uniprotPos, i, extra_classes, type_of_circle) {

    uniprot_lm[i].layer3.selectAll('path').remove();

    uniprot_lm[i].layer3.append('path')
        .attr('d', function(d) {
            var x = uniprot_lm[i].xScale(uniprotPos),
                y = 50;
            return 'M ' + x + ' ' + y + ' l 6 6 l -12 0 z';
        })
        .classed(extra_classes, true);

    carousel = i === 0 ? A_carousel : B_carousel;
    carousel_index = i === 0 ? A_index : B_index;

    if (carousel.length === 0) {
        return;
    }

    pos = carousel[carousel_index].uniprot_res.findIndex(function(x) {
        return x == uniprotPos;
    });

    var color;
    switch (extra_classes) {
        case 'circ1':
            color = '0x404040';
            break;

        case 'circ2':
            color = '0x9AC4F8';
            break;

        case 'circ3':
            color = '0xFFC55B';
            break;

        case 'circ4':
            color = '0xFF925B';
            break;

        case 'circ5':
            color = '0xFF3232';
            break;
    }

    if (currentViewType[i] == 'cartoon' || currentViewType[i] == 'coloredCartoon') {
        drawCurrentView(i);
    } else {
        (i === 0 ? glviewerA : glviewerB).getModel().setStyle({}, {});
    }


    if (pos != -1) {
        if (type_of_circle != 'temp') {
            addToModel(carousel[carousel_index].model_res[pos], carousel[carousel_index].Chain, i + 1, color);
        }
    }
    drawPersistent(i + 1);
}



function drawPersistent_CC() {

    var viewer = glviewerCC;
    var carousel = cc_carousel;
    var carousel_index = cc_index;

    $.each([0, 1], function(chain_index) {
        var persistent = persistent_labelsCC[chain_index];
        var chain = chain_index === 0 ? carousel[carousel_index].chain_current : carousel[carousel_index].chain_inter;
        var model_res = chain_index === 0 ? carousel[carousel_index].current_model_res : carousel[carousel_index].interactor_model_res;
        var uniprot_res = chain_index === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;


        $('.pred_td' + (chain_index === 0 ? '_L' : '')).parent().css({ 'background-color': 'white' });
        if (persistent[0].length === 0) {
            drawLabels_CC(chain_index);
            viewer.render();
            return;
        }


        $.each(persistent[0], function(i, p) {
            var color = persistent[1][i];
            var uniprot_pos = mapItem(model_res, uniprot_res, p);
            $('#pos' + uniprot_pos + (chain_index === 0 ? '_L' : '')).parent().css({ 'background-color': '#ddd' });
            viewer.getModel().setStyle({ chain: chain, resi: p, atom: 'CA' }, { sphere: { color: color }, cartoon: { color: color } });
        });

        viewer.render();
        drawLabels_CC(chain_index);
    });
}


function drawPersistent(v_index) {
    switch (v_index) {
        case 0:
            viewer = glviewerCC;
            persistent = persistent_labelsCC;
            carousel = cc_carousel;
            carousel_index = cc_index;

            break;
        case 1:
            viewer = glviewerA;
            persistent = persistent_labelsA;
            carousel = A_carousel;
            carousel_index = A_index;

            break;
        case 2:
            viewer = glviewerB;
            persistent = persistent_labelsB;
            carousel = B_carousel;
            carousel_index = B_index;
            break;

    }

    $('.pred_td' + (v_index == 1 ? '_L' : '')).parent().css({ 'background-color': 'white' });
    if (persistent[0].length === 0) {
        drawLabels(v_index - 1);
        return;
    }


    $.each(persistent[0], function(i, p) {
        color = persistent[1][i];
        uniprot_pos = mapItem(carousel[carousel_index].model_res, carousel[carousel_index].uniprot_res, p);
        $('#pos' + uniprot_pos + (v_index == 1 ? '_L' : '')).parent().css({ 'background-color': '#ddd' });
        viewer.getModel().setStyle({ resi: p, atom: 'CA' }, { sphere: { color: color }, cartoon: { color: color } });

    });


    viewer.render();
    drawLabels(v_index - 1);

}


function addToModel_CC(model_pos, chain, chain_index, color) {
    viewer = glviewerCC;
    carousel = cc_carousel;
    carousel_index = cc_index;
    persistent = persistent_labelsCC[chain_index];
    basecolor = chain_index === 0 ? 0x6A7FDB : 0x9869DB;


    if (persistent[0].indexOf(model_pos) == -1) {
        persistent[0].push(model_pos);
        persistent[1].push(color);
    } else {
        target = persistent[0].indexOf(model_pos);
        color = currentViewType[chain_index + 2] == 'cartoon' ? basecolor : persistent[1][target];
        persistent[0].splice(target, 1);
        persistent[1].splice(target, 1);
        viewer.getModel().setStyle({ chain: chain, resi: model_pos }, {});
        viewer.getModel().setStyle({ chain: chain, resi: model_pos }, { cartoon: { color: color } });

    }

    $.each(persistent[0], function(i, p) {
        color = persistent[1][i];
        viewer.getModel().setStyle({ chain: chain, resi: p, atom: 'CA' }, { sphere: { color: color }, cartoon: { color: color } });

    });
    viewer.render();
    drawPersistent_CC();
}


function addToModel(pos, chain, v_index, color) {
    switch (v_index) {
        case 0:
            viewer = glviewerCC;
            persistent = persistent_labelsCC;

            break;
        case 1:
            viewer = glviewerA;
            persistent = persistent_labelsA;
            basecolor = 0x6A7FDB;

            break;
        case 2:
            viewer = glviewerB;
            persistent = persistent_labelsB;
            basecolor = 0x9869DB;
            break;
    }

    if (persistent[0].indexOf(pos) == -1) {
        persistent[0].push(pos);
        persistent[1].push(color);
    } else {
        target = persistent[0].indexOf(pos);
        color = currentViewType[v_index - 1] == 'cartoon' ? basecolor : persistent[1][target];
        persistent[0].splice(target, 1);
        persistent[1].splice(target, 1);
        viewer.getModel().setStyle({ chain: chain, resi: pos }, {});
        viewer.getModel().setStyle({ chain: chain, resi: pos }, { cartoon: { color: color } });

    }

    $.each(persistent[0], function(i, p) {
        color = persistent[1][i];
        viewer.getModel().setStyle({ chain: chain, resi: p, atom: 'CA' }, { sphere: { color: color }, cartoon: { color: color } });

    });
    viewer.render();
    drawPersistent(v_index);
}





function drawUniprot(uniprot, target_div, rect_color, i, callback) {
    $.ajax({
        type: 'POST',
        data: { uniprot: uniprot },
        url: 'http://marsh2.yulab.org/cgi-bin/api.py/linear_uniprot',
        success: function(result) {
            parsed = JSON.parse(result);

            $('#pinfo_uniprot_' + (i === 0 ? 'A' : 'B')).html('<a href="http://www.uniprot.org/uniprot/' + parsed.id + '" target="_blank">' + parsed.id + '</a>  <i class="fa fa-star' + (parsed.reviewed == 'reviewed' ? '' : '-o') + '" style="color:#222" data-toggle="tooltip" data-placement="right" title="' + (parsed.reviewed == 'reviewed' ? 'Reviewed' : 'Unreviewed') + '">');
            $('#pinfo_length_' + (i === 0 ? 'A' : 'B')).html(parsed.length);
            $('#pinfo_gene_' + (i === 0 ? 'A' : 'B')).html(parsed.gene);
            $('#pinfo_protein_' + (i === 0 ? 'A' : 'B')).html(parsed.protein);


            if (i === 0) {
                current_gene_name = parsed.gene;
            } else {
                current_interactor_gene_name = parsed.gene;
            }

            uniprot_lm[i].margin = { top: 20, right: 10, bottom: 10, left: 10 };
            $(target_div).html('');

            uniprot_lm[i].width = ($(".right_pane").width()) / 2 - uniprot_lm[i].margin.left - uniprot_lm[i].margin.right;
            uniprot_lm[i].height = ($(".right_pane").height()) - uniprot_lm[i].margin.top - uniprot_lm[i].margin.bottom;

            uniprot_lm[i].layer1 = d3.select(target_div)
                .append('g')
                .attr("transform", "translate(" + uniprot_lm[i].margin.left + "," + uniprot_lm[i].margin.top + ")");


            uniprot_lm[i].layer2 = d3.select(target_div)
                .append('g')
                .attr("transform", "translate(" + uniprot_lm[i].margin.left + "," + uniprot_lm[i].margin.top + ")");


            uniprot_lm[i].layer3 = d3.select(target_div)
                .append('g')
                .attr("transform", "translate(" + uniprot_lm[i].margin.left + "," + uniprot_lm[i].margin.top + ")");



            uniprot_lm[i].xScale = d3.scale.linear().domain([0, parsed.length]).range([0, uniprot_lm[i].width]);

            uniprot_lm[i].rect = uniprot_lm[i].layer2.append('rect')
                .attr('height', 0)
                .style('fill', rect_color)
                .attr('width', uniprot_lm[i].xScale(parsed.length))
                .attr('y', 0)
                .transition()
                .duration(1000)
                .attr('height', 10)
                .attr('y', 20);


            $('[data-toggle="tooltip"]').tooltip();
            $.ajax({
                type: 'POST',
                data: { uniprot: uniprot },
                url: 'http://marsh2.yulab.org/cgi-bin/api.py/pfam',
                success: function(result) {
                    parsed = JSON.parse(result);


                    $.each(parsed, function(index, v) {
                        uniprot_lm[i].rect = uniprot_lm[i].layer2.append('rect')
                            .style('fill', i === 0 ? '#6A7FDB' : '#9869DB')
                            .attr('x', uniprot_lm[i].xScale(v.Start))
                            .attr('width', 0)
                            .attr('height', 30)
                            .attr('y', 10)
                            .transition()
                            .duration(1000)
                            .attr('width', uniprot_lm[i].xScale(v.Stop) - uniprot_lm[i].xScale(v.Start));
                    });
                    update_href();
                    if (callback !== undefined) {
                        callback(i);
                    }
                }
            });

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
                .attr('y', 0);
        }
    });
}

function draw_current_coverage_CC(i) {
    $(".coverage" + i.toString()).remove();
    carousel = cc_carousel;
    carousel_index = cc_index;
    uniprot_res = i === 0 ? carousel[carousel_index].current_uniprot_res : carousel[carousel_index].interactor_uniprot_res;

    $.each(Array.apply(null, Array(uniprot_lm[i].xScale.domain()[1])).map(function(_, x) {
        return uniprot_res.indexOf(x.toString()) != -1;
    }), function(index, val) {
        if (!val) {
            uniprot_lm[i].rect = uniprot_lm[i].layer2.append('rect')
                .classed("coverage" + i.toString(), true)
                .style('fill', '#fff')
                .style('opacity', '0.8')
                .attr('x', uniprot_lm[i].xScale(index))
                .attr('width', uniprot_lm[i].xScale(1))
                .attr('height', 50)
                .attr('y', 0);
        }
    });
}




function get_interface_residues(model, model_file) {
    var mf = all_on ? '' : model_file;
    $('#res_div_A').html('');
    $('#res_div_B').html('');
    $('#adl_link').prop("href", "http://marsh2.yulab.org/cgi-bin/api.py/ires?model=" + model + "&chain_index=0&model_file=" + mf);
    $('#adl_link').prop("download", "ipred_" + model.split('_')[0] + "_" + model.split('_')[1] + '.csv');
    $('#bdl_link').prop("href", "http://marsh2.yulab.org/cgi-bin/api.py/ires?model=" + model + "&chain_index=1&model_file=" + mf);
    $('#bdl_link').prop("download", "ipred_" + model.split('_')[1] + "_" + model.split('_')[0] + '.csv');


    $.ajax({
        type: 'POST',
        data: { model: model, model_file: all_on ? '' : model_file },
        url: 'http://marsh2.yulab.org/cgi-bin/api.py/ires',
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


                var ordered_mod = current_uniprot < current_pair ? 0 : 1;


                if (current_uniprot == current_pair) {

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
                        uniprot_lm[0].layer1.append('rect')
                            .classed("knownd3", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 0)
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
                        uniprot_lm[1].layer1.append('rect')
                            .classed("knownd3", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 0)
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
                        uniprot_lm[0].layer1.append('rect')
                            .classed("knownd3", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 0)
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
                        uniprot_lm[1].layer1.append('rect')
                            .classed("knownd3", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 0)
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

                        uniprot_lm[0].layer1.append('rect')
                            .classed("knownd3", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 0)
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

                        uniprot_lm[0].layer1.append('rect')
                            .classed("knownd3", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 0)
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
                        uniprot_lm[1].layer1.append('rect')
                            .classed("knownd3", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 0)
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
                        uniprot_lm[1].layer1.append('rect')
                            .classed("knownd3", true)
                            .attr('height', 50)
                            .style('opacity', 0.5)
                            .attr('y', 0)
                            .attr('width', uniprot_lm[1].xScale(1))
                            .attr('x', uniprot_lm[1].xScale(v.residue_index));
                    }
                }

            });
            drawCurrentView_CC();
        }
    });
}


function get_interface_predictions(model, chain_index) {


    $('#' + (chain_index === 0 ? 'a' : 'b') + 'dl_link').prop("href", "http://marsh2.yulab.org/cgi-bin/api.py/ipred?model=" + model + "&chain_index=" + chain_index);
    $('#' + (chain_index === 0 ? 'a' : 'b') + 'dl_link').prop("download", "ipred_" + model.split('_')[chain_index] + "_" + model.split('_')[1 - chain_index] + '.csv');

    $('#' + (chain_index === 0 ? 'a' : 'b') + 'dl_link').prop('disabled', false);


    if (current_uniprot == current_pair) {
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
        url: 'http://marsh2.yulab.org/cgi-bin/api.py/ipred',
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
                    .attr('height', 50)
                    .style('opacity', 0.5)
                    .attr('y', 0)
                    .attr('width', uniprot_lm[chain_index].xScale(1))
                    .attr('x', uniprot_lm[chain_index].xScale(v.Pos));


                if (current_uniprot == current_pair) {
                    $(new_element_str).appendTo('#res_div_A');
                    $(new_element_str).appendTo('#res_div_B');
                } else if (chain_index === 0) {
                    $(new_element_str).appendTo('#res_div_A');
                } else {
                    $(new_element_str).appendTo('#res_div_B');
                }
            });
            drawCurrentView(chain_index);
        }
    });
}




function initialize_singleModels(partner, model) {
    current_interactor_gene_name = partner;
    $('.prediction_label').css({ 'border-bottom': '1px solid #ccc' });
    $('.prediction_label').html('Prediction');

    $('#cocrystal').hide();
    $('#welcome').hide();

    $('#paired').show();
    setTimeout(function() { $("#result_pane").fadeIn('slow'); }, 1500);


    u = model.split('_')[0];
    p = model.split('_')[1];


    drawUniprot(u, '#d3_uniprot_A_container', '#6A7FDB', 0, draw_current_coverage);
    drawUniprot(p, '#d3_uniprot_B_container', '#9869DB', 1, draw_current_coverage);
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

    $('#res_div_A').html('');
    $('#res_div_B').html('');

    var offset = $('#interaction_' + partner).offset();
    if (offset.top <= 163) {
        $('#interaction_div').animate({
            scrollTop: $('#interaction_div').scrollTop() - Math.abs(200 - offset.top),
        });
    } else if (offset.top >= 800) {
        $('#interaction_div').animate({
            scrollTop: $('#interaction_div').scrollTop() + Math.abs(200 - offset.top),
        });
    }


    if (glviewerCC) { glviewerCC.clear(); }
    current_model_path = undefined;
    if (!A_mutex) {
        set_mutex('A', true);
        $('#adl_link').prop('disabled', true);

        $('#A_title').text('...');

        $.ajax({
            type: 'POST',
            data: { model: u },
            url: 'http://marsh2.yulab.org/cgi-bin/api.py/pdb_singles',
            success: function(raw_json) {
                if (raw_json !== '') {
                    parsed = JSON.parse(raw_json);
                    top_model = parsed[0];
                    A_carousel = parsed;
                    A_index = 0;

                    $('#A_title').text((A_index + 1).toString() + '/' + A_carousel.length.toString());

                    if (A_carousel.length <= 1) {
                        $('.achangers').css({ 'visibility': 'hidden' });
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
                    $('.abuttonbar').css({ 'visibility': 'visible' });
                    $('.aminfo_master').css({ 'visibility': 'visible' });
                    $('.td_A').parent().parent().parent().parent().css({ 'background-color': '#8797DB' });


                    current_uniprot = u;
                    $("#d3_network_container").fadeOut('fast');
                    $("#network_div").fadeOut('fast');
                    $('#gldiv_A').html('');
                    current_model_path_A = top_model.path;
                    $.ajax({
                        type: 'POST',
                        data: { path: top_model.path, chain: top_model.Chain },
                        url: 'http://marsh2.yulab.org/cgi-bin/api.py/read_pdb',
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
                            get_interface_predictions(model, 0);
                            set_mutex('A', false);
                            $('#interaction_' + partner).css({ 'background-color': 'lavender' });

                        }
                    });

                } else {
                    if (glviewerA) { glviewerA.clear(); }
                    $('#A_title').text('');
                    $('.abuttonbar').css({ 'visibility': 'hidden' });
                    $('.aminfo_master').css({ 'visibility': 'hidden' });
                    $('#gldiv_A').html('<div style="height:100%; width:100%; padding:140px;"><h5 style="text-align:center;line-height: 0;">No Model Available</h5></div>');
                    $('.td_A').text('');
                    $('.td_A').parent().parent().parent().parent().css({ 'background-color': '#ccc' });
                    $('.achangers').css({ 'visibility': 'hidden' });

                    get_interface_predictions(model, 0);
                    set_mutex('A', false);
                    $('#interaction_' + partner).css({ 'background-color': 'lavender' });

                }
            }
        });
    }
    if (!B_mutex) {
        set_mutex('B', true);
        $('#bdl_link').prop('disabled', true);

        $('#B_title').text('...');

        $.ajax({
            type: 'POST',
            data: { model: p },
            url: 'http://marsh2.yulab.org/cgi-bin/api.py/pdb_singles',
            success: function(raw_json) {
                if (raw_json !== '') {
                    parsed = JSON.parse(raw_json);
                    top_model = parsed[0];
                    B_carousel = parsed;
                    B_index = 0;

                    $('#B_title').text((B_index + 1).toString() + '/' + B_carousel.length.toString());
                    if (B_carousel.length <= 1) {
                        $('.bchangers').css({ 'visibility': 'hidden' });
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
                    $('.bbuttonbar').css({ 'visibility': 'visible' });
                    $('.bminfo_master').css({ 'visibility': 'visible' });
                    $('.td_B').parent().parent().parent().parent().css({ 'background-color': '#AA87DB' });


                    current_pair = p;
                    $("#d3_network_container").fadeOut('fast');
                    $("#network_div").fadeOut('fast');
                    $('#gldiv_B').html('');
                    current_model_path_B = top_model.path;
                    $.ajax({
                        type: 'POST',
                        data: { path: top_model.path, chain: top_model.Chain },
                        url: 'http://marsh2.yulab.org/cgi-bin/api.py/read_pdb',
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
                            get_interface_predictions(model, 1);
                            set_mutex('B', false);
                            $('#interaction_' + partner).css({ 'background-color': 'lavender' });

                        }
                    });

                } else {
                    if (glviewerB) { glviewerB.clear(); }
                    $('#B_title').text('');
                    $('.bbuttonbar').css({ 'visibility': 'hidden' });
                    $('.bminfo_master').css({ 'visibility': 'hidden' });
                    $('#gldiv_B').html('<div style="height:100%; width:100%; padding:140px;"><h5 style="text-align:center;line-height: 0;">No Model Available</h5></div>');
                    $('.td_B').text('');
                    $('.td_B').parent().parent().parent().parent().css({ 'background-color': '#ccc' });
                    $('.bchangers').css({ 'visibility': 'hidden' });


                    get_interface_predictions(model, 1);
                    set_mutex('B', false);
                    $('#interaction_' + partner).css({ 'background-color': 'lavender' });

                }
            }
        });
    }
}




function initialize_CCModel(partner, model, evidence, model_number) {
    $('.prediction_label').css({ 'border-bottom': 'none' });
    $('.prediction_label').html('');
    $('#welcome').hide();


    $('#paired').hide();
    $('#cocrystal').show();
    setTimeout(function() { $("#result_pane").fadeIn('slow'); }, 1500);

    var offset = $('#interaction_' + partner).offset();
    if (offset.top <= 163) {
        $('#interaction_div').animate({
            scrollTop: $('#interaction_div').scrollTop() - Math.abs(200 - offset.top),
        });
    } else if (offset.top >= 800) {
        $('#interaction_div').animate({
            scrollTop: $('#interaction_div').scrollTop() + Math.abs(200 - offset.top),
        });
    }

    if (glviewerA) { glviewerA.clear(); }
    current_model_path_A = undefined;
    if (glviewerB) { glviewerB.clear(); }
    current_model_path_B = undefined;

    cc_carousel = [];
    cc_index = 0;
    A_carousel = [];
    A_index = 0;
    B_carousel = [];
    B_index = 0;
    persistent_labelsCC = [
        [
            [],
            [],
        ],
        [
            [],
            [],
        ]
    ];


    if (!C_mutex) {
        set_mutex('C', true);
        $('#cocrystal_title').text('...');
        $('#adl_link').prop('disabled', true);
        $('#bdl_link').prop('disabled', true);


        current_uniprot = model.split('_')[0];
        current_pair = model.split('_')[1];
        current_interactor_gene_name = partner;
        $.ajax({
            type: 'POST',
            data: { model: model },
            url: 'http://marsh2.yulab.org/cgi-bin/api.py/pdb',
            success: function(raw_json) {
                parsed = JSON.parse(raw_json);
                top_model = parsed[0];
                cc_carousel = parsed;
                cc_index = 0;


                next = cc_carousel[cc_index];
                $('#cocrystal_title').text((cc_index + 1).toString() + '/' + cc_carousel.length.toString());

                if (cc_carousel.length <= 1) {
                    $('.cchangers').css({ 'visibility': 'hidden' });
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
                $('.abuttonbar').css({ 'visibility': 'visible' });
                $('.aminfo_master').css({ 'visibility': 'visible' });

                $('#minfo_sourcetype_B').text('SOURCE');
                $('#minfo_chaintype_B').text('CHAIN');
                $('.bbuttonbar').css({ 'visibility': 'visible' });
                $('.bminfo_master').css({ 'visibility': 'visible' });

                $('.td_A').parent().parent().parent().parent().css({ 'background-color': '#8797DB' });
                $('.td_B').parent().parent().parent().parent().css({ 'background-color': '#AA87DB' });



                if (top_model.path != current_model_path) {
                    $("#d3_network_container").fadeOut('fast');
                    $("#network_div").fadeOut('fast');
                    $('#gldiv').html('');
                    current_model_path = top_model.path;
                    $.ajax({
                        type: 'POST',
                        data: { path: top_model.path, chainA: top_model.chainA, chainB: top_model.chainB },
                        url: 'http://marsh2.yulab.org/cgi-bin/api.py/read_pdb',
                        success: function(pdb_text) {
                            moldata = data = pdb_text;
                            $('#pdb_readout').text(data);
                            if (glviewerCC) { glviewerCC.clear(); }
                            glviewerCC = $3Dmol.createViewer("gldiv", {
                                defaultcolors: $3Dmol.rasmolElementColors
                            });
                            glviewerCC.setBackgroundColor(0xffffff);
                            receptorModel = m = glviewerCC.addModel(data, "pdb");

                            glviewerCC.mapAtomProperties($3Dmol.applyPartialCharges);
                            glviewerCC.zoomTo();
                            glviewerCC.render();
                            get_interface_residues(model, current_model_path);
                            drawUniprot(current_uniprot, '#d3_uniprot_A_container', '#6A7FDB', 0, draw_current_coverage_CC);
                            drawUniprot(current_pair, '#d3_uniprot_B_container', '#9869DB', 1, draw_current_coverage_CC);
                            set_mutex('C', false);
                            $('#interaction_' + partner).css({ 'background-color': 'lavender' });

                        }
                    });
                } else {
                    set_mutex('C', false);
                    $('#interaction_' + partner).css({ 'background-color': 'lavender' });

                }
            }
        });
    }
}

function drawInteractors(organism, gene_name) {
    gene_name = $.trim(gene_name);
    if (gene_name === '') {
        return;
    }

    $('#selected_gene').prop('disabled', true);
    $('#selected_gene').css({ 'background-color': 'lavender', 'color': 'white' });
    $.ajax({
        type: 'POST',
        data: { organism: organism, gene_name: gene_name },
        url: 'http://marsh2.yulab.org/cgi-bin/api.py/interactions',
        success: function(result) {
            parsed = JSON.parse(result);
            $('#interaction_div').children().fadeOut().remove();
            if (parsed.interactors.length === 0) {
                var new_element = $("<a class='list-group-item interactor_item' id='interaction_failure style='height:40px; top:-200px'> no interactors </a>");
                new_element.appendTo('#interaction_div').animate({ 'top': 0, 'background-color': '#e7e7e7' }, 200);
                new_element.animate({ 'z-index': 0 });
            } else {

                $.each(parsed.interactors, function(index, val) {

                    var new_element_str;
                    if (val.evidence == 'ECLAIR') {

                        new_element_str = "<a class='list-group-item interactor_item' id='interaction_" + val.gene_name +
                            "' style='height:40px;z-index:-" + index + "; top:-" + (60 * (index + 1)) + "px' onclick='initialize_singleModels(" + '"' + val.gene_name + "\", \"" + parsed.current_uniprot + '_' + val.uniprot + "\")'>" + val.gene_name;

                    } else {

                        new_element_str = "<a class='list-group-item interactor_item' id='interaction_" + val.gene_name +
                            "' style='height:40px;z-index:-" + index + "; top:-" + (60 * (index + 1)) + "px' onclick='initialize_CCModel(" + '"' + val.gene_name + "\", \"" + parsed.current_uniprot + '_' + val.uniprot + "\")'>" + val.gene_name;

                    }

                    new_element_str += "<button class='btn btn-success evidence " + val.evidence.toLowerCase() +
                        "_decorator'>" + val.evidence +
                        "</button>";


                    new_element_str += "</a>";
                    new_element = $(new_element_str);
                    new_element.appendTo('#interaction_div').animate({ 'top': 0 }, (1000 - index));
                    new_element.animate({ 'z-index': 0 });
                });
            }

            $('#selected_gene').prop('disabled', false);
            $('#selected_gene').css({ 'background-color': '#fff', color: '#222' });
        }
    });

}


function update_interaction_menu(element) {
    e = $(element);
    if (e.is('a')) {
        $('#selected_taxa').text(e.text());
        current_taxa = $(e).attr('id').slice(-1);
    } else {
        drawInteractors($('#selected_taxa').text(), $('#selected_gene').val());
        draw_interaction_network($('#selected_taxa').text(), $('#selected_gene').val());
        window.location.hash = current_taxa + '_' + $('#selected_gene').val();
    }
}


function draw_interaction_network(organism, gene_name) {
    gene_name = $.trim(gene_name);
    if (gene_name === '') {
        return;
    }

    $('#welcome').hide();

    $.each(timeOuts, function(i, t) { clearTimeout(t); });
    timeOuts = [];

    $.ajax({
        type: 'POST',
        data: { organism: organism, gene_name: gene_name },
        url: 'http://marsh2.yulab.org/cgi-bin/api.py/network',
        success: function(result) {
            json = JSON.parse(result);

            var margin = { top: 160, right: 100, bottom: 200, left: 0 };
            $.when($("#result_pane").fadeOut('fast')).done(function() {
                $("#d3_network_container").fadeOut('slow');
                $("#network_div").fadeOut('slow');
                $("#d3_network_container").html('');

                var width = $(".right_pane").width() - margin.left - margin.right,
                    height = $(".right_pane").height() - margin.top - margin.bottom;

                network_svg = d3.select("#d3_network_container")
                    .append('g')
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                link_svg = network_svg
                    .append('g');

                node_svg = network_svg
                    .append('g');

                force = d3.layout.force()
                    .gravity(0.1)
                    .charge(-1000)
                    .linkDistance(10)
                    .size([width, height]);

                var voronoi = d3.geom.voronoi()
                    .x(function(d) {
                        return d.x;
                    })
                    .y(function(d) {
                        return d.y;
                    })
                    .clipExtent([
                        [0, -200],
                        [width + 200, height + 200]
                    ]);

                links = [];
                nodes = [];
                links = links.concat(json.links);
                nodes = nodes.concat(json.nodes);

                force
                    .nodes(nodes)
                    .links(links)
                    .start();

                link = link_svg.selectAll(".link")
                    .data(links);

                link.enter().append("line")
                    .attr("class", "link");

                node = node_svg.selectAll(".node")
                    .data(nodes);

                node.enter().append("g")
                    .attr("class", "node")
                    .style('fill', function(d) {
                        return d.fill;
                    })
                    .call(force.drag);

                var circle = node.append("circle")
                    .attr("r", 4.5);



                var label = node.append("text")
                    .attr("dy", "1.5em")
                    .text(function(d) {
                        return d.name;
                    });



                var cell = node.append("path")
                    .attr("class", "cell")
                    .attr("onclick", function(d) {
                        return "faux_click('#interaction_" + d.name + "')";
                    });

                force.on("tick", function() {
                    cell
                        .data(voronoi(json.nodes))
                        .attr("d", function(d) {
                            return d.length ? "M" + d.join("L") : null;
                        });

                    link
                        .attr("x1", function(d) {
                            return d.source.x;
                        })
                        .attr("y1", function(d) {
                            return d.source.y;
                        })
                        .attr("x2", function(d) {
                            return d.target.x;
                        })
                        .attr("y2", function(d) {
                            return d.target.y;
                        });

                    circle
                        .attr("cx", function(d) {
                            return d.x;
                        })
                        .attr("cy", function(d) {
                            return d.y;
                        });

                    label
                        .attr("x", function(d) {
                            return d.x + 8;
                        })
                        .attr("y", function(d) {
                            return d.y;
                        });


                    nodes[0].x = width / 2;
                    nodes[0].y = height / 2;
                });
                $("#d3_network_container").fadeIn('slow');
                $("#network_div").fadeIn('slow');

            });

            if (double_interactome && json.nodes.length > 1) { addExtraLinks(organism, json.nodes); }
        }
    });
}


function start() {
    force.links(links);

    link = link_svg.selectAll(".link")
        .data(links);

    // link.enter().append("line")
    //     .attr("class", "link")
    //     .style("stroke", "lavender");

    link.enter().append("line")
        .attr("class", "link")
        .style("stroke", "lightsteelblue");


    link.exit().remove();

    force
        .nodes(nodes)
        .links(links)
        .start();

}


function addExtraLinks(organism, nodes) {
    var names = [];
    $.each(nodes, function(i, n) {
        names[i] = n.name;
    });
    $.ajax({
        type: 'POST',
        data: { organism: organism, names: names.join([separator = ',']) },
        url: 'http://marsh2.yulab.org/cgi-bin/api.py/extra_network',
        success: function(result) {
            var json = JSON.parse(result);
            // links = links.concat(json);
            // start();
            $.each(json, function(i, l) {
                timeOuts.push(setTimeout(function() {
                    links.push(l);
                    start();
                }, (3000 / json.length) * i));
            });


        }
    });
}