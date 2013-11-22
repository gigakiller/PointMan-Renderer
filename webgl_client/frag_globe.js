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

    var NUM_WIDTH_PTS = 64;
    var NUM_HEIGHT_PTS = 64;
    var iss_lat; 
    var iss_lon;

    var message = document.getElementById("message");
    var canvas = document.getElementById("canvas");
    var gl = createWebGLContext(canvas, message);
    // Check for GL features
    if (!gl) {
        return;
    }


    // Load in pointcloud data 
  
    /* 
    var request = new XMLHttpRequest();
    //request.open("GET", "data/chappes.json");
    request.open("GET", "data/test.json");
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
	handleLoadedPoints(request.responseText);
      }
    }
    request.send();

    function handleLoadedPoints( json_data ) { 
      var pointCloud = JSON.parse( json_data );
      console.log( pointCloud );
      //var positions = new Float32Array(3 * pointCloud.positions.length );
    } 
    */
    /*
    var numberOfPoints;
    $.getJSON("data/test.json", function( pointCloud ) {
 	console.log( pointCloud );
	var numberOfPoints = pointCloud.positions.length;
	var positionsIndex = 0;
        var positions = new Float32Array(3 * num_points );
	console.log( pointCloud.positions.length );
	for ( var i=0; i<numberOfPoints; i++ ) {
	  console.log( pointCloud.positions[i] );
	  positions[positionsIndex++] = pointCloud.positions[i][0];
	  positions[positionsIndex++] = pointCloud.positions[i][0];
	  positions[positionsIndex++] = pointCloud.positions[i][0];
	}
        console.log( positions );

	// Positions
	var positionsName = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionLocation);
    })
    */

    //$.getJSON('http://api.open-notify.org/iss-now.json?callback=?', function(data) {
            //var lat = data['iss_position']['latitude'];
            //var lon = data['iss_position']['longitude'];
            //console.log(lat);
            //console.log(lon);
        //});

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
    var u_CameraSpaceDirLightLocation;
    var u_DayDiffuseLocation;
    var u_NightLocation;
    var u_CloudLocation;
    var u_CloudTransLocation;
    var u_EarthSpecLocation;
    var u_BumpLocation;
    var u_timeLocation;

    var globe_program;

    (function initializeShader() {
        var vs = getShaderSource(document.getElementById("vs"));
        var fs = getShaderSource(document.getElementById("fs"));

        globe_program = createProgram(gl, vs, fs, message);
        positionLocation = gl.getAttribLocation(globe_program, "Position");
        colorLocation = gl.getAttribLocation(globe_program, "Color");
        normalLocation = gl.getAttribLocation(globe_program, "Normal");
        texCoordLocation = gl.getAttribLocation(globe_program, "Texcoord");
        u_ModelLocation = gl.getUniformLocation(globe_program,"u_Model");
        u_ViewLocation = gl.getUniformLocation(globe_program,"u_View");
        u_PerspLocation = gl.getUniformLocation(globe_program,"u_Persp");
        u_InvTransLocation = gl.getUniformLocation(globe_program,"u_InvTrans");
        u_DayDiffuseLocation = gl.getUniformLocation(globe_program,"u_DayDiffuse");
        u_NightLocation = gl.getUniformLocation(globe_program,"u_Night");
        u_CloudLocation = gl.getUniformLocation(globe_program,"u_Cloud");
        u_CloudTransLocation = gl.getUniformLocation(globe_program,"u_CloudTrans");
        u_EarthSpecLocation = gl.getUniformLocation(globe_program,"u_EarthSpec");
        u_BumpLocation = gl.getUniformLocation(globe_program,"u_Bump");
        u_timeLocation = gl.getUniformLocation(globe_program,"u_time");
        u_CameraSpaceDirLightLocation = gl.getUniformLocation(globe_program,"u_CameraSpaceDirLight");

        gl.useProgram(globe_program);
    })();

    var dayTex   = gl.createTexture();
    var logoTex   = gl.createTexture();
    var bumpTex  = gl.createTexture();
    var cloudTex = gl.createTexture();
    var transTex = gl.createTexture();
    var lightTex = gl.createTexture();
    var specTex  = gl.createTexture();

    function initLoadedTexture(texture){
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /* 
    var numberOfIndices;
    function initializeSphere() {
        function uploadMesh(positions, texCoords, indices) {
            // Positions
            var positionsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(positionLocation);
            
            // Normals
            var normalsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalsName);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(normalLocation);
            
            // TextureCoords
            var texCoordsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsName);
            gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
            gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(texCoordLocation);

            // Indices
            var indicesName = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        }

        var WIDTH_DIVISIONS = NUM_WIDTH_PTS - 1;
        var HEIGHT_DIVISIONS = NUM_HEIGHT_PTS - 1;

        var numberOfPositions = NUM_WIDTH_PTS * NUM_HEIGHT_PTS;

        var positions = new Float32Array(3 * numberOfPositions);
        var texCoords = new Float32Array(2 * numberOfPositions);
        var indices = new Uint16Array(6 * (WIDTH_DIVISIONS * HEIGHT_DIVISIONS));

        var positionsIndex = 0;
        var texCoordsIndex = 0;
        var indicesIndex = 0;
        var length;

        for( var j = 0; j < NUM_HEIGHT_PTS; ++j )
        {
            var inclination = Math.PI * (j / HEIGHT_DIVISIONS);
            for( var i = 0; i < NUM_WIDTH_PTS; ++i )
            {
                var azimuth = 2 * Math.PI * (i / WIDTH_DIVISIONS);
                positions[positionsIndex++] = Math.sin(inclination)*Math.cos(azimuth);
                positions[positionsIndex++] = Math.cos(inclination);
                positions[positionsIndex++] = Math.sin(inclination)*Math.sin(azimuth);
                texCoords[texCoordsIndex++] = i / WIDTH_DIVISIONS;
                texCoords[texCoordsIndex++] = j / HEIGHT_DIVISIONS;
            } 
        }

        for( var j = 0; j < HEIGHT_DIVISIONS; ++j )
        {
            var index = j*NUM_WIDTH_PTS;
            for( var i = 0; i < WIDTH_DIVISIONS; ++i )
            {
                    indices[indicesIndex++] = index + i;
                    indices[indicesIndex++] = index + i+1;
                    indices[indicesIndex++] = index + i+NUM_WIDTH_PTS;
                    indices[indicesIndex++] = index + i+NUM_WIDTH_PTS;
                    indices[indicesIndex++] = index + i+1;
                    indices[indicesIndex++] = index + i+NUM_WIDTH_PTS+1;
            }
        }

        uploadMesh(positions, texCoords, indices);
        numberOfIndices = indicesIndex;
    }
    */
     
    var numberOfPoints;
    var positions;
    var colors;
    function loadPointCloud() { 
      //$.getJSON("data/test.json", function( pointCloud ) {
      $.getJSON("data/chappes.json", function( pointCloud ) {
	  console.log( pointCloud );
	  numberOfPoints = pointCloud.positions.length;
	  // positions = new Float32Array(3 * numberOfPoints);
	  //var numberOfPoints = pointCloud.positions.length;
	  var pointsIndex = 0;
	  positions = new Float32Array(3 * numberOfPoints);
	  colors = new Float32Array(3 * numberOfPoints);
	  console.log( pointCloud.positions.length );
	  for ( var i=0; i<numberOfPoints; i++ ) {
	    console.log( pointCloud.positions[i] );
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
	  console.log( positions );
	  console.log( colors );

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
        
        if( mouseLeftDown )
        {
            azimuth += 0.01 * deltaX;
            elevation += 0.01 * deltaY;
            elevation = Math.min(Math.max(elevation, -Math.PI/2+0.001), Math.PI/2-0.001);
        }
        else
        {
            radius += 0.01 * deltaY;
            radius = Math.min(Math.max(radius, 2.0), 10.0);
        }
        eye = sphericalToCartesian(radius, azimuth, elevation);
        view = mat4.create();
        mat4.lookAt(eye, center, up, view);

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

        //gl.useProgram(globe_program);
        //initializeShader();
        gl.useProgram(globe_program);
        //initializeSphere();
        var model = mat4.create();
        mat4.identity(model);
        //mat4.translate(model, [0.0, 0.0, 1.0]);
        //mat4.rotate(model, 23.4/180*Math.PI, [0.0, 0.0, 1.0]);
        mat4.rotate(model, Math.PI, [1.0, 0.0, 0.0]);
        var mv = mat4.create();
        mat4.multiply(view, model, mv);

        var invTrans = mat4.create();
        mat4.inverse(mv, invTrans);
        mat4.transpose(invTrans);

        var myDate = new Date();
        var hour = myDate.getUTCHours();
        var minutes = myDate.getUTCMinutes() / 60.0;
        var seconds = myDate.getUTCSeconds() / 3600.0;
        hour = hour + minutes + seconds;
        //var hour = 16;
        //Math.PI is used to offset because we are using GMT time. 
        var lightAngle = ((12.0 - hour)/24.0) * 2.0 * Math.PI + -Math.PI/2.0;
        //var lightdir = vec3.create([-1.0, 0.0, 0.0]);
        var lightdir = vec3.create([Math.sin(lightAngle), 0.0, Math.cos(lightAngle)]);
        var lightdest = vec4.create();
        vec3.normalize(lightdir);
        mat4.multiplyVec4(view, [lightdir[0], lightdir[1], lightdir[2], 0.0], lightdest);
        lightdir = vec3.createFrom(lightdest[0],lightdest[1],lightdest[2]);
        vec3.normalize(lightdir);

        ///////////////////////////////////////////////////////////////////////////
        // Render
        //gl.useProgram(globe_program);
        //initializeSphere2();
	// Draw points
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

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(u_ModelLocation, false, model);
        gl.uniformMatrix4fv(u_ViewLocation, false, view);
        gl.uniformMatrix4fv(u_PerspLocation, false, persp);
        gl.uniformMatrix4fv(u_InvTransLocation, false, invTrans);

        gl.uniform3fv(u_CameraSpaceDirLightLocation, lightdir);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, dayTex);
        gl.uniform1i(u_DayDiffuseLocation, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, bumpTex);
        gl.uniform1i(u_BumpLocation, 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, cloudTex);
        gl.uniform1i(u_CloudLocation, 2);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, transTex);
        gl.uniform1i(u_CloudTransLocation, 3);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, lightTex);
        gl.uniform1i(u_NightLocation, 4);
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, specTex);
        gl.uniform1i(u_EarthSpecLocation, 5);
        gl.uniform1f(u_timeLocation, time);

        function draw_points(){
            //gl.drawElements(gl.TRIANGLES, numberOfIndices, gl.UNSIGNED_SHORT,0);
            //gl.drawElements(gl.POINTS, numberOfIndices, gl.UNSIGNED_SHORT,0);
	    gl.drawArrays( gl.POINTS, 0, numberOfPoints);
        }
        draw_points();

        var degN = iss_lat;
        var degE = iss_lon;
        var azimuth = -degE * (Math.PI / 180.0) + Math.PI;
        var inclination = -degN * (Math.PI / 180.0)  + Math.PI/2.0;
        var curr_rad = 1.5;
        var currX = curr_rad*Math.sin(inclination)*Math.cos(azimuth);
        var currY = curr_rad*Math.cos(inclination);
        var currZ = curr_rad*Math.sin(inclination)*Math.sin(azimuth);

	/*	
        function set_lat_lon( lat, lon ){
            iss_lat = lat;
            iss_lon = lon;
        }
       
        if(elapsedTime > 5000) { //poll once every 5 seconds
            $.getJSON('http://api.open-notify.org/iss-now.json?callback=?', function(data) {
                    var lat = data['iss_position']['latitude'];
                    var lon = data['iss_position']['longitude'];
                    //console.log(lat);
                    //console.log(lon);
                    set_lat_lon( lat, lon );
                });
            elapsedTime = 0;
            trail_array.push(currX);
            trail_array.push(currY);
            trail_array.push(currZ);
        }
	*/
	

        //the offsets PI and PI/2 on the azimuth and inclination are used to get my spherical
        //coordinates to match the standard (lat, lon) coordinate system.

        //var degN = -46.59929004639757; //degrees north
        //var degE = -64.76256280430778; //degrees east
        

        model = mat4.create();
        mat4.identity(model);
        //mat4.translate(model, [currX, currY, currZ]);

        mv = mat4.create();
        mat4.multiply(view, model, mv);

        invTrans = mat4.create();
        mat4.inverse(mv, invTrans);
        mat4.transpose(invTrans);

        lightdir = vec3.create([1.0, 0.0, 1.0]);
        lightdest = vec4.create();
        vec3.normalize(lightdir);
        mat4.multiplyVec4(view, [lightdir[0], lightdir[1], lightdir[2], 0.0], lightdest);
        lightdir = vec3.createFrom(lightdest[0],lightdest[1],lightdest[2]);
        vec3.normalize(lightdir);




        var modelForward = vec3.create([0.0, 0.0, 1.0]);
        var desiredDir = vec3.subtract(eye, center);
        vec3.normalize(desiredDir);
        var rotAngle = Math.acos(vec3.dot(modelForward, desiredDir));
        var rotAxis = vec3.cross(modelForward, desiredDir);


        model = mat4.create();
        mat4.identity(model);
        mat4.translate(model, [currX, currY, currZ]);
        mat4.rotate(model, rotAngle, rotAxis);
        //mat4.rotate(model, 23.4/180*Math.PI, [0.0, 0.0, 1.0]);
        //mat4.rotate(model, Math.PI, [1.0, 0.0, 0.0]);
        var newUp = vec4.create();
        mat4.multiplyVec4(model, [up[0], up[1], up[2], 0.0], newUp);
        var modelUp = vec3.create([newUp[0], newUp[1], newUp[2]]);
        var upRAngle = Math.acos(vec3.dot(modelUp, desiredDir));
        var upRotAxis = vec3.cross(modelForward, desiredDir);

        mv = mat4.create();
        mat4.multiply(view, model, mv);

        invTrans = mat4.create();
        mat4.inverse(mv, invTrans);
        mat4.transpose(invTrans);

        lightdir = vec3.create([1.0, 0.0, 1.0]);
        lightdest = vec4.create();
        vec3.normalize(lightdir);
        mat4.multiplyVec4(view, [lightdir[0], lightdir[1], lightdir[2], 0.0], lightdest);
        lightdir = vec3.createFrom(lightdest[0],lightdest[1],lightdest[2]);
        vec3.normalize(lightdir);

    
        time += 0.001;
	window.requestAnimFrame(animate);
    };

    var textureCount = 0;
        
    function initializeTexture(texture, src) {
        texture.image = new Image();
        texture.image.onload = function() {
            initLoadedTexture(texture);

            // Animate once textures load.
            if (++textureCount === 6) {
                animate();
            }
        }
        texture.image.src = src;
    }


    initializeTexture(dayTex, "earthmap1024.png");
    initializeTexture(logoTex, "iss_icon.png");
    initializeTexture(bumpTex, "earthbump1024.png");
    initializeTexture(cloudTex, "earthcloud1024.png");
    initializeTexture(transTex, "earthtrans1024.png");
    initializeTexture(lightTex, "earthlight1024.png");
    initializeTexture(specTex, "earthspec1024.png");
}());
