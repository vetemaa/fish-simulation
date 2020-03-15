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
var foods = [];
var boidTotalCount = 700;
var boidStartCount = 1;
var predatorTotalCount = 5;
var predatorStartCount = 0;
var foodTotalCount = 0;
var foodStartCount = 0;

function init() {
  ran = new Random(1);
  ran.nextFloat();
  ran.nextFloat();
  ran.nextFloat();

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
  // camera.position.set(160, 60, 93);
  camera.position.set(30, 20, 140);
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
  addFood();

  scene.add(fishCamera);

  addBounds();

  // animate frame(s) for paused analysis
  moveBoids(1);
  moveBoids(1);
  cameraChase(1);

  addNoiseCurve();
  // animateNoise();
  animate();
}

let then = Date.now();
function animate(now) {
  const delta = now - then;
  if (delta && vars.play) {
    moveBoids(delta);
    animateFood(delta);
    cameraChase(delta);
    animateNoise();
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

var b = null;
var a = null;

function addNoiseCurve() {
  // for (let i = 0; i < boidTotalCount; i++) {
  for (let i = 0; i < 1; i++) {
    const boid = boids[i];

    var lines = new THREE.Group();

    var noiseLineX = new THREE.Group();
    noiseLineX.color = 0xff9999;
    lines.add(noiseLineX);

    var noiseLineY = new THREE.Group();
    noiseLineY.color = 0x99ff99;
    lines.add(noiseLineY);

    var noiseLineZ = new THREE.Group();
    noiseLineZ.color = 0x9999ff;
    lines.add(noiseLineZ);

    boid.noise = { a: null, b: rand(), lines: lines };
    scene.add(lines);
  }
}

function addLineSegment(line, vector) {
  if (!line.previous) {
    line.previous = vector;
    return;
  }

  const lineGeom = new THREE.Geometry();
  lineGeom.vertices.push(line.previous.clone());
  lineGeom.vertices.push(vector);

  const segment = new THREE.Line(
    lineGeom,
    new THREE.LineBasicMaterial({
      color: line.color
    })
  );

  line.add(segment);
  line.previous.copy(vector);
}

var asd = 0;

function animateNoise() {
  // for (let i = 0; i < vars.boidCount; i++) {
  if (asd != 0) return;
  for (let i = 0; i < 1; i++) {
    const boid = boids[i];

    // var x = 0;
    // while (x < 50) {
    //   // x = boid.ownTime * 20;
    //   // console.log(x);
    //   y = noise(x, boid);
    //   // console.log(y);
    //   // boid.noise.line.geometry.vertices.push(new THREE.Vector3(-1, 3, 0));
    //   addLineSegment(boid.noiseLine, new THREE.Vector3(x, y, 0));
    //   x += 1;
    //   asd += 1;
    // }

    time = boid.ownTime * vars.randomWavelenScalar;
    x = simplex.noise2D(time, (boid.index + 1) * 10);
    y = simplex.noise2D(time, (boid.index + 1) * 100);
    z = simplex.noise2D(time, (boid.index + 1) * 1000);
    xAxis = time * 10;
    // console.log(xAxis);

    addLineSegment(
      boid.noise.lines.children[0],
      new THREE.Vector3(xAxis, x * 10, 0)
    );
    addLineSegment(
      boid.noise.lines.children[1],
      new THREE.Vector3(xAxis, y * 10, 0)
    );
    addLineSegment(
      boid.noise.lines.children[2],
      new THREE.Vector3(xAxis, z * 10, 0)
    );

    boid.noise.lines.position.x = -xAxis - 5;
  }
}

function noise(x, boid) {
  const amplitude = 10;
  const wavelen = 10;
  var { noise } = boid;
  var y;

  // var x = e;
  // x = Math.trunc(x);
  // console.log(x);

  // TODO: probleem kui ei ole järjest naturaalarvud
  if (x % wavelen === 0) {
    boid.noise.a = boid.noise.b;
    boid.noise.b = rand();
    y = boid.noise.a;
  } else {
    y = interpolate(boid.noise.a, boid.noise.b, (x % wavelen) / wavelen);
  }

  return (y * 2 - 1) * amplitude;
}

const M = 4294967296;
const A = 1664525;
const C = 1;
var Z = Math.floor(0.1 * M); // var Z = Math.floor(Math.random() * M);
function rand() {
  Z = (A * Z + C) % M;
  return Z / M;
}

function interpolate(pa, pb, px) {
  var ft = px * Math.PI,
    f = (1 - Math.cos(ft)) * 0.5;
  return pa * (1 - f) + pb * f;
}
