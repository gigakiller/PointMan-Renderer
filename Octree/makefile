#Based on the Colby CS makefile tutorial:
#http://www.cs.colby.edu/maxwell/courses/tutorials/maketutor/

INCLUDE = -I/usr/include/

BINDIR=.
SRCDIR=.
ODIR=obj
CPPODIR=cppobj
IDIR=.

#We let the following be set by the environment/
#the makefile at the top of the recursion

COMPILERFLAGS = -Weverything -O3
CC = clang++
CFLAGS = $(COMPILERFLAGS) $(INCLUDE)
DEPS = $(wildcard $(IDIR)/*.h)
#LIBRARIES = -lX11 -lXi -lXmu -lglut -lGL -lGLU -lm 
LIBRARIES = -lX11 -lXi -lXmu -lglut -lGL -lGLU -lm -ljsoncpp
OBJ = $(patsubst $(SRCDIR)/%.c,$(ODIR)/%.o,$(wildcard $(SRCDIR)/*.c)) 
CPPOBJ = $(patsubst $(SRCDIR)/%.cpp,$(CPPODIR)/%.o,$(wildcard $(SRCDIR)/*.cpp)) 

#$(warning $(DEPS))
#make c and cpp files into .o files
#$^ means all arguments to the right of the :
#$@ means the argument to the left of the : 
#so, take all the .c and .cpp files, output as (ODIR)/%.o
$(ODIR)/%.o: $(SRCDIR)/%.c $(DEPS) 
	$(CC) -c -o $@ $< $(CFLAGS)

$(CPPODIR)/%.o: $(SRCDIR)/%.cpp $(DEPS) 
	$(CC) -c -o $@ $< $(CFLAGS)

#take all object files, glue together as .a
#$(BINDIR)/libnaray.a: $(OBJ) $(CPPOBJ)
	#ar -cvur $@ $^

$(BINDIR)/test_octree: $(OBJ) $(CPPOBJ) $(DEPS) 
		$(CC) -o $@ $^ $(CFLAGS) $(LIBDIR) $(LIBRARIES)	

.PHONY: clean

clean:
	rm -f $(ODIR)/*.o $(CPPODIR)/*.o $(BINDIR)/test_octree
