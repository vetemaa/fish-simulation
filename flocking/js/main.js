var scene, renderer;
var camera, cameraControls, fishCamera, axesHelper, bounds, subject;
var simplex = new SimplexNoise(1);
var stats = new Stats();
var clock = new THREE.Clock();

let prevBoundSize;
let fishCameraDist = 1.5;
let fishCameraFOV = 90;

const boids = [];
const predators = [];
const foods = [];
const boidTotalCount = 700;
const boidStartCount = 500;
const predatorTotalCount = 5;
const predatorStartCount = 0;
const foodTotalCount = 100;
const foodStartCount = 0;

function init() {
  let w = window.innerWidth;
  let h = window.innerHeight;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor("#fff");
  renderer.setSize(w, h);

  const container = document.getElementById("container");
  container.appendChild(renderer.domElement);
  container.appendChild(stats.domElement);
  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("fullscreenchange", onWindowResize, false);

  initControls();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, w / h, 1, 1000);
  fishCamera = new THREE.PerspectiveCamera(90, w / h, 0.1, 1000);
  w /= 60;
  h /= 60;
  // camera = new THREE.OrthographicCamera(-w, w, h, -h, 1, 1000);
  scene.add(camera);
  scene.add(fishCamera);

  const b = vars.boundSize;
  camera.position.set(b * 2, b * 0.6, b * 3);
  // camera.position.set(b * 3, b * 3, b * 300);
  // camera.position.set(b * 0.9, b * 0.3, b * 2);
  // camera.position.set(15.001, 30, 15);

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.rotateSpeed = 0.3;
  cameraControls.maxDistance = 400;
  cameraControls.minDistance = 1;
  cameraControls.enabled = !vars.chaseCamera;

  axesHelper = new THREE.AxesHelper(vars.boundSize * 0.8);
  axesHelper.visible = vars.showAxes;
  scene.add(axesHelper);

  addBoids();
  addPredators();
  addFood();
  addBounds();
  addNoiseCurve();

  addObstacle(animate);

  // animate frame(s) for paused analysis (problem with loading rocks)
  // moveBoids(1);
  // cameraChase(1);

  // animate();
}

function animate() {
  let delta = clock.getDelta();

  if (delta && vars.play) {
    if (delta > 1) delta = 0; // when tab not open
    cameraChase();
    moveBoids(delta);
    moveFood(delta);
    animateNoise();
    updateInfo();
    // updatePlaneTexture(delta);
  }

  requestAnimationFrame(animate);
  render();
  stats.update();
}

function render() {
  cameraControls.update();

  if (vars.chaseCamera) renderer.render(scene, fishCamera);
  else renderer.render(scene, camera);
}
