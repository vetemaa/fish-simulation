var stats, scene, renderer, composer;
var camera, cameraControls, fishCamera;
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
  window.addEventListener("fullscreenchange", onWindowResize, false);
  initControls();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  fishCamera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
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

    vertexAnimationInit(fishModel);
    fillFrames(fishModel);
    addBoids();
  });

  scene.add(fishCamera);
  // boids[0].add(fishCamera);

  addBounds();
  animate();
}

let then = Date.now();
function animate(now) {
  const delta = now - then;
  delta && animateBoids(delta);
  then = now;

  delta && boids[0] && cameraChase(delta);

  requestAnimationFrame(animate);
  render();
  stats.update();
}

function cameraChase(delta) {
  var relativeCameraOffset = new THREE.Vector3(0, 0.8, -2);
  var cameraOffset = relativeCameraOffset.applyMatrix4(
    boids[0].coneMesh.matrixWorld
  );

  fishCamera.position.copy(cameraOffset);

  const velClone = boids[0].velocity.clone();
  velClone.multiplyScalar(variables.playSpeed * (delta / 16));
  velClone.add(boids[0].position);
  velClone.y += 0.6;
  fishCamera.lookAt(velClone);
}

function render() {
  cameraControls.update();

  if (variables.chaseCamera) renderer.render(scene, fishCamera);
  else renderer.render(scene, camera);
}
