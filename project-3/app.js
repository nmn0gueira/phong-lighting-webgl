import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { lookAt, flatten, normalMatrix, vec3 } from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationX, multRotationY, multRotationZ, multScale, multTranslation, popMatrix, pushMatrix } from "../../libs/stack.js";

import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js'
import * as TORUS from '../../libs/objects/torus.js'
import * as BUNNY from '../../libs/objects/bunny.js'
import { perspective } from "../libs/MV.js";
import { GUI } from "../libs/dat.gui.module.js";




function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    const MAX_LIGHTS = 3;

    /**
     * Graphics User Interface
     */
    const gui = new GUI();

    /**
     * Options - GUI
     */
    let folderOptions = gui.addFolder("options");
    let options = { backfaceCulling: true, zBuffer: true };

    folderOptions.add(options, "backfaceCulling").name("backface culling");
    folderOptions.add(options, "zBuffer").name("depth test");


    /**
     * Camera - GUI
     */
    let folderCamera = gui.addFolder("camera");
    let camera = {
        fovy: 45,
        near: 0.1,
        far: 40,
        eye: vec3(0.0, 5.0, 10.0),
        at: vec3(0.0, 0.0, 0.0),
        up: vec3(0.0, 1.0, 0.0)
    };

    folderCamera.add(camera, "fovy", 1, 100, 1);   
    folderCamera.add(camera, "near", 0.1, 20, 0.1); 
    folderCamera.add(camera, "far", 0.1, 40, 0.1);


    let eyeFolder = folderCamera.addFolder("eye");

    eyeFolder.add(camera.eye, 0).name("x").step(0.1);
    eyeFolder.add(camera.eye, 1).name("y").step(0.1);
    eyeFolder.add(camera.eye, 2).name("z").step(0.1);


    let atFolder = folderCamera.addFolder("at");

    atFolder.add(camera.at, 0).name("x").step(0.1);
    atFolder.add(camera.at, 1).name("y").step(0.1);
    atFolder.add(camera.at, 2).name("z").step(0.1);


    let upFolder = folderCamera.addFolder("up");

    upFolder.add(camera.up, 0, -1, 1, 0.02).name("x");
    upFolder.add(camera.up, 1, -1, 1, 0.02).name("y");
    upFolder.add(camera.up, 2, -1, 1, 0.02).name("z");


    /**
     * Lights - GUI
     */
    let lightsFolder = gui.addFolder("lights");
    let lights = [];

    for (let i = 0; i < MAX_LIGHTS; i++) {
        lights.push({
            position: [0, 0, 10, 0],
            intensities: {
                ambient: [50, 50, 50],
                diffuse: [60, 60, 60],
                specular: [200, 200, 200]
            },
            axis: [0, 0, -1],
            aperture: 10,
            cutoff: 10
        });
        let newLightFolder = lightsFolder.addFolder("Light" + (i + 1));


        let positionFolder = newLightFolder.addFolder("position");

        positionFolder.add(lights[i].position, 0).name("x");
        positionFolder.add(lights[i].position, 1).name("y");
        positionFolder.add(lights[i].position, 2).name("z");
        positionFolder.add(lights[i].position, 3).name("w");


        let intensitiesFolder = newLightFolder.addFolder("intensities");

        intensitiesFolder.addColor(lights[i].intensities, "ambient").onChange(function (value) {
            lights[i].intensities.ambient[0] = value[0];
            lights[i].intensities.ambient[1] = value[1];
            lights[i].intensities.ambient[2] = value[2];
        });
        intensitiesFolder.addColor(lights[i].intensities, "diffuse").onChange(function (value) {
            lights[i].intensities.diffuse[0] = value[0];
            lights[i].intensities.diffuse[1] = value[1];
            lights[i].intensities.diffuse[2] = value[2];
        });
        intensitiesFolder.addColor(lights[i].intensities, "specular").onChange(function (value) {
            lights[i].intensities.specular[0] = value[0];
            lights[i].intensities.specular[1] = value[1];
            lights[i].intensities.specular[2] = value[2];
        });


        let axisFolder = newLightFolder.addFolder("axis");

        axisFolder.add(lights[i].axis, 0).name("x");
        axisFolder.add(lights[i].axis, 1).name("y");
        axisFolder.add(lights[i].axis, 2).name("z").step(1); // Since it z starts as negative gui has a defaulat step = 0.1


        newLightFolder.add(lights[i], "aperture");

        newLightFolder.add(lights[i], "cutoff");
    }


    /**
     * Material - GUI
     */
    let materialFolder = gui.addFolder("material");
    let bunnyMaterial = {
        ka: [150, 150, 150],
        kd: [150, 150, 150],
        ks: [200, 200, 200],
        shininess: 100
    }

    materialFolder.addColor(bunnyMaterial, "ka").onChange(function (value) {
        bunnyMaterial.ka[0] = value[0];
        bunnyMaterial.ka[1] = value[1];
        bunnyMaterial.ka[2] = value[2];
    });

    materialFolder.addColor(bunnyMaterial, "kd").onChange(function (value) {
        bunnyMaterial.kd[0] = value[0];
        bunnyMaterial.kd[1] = value[1];
        bunnyMaterial.kd[2] = value[2];
    });

    materialFolder.addColor(bunnyMaterial, "ks").onChange(function (value) {
        bunnyMaterial.ks[0] = value[0];
        bunnyMaterial.ks[1] = value[1];
        bunnyMaterial.ks[2] = value[2];
    });


    materialFolder.add(bunnyMaterial, "shininess");



    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);

    // Drawing mode (gl.LINES or gl.TRIANGLES)
    let mode = gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = perspective(camera.fovy, aspect, camera.near, camera.far);
    let mView = lookAt(camera.eye, camera.at, camera.up);

    /** Other materials */
    let groundMaterial = {
        ka: [150, 150, 75],
        kd: [125, 125, 125],
        ks: [0, 0, 0],
        shininess: 1.0
    };
    let redMaterial = {
        ka: [150, 75, 75],
        kd: [150, 75, 75],
        ks: [200, 200, 200],
        shininess: 100.0
    };
    let greenMaterial = {
        ka: [50, 150, 50],
        kd: [50, 150, 50],
        ks: [200, 200, 200],
        shininess: 10.0
    };
    let blueMaterial = {
        ka: [150, 150, 150],
        kd: [150, 150, 150],
        ks: [200, 200, 200],
        shininess: 100
    };

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    gl.clearColor(0.3, 0.3, 0.3, 1.0); // MUDAR ISTO PARA PRETO MAIS A FRENTE
    CUBE.init(gl);
    CYLINDER.init(gl);
    TORUS.init(gl);
    BUNNY.init(gl);

    window.requestAnimationFrame(render);


    function resize_canvas(event) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
        mProjection = perspective(camera.fovy, aspect, camera.near, camera.far);
    }

    function uploadObject(object) {
        const uKaOfMaterial = gl.getUniformLocation(program, "uMaterial.Ka");    
        const uKdOfMaterial = gl.getUniformLocation(program, "uMaterial.Kd");    
        const uKsOfMaterial = gl.getUniformLocation(program, "uMaterial.Ks"); 
           
        const uShininess = gl.getUniformLocation(program, "uMaterial.shininess");
        
        gl.uniform3fv(uKaOfMaterial, object.ka);
        gl.uniform3fv(uKdOfMaterial, object.kd);
        gl.uniform3fv(uKsOfMaterial, object.ks);

        gl.uniform1f(uShininess, object.shininess);
    }

    function uploadMatrix(name, m) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(m));
    }

    function uploadLighting() {
        const uNLights = gl.getUniformLocation(program, "uNLights"); // CHECK IF IT NEEDS TO BE IN THIS FUNCTION
        gl.uniform1i(uNLights, MAX_LIGHTS);
        
        for (let i = 0; i < MAX_LIGHTS; i++) {
            const uKaOfLight = gl.getUniformLocation(program, "uLights[" + i + "].ambient");
            const uKdOfLight = gl.getUniformLocation(program, "uLights[" + i + "].diffuse");
            const uKsOfLight = gl.getUniformLocation(program, "uLights[" + i + "].specular");

            const uPosition = gl.getUniformLocation(program, "uLights[" + i + "].position");
            const uAxis = gl.getUniformLocation(program, "uLights[" + i + "].axis");

            const uAperture = gl.getUniformLocation(program, "uLights[" + i + "].aperture");
            
            const uCutoff = gl.getUniformLocation(program, "uLights[" + i + "].cutoff");

            gl.uniform3fv(uKaOfLight, lights[i].intensities.ambient);
            gl.uniform3fv(uKdOfLight, lights[i].intensities.diffuse);
            gl.uniform3fv(uKsOfLight, lights[i].intensities.specular);

            gl.uniform4fv(uPosition, lights[i].position);
            gl.uniform3fv(uAxis, lights[i].axis);

            gl.uniform1f(uAperture, lights[i].aperture);
            gl.uniform1f(uCutoff, lights[i].cutoff);   
        }
    }

    function render() {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        // Send the mProjection matrix to the GLSL program
        mProjection = perspective(camera.fovy, aspect, camera.near, camera.far);
        uploadMatrix("mProjection", mProjection);
        // Send the mView matrix to the GLSL program
        mView = lookAt(camera.eye, camera.at, camera.up);
        uploadMatrix("mView", mView);
        // Load the ModelView matrix with the World to Camera (View) matrix
        loadMatrix(mView);
        // Send the lighting information to the GLSL program
        uploadLighting();

      
        // z = -20 to see the plane, use z = 0 to see up close
        multTranslation([0, -0.5, 0]);
        // plane
        pushMatrix();
            multScale([10, 0.5, 10]);

            let color = [0.76, 0.45, 0.04]; //brown
            //uploadColor(color);

            uploadObject(groundMaterial);
            uploadMatrix("mModelView", modelView());
            uploadMatrix("mNormals", normalMatrix(modelView()));
            CUBE.draw(gl, program, mode);
        popMatrix();

        // cube
        pushMatrix();
            // y = 1 = yCube/2
            multTranslation([-2.5, 1, -2.5]);   // left back quandrant
            multScale([2, 2, 2]);

            color = [0.85, 0.068, 0.068];  // red
            //uploadColor(color);

            uploadObject(redMaterial);
            uploadMatrix("mModelView", modelView());
            uploadMatrix("mNormals", normalMatrix(modelView()));
            CUBE.draw(gl, program, mode);
        popMatrix();

        // torus
        pushMatrix();
            // y = 0.5 to undo y translation at the start + 0.1 to lift up object
            multTranslation([-2.5, 0.6, 2.5]);    // left front quandrant
            multScale([2, 2, 2]);

            color = [0.01, 0.63, 0.11];      //green
            //uploadColor(color);

            uploadObject(greenMaterial);
            uploadMatrix("mModelView", modelView());
            uploadMatrix("mNormals", normalMatrix(modelView()));
            TORUS.draw(gl, program, mode);
        popMatrix();

        // cylinder
        pushMatrix();
            // y = 1 = yCylinder/2
            multTranslation([2.5, 1, -2.5]);   // right back quandrant
            multScale([2, 2, 2]);

            color = [0.27, 0.78, 0.35];   //green
            //uploadColor(color);

            uploadObject(blueMaterial);
            uploadMatrix("mModelView", modelView());
            uploadMatrix("mNormals", normalMatrix(modelView()));
            CYLINDER.draw(gl, program, mode);
        popMatrix();

        // bunny
        // y = 0.25 to move up a little
        multTranslation([2.5, 0.25, 2.5]);  // right front quandrant, 
        multScale([20, 20, 20]);            // bunny with the same values ​​as the others it gets too small

        color = [0.95, 0.70, 0.82];    //pink
        //uploadColor(color);

        uploadObject(bunnyMaterial);
        uploadMatrix("mModelView", modelView());
        uploadMatrix("mNormals", normalMatrix(modelView()));
        BUNNY.draw(gl, program, mode);


        /*
         * Enable or disable options
         */
        if (options.backfaceCulling) {
            //gl.isEnabled(gl.CULL_FACE) ? null : gl.enable(gl.CULL_FACE);
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK); // gl.BACK is the default value anyway
        }

        else {
            //!gl.isEnabled(gl.CULL_FACE) ? null : gl.disable(gl.CULL_FACE);
            gl.disable(gl.CULL_FACE);
        }

        if (options.zBuffer) {
            gl.enable(gl.DEPTH_TEST);
        }

        else {
            gl.disable(gl.DEPTH_TEST);
        }
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))