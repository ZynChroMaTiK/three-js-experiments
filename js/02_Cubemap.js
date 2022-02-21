/* eslint-disable prefer-destructuring */
/* eslint-disable import/extensions */

import {
  // File Loader
  Cache, FileLoader,
  // Renderer
  WebGLRenderer,
  // sceneName
  Scene, AmbientLight, DirectionalLight,
  SphereGeometry, MeshLambertMaterial, Mesh,
  CubeTextureLoader, CubeRefractionMapping,
  // Camera
  PerspectiveCamera,
  // Controls
  Vector2, Raycaster, MathUtils,
} from './three/three.module.js';

import { OrbitControls } from './controls/OrbitControls.js';

// ================================
//        V A R I A B L E S
// ================================

const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];

const pinpointMdl = new SphereGeometry(1);
const pinpointMat = new MeshLambertMaterial({ color: 0xffffff });
const pinpointHoverMat = new MeshLambertMaterial({ color: 0xffffff });
pinpointHoverMat.emissive.setHex(0xff0000);

let json; let textureCube;
let fov; let autoRotateTimeout;

let currentSceneName; let pinpoints; let po;
let intersects; let INTERSECTED;

// ================================
//   I N I T I A L I Z A T I O N
// ================================

// File loader to read cubemap JSONs
Cache.enabled = true;
const loader = new FileLoader();

// ================ RENDERER ================

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ================ sceneName ================

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

renderer.domElement.onmousemove = (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

renderer.domElement.onwheel = (event) => {
  fov = camera.fov + event.deltaY * 0.05;
  camera.fov = MathUtils.clamp(fov, 30, 90);
  camera.updateProjectionMatrix();
};

renderer.domElement.onclick = (event) => {
  if (INTERSECTED) console.log(`Object clicked: ${INTERSECTED.name}`);
};

// ==== Orbit Controls

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.enableDamping = true;
controls.autoRotate = true;
controls.screenSpacePanning = false;
controls.rotateSpeed *= -0.2;
controls.autoRotateSpeed = 1.0;
controls.dampingFactor = 0.5;
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

// ================================
//         F U N C T I O N S
// ================================

function loadCubemap(sceneName, viewName) {
  loader.load(
    `./cubemaps/${sceneName}.json`,
    (data) => {
      // Remove previous pinpoints if any
      if (pinpoints) { pinpoints.array.forEach((p) => sceneName.remove(p)); }
      // Parse JSON file
      json = JSON.parse(data);
      // Load Cubemap
      textureCube = new CubeTextureLoader().load(faceNames.map((i) => `./cubemaps/${sceneName}/${viewName}/${i}.jpg`));
      textureCube.mapping = CubeRefractionMapping;
      scene.background = textureCube;
      // Change light if different scene
      if (currentSceneName !== sceneName) {
        // Load Ambient Light
        lightAmb.color.setHex(json.lightAmb.hex);
        // Load Directional Light
        lightDir.color.setHex(json.lightDir.hex);
        lightDir.target.position.set(json.lightDir.x, json.lightDir.y, json.lightDir.z);
        lightDir.target.updateMatrixWorld();
      }
      // Load Pinpoints
      pinpoints = json[viewName].map((p) => {
        po = new Mesh(pinpointMdl, pinpointMat);
        po.name = p[0];
        po.position.set(p[1][0], p[1][1], p[1][2]);
        scene.add(po);
        return po;
      });
    },
    (xhr) => { console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`); },
    (err) => { console.error(`Failed to load cubemap: ${err}`); },
  );
}

function raycast() {
  raycaster.setFromCamera(pointer, camera);
  if (pinpoints) {
    intersects = raycaster.intersectObjects(pinpoints, false);

    if (intersects.length > 0) {
      // On Hover
      if (INTERSECTED !== intersects[0].object) {
        if (INTERSECTED) INTERSECTED.material = pinpointMat;

        INTERSECTED = intersects[0].object;
        document.body.style.cursor = 'pointer';
        INTERSECTED.material = pinpointHoverMat;
        console.log(`Object hovered: ${INTERSECTED.name}`);
      }
    } else {
      // Not on Hover
      if (INTERSECTED) INTERSECTED.material = pinpointMat;

      INTERSECTED = null;
      document.body.style.cursor = 'default';
    }
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

loadCubemap('SS_WaterTemple', 'center');

animate();
