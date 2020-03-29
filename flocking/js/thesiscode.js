// ARCHITECTURE
boids.forEach(boid => {
  separation = getSeparation(boid);
  alignment = getAlignment(boid);
  cohesion = getCohesion(boid);
  bounds = getBounds(boid);
  // additional rules

  acceleration = new THREE.Vector3();
  acceleration.add(separation.multiplyScalar(separationScalar));
  acceleration.add(alignment.multiplyScalar(alignmentScalar));
  acceleration.add(cohesion.multiplyScalar(cohesionScalar));
  acceleration.add(bounds.multiplyScalar(boundsScalar));
  // additional rules added to acceleration

  boid.velocity.add(acceleration);
  boid.velocity.capLength(0, maxSpeed);
  boid.position.add(velocity);
});

// SEPARATION - typical
function separation(boid) {
  separation = new THREE.Vector3();
  separationNeighbours = 0;
  distance = boid.position.distanceTo(flockmate.position);
  flockmates.forEach(flockmate => {
    if (distance < separationRadius) {
      difference = boid.position.clone().sub(flockmate.position);
      separation.add(difference);
      separationNeighbours++;
    }
  });
  if (separationNeighbours > 0) separation.divideScalar(separationNeighbours);
  return separation;
}

// ALIGNMENT - typical
function alignment(boid) {
  alignment = new THREE.Vector3();
  alignmentNeighbours = 0;
  distance = boid.position.distanceTo(flockmate.position);
  flockmates.forEach(flockmate => {
    if (distance < alignmentRadius) {
      velocity = flockmate.velocity.clone();
      alignment.add(velocity);
      alignmentNeighbours++;
    }
  });
  if (alignmentNeighbours > 0) alignment.divideScalar(alignmentNeighbours);
  return alignment;
}

// COHESION - typical
function cohesion(boid) {
  coh = new THREE.Vector3();
  cohNeighbours = 0;
  distance = boid.position.distanceTo(flockmate.position);
  flockmates.forEach(flockmate => {
    if (distance < cohesionRadius) {
      position = flockmate.position.clone();
      coh.add(position);
      cohNeighbours++;
    }
  });
  if (cohNeighbours > 0) {
    coh.divideScalar(cohNeighbours);
    coh.sub(boid.position);
  }
  return coh;
}

// separationARATION - improved
function separationaration(boid) {
  separation = new THREE.Vector3();
  distance = boid.position.distanceTo(flockmate.position);
  flockmates.forEach(flockmate => {
    if (distance < separationRadius) {
      difference = boid.position.clone().sub(flockmate.position);
      difference.setLength(1 - distance / vars.separationRadius);
      separation.add(difference);
    }
  });
  separation.clampLength(0, 1);
  return separation;
}

// alignmentGNMENT - improved
function alignmentgnment(boid) {
  alignment = new THREE.Vector3();
  alignmentNeighbours = 0;
  distance = boid.position.distanceTo(flockmate.position);
  flockmates.forEach(flockmate => {
    if (distance < alignmentRadius) {
      velocity = flockmate.velocity.clone();
      velocity.setLength(1 - distance / vars.alignmentRadius);
      alignment.add(velocity);
    }
  });
  alignment.clampLength(0, 1);
  return alignment;
}

// COHESION - improved
function cohesion(boid) {
  cohesion = new THREE.Vector3();
  cohesionNeighbours = 0;
  distance = boid.position.distanceTo(flockmate.position);
  flockmates.forEach(flockmate => {
    if (distance < cohesionRadius) {
      difference = flockmate.position.clone().sub(boid.position);
      difference.setLength(1 - distance / vars.cohesionRadius);
      cohesion.add(position);
    }
  });
  cohesion.clampLength(0, 1);
  return cohesion;
}

sep = new THREE.Vector3();
distance = boid.position.distanceTo(flockmate.position);
flockmates.forEach(flockmate => {
  if (distance < separationRadius) {
    difference = boid.position.clone().sub(flockmate.position);
    difference.setLength(1 - distance / vars.separationRadius);
    sep.add(difference);
  }
});
sep.clampLength(0, 1);

ali = new THREE.Vector3();
aliNeighbours = 0;
distance = boid.position.distanceTo(flockmate.position);
flockmates.forEach(flockmate => {
  if (distance < alignmentRadius) {
    velocity = flockmate.velocity.clone();
    velocity.setLength(1 - distance / vars.alignmentRadius);
    ali.add(velocity);
  }
});
ali.clampLength(0, 1);

cohesion = new THREE.Vector3();
cohesionNeighbours = 0;
distance = boid.position.distanceTo(flockmate.position);
flockmates.forEach(flockmate => {
  if (distance < cohesionRadius) {
    difference = flockmate.position.clone().sub(boid.position);
    difference.setLength(1 - distance / vars.cohesionRadius);
    cohesion.add(position);
  }
});
cohesion.clampLength(0, 1);
