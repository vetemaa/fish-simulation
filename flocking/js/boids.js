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

  // time = Date.now();
  // for (let i = 0; i < 10000000; i++) {
  //   simplex.noise2D(i);
  // }
  // console.log("simplex took: ", Date.now() - time);
  // time = Date.now();
  // for (let i = 0; i < 10000000; i++) {
  //   // noise(i, boids[0], "x");
  //   interpolate(0, 1, i / 10000000);
  // }
  // console.log("noise took: ", Date.now() - time);
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
    z: { a: null, b: rand(), cumWavLen: 0 },
  };

  // helper arrows
  var helpArrows = new THREE.Group();
  helpArrows.visible = vars.showVectors;
  boid.helpArrows = helpArrows;
  colors.forEach((color) => {
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
  acceleration.y *= 0.7;

  velocity.add(acceleration);
  velocityRules(boid, playDelta);

  velocity.clampLength(0, maxSpeed);
  const velClone = velocity.clone();
  velClone.multiplyScalar(playDelta);
  position.add(velClone);

  boidDirection(velClone, boid);
  if (boid.subject && drawTail) addLineSegment(boid.tailLine, boid.position);
}

function velocityRules(boid, playDelta) {
  const { feedScalar, attackScalar } = vars;

  if (boid.predator) {
    const atk = velattack(boid);
    atk.multiplyScalar(playDelta);
    rules = [{ vec: atk, enabled: 1, arr: 4, scalar: attackScalar }];
  } else {
    const fed = velfeed(boid);
    fed.multiplyScalar(playDelta);
    rules = [{ vec: fed, enabled: 1, arr: 4, scalar: feedScalar }];
  }

  applyRules(boid, rules, boid.velocity);
}

sepArray1 = [];
aliArray1 = [];
cohArray1 = [];
sepArray2 = [];
aliArray2 = [];
cohArray2 = [];
counter = 0;

function accelerationRules(boid) {
  const { acceleration } = boid;
  let { sep, ali, coh } = reynolds(boid, boids);
  acceleration.set(0, 0, 0);
  const bnd = bounds(boid);
  const ran = random(boid);
  const fld = vectorfield(boid);

  // if (boid.subject) {
  //   const counterAmount = 10;
  //   const valueAmount = 3000;
  //   // TODO: MAKE COHESION RADIUS SMALL SO MORE FLICKERING
  //   if (boid.subject) {
  //     if (sepArray1.length < valueAmount) {
  //       if (counter < counterAmount) {
  //         counter += 1;
  //         if (counter == counterAmount) console.log("counter over");
  //       } else {
  //         if (sepArray1.length % 100 === 0) console.log(sepArray1.length);
  //         values1 = reynolds(boid, boids, -1);
  //         sepArray1.push(values1.sep.x);
  //         aliArray1.push(values1.ali.x);
  //         cohArray1.push(values1.coh.x);
  //         values2 = reynolds(boid, boids, 1);
  //         sepArray2.push(values2.sep.x);
  //         aliArray2.push(values2.ali.x);
  //         cohArray2.push(values2.coh.x);
  //         // console.log(sepArray1.length);
  //         // counter = 0;
  //       }
  //     } else if (sepArray1.length === valueAmount) {
  //       let data1 = "separation,alignment,cohesion\n";
  //       let data2 = "separation,alignment,cohesion\n";
  //       for (let i = 0; i < valueAmount; i++) {
  //         data1 += -sepArray1[i] + "\n";
  //         // sepArray1[i] + "," + aliArray1[i] + "," + cohArray1[i] + "\n";
  //         data2 += -sepArray2[i] + "\n";
  //         // sepArray2[i] + "," + aliArray2[i] + "," + cohArray2[i] + "\n";
  //       }
  //       console.log(data1);
  //       console.log(data2);
  //       sepArray1.push(0);
  //     }
  //   }
  // }

  let rules;
  if (boid.predator) {
    // const atk = attack(boid, boids, vars.boidCount);
    rules = [
      { vec: sep, enabled: 1, arr: 1, scalar: vars.separationScalar },
      { vec: bnd, enabled: 1, arr: 5, scalar: vars.boundsScalar / 1.5 },
      { vec: ran, enabled: 1, arr: 6, scalar: vars.randomScalar / 2 },
      // { vec: atk, enabled: 1, arr: 1, scalar: vars.attackScalar },
    ];
  } else {
    // const fed = feed(boid);
    const avd = escape(boid, predators, vars.predatorCount);
    rules = [
      { vec: sep, enabled: 1, arr: 1, scalar: vars.separationScalar },
      { vec: ali, enabled: 1, arr: 2, scalar: vars.alignmentScalar },
      { vec: coh, enabled: 1, arr: 3, scalar: vars.cohesionScalar },
      { vec: bnd, enabled: 1, arr: 5, scalar: vars.boundsScalar },
      { vec: ran, enabled: 1, arr: 6, scalar: vars.randomScalar },
      { vec: avd, enabled: 1, arr: 7, scalar: vars.avoidScalar },
      { vec: fld, enabled: 1, arr: 0, scalar: vars.fieldScalar },
      // { vec: fed, enabled: 1, arr: 4, scalar: vars.feedScalar },
    ];
  }

  applyRules(boid, rules, acceleration);
  if (boid.subject) setArrow(boid.helpArrows.children[0], acceleration);
  if (boid.subject) setInfo(rules, acceleration.clone());
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
