#!/usr/bin/env python
from json import dump
'''
Read in .pts file, subsample and convert to json 
'''
input_fname = 'chappes'
fname = 'chappes_full'
fh = open(input_fname+'.pts', 'r')

# Skip first line
fh.readline()

positions = []
colors = []

cnt = 0
num_lines = 0
while True:
  if ( num_lines%10000 == 0 ):
    print 'num_lines: ', num_lines
    
  l = fh.readline()
  if l == '':
    break
  cnt += 1
  num_lines += 1
  if cnt < 1:
    continue
  # Bad hack
  try: 
    dat = map( float, l.strip('\n\r').split(' ') )
  except:
    cnt = 0
    continue
  
  positions.append( dat[0:3] )
  colors.append( dat[-3:] )
  cnt = 0

pointCloud = {'filename':fname, 'positions':positions, 'colors':colors }

fh_out = open(fname+'.json', 'w')
dump( pointCloud, fh_out )
fh_out.close()


