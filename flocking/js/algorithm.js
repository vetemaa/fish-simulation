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
        if (dist < vars.separationDist) {
          const diff = boid.position.clone().sub(flockmate.position);
          diff.setLength(1 - dist / vars.separationDist);
          sep.add(diff);
        }

        // alignment - mine
        if (dist < vars.alignmentDist) {
          const vel = flockmate.velocity.clone();
          vel.setLength(1 - dist / vars.alignmentDist);
          ali.add(vel);
        }

        // cohesion - mine
        if (dist < vars.cohesionDist) {
          const pos = flockmate.position.clone();
          coh.add(pos);
          cohNeighbours++;
        }
      } else {
        // separation - {4}
        if (dist < vars.separationDist) {
          const diff = boid.position.clone().sub(flockmate.position);
          sep.add(diff);
          sepNeighbours++;
        }

        // alignment - {4}
        if (dist < vars.alignmentDist) {
          const vel = flockmate.velocity.clone();
          ali.add(vel);
        }

        // cohesion - {4}
        if (dist < vars.cohesionDist) {
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
    // if (sepNeighbours > 0) sep.divideScalar(sepNeighbours);

    // alignment - mine
    ali.clampLength(0, 1);
    // if (aliNeighbours > 0) ali.divideScalar(aliNeighbours);

    // cohesion - mine
    if (cohNeighbours > 0) {
      coh.divideScalar(cohNeighbours);
      coh.sub(boid.position);
      coh.multiplyScalar(0.1);
    }
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
      coh.divideScalar(10);
    }
  }

  return { ali, sep, coh };
}

function escape(boid, predators, predatorCount) {
  const steer = new THREE.Vector3();

  for (let i = 0; i < predatorCount; i++) {
    const predator = predators[i];
    const dist = boid.position.distanceTo(predator.position);

    if (dist < vars.escapeDist) {
      const diff = boid.position.clone().sub(predator.position);
      diff.setLength(1 - dist / vars.escapeDist);
      steer.add(diff);
    }
  }

  steer.clampLength(0, 1);

  return steer;
}

function attack(boid, prey, preyCount) {
  const steer = new THREE.Vector3();

  // TODO otsi lähim ja vali uus siis kui on x ühikut lähemal kui eelmine

  let closestPrey;
  let closestDist = Infinity;

  // if (boid.lastAttack === undefined) boid.lastAttack = boid.ownTime;
  // if (boid.rest === undefined) boid.rest = true;

  // if (boid.rest && boid.lastAttack + 1 < boid.ownTime) boid.rest = false;
  // if (!boid.rest && boid.lastAttack + 1 > boid.ownTime) boid.rest = true;

  // if (boid.rest) return steer;
  // if ( boid.lastAttack + 1 > boid.ownTime) boid.lastAttack = boid.ownTime;

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

  // console.log(boid.ownTime);

  for (let i = 0; i < preyCount; i++) {
    const singlePrey = prey[i];
    const dist = boid.position.distanceTo(singlePrey.position);

    if (dist < 1) console.log(dist);

    if (boid.preyIndex == null && dist < closestDist) {
      // esimesel kaardril otsib lähima // vb pigem statest sõltuv
      closestDist = dist;
      closestPrey = singlePrey;
    } else if (dist + 5 < closestDist) {
      // hiljem lähima kui see 10 uniti jagu lähemal
      closestDist = dist;
      closestPrey = singlePrey;
    }
  }

  if (closestDist < vars.attackDist) {
    steer.add(closestPrey.position);
    steer.sub(boid.position);
    boid.preyIndex = closestPrey.index;
  } else {
    boid.preyIndex = null;
  }

  if (boid.rest) steer.multiplyScalar(0.3);
  steer.multiplyScalar(0.1);
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
  steer.multiplyScalar(boundBox.boundBox3.distanceToPoint(boid.position)); // smooth
  // TODO unsmooth on edge of two axes bounds

  return steer;
}

function random(boid) {
  const steer = new THREE.Vector3(
    simplex.noise2D(boid.ownTime, (boid.index + 1) * 10),
    simplex.noise2D(boid.ownTime, (boid.index + 1) * 100),
    simplex.noise2D(boid.ownTime, (boid.index + 1) * 1000)
  );

  return steer;
}
