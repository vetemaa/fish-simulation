function addBoids() {
  const { boundSize } = vars;
  for (let i = 0; i < boidTotalCount; i++) {
    const boid = addBoid([boundSize / 2, boundSize / 2, boundSize / 2], i);
    setBoidColor(boid);
    boids.push(boid);
  }
  shuffleBoids();

  boids[0].subject = true;
  subject = boids[0];

  changeBoidCount(boids, vars.boidCount);
}

function addPredators() {
  for (let i = 0; i < predatorTotalCount; i++) {
    const predator = addBoid([0, 0, 0], i);
    predator.predator = true;
    predator.rest = true;
    predator.restStartTime = 0;
    predator.scale.set(2, 2, 2);
    predator.mesh.material.color.setHex(0xff5555);
    predators.push(predator);
  }

  changeBoidCount(predators, vars.predatorCount);
}

function addBoid(position, index) {
  const boid = new THREE.Group();
  boid.index = index;
  boid.ownTime = 0;
  scene.add(boid);

  // mesh
  const mesh = new THREE.Mesh(
    new THREE.ConeBufferGeometry(0.3, 1),
    new THREE.MeshBasicMaterial({ wireframe: true })
  );
  mesh.geometry.rotateX(THREE.Math.degToRad(90));
  boid.mesh = mesh;
  boid.add(mesh);

  // vel, acc, pos
  boid.velocity = new THREE.Vector3(rand(), rand(), rand());
  boid.velocity.setLength(vars.maxSpeed);
  boid.acceleration = new THREE.Vector3();
  boid.position.set(...position);
  boidDirection(boid.velocity.clone(), boid);

  // start data for noise
  boid.noise = {
    x: { a: 0, b: rand(), cumWavLen: 0 },
    y: { a: 0, b: rand(), cumWavLen: 0 },
    z: { a: 0, b: rand(), cumWavLen: 0 },
  };

  // helper arrows
  addArrows(boid);

  // travelled path line
  var tailLine = new THREE.Group();
  tailLine.name = "tailLine";
  tailLine.color = 0xff00ff;
  boid.tailLine = tailLine;
  scene.add(tailLine);

  return boid;
}

function moveBoids(delta) {
  for (let i = 0; i < vars.predatorCount; i++) {
    const predator = predators[i];
    moveBoid(delta, predator, vars.ruleScalar_p, vars.maxSpeed_p);
    setBoidColor(predator);
  }

  for (let i = 0; i < vars.boidCount; i++) {
    const boid = boids[i];
    moveBoid(delta, boid, vars.ruleScalar, vars.maxSpeed);
    setBoidColor(boid);
  }
}

function moveBoid(delta, boid, ruleScalar, maxSpeed) {
  const { velocity, acceleration, position } = boid;
  const { playSpeed, drawTail } = vars;

  if (playSpeed == 0 || maxSpeed == 0) return;
  let playDelta = playSpeed * delta * 100;
  boid.ownTime += playDelta * 0.0002;

  accelerationRules(boid);
  acceleration.multiplyScalar(playDelta * ruleScalar * 0.005);
  acceleration.y *= 0.8; // to lessen vertical movement

  velocity.add(acceleration);
  if (boid.predator) velocityRules(boid, playDelta);

  velocity.clampLength(0, maxSpeed);
  const velClone = velocity.clone();
  velClone.multiplyScalar(playDelta);
  position.add(velClone);

  boidDirection(velClone, boid);
  if (boid.subject && drawTail) addLineSegment(boid.tailLine, boid.position);
}

function velocityRules(boid, playDelta) {
  const atk = velattack(boid);
  atk.multiplyScalar(playDelta);
  rules = [{ vec: atk, scalar: vars.attackScalar }];
  applyRules(rules, boid.velocity);
}

function accelerationRules(boid) {
  const { acceleration } = boid;
  acceleration.set(0, 0, 0);

  const bnd = bounds(boid);
  const ran = random(boid);
  const fld = obstacles(boid);
  const exp = experiments(boid);

  let rules;
  if (boid.predator) {
    const rey = reynolds(boid, predators);
    const sep = rey[0];
    rules = [
      { vec: sep, scalar: vars.separationScalar },
      { vec: bnd, scalar: vars.boundsScalar / 1.5 },
      { vec: ran, scalar: vars.randomScalar / 2 },
      { vec: fld, scalar: vars.obstacleScalar },
    ];
  } else {
    const rey = reynolds(boid, boids);
    const sep = rey[0];
    const ali = rey[1];
    const coh = rey[2];
    const esc = escape(boid, predators, vars.predatorCount);
    rules = [
      { name: "sep", vec: sep, scalar: vars.separationScalar },
      { name: "ali", vec: ali, scalar: vars.alignmentScalar },
      { name: "coh", vec: coh, scalar: vars.cohesionScalar },
      { name: "bnd", vec: bnd, scalar: vars.boundsScalar },
      { name: "ran", vec: ran, scalar: vars.randomScalar },
      { name: "esc", vec: esc, scalar: vars.escapeScalar },
      { name: "obs", vec: fld, scalar: vars.obstacleScalar },
      { name: "dir", vec: exp, scalar: 1 },
    ];
  }

  applyRules(rules, acceleration);
  if (boid.subject) {
    setInfo(rules);
    setInfoItem({ name: "acc", vec: acceleration.clone() });
  }
}

function applyRules(rules, vector) {
  for (let i = 0; i < rules.length; i++) {
    const { scalar, vec } = rules[i];
    vec.multiplyScalar(scalar);
    vector.add(vec);
  }
}
