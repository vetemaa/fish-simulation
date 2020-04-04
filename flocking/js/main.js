var stats, scene, renderer, composer;
var camera, cameraControls, fishCamera;
var geom, mat, mesh, axesHelper, subject;
let fishCameraDist = 1.5,
  fishCameraFOV = 90;
var simplex = new SimplexNoise(1);
const backColor = "#111";
// const backColor = "#fff";

var ran;

var boids = [];
var predators = [];
var foods = [];
var boidTotalCount = 700;
var boidStartCount = 200;
var predatorTotalCount = 5;
var predatorStartCount = 0;
var foodTotalCount = 100;
var foodStartCount = 100;

function init() {
  let w = window.innerWidth;
  let h = window.innerHeight;

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setClearColor(backColor);
  renderer.setSize(w, h);
  document.getElementById("container").appendChild(renderer.domElement);
  stats = new Stats();
  document.body.appendChild(stats.domElement);
  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("fullscreenchange", onWindowResize, false);

  initControls();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, w / h, 1, 1000);
  fishCamera = new THREE.PerspectiveCamera(90, w / h, 0.1, 1000);
  w /= 120;
  h /= 120;
  // camera = new THREE.OrthographicCamera(w / -1, w / 1, h / 1, h / -1, 1, 1000);

  const b = vars.boundSize;
  camera.position.set(b * 3, b * 0.6, b * 2);
  // camera.position.set(15.001, 30, 15);

  scene.add(camera);
  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.rotateSpeed = 0.2;
  cameraControls.maxDistance = 400;
  cameraControls.minDistance = 1;
  cameraControls.enabled = !vars.chaseCamera;

  axesHelper = new THREE.AxesHelper(100);
  axesHelper.visible = vars.showAxes;
  scene.add(axesHelper);

  addBoids();
  addPredators();
  addFood();

  scene.add(fishCamera);

  addBounds();

  // animate frame(s) for paused analysis
  moveBoids(1);
  cameraChase(1);

  // for (let i = 0; i < 1100; i++) {
  //   // moveBoids(0.3);
  // }

  addNoiseCurve();
  animate();
}

let then = Date.now();
function animate(now) {
  let delta = now - then;
  // delta = 2; // 0.3

  // TODO: clock.getDelta()

  // console.log(delta);
  if (delta && vars.play) {
    cameraChase();
    moveBoids(delta);
    moveFood(delta);
    animateNoise();
    updateInfo();
  }
  then = now;

  requestAnimationFrame(animate);
  render();
  stats.update();
}

function render() {
  cameraControls.update();

  if (vars.chaseCamera) renderer.render(scene, fishCamera);
  else renderer.render(scene, camera);
}
