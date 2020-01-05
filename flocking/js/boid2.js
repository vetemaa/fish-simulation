var boids = [];

function addBoids() {
  for (let i = 0; i < 100; i++) {
    addBoid([
      variables.boundSize * Math.random(),
      variables.boundSize * Math.random(),
      variables.boundSize * Math.random()
    ]);
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
    sep.multiplyScalar(0.6);
    ali.multiplyScalar(0.2);
    coh.multiplyScalar(0.1);
    bnd.multiplyScalar(0.28);
    setArrow(boid.helpArrows[1], sep);
    setArrow(boid.helpArrows[2], ali);
    setArrow(boid.helpArrows[3], coh);
    setArrow(boid.helpArrows[4], bnd);
    acceleration.add(sep);
    acceleration.add(ali);
    acceleration.add(coh);
    acceleration.add(bnd);
    setArrow(boid.helpArrows[0], acceleration);

    if (boid.subject) {
      boid.mesh.material.color.setHex(0x00fff5);
      // console.log("sep:", sep.length());
      // console.log("ali:", ali.length());
      // console.log("coh:", coh.length());
      // console.log("bnd:", bnd.length());
      // console.log("acc:", acceleration.length());
      // console.log("");
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

    if (dist > 0 && dist < variables.alignmentDist) {
      const vel = flockmate.velocity.clone();
      // if (boid.subject && steer.length() > 0) console.log(vel.length());
      vel.multiplyScalar(1 - dist / variables.alignmentDist); // sujuv kukkumine
      // if (boid.subject && steer.length() > 0) console.log(vel.length());
      // if (boid.subject) {
      //   console.log(variables.alignmentDist);
      //   console.log(dist);
      //   console.log(1 - dist / variables.alignmentDist);
      //   console.log("");
      // }
      steer.add(vel);
      neighbourCount++;
    }
  });

  if (neighbourCount > 0) {
    // if (boid.subject && steer.length() > 0) console.log(steer.length());
    steer.divideScalar(neighbourCount);
    steer.sub(boid.velocity);
    // steer.setLength(variables.maxSpeed); // TODO kas pigem lslt normalize
    // if (boid.subject && steer.length() > 0) console.log(steer.length());
    // if (boid.subject && steer.length() > 0) console.log("");

    steer.clampLength(0, variables.maxForce);
    // steer.setLength(variables.maxForce);
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

  // steer.normalize();
  // if (boid.subject && steer.length() > 0) console.log(steer.length());
  steer.clampLength(0, variables.maxForce);
  // if (boid.subject && steer.length() > 0) console.log(steer.length());
  // if (boid.subject && steer.length() > 0) console.log("");
  steer.multiplyScalar(boundBox.boundBox3.distanceToPoint(boid.position)); // smooth

  return steer;
}

function setArrow(arrow, vec) {
  if (vec.length() <= 0) {
    arrow.visible = false;
  } else {
    const len = vec.length() * 100;
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
