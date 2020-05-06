var scene, camera, renderer, controls;
var myObject;

function init() {
  let w = window.innerWidth;
  let h = window.innerHeight;

  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xffffff);
  renderer.setSize(w, h);

  camera = new THREE.PerspectiveCamera(75, w / h, 0.0001, 1000);
  w /= 1000;
  h /= 1000;
  camera = new THREE.OrthographicCamera(-w, w, h, -h, 0.0001, 1000);
  camera.position.set(5, 5, 5);
  camera.position.set(1.5, 0.25, 1);
  camera.position.set(1, 0.7, 1.3);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  document.body.appendChild(renderer.domElement);

  var geom = new THREE.Geometry();
  geom.vertices.push(new THREE.Vector3(0, 0, 0.2));
  geom.vertices.push(new THREE.Vector3(1, 0, 0));
  geom.vertices.push(new THREE.Vector3(0, 1, 0));
  geom.faces.push(new THREE.Face3(0, 1, 2));
  geom.computeVertexNormals();
  myObject = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 3),
    // new THREE.PlaneGeometry(2),
    // new THREE.TorusGeometry(3, 0.3, 8, 12),
    // geom,
    new THREE.MeshNormalMaterial({ wireframe: true })
  );

  // myObject.rotation.x = Math.PI / 2;

  scene.add(myObject);
  scene.add(new THREE.AxesHelper(10));

  findVector(myObject);

  render();
}

function findVector(object) {
  const arrPos = new THREE.Vector3(0.5, 0.6, 0.5);
  // addSphere(arrPos);
  const closestPos = findClosestPosition(arrPos.clone(), object);
  // addSphere(closestPos);
  closestPos.sub(arrPos);

  // addArrow(closestPos, arrPos, 0x000000);
}

function render(t) {
  if (renderer) renderer.render(scene, camera);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);

function addSphere(position, color = 0xff00f0) {
  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.015, 8, 8),
    new THREE.MeshBasicMaterial({ color: color })
  );
  sphere.position.copy(position);
  scene.add(sphere);
}

function addArrow(target, origin = new THREE.Vector3(), color = 0xff0000) {
  const arrow = new THREE.ArrowHelper(
    target.clone().normalize(),
    origin,
    target.length(),
    color,
    0.05,
    0.05
  );
  scene.add(arrow);
}
