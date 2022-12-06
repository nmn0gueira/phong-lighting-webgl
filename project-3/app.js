import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten } from "../../libs/MV.js";
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
        eye: { x: 0, y: 0, z: 1 },
        at: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 }
    };

    folderCamera.add(camera, "fovy", 0, 100, 1);   // PODE SE ALTERAR OS VALORES
    folderCamera.add(camera, "near", 0.1, 1, 0.1); // PODE SE ALTERAR OS VALORES
    folderCamera.add(camera, "far", 20, 40, 1);    // PODE SE ALTERAR OS VALORES


    let eyeFolder = folderCamera.addFolder("eye");

    eyeFolder.add(camera.eye, "x", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    eyeFolder.add(camera.eye, "y", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    eyeFolder.add(camera.eye, "z", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES


    let atFolder = folderCamera.addFolder("at");

    atFolder.add(camera.at, "x", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    atFolder.add(camera.at, "y", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    atFolder.add(camera.at, "z", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES


    let upFolder = folderCamera.addFolder("up");

    upFolder.add(camera.up, "x", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    upFolder.add(camera.up, "y", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    upFolder.add(camera.up, "z", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES


    /**
     * Lights - GUI
     */
    let lightsFolder = gui.addFolder("lights");
    let lights = [];
    let paletteLighting = {         // Having a palette makes dat gui controller look better
        ambient: [50, 50, 50],
        diffuse: [60, 60, 60],
        specular: [200, 200, 200]
    };

    for (let i = 0; i < MAX_LIGHTS; i++) {
        lights.push({
            position: { x: 0, y: 0, z: 10, w: 0 },
            intensities: {
                ambient: { r: 50, g: 50, b: 50 },
                diffuse: { r: 60, g: 60, b: 60 },
                specular: { r: 200, g: 200, b: 200 }
            },
            axis: { x: 0, y: 0, z: -1 },
            aperture: 10,
            cutoff: 10
        });
        let newLightFolder = lightsFolder.addFolder("Light" + (i + 1));


        let positionFolder = newLightFolder.addFolder("position");

        positionFolder.add(lights[i].position, "x");
        positionFolder.add(lights[i].position, "y");
        positionFolder.add(lights[i].position, "z");
        positionFolder.add(lights[i].position, "w");


        let intensitiesFolder = newLightFolder.addFolder("intensities");

        intensitiesFolder.addColor(paletteLighting, "ambient").onChange(function (value) {
            lights[i].intensities.ambient.r = value[0] / 255;
            lights[i].intensities.ambient.g = value[1] / 255;
            lights[i].intensities.ambient.b = value[2] / 255;
        });
        intensitiesFolder.addColor(paletteLighting, "diffuse").onChange(function (value) {
            lights[i].intensities.diffuse.r = value[0] / 255;
            lights[i].intensities.diffuse.g = value[1] / 255;
            lights[i].intensities.diffuse.b = value[2] / 255;
        });
        intensitiesFolder.addColor(paletteLighting, "specular").onChange(function (value) {
            lights[i].intensities.specular.r = value[0] / 255;
            lights[i].intensities.specular.g = value[1] / 255;
            lights[i].intensities.specular.b = value[2] / 255;
        });


        let axisFolder = newLightFolder.addFolder("axis");

        axisFolder.add(lights[i].axis, "x");
        axisFolder.add(lights[i].axis, "y");
        axisFolder.add(lights[i].axis, "z");


        newLightFolder.add(lights[i], "aperture", 0, 100, 1);

        newLightFolder.add(lights[i], "cutoff", 0, 100, 1);
    }


    /**
     * Material - GUI
     */
    let materialFolder = gui.addFolder("material");
    let material = {
        ka: { r: 150, g: 150, b: 150 },
        kd: { r: 150, g: 150, b: 150 },
        ks: { r: 200, g: 200, b: 200 },
        shininess: 100
    }
    let paletteMaterial = {         // Having a palette makes dat gui controller look better
        ka: [150, 150, 150],
        kd: [150, 150, 150],
        ks: [200, 200, 200]
    };

    materialFolder.addColor(paletteMaterial, "ka").onChange(function (value) {
        material.ka.r = value[0]/255;
        material.ka.g = value[1]/255;
        material.ka.b = value[2]/255;
    });

    materialFolder.addColor(paletteMaterial, "kd").onChange(function (value) {
        material.kd.r = value[0]/255;
        material.kd.g = value[1]/255;
        material.kd.b = value[2]/255;
    });

    materialFolder.addColor(paletteMaterial, "ks").onChange(function (value) {
        material.ks.r = value[0]/255;
        material.ks.g = value[1]/255;
        material.ks.b = value[2]/255;
    });


    materialFolder.add(material, "shininess");



    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);

    // Drawing mode (gl.LINES or gl.TRIANGLES)
    let mode = gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = perspective(camera.fovy, aspect, camera.near, camera.far);
    let mView = lookAt([0, 0, 1], [0, 0, 0], [0, 1, 0]);
    let zoom = 1.0;

    /** Model parameters */
    let ag = 0;
    let rg = 0;
    let rb = 0;
    let rc = 0;

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function (event) {
        switch (event.key) {
            case '1':
                // Front view
                mView = lookAt([0, 0, 1], [0, 0, 0], [0, 1, 0]);
                break;
            case '2':
                // Top view
                mView = lookAt([0, 1, 0], [0, 0, 0], [0, 0, -1]);
                break;
            case '3':
                // Right view
                mView = lookAt([1, 0, 0], [0, 0, 0], [0, 1, 0]);
                break;
            case '4':
                mView = lookAt([2, 1, 1], [0, 0, 0], [0, 1, 0]);
                break;
            case '9':
                mode = gl.LINES;
                break;
            case '0':
                mode = gl.TRIANGLES;
                break;
            case 'p':
                ag = Math.min(0.050, ag + 0.005);
                break;
            case 'o':
                ag = Math.max(0, ag - 0.005);
                break;
            case 'q':
                rg += 1;
                break;
            case 'e':
                rg -= 1;
                break;
            case 'w':
                rc = Math.min(120, rc + 1);
                break;
            case 's':
                rc = Math.max(-120, rc - 1);
                break;
            case 'a':
                rb -= 1;
                break;
            case 'd':
                rb += 1;
                break;
            case '+':
                zoom /= 1.1;
                break;
            case '-':
                zoom *= 1.1;
                break;
        }
    }

    gl.clearColor(0.3, 0.3, 0.3, 1.0); // MUDAR ISTO PARA PRETO MAIS A FRENTE
    //gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    //gl.enable(gl.CULL_FACE);      
    //gl.cullFace(gl.BACK);   //initial value of cullFace is GL_BACK
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

    function uploadProjection() {
        uploadMatrix("mProjection", mProjection);
    }

    function uploadModelView() {
        uploadMatrix("mModelView", modelView());
    }

    function uploadMatrix(name, m) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(m));
    }

    function setColor(color) {
        const uColor = gl.getUniformLocation(program, "uColor");
        gl.uniform4fv(uColor, color);
    }

    function render() {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        // Send the mProjection matrix to the GLSL program
        mProjection = perspective(camera.fovy, aspect, camera.near, camera.far);
        uploadProjection();
        mView = lookAt([camera.eye.x, camera.eye.y, camera.eye.z], [camera.at.x, camera.at.y, camera.at.z], [camera.up.x, camera.up.y, camera.up.z]);
        // Load the ModelView matrix with the World to Camera (View) matrix
        loadMatrix(mView);


        pushMatrix();
            //z = -20 to see the plane, use z = 0 to see up close
            multTranslation([0, -0.5, -20]);
            //plano
            pushMatrix();
            multScale([10, 0.5, 10]);

            let color = [0.76, 0.45, 0.04, 1.0]; //brown
            setColor(color);

            uploadModelView();
            CUBE.draw(gl, program, mode);
        popMatrix();

        //cubo
        pushMatrix();
            // y = 1 = yCube/2
            multTranslation([-2.5, 1, -2.5]);   // left back quandrant
            multScale([2, 2, 2]);

            color = [0.85, 0.068, 0.068, 1.0];  // red
            setColor(color);

            uploadModelView();
            CUBE.draw(gl, program, mode);
        popMatrix();

        //torus/donut
        pushMatrix();
            // y = 0.5 to undo y translation at the start + 0.1 to lift up object
            multTranslation([-2.5, 0.6, 2.5]);    // left front quandrant
            multScale([2, 2, 2]);

            color = [0.01, 0.63, 0.11, 1.0];      //green
            setColor(color);

            uploadModelView();
            TORUS.draw(gl, program, mode);
        popMatrix();

        //cylinder
        pushMatrix();
            // y = 1 = yCylinder/2
            multTranslation([2.5, 1, -2.5]);   // right back quandrant
            multScale([2, 2, 2]);

            color = [0.27, 0.78, 0.35, 1.0];   //green
            setColor(color);

            uploadModelView();
            CYLINDER.draw(gl, program, mode);
        popMatrix();

        //bunny
        pushMatrix();
            // y = 0.25 to move up a little
            multTranslation([2.5, 0.25, 2.5]);  // right front quandrant, 
            multScale([20, 20, 20]);            // bunny with the same values ​​as the others it gets too small

            color = [0.95, 0.70, 0.82, 1.0];    //pink
            setColor(color);

            uploadModelView();
            BUNNY.draw(gl, program, mode);
        popMatrix();


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