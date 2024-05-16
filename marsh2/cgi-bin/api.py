#!/usr/local/bin/python
import sys
sys.stderr = open("/app/insider/logs/pyerrors", "a")

import warnings
#warnings.filterwarnings("always")
#warnings.filterwarnings("ignore")

import web
import json
import pandas as pd
from biopandas.pdb import PandasPDB
import random
import os
from collections import defaultdict
from sklearn.preprocessing import MinMaxScaler
import numpy as np


from cluster_module import *

DB_USER = os.getenv("MARIADB_USER")
DB_PASS = os.getenv("MARIADB_PASSWORD")
DB_NAME = os.getenv("MARIADB_DATABASE")

urls = (
    '/test', 'test',
    '/interactions', 'interactions',
    '/network', 'network',
    '/extra_network', 'extra_network',
    '/pdb', 'pdb',
    '/pdb_singles', 'pdb_singles',

    '/read_pdb', 'read_pdb',
    '/ires', 'ires',
    '/ipred', 'ipred',

    '/pfam', 'pfam',

    '/enrichment', 'enrichment',
    '/dismuts', 'dismuts',
    '/enrichment_table', 'enrichment_table',

    '/panel_features', 'panel_features',
    '/panel_features_single', 'panel_features_single',

    '/linear_uniprot', 'linear_uniprot',

    '/diseaseNetwork', 'diseaseNetwork',
    '/enrichmentNetwork', 'enrichmentNetwork',

    '/localNetwork', 'localNetwork',

    '/diseaseNetworkSeeds', 'diseaseNetworkSeeds',

    '/isDocked', 'isDocked',

    '/variants', 'variants',
    '/dismut_atpos', 'dismut_atpos',

    '/single_clustering', 'single_clustering',
    '/pair_clustering', 'pair_clustering',
    '/check_mutcode', 'check_mutcode'
)


def save(ip, action):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    db.insert('visits', ip=ip, action=action, time=web.SQLLiteral("NOW()"))


def gene_to_uniprot(taxid, gene_name):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    results = db.select('gene_to_uniprot', where='gene_name="{0}" AND taxid="{1}"'.format(gene_name, taxid)).list()
    db.ctx.db.close()
    return (gene_name, results[0].uniprot) if results else (uniprot_to_gene(taxid, gene_name.upper()), gene_name.upper())


def uniprot_to_gene(taxid, uniprot):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    results = db.select('gene_to_uniprot', where='uniprot="{0}" AND taxid="{1}"'.format(uniprot, taxid)).list()
    db.ctx.db.close()
    return min([(r.index, r.gene_name) for r in results])[1] if results else ('', uniprot)


def get_interactors(taxid, uniprot):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    results = db.query('SELECT * FROM interactions WHERE (\'{1}\' in (Uniprot_A, Uniprot_B)) and taxid={0}'.format(taxid, uniprot))
    interactors = [r.Uniprot_A if r.Uniprot_A == r.Uniprot_B
                   else filter(lambda x: x != uniprot, (r.Uniprot_A, r.Uniprot_B))[0]
                   for r in results]
    results = db.query('SELECT gene_to_uniprot.index, uniprot, gene_name FROM gene_to_uniprot WHERE uniprot in ({0})'.format("'" + "','".join(interactors) + "'")).list()
    db.ctx.db.close()
    return list(dict([(u, g) for i, u, g in sorted([(x.index, x.uniprot, x.gene_name) for x in results], reverse=True)]).iteritems())


def get_taxid(organism):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    results = db.select('taxa_info', where='nickname="{0}"'.format(organism)).list()
    db.ctx.db.close()
    return min([(r.index, r.taxid) for r in results])[1]


def get_top_evidence(interaction):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    res = db.select('interaction_model_index', where='interaction="{0}" AND source!="ZDK"'.format('_'.join(sorted(interaction.split('_'))))).list()
    db.ctx.db.close()
    if len(res) == 0:
        return 'ECLAIR'
    result = pd.DataFrame(dict(r) for r in res)
    result = result.sort_values(by=['source_priority', 'coverage'], ascending=[True, False])
    return result.iloc[0].source

import re


def unzip_res_range(res_range):
    '''Converts ranges in the form: [2-210] or [3-45,47A,47B,51-67] into lists of strings including all numbers in these ranges in order'''
    res_ranges = res_range.strip()[1:-1].split(',')
    index_list = []
    for r in res_ranges:
        if re.match('.+-.+', r):
            a, b = r.split('-')
            index_list += [str(n) for n in range(int(a), int(b) + 1)]
        else:
            index_list.append(r)

    if index_list == ['']:
        return []
    else:
        return index_list


def get_single_data(uniprot):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    res = db.select('protein_model_index', where='uniprot="{0}"'.format(uniprot)).list()
    db.ctx.db.close()
    if len(res) == 0:
        return None
    result = pd.DataFrame(dict(r) for r in res)
    result = result.sort_values(by=['source_priority', 'coverage'], ascending=[True, False])
    result['uniprot_res'] = result['uniprot_res'].apply(unzip_res_range)
    result['model_res'] = result['model_res'].apply(unzip_res_range)
    return result[result.source_priority == result.iloc[0].source_priority].to_json(orient='records')


def parseFileDescription(description_string):
    return description_string.split('.')[0][-4:].upper()


def get_interaction_data(interaction):
    current, other = interaction.split('_')
    current_first = current <= other
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    res = db.select('interaction_model_index', where='interaction="{0}"'.format('_'.join(sorted(interaction.split('_'))))).list()
    db.ctx.db.close()
    result = pd.DataFrame(dict(r) for r in res)
    result['chain_current'] = result['chainA'] if current_first else result['chainB']
    result['chain_inter'] = result['chainB'] if current_first else result['chainA']
    result['current_uniprot_res'] = result['uniprot_res' + ('A' if current_first else 'B')].apply(unzip_res_range)
    result['current_model_res'] = result['model_res' + ('A' if current_first else 'B')].apply(unzip_res_range)
    result['interactor_uniprot_res'] = result['uniprot_res' + ('B' if current_first else 'A')].apply(unzip_res_range)
    result['interactor_model_res'] = result['model_res' + ('B' if current_first else 'A')].apply(unzip_res_range)
    result['struct_or_temp'] = result['file'].apply(parseFileDescription)
    result = result.sort_values(by=['source_priority', 'coverage'], ascending=[True, False])
    return result[result.source_priority == result.iloc[0].source_priority].to_json(orient='records')


def get_group_interactions(uniprots, taxid):
    import networkx as nx
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    res = db.select('interactions', where='taxid="{0}" AND Uniprot_A IN ({1}) AND Uniprot_B IN ({1})'.format(taxid, ','.join(['"' + x + '"' for x in uniprots]))).list()
    db.ctx.db.close()
    result = pd.DataFrame(dict(r) for r in res)[['Uniprot_A', 'Uniprot_B']]
    G = nx.from_pandas_dataframe(result[(result.Uniprot_A != result.Uniprot_B) & (result.Uniprot_A != uniprots[0]) & (result.Uniprot_B != uniprots[0])], 'Uniprot_A', 'Uniprot_B').to_undirected()
    locations = [{'source': uniprots.index(a), 'target': uniprots.index(b), 'stroke': '#e7e7e7'} for a, b in G.edges()]
    return json.dumps(locations)


def get_interface_residues(interaction, model_file, as_json=True, debug=False):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    if model_file == '':
        res = db.select('interface_residues', where='interaction="{0}"'.format(interaction)).list()
        result = pd.DataFrame(dict(r) for r in res).drop_duplicates(['evidence', 'residue_index']).sort_values(by='residue_index')
    else:
        res = db.select('interface_residues', where='interaction="{0}" AND path="{1}"'.format(interaction, model_file)).list()
        result = pd.DataFrame(dict(r) for r in res)

    db.ctx.db.close()

    if debug is True:
        return result

    highest_evidence = min(result['evidence'].unique(), key=lambda x: ['PDB', 'I3D', 'ZDK'].index(x))
    if highest_evidence == 'ZDK':
        result = result[result.evidence == 'none']
    else:
        result = result[result.evidence == highest_evidence]

    if as_json:
        return result.to_json(orient='records')
    else:
        return result


def grabLast(row):
    contents = row.dropna().values
    if contents.shape[0] != 0:
        return contents[-1]
    else:
        return 0


def get_predictions(interaction, index_in_interaction, as_json=True):
    if not os.path.exists('/data/web-vhosts/marshmallow/data/marshmallow_predictions/{0}.pkl'.format(interaction)):
        return 'niet'
    df = pd.read_pickle('/data/web-vhosts/marshmallow/data/marshmallow_predictions/{0}.pkl'.format(interaction))

    # Tiers are 1-indexed. In this example there are 5 tiers (4 dividers)

    df['Protein'] = df[['P1', 'P2', 'Prot']].apply(lambda (p1, p2, i): p1 if i == 0 else p2, axis=1)

    # df['Scaled'] = df['Pred']
    # df['Tier'] = df['Scaled'].apply(lambda x: 5 - sorted([0.2, 0.4, 0.6, 0.8] + [x], reverse=True).index(x))

    min_max_scaler = MinMaxScaler()
    df['Scaled'] = min_max_scaler.fit_transform(np.clip(df['Pred'].append(pd.Series([-9, 9])), 0.0, 0.60).reshape(-1, 1))[:-2]
    df['Tier'] = df['Scaled'].apply(lambda x: 5 - sorted([0.2, 0.4, 0.6, 0.8] + [x], reverse=True).index(x))

    # if df[(df['Prot'] == index_in_interaction) & (df.Tier >= 3)].shape[0] <= 5:
    #     result_df = df[(df['Prot'] == index_in_interaction) & (df.Tier >= 2)][['Protein', 'Pos', 'Scaled', 'Tier', 'Res']].sort_values(by=['Scaled'], ascending=False).head(10).sort_values(by=['Pos'])
    # else:
    #     result_df = df[(df['Prot'] == index_in_interaction) & (df.Tier >= 3)][['Protein', 'Pos', 'Scaled', 'Tier', 'Res']]

    result_df = df[(df['Prot'] == index_in_interaction) & (df.Tier >= 2)][['Protein', 'Pos', 'Scaled', 'Tier', 'Res']].sort_values(by=['Pos'])

    if as_json:
        return result_df.to_json(orient='records')
    else:
        return result_df


def getUniprotInfo(uniprot):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    results = db.select('uniprot_sequences', where='id="{0}"'.format(uniprot), what='id,length,reviewed,gene,protein').list()
    db.ctx.db.close()
    return results[0]


def get_pfams(uniprot):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    results = db.select('uniprot_to_pfam', where='UniProt="{0}"'.format(uniprot)).list()
    db.ctx.db.close()
    pfams = pd.DataFrame(dict(r) for r in results)
    return pfams.to_json(orient='records')


def getEnrichmentRanking(interaction, evidence_level):
    members = interaction.split('_')
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    # CASE: homodimer structure
    if len(set(members)) == 1 and evidence_level in ['PDB', 'I3D']:
        results = db.select('enrichment_struct_homo', where='Interaction="{0}"'.format(interaction)).list()
    # CASE: homodimer predicted
    elif len(set(members)) == 1:
        results = db.select('enrichment_pred_homo', where='Interaction="{0}"'.format(interaction)).list()
    # CASE: heterodimer structure
    elif evidence_level in ['PDB', 'I3D']:
        results = db.select('enrichment_struct_het', where='Interaction="{0}"'.format(interaction)).list()
    # CASE: heterodimer predicted
    else:
        results = db.select('enrichment_pred_het', where='Interaction="{0}"'.format(interaction)).list()

    db.ctx.db.close()

    return pd.DataFrame(dict(r) for r in results)


def getEnrichmentTable(interaction, source, disease, evidence_level, cutoff):
    members = interaction.split('_')

    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    # CASE: homodimer structure
    if len(set(members)) == 1 and evidence_level in ['PDB', 'I3D']:
        results = db.select('enrichment_struct_homo', where='Interaction="{0}" AND Disease="{1}" AND Source="{2}"'.format(interaction, disease, source)).list()
    # CASE: homodimer predicted
    elif len(set(members)) == 1:
        results = db.select('enrichment_pred_homo', where='Interaction="{0}" AND Disease="{1}" AND Source="{2}"'.format(interaction, disease, source)).list()
    # CASE: heterodimer structure
    elif evidence_level in ['PDB', 'I3D']:
        results = db.select('enrichment_struct_het', where='Interaction="{0}" AND Disease="{1}" AND Source="{2}"'.format(interaction, disease, source)).list()
    # CASE: heterodimer predicted
    else:
        results = db.select('enrichment_pred_het', where='Interaction="{0}" AND Disease="{1}" AND Source="{2}"'.format(interaction, disease, source)).list()

    cols = ['Interaction', 'Source', 'Disease', 'Res_A', 'Res_B', 'Res_AB', 'Dom_A', 'Dom_B', 'Dom_AB', 'Res_A_SE', 'Res_B_SE', 'Res_AB_SE', 'Dom_A_SE', 'Dom_B_SE', 'Dom_AB_SE']

    resdf = pd.DataFrame(dict(r) for r in results)

    # print resdf.columns

    if len(set(members)) != 1:
        resdf = resdf.rename(columns={'Res_A_' + cutoff: 'Res_A',
                                      'Res_B_' + cutoff: 'Res_B',
                                      'Res_AB_' + cutoff: 'Res_AB',
                                      'Dom_A_' + cutoff: 'Dom_A',
                                      'Dom_B_' + cutoff: 'Dom_B',
                                      'Dom_AB_' + cutoff: 'Dom_AB',
                                      'Res_A_SE_' + cutoff: 'Res_A_SE',
                                      'Res_B_SE_' + cutoff: 'Res_B_SE',
                                      'Res_AB_SE_' + cutoff: 'Res_AB_SE',
                                      'Dom_A_SE_' + cutoff: 'Dom_A_SE',
                                      'Dom_B_SE_' + cutoff: 'Dom_B_SE',
                                      'Dom_AB_SE_' + cutoff: 'Dom_AB_SE'})
        # print resdf.columns
        return resdf[cols]
    else:
        return resdf[['_'.join(c.split('_')[:-1]) if '_' in c else c for c in resdf.columns]]


def getDiseaseMutations(protein, source, disease):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    results = db.select('disease_mutations', where='Protein="{0}" AND disease_source="{1}" AND Disease="{2}"'.format(protein, source, disease)).list()
    db.ctx.db.close()
    return pd.DataFrame(dict(r) for r in results)


def get_pph2(protein, pos, ref, alt):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    results = db.select('delet_pph2', where='uniprot="{0}" AND pos={1} AND ref="{2}" AND alt="{3}"'.format(protein, pos, ref, alt)).list()
    db.ctx.db.close()
    resdf = pd.DataFrame(dict(r) for r in results)
    return resdf.iloc[0].pp2_prob if resdf.shape[0] > 0 else None


def get_sift(protein, pos, ref, alt):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    results = db.select('delet_sift', where='uniprot="{0}" AND pos={1} AND ref="{2}" AND alt="{3}"'.format(protein, pos, ref, alt)).list()
    db.ctx.db.close()
    resdf = pd.DataFrame(dict(r) for r in results)
    return resdf.iloc[0].pp2_prob if resdf.shape[0] > 0 else None


def get_grantham(protein, pos, ref, alt):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    results = db.select('delet_grantham', where='ref="{0}" AND alt="{1}"'.format(ref, alt)).list()
    db.ctx.db.close()
    resdf = pd.DataFrame(dict(r) for r in results)
    return resdf.iloc[0].score if resdf.shape[0] > 0 else None


def get_js(protein, pos):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    results = db.select('JS_Conservation', where='UniProt="{0}" AND UniProt_position={1}'.format(protein, pos)).list()
    db.ctx.db.close()
    resdf = pd.DataFrame(dict(r) for r in results)
    return float(resdf.iloc[0].JS) if resdf.shape[0] > 0 else None


def get_sasa(protein, pos, pdb, chain):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    results = db.select('pdb_sres', where='PDB="{0}" AND Chain="{1}" AND unis={2}'.format(pdb, chain, pos)).list()
    db.ctx.db.close()
    resdf = pd.DataFrame(dict(r) for r in results)
    return 'Yes' if resdf.shape[0] > 0 else 'No'


def get_diseases_involving(members, mutcode):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    results = db.select('disease_mutations JOIN gene_to_uniprot ON disease_mutations.Protein=gene_to_uniprot.uniprot',
                        where='Protein IN ({0})'.format(','.join(['"{0}"'.format(x) for x in members]))).list()
    db.ctx.db.close()
    resdf = pd.DataFrame(dict(r) for r in results)[['disease_source', 'Disease', 'gene_name', 'Protein']].drop_duplicates()
    resdf = resdf[resdf.disease_source.isin(['ClinVar', 'HGMD', 'COSMIC', mutcode])]
    grouped = dict([(source, defaultdict(list)) for source in resdf.disease_source.unique()])
    for i, row in resdf.sort_values(by=['disease_source', 'Disease', 'gene_name']).iterrows():
        grouped[row.disease_source][row.Disease].append(row.gene_name)
    return grouped


def get_enrichment_network(interactions, source, disease):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    df1, df2, df3, df4 = None, None, None, None

    # CASE: homodimer structure
    results = db.select('enrichment_struct_homo', where='Source="{0}" AND Disease="{1}" AND Interaction IN ({2})'.format(source, disease, ','.join(['"{0}"'.format(i) for i in interactions]))).list()
    if len(results) >= 1:
        df1 = pd.DataFrame(dict(r) for r in results)

        cols = ["Res_CC", "Dom_CC"]

        df1['LOR'] = df1[cols].max(axis=1)

    # CASE: homodimer predicted
    results = db.select('enrichment_pred_homo', where='Source="{0}" AND Disease="{1}" AND Interaction IN ({2})'.format(source, disease, ','.join(['"{0}"'.format(i) for i in interactions]))).list()
    if len(results) >= 1:
        df2 = pd.DataFrame(dict(r) for r in results)

        cols = ["Res_VeryHigh",
                "Res_High",
                "Res_Medium",
                "Dom_VeryHigh",
                "Dom_High",
                "Dom_Medium"]

        df2['LOR'] = df2[cols].max(axis=1)

    # CASE: heterodimer structure
    results = db.select('enrichment_struct_het', where='Source="{0}" AND Disease="{1}" AND Interaction IN ({2})'.format(source, disease, ','.join(['"{0}"'.format(i) for i in interactions]))).list()
    if len(results) >= 1:
        df3 = pd.DataFrame(dict(r) for r in results)

        cols = ["Res_A_CC",
                "Res_B_CC",
                "Res_AB_CC",
                "Dom_A_CC",
                "Dom_B_CC",
                "Dom_AB_CC"]

        df3['LOR'] = df3[cols].max(axis=1)

    # CASE: heterodimer predicted
    results = db.select('enrichment_pred_het', where='Source="{0}" AND Disease="{1}" AND Interaction IN ({2})'.format(source, disease, ','.join(['"{0}"'.format(i) for i in interactions]))).list()
    if len(results) >= 1:
        df4 = pd.DataFrame(dict(r) for r in results)

        cols = ["Res_A_VeryHigh",
                "Res_A_High",
                "Res_A_Medium",
                "Res_B_VeryHigh",
                "Res_B_High",
                "Res_B_Medium",
                "Res_AB_VeryHigh",
                "Res_AB_High",
                "Res_AB_Medium",
                "Dom_A_VeryHigh",
                "Dom_A_High",
                "Dom_A_Medium",
                "Dom_B_VeryHigh",
                "Dom_B_High",
                "Dom_B_Medium",
                "Dom_AB_VeryHigh",
                "Dom_AB_High",
                "Dom_AB_Medium"]

        df4['LOR'] = df4[cols].max(axis=1)

    db.ctx.db.close()

    return_cols = ['Interaction', 'LOR']
    if any(df is not None for df in [df1, df3, df2, df4]):
        return_df = pd.concat([df[return_cols] for df in filter(lambda x: x is not None, [df1, df3, df2, df4])], ignore_index=True).drop_duplicates(subset=['Interaction'], keep='first').fillna(0.0)
        return return_df
    else:
        return None


def get_interaction_network(identifiers, taxid=9606):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    results = db.select('gene_to_uniprot', where='taxid={0} AND (gene_name IN ({1}) OR uniprot IN ({1}))'.format(taxid, ','.join(['"{0}"'.format(i) for i in identifiers]))).list()
    resdf = pd.DataFrame(dict(r) for r in results)
    if resdf.shape[0] < 1:
        return None

    uniprots = resdf.uniprot.unique()

    first_degree = db.select('interactions', where='taxid={0} AND (Uniprot_A IN ({1}) OR Uniprot_B IN ({1}))'.format(taxid, ','.join(['"{0}"'.format(u) for u in uniprots]))).list()
    fd = pd.DataFrame(dict(r) for r in first_degree)
    fd['interaction'] = fd.Uniprot_A + "_" + fd.Uniprot_B
    first_layer = set(fd['interaction'].unique())

    members = sorted(set(uniprots) | set(fd.Uniprot_A.unique()) | set(fd.Uniprot_B.unique()))

    second_degree = db.select('interactions', where='taxid={0} AND Uniprot_A IN ({1}) AND Uniprot_B IN ({1})'.format(taxid, ','.join(['"{0}"'.format(u) for u in members]))).list()
    sd = pd.DataFrame(dict(r) for r in second_degree)
    sd['interaction'] = sd['Uniprot_A'] + '_' + sd['Uniprot_B']

    network_query = db.select('interaction_model_index', where='source_priority<2 AND interaction IN ({0})'.format(','.join(['"{0}"'.format(i) for i in sd['interaction'].unique()]))).list()
    network = pd.DataFrame(dict(r) for r in network_query)

    if network.shape[0]>0:
      network = network.sort_values(by=['source_priority']).drop_duplicates(subset=['interaction'], keep='first')
      df = pd.merge(sd[['Uniprot_A', 'Uniprot_B', 'interaction']], network[['interaction', 'source']], on='interaction', how='left').fillna('ECLAIR')
    else:
      df = sd[['Uniprot_A', 'Uniprot_B', 'interaction']]
      df['source'] = 'ECLAIR'

    df = df.rename(columns={'source': 'evidence'})

    # members will set the interaction index
    df['source'] = df['Uniprot_A'].apply(lambda x: members.index(x))
    df['target'] = df['Uniprot_B'].apply(lambda x: members.index(x))

    genes = db.select('gene_to_uniprot', where='taxid={0} AND uniprot IN ({1})'.format(taxid, ','.join(['"{0}"'.format(i) for i in members]))).list()
    g2u = pd.DataFrame(dict(r) for r in genes).drop_duplicates(subset=['uniprot'], keep='first')

    df = pd.merge(df[['interaction', 'evidence', 'Uniprot_A', 'Uniprot_B', 'source', 'target']], g2u[['gene_name', 'uniprot']],
                  how='left', left_on='Uniprot_A', right_on='uniprot').rename(columns={'gene_name': 'Gene_A'}).drop('uniprot', axis=1)
    df = pd.merge(df, g2u[['gene_name', 'uniprot']], how='left', left_on='Uniprot_B', right_on='uniprot').rename(columns={'gene_name': 'Gene_B'}).drop('uniprot', axis=1)

    df['Gene_A'] = df[['Gene_A', 'Uniprot_A']].apply(lambda (x, y): y if pd.isnull(x) else x, axis=1)
    df['Gene_B'] = df[['Gene_B', 'Uniprot_B']].apply(lambda (x, y): y if pd.isnull(x) else x, axis=1)

    db.ctx.db.close()

    d3_network = {'nodes': [], 'links': [], 'query': list(resdf.gene_name.unique())}

    colors = {'PDB': "#339933", 'I3D': "#99cc99", 'ECLAIR': "#99cccc"}
    df['stroke'] = df['evidence'].apply(lambda x: colors[x])
    df['linkDistance'] = df['interaction'].apply(lambda x: 100 if x not in first_layer else 200)
    df['opacity'] = df['interaction'].apply(lambda x: 0.3 if x not in first_layer else 0.1)

    for i, row in pd.merge(pd.DataFrame({'uniprot': members}), g2u, how='left').sort_values(by='uniprot').iterrows():
        d3_network['nodes'].append({'name': row.uniprot if pd.isnull(row.gene_name) else row.gene_name,
                                    'uniprot': row.uniprot,
                                    'group': 0,
                                    'x': random.randint(500, 800),
                                    'y': random.randint(300, 500),
                                    'main': row.uniprot in uniprots})

    for i, row in df.sort_values(by=['Gene_A', 'Gene_B']).iterrows():
        d3_network['links'].append(row.to_dict())

    return d3_network


def seedsForDiseaseNet(source, disease, limit=10):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)

    df1, df2, df3, df4 = None, None, None, None

    # CASE: homodimer structure
    results = db.select('enrichment_struct_homo', where=('Source="{0}" AND Disease="{1}"'.format(source, disease) if disease != '' else 'Source="{0}"'.format(source))).list()
    if len(results) >= 1:
        df1 = pd.DataFrame(dict(r) for r in results)

        cols = ["Res_CC", "Dom_CC"]

        df1['LOR'] = df1[cols].max(axis=1)

    # CASE: homodimer predicted
    results = db.select('enrichment_pred_homo', where=('Source="{0}" AND Disease="{1}"'.format(source, disease) if disease != '' else 'Source="{0}"'.format(source))).list()
    if len(results) >= 1:
        df2 = pd.DataFrame(dict(r) for r in results)

        cols = ["Res_VeryHigh",
                "Res_High",
                "Res_Medium",
                "Dom_VeryHigh",
                "Dom_High",
                "Dom_Medium"]

        df2['LOR'] = df2[cols].max(axis=1)

    # CASE: heterodimer structure
    results = db.select('enrichment_struct_het', where=('Source="{0}" AND Disease="{1}"'.format(source, disease) if disease != '' else 'Source="{0}"'.format(source))).list()
    if len(results) >= 1:
        df3 = pd.DataFrame(dict(r) for r in results)

        cols = ["Res_A_CC",
                "Res_B_CC",
                "Res_AB_CC",
                "Dom_A_CC",
                "Dom_B_CC",
                "Dom_AB_CC"]

        df3['LOR'] = df3[cols].max(axis=1)

    # CASE: heterodimer predicted
    results = db.select('enrichment_pred_het', where=('Source="{0}" AND Disease="{1}"'.format(source, disease) if disease != '' else 'Source="{0}"'.format(source))).list()
    if len(results) >= 1:
        df4 = pd.DataFrame(dict(r) for r in results)

        cols = ["Res_A_VeryHigh",
                "Res_A_High",
                "Res_A_Medium",
                "Res_B_VeryHigh",
                "Res_B_High",
                "Res_B_Medium",
                "Res_AB_VeryHigh",
                "Res_AB_High",
                "Res_AB_Medium",
                "Dom_A_VeryHigh",
                "Dom_A_High",
                "Dom_A_Medium",
                "Dom_B_VeryHigh",
                "Dom_B_High",
                "Dom_B_Medium",
                "Dom_AB_VeryHigh",
                "Dom_AB_High",
                "Dom_AB_Medium"]

        df4['LOR'] = df4[cols].max(axis=1)

    db.ctx.db.close()

    return_cols = ['Interaction', 'LOR']

    if any(df is not None for df in [df1, df3, df2, df4]):
        return_df = pd.concat([df[return_cols] for df in filter(lambda x: x is not None, [df1, df3, df2, df4])], ignore_index=True).drop_duplicates(
            subset=['Interaction'], keep='first').fillna(0.0).sort_values(by=['LOR'], ascending=False)
        return_df['A'] = return_df['Interaction'].apply(lambda x: x.split('_')[0])
        return_df['B'] = return_df['Interaction'].apply(lambda x: x.split('_')[1])

        seeds = set([])
        while len(seeds) < limit:
            stack = return_df[~(return_df.A.isin(seeds) | return_df.B.isin(seeds))]
            if stack.shape[0] < 1:
                break
            seeds |= set(stack.iloc[0].Interaction.split('_'))
        return sorted(seeds)
    else:
        return None


def get_1kGenomes(uniprot, uniprot_pos):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    results = db.select('variants_1000Genomes', where='uniprot="{0}" AND pos="{1}"'.format(uniprot, uniprot_pos)).list()
    db.ctx.db.close()

    df = pd.DataFrame(dict(r) for r in results)
    cols = ["dbsnp",
            "ref",
            "alt",
            "af_all",
            "asian_af",
            "american_af",
            "african_af",
            "european_af"]
    if df.shape[0] > 0:
        df = df[cols].rename(columns={'ref': 'REF', 'alt': 'ALT',
                                      "af_all": "AF (All)",
                                      "asian_af": "AF (ASIA)",
                                      "american_af": "AF (AMERICA)",
                                      "african_af": "AF (AFRICA)",
                                      "european_af": "AF (EUROPE)"})
        return df.fillna('').to_html()

    return '<h5> No variants for this locus in this database </h5>'


def get_ESP(uniprot, uniprot_pos):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    results = db.select('variants_ESP6500', where='uniprot="{0}" AND pos="{1}"'.format(uniprot, uniprot_pos)).list()
    db.ctx.db.close()
    df = pd.DataFrame(dict(r) for r in results)
    cols = ["dbsnp",
            "ref",
            "alt",
            "af_all",
            "af_aa",
            "af_ea",
            "nt_mut"]
    if df.shape[0] > 0:
        df = df[cols].rename(columns={'ref': 'REF', 'alt': 'ALT',
                                      "af_all": "AF (All)",
                                      "af_aa": "AF (AA)",
                                      "af_ea": "AF (EU)",
                                      'nt_mut': 'Nucleotide Mutation'})
        return df.fillna('').to_html()

    return '<h5> No variants for this locus in this database </h5>'


def get_uniprot_variants(uniprot, uniprot_pos):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    results = db.select('variants_UniProt', where='uniprot="{0}" AND pos="{1}"'.format(uniprot, uniprot_pos)).list()
    db.ctx.db.close()
    df = pd.DataFrame(dict(r) for r in results)
    cols = ["dbsnp",
            "ref",
            "alt",
            "Crossref"]
    if df.shape[0] > 0:
        df = df[cols].rename(columns={'ref': 'REF', 'alt': 'ALT'})
        return df.fillna('').to_html()

    return '<h5> No variants for this locus in this database </h5>'


def get_dismut(uniprot, uniprot_pos, mutcode):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    results = db.select('disease_mutations', where='Protein="{0}" AND UniProt_position="{1}"'.format(uniprot, uniprot_pos)).list()
    db.ctx.db.close()
    df = pd.DataFrame(dict(r) for r in results)
    cols = ["disease_source",
            "Disease",
            "AA_REF",
            "AA_ALT"]

    if df.shape[0] > 0:
        df = df[cols].rename(columns={'AA_REF': 'REF', 'AA_ALT': 'ALT', 'disease_source': 'Source'})
        df = df[df['Source'].isin(['HGMD', 'ClinVar', 'COSMIC', mutcode])]
        return df.fillna('').to_html()

    return '<h5> No variants for this locus in this database </h5>'


def valid_disease(uniprot):
    db = web.database(dbn='mysql',
                      host="db",
                      user=DB_USER,
                      passwd=DB_PASS,
                      db=DB_NAME)
    results = db.select('disease_mutations', where='Protein="{0}"'.format(uniprot)).list()
    db.ctx.db.close()
    df = pd.DataFrame(dict(r) for r in results)

    if df.shape[0] > 0:
        return set((df.disease_source + '_' + df.Disease).values)

    return set([])


def get_features(interaction, protein, pos):
    df = pd.read_pickle('/data/web-vhosts/marshmallow/data/marshmallow_predictions/{0}.pkl'.format('_'.join(sorted(interaction.split('_')))))
    classifier_i = df[(df.Prot == sorted(interaction.split('_')).index(protein)) & (df.Pos == int(pos))].iloc[0].TopClf
    classes = ["No Information",
               "Sequence Features Only",
               "Sequence and Conservation Features",
               "Sequence, Conservation, and CoEvolution Features",
               "Sequence and Structural Features",
               "Sequence, Structural, and Conservation Features",
               "Sequence, Structural, Conservation, and Docking Features",
               "Sequence, Structural, Conservation, and CoEvolution Features",
               "Sequence, Structural, Conservation, CoEvolution, and Docking Features"]

    return classes[classifier_i]


class test:

    def POST(self):
        rcv = web.input()
        if 'resp[org]' in rcv and 'Amazon' in str(rcv['resp[org]']):
            return 'Hi Amazonbot'

        save(web.ctx.ip, 'Landing from: ' + str(rcv['resp[ip]']) +
             ', ' + str(rcv['resp[org]'] if 'resp[org]' in rcv else '') +
             ', ' + str(rcv['resp[city]'] if 'resp[city]' in rcv else '') +
             ', ' + str(rcv['resp[region]'] if 'resp[region]' in rcv else '') +
             ', ' + str(rcv['resp[country]'] if 'resp[country]' in rcv else '')
             )
        return "OK"


class interactions:

    def POST(self):
        rcv = web.input()

        gene_name = rcv.gene_name
        organism = rcv.organism.strip()
        taxid = get_taxid(organism)

        if gene_name.upper() == 'SMAD8':
            gene_name = 'SMAD9'

        gene_name, uniprot = gene_to_uniprot(taxid, gene_name)
        interactors = get_interactors(taxid, uniprot)

        list_dict_interactors = sorted([{'gene_name': interactor_gene,
                                         'uniprot': interactor_uniprot,
                                         'evidence': get_top_evidence('_'.join(sorted([interactor_uniprot, uniprot])))}
                                        for interactor_uniprot, interactor_gene in sorted(interactors)], key=lambda x: x['gene_name'])

        return json.dumps({'current_gene': gene_name, 'current_uniprot': uniprot, 'interactors': list_dict_interactors})


class network:

    def POST(self):
        rcv = web.input()

        gene_name = rcv.gene_name
        if gene_name.upper() == 'SMAD8':
            gene_name = 'SMAD9'

        organism = rcv.organism.strip()
        taxid = get_taxid(organism)

        save(web.ctx['ip'], 'Query: ' + gene_name + ' (' + organism + ')')

        gene_name, uniprot = gene_to_uniprot(taxid, gene_name)
        translated = uniprot_to_gene(taxid, uniprot)
        if type(translated) == tuple:
            gene_name = gene_name[1]
        else:
            gene_name = uniprot_to_gene(taxid, uniprot)

        interactors = get_interactors(taxid, uniprot)

        d3_network = {'gene_name': gene_name, 'nodes': [{'name': gene_name, 'uniprot': uniprot, 'group': 0, 'x': random.randint(0, 800), 'y': random.randint(0, 800), 'fill': '#333'}], 'links': []}
        for index, (interactor_uniprot, interactor_gene) in enumerate(interactors, start=1):
            interaction = None
            interaction = '_'.join(sorted([uniprot, interactor_uniprot]))
            evi = get_top_evidence(interaction)
            colors = defaultdict(lambda: '#99cccc', {'PDB': '#339933', 'I3D': '#99cc99', 'ZDK': '#99cccc'})

            d3_network['nodes'].append({'name': interactor_gene if interactor_gene else interactor_uniprot,
                                        'uniprot': interactor_uniprot,
                                        'group': 1, 'x': random.randint(0, 800), 'y': random.randint(0, 800),
                                        'fill': colors[evi]})

            d3_network['links'].append({'source': 0, 'target': index, 'stroke': '#e7e7e7'})

        return json.dumps(d3_network)


class extra_network:

    def POST(self):
        rcv = web.input()
        interactors = rcv.names.split(',')
        organism = rcv.organism.strip()
        taxid = get_taxid(organism)

        uniprots = [gene_to_uniprot(taxid, name)[1] for name in interactors]
        interactions = get_group_interactions(uniprots, taxid)
        return interactions


class pdb:

    def POST(self):
        rcv = web.input()
        data = get_interaction_data(rcv.model)
        return data


class pdb_singles:

    def POST(self):
        rcv = web.input()
        data = get_single_data(rcv.model)
        if data is None:
            return ''
        return data


class read_pdb:

    def POST(self):
        rcv = web.input()
        path = rcv.path
        try:
            chains = [rcv.chain]
        except:
            chains = [rcv.chainA, rcv.chainB]
        ppdb = PandasPDB()
        df = ppdb.read_pdb(path)
        atoms = df.df['ATOM']
        minipdb = atoms[atoms.chain_id.isin(chains)].drop_duplicates(subset=['atom_number'])
        pdbstr = "{0:6}{1:5}{2:1}{3:4}{4:1}{5:3}{6:1}{7:1}{8:4}{9:1}{10:3}{11:8}{12:8}{13:8}{14:6}{15:6}{16:6}{17:4}{18:2}{19:2}"
        content = '\n'.join([pdbstr.format(*values).replace('nan', '   ') for values in minipdb.values])
        return content


class ires:

    def GET(self):
        rcv = web.input()
        current_uniprot, interactor = rcv.model.split('_')
        interaction = '_'.join(sorted([current_uniprot, interactor]))
        interface = get_interface_residues(interaction, '', as_json=False)
        interface['Protein'], interface['Partner'] = zip(*interface[['interaction', 'chain_index']].apply(lambda (x, y): x.split('_') if y == 0 else x.split('_')[::-1], axis=1).values)
        interface['Pos'] = interface['residue_index']
        interface['chains'] = interface['chain_A'] + interface['chain_B']
        return interface[['Protein', 'Partner', 'Pos', 'Res', 'evidence', 'file', 'chains']].to_csv(path_or_buf=None, index=False)

    def POST(self):
        rcv = web.input()
        current_uniprot, interactor = rcv.model.split('_')
        interaction = '_'.join(sorted([current_uniprot, interactor]))
        model_file = rcv.model_file
        return get_interface_residues(interaction, model_file)


class ipred:

    def GET(self):
        rcv = web.input()
	
	current_uniprot, interactor = rcv.model.split('_')
        interaction = '_'.join(sorted([current_uniprot, interactor]))
        prot, partner = rcv.model.split('_')
        # print 'Content-Type: text/plain\n'

        predictions = get_predictions(interaction, interaction.split("_").index(prot), False)
        predictions['Partner'] = partner
        predictions['Score'] = predictions['Scaled']
        predictions['Tier'] = predictions['Tier'].apply(lambda x: {1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High'}[int(x)])

        predictions2 = get_predictions(interaction, interaction.split("_").index(partner), False)
        predictions2['Partner'] = prot
        predictions2['Score'] = predictions2['Scaled']
        predictions2['Tier'] = predictions2['Tier'].apply(lambda x: {1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High'}[int(x)])
	
        final = pd.concat([predictions, predictions2], ignore_index=True).drop_duplicates()
	
        return final[['Protein', 'Partner', 'Pos', 'Res', 'Score', 'Tier']].to_csv(path_or_buf=None, index=False)

    def POST(self):
        rcv = web.input()
        chain_index = int(rcv.chain_index)
        current_uniprot, interactor = rcv.model.split('_')
        interaction = '_'.join(sorted([current_uniprot, interactor]))
        index_in_interaction = chain_index if (rcv.model == interaction) else (1 - chain_index)
        return get_predictions(interaction, index_in_interaction)


class linear_uniprot:

    def POST(self):
        rcv = web.input()
        uniprot = rcv.uniprot
        return json.dumps(getUniprotInfo(uniprot))


class pfam:

    def POST(self):
        rcv = web.input()
        uniprot = rcv.uniprot
        pfams = get_pfams(uniprot)
        return pfams


class enrichment:

    def POST(self):
        rcv = web.input()
        scope = rcv.scope
        scale = rcv.scale
        database = rcv.database
        raw_interaction = rcv.interaction
        A, B = sorted(raw_interaction.split('_'))
        interaction = '_'.join([A, B])
        evidence_level = get_top_evidence(interaction)

        scope_suffix = 'A' if scope == A else 'B' if scope == B else 'AB'

        homodimer = len(set(raw_interaction.split('_'))) == 1

        enrichment = getEnrichmentRanking(interaction, evidence_level)
        columns = ['Disease', 'Enrichment', 'SE']

        if (scope_suffix != 'AB') and (enrichment.shape[0] > 0):
            dis = valid_disease(scope)
            enrichment = enrichment[(enrichment.Source + '_' + enrichment.Disease).apply(lambda x: x in dis)]

        if enrichment.shape[0] > 0:
            enrichment = enrichment[enrichment.Source == database]
        else:
            enrichment = pd.DataFrame(columns=columns)

        # CASE: Struct Homodimer
        if evidence_level in ['PDB', 'I3D'] and homodimer:
            enrichment = enrichment.rename(columns={scale + '_CC': 'Enrichment', scale + '_SE_CC': 'SE'})[columns]
        # CASE: Struct Heterodimer
        elif evidence_level in ['PDB', 'I3D'] and not homodimer:
            enrichment = enrichment.rename(columns={scale + '_' + scope_suffix + '_CC': 'Enrichment', scale + '_' + scope_suffix + '_SE_CC': 'SE'})[columns]
        # CASE: Predicted Homodimer
        elif homodimer:
            cutoff = rcv.cutoff
            enrichment = enrichment.rename(columns={scale + '_' + cutoff: 'Enrichment', scale + '_SE_' + cutoff: 'SE'})[columns]
        # CASE: Predicted Heterodimer
        else:
            cutoff = rcv.cutoff
            enrichment = enrichment.rename(columns={scale + '_' + scope_suffix + '_' + cutoff: 'Enrichment', scale + '_' + scope_suffix + '_SE_' + cutoff: 'SE'})[columns]

        return json.dumps(enrichment.fillna(0).sort_values(by='Enrichment', ascending=False).reset_index(drop=True).to_dict(orient='index'))


class dismuts:

    def POST(self):
        rcv = web.input()
        protein = rcv.protein
        source = rcv.source
        disease = rcv.disease
        dismutdf = getDiseaseMutations(protein, source, disease)
        if dismutdf.shape[0] == 0:
            return json.dumps([])
        return json.dumps(dismutdf.dropna().sort_values(by='UniProt_position').reset_index(drop=True).to_dict(orient='index'))


class enrichment_table:

    def POST(self):
        rcv = web.input()
        interaction = '_'.join(sorted(rcv.interaction.split('_')))
        source = rcv.source
        disease = rcv.disease
        cutoff = rcv.cutoff
        evidence_level = get_top_evidence(interaction)

        table = getEnrichmentTable(interaction, source, disease, evidence_level, cutoff)
        return json.dumps(table.to_dict(orient='index'))


class panel_features:

    def POST(self):
        rcv = web.input()
        protein = rcv.protein
        pos = rcv.pos
        ref = rcv.ref
        alt = rcv.alt

        if 'structure' in rcv.keys():
            pdb = rcv.structure
            chain = rcv.chain
            sasa = get_sasa(protein, pos, pdb, chain)
        else:
            sasa = 'N/A'

        pph2 = get_pph2(protein, pos, ref, alt)
        sift = get_sift(protein, pos, ref, alt)
        grantham = get_grantham(protein, pos, ref, alt)
        js = get_js(protein, pos)
        return json.dumps({'pph2': pph2, 'sift': sift, 'grantham': grantham, 'JS': js, 'surface': sasa})


class panel_features_single:

    def POST(self):
        rcv = web.input()
        protein = rcv.protein
        pos = rcv.pos
        interaction = rcv.interaction

        if 'structure' in rcv.keys():
            pdb = rcv.structure
            chain = rcv.chain
            sasa = get_sasa(protein, pos, pdb, chain)
        else:
            sasa = 'N/A'

        js = get_js(protein, pos)
        features = get_features(interaction, protein, pos)
        return json.dumps({'JS': js, 'surface': sasa, 'features': features})


class isDocked:

    def POST(self):
        rcv = web.input()
        return 0 if get_top_evidence(rcv.u1 + '_' + rcv.u2) == 'ECLAIR' else 1


class diseaseNetwork:

    def POST(self):
        rcv = web.input()
        members = rcv.members.split(',')
        mutcode = rcv.mutcode
        diseases = get_diseases_involving(members, mutcode)
        return json.dumps(diseases)


class enrichmentNetwork:

    def POST(self):
        rcv = web.input()
        interactions = ['_'.join(sorted(i.split('_'))) for i in rcv.interactions.split(',')]
        source = rcv.source
        disease = rcv.disease
        enrichment_net = get_enrichment_network(interactions, source, disease)
        if enrichment_net is None:
            return json.dumps(None)
        return json.dumps(enrichment_net.set_index('Interaction').to_dict(orient='index'))


class localNetwork:

    def POST(self):
        rcv = web.input()
        identifiers = rcv.identifiers
        save(web.ctx['ip'], 'Network: ' + identifiers)
        d3_network = get_interaction_network(identifiers.split(','))
        return json.dumps(d3_network)


class diseaseNetworkSeeds:

    def POST(self):
        rcv = web.input()
        source = rcv.source
        disease = rcv.disease
        seeds = seedsForDiseaseNet(source, disease)
        return json.dumps(seeds)


class variants:

    def POST(self):
        rcv = web.input()
        uniprot = rcv.Protein
        pos = rcv.Pos
        return json.dumps({'1k': get_1kGenomes(uniprot, pos),
                           'ESP': get_ESP(uniprot, pos),
                           'UniProt': get_uniprot_variants(uniprot, pos)})


class dismut_atpos:

    def POST(self):
        rcv = web.input()
        uniprot = rcv.Protein
        pos = rcv.Pos
        mutcode = rcv.mutcode if 'mutcode' in rcv else ''
        return json.dumps(get_dismut(uniprot, pos, mutcode))


class single_clustering:

    def POST(self):
        rcv = web.input()
        filename = rcv.path
        chain = rcv.chain
        length_dict = {chain: len(rcv.uniprot_length)}
        uniprot_res = rcv.uniprot_res.split(',')
        model_res = rcv.model_res.split(',')
        sift_dict = {chain: dict(zip(uniprot_res, model_res))}
        rev_sift_dict = {chain: dict(zip(model_res, uniprot_res))}
        mutations = [tuple(item.split(':')) for item in rcv.mutations.split(',')]
        mut_dict = defaultdict(list)
        interfaces = set([(chain, item) for item in rcv.interfaces.split(',')] if 'interfaces' in rcv else [])
        for c, mut in mutations:
            mut_dict[c].append(mut)

        valid_clusters = []
        try:
            cluster_result = cluster(filename, dict(mut_dict), sift_dict, length_dict, cl_dist=25, iterations=100)
        except:
            return json.dumps(None)
        for residues, diameter, pval in cluster_result:
            uniprot_residues = [(a, rev_sift_dict[a][b]) for a, b in residues]
            unique_pos = set(uniprot_residues)
            interface_in_cluster = unique_pos & interfaces
            if len(unique_pos) > 1 and len(uniprot_residues) >= 3 and pval < 0.1 and len(interface_in_cluster) >= 1:
                results = defaultdict(list)
                [results[c].append(v) for c, v in uniprot_residues]
                valid_clusters.append({'residues': results, 'pval': pval, 'n_res': len(uniprot_residues)})

        valid_clusters.sort(key=lambda x: x['pval'])
        return json.dumps(valid_clusters[0] if len(valid_clusters) > 0 else None)


class pair_clustering:

    def POST(self):
        rcv = web.input()
        filename = rcv.path
        chainA = rcv.chainA
        chainB = rcv.chainB
        length_dict = {chainA: len(rcv.lengthA), chainB: len(rcv.lengthB)}
        uniprot_resA = rcv.uniprot_resA.split(',')
        model_resA = rcv.model_resA.split(',')
        uniprot_resB = rcv.uniprot_resB.split(',')
        model_resB = rcv.model_resB.split(',')
        sift_dict = {chainA: dict(zip(uniprot_resA, model_resA)), chainB: dict(zip(uniprot_resB, model_resB))}
        rev_sift_dict = {chainA: dict(zip(model_resA, uniprot_resA)), chainB: dict(zip(model_resB, uniprot_resB))}
        mutations = [tuple(item.split(':')) for item in rcv.mutations.strip(',').split(',')]
        mut_dict = defaultdict(list)
        interfaces = set([(chainA, item) for item in rcv.interfacesA.split(',')] if 'interfaces' in rcv else []) | \
            set([(chainB, item) for item in rcv.interfacesB.split(',')] if 'interfaces' in rcv else [])

        for c, mut in mutations:
            mut_dict[c].append(mut)

        valid_clusters = []
        try:
            cluster_result = cluster(filename, dict(mut_dict), sift_dict, length_dict, cl_dist=1000, iterations=10000)
        except:
            return json.dumps(None)
        for residues, diameter, pval in cluster_result:
            uniprot_residues = [(a, rev_sift_dict[a][b]) for a, b in residues]
            unique_pos = set(uniprot_residues)
            interface_in_cluster = unique_pos & interfaces
            if len(unique_pos) > 1 and len(uniprot_residues) >= 3 and pval < 0.1 and len(interface_in_cluster) >= 1:
                results = defaultdict(list)
                [results[c].append(v) for c, v in uniprot_residues]
                valid_clusters.append({'residues': results, 'pval': pval, 'n_res': len(uniprot_residues)})

        valid_clusters.sort(key=lambda x: x['pval'])
        return json.dumps(valid_clusters[0] if len(valid_clusters) > 0 else None)

from glob import glob


class check_mutcode:

    def POST(self):
        rcv = web.input()
        mutcode = rcv.mutcode
        on_server = len(glob('/data/web-vhosts/marsh2/cgi-bin/LOR_calculation/{0}_*'.format(mutcode)))
        if on_server == 0:
            return 0
        db = web.database(dbn='mysql',
                          host="db",
                          user=DB_USER,
                          passwd=DB_PASS,
                          db=DB_NAME)
        results = db.select('disease_mutations', where='disease_source="{0}"'.format(mutcode)).list()
        db.ctx.db.close()
        if len(results) == 0:
            return 1

        return 2

if __name__ == "__main__":
    app = web.application(urls, globals())
    app.run()
