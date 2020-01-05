var stats, scene, renderer, composer;
var camera, cameraControls;
var geom, mat, mesh;

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setClearColor("#111");
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.bottom = "0px";
  document.body.appendChild(stats.domElement);
  window.addEventListener("resize", onWindowResize, false);
  initControls();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  // camera.position.set(0, 0, 5);
  camera.position.set(94, 48, 60);
  scene.add(camera);

  // cameraControls = new THREE.TrackballControls(camera, renderer.domElement);
  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.rotateSpeed = 0.2;

  scene.add(new THREE.AxesHelper(100));
  addBounds();
  addBoids();

  animate();
}

let then = Date.now();
function animate(now) {
  const delta = now - then;
  delta && animateBoids(delta);
  then = now;

  requestAnimationFrame(animate);
  render();
  stats.update();
}

function render() {
  cameraControls.update();

  renderer.render(scene, camera);
}
