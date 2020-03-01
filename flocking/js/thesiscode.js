// ARCHITECTURE
boids.forEach(boid => {
  separation = getSeparation(boid);
  alignment = getAlignment(boid);
  cohesion = getCohesion(boid);
  bounds = getBounds(boid);

  acceleration.add(separation.multiplyScalar(separationScalar));
  acceleration.add(alignment.multiplyScalar(alignmentScalar));
  acceleration.add(cohesion.multiplyScalar(cohesionScalar));
  acceleration.add(bounds.multiplyScalar(boundsScalar));

  boid.velocity.add(acceleration);
  boid.velocity.capLength(0, maxSpeed);
  boid.position.add(velocity);
});

// SEPARATION - typical
function separation(boid) {
  sep = new THREE.Vector3();
  sepNeighbours = 0;
  dist = boid.position.distanceTo(flockmate.position);
  flockmates.forEach(flockmate => {
    if (dist < separationRadius) {
      difference = boid.position.clone().sub(flockmate.position);
      sep.add(difference);
      sepNeighbours++;
    }
  });
  if (sepNeighbours > 0) sep.divideScalar(sepNeighbours);
  return sep;
}

// SEPARATION - improved
function separation(boid) {
  sep = new THREE.Vector3();
  sepNeighbours = 0;
  dist = boid.position.distanceTo(flockmate.position);
  flockmates.forEach(flockmate => {
    if (dist < separationRadius) {
      difference = boid.position.clone().sub(flockmate.position);
      difference.setLength(1 - dist / vars.separationRadius);
      sep.add(difference);
      sepNeighbours++;
    }
  });
  if (sepNeighbours > 0) sep.divideScalar(sepNeighbours);
  return sep;
}

// ALIGNMENT - typical
function alignment(boid) {
  ali = new THREE.Vector3();
  aliNeighbours = 0;
  dist = boid.position.distanceTo(flockmate.position);
  flockmates.forEach(flockmate => {
    if (dist < alignmentRadius) {
      vel = flockmate.velocity.clone();
      ali.add(vel);
    }
  });
  if (aliNeighbours > 0) ali.divideScalar(aliNeighbours);
  return ali;
}

// COHESION - typical
function cohesion(boid) {
  coh = new THREE.Vector3();
  cohNeighbours = 0;
  dist = boid.position.distanceTo(flockmate.position);
  flockmates.forEach(flockmate => {
    if (dist < cohesionRadius) {
      pos = flockmate.position.clone();
      coh.add(pos);
      cohNeighbours++;
    }
  });
  if (cohNeighbours > 0) {
    coh.divideScalar(cohNeighbours);
    coh.sub(boid.position);
    coh.divideScalar(10);
  }
  return coh;
}
