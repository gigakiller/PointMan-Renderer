(function() {
    "use strict";
    /*global window,document,Float32Array,Uint16Array,mat4,vec3,snoise*/
    /*global getShaderSource,createWebGLContext,createProgram*/

    var NUM_WIDTH_PTS = 200;
    var NUM_HEIGHT_PTS = 200;

    var message = document.getElementById("message");
    var canvas = document.getElementById("canvas");
    var context = createWebGLContext(canvas, message);
    if (!context) {
        return;
    }

    ///////////////////////////////////////////////////////////////////////////

    context.viewport(0, 0, canvas.width, canvas.height);
    context.clearColor(1.0, 1.0, 1.0, 1.0);
    context.enable(context.DEPTH_TEST);

    var persp = mat4.create();
    mat4.perspective(45.0, 0.5, 0.1, 100.0, persp);

    var eye = [2.0, 1.0, 3.0];
    var center = [0.0, 0.0, 0.0];
    var up = [0.0, 0.0, 1.0];
    var view = mat4.create();
    mat4.lookAt(eye, center, up, view);

    var positionLocation = 0;
    var heightLocation = 1;
    var u_modelViewPerspectiveLocation;
    var u_timeLocation;
    var u_time = 0.0;

    (function initializeShader() {
        var program;
        var vs = getShaderSource(document.getElementById("vs"));
        var fs = getShaderSource(document.getElementById("fs"));

		var program = createProgram(context, vs, fs, message);
		context.bindAttribLocation(program, positionLocation, "position");
		u_modelViewPerspectiveLocation = context.getUniformLocation(program,"u_modelViewPerspective");
                u_timeLocation = context.getUniformLocation(program, "u_time");
                //u_color = context.getUniformLocation(program, "u_color");

        context.useProgram(program);
    })();

    var heights;
    var numberOfIndices;

    (function initializeGrid() {
        function uploadMesh(positions, heights, indices) {
            // Positions
            var positionsName = context.createBuffer();
            context.bindBuffer(context.ARRAY_BUFFER, positionsName);
            context.bufferData(context.ARRAY_BUFFER, new Float32Array(positions), context.STATIC_DRAW);
            context.vertexAttribPointer(positionLocation, 3, context.FLOAT, false, 0, 0);
            context.enableVertexAttribArray(positionLocation);

            // Indices
            var indicesName = context.createBuffer();
            context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indicesName);
            context.bufferData(context.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), context.STATIC_DRAW);
        
        }
        var width = 0.1
        var lowCorner = [-width,-width,-width]
        var highCorner = [width,width,width]
        // This works, now to make it more minimal 
        var positions = [
            // z-bottom
            lowCorner[0], lowCorner[1], lowCorner[2],
            lowCorner[0], highCorner[1], lowCorner[2],
            highCorner[0], highCorner[1], lowCorner[2],
            highCorner[0], lowCorner[1], lowCorner[2],
            // z-top
            lowCorner[0], lowCorner[1], highCorner[2],
            lowCorner[0], highCorner[1], highCorner[2],
            highCorner[0], highCorner[1], highCorner[2],
            highCorner[0], lowCorner[1], highCorner[2],
            // x-left
            lowCorner[0], lowCorner[1], lowCorner[2],
            lowCorner[0], lowCorner[1], highCorner[2],
            lowCorner[0], highCorner[1], highCorner[2],
            lowCorner[0], highCorner[1], lowCorner[2],
            // x-right
            highCorner[0], lowCorner[1], lowCorner[2],
            highCorner[0], lowCorner[1], highCorner[2],
            highCorner[0], highCorner[1], highCorner[2],
            highCorner[0], highCorner[1], lowCorner[2]
            ];
        var indices = [
            // z-bottom
            0,1,
            0,3,
            1,2,
            2,3,
            // z-top
            4,5,
            4,7,
            5,6,
            6,7,
            // x-left
            8,9,
            8,11,
            9,10,
            10,11,
            // x-right
            12,13,
            12,15,
            13,14,
            14,15
            ];
       
        /* 
        var positions = new Float32Array( 3*4 );
        var indices = new Uint16Array( 8 );
        */

        /*

        var WIDTH_DIVISIONS = NUM_WIDTH_PTS - 1;
        var HEIGHT_DIVISIONS = NUM_HEIGHT_PTS - 1;

        var numberOfPositions = NUM_WIDTH_PTS * NUM_HEIGHT_PTS;

        var positions = new Float32Array(2 * numberOfPositions);
        var indices = new Uint16Array(2 * ((NUM_HEIGHT_PTS * (NUM_WIDTH_PTS - 1)) + (NUM_WIDTH_PTS * (NUM_HEIGHT_PTS - 1))));

        var positionsIndex = 0;
        var indicesIndex = 0;
        var length;

        for (var j = 0; j < NUM_WIDTH_PTS; ++j)
        {
            positions[positionsIndex++] = j /(NUM_WIDTH_PTS - 1);
            positions[positionsIndex++] = 0.0;

            if (j>=1)
            {
                length = positionsIndex / 2;
                indices[indicesIndex++] = length - 2;
                indices[indicesIndex++] = length - 1;
            }
        }

        for (var i = 0; i < HEIGHT_DIVISIONS; ++i)
        {
             var v = (i + 1) / (NUM_HEIGHT_PTS - 1);
             positions[positionsIndex++] = 0.0;
             positions[positionsIndex++] = v;

             length = (positionsIndex / 2);
             indices[indicesIndex++] = length - 1;
             indices[indicesIndex++] = length - 1 - NUM_WIDTH_PTS;

             for (var k = 0; k < WIDTH_DIVISIONS; ++k)
             {
                 positions[positionsIndex++] = (k + 1) / (NUM_WIDTH_PTS - 1);
                 positions[positionsIndex++] = v;

                 length = positionsIndex / 2;
                 var new_pt = length - 1;
                 indices[indicesIndex++] = new_pt - 1;  // Previous side
                 indices[indicesIndex++] = new_pt;

                 indices[indicesIndex++] = new_pt - NUM_WIDTH_PTS;  // Previous bottom
                 indices[indicesIndex++] = new_pt;
             }
        }
        */

        uploadMesh(positions, heights, indices);
        numberOfIndices = indices.length;
    })();

    (function animate(){
        ///////////////////////////////////////////////////////////////////////////
        // Update

        var model = mat4.create();
        mat4.identity(model);
        mat4.translate(model, [-0.5, -0.5, 0.0]);
        var mv = mat4.create();
        mat4.multiply(view, model, mv);
        var mvp = mat4.create();
        mat4.multiply(persp, mv, mvp);

        u_time += 0.01;

        ///////////////////////////////////////////////////////////////////////////
        // Render
        context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
          
        context.uniformMatrix4fv(u_modelViewPerspectiveLocation, false, mvp);
        context.uniform1f( u_timeLocation, u_time );
        context.drawElements(context.LINES, numberOfIndices, context.UNSIGNED_SHORT,0);

		window.requestAnimFrame(animate);
    })();

}());
