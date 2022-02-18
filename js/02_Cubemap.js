var progress = document.createElement('div');
var progressBar = document.createElement('div');
progress.appendChild(progressBar);
document.body.appendChild(progress);

import {
  LoadingManager,
  Scene,
  AmbientLight, DirectionalLight,
  PerspectiveCamera,
  CubeTextureLoader, CubeRefractionMapping,
  WebGLRenderer,
  MathUtils,
  Vector2, Raycaster,
  Mesh, BoxGeometry, SphereGeometry, MeshLambertMaterial
} from "./three/three.module.js";

import { OrbitControls } from './controls/OrbitControls.js';

const manager = new LoadingManager();
manager.onProgress = function (item, loaded, total) {
  progressBar.style.width = (loaded / total * 100) + '%';
};

let camera, controls, scene, renderer, autoRotateTimeout, raycaster, INTERSECTED;
const pointer = new Vector2();

// Pinpoints
const pin_mdl = new BoxGeometry(2, 2, 2);
const pin_mat = new MeshLambertMaterial({ color: 0xffffff });
let pin_hover_mat = new MeshLambertMaterial({ color: 0xffffff });
pin_hover_mat.emissive.setHex(0xff0000);

const ref_mdl = new SphereGeometry(1);
const refs = [
  new Mesh(ref_mdl, pin_mat),
  new Mesh(ref_mdl, pin_mat),
  new Mesh(ref_mdl, pin_mat),
  new Mesh(ref_mdl, pin_mat)
]

init();
animate();

function init() {

  const r = '../cubemaps/SS_WaterTemple/center/';

  const urls = [
    r + 'right.jpg', r + 'left.jpg',
    r + 'top.jpg', r + 'bottom.jpg',
    r + 'front.jpg', r + 'back.jpg'
  ];

  const textureCube = new CubeTextureLoader().load(urls);
  textureCube.mapping = CubeRefractionMapping;

  scene = new Scene();
  scene.background = textureCube;

  camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.x = 0.001;

  // Ambient Light
  const light_amb = new AmbientLight(0x38464a);
  scene.add(light_amb);
  // Directional Light
  const light_dir = new DirectionalLight(0x7f7f7f);
  scene.add(light_dir);
  light_dir.target.position.set(4, -3, -3);
  light_dir.target.updateMatrixWorld();


  // Pinpoints
  const pinpoint = new Mesh(pin_mdl, pin_mat);
  pinpoint.position.set(10, -2, 0);
  scene.add(pinpoint);

  refs[0].position.set(7, -3, 7)
  refs[1].position.set(-7, -3, 7)
  refs[2].position.set(7, -3, -7)
  refs[3].position.set(-7, -3, -7)

  refs.forEach(ref => scene.add(ref));

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Pinpoints interaction

  raycaster = new Raycaster();
  camera.updateMatrixWorld();

  // Controls

  controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.rotateSpeed *= -0.2;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;

  controls.minDistance = 0.001;

  // stop autorotate after the first interaction
  controls.addEventListener('start', function () {
    clearTimeout(autoRotateTimeout);
    controls.autoRotate = false;
  });

  // restart autorotate after the last interaction & an idle time has passed
  controls.addEventListener('end', function () {
    autoRotateTimeout = setTimeout(function () {
      controls.autoRotate = true;
    }, 8000);
  });

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('wheel', onDocumentMouseWheel);

}

// Event Functions

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function onDocumentMouseWheel(event) {
  const fov = camera.fov + event.deltaY * 0.05;
  camera.fov = MathUtils.clamp(fov, 30, 90);
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
  render();
}

function render() {

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(refs, false);

  if (intersects.length > 0) {
    // Hover on inpoint
    if (INTERSECTED != intersects[0].object) {

      if (INTERSECTED) INTERSECTED.material = pin_mat;

      INTERSECTED = intersects[0].object;
      document.body.style.cursor = 'pointer';
      INTERSECTED.material = pin_hover_mat;
    }
  } else {
    if (INTERSECTED) INTERSECTED.material = pin_mat;

    INTERSECTED = null;
    document.body.style.cursor = 'default';
  }

  renderer.render(scene, camera);
}
