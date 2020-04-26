// TODO: make boid a class

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
  acceleration.y *= 0.8; // TODO: think about this more

  // velocity.multiplyScalar(0.8);
  velocity.add(acceleration);
  if (boid.predator) velocityRules(boid, playDelta);

  velocity.clampLength(0, maxSpeed);
  const velClone = velocity.clone();
  velClone.multiplyScalar(playDelta);
  position.add(velClone);

  boidDirection(velClone, boid);
  if (boid.subject && drawTail) addLineSegment(boid.tailLine, boid.position);
  // if (drawTail && boid.index % 7 == 0)
  // addLineSegment(boid.tailLine, boid.position);
}

function velocityRules(boid, playDelta) {
  const atk = velattack(boid);
  atk.multiplyScalar(playDelta);
  rules = [{ vec: atk, scalar: vars.attackScalar }];
  applyRules(rules, boid.velocity);
}

accArray1 = [];
sepArray1 = [];
aliArray1 = [];
cohArray1 = [];
accArray2 = [];
sepArray2 = [];
aliArray2 = [];
cohArray2 = [];
counter = 0;

function accelerationRules(boid) {
  const { acceleration } = boid;
  const rey = reynolds(boid, boids);
  const sep = rey[0];
  const ali = rey[1];
  const coh = rey[2];
  acceleration.set(0, 0, 0);
  const bnd = bounds(boid);
  const ran = random(boid);
  const fld = obstacles(boid);
  const exp = experiments(boid);

  // if (boid.subject) {
  //   const counterAmount = 10;
  //   const valueAmount = 4000;
  //   // TODO: MAKE COHESION RADIUS SMALL SO MORE FLICKERING
  //   if (boid.subject) {
  //     if (accArray1.length < valueAmount) {
  //       if (counter < counterAmount) {
  //         counter += 1;
  //         if (counter == counterAmount) console.log("counter over");
  //       } else {
  //         if (accArray1.length % 100 === 0) console.log(accArray1.length);

  //         values1 = reynolds(boid, boids, -1);
  //         // sepArray1.push(values1[0].x);
  //         // aliArray1.push(values1[1].x);
  //         // cohArray1.push(values1[2].x);
  //         const acc1 = new THREE.Vector3();
  //         acc1.add(values1[0].multiplyScalar(vars.separationScalar));
  //         acc1.add(values1[1].multiplyScalar(vars.alignmentScalar));
  //         acc1.add(values1[2].multiplyScalar(vars.cohesionScalar));
  //         accArray1.push(acc1.x);

  //         values2 = reynolds(boid, boids, 1);
  //         // sepArray2.push(values2[0].x);
  //         // aliArray2.push(values2[1].x);
  //         // cohArray2.push(values2[2].x);
  //         const acc2 = new THREE.Vector3();
  //         acc2.add(values2[0].multiplyScalar(vars.separationScalar));
  //         acc2.add(values2[1].multiplyScalar(vars.alignmentScalar));
  //         acc2.add(values2[2].multiplyScalar(vars.cohesionScalar));
  //         accArray2.push(acc2.x);

  //         // console.log(sepArray1.length);
  //         // counter = 0;
  //       }
  //     } else if (accArray1.length === valueAmount) {
  //       let data1 = "acceleration,separation,alignment,cohesion\n";
  //       let data2 = "acceleration,separation,alignment,cohesion\n";
  //       for (let i = 0; i < valueAmount; i++) {
  //         data1 += accArray1[i] + "\n";
  //         // sepArray1[i] + "," + aliArray1[i] + "," + cohArray1[i] + "\n";
  //         data2 += accArray2[i] + "\n";
  //         // sepArray2[i] + "," + aliArray2[i] + "," + cohArray2[i] + "\n";
  //       }
  //       console.log(data1);
  //       console.log(data2);
  //       accArray1.push(0);
  //     }
  //   }
  // }

  let rules;
  if (boid.predator) {
    // TODO: sep here is wrong!
    const atk = attack(boid, boids, vars.boidCount);
    rules = [
      { vec: sep, scalar: vars.separationScalar },
      { vec: bnd, scalar: vars.boundsScalar / 1.5 },
      { vec: ran, scalar: vars.randomScalar / 2 },
      { vec: atk, scalar: vars.attackScalar },
    ];
  } else {
    // const fed = feed(boid); // VEL RULE!
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
      // { name: "fed", vec: fed, scalar: vars.feedScalar },
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
