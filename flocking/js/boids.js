function addBoids() {
  const { boundSize } = vars;
  for (let i = 0; i < boidTotalCount; i++) {
    const boid = addBoid([boundSize / 2, boundSize / 2, boundSize / 2], i);
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
    predator.rest = false;
    predator.lastTime = predator.ownTime;
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
    x: { a: null, b: rand(), cumWavLen: 0 },
    y: { a: null, b: rand(), cumWavLen: 0 },
    z: { a: null, b: rand(), cumWavLen: 0 }
  };

  // helper arrows
  var helpArrows = new THREE.Group();
  helpArrows.visible = vars.showVectors;
  boid.helpArrows = helpArrows;
  colors.forEach(color => {
    const arrow = new THREE.ArrowHelper();
    arrow.setColor(color);
    helpArrows.add(arrow);
    arrow.visible = false;
  });
  boid.add(helpArrows);

  // travelled path line
  var tailLine = new THREE.Group();
  tailLine.name = "tailLine";
  tailLine.color = 0xff00ff;
  boid.tailLine = tailLine;
  scene.add(tailLine);

  return boid;
}

function moveBoids(delta) {
  if (delta > 3000) delta = 0; // when tab not open
  preys = [];

  for (let i = 0; i < vars.predatorCount; i++) {
    const predator = predators[i];
    const rules = predatorRules(predator);

    moveBoid(delta, predator, rules, vars.ruleScalar_p, vars.maxSpeed_p);

    setBoidColor(predator, preys);
    // for prey color
    if (predator.preyIndex) preys.push(predator.preyIndex);
  }

  for (let i = 0; i < vars.boidCount; i++) {
    const boid = boids[i];
    const rules = boidRules(boid);

    moveBoid(delta, boid, rules, vars.ruleScalar, vars.maxSpeed);

    setBoidColor(boid, preys);
  }
}

function moveBoid(delta, boid, rules, ruleScalar, maxSpeed) {
  const { velocity, acceleration, position } = boid;
  const { playSpeed, feedScalar, attackScalar, drawTail } = vars;

  if (playSpeed == 0 || maxSpeed == 0) return;
  const playDelta = (playSpeed * delta) / 8;
  boid.ownTime += playDelta / 5000;

  acceleration.set(0, 0, 0);
  applyRules(boid, rules, acceleration);
  if (boid.subject) setArrow(boid.helpArrows.children[0], acceleration);
  if (boid.subject) setInfo(rules, acceleration.clone());
  acceleration.multiplyScalar(0.005 * ruleScalar * playDelta);
  acceleration.y *= 0.7;

  velocity.add(acceleration);

  if (boid.predator) {
    const atk = velattack(boid, boids, vars.boidCount);
    atk.multiplyScalar(playDelta);
    rules = [{ vec: atk, enabled: 1, arr: 4, scalar: attackScalar }];
  } else {
    const fed = velfeed(boid);
    fed.multiplyScalar(playDelta);
    rules = [{ vec: fed, enabled: 1, arr: 4, scalar: feedScalar }];
  }
  applyRules(boid, rules, boid.velocity);

  velocity.clampLength(0, maxSpeed);
  const velClone = velocity.clone();
  velClone.multiplyScalar(playDelta);
  position.add(velClone);

  boidDirection(velClone, boid);
  if (boid.subject && drawTail) addLineSegment(boid.tailLine, boid.position);
}

function boidRules(boid) {
  const { sep, ali, coh } = reynolds(boid, boids, vars.boidCount);
  const avd = escape(boid, predators, vars.predatorCount);
  const bnd = bounds(boid);
  const ran = random(boid);
  // const fed = feed(boid);
  const rules = [
    { vec: sep, enabled: 1, arr: 1, scalar: vars.separationScalar },
    { vec: ali, enabled: 1, arr: 2, scalar: vars.alignmentScalar },
    { vec: coh, enabled: 1, arr: 3, scalar: vars.cohesionScalar },
    { vec: bnd, enabled: 1, arr: 5, scalar: vars.boundsScalar },
    { vec: ran, enabled: 1, arr: 6, scalar: vars.randomScalar },
    { vec: avd, enabled: 1, arr: 7, scalar: vars.avoidScalar }
    // { vec: fed, enabled: 1, arr: 4, scalar: vars.feedScalar }
  ];

  return rules;
}

function predatorRules(boid) {
  const { sep } = reynolds(boid, predators, vars.predatorCount);
  // const atk = attack(boid, boids, vars.boidCount);
  const bnd = bounds(boid);
  const ran = random(boid);

  const rules = [
    // { vec: atk, enabled: 1, arr: 1, scalar: vars.attackScalar },
    { vec: sep, enabled: 1, arr: 1, scalar: vars.separationScalar },
    { vec: bnd, enabled: 1, arr: 5, scalar: vars.boundsScalar / 1.5 },
    { vec: ran, enabled: 1, arr: 6, scalar: vars.randomScalar / 2 }
  ];

  return rules;
}

function applyRules(boid, rules, vector) {
  for (let i = 0; i < rules.length; i++) {
    const { enabled, arr, scalar, vec } = rules[i];
    if (!enabled || scalar === 0) continue;

    vec.multiplyScalar(scalar);
    vector.add(vec);

    if (boid.subject && arr && vars.showVectors)
      setArrow(boid.helpArrows.children[arr], vec);
  }
}

function boidDirection(velClone, boid) {
  boid.mesh.lookAt(velClone.add(boid.position));
}
