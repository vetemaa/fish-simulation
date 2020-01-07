var boids = [];

function addBoids() {
  for (let i = 0; i < 100; i++) {
    addBoid([
      variables.boundSize * Math.random(),
      variables.boundSize * Math.random(),
      variables.boundSize * Math.random()
    ]);
    // addBoid([0, 0, i * 1]);
  }
  boids[0].subject = true;
}

function addBoid(position) {
  const boid = new THREE.Group();
  // const geom = new THREE.BoxGeometry(0.25, 0.5, 1, 4, 2, 1);
  const geom = new THREE.ConeGeometry(0.3, 1);
  // const mat = new THREE.MeshNormalMaterial();
  const mat = new THREE.MeshBasicMaterial({ wireframe: true });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotateX(THREE.Math.degToRad(90));
  boid.mesh = mesh;
  boid.add(mesh);

  boid.velocity = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  );
  boid.acceleration = new THREE.Vector3();

  boid.helpArrows = [];
  [0xffffff, 0xff9999, 0x99ff99, 0x9999ff, 0xf6ff99, 0x00fff5].forEach(
    color => {
      const arrow = new THREE.ArrowHelper();
      arrow.visible = false;
      arrow.setColor(color);
      boid.add(arrow);
      boid.helpArrows.push(arrow);
    }
  );

  boid.position.set(...position);
  boids.push(boid);
  scene.add(boid);
}

function animateBoids(delta) {
  if (delta > 1000) delta = 0; // when tab not open

  boids.forEach(boid => {
    const { velocity, acceleration, mesh, position } = boid;

    // boid algorithm
    const sep = separation(boid);
    const ali = alignment(boid);
    const coh = cohesion(boid);
    const bnd = bounds(boid);
    sep.multiplyScalar(0.3);
    ali.multiplyScalar(2);
    coh.multiplyScalar(0.08);
    bnd.multiplyScalar(0.1);
    setArrow(boid.helpArrows[1], sep);
    setArrow(boid.helpArrows[2], ali);
    setArrow(boid.helpArrows[3], coh);
    setArrow(boid.helpArrows[4], bnd);
    acceleration.add(sep);
    acceleration.add(ali);
    acceleration.add(coh);
    acceleration.add(bnd);
    setArrow(boid.helpArrows[0], acceleration);
    acceleration.multiplyScalar(0.1);

    if (boid.subject) {
      boid.mesh.material.color.setHex(0x00fff5);
      console.log("sep:", sep.length());
      console.log("ali:", ali.length());
      console.log("coh:", coh.length());
      console.log("bnd:", bnd.length());
      console.log("acc:", acceleration.length());
      console.log("");
    }

    if (variables.play && variables.playSpeed > 0) {
      // acceleration.multiplyScalar(0.1);
      velocity.add(acceleration);
      // velocity.clampLength(0, variables.maxSpeed);
      velocity.setLength(variables.maxSpeed); // TODO vb asendada hõõrdejõuga ja hõõrdejõu tugevus sõltuvalt cohesion tugevusest :OOOOOOO
      // setArrow(boid.helpArrows[5], velocity);

      // position.add(velocity);
      position.add(
        velocity.clone().multiplyScalar(variables.playSpeed * (delta / 16))
      );

      mesh.lookAt(velocity.clone().add(boid.position)); // vb acceleration
      mesh.rotateX(THREE.Math.degToRad(90));
    }

    acceleration.multiplyScalar(0);
  });
}

function separation(boid) {
  const steer = new THREE.Vector3();
  let neighbourCount = 0;

  boids.forEach(flockmate => {
    const dist = boid.position.distanceTo(flockmate.position);

    if (dist > 0 && dist < variables.separationDist) {
      const diff = boid.position.clone().sub(flockmate.position);
      diff.multiplyScalar(1 - dist / variables.separationDist); // sujuv kukkumine
      steer.add(diff);

      neighbourCount++;
    }
  });

  if (neighbourCount > 0) {
    steer.divideScalar(neighbourCount);
    // steer.setLength(variables.maxSpeed);
    // steer.sub(boid.velocity);
    steer.clampLength(0, variables.maxForce); // TODO eemaldada, rikub sujuvuse
  }

  return steer;
}

function alignment(boid) {
  const steer = new THREE.Vector3();
  let neighbourCount = 0;

  boids.forEach(flockmate => {
    const dist = boid.position.distanceTo(flockmate.position);

    if (dist > 0 && dist < variables.alignmentDist) {
      const vel = flockmate.velocity.clone();
      vel.multiplyScalar(1 - dist / variables.alignmentDist); // sujuv kukkumine

      steer.add(vel);
      neighbourCount++;
    }
  });

  if (neighbourCount > 0) {
    steer.divideScalar(neighbourCount);
    steer.clampLength(0, variables.maxForce);
  }

  return steer;
}

function cohesion(boid) {
  const steer = new THREE.Vector3();
  let neighbourCount = 0;

  boids.forEach(flockmate => {
    const dist = boid.position.distanceTo(flockmate.position);

    if (dist > 0 && dist < variables.cohesionDist) {
      const pos = flockmate.position.clone();
      steer.add(pos); // TODO sujuv kukkumine
      neighbourCount++;
    }
  });

  if (neighbourCount > 0) {
    steer.divideScalar(neighbourCount);
    steer.sub(boid.position);
    steer.clampLength(0, variables.maxForce);
  }

  return steer;
}

function bounds(boid) {
  const minBound = 0;
  const maxBound = variables.boundSize;
  const steer = new THREE.Vector3();
  const { x, y, z } = boid.position;

  if (x < minBound) steer.x = 1;
  else if (x > maxBound) steer.x = -1;
  if (y < minBound) steer.y = 1;
  else if (y > maxBound) steer.y = -1;
  if (z < minBound) steer.z = 1;
  else if (z > maxBound) steer.z = -1;

  steer.clampLength(0, variables.maxForce);
  steer.multiplyScalar(boundBox.boundBox3.distanceToPoint(boid.position)); // smooth

  return steer;
}

function setArrow(arrow, vec) {
  if (vec.length() <= 0) {
    arrow.visible = false;
  } else {
    const len = vec.length() * 6;
    arrow.setLength(len, 0.1, 0.1);
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

function colorBoid(boid, value) {
  boid.mesh.material.color.setRGB(0, value, value);
}
