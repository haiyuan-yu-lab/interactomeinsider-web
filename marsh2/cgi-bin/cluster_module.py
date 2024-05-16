#!/usr/local/bin/python
from numpy import linalg, array
from random import randint
import os
from gzip import open as gzopen
from urllib2 import urlopen, HTTPError

# absolute path to local mirrored location of PDB data
PDB_DATA_DIR = '/data/web-vhosts/marshmallow/data/models_protein/gzipped_models/'


def is_binary_file(filename):
    ''' check if file is binary (adapted from http://stackoverflow.com/questions/898669/how-can-i-detect-if-a-file-is-binary-non-text-in-python) '''
    textchars = bytearray([7, 8, 9, 10, 12, 13, 27]) + bytearray(range(0x20, 0x100))
    return bool(open(filename, 'rb').read(1024).translate(None, textchars))


def open_pdb(structure):
    '''Return an opened PDB file handle from STDIN, file, local PDB cache, or web'''

    # STDIN
    if "<open file '<stdin>', mode 'r' at" in str(structure):
        pdb_filehandle = structure

    # AS UNCOMPRESSED PDB FILE
    elif os.path.exists(structure) and is_binary_file(structure) is False:  # file exists and is a text-based file
        pdb_filehandle = open(structure, 'r')

    # AS GZIPPED PDB FILE
    elif os.path.exists(structure) and is_binary_file(structure) is True:  # file exists and is likely a gzipped file
        try:
            testopen = gzopen(structure, 'r')
            testopen.readline()
            testopen.close()
            pdb_filehandle = gzopen(structure, 'r')
        except IOError:
            print 'Invalid structure file-type. Structure file must be a plain-text PDB file or a gzipped PDB file.'
            return

    # AS PDB FILE FROM LOCAL COPY OF THE PDB -OR- FROM THE WEB
    elif len(structure) == 4:

        pdb_storage_path = os.path.join(PDB_DATA_DIR, '%s/pdb%s.ent.gz' % (structure[1:3].lower(), structure.lower()))

        # local file
        if os.path.exists(pdb_storage_path):
            pdb_filehandle = gzopen(pdb_storage_path, 'r')
        # try the web
        else:
            try:
                pdb_filehandle = urlopen('http://www.rcsb.org/pdb/files/%s.pdb' % (structure.upper()))
            except HTTPError:
                print 'Invalid structure input: %s. Not found as local file, as PDB structure in %s, or on the web.' % (structure, PDB_DATA_DIR)
                return
    else:
        print 'Invalid structure input: %s. Not found as local file, and wrong number of characters for direct PDB reference.' % (structure)
        return

    return pdb_filehandle


def cluster_dist(cluster1, cluster2=[]):
    points = cluster1 + cluster2
    if len(points) == 1:
        return 0.0

    distances = []

    for p1 in range(len(points)):
        for p2 in range(p1 + 1, len(points)):
            distances.append(linalg.norm(array(points[p1]) - array(points[p2])))
    # print max(distances)
    return max(distances)


def cl_cluster(points, coords, cl_dist):
    '''point is a dictionary: keys are names of points, and values tuples of coords'''
    clusters = [[p] for p in points]  # initialize clusters as single points

    min_clust_sizes = {}  # num res -> min diameter for a cluster of that size
    while len(clusters) > 1:
        # print clusters
        distances = []
        for c1 in range(len(clusters)):
            for c2 in range(c1 + 1, len(clusters)):
                # print [coords[p] for p in clusters[c1]]
                distances.append((c1, c2, cluster_dist([coords[p] for p in clusters[c1]], [coords[p] for p in clusters[c2]])))

        distances.sort(key=lambda t: t[-1])

        merge_clust1, merge_clust2, separation = distances[0]
        # print merge_clust1
        if separation > cl_dist:
            break

        # merge closest clusters:
        # print distances[0]
        clusters[merge_clust1] += clusters[merge_clust2]

        # keep track of smallest cluster diameter associated with each cluster of size n residues
        cluster_size = len(clusters[merge_clust1])
        if cluster_size not in min_clust_sizes:
            min_clust_sizes[cluster_size] = separation

        # remove old cluster
        clusters.pop(merge_clust2)

    # print [(c, cluster_dist([coords[p] for p in c])) for c in clusters]
    return min_clust_sizes, [(c, cluster_dist([coords[p] for p in c])) for c in clusters]


def parse_pdb(pdb_file):
    '''return dictionary of alpha carbon locations'''
    CA_locs = {}

    for l in open_pdb(pdb_file):
        recordName = l[:6].strip()
        atomName = l[12:16].strip()

        if recordName != 'ATOM' or atomName != 'CA':
            continue

        if recordName == 'TER':
            break

        chainID = l[21]
        #resName = l[17:20].strip()
        resSeq = l[22:27].strip()  # resSeq 22:26, and 26:27 is the insertion character for special residues, i.e. 37A
        x = float(l[30:38].strip())
        y = float(l[38:46].strip())
        z = float(l[46:54].strip())

        CA_locs[(chainID, resSeq)] = (x, y, z)

    return CA_locs


def cluster(pdb_file, mutations, sifts_dict, prot_len, cl_dist=15, iterations=100):
    '''
    pdb_file -- unzipped, unaltered pdb file, even inlcuding extraneous chains if you want
    mutations -- uniprot mutations as lists of STRINGS, one list per chain that has muts (just leave out chains that have no muts)
        **repeat mutations should be listed multiple times
        {'A': ['12', '12', 12', '13'], 'B': ['6', '7', '8']}
    sifts_dict -- mapping from uniprot to pdb coords per chain (abbreviated in examples below for space)
        {'A': {'1':'1', '2':'2', '3':'2B', ..}, 'B': {'6':'7', '7':'8'..}...}
    prot len -- uniprot lengths of proteins for each chain (full uniprot length, regardless of chain coverage)
        {'A': 189, 'B': 1204}
    cl-dist -- maximum diameter of a cluster to be found in Angstroms (15 is a good number)
    iterations -- number of random rearrangements to perform of mutations on their given chains (to calc p-value)
        Will probably have to scale this by number of mutations input. for few mutations, 10,000 is a good number.
        For many muts, 100 is about the minimum. Will need to do some testing to get a formula to determine number of iterations based on number of muts.
        (depending on how long you're willing to wait)
    '''

    # 1. Find clusters in given set of mutations
    pdb_coords = parse_pdb(pdb_file)

    chains2mutcount = dict([(chain, len(mutations[chain])) for chain in mutations])

    mutations = [(chain, sifts_dict[chain][mut]) for chain in mutations for mut in mutations[chain] if mut in sifts_dict[chain]]
    aa_to_cluster = [aa for aa in mutations if aa in pdb_coords]

    _, observed_clusters = cl_cluster(aa_to_cluster, pdb_coords, cl_dist)
    observed_cluster_sizes = [len(c[0]) for c in observed_clusters]
    # set cl-cluster diameter to this when finding randomized clusters--after this threshold, any random cluster could never be more significant than a found cluster
    max_cluster_diameter = max([c[1] for c in observed_clusters])

    # 2. Randomly permute mutations and re-cluster, keeping track of the min diameter of random clusters of various sizes of amino acids
    min_dist_lists = dict([(c, []) for c in observed_cluster_sizes])  # keep track of cluster diameters for various cluster sizes (number of mutations in cluster)

    for i in range(iterations):

        # random rearrangment of the same number of mutations as given per chain
        random_mutations = []
        for chain in chains2mutcount:
            for i in range(chains2mutcount[chain]):
                random_aa = str(randint(1, prot_len[chain]))
                if random_aa in sifts_dict[chain]:
                    random_mutations.append((chain, sifts_dict[chain][random_aa]))

        random_aa_to_cluster = [aa for aa in random_mutations if aa in pdb_coords]

        rand_min_dist, _ = cl_cluster(random_aa_to_cluster, pdb_coords, max_cluster_diameter)
        for n in observed_cluster_sizes:
            if n in rand_min_dist:
                min_dist_lists[n].append(rand_min_dist[n])
            else:
                min_dist_lists[n].append(99999)  # no cluster found of size n--set diameter to be absolutely higher than diameter of actual found cluster

    for n in min_dist_lists:
        min_dist_lists[n].sort()

    # 3. Find diameter rank of actual clusters among random clusters of the same size

    return_list = []
    for c in observed_clusters:
        indices, diameter = c

        if len(indices) < 2:
            continue

        rank = 0.0
        for d in min_dist_lists[len(indices)]:
            if diameter <= d:
                break
            rank += 1

        # psuedocount if rank == 0:
        if rank == 0.0:
            rank = 1.0
            denominator = iterations + 1
        else:
            denominator = iterations

        return_list.append([indices, diameter, rank / denominator])
    return return_list
