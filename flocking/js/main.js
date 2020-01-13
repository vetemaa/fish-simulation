var stats, scene, renderer, composer;
var camera, cameraControls;
var geom, mat, mesh, axesHelper;
var fishModel;

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
  camera.position.set(1, 1, 5);
  camera.position.set(94, 48, 60);
  camera.position.set(140, 54, 82);

  scene.add(camera);
  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.rotateSpeed = 0.2;

  axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);

  // const mat = new THREE.MeshBasicMaterial({ wireframe: true });
  // const boxGeom = new THREE.BoxGeometry(1, 0.5, 0.25, 4, 2, 1);
  // const boxMesh = new THREE.Mesh(boxGeom, mat);
  // scene.add(boxMesh);

  scene.add(new THREE.AmbientLight(0xffffff));
  const loader = new THREE.GLTFLoader();

  loader.load("tang.glb", gltf => {
    fishModel = gltf.scene.children[0];
    fishModel.position.set(0, 0, 0);
    fishModel.scale.set(1, 1, 1);

    fishModel.geometry = new THREE.Geometry().fromBufferGeometry(
      fishModel.geometry
    );

    addBoids();
  });

  addBounds();
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
