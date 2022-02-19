/* eslint-disable import/extensions */

import {
  // File Loader
  Cache, FileLoader,
  // Renderer
  WebGLRenderer,
  // Scene
  Scene, AmbientLight, DirectionalLight,
  BoxGeometry, SphereGeometry, MeshLambertMaterial, Mesh,
  CubeTextureLoader, CubeRefractionMapping,
  // Camera
  PerspectiveCamera,
  // Controls
  Vector2, Raycaster, MathUtils,
} from './three/three.module.js';

import { OrbitControls } from './controls/OrbitControls.js';

// ================================
//   I N I T I A L I Z A T I O N
// ================================

let json; let textureCube;
let fov; let autoRotateTimeout;
let intersects; let INTERSECTED;

// File loader to read cubemap JSONs
Cache.enabled = true;
const loader = new FileLoader();

// ================ RENDERER ================

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ================ SCENE ================

const scene = new Scene();
const lightAmb = new AmbientLight();
scene.add(lightAmb);
const lightDir = new DirectionalLight();
scene.add(lightDir);

// ================ CAMERA ================

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.x = 0.001;

// ================ CONTROLS ================

// ==== Pointer Controls

const pointer = new Vector2();

window.onresize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

document.onmousemove = (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

document.onwheel = (event) => {
  fov = camera.fov + event.deltaY * 0.05;
  camera.fov = MathUtils.clamp(fov, 30, 90);
  camera.updateProjectionMatrix();
};

// ==== Orbit Controls

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.rotateSpeed *= -0.2;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;
controls.dampingFactor = 0.5;
controls.screenSpacePanning = false;
controls.minDistance = 0.001;

// Stop autorotate after the first interaction
controls.addEventListener('start', () => {
  clearTimeout(autoRotateTimeout);
  controls.autoRotate = false;
});
// Restart autorotate after the last interaction & an idle time has passed
controls.addEventListener('end', () => {
  autoRotateTimeout = setTimeout(() => {
    controls.autoRotate = true;
  }, 8000);
});

// Raycaster

const raycaster = new Raycaster();
camera.updateMatrixWorld();

// ======== FUNCTIONS ================

function loadCubemap(jsonPath) {
  loader.load(
    jsonPath,
    (data) => {
      // Parsing JSON file
      json = JSON.parse(data);
      // Loading Cubemap
      textureCube = new CubeTextureLoader().load(json.cubemap);
      textureCube.mapping = CubeRefractionMapping;
      scene.background = textureCube;
      // Loading Ambient Light
      lightAmb.color.setHex(json.lightAmb.hex);
      // Loading Directional Light
      lightDir.color.setHex(json.lightDir.hex);
      lightDir.target.position.set(json.lightDir.x, json.lightDir.y, json.lightDir.z);
      lightDir.target.updateMatrixWorld();
    },
    (xhr) => { console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`); },
    (err) => { console.error(`Failed to load cubemap: ${err}`); },
  );
}

function raycast() {
  raycaster.setFromCamera(pointer, camera);
  intersects = raycaster.intersectObjects(refs, false);

  if (intersects.length > 0) {
    // On Hover
    if (INTERSECTED !== intersects[0].object) {
      if (INTERSECTED) INTERSECTED.material = pinMat;

      INTERSECTED = intersects[0].object;
      document.body.style.cursor = 'pointer';
      INTERSECTED.material = pinHoverMat;
      console.log(`Object hovered`);
    }
  } else {
    // Not on Hover
    if (INTERSECTED) INTERSECTED.material = pinMat;

    INTERSECTED = null;
    document.body.style.cursor = 'default';
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  raycast();
  renderer.render(scene, camera);
}

// ================================
//           M  A  I  N
// ================================

loadCubemap('cubemaps/SS_WaterTemple/center.json');

const pinMdl = new BoxGeometry(2, 2, 2);
const pinMat = new MeshLambertMaterial({ color: 0xffffff });
const pinHoverMat = new MeshLambertMaterial({ color: 0xffffff });
pinHoverMat.emissive.setHex(0xff0000);

const refMdl = new SphereGeometry(1);
const refs = [
  new Mesh(refMdl, pinMat),
  new Mesh(refMdl, pinMat),
  new Mesh(refMdl, pinMat),
  new Mesh(refMdl, pinMat),
];

const pinpoint = new Mesh(pinMdl, pinMat);
pinpoint.position.set(10, -2, 0);
scene.add(pinpoint);

refs[0].position.set(7, -3, 7);
refs[1].position.set(-7, -3, 7);
refs[2].position.set(7, -3, -7);
refs[3].position.set(-7, -3, -7);

refs.forEach((ref) => scene.add(ref));

animate();
