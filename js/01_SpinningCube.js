import {
  // Render Classes
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  // Cube Classes
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  // Line Classes
  Vector3,
  BufferGeometry,
  LineBasicMaterial,
  Line,
} from './three/three.module.js';

const scene = new Scene();

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Cube

const cubeGeo = new BoxGeometry();
const cubeMat = new MeshBasicMaterial({ color: 0xff0000 });
const cube = new Mesh(cubeGeo, cubeMat);
scene.add(cube);

// Lines

const points = [
  new Vector3(-1, 0, 0),
  new Vector3(0, 1, 0),
  new Vector3(1, 0, 0),
];

const lineGeo = new BufferGeometry().setFromPoints(points);
const lineMat = new LineBasicMaterial({ color: 0x0000ff });
const line = new Line(lineGeo, lineMat);
scene.add(line);

// Give animation to Cube

function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  cube.rotation.z += 0.01;

  renderer.render(scene, camera);
}

animate();

// Window Resize event

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
