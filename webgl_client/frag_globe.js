(function() {
    "use strict";
    /*global window,document,Float32Array,Uint16Array,mat4,vec3,snoise*/
    /*global getShaderSource,createWebGLContext,createProgram*/

    function sphericalToCartesian( r, a, e ) {
        var x = r * Math.cos(e) * Math.cos(a);
        var y = r * Math.sin(e);
        var z = r * Math.cos(e) * Math.sin(a);

        return [x,y,z];
    }

    var message = document.getElementById("message");
    var canvas = document.getElementById("canvas");
    var gl = createWebGLContext(canvas, message);
    // Check for GL features
    if (!gl) {
        return;
    }

    ///////////////////////////////////////////////////////////////////////////

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    var persp = mat4.create();
    mat4.perspective(45.0, canvas.width/canvas.height, 0.1, 100.0, persp);

    var radius = 5.0;
    var azimuth = Math.PI;
    var elevation = 0.0001;


    var camera_yaw = 0;
    var camera_pitch = 0;
    
    // Initialize camera
    var cam = mat4.create();
    mat4.identity(cam);

    var eye = sphericalToCartesian(radius, azimuth, elevation);
    var center = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];
    var view = mat4.create();
    mat4.lookAt(eye, center, up, view);

    //position, normal, texCoord location for the earth
    var positionLocation;
    var colorLocation;
    var normalLocation;
    var texCoordLocation;

    var u_InvTransLocation;
    var u_ModelLocation;
    var u_ViewLocation;
    var u_PerspLocation;
    var u_timeLocation;

    var globe_program;

    (function initializeShader() {
        var vs = getShaderSource(document.getElementById("vs"));
        var fs = getShaderSource(document.getElementById("fs"));

        globe_program = createProgram(gl, vs, fs, message);
        positionLocation = gl.getAttribLocation(globe_program, "Position");
        colorLocation = gl.getAttribLocation(globe_program, "Color");
        normalLocation = gl.getAttribLocation(globe_program, "Normal");
        u_ModelLocation = gl.getUniformLocation(globe_program,"u_Model");
        u_ViewLocation = gl.getUniformLocation(globe_program,"u_View");
        u_PerspLocation = gl.getUniformLocation(globe_program,"u_Persp");
        u_InvTransLocation = gl.getUniformLocation(globe_program,"u_InvTrans");

        gl.useProgram(globe_program);
    })();

    var numberOfPoints;
    var positions;
    var colors;
    function loadPointCloud() { 
      //$.getJSON("data/test.json", function( pointCloud ) {
      $.getJSON("data/chappes.json", function( pointCloud ) {
	  //console.log( pointCloud );
	  numberOfPoints = pointCloud.positions.length;
	  // positions = new Float32Array(3 * numberOfPoints);
	  //var numberOfPoints = pointCloud.positions.length;
	  var pointsIndex = 0;
	  positions = new Float32Array(3 * numberOfPoints);
	  colors = new Float32Array(3 * numberOfPoints);
	  //console.log( pointCloud.positions.length );
	  for ( var i=0; i<numberOfPoints; i++ ) {
	    //console.log( pointCloud.positions[i] );
	    positions[pointsIndex] = pointCloud.positions[i][0];
	    colors[pointsIndex] = pointCloud.colors[i][0]/255.0;
            pointsIndex++;
	    positions[pointsIndex] = pointCloud.positions[i][1];
	    colors[pointsIndex] = pointCloud.colors[i][1]/255.0;
            pointsIndex++;
	    positions[pointsIndex] = pointCloud.positions[i][2];
	    colors[pointsIndex] = pointCloud.colors[i][2]/255.0;
            pointsIndex++;
	  }
	  //console.log( positions );
	  //console.log( colors );
          // Set up Points
          // Positions
          var positionsName = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
          gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
          gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(positionLocation);
          // Colors
          var colorsName = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, colorsName);
          gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
          gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(colorLocation);
          // end draw points

          animate();

      })
    }

    var time = 0;
    var mouseLeftDown = false;
    var mouseRightDown = false;
    var lastMouseX = null;
    var lastMouseY = null;

    function handleMouseDown(event) {
        if( event.button == 2 ) {
            mouseLeftDown = false;
            mouseRightDown = true;
        }
        else {
            mouseLeftDown = true;
            mouseRightDown = false;
        }
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }

    function handleMouseUp(event) {
        mouseLeftDown = false;
        mouseRightDown = false;
    }

    function handleMouseMove(event) {
        if (!(mouseLeftDown || mouseRightDown)) {
            return;
        }
        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;
        
        camera_yaw = camera_yaw - 0.01*deltaX;
        camera_pitch = camera_pitch - 0.01*deltaY;
        mat4.identity(cam);
        
        
        if( mouseLeftDown )
        {
            mat4.rotate( cam, camera_yaw, [0,1,0] );
            //mat4.rotate( cam, -0.01*deltaX, [0,1,0] );
            //mat4.rotate( cam, -0.01*deltaY, [1,0,0] );
        }
        else
        {
            radius += 0.01 * deltaY;
            radius = Math.min(Math.max(radius, 2.0), 10.0);
        }
        /*
        eye = sphericalToCartesian(radius, azimuth, elevation);
        view = mat4.create();
        mat4.lookAt(eye, center, up, view);
        */
        //console.log(cam);
        view = mat4.create();
        mat4.inverse( cam, view );

        lastMouseX = newX;
        lastMouseY = newY;
    }

    canvas.onmousedown = handleMouseDown;
    canvas.oncontextmenu = function(ev) {return false;};
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    var prevTime = new Date().getTime();
    
    var elapsedTime = 5000;

    //initializeShader();

    loadPointCloud();

    function animate(){
        var currTime = new Date().getTime();
        var dt = currTime - prevTime;
        elapsedTime += dt;
        prevTime = currTime;
        
        ///////////////////////////////////////////////////////////////////////////
        // Update

        gl.useProgram(globe_program);
        var model = mat4.create();
        mat4.identity(model);
        var mv = mat4.create();
        mat4.multiply(view, model, mv);

        var invTrans = mat4.create();
        mat4.inverse(mv, invTrans);
        mat4.transpose(invTrans);

        ///////////////////////////////////////////////////////////////////////////
        // Render

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(u_ModelLocation, false, model);
        gl.uniformMatrix4fv(u_ViewLocation, false, view);
        gl.uniformMatrix4fv(u_PerspLocation, false, persp);
        gl.uniformMatrix4fv(u_InvTransLocation, false, invTrans);

        gl.drawArrays( gl.POINTS, 0, numberOfPoints);
    
        time += 0.001;
	window.requestAnimFrame(animate);
    };
}());
