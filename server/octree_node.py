#Python version of our octree_node class.
#NOTE: I should investigate binding Python to C++ 
#Loosely based on http://www.tutorialspoint.com/python/python_classes_objects.htm

class OctreeNode:    

    #bfsIdx is an INT thats the same as bfsIdx in our C++ implementation
    #highCorner/lowCorner/position are dictionaries to map 'x','y', and 'z' on to the appopriate coords (floats)
    #points is a list of dictionaries that contain 'x', y', 'z', 'r', 'g', 'b' that map on the appropriate
    #coords in 3-space / colorspace. 
    #these variables should be analagous to the C++ octreenode. This is a simplified implementation for
    #our Python server
    def __init__(self, bfsIdx, position, highCorner, lowCorner, points):
        self.bfsIdx = bfsIdx
        self.position = position
        self.highCorner = highCorner
        self.lowCorner = lowCorner
        self.points = points
