/* eslint-disable prefer-destructuring */
/* eslint-disable import/extensions */

import {
  // File Loader
  Cache, FileLoader,
  // Renderer
  WebGLRenderer,
  // scene
  Scene, AmbientLight, DirectionalLight,
  Sprite, SpriteMaterial,
  CubeTextureLoader, CubeRefractionMapping,
  // Camera
  PerspectiveCamera,
  // Controls
  Vector2, Raycaster, MathUtils, TextureLoader,
} from './three/three.module.js';

import { OrbitControls } from './controls/OrbitControls.js';

// ================================
//        V A R I A B L E S
// ================================

const arrowMat = new SpriteMaterial({
  map: new TextureLoader().load('./img/arrow.png'),
  opacity: 0.5,
  transparent: true,
});

const arrowSelMat = new SpriteMaterial({
  map: new TextureLoader().load('./img/arrowSel.png'),
  opacity: 0.5,
  transparent: true,
});

let faceNames;

let json; let textureCube;
let fov; let autoRotateTimeout;

let currentSceneName; let arrows; let po;
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

renderer.domElement.onmousemove = (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

renderer.domElement.onwheel = (event) => {
  fov = camera.fov + event.deltaY * 0.05;
  camera.fov = MathUtils.clamp(fov, 30, 90);
  camera.updateProjectionMatrix();
};

renderer.domElement.onclick = () => {
  // Raycast on touch for touchscreen
  raycast();
  if (INTERSECTED) {
    console.log(`'${INTERSECTED.name}' Selected`);
    loadCubemap(currentSceneName, INTERSECTED.name);
  }
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

function raycast() {
  raycaster.setFromCamera(pointer, camera);
  if (arrows) {
    intersects = raycaster.intersectObjects(arrows, false);

    if (intersects.length > 0) {
      // On Hover
      if (INTERSECTED !== intersects[0].object) {
        if (INTERSECTED) INTERSECTED.material = arrowMat;

        INTERSECTED = intersects[0].object;
        document.body.style.cursor = 'pointer';
        INTERSECTED.material = arrowSelMat;
        console.log(`${INTERSECTED.name}`);
      }
    } else {
      // Not on Hover
      if (INTERSECTED) INTERSECTED.material = arrowMat;

      INTERSECTED = null;
      document.body.style.cursor = 'default';
    }
  }
}

// Animate for Desktop - mouse hover
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  raycast();
  renderer.render(scene, camera);
}

// Animate for Touch - no mouse hover
function animateTouch() {
  requestAnimationFrame(animateTouch);
  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});

async function loadCubemap(sceneName, viewName) {
  console.log('Loading');
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
      textureCube = new CubeTextureLoader().load(faceNames.map((i) => `./cubemaps/${sceneName}/${viewName}/${i}.jpg`));
      textureCube.mapping = CubeRefractionMapping;
      scene.background = textureCube;
      // Load arrows if any
      if (json[viewName]) {
        arrows = json[viewName].map((p) => {
          po = new Sprite(arrowMat);
          po.name = p[0];
          po.position.set(p[1][0], p[1][1], p[1][2]);
          scene.add(po);
          return po;
        });
      }
      // Save current scene name
      currentSceneName = sceneName;
      console.log('Loaded');
    },
    // (xhr) => { console.log(`${(xhr.loaded / xhr.total) * 100}%`); },
    // (err) => { console.error(`Failed to load cubemap: ${err}`); },
  );
}

// ================================
//           M  A  I  N
// ================================

if ('ontouchstart' in window) animateTouch(); else animate();
