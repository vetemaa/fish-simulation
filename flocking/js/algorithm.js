function reynolds(boid, flockmates, flockmateCount) {
  const mine = true;
  const sep = new THREE.Vector3();
  const ali = new THREE.Vector3();
  const coh = new THREE.Vector3();
  let sepNeighbours = 0;
  let aliNeighbours = 0;
  let cohNeighbours = 0;

  for (let i = 0; i < flockmateCount; i++) {
    const flockmate = flockmates[i];
    const dist = boid.position.distanceTo(flockmate.position);

    if (boid.index !== flockmate.index) {
      if (mine) {
        // separation - mine
        if (dist < vars.separationRadius) {
          const diff = boid.position.clone().sub(flockmate.position);
          diff.setLength(1 - dist / vars.separationRadius);
          sep.add(diff);
        }

        // alignment - mine
        if (dist < vars.alignmentRadius) {
          const vel = flockmate.velocity.clone();
          vel.setLength(1 - dist / vars.alignmentRadius);
          ali.add(vel);
        }

        // cohesion - mine TODO: vb pole smooth, hoopis teisiti peaks vist
        if (dist < vars.cohesionRadius) {
          const diff = flockmate.position.clone().sub(boid.position);
          diff.setLength(1 - dist / vars.cohesionRadius);
          coh.add(diff);
        }
      } else {
        // separation - {4}
        if (dist < vars.separationRadius) {
          const diff = boid.position.clone().sub(flockmate.position);
          sep.add(diff);
          sepNeighbours++;
        }

        // alignment - {4}
        if (dist < vars.alignmentRadius) {
          const vel = flockmate.velocity.clone();
          ali.add(vel);
        }

        // cohesion - {4}
        if (dist < vars.cohesionRadius) {
          const pos = flockmate.position.clone();
          coh.add(pos);
          cohNeighbours++;
        }
      }
    }
  }

  if (mine) {
    // separation - mine
    sep.clampLength(0, 1);

    // alignment - mine
    ali.clampLength(0, 1);

    // cohesion - mine
    coh.clampLength(0, 1);
  } else {
    // separation - {4}
    if (sepNeighbours > 0) sep.divideScalar(sepNeighbours);
    sep.divideScalar(2);

    // alignment - {4}
    if (aliNeighbours > 0) ali.divideScalar(aliNeighbours);
    ali.divideScalar(6);

    // cohesion - {4}
    if (cohNeighbours > 0) {
      coh.divideScalar(cohNeighbours);
      coh.sub(boid.position);
      // coh.multiplyScalar(0.1);
    }
  }

  return { ali, sep, coh };
}

function escape(boid, predators, predatorCount) {
  const steer = new THREE.Vector3();

  for (let i = 0; i < predatorCount; i++) {
    const predator = predators[i];
    const dist = boid.position.distanceTo(predator.position);

    if (dist < vars.escapeRadius) {
      const diff = boid.position.clone().sub(predator.position);
      diff.setLength(1 - dist / vars.escapeRadius);
      steer.add(diff);
    }
  }

  steer.clampLength(0, 1);

  return steer;
}

function velattack(boid, preys, preyCount) {
  const steer = new THREE.Vector3();

  let closestPrey;
  let closestDist = Infinity;

  if (boid.rest) {
    if (boid.lastTime + 0.4 < boid.ownTime) {
      boid.lastTime = boid.ownTime;
      boid.rest = false;
    }
  } else {
    if (boid.lastTime + 0.4 < boid.ownTime) {
      boid.lastTime = boid.ownTime;
      boid.rest = true;
    }
  }

  for (let i = 0; i < preyCount; i++) {
    const prey = preys[i];
    const dist = boid.position.distanceTo(prey.position);

    if (dist < 1) {
      boid.lastTime = boid.ownTime;
      boid.rest = true;
    }

    if (boid.preyIndex == null && dist < closestDist) {
      // esimesel kaardril otsib lähima // vb pigem statest sõltuv
      closestDist = dist;
      closestPrey = prey;
    } else if (dist + 5 < closestDist) {
      // hiljem lähima kui see 10 uniti jagu lähemal
      closestDist = dist;
      closestPrey = prey;
    }
  }

  if (closestDist < vars.attackRadius) {
    steer.add(closestPrey.position);
    steer.sub(boid.position);
    steer.sub(boid.velocity);
    let len = 1 - closestDist / vars.feedRadius;
    // let len = closestDist;
    len = Math.pow(len, 2);
    steer.setLength(len);
    boid.preyIndex = closestPrey.index;
  } else {
    boid.preyIndex = null;
  }

  steer.multiplyScalar(0.01);
  if (boid.rest) steer.multiplyScalar(0);

  return steer;
}

function attack(boid, preys, preyCount) {
  const steer = new THREE.Vector3();

  let closestPrey;
  let closestDist = Infinity;

  if (boid.rest) {
    if (boid.lastTime + 0.3 < boid.ownTime) {
      boid.lastTime = boid.ownTime;
      boid.rest = false;
    } else {
      // return steer;
    }
  } else {
    if (boid.lastTime + 0.3 < boid.ownTime) {
      boid.lastTime = boid.ownTime;
      boid.rest = true;
    }
  }

  for (let i = 0; i < preyCount; i++) {
    const prey = preys[i];
    const dist = boid.position.distanceTo(prey.position);

    if (dist < 1) console.log(dist);

    if (boid.preyIndex == null && dist < closestDist) {
      // esimesel kaardril otsib lähima // vb pigem statest sõltuv
      closestDist = dist;
      closestPrey = prey;
    } else if (dist + 5 < closestDist) {
      // hiljem lähima kui see 10 uniti jagu lähemal
      closestDist = dist;
      closestPrey = prey;
    }
  }

  if (closestDist < vars.attackRadius) {
    steer.add(closestPrey.position);
    steer.sub(boid.position);
    boid.preyIndex = closestPrey.index;
  } else {
    boid.preyIndex = null;
  }

  if (boid.rest) steer.multiplyScalar(0.3);
  return steer;
}

function velfeed(boid) {
  const steer = new THREE.Vector3();

  let closestFood;
  let closestDist = Infinity;

  for (let i = 0; i < foodTotalCount; i++) {
    const food = foods[i];
    if (!food.visible) continue;

    const dist = boid.position.distanceTo(food.position);

    if (dist < 0.3) eatFood(i);

    if (boid.foodIndex == null && dist < closestDist) {
      closestDist = dist;
      closestFood = food;
    } else if (dist < closestDist) {
      closestDist = dist;
      closestFood = food;
    }
  }

  if (closestDist < vars.feedRadius) {
    steer.add(closestFood.position);
    steer.sub(boid.position);
    steer.sub(boid.velocity);
    let len = 1 - closestDist / vars.feedRadius;
    len = Math.pow(len, 8);
    steer.setLength(len);
    boid.foodIndex = closestFood.index;
  } else {
    boid.foodIndex = null;
  }

  steer.multiplyScalar(0.01);
  // steer.clampLength(0, 0.01);
  // steer.setLength(1);

  return steer;
}

function feed(boid) {
  const steer = new THREE.Vector3();

  let closestFood;
  let closestDist = Infinity;

  for (let i = 0; i < foodTotalCount; i++) {
    const food = foods[i];
    if (!food.visible) continue;
    const dist = boid.position.distanceTo(food.position);

    if (dist < 0.3) eatFood(i);

    if (boid.foodIndex == null && dist < closestDist) {
      closestDist = dist;
      closestFood = food;
    } else if (dist < closestDist) {
      closestDist = dist;
      closestFood = food;
    }
  }

  if (closestDist < vars.feedRadius) {
    steer.add(closestFood.position);
    steer.sub(boid.position);
    boid.foodIndex = closestFood.index;
  } else {
    boid.foodIndex = null;
  }

  steer.clampLength(0, 1);
  // steer.setLength(1);

  return steer;
}

function bounds(boid) {
  const minBound = 0;
  const maxBound = vars.boundSize;
  const steer = new THREE.Vector3();
  const { x, y, z } = boid.position;

  if (x < minBound) steer.x = 1;
  else if (x > maxBound) steer.x = -1;
  if (y < minBound) steer.y = 1;
  else if (y > maxBound) steer.y = -1;
  if (z < minBound) steer.z = 1;
  else if (z > maxBound) steer.z = -1;

  steer.normalize();
  steer.multiplyScalar(boundBox.boundBox3.distanceToPoint(boid.position)); // smooth on axis
  // TODO: unsmooth on edge of two axes bounds

  return steer;
}

function random(boid) {
  const time = boid.ownTime * vars.randomWavelenScalar;
  // const steer = new THREE.Vector3(
  //   simplex.noise2D(time, (boid.index + 1) * 10),
  //   simplex.noise2D(time, (boid.index + 1) * 100),
  //   simplex.noise2D(time, (boid.index + 1) * 1000)
  // );
  const steer = new THREE.Vector3(
    noise(time, boid, "x"),
    noise(time, boid, "y"),
    noise(time, boid, "z")
  );
  // const steer = new THREE.Vector3(
  //   Math.random() * 2 - 1,
  //   Math.random() * 2 - 1,
  //   Math.random() * 2 - 1
  // );

  return steer;
}

function noise(x, boid, axis) {
  const wavelen = 0.3;
  var noiseData = boid.noise[axis];

  if (x >= noiseData.cumWavLen) {
    noiseData.cumWavLen += wavelen;
    noiseData.a = noiseData.b;
    noiseData.b = rand();
  }

  const y = interpolate(noiseData.a, noiseData.b, (x % wavelen) / wavelen);
  return y * 2 - 1;
}

// https://codepen.io/Tobsta/post/procedural-generation-part-1-1d-perlin-noise
const M = 4294967296;
const A = 1664525;
const C = 1;
var Z = Math.floor(0.1 * M); // var Z = Math.floor(Math.random() * M);
function rand() {
  Z = (A * Z + C) % M;
  return Z / M;
}

// https://codepen.io/Tobsta/post/procedural-generation-part-1-1d-perlin-noise
function interpolate(pa, pb, px) {
  var ft = px * Math.PI,
    f = (1 - Math.cos(ft)) * 0.5;
  return pa * (1 - f) + pb * f;
}
