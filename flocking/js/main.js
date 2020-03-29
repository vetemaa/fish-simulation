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
var boidStartCount = 700;
var predatorTotalCount = 5;
var predatorStartCount = 0;
var foodTotalCount = 100;
var foodStartCount = 0;

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setClearColor(backColor);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.bottom = "0px";
  document.body.appendChild(stats.domElement);
  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("fullscreenchange", onWindowResize, false);
  initControls();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  // camera = new THREE.OrthographicCamera(
  //   window.innerWidth / -120,
  //   window.innerWidth / 120,
  //   window.innerHeight / 120,
  //   window.innerHeight / -120,
  //   1,
  //   1000
  // );
  fishCamera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // camera.position.set(42, 16, 25);
  // camera.position.set(140, 54, 82);
  // camera.position.set(84, 33, 49);
  // camera.position.set(160, 50, 93);
  camera.position.set(186, 34, 113);
  // camera.position.set(30, 20, 140);
  // camera.position.set(10.001, 20, 10);
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
  moveBoids(1);
  cameraChase(1);

  addNoiseCurve();
  animate();
}

let then = Date.now();
function animate(now) {
  let delta = now - then;
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
