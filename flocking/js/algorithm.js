function reynolds(boid, flockmates, mine = 1) {
  const sep = new THREE.Vector3();
  const ali = new THREE.Vector3();
  const coh = new THREE.Vector3();
  let sepNeighbours = 0;
  let aliNeighbours = 0;
  let cohNeighbours = 0;

  let flockmateCount;
  if (boid.predator) flockmateCount = vars.predatorCount;
  else flockmateCount = vars.boidCount;

  for (let i = 0; i < flockmateCount; i++) {
    const flockmate = flockmates[i];
    const dist = boid.position.distanceTo(flockmate.position);

    if (boid.index !== flockmate.index) {
      if (mine === 1) {
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

        // cohesion - mine
        if (dist < vars.cohesionRadius) {
          const diff = flockmate.position.clone().sub(boid.position);
          diff.setLength(1 - dist / vars.cohesionRadius);
          coh.add(diff);
        }
      } else {
        // separation - {books}
        if (dist < vars.separationRadius) {
          sep.add(flockmate.position);
          sepNeighbours++;
        }

        // alignment - {books}
        if (dist < vars.alignmentRadius) {
          ali.add(flockmate.velocity);
          aliNeighbours++;
        }

        // cohesion - {books}
        if (dist < vars.cohesionRadius) {
          coh.add(flockmate.position);
          cohNeighbours++;
        }
      }
    }
  }

  if (mine === 1) {
    // separation - mine
    sep.clampLength(0, 1);

    // alignment - mine
    ali.clampLength(0, 1);

    // cohesion - mine
    coh.clampLength(0, 1);
  } else {
    // separation - {books}
    if (sepNeighbours > 0) {
      sep.divideScalar(sepNeighbours);
      positionClone = boid.position.clone();
      sep.copy(positionClone.sub(sep.clone()));
      sep.multiplyScalar(0.32);
    }

    // alignment - {books}
    if (aliNeighbours > 0) {
      ali.divideScalar(aliNeighbours);
      ali.multiplyScalar(40);
    }

    // cohesion - {books}
    if (cohNeighbours > 0) {
      coh.divideScalar(cohNeighbours);
      coh.sub(boid.position);
      coh.multiplyScalar(0.16);
    }
  }

  return [sep, ali, coh];
}

function flee(boid) {
  const steer = new THREE.Vector3();

  for (let i = 0; i < vars.predatorCount; i++) {
    const predator = predators[i];
    const diff = boid.position.clone().sub(predator.position);

    if (diff.length() < vars.fleeRadius) {
      diff.setLength(1 - dist / vars.fleeRadius);
      steer.add(diff);
    }
  }

  steer.clampLength(0, 1);
  return steer;
}

function bounds(boid) {
  const minBound = 0;
  const maxBound = vars.boundSize;
  const steer = new THREE.Vector3();
  const { x, y, z } = boid.position;

  if (x < minBound) steer.x = minBound - x;
  else if (x > maxBound) steer.x = maxBound - x;
  if (y < minBound) steer.y = minBound - y;
  else if (y > maxBound) steer.y = maxBound - y;
  if (z < minBound) steer.z = minBound - z;
  else if (z > maxBound) steer.z = maxBound - z;

  steer.y *= 2;
  return steer;
}

function random(boid) {
  const time = boid.ownTime * vars.randomWavelenScalar;

  const steer = new THREE.Vector3(
    noise(time + 0.0, boid, "x"),
    noise(time + 0.1, boid, "y") * 0.1,
    noise(time + 0.2, boid, "z")
  );

  return steer;
}

function noise(time, boid, axis) {
  const wavelen = 0.3;
  const noiseData = boid.noise[axis];

  if (time >= noiseData.cumWavLen) {
    noiseData.cumWavLen += wavelen;
    noiseData.randomValues.shift();
    noiseData.randomValues.push(rand());
  }

  const y = cubicInterpolate(
    noiseData.randomValues,
    (time % wavelen) / wavelen
  );

  return y * 2 - 1;
}

function obstacles(boid) {
  const steer = new THREE.Vector3();
  if (!vars.enabled) return steer;

  deltas = [];
  fieldVectors = worldPosToFieldValues(
    boid.position.toArray(),
    avoidanceField,
    deltas
  );
  if (!fieldVectors) return steer;
  value = triLerp(lerpVecs, ...deltas, ...fieldVectors);

  steer.copy(value);
  if (vars.towardsMesh) {
    const center = new THREE.Vector3(19, 15, 20).sub(boid.position);
    center.setLength(0.01);
    steer.add(center);
  }

  return steer;
}

function towards(boid) {
  const steer = new THREE.Vector3(0, 0, 0);

  const center = new THREE.Vector3(19, 15, 18).sub(boid.position);
  center.setLength(0.03);
  if (vars.enabled) steer.add(center);

  return steer;
}

function velocityAttack(predator) {
  const restTime = 0.2;
  const attackTime = 1.4;

  if (predator.rest) {
    if (predator.ownTime - predator.restStartTime > restTime) {
      predator.rest = false;
      predator.attackStartTime = predator.ownTime;

      // choosing the prey
      let closest = 0;
      let closestDist = Infinity;
      for (let i = 0; i < vars.boidCount; i++) {
        const prey = boids[i];
        const dist = predator.position.distanceTo(prey.position);
        if (dist < closestDist) {
          closest = prey.index;
          closestDist = dist;
        }
      }
      predator.preyIndex = closest;
    }
    return new THREE.Vector3();
  }

  const closest = boids[predator.preyIndex];
  const diff = closest.position.clone().sub(predator.position);

  const speedUpTime = predator.ownTime - predator.attackStartTime;
  if (speedUpTime > attackTime || diff.length() < 1) {
    predator.rest = true;
    predator.restStartTime = predator.ownTime;
    predator.preyIndex = undefined;
  }

  diff.normalize();
  diff.sub(predator.velocity); // steer velocity to right direction
  diff.multiplyScalar(Math.pow(speedUpTime, 8)); // smoother attack
  diff.clampLength(0, 0.01);
  return diff;
}

// https://codepen.io/Tobsta/post/procedural-generation-part-1-1d-perlin-noise
const M = 4294967296;
const A = 1664525;
const C = 1;
var Z = Math.floor(0.1 * M);
function rand() {
  Z = (A * Z + C) % M;
  return Z / M;
}

// cubic interpolation using Paul Breeuwsma coefficients
function cubicInterpolate(values, x) {
  const x2 = x * x;
  const a0 =
    -0.5 * values[0] + 1.5 * values[1] - 1.5 * values[2] + 0.5 * values[3];
  const a1 = values[0] - 2.5 * values[1] + 2 * values[2] - 0.5 * values[3];
  const a2 = -0.5 * values[0] + 0.5 * values[2];
  const a3 = values[1];

  return a0 * x * x2 + a1 * x2 + a2 * x + a3;
}
