#read in an .octopus file (output from the C++ octree builder)
#parse the input
#return a dictionary of OctreeNode objects, indexed by the the bfsIndex of the node.
def read_octree(filename):
    f = open(filename, 'r')
    for line in f:
        tokens = line.split()
        bfsIdx = int(tokens[0])
        #TODO: implement the rest
        
    return octree_dict
