var scene, camera, renderer, sphere, closestPoint, cone, controls;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);
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
    new THREE.TorusGeometry(1, 0.3, 8, 12),
    // geom,
    new THREE.MeshNormalMaterial({ wireframe: true })
  );
  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );

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
}

function render(t) {
  movePoint(t);
  updateClosestPointPosition();

  controls.update();
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
