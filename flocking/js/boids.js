// green, red, indigo, yellow, orange, grey
const colors = [
  "#fff",
  "#66bb6a",
  "#e57373",
  "#5d7ada",
  "#dce775",
  "#ffb74d",
  "#6f4b2e",
  "#64c3ec"
];

function addBoids() {
  const { boundSize } = vars;
  for (let i = 0; i < boidTotalCount; i++) {
    const boid = addBoid([boundSize / 2, boundSize / 2, boundSize / 2], i);
    boids.push(boid);
  }
  shuffleBoids();

  boids[0].subject = true;
  subject = boids[0];
  // subject.mesh.material.wireframe = false;

  // drawCircle(subject, vars.separationRadius);

  // boidpos = [
  //   [9.9, 10, 9.9], [11.3, 10, 11.3], [10.7, 10, 9.3]
  // ];
  // boid1pos = new THREE.Vector3(9.9, 10, 9.9);
  // boid2pos = new THREE.Vector3(10.7, 10, 11.5);
  // boid3pos = new THREE.Vector3(10.9, 10, 9.5);
  // boids[0].velocity = boid1pos.clone().sub(new THREE.Vector3(10, 10, 10));
  // boids[1].velocity = boid2pos.clone().sub(new THREE.Vector3(10, 10, 10));
  // boids[2].velocity = boid3pos.clone().sub(new THREE.Vector3(10, 10, 10));
  // boids[0].position.copy(boid1pos);
  // boids[1].position.copy(boid2pos);
  // boids[2].position.copy(boid3pos);

  hideBoids(boids, vars.boidCount);
}

function addPredators() {
  for (let i = 0; i < predatorTotalCount; i++) {
    const predator = addBoid([0, 0, 0], i);
    predator.predator = true;
    predator.rest = true;
    predator.lastTime = predator.ownTime;
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

  const mat = new THREE.MeshBasicMaterial({
    wireframe: true
  });

  const geom = new THREE.ConeBufferGeometry(0.3, 1);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.geometry.rotateX(THREE.Math.degToRad(90));
  boid.mesh = mesh;
  boid.add(mesh);

  // boid.velocity = new THREE.Vector3();
  boid.velocity = new THREE.Vector3(rand(), rand(), rand());
  boid.velocity.setLength(0.1);
  boid.acceleration = new THREE.Vector3();

  var helpArrows = new THREE.Group();
  helpArrows.visible = vars.showVectors;
  boid.helpArrows = helpArrows;
  boid.add(helpArrows);
  // green, red, indigo, yellow, orange, grey
  colors.forEach(color => {
    const arrow = new THREE.ArrowHelper();
    arrow.setColor(color);
    helpArrows.add(arrow);
    arrow.visible = false;
  });

  boid.noise = {
    x: { a: null, b: rand(), cumWavLen: 0 },
    y: { a: null, b: rand(), cumWavLen: 0 },
    z: { a: null, b: rand(), cumWavLen: 0 }
  };

  var tailLine = new THREE.Group();
  tailLine.name = "tailLine";
  tailLine.color = 0xff00ff;
  boid.tailLine = tailLine;
  // tailLine.previous = new THREE.Vector3(...position);
  scene.add(tailLine);

  boid.position.set(...position);
  scene.add(boid);

  boidDirection(boid.velocity.clone(), boid);

  return boid;
}

function drawCircle(boid, dist) {
  const circleGeom = new THREE.Geometry();
  for (let i = 0; i < 2.1 * Math.PI; i += 0.1) {
    circleGeom.vertices.push(new THREE.Vector3(Math.sin(i), 0, Math.cos(i)));
  }
  const circle = new THREE.Line(
    circleGeom,
    new THREE.LineBasicMaterial({
      color: 0x66bb6a
    })
  );

  circle.scale.set(dist, dist, dist);
  boid.add(circle);
}

function moveBoids(delta) {
  if (delta > 3000) delta = 0; // when tab not open

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
  const fed = newfeed(boid);
  // if (boid.subject) console.log(ran);
  rules = [
    { vec: sep, enabled: 1, arr: 2, scalar: vars.separationScalar },
    { vec: ali, enabled: 1, arr: 1, scalar: vars.alignmentScalar },
    { vec: coh, enabled: 1, arr: 3, scalar: vars.cohesionScalar },
    { vec: bnd, enabled: 1, arr: 6, scalar: vars.boundsScalar },
    { vec: ran, enabled: 1, arr: 5, scalar: vars.randomScalar },
    { vec: avd, enabled: 1, arr: 7, scalar: vars.escapeScalar }
    // { vec: newfeed, enabled: 1, arr: 4, scalar: vars.feedScalar }
  ];

  calculateAcceleration(boid, rules);
  boid.acceleration.multiplyScalar(vars.ruleScalar);
  applyAcceleration(delta, boid, vars.maxSpeed);

  // if (boid.subject && vars.drawTail) addTailSegment(boid);
  if (boid.subject && vars.drawTail)
    addLineSegment(boid.tailLine, boid.position.clone());
}

function movePredator(delta, boid) {
  const { sep } = reynolds(boid, predators, vars.predatorCount);
  const atk = attack(boid, boids, vars.boidCount);
  const bnd = bounds(boid);
  const ran = random(boid);

  rules = [
    { vec: atk, enabled: 1, arr: 1, scalar: vars.attackScalar },
    { vec: sep, enabled: 1, arr: 2, scalar: vars.separationScalar },
    { vec: bnd, enabled: 1, arr: 3, scalar: vars.boundsScalar / 10 },
    { vec: ran, enabled: 1, arr: 0, scalar: vars.randomScalar / 2 }
  ];

  calculateAcceleration(boid, rules);
  boid.acceleration.multiplyScalar(vars.ruleScalar_p);
  applyAcceleration(delta, boid, vars.maxSpeed_p);
}

function calculateAcceleration(boid, rules) {
  const { acceleration } = boid;

  acceleration.set(0, 0, 0);

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const { enabled, arr, scalar, acc } = rule;
    let { vec } = rule;

    if (scalar === 0) continue;

    // console.log(vec);
    if (vec instanceof Function) {
      rule.vec = vec(boid);
      vec = rule.vec;
    }

    scalar && vec.multiplyScalar(scalar);
    if (enabled) acceleration.add(vec);

    if (boid.subject && enabled && arr && vars.showVectors)
      setArrow(boid.helpArrows.children[arr], vec);
  }

  if (boid.subject) setArrow(boid.helpArrows.children[0], boid.acceleration);
  if (boid.subject) setInfo(rules, boid.acceleration.clone());
  acceleration.multiplyScalar(0.005);
  acceleration.y *= 0.7;
}

function applyAcceleration(delta, boid, maxSpeed) {
  const { velocity, acceleration, position } = boid;
  const { playSpeed } = vars;
  let velClone;

  if (playSpeed == 0 || maxSpeed == 0) return;
  const playDelta = (playSpeed * delta) / 8;

  acceleration.multiplyScalar(playDelta);
  // acceleration.clampLength(0, maxSpeed); // maxspeed other option
  // console.log(acceleration.length());
  // acceleration.clampLength(0, vars.maxAcceleration); // maxspeed other option
  // acceleration.multiplyScalar(0.1);
  velocity.add(acceleration);
  if (!boid.predator) steerVelocity(boid, playDelta);
  // velocity.multiplyScalar(0.96); // drag TODO: drag ka delta
  // velocity.setLength(maxSpeed); // constspeed
  velocity.clampLength(0, maxSpeed); // maxspeed
  velClone = velocity.clone();
  velClone.multiplyScalar(playDelta);
  position.add(velClone);

  boidDirection(velClone, boid);
  boid.ownTime += playDelta / 5000;
}

function steerVelocity(boid, playDelta) {
  rules = [{ vec: velfeed, enabled: 1, arr: 4, scalar: vars.feedScalar }];

  const rule = rules[0];
  const { enabled, arr, scalar, acc } = rule;
  let { vec } = rule;

  if (scalar === 0) return;

  // console.log(vec);
  if (vec instanceof Function) {
    rule.vec = vec(boid);
    rule.vec.multiplyScalar(playDelta);
    vec = rule.vec;
  }

  scalar && vec.multiplyScalar(scalar);
  if (enabled) boid.velocity.add(vec);

  if (boid.subject && enabled && arr && vars.showVectors)
    setArrow(boid.helpArrows.children[arr], vec);

  if (boid.subject) setArrow(boid.helpArrows.children[0], boid.acceleration);
  // if (boid.subject) setInfo(rules, boid.acceleration.clone());
  // acceleration.multiplyScalar(0.005);
  // acceleration.y *= 0.7;
}

function boidDirection(velClone, boid) {
  velClone.add(boid.position);
  boid.mesh.lookAt(velClone);
}

function setArrow(arrow, vec) {
  if (vec.length() <= 0) {
    arrow.visible = false;
  } else {
    arrow.len = vec.length();
    setArrowLen(arrow);
    arrow.setDirection(vec.clone().normalize());
    arrow.visible = true;
  }
}

function setArrowLen(arrow) {
  const len = arrow.len * vars.vectorLenMultiplier;
  arrow.setLength(len, 0.1, 0.1);
}
