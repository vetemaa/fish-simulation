var scene, camera, renderer, sphere, closestPoint, cone, controls, arrow;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(15, 15, 15);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  renderer = new THREE.WebGLRenderer();
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  renderer.setClearColor(0x999999);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  var geom = new THREE.Geometry();
  geom.vertices.push(new THREE.Vector3(0, 0, 0.1));
  geom.vertices.push(new THREE.Vector3(4, 0, 0.1));
  geom.vertices.push(new THREE.Vector3(0, 6, 0.1));
  geom.faces.push(new THREE.Face3(0, 1, 2));
  cone = new THREE.Mesh(
    // new THREE.ConeGeometry(1, 2, 6),
    new THREE.TorusGeometry(3, 0.3, 8, 12),
    // geom,
    new THREE.MeshNormalMaterial({ wireframe: true })
  );
  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );

  //  const arrPos = new THREE.Vector3(3, 3, 3);
  // const closestPos = findClosestPosition(arrPos, cone.geometry);
  // closestPos.sub(arrPos);
  // closestPos.normalize();

  // arrow = new THREE.ArrowHelper(closestPos, arrPos, 0.3, 0x000000, 0.07, 0.07);
  // scene.add(arrow);

  fieldSize = 10;
  vectorField = [];
  for (let index1 = 0; index1 < fieldSize; index1++) {
    line1 = [];
    for (let index2 = 0; index2 < fieldSize; index2++) {
      line2 = [];
      for (let index3 = 0; index3 < fieldSize; index3++) {
        const arrPos = new THREE.Vector3(index1, index2, index3);
        const closestPos = findClosestPosition(arrPos, cone.geometry);
        closestPos.sub(arrPos);
        closestPos.normalize();

        arrow = new THREE.ArrowHelper(
          closestPos,
          arrPos,
          0.3,
          0x000000,
          0.07,
          0.07
        );
        scene.add(arrow);

        line2.push(closestPos);
      }
      line1.push(line2);
    }
    vectorField.push(line1);
  }
  console.log(vectorField);

  sphere.position.set(1, 0, 1);
  scene.add(cone);
  scene.add(sphere);
  scene.add(new THREE.AxisHelper(100));

  closestPoint = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  scene.add(closestPoint);
  closestPoint.position.set(0, 3, 0);

  render();

  bef = Date.now();
  for (let i = 0; i < 1 * 1 * 1; i++) {
    updateClosestPointPosition();
  }
  console.log(Date.now() - bef);
}

function movePoint(t) {
  t = t * 0.0005;
  sphere.position.x = Math.sin(t);
  sphere.position.z = Math.cos(t);
  sphere.position.y = Math.cos(t * 1.5) * 2;
}

function updateClosestPointPosition() {
  var point = sphere.position;
  var geometry = cone.geometry;

  var pos = findClosestPosition(point, geometry);
  closestPoint.position.copy(pos);
  // arrow.setDirection(pos);
}

function render(t) {
  movePoint(t);
  updateClosestPointPosition();

  controls.update();
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
