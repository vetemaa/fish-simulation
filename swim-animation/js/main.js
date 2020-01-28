var stats, scene, renderer, composer;
var camera, cameraControls;
var mesh;
var fishModel;

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setClearColor(0x222222222);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);
  stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.bottom = "0px";
  document.body.appendChild(stats.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    100
  );
  camera.position.set(0, 0, 5);
  scene.add(camera);

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);

  scene.add(new THREE.DirectionalLight(0xffffff, 0.3));
  scene.add(new THREE.AmbientLight(0xffffff, 1));

  const loader = new THREE.GLTFLoader();
  loader.load("../../flocking/tang.glb", gltf => {
    fishModel = gltf.scene.children[0];
    fishModel.position.set(0, 0, 0);
    fishModel.scale.set(1, 1, 1);

    fishModel.geometry = new THREE.Geometry().fromBufferGeometry(
      fishModel.geometry
    );
    mesh = fishModel;

    vertexAnimationInit(mesh);
    // fillFrames(mesh);
    initMesh();
  });
}

function initMesh() {
  // const geom = new THREE.BoxGeometry(1, 0.5, 0.25, 16, 8, 4);
  // const geom = new THREE.BoxGeometry(1, 0.5, 0.25, 8, 4, 2);
  const geom = new THREE.BoxGeometry(1, 0.5, 0.25, 4, 2, 1);
  // const geom = new THREE.ConeGeometry(0.3, 2);
  const mat = new THREE.MeshNormalMaterial({ wireframe: true });
  // mesh = new THREE.Mesh(geom, mat);

  mesh.lookAt(new THREE.Vector3(3, 0, 0));
  mesh.rotateY(THREE.Math.degToRad(-90));

  const axesHelper = new THREE.AxesHelper(1);
  // axesHelper.position.set(0.25, -0.25, 0);
  axesHelper.position.set(0.25, -0.25, 0);
  scene.add(axesHelper);

  scene.add(mesh);
  scene.add(new THREE.AxesHelper(10));

  animate();
}

function datGui() {
  return initDatGui(mesh);
}

function render() {
  cameraControls.update();
  renderer.render(scene, camera);
}

let then = Date.now();
function animate(now) {
  const delta = now - then;
  delta && colorVert(mesh);
  const testVec = new THREE.Vector3(0.0005 * delta, 0, 0);
  delta && vertexAnimation(mesh, testVec);
  // delta && vertexAnimationOld(delta, mesh, new THREE.Vector3(0.001, 0, 0));
  then = now;

  requestAnimationFrame(animate);
  render();
  stats.update();
}

function colorVert(mesh) {
  if (!currentMask || !vars.masks) {
    // mesh.material = new THREE.MeshNormalMaterial({});
    // mesh.geometry.elementsNeedUpdate = true;
    // mesh.geometry.normalsNeedUpdate = true;
    return;
  }

  mesh.material = new THREE.MeshBasicMaterial({
    vertexColors: THREE.VertexColors
  });
  mesh.geometry.faces.forEach(face => {
    ["a", "b", "c"].forEach((vert, indx) => {
      xPos = mesh.geometry.vertices[face[vert]].x;
      //   maskedValue = mask(xPos, -1, 1);
      maskedValue = sinMask(
        xPos,
        -1,
        1,
        vars[currentMask + "MaskWavLen"],
        vars[currentMask + "MaskOffset"]
      );
      face.vertexColors[indx] = new THREE.Color(
        maskedValue,
        maskedValue,
        maskedValue
      );
    });
  });
  mesh.geometry.elementsNeedUpdate = true;
}
