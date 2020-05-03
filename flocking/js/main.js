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
const predatorTotalCount = 15;
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
  w /= 40; // figures 40
  h /= 40;
  // camera = new THREE.OrthographicCamera(-w, w, h, -h, 1, 1000);
  scene.add(camera);
  // scene.add(fishCamera);

  const b = vars.boundSize;
  camera.position.set(b * 2.2, b * 0.7, b * 3.3); // figures
  // camera.position.set(
  //   // figures in 2D
  //   20.932490428341506,
  //   18.265853946124924,
  //   419.9976011344496
  // );

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.rotateSpeed = 0.3;
  cameraControls.maxDistance = 400;
  cameraControls.minDistance = 1;
  cameraControls.enabled = !vars.boidCamera;
  // cameraControls.enabled = false;

  axesHelper = new THREE.AxesHelper(vars.boundSize * 0.8);
  axesHelper.visible = vars.showAxes;
  scene.add(axesHelper);

  addBoids();
  addBoidCamera();
  addPredators();
  addBounds();
  addNoiseCurve();

  // animate frame(s) for paused analysis (problem with loading rocks)
  // moveBoids(0.001);
  updateInfo();

  addObstacle(animate);

  // animate();
}

log = [];
faceArr = [];
timeArr = [];
function closestPointSpeedTest() {
  // const origin = new THREE.Vector3(5, 5, 5);
  // for (let i = 1; i < 30 + 1; i = i + 1) {
  //   const obstacle = new THREE.Mesh(
  //     new THREE.BoxGeometry(5, 5, 5, i * 20, 5, 5),
  //     new THREE.MeshNormalMaterial()
  //   );
  //   obstacle.position.set(20, 20, 20);
  //   obstacle.updateMatrixWorld();
  //   // scene.add(obstacle);
  //   const start = Date.now();
  //   const iters = 50;
  //   for (let j = 0; j < iters; j++) {
  //     findClosestPosition(origin, obstacle);
  //   }
  //   timeArr.push((Date.now() - start) / iters);
  //   // closest.sub(origin);
  //   faceArr.push(obstacle.geometry.faces.length + 0);
  //   // addArrow(closest, origin, closest.length(), 0xff0000);
  // }
  // log += "face count" + "," + "time" + "\n";
  // for (let i = 0; i < faceArr.length; i++) {
  //   log += faceArr[i] + "," + timeArr[i] + "\n";
  // }
  // console.log(log);
  // ------------------------------------
  // console.log(avoidanceField);
  // const start = Date.now();
  // const iters = 50000;
  // for (let j = 0; j < iters; j++) {
  //   const deltas = [];
  //   const fieldVectors = worldPosToFieldValues(
  //     [3, 3, 3],
  //     avoidanceField,
  //     deltas
  //   );
  //   value = triLerp(lerpVecs, ...deltas, ...fieldVectors);
  // }
  // console.log(Date.now() - start);
}

function animate() {
  let delta = clock.getDelta();

  if (delta && vars.play) {
    if (delta > 1) delta = 0; // when tab not open for some time
    cameraChase();
    moveBoids(delta);
    updateInfo();
    if (vars.drawNoiseFunction) animateNoise();
    // if (vars.movePlane && vars.enabled) updatePlaneTexture(delta);
    if (plane.changePos) updatePlaneTexture();
  }

  requestAnimationFrame(animate);
  render();
  stats.update();
}

function render() {
  cameraControls.update();

  if (vars.boidCamera) renderer.render(scene, fishCamera);
  else renderer.render(scene, camera);
}
