import {
  Scene,
  PerspectiveCamera,
  CubeTextureLoader, CubeRefractionMapping,
  WebGLRenderer,
  MathUtils
} from "./three/three.module.js";

import { OrbitControls } from './controls/OrbitControls.js';

let camera, controls, scene, renderer, autoRotateTimeout;

init();
animate();

function init() {

  const r = '../cubemaps/bensi/bensi';

  const urls = [
    r + '2.jpg', r + '2.jpg', r + '1.jpg', r + '1.jpg', r + '3.jpg', r + '3.jpg'
  ];

  const textureCube = new CubeTextureLoader().load(urls);
  textureCube.mapping = CubeRefractionMapping;

  scene = new Scene();
  scene.background = textureCube;

  camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.x = 1;

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // controls

  controls = new OrbitControls(camera, renderer.domElement);
  controls.listenToKeyEvents(window); // optional

  //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.rotateSpeed *= -0.5;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 8.0;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;

  controls.minDistance = 100;
  controls.maxDistance = 500;

  // controls.maxPolarAngle = Math.PI / 2;

  // stop autorotate after the first interaction
  controls.addEventListener('start', function () {
    clearTimeout(autoRotateTimeout);
    controls.autoRotate = false;
  });

  // restart autorotate after the last interaction & an idle time has passed
  controls.addEventListener('end', function () {
    autoRotateTimeout = setTimeout(function () {
      controls.autoRotate = true;
    }, 2000);
  });

  document.addEventListener('wheel', onDocumentMouseWheel);

  window.addEventListener('resize', onWindowResize);

}

function onDocumentMouseWheel(event) {

  const fov = camera.fov + event.deltaY * 0.05;

  camera.fov = MathUtils.clamp(fov, 30, 90);

  camera.updateProjectionMatrix();

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {
  requestAnimationFrame(animate);
  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
  render();
}

function render() {
  renderer.render(scene, camera);
}
