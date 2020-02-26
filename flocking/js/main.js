var stats, scene, renderer, composer;
var camera, cameraControls, fishCamera;
var geom, mat, mesh, axesHelper, subject;
let fishCameraDist = 1.5,
  fishCameraFOV = 90;
var simplex = new SimplexNoise(1);
const backColor = "#111";

var ran;

var boids = [];
var predators = [];
var boidTotalCount = 1000;
var boidStartCount = 1000;
var predatorTotalCount = 5;
var predatorStartCount = 0;

function init() {
  ran = new Random(1);

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
  camera.position.set(160, 60, 93);
  // camera.position.set(10.001, 20, 10);
  // camera.position.set(15.001, 30, 15);

  scene.add(camera);
  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.rotateSpeed = 0.2;
  cameraControls.maxDistance = 300;
  cameraControls.minDistance = 1;

  axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);

  addBoids();
  addPredators();

  scene.add(fishCamera);

  addBounds();

  // animate couple of frames for paused analysis
  moveBoids(1);
  moveBoids(1);
  cameraChase(1);

  animate();
}

let then = Date.now();
function animate(now) {
  const delta = now - then;
  if (delta && vars.play) {
    moveBoids(delta);
    cameraChase(delta);
  }
  then = now;

  requestAnimationFrame(animate);
  render();
  stats.update();
}

function cameraChase() {
  var relativeCameraOffset = new THREE.Vector3(
    0,
    0.8 * fishCameraDist,
    -2 * fishCameraDist
  );

  var cameraOffset = relativeCameraOffset.applyMatrix4(
    boids[0].mesh.matrixWorld
  );

  fishCamera.position.copy(cameraOffset);

  const velClone = boids[0].velocity.clone();
  velClone.add(boids[0].position);
  let yOffset = 0.6;
  if (fishCameraDist < 1) yOffset *= fishCameraDist;
  velClone.y += yOffset;
  fishCamera.lookAt(velClone);
}

function render() {
  cameraControls.update();

  if (vars.chaseCamera) renderer.render(scene, fishCamera);
  else renderer.render(scene, camera);
}

// seedable random number generator
// author: blixt on GitHub
// url: https://gist.github.com/blixt/f17b47c62508be59987b
/**
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 */
class Random {
  constructor(seed) {
    this._seed = seed % 2147483647;
    if (this._seed <= 0) this._seed += 2147483646;
  }
  /**
   * Returns a pseudo-random value between 1 and 2^32 - 2.
   */
  next() {
    return (this._seed = (this._seed * 16807) % 2147483647);
  }
  /**
   * Returns a pseudo-random floating point number in range [0, 1).
   */
  nextFloat(opt_minOrMax, opt_max) {
    // We know that result of next() will be 1 to 2147483646 (inclusive).
    return (this.next() - 1) / 2147483646;
  }
}
