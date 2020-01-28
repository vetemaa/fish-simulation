var boids = [];
var boidTotalCount = 1000;
var boidStartCount = 1000;

function addBoids() {
  for (let i = 0; i < boidTotalCount; i++) {
    addBoid(
      [
        variables.boundSize * Math.random(),
        variables.boundSize * Math.random(),
        variables.boundSize * Math.random()
      ],
      i
    );
    // addBoid([0, 0, i * 1]);
  }
  boids[0].subject = true;
  hideBoids(variables.boidCount);
}

function addBoid(position, index) {
  const boid = new THREE.Group();
  boid.index = index;
  boid.ownTime = 0;

  const mat = new THREE.MeshBasicMaterial({ wireframe: true });

  const coneGeom = new THREE.ConeBufferGeometry(0.3, 1);
  const coneMesh = new THREE.Mesh(coneGeom, mat);
  coneMesh.geometry.rotateX(THREE.Math.degToRad(90));
  boid.add(coneMesh);

  const boxGeom = new THREE.BoxBufferGeometry(1, 0.5, 0.25, 4, 2, 1);
  const boxMesh = new THREE.Mesh(boxGeom, mat);
  boid.add(boxMesh);

  const fishMesh = fishModel.clone();
  fishMesh.geometry = fishModel.geometry.clone();
  boid.add(fishMesh);

  boid.meshTypes = [coneMesh, boxMesh, fishMesh];

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

  // position[1] = noisePlane(position[0], -position[2]);

  boid.position.set(...position);
  boids.push(boid);
  scene.add(boid);

  changeMesh(variables.meshType);
  vertexAnimationInit(boid.meshTypes[2]);

  boidDirection(boid.velocity.clone(), boid);
}

function animateBoids(delta) {
  if (delta > 1000) delta = 0; // when tab not open

  for (let i = 0; i < variables.boidCount; i++) {
    const boid = boids[i];
    const { velocity, acceleration, position } = boid;

    const { sep, ali, coh } = rules(boid);
    const bnd = bounds(boid);
    const ran = random(boid);
    const flr = floor(boid);
    sep.multiplyScalar(variables.separationScalar);
    ali.multiplyScalar(variables.alignmentScalar);
    coh.multiplyScalar(variables.cohesionScalar);
    bnd.multiplyScalar(variables.boundsScalar);
    ran.multiplyScalar(variables.randomScalar);
    acceleration.add(sep);
    acceleration.add(ali);
    acceleration.add(coh);
    acceleration.add(bnd);
    acceleration.add(ran);
    acceleration.add(flr);
    if (variables.showVectors) {
      // setArrow(boid.helpArrows[1], ran);
      setArrow(boid.helpArrows[1], sep);
      setArrow(boid.helpArrows[2], ali);
      setArrow(boid.helpArrows[3], coh);
      setArrow(boid.helpArrows[4], bnd);
      setArrow(boid.helpArrows[0], acceleration);
    }
    acceleration.multiplyScalar(0.005);
    acceleration.multiplyScalar(variables.ruleScalar);
    acceleration.y *= 0.8;

    if (boid.subject) {
      boid.meshTypes[0].material.color.setHex(0x00fff5);
    }

    const { play, playSpeed, maxVelocity, meshType } = variables;
    if (play && playSpeed !== 0 && maxVelocity !== 0) {
      const playDelta = (playSpeed * delta) / 16;

      acceleration.multiplyScalar(playDelta);
      velocity.add(acceleration);
      velocity.setLength(maxVelocity);
      // velocity.setLength(variables.maxVelocity); // TODO vb asendada hõõrdejõuga ja hõõrdejõu tugevus sõltuvalt cohesion tugevusest :OOOOOOO
      // setArrow(boid.helpArrows[5], velocity);

      const velClone = velocity.clone();
      velClone.multiplyScalar(playDelta);

      // let speed = (simplex.noise2D(boid.ownTime / 1, boid.index) + 1) / 2;

      let speed =
        (simplex.noise4D(
          boid.position.x * 0.2,
          boid.position.y * 0.2,
          boid.position.z * 0.2,
          boid.ownTime * 0.01
        ) +
          1) /
        2;

      if (variables.randomSpeedMin !== 1) {
        if (speed < variables.randomSpeedMin) speed = variables.randomSpeedMin;
        position.add(velClone.multiplyScalar(speed * 2));
        // if (boid.subject)
        //   console.log(
        //     "-".repeat(10 * speed) + "#" + "-".repeat(10 * (1 - speed)),
        //     speed
        //   );
      } else {
        position.add(velClone);
      }

      boidDirection(velClone, boid);

      boid.ownTime += playDelta / 5000;

      if (variables.animateVertices && variables.meshType == 2)
        vertexAnimation(boid.meshTypes[meshType], acceleration);

      acceleration.multiplyScalar(0);
    }
  }
}

function boidDirection(velClone, boid) {
  velClone.add(boid.position);
  const mesh = boid.meshTypes[variables.meshType];
  boid.meshTypes[0].lookAt(velClone);
  mesh.lookAt(velClone);

  if (variables.meshType > 0) {
    mesh.rotateY(THREE.Math.degToRad(-90));
  }
}

function rules(boid) {
  const sep = new THREE.Vector3();
  const ali = new THREE.Vector3();
  const coh = new THREE.Vector3();
  let cohNeighbours = 0;

  for (let i = 0; i < variables.boidCount; i++) {
    const flockmate = boids[i];
    const dist = boid.position.distanceTo(flockmate.position);

    if (boid.index !== flockmate.index) {
      // separation
      if (dist < variables.separationDist) {
        const diff = boid.position.clone().sub(flockmate.position);
        diff.setLength(1 - dist / variables.separationDist);
        sep.add(diff);
      }

      // alignment
      if (dist < variables.alignmentDist) {
        const vel = flockmate.velocity.clone();
        vel.setLength(1 - dist / variables.alignmentDist);
        ali.add(vel);
      }

      // cohesion
      if (dist < variables.cohesionDist) {
        const pos = flockmate.position.clone();
        coh.add(pos);
        cohNeighbours++;
      }
    }
  }

  sep.clampLength(0, 1);
  ali.clampLength(0, 1);

  if (cohNeighbours > 0) {
    coh.divideScalar(cohNeighbours);
    coh.sub(boid.position);
    coh.multiplyScalar(0.1);
  }

  return { ali, sep, coh };
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

function floor(boid) {
  const floorDist = 5;
  const steer = new THREE.Vector3();

  if (typeof env !== "undefined") {
    const x = boid.position.x;
    const z = boid.position.z;
    const y = boid.position.y;
    const floorY = noisePlane(x, -z);

    if (floorY + floorDist > y) {
      steerY = (floorDist - (y - floorY)) / floorDist;
      steerY = Math.pow(steerY, 2);
      steer.y = steerY;
    }
  }

  return steer;
}

function random(boid) {
  // const steer = new THREE.Vector3(
  //   Math.random() - 0.5,
  //   Math.random() - 0.5,
  //   Math.random() - 0.5
  // );
  const steer = new THREE.Vector3(
    simplex.noise2D(boid.ownTime, (boid.index + 1) * 10),
    simplex.noise2D(boid.ownTime, (boid.index + 1) * 100),
    simplex.noise2D(boid.ownTime, (boid.index + 1) * 1000)
  );

  return steer;
}

function setArrow(arrow, vec) {
  if (vec.length() <= 0) {
    arrow.visible = false;
  } else {
    const len = vec.length() * 12;
    arrow.setLength(len, 0.1, 0.1);
    arrow.setDirection(vec.clone().normalize());
    arrow.visible = true;
  }
}

function makeArrow(vec) {
  if (asd !== 3) return;
  const arrow = new THREE.ArrowHelper();
  setArrow(arrow, vec);
  scene.add(arrow);
}

function colorBoid(boid, value) {
  boid.mesh.material.color.setRGB(0, value, value);
}
