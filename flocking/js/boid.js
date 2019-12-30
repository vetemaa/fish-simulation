var boids = [];

function addBoids() {
  for (let i = 0; i < 3; i++) {
    addBoid([0, 0, i * 1]);
  }

  console.log(boids);
}

function addBoid(position) {
  const geom = new THREE.BoxGeometry(1, 0.5, 0.25, 4, 2, 1);
  const mat = new THREE.MeshNormalMaterial({ wireframe: false });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.forwardVec = new THREE.Vector3(1, 0, 0);

  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0.5, 0, 0)
  );
  arrow.setLength(0.6, 0.3, 0.2);

  mesh.add(arrow);
  mesh.position.set(...position);
  boids.push(mesh);
  scene.add(mesh);
}

function animateBoids() {
  boids.forEach(boid => {
    boid.translateX(variables.speed);
  });
}
