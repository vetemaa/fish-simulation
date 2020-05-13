var scene, renderer;
var camera, cameraControls, boidCamera, axesHelper, subject, bounds, noiseLines;

var clock, capturer, stats, movingBoidsPanel;

const boids = [];
const predators = [];
const boidTotalCount = 1000;
const predatorTotalCount = 15;
let deltaSum = 0;

// project setup
function init() {
  clock = new THREE.Clock();
  capturer = new CCapture({ framerate: 24, format: "webm" });
  stats = new Stats();
  movingBoidsPanel = stats.addPanel(new Stats.Panel("μ", "#ff8", "#212"));
  stats.showPanel(0);

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

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, w / h, 1, 1000);
  boidCamera = new THREE.PerspectiveCamera(90, w / h, 0.1, 1000);
  scene.add(camera);

  const b = vars.boundSize;
  camera.position.set(b * 1.45, b * 0.7, b * 3.3);

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.rotateSpeed = 0.3;
  cameraControls.maxDistance = 400;
  cameraControls.minDistance = 1;
  cameraControls.enabled = !vars.boidCamera;

  axesHelper = new THREE.AxesHelper(vars.boundSize * 0.8);
  axesHelper.visible = vars.showAxes;
  scene.add(axesHelper);

  initControls();
  addBoids();
  addBoidCamera();
  addPredators();
  addBounds();
  addNoiseCurve();
  initOctree();

  updateInfo();

  // passing animation function to addObstacles to wait for import
  addObstacles(animate);
}

function animate() {
  let delta = clock.getDelta();
  if (delta > 1) delta = 0; // when tab not open for some time

  if (delta && vars.play) {
    deltaSum += delta;
    document.getElementById("time").textContent = deltaSum.toFixed(1);

    moveBoids(delta);
    if (vars.drawNoiseFunction) drawNoise(delta);
  }

  updateInfo();
  if (plane.changePos) updatePlaneTexture();

  requestAnimationFrame(animate);
  render();
  stats.update();
}

function render() {
  cameraControls.update();

  if (vars.boidCamera) renderer.render(scene, boidCamera);
  else renderer.render(scene, camera);

  capturer.capture(renderer.domElement);
}
