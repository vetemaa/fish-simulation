var boids = [];

function addBoids() {
  for (let i = 0; i < 300; i++) {
    // addBoid([Math.random(), Math.random(), i * 1]);
    // addBoid([i * Math.random(), i * Math.random(), i * Math.random()]);
    addBoid([40 * Math.random(), 40 * Math.random(), 40 * Math.random()]);
    // addBoid([0, 0, i * 1]);
  }

  console.log(boids);
}

function addBoid(position) {
  // const geom = new THREE.BoxGeometry(1, 0.5, 0.25, 4, 2, 1);
  // const geom = new THREE.BoxGeometry(0.25, 0.5, 1, 4, 2, 1);
  const geom = new THREE.BoxGeometry(0.2, 0.2, 0.2, 4, 2, 1);
  const mat = new THREE.MeshNormalMaterial({ wireframe: false });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.forwardVec = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  );

  mesh.helpArrows = [];
  // ["#ff9999", "#99ff99", "#9999ff"].forEach(color => {
  ["#ff9999"].forEach(color => {
    const arrow = new THREE.ArrowHelper();
    arrow.setLength(0.6, 0.1, 0.1);
    arrow.setColor(color);
    mesh.add(arrow);
    mesh.helpArrows.push(arrow);
  });

  mesh.position.set(...position);
  boids.push(mesh);
  scene.add(mesh);
}

function animateBoids() {
  boids.forEach(boid => {
    const sepVec = separationVec(boid);
    const aliVec = aligmentVec(boid);
    const cohVec = cohesionVec(boid);

    // boid.helpArrows[0].setDirection(sepVec);
    boid.helpArrows[0].setDirection(aliVec);
    // boid.helpArrows[0].setDirection(cohVec);

    boid.forwardVec.add(sepVec);
    // boid.forwardVec.add(aliVec);
    boid.forwardVec.add(cohVec);

    moveVec = new THREE.Vector3().copy(boid.forwardVec);
    moveVec.multiplyScalar(variables.speed);
    // boid.helpArrows[0].setDirection(moveVec);
    boid.position.add(moveVec);
  });
}

function cohesionVec(boid) {
  const cohVec = new THREE.Vector3();

  const flockmatesInRange = boids.filter(
    flockmate => boid.position.distanceTo(flockmate.position) < 10
  );

  flockmatesInRange.forEach(flockmate => {
    if (boid.id !== flockmate.id) {
      cohVec.add(flockmate.position);
    }
  });
  cohVec.divideScalar(flockmatesInRange.length - 1);
  cohVec.sub(boid.position);

  return cohVec.divideScalar(100);
}

function aligmentVec(boid) {
  const aliVec = new THREE.Vector3();

  const flockmatesInRange = boids.filter(
    flockmate => boid.position.distanceTo(flockmate.position) < 10
  );

  // boids.forEach(flockmate => {
  flockmatesInRange.forEach(flockmate => {
    if (boid.id !== flockmate.id) {
      aliVec.add(flockmate.forwardVec);
    }
  });
  aliVec.divideScalar(flockmatesInRange.length - 1);
  // aliVec.divideScalar(boids.length - 1);

  aliVec.sub(boid.forwardVec);
  return aliVec.divideScalar(8);
}

function separationVec(boid) {
  const sepVec = new THREE.Vector3();
  boids.forEach(flockmate => {
    if (
      boid.id !== flockmate.id &&
      boid.position.distanceTo(flockmate.position) < 0.6
    ) {
      boidPosCopy = new THREE.Vector3().copy(boid.position);
      sepVec.add(boidPosCopy.sub(flockmate.position));
    }
  });
  return sepVec;
}
