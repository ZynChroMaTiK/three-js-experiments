/* eslint-disable no-undef */
/* eslint-disable consistent-return */
/* eslint-disable no-plusplus */
/* eslint-disable max-len */
/* eslint-disable one-var-declaration-per-line */
/* eslint-disable one-var */
/* eslint-disable no-use-before-define */
/* eslint-disable default-case */
/* eslint-disable prefer-destructuring */
/* eslint-disable import/extensions */

import { VRButton } from './webxr/VRButton.js';
import { XRControllerModelFactory } from './webxr/XRControllerModelFactory.js';

// ================================
//        V A R I A B L E S
// ================================

const arrowMat = new THREE.SpriteMaterial({
  map: new THREE.TextureLoader().load('./img/arrow.png'),
  opacity: 0.5,
  transparent: true,
});

const arrowSelMat = new THREE.SpriteMaterial({
  map: new THREE.TextureLoader().load('./img/arrowSel.png'),
  opacity: 0.5,
  transparent: true,
});

let faceNames;

let json; let textureCube;

let loader;

let currentSceneName; let arrows; let po;
let intersects;

let container;
let camera, scene, raycaster, renderer;
let lightAmb, lightDir;

let controller, controllerGrip;
let INTERSECTED;
const tempMatrix = new THREE.Matrix4();

init();
animate();

function init() {
  // File loader to read cubemap JSONs
  Cache.enabled = true;
  loader = new THREE.FileLoader();

  // ================================

  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x505050);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.x = 0.001;
  scene.add(camera);

  lightAmb = new THREE.AmbientLight();
  scene.add(lightAmb);
  lightDir = new THREE.DirectionalLight();
  scene.add(lightDir);

  raycaster = new THREE.Raycaster();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  //

  function onSelectStart() {
    this.userData.isSelecting = true;
  }

  function onSelectEnd() {
    this.userData.isSelecting = false;
  }

  controller = renderer.xr.getController(0);
  controller.addEventListener('selectstart', onSelectStart);
  controller.addEventListener('selectend', onSelectEnd);
  controller.addEventListener('connected', (event) => {
    this.add(buildController(event.data));
  });
  controller.addEventListener('disconnected', () => {
    this.remove(this.children[0]);
  });
  scene.add(controller);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip = renderer.xr.getControllerGrip(0);
  controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
  scene.add(controllerGrip);

  window.addEventListener('resize', onWindowResize);

  //

  document.body.appendChild(VRButton.createButton(renderer));
}

function buildController(data) {
  let geometry, material;

  switch (data.targetRayMode) {
    case 'tracked-pointer':

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));

      material = new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending });

      return new THREE.Line(geometry, material);

    case 'gaze':

      geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, -1);
      material = new THREE.MeshBasicMaterial({ opacity: 0.5, transparent: true });
      return new THREE.Mesh(geometry, material);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  // find intersections

  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  if (arrows) {
    intersects = raycaster.intersectObjects(arrows, false);

    if (intersects.length > 0) {
      // On Hover
      if (INTERSECTED !== intersects[0].object) {
        if (INTERSECTED) INTERSECTED.material = arrowMat;

        INTERSECTED = intersects[0].object;
        INTERSECTED.material = arrowSelMat;
      }
    } else {
      // Not on Hover
      if (INTERSECTED) INTERSECTED.material = arrowMat;

      INTERSECTED = undefined;
    }
  }

  renderer.render(scene, camera);
}

async function loadCubemap(sceneName, viewName) {
  await loader.load(
    `./cubemaps/${sceneName}.json`,
    (data) => {
      // Remove previous arrows if any
      if (arrows) { arrows.forEach((p) => scene.remove(p)); }
      // Parse JSON file
      json = JSON.parse(data);
      // If New or Different Scene
      if (currentSceneName !== sceneName) {
        // Get Face Names
        faceNames = json.faceNames;
        // Load Ambient Light
        lightAmb.color.setHex(json.lightAmb.hex);
        // Load Directional Light
        lightDir.color.setHex(json.lightDir.hex);
        lightDir.target.position.set(json.lightDir.x, json.lightDir.y, json.lightDir.z);
        lightDir.target.updateMatrixWorld();
      }
      // Load Cubemap
      textureCube = new THREE.CubeTextureLoader().load(faceNames.map((i) => `./cubemaps/${sceneName}/${viewName}/${i}.jpg`));
      textureCube.mapping = THREE.CubeRefractionMapping;
      scene.background = textureCube;
      // Load arrows if any
      if (json[viewName]) {
        arrows = json[viewName].map((p) => {
          po = new THREE.Sprite(arrowMat);
          po.name = p[0];
          po.position.set(p[1][0], p[1][1], p[1][2]);
          scene.add(po);
          return po;
        });
      }
      // Save current scene name
      currentSceneName = sceneName;
    },
  );
}

export default loadCubemap;
