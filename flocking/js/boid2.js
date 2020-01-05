var boids = [];

function addBoids() {
  for (let i = 0; i < 100; i++) {
    // addBoid([Math.random(), Math.random(), i * 2]);
    // addBoid([
    //   i * 3 * Math.random(),
    //   i * 3 * Math.random(),
    //   i * 3 * Math.random()
    // ]);
    addBoid([40 * Math.random(), 40 * Math.random(), 40 * Math.random()]);
    // addBoid([0, 0, i * 2]);
  }

  console.log(boids);
}

function addBoid(position) {
  const boid = new THREE.Group();

  // const geom = new THREE.BoxGeometry(1, 0.5, 0.25, 4, 2, 1);
  // const geom = new THREE.BoxGeometry(0.25, 0.5, 1, 4, 2, 1);
  const geom = new THREE.ConeGeometry(0.3, 1);
  // const mat = new THREE.MeshNormalMaterial({ wireframe: true });
  const mat = new THREE.MeshBasicMaterial({ wireframe: true });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotateX(THREE.Math.degToRad(90));
  boid.mesh = mesh;
  boid.add(mesh);

  boid.velocity = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  ).clampLength(0, variables.maxForce);
  boid.acceleration = new THREE.Vector3();

  boid.helpArrows = [];
  ["#ffffff", "#ff9999", "#99ff99", "#9999ff"].forEach(color => {
    const arrow = new THREE.ArrowHelper();
    arrow.visible = false;
    arrow.setLength(0.9, 0.2, 0.2);
    arrow.setColor(color);
    boid.add(arrow);
    boid.helpArrows.push(arrow);
  });

  boid.position.set(...position);
  boids.push(boid);
  scene.add(boid);
}

function animateBoids() {
  boids.forEach(boid => {
    const { velocity, acceleration, mesh, position } = boid;

    // boid algorithm
    const sep = separation(boid);
    const ali = alignment(boid);
    const coh = cohesion(boid);
    const bnd = bounds(boid);
    // setArrow(boid.helpArrows[1], sep);
    // setArrow(boid.helpArrows[2], ali);
    // setArrow(boid.helpArrows[3], coh);
    sep.multiplyScalar(0.6);
    ali.multiplyScalar(0.2);
    coh.multiplyScalar(0.1);
    bnd.multiplyScalar(0.4);
    acceleration.add(sep);
    acceleration.add(ali);
    acceleration.add(coh);
    acceleration.add(bnd);

    if (variables.startStop !== 0) {
      // visual stuff
      const lookVec = velocity.clone();
      lookVec.multiplyScalar(10).add(boid.position);
      mesh.lookAt(lookVec);
      mesh.rotateX(THREE.Math.degToRad(90));
      // setArrow(boid.helpArrows[0], velocity);

      // update position
      velocity.add(acceleration);
      velocity.clampLength(0, variables.maxSpeed);
      position.add(velocity);
      acceleration.multiplyScalar(0);
    }
  });
}

function separation(boid) {
  const steer = new THREE.Vector3();
  let neighbourCount = 0;
  let distFactor = 0;

  boids.forEach(flockmate => {
    const dist = boid.position.distanceTo(flockmate.position);

    if (dist > 0 && dist < variables.separationDist) {
      // console.log(dist);
      distFactor += dist;

      const diff = boid.position.clone().sub(flockmate.position);
      diff.normalize();
      // diff.divideScalar(dist); mõjutab olulisust aga järsk kukkumine
      diff.multiplyScalar(variables.separationDist / dist - 1); // sujuv kukkumine
      steer.add(diff);
      neighbourCount++;
    }
  });

  if (neighbourCount > 0) {
    // steer.divideScalar(neighbourCount);
    steer.setLength(variables.maxSpeed);
    // steer.sub(boid.velocity);
    steer.clampLength(0, variables.maxForce);

    // mõju tugevus sõltuvalt kauguste summast
    steer.multiplyScalar(
      1 - distFactor / (neighbourCount * variables.separationDist)
    );
  }

  return steer;
}

function alignment(boid) {
  const steer = new THREE.Vector3();
  let neighbourCount = 0;

  boids.forEach(flockmate => {
    const dist = boid.position.distanceTo(flockmate.position);

    if (dist > 0 && dist < variables.neighbourDist) {
      const vel = flockmate.velocity.clone();
      vel.multiplyScalar(variables.neighbourDist / dist - 1); // sujuv kukkumine
      steer.add(vel);
      neighbourCount++;
    }
  });

  if (neighbourCount > 0) {
    steer.setLength(variables.maxSpeed); // TODO kas pigem lslt normalize
    // steer.sub(boid.velocity);
    steer.clampLength(0, variables.maxForce);
  }

  return steer;
}

function cohesion(boid) {
  const steer = new THREE.Vector3();
  let neighbourCount = 0;

  boids.forEach(flockmate => {
    const dist = boid.position.distanceTo(flockmate.position);

    if (dist > 0 && dist < variables.neighbourDist) {
      const pos = flockmate.position.clone();
      // TODO sujuv kukkumine
      steer.add(pos);
      neighbourCount++;
    }
  });

  if (neighbourCount > 0) {
    steer.divideScalar(neighbourCount);
    steer.sub(boid.position);
    steer.setLength(variables.maxSpeed);
    steer.clampLength(0, variables.maxForce);
  }

  return steer;
}

function bounds(boid) {
  const area = variables.boundSize;
  const steer = new THREE.Vector3();
  const { x, y, z } = boid.position;

  if (x < 0) steer.x = 1;
  else if (x > area) steer.x = -1;
  if (y < 0) steer.y = 1;
  else if (y > area) steer.y = -1;
  if (z < 0) steer.z = 1;
  else if (z > area) steer.z = -1;

  // steer.normalize();
  // steer.clampLength(0, 0.1);
  steer.clampLength(0, variables.maxForce);

  return steer;
}

function setArrow(arrow, vec) {
  if (vec.length() <= 0) {
    arrow.visible = false;
  } else {
    // const len = vec.length() * 1000;
    // arrow.setLength(len, 0.2, 0.2);
    arrow.setDirection(vec.clone().normalize());
    arrow.visible = true;
  }
}

var asd = 0;
function makeArrow(vec) {
  if (asd !== 3) return;
  const arrow = new THREE.ArrowHelper();
  setArrow(arrow, vec);
  scene.add(arrow);
}
