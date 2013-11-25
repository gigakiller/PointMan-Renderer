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
    var cam_vel = 0.25;
    var cam = mat4.create();
    mat4.identity(cam);

    var eye = sphericalToCartesian(radius, azimuth, elevation);
    var center = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];
    var view = mat4.create();
    mat4.lookAt(eye, center, up, view);
    
    //centroid
    var centroid = vec3.create();
    centroid[0] = 0.0;
    centroid[1] = 0.0;
    centroid[2] = 0.0;


    // Drawing mode, toggle between squares and circles
    var drawMode = 0;

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
    var u_CentroidLocation;
	var u_drawMode;
    var globe_program;
        
    //toggle between drwaing round points (looks better, slower) and drawing square points
    //(looks worse, faster).
    var drawRoundPoints = true;

    (function initializeShader() {
        var vs = getShaderSource(document.getElementById("vs"));
        var fs; 
        if(drawRoundPoints){
            fs = getShaderSource(document.getElementById("fs"));
        }else{
            fs = getShaderSource(document.getElementById("square-fs"));
        }
            
        globe_program = createProgram(gl, vs, fs, message);


        // Optional binding ( mostly for performance on MAC and opengl-es devices
        gl.bindAttribLocation(globe_program, 0, "Position");
        gl.bindAttribLocation(globe_program, 1, "Color");
        gl.bindAttribLocation(globe_program, 2, "Normal");
        
        gl.linkProgram(globe_program);
        if (!gl.getProgramParameter(globe_program, gl.LINK_STATUS)) {
            alert(gl.getProgramInfoLog(globe_program));
            return;
        } 

        positionLocation = gl.getAttribLocation(globe_program, "Position");
        colorLocation = gl.getAttribLocation(globe_program, "Color");
        normalLocation = gl.getAttribLocation(globe_program, "Normal");
        u_ModelLocation = gl.getUniformLocation(globe_program,"u_Model");
        u_ViewLocation = gl.getUniformLocation(globe_program,"u_View");
        u_PerspLocation = gl.getUniformLocation(globe_program,"u_Persp");
        u_InvTransLocation = gl.getUniformLocation(globe_program,"u_InvTrans");
        u_CentroidLocation = gl.getUniformLocation(globe_program,"u_Centroid");
		u_drawMode= gl.getUniformLocation(globe_program,"u_drawMode");
        gl.useProgram(globe_program);
    })();

    var numberOfPoints;
    var positions;
    var colors;
    function loadPointCloud() { 
      //$.getJSON("data/chappes.json", function( pointCloud ) {

      // PointCloud Websocket
      //var ws = new WebSocket("ws://localhost:8888/pointcloud_ws");
      var ws = new WebSocket("ws://54.201.72.50:8888/pointcloud_ws");
      ws.onopen = function() {
       var req = {"pointcloud":"chappes_sml"};
       //var req = {"pointcloud":"chappes"};
       ws.send( JSON.stringify(req) );
      };
      
      ws.onmessage = function (evt) {
        var pointCloud = JSON.parse(evt.data);
        console.log( pointCloud );
        //pointCloud = JSON.parse( data );
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
            centroid[0] += pointCloud.positions[i][0];
          colors[pointsIndex] = pointCloud.colors[i][0]/255.0;
          pointsIndex++;
          positions[pointsIndex] = pointCloud.positions[i][1];
            centroid[1] += pointCloud.positions[i][1];
          colors[pointsIndex] = pointCloud.colors[i][1]/255.0;
          pointsIndex++;
          positions[pointsIndex] = pointCloud.positions[i][2];
            centroid[2] += pointCloud.positions[i][1];
          colors[pointsIndex] = pointCloud.colors[i][2]/255.0;
          pointsIndex++;
        }
        //centroid = (1.0/numberOfPoints) * centroid;
        centroid[0] = centroid[0]/numberOfPoints;
        centroid[1] = centroid[1]/numberOfPoints;
        centroid[2] = centroid[2]/numberOfPoints;
        gl.uniform3f(u_CentroidLocation, centroid[0], centroid[1], centroid[2]);

        //assuming the camera starts at the origin, the desired view direction is 
        //the coordinates of the centroid itself
        
        //I am assuming that we peer down the "+z" axis of camera space. We're going
        //to have to rotate the +z axis onto the desired view direction (i.e. the 
        //direction of the centroid).
        
        var plusZ = [0, 0, -1];
        var centroidDir = centroid;
        var centroidDir = vec3.normalize(centroid);//normalized vector pointing to centroid
        var desiredRotation = vec3.rotationTo(plusZ, centroidDir); 
        var startingRot3 = quat4.toMat3(desiredRotation);
        var startingRot4 = mat3.toMat4(startingRot3);
        mat4.multiply(cam, startingRot4); 

        //console.log("Centroid position:");
        //console.log(centroid[0]);
        //console.log(centroid[1]);
        //console.log(centroid[2]);
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
        
        // Kickoff animation cycle
        animate();
      }
    }

    var time = 0;


    var mouseLeftDown = false;
    var mouseRightDown = false;
    var lastMouseX = null;
    var lastMouseY = null;

    var currentKeys = {};
    // Handle Keyboard Events
    function handleKeyDown(event) {
      console.log( "keycode: " + event.keyCode + "\n" );
      currentKeys[event.keyCode] = true; 

      // For events that update once
      // 't' for toggling drawing mode
      if ( currentKeys[84] ) {
        if ( drawMode == 0 ) {
          drawMode = 1;
        } else {
          drawMode = 0;
        }
        console.log(drawMode);
      }
    }

    function handleKeyUp(event) {
      currentKeys[event.keyCode] = false;
    }

    function handleUserInput(event) {
        handleMovement();
    }
    
    function handleMovement(event) {
      
      // 'w'
      if ( currentKeys[87] ) {
        //console.log("moving forward\n");
        mat4.translate( cam, [0,0,-cam_vel] );
      }
      // 's'
      if ( currentKeys[83] ) {
        //console.log("moving backwards\n");
        mat4.translate( cam, [0,0,cam_vel] );
      }

      // 'a'
      if ( currentKeys[65] ) {
        mat4.translate( cam, [-cam_vel,0,0] );
      }
      // 'd'
      if ( currentKeys[68] ) {
        mat4.translate( cam, [cam_vel,0,0] );
      }
        //'q' OR 'e' 
        if( currentKeys[81] || currentKeys[69] ) {
           //roll camera 
        var camera_roll = 0;
        var roll_vel = 0.025;
        currentKeys[81] ? camera_roll = roll_vel : camera_roll = -roll_vel;
        //mat4.identity(cam);
        var identity = mat4.create();
        mat4.identity(identity);
         
        var roll_mat = mat4.create(); 
        mat4.rotate(identity, camera_roll, [0,0,1], roll_mat);
        mat4.multiply(cam, roll_mat); 
        }
      if ( currentKeys[82] ) {
        drawROundPoints = !drawRoundPoints; 
        initializeShader();
      }

    }

    // Handle Mouse Events
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
        
        camera_pitch = -0.01*deltaX;
        camera_yaw = -0.01*deltaY;
        var identity = mat4.create();
        mat4.identity(identity);

         
        if( mouseLeftDown )
        {
            //LOCAL yaw
            var yaw_mat = mat4.create(); 
            mat4.rotate(identity, camera_yaw, [1,0,0], yaw_mat);
            mat4.multiply(cam, yaw_mat); 

            //LOCAL pitch
            var pitch_mat = mat4.create(); 
            mat4.rotate(identity, camera_pitch, [0,1,0], pitch_mat);
            mat4.multiply(cam, pitch_mat); 
        }
        else
        {
            /*
            radius += 0.01 * deltaY;
            radius = Math.min(Math.max(radius, 2.0), 10.0);
            */
        }
        
        lastMouseX = newX;
        lastMouseY = newY;
    }

    canvas.onmousedown = handleMouseDown;
    canvas.oncontextmenu = function(ev) {return false;};
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;


    var prevTime = new Date().getTime();
    
    var elapsedTime = 5000;

    //initializeShader();

    loadPointCloud();

    function animate(){
        var currTime = new Date().getTime();
        var dt = currTime - prevTime;
        elapsedTime += dt;
        prevTime = currTime;

        // Handle user keyboard inputs
        handleUserInput();
        //handleMouseMove();
 
        // Invert camera pose to get view matrix
        view = mat4.create();
        mat4.inverse( cam, view );

        // Update Transforms
        gl.useProgram(globe_program);
        var model = mat4.create();
        mat4.identity(model);
        var mv = mat4.create();
        mat4.multiply(view, model, mv);

        var invTrans = mat4.create();
        mat4.inverse(mv, invTrans);
        mat4.transpose(invTrans);

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
