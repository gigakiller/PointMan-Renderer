#!/usr/bin/python

import sys

if len(sys.argv) != 2:
    print "Usage: strip_console_output file_name"
    sys.exit(1)

infile_name = sys.argv[1]
print "Opening:", str(infile_name)

in_f = open(infile_name, 'r')
outfile_name = 'stripped_' + infile_name
out_f = open(outfile_name, 'w')

for line in in_f:
        tokens = line.split()
        data = tokens[1:-1]
        for item in data:
            out_f.write(item)  # strip the first and last tokens
        out_f.write('\n')

in_f.close()
out_f.close()
