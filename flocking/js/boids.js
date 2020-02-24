function addBoids() {
  const { boundSize } = vars;
  for (let i = 0; i < boidTotalCount; i++) {
    const boid = addBoid([boundSize / 2, boundSize / 2, boundSize / 2], i);
    boids.push(boid);
  }
  // shuffleBoids();

  boids[0].subject = true;
  subject = boids[0];
  var tailLines = new THREE.Group();
  tailLines.name = "tailLines";
  boids[0].tailLines = tailLines;
  tailLines.previous = new THREE.Vector3(boids[0].position);
  scene.add(tailLines);

  hideBoids(boids, vars.boidCount);
}

function addPredators() {
  for (let i = 0; i < predatorTotalCount; i++) {
    const predator = addBoid([0, 0, 0], i);
    predator.scale.set(2, 2, 2);
    predator.mesh.material.color.setHex(0xff5555);
    predators.push(predator);
  }

  hideBoids(predators, vars.predatorCount);
}

function addBoid(position, index) {
  const boid = new THREE.Group();
  boid.index = index;
  boid.ownTime = 0;

  const mat = new THREE.MeshBasicMaterial({ wireframe: true });

  const geom = new THREE.ConeBufferGeometry(0.3, 1);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.geometry.rotateX(THREE.Math.degToRad(90));
  boid.mesh = mesh;
  boid.add(mesh);

  // boid.velocity = new THREE.Vector3();
  boid.velocity = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  );
  boid.acceleration = new THREE.Vector3();

  var helpArrows = new THREE.Group();
  helpArrows.visible = vars.showVectors;
  boid.helpArrows = helpArrows;
  boid.add(helpArrows);
  // green, red, indigo, yellow, orange, grey
  [0x66bb6a, 0xe57373, 0x5c6bc0, 0xdce775, 0xffb74d, 0xbdbdbd].forEach(
    color => {
      const arrow = new THREE.ArrowHelper();
      arrow.setColor(color);
      helpArrows.add(arrow);
      arrow.visible = false;
    }
  );

  boid.position.set(...position);
  scene.add(boid);

  boidDirection(boid.velocity.clone(), boid);

  return boid;
}

function addTailSegment(boid) {
  const lineGeometry = new THREE.Geometry();
  lineGeometry.vertices.push(boid.tailLines.previous.clone());
  lineGeometry.vertices.push(boid.position);
  const line = new THREE.Line(
    lineGeometry,
    new THREE.LineBasicMaterial({
      color: 0xff00ff
      // transparent: true,
      // opacity: 1
    })
  );

  boid.tailLines.add(line);
  boid.tailLines.previous.copy(boid.position);
}

function moveBoids(delta) {
  if (delta > 1000) delta = 0; // when tab not open

  preys = [];
  for (let i = 0; i < vars.predatorCount; i++) {
    movePredator(delta, predators[i]);
    if (predators[i].preyIndex) preys.push(predators[i].preyIndex);
  }

  for (let i = 0; i < vars.boidCount; i++) {
    moveBoid(delta, boids[i]);
    if (preys.includes(boids[i].index))
      boids[i].mesh.material.color.setHex(0x66ff66);
    else if (boids[i].subject) boids[i].mesh.material.color.setHex(0xff00ff);
    else boids[i].mesh.material.color.setHex(0xffffff);
  }
}

function moveBoid(delta, boid) {
  const { sep, ali, coh } = reynolds(boid, boids, vars.boidCount);
  const avd = escape(boid, predators, vars.predatorCount);
  const bnd = bounds(boid);
  const ran = random(boid);
  rules = [
    { vec: avd, enabled: 1, arr: 0, scalar: vars.predatorDist },
    { vec: sep, enabled: 1, arr: 1, scalar: vars.separationScalar },
    { vec: ali, enabled: 1, arr: 2, scalar: vars.alignmentScalar },
    { vec: coh, enabled: 1, arr: 0, scalar: vars.cohesionScalar },
    { vec: bnd, enabled: 1, arr: 0, scalar: vars.boundsScalar },
    { vec: ran, enabled: 0, arr: 0, scalar: vars.randomScalar }
  ];

  calculateAcceleration(boid, rules);
  boid.acceleration.multiplyScalar(vars.ruleScalar);
  applyAcceleration(delta, boid, vars.maxVelocity);

  if (boid.subject && vars.drawTail) addTailSegment(boid);
  // addTailSegment(boid);
}

function movePredator(delta, boid) {
  const { sep } = reynolds(boid, predators, vars.predatorCount);
  const atk = attack(boid, boids, vars.boidCount);
  const bnd = bounds(boid);
  const ran = random(boid);

  rules = [
    { vec: atk, enabled: 1, arr: 0, scalar: vars.attackScalar },
    { vec: sep, enabled: 1, arr: 0, scalar: vars.separationScalar },
    { vec: bnd, enabled: 1, arr: 0, scalar: vars.boundsScalar * 4 },
    { vec: ran, enabled: 1, arr: 0, scalar: vars.randomScalar / 2 }
  ];

  calculateAcceleration(boid, rules);
  boid.acceleration.multiplyScalar(vars.ruleScalar_p);
  applyAcceleration(delta, boid, vars.maxVelocity_p);
}

function calculateAcceleration(boid, rules) {
  const { acceleration } = boid;

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    if (rule.scalar === 0) continue;
    rule.scalar && rule.vec.multiplyScalar(rule.scalar);
    rule.enabled && acceleration.add(rule.vec);
    rule.arr && setArrow(boid.helpArrows.children[rule.arr - 1], rule.vec);
  }

  acceleration.multiplyScalar(0.005);
  acceleration.y *= 0.8;
}

function applyAcceleration(delta, boid, maxVelocity) {
  const { velocity, acceleration, position } = boid;
  const { play, playSpeed } = vars;

  if (!play || playSpeed == 0 || maxVelocity == 0) return;

  const playDelta = (playSpeed * delta) / 16;
  boid.ownTime += playDelta / 5000;

  acceleration.multiplyScalar(playDelta);
  velocity.add(acceleration);
  velocity.setLength(maxVelocity);

  // TODO vb asendada hõõrdejõuga ja
  // hõõrdejõu tugevus sõltuvalt cohesion tugevusest :O

  const velClone = velocity.clone();
  velClone.multiplyScalar(playDelta);
  position.add(velClone);

  boidDirection(velClone, boid);
  acceleration.multiplyScalar(0);
}

function boidDirection(velClone, boid) {
  velClone.add(boid.position);
  boid.mesh.lookAt(velClone);
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
