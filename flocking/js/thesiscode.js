// ARCHITECTURE
boids.forEach(boid => {
  separation = getSeparation(boid);
  alignment = getAlignment(boid);
  cohesion = getCohesion(boid);

  acceleration.add(separationVec.multiplyScalar(separationScalar));
  acceleration.add(alignmentVec.multiplyScalar(alignmentScalar));
  acceleration.add(cohesionVec.multiplyScalar(cohesionScalar));

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
    if (dist < separationDist) {
      diff = boid.position.clone().sub(flockmate.position);
      sep.add(diff);
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
    if (dist < alignmentDist) {
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
    if (dist < cohesionDist) {
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
