function reynolds(boid) {
  const sep = new THREE.Vector3();
  const ali = new THREE.Vector3();
  const coh = new THREE.Vector3();
  let cohNeighbours = 0;

  for (let i = 0; i < vars.boidCount; i++) {
    const flockmate = boids[i];
    const dist = boid.position.distanceTo(flockmate.position);

    if (boid.index !== flockmate.index) {
      // separation
      if (dist < vars.separationDist) {
        const diff = boid.position.clone().sub(flockmate.position);
        diff.setLength(1 - dist / vars.separationDist);
        sep.add(diff);
      }

      // alignment
      if (dist < vars.alignmentDist) {
        const vel = flockmate.velocity.clone();
        vel.setLength(1 - dist / vars.alignmentDist);
        ali.add(vel);
      }

      // cohesion
      if (dist < vars.cohesionDist) {
        const pos = flockmate.position.clone();
        coh.add(pos);
        cohNeighbours++;
      }
    }
  }

  sep.clampLength(0, 1);
  ali.clampLength(0, 1);

  if (cohNeighbours > 0) {
    coh.divideScalar(cohNeighbours);
    coh.sub(boid.position);
    coh.multiplyScalar(0.1);
  }

  return { ali, sep, coh };
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

function floor(boid) {
  const floorDist = 5;
  const steer = new THREE.Vector3();

  if (typeof env !== "undefined") {
    const x = boid.position.x;
    const z = boid.position.z;
    const y = boid.position.y;
    const floorY = noisePlane(x, -z);

    if (floorY + floorDist > y) {
      steerY = (floorDist - (y - floorY)) / floorDist;
      steerY = Math.pow(steerY, 2);
      steer.y = steerY;
    }
  }

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
