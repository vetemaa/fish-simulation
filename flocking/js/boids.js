function addBoids() {
  for (let i = 0; i < boidTotalCount; i++) {
    addBoid(
      [
        vars.boundSize * Math.random(),
        vars.boundSize * Math.random(),
        vars.boundSize * Math.random()
      ],
      i
    );
    // addBoid([0, 0, i * 1]);
  }
  boids[0].subject = true;
  hideBoids(vars.boidCount);
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
  boid.mesh = coneMesh;

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
  [0xffffff, 0xff9999, 0x99ff99, 0x9999ff, 0xf6ff99, 0x00fff5].forEach(
    color => {
      const arrow = new THREE.ArrowHelper();
      arrow.setColor(color);
      helpArrows.add(arrow);
      arrow.visible = false;
    }
  );

  boid.position.set(...position);
  boids.push(boid);
  scene.add(boid);

  boidDirection(boid.velocity.clone(), boid);
}

function animateBoids(delta) {
  if (delta > 1000) delta = 0; // when tab not open

  for (let i = 0; i < vars.boidCount; i++) {
    const boid = boids[i];
    const { velocity, acceleration, position } = boid;

    const { sep, ali, coh } = reynolds(boid);
    const bnd = bounds(boid);
    const ran = random(boid);
    const flr = floor(boid);
    rules = [
      { vec: sep, enabled: 1, arr: 0, scalar: vars.separationScalar },
      { vec: ali, enabled: 1, arr: 0, scalar: vars.alignmentScalar },
      { vec: coh, enabled: 1, arr: 0, scalar: vars.cohesionScalar },
      { vec: bnd, enabled: 1, arr: 0, scalar: vars.boundsScalar },
      { vec: ran, enabled: 1, arr: 0, scalar: vars.randomScalar },
      { vec: flr, enabled: 1, arr: 0, scalar: null }
    ];
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      rule.scalar && rule.vec.multiplyScalar(rule.scalar);
      rule.enabled && acceleration.add(rule.vec);
      rule.arr && setArrow(boid.helpArrows.children[i], rule.vec);
    }

    acceleration.multiplyScalar(0.005);
    acceleration.multiplyScalar(vars.ruleScalar);
    acceleration.y *= 0.8;

    if (boid.subject) {
      boid.mesh.material.color.setHex(0x00fff5);
    }

    const { play, playSpeed, maxVelocity, meshType } = vars;
    if (play && playSpeed !== 0 && maxVelocity !== 0) {
      const playDelta = (playSpeed * delta) / 16;

      acceleration.multiplyScalar(playDelta);
      velocity.add(acceleration);
      velocity.setLength(maxVelocity);
      // velocity.setLength(vars.maxVelocity); // TODO vb asendada hõõrdejõuga ja hõõrdejõu tugevus sõltuvalt cohesion tugevusest :OOOOOOO
      // setArrow(boid.helpArrows[5], velocity);

      const velClone = velocity.clone();
      velClone.multiplyScalar(playDelta);

      // let speed = (simplex.noise2D(boid.ownTime / 1, boid.index) + 1) / 2;

      // let speed =
      //   (simplex.noise4D(
      //     boid.position.x * 0.2,
      //     boid.position.y * 0.2,
      //     boid.position.z * 0.2,
      //     boid.ownTime * 0.01
      //   ) +
      //     1) /
      //   2;

      // if (vars.randomSpeedMin !== 1) {
      //   if (speed < vars.randomSpeedMin) speed = vars.randomSpeedMin;
      //   position.add(velClone.multiplyScalar(speed * 2));
      //   // if (boid.subject)
      //   //   console.log(
      //   //     "-".repeat(10 * speed) + "#" + "-".repeat(10 * (1 - speed)),
      //   //     speed
      //   //   );
      // } else {
      //   position.add(velClone);
      // }
      position.add(velClone);

      boidDirection(velClone, boid);

      boid.ownTime += playDelta / 5000;

      if (vars.animateVertices && vars.meshType == 2)
        vertexAnimation(boid.meshTypes[meshType], acceleration);

      acceleration.multiplyScalar(0);
    }
  }
}

function boidDirection(velClone, boid) {
  velClone.add(boid.position);
  boid.mesh.lookAt(velClone);
}

function colorBoid(boid, value) {
  boid.mesh.material.color.setRGB(0, value, value);
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
