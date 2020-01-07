var stats, scene, renderer, composer;
var camera, cameraControls;
var geom, mat, mesh;

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
    10000
  );
  camera.position.set(0, 0, 5);
  scene.add(camera);

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);

  geom = new THREE.BoxGeometry(2, 1, 0.5, 16, 8, 4);
  // geom = new THREE.ConeGeometry(0.3, 2);
  // geom.rotateZ(THREE.Math.degToRad(-90));

  mat = new THREE.MeshNormalMaterial({ wireframe: true });
  mesh = new THREE.Mesh(geom, mat);
  scene.add(mesh);

  scene.add(new THREE.AxesHelper(10));

  vertexAnimationInit(mesh);
  animate();
}

function render() {
  cameraControls.update();

  renderer.render(scene, camera);
}

let then = Date.now();
function animate(now) {
  const delta = now - then;
  delta && colorVert(delta);
  delta && vertexAnimation(delta, mesh, new THREE.Vector3(1, 0, 0));
  then = now;

  requestAnimationFrame(animate);
  render();
  stats.update();
}

function colorVert() {
  if (!currentMask || !vars.masks) {
    mesh.material = new THREE.MeshNormalMaterial({});
    geom.elementsNeedUpdate = true;
    geom.normalsNeedUpdate = true;
    return;
  }

  mesh.material = new THREE.MeshBasicMaterial({
    vertexColors: THREE.VertexColors
  });
  geom.faces.forEach(face => {
    ["a", "b", "c"].forEach((vert, indx) => {
      xPos = geom.vertices[face[vert]].x;
      //   maskedValue = mask(xPos, -1, 1);
      maskedValue = sinMask(
        xPos,
        -1,
        1,
        vars[currentMask + "_maskWavLen"],
        vars[currentMask + "_maskOffset"]
      );
      face.vertexColors[indx] = new THREE.Color(
        maskedValue,
        maskedValue,
        maskedValue
      );
    });
  });
  geom.elementsNeedUpdate = true;
}
