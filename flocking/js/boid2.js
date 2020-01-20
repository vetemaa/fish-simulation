var boids = [];

function addBoids() {
  for (let i = 0; i < 3; i++) {
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
  const mat = new THREE.MeshBasicMaterial({ wireframe: true });
  const coneGeom = new THREE.ConeGeometry(0.3, 1);
  const boxGeom = new THREE.BoxGeometry(1, 0.5, 0.25, 4, 2, 1);
  const coneMesh = new THREE.Mesh(coneGeom, mat);
  const boxMesh = fishModel.clone();
  boxMesh.geometry = fishModel.geometry.clone();

  coneMesh.geometry.rotateX(THREE.Math.degToRad(90));

  boid.coneMesh = coneMesh;
  boid.boxMesh = boxMesh;
  boid.add(coneMesh);
  boid.add(boxMesh);

  boid.velocity = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  );
  boid.acceleration = new THREE.Vector3();

  boid.helpArrows = [];
  // [0xffffff, 0xff9999, 0x99ff99, 0x9999ff, 0xf6ff99, 0x00fff5].forEach(
  [0xffffff, 0xff9999, 0x99ff99, 0x9999ff, 0xf6ff99].forEach(color => {
    const arrow = new THREE.ArrowHelper();
    arrow.visible = false;
    arrow.setColor(color);
    boid.add(arrow);
    boid.helpArrows.push(arrow);
  });

  boid.position.set(...position);
  boids.push(boid);
  scene.add(boid);

  const velClone = boid.velocity.clone();
  velClone.add(boid.position);
  // velClone.set(3, 0, 0);
  coneMesh.lookAt(velClone);
  boxMesh.lookAt(velClone);
  boxMesh.rotateY(THREE.Math.degToRad(-90));

  changeGeometry(variables.animateVertices);
  vertexAnimationInit(boid.boxMesh);
}

function animateBoids(delta) {
  if (delta > 1000) delta = 0; // when tab not open

  boids.forEach(boid => {
    const { velocity, acceleration, coneMesh, boxMesh, position } = boid;

    // boid algorithm
    const sep = separation(boid);
    const ali = alignment(boid);
    const coh = cohesion(boid);
    const bnd = bounds(boid);
    const ran = random(boid);
    sep.multiplyScalar(0.4);
    ali.multiplyScalar(1.6);
    coh.multiplyScalar(0.08);
    bnd.multiplyScalar(0.01);
    ran.multiplyScalar(1);
    // acceleration.add(sep);
    // acceleration.add(ali);
    // acceleration.add(coh);
    acceleration.add(bnd);
    // acceleration.add(ran);
    if (variables.showVectors) {
      // setArrow(boid.helpArrows[1], ran);
      setArrow(boid.helpArrows[1], sep);
      setArrow(boid.helpArrows[2], ali);
      setArrow(boid.helpArrows[3], coh);
      setArrow(boid.helpArrows[4], bnd);
      setArrow(boid.helpArrows[0], acceleration);
    }
    acceleration.multiplyScalar(0.05);

    if (boid.subject) {
      boid.coneMesh.material.color.setHex(0x00fff5);
      // console.log(ali.length());
      // console.log("sep:", sep.length());
      // console.log("ali:", ali.length());
      // console.log("coh:", coh.length());
      // console.log("bnd:", bnd.length());
      // console.log("acc:", acceleration.length());
      // console.log("");
    }

    const { play, playSpeed, maxVelocity, animateVertices } = variables;
    if (play && playSpeed !== 0 && maxVelocity !== 0) {
      // console.log(delta);
      // acceleration.multiplyScalar(variables.playSpeed * delta);
      velocity.add(acceleration);

      // velocity.clampLength(0, variables.maxVelocity);
      if (velocity.length() > maxVelocity) velocity.setLength(maxVelocity);

      // velocity.setLength(variables.maxVelocity); // TODO vb asendada hõõrdejõuga ja hõõrdejõu tugevus sõltuvalt cohesion tugevusest :OOOOOOO
      // setArrow(boid.helpArrows[5], velocity);

      const velClone = velocity.clone();
      velClone.multiplyScalar(playSpeed * (delta / 16));
      position.add(velClone);

      velClone.add(boid.position);
      coneMesh.lookAt(velClone);
      boxMesh.lookAt(velClone);
      boxMesh.rotateY(THREE.Math.degToRad(-90));

      if (animateVertices) {
        acceleration.multiplyScalar(playSpeed * delta);
        vertexAnimation(boid.boxMesh, acceleration);
      }
    }

    acceleration.multiplyScalar(0);
  });
}

function separation(boid) {
  const steer = new THREE.Vector3();
  let neighbourCount = 0;
  let neighbourSmoothCount = 1;

  boids.forEach(flockmate => {
    const dist = boid.position.distanceTo(flockmate.position);

    if (dist > 0 && dist < variables.separationDist) {
      const diff = boid.position.clone().sub(flockmate.position);
      diff.multiplyScalar(1 - dist / variables.separationDist); // sujuv kukkumine
      steer.add(diff);

      neighbourCount++;
      neighbourSmoothCount += 1 - dist / variables.separationDist;
    }
  });

  if (neighbourCount > 0) {
    // steer.divideScalar(neighbourCount);
    steer.divideScalar(neighbourSmoothCount);
    // steer.setLength(variables.maxVelocity);
    // steer.sub(boid.velocity);
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
      // neighbourSmoothCount += 1 - dist / variables.separationDist;
    }
  });

  if (neighbourCount > 0) {
    steer.divideScalar(neighbourCount);
    // steer.divideScalar(neighbourSmoothCount);
    steer.sub(boid.position);
    steer.multiplyScalar(0.1);
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

  steer.normalize();
  steer.multiplyScalar(boundBox.boundBox3.distanceToPoint(boid.position)); // smooth
  // TODO unsmoothness on edge of two axes bounds

  return steer;
}

function random() {
  const steer = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  );
  return steer;
}

function setArrow(arrow, vec) {
  if (vec.length() <= 0) {
    arrow.visible = false;
  } else {
    const len = vec.length() * 8;
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
