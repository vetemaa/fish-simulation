// font size: 13.5 (19)

// STRUCTURE
boids.forEach((boid) => {
  separation = getSeparation(boid);
  alignment = getAlignment(boid);
  cohesion = getCohesion(boid);
  // additional rules

  acceleration = new THREE.Vector3();
  acceleration.add(separation.multiplyScalar(separationScalar));
  acceleration.add(alignment.multiplyScalar(alignmentScalar));
  acceleration.add(cohesion.multiplyScalar(cohesionScalar));
  // additional rules added to acceleration

  boid.velocity.add(acceleration.multiplyScalar(deltaTime));
  boid.velocity.capLength(0, maxSpeed);
  velocity = boid.velocity.clone();
  boid.position.add(velocity.multiplyScalar(deltaTime));
});

// // SEPARATION - old typical
// function separation(boid) {
//   separation = new THREE.Vector3();
//   separationNeighbours = 0;
//   distance = boid.position.distanceTo(flockmate.position);
//   flockmates.forEach((flockmate) => {
//     if (distance < separationRadius) {
//       difference = boid.position.clone().sub(flockmate.position);
//       separation.add(difference);
//       separationNeighbours++;
//     }
//   });
//   if (separationNeighbours > 0) separation.divideScalar(separationNeighbours);
//   return separation;
// }

// // ALIGNMENT - old typical
// function alignment(boid) {
//   alignment = new THREE.Vector3();
//   alignmentNeighbours = 0;
//   distance = boid.position.distanceTo(flockmate.position);
//   flockmates.forEach((flockmate) => {
//     if (distance < alignmentRadius) {
//       velocity = flockmate.velocity.clone();
//       alignment.add(velocity);
//       alignmentNeighbours++;
//     }
//   });
//   if (alignmentNeighbours > 0) alignment.divideScalar(alignmentNeighbours);
//   return alignment;
// }

// // COHESION - old typical
// function cohesion(boid) {
//   cohesion = new THREE.Vector3();
//   cohesionNeighbours = 0;
//   distance = boid.position.distanceTo(flockmate.position);
//   flockmates.forEach((flockmate) => {
//     if (distance < cohesionRadius) {
//       position = flockmate.position.clone();
//       cohesion.add(position);
//       cohesionNeighbours++;
//     }
//   });
//   if (cohesionNeighbours > 0) {
//     cohesion.divideScalar(cohesionNeighbours);
//     cohesion.sub(boid.position);
//   }
//   return cohesion;
// }

// SEPARATION - books
// function separation(boid) {
centroid = new THREE.Vector3();
separationNeighbours = 0;
flockmates.forEach((flockmate) => {
  distance = boid.position.distanceTo(flockmate.position);
  if (distance < vars.separationRadius) {
    centroid.add(flockmate.position);
    separationNeighbours++;
  }
});
if (separationNeighbours > 0) {
  centroid.divideScalar(separationNeighbours);
  separation = boid.position.clone().sub(centroid);
}

// return separation;
// }

// ALIGNMENT - books
// function alignment(boid) {
alignment = new THREE.Vector3();
alignmentNeighbours = 0;
flockmates.forEach((flockmate) => {
  distance = boid.position.distanceTo(flockmate.position);
  if (distance < vars.alignmentRadius) {
    alignment.add(flockmate.velocity);
    alignmentNeighbours++;
  }
});
if (alignmentNeighbours > 0) {
  alignment.divideScalar(alignmentNeighbours);
}
// return alignment;
// }

// COHESION - books
// function cohesion(boid) {
centroid = new THREE.Vector3();
cohesionNeighbours = 0;
flockmates.forEach((flockmate) => {
  distance = boid.position.distanceTo(flockmate.position);
  if (distance < cohesionRadius) {
    centroid.add(flockmate.position);
    cohesionNeighbours++;
  }
});
if (cohesionNeighbours > 0) {
  centroid.divideScalar(cohesionNeighbours);
  cohesion = centroid.sub(boid.position);
}
// return cohesion;
// }

// separation - improved
// function separation(boid) {
separation = new THREE.Vector3();
flockmates.forEach((flockmate) => {
  distance = boid.position.distanceTo(flockmate.position);
  if (distance < separationRadius) {
    difference = boid.position.clone().sub(flockmate.position);
    difference.setLength(1 - distance / vars.separationRadius);
    separation.add(difference);
  }
});
separation.clampLength(0, 1);
// return separation;
// }

// alignment - improved
// function alignment(boid) {
alignment = new THREE.Vector3();
alignmentNeighbours = 0;
flockmates.forEach((flockmate) => {
  distance = boid.position.distanceTo(flockmate.position);
  if (distance < alignmentRadius) {
    velocity = flockmate.velocity.clone();
    velocity.setLength(1 - distance / vars.alignmentRadius);
    alignment.add(velocity);
  }
});
alignment.clampLength(0, 1);
// return alignment;
// }

// cohesion - improved
// function cohesion(boid) {
cohesion = new THREE.Vector3();
cohesionNeighbours = 0;
distance = boid.position.distanceTo(flockmate.position);
flockmates.forEach((flockmate) => {
  if (distance < cohesionRadius) {
    difference = flockmate.position.clone().sub(boid.position);
    difference.setLength(1 - distance / vars.cohesionRadius);
    cohesion.add(position);
  }
});
cohesion.clampLength(0, 1);
// return cohesion;
// }

function projectVecOnVec(p, n) {
  var dotProduct = p.dot(n);
  var projectionLength = dotProduct / n.length();
  var projectedP = n.clone().setLength(projectionLength);
  projectedP;
  return n.clone().setLength(projectionLength);
}

// SHORTENED IMPROVED
// ...
flockmates.forEach((flockmate) => {
  distance = boid.position.distanceTo(flockmate.position);
  if (distance < separationRadius) {
    difference = boid.position.clone().sub(flockmate.position);
    difference.setLength(1 - distance / vars.separationRadius);
    separation.add(difference);
  }
});
separation.clampLength(0, 1);

// ...
flockmates.forEach((flockmate) => {
  distance = boid.position.distanceTo(flockmate.position);
  if (distance < alignmentRadius) {
    velocity = flockmate.velocity.clone();
    velocity.setLength(1 - distance / vars.alignmentRadius);
    alignment.add(velocity);
  }
});
alignment.clampLength(0, 1);

// ...
flockmates.forEach((flockmate) => {
  if (distance < cohesionRadius) {
    difference = flockmate.position.clone().sub(boid.position);
    difference.setLength(1 - distance / vars.cohesionRadius);
    cohesion.add(position);
  }
});
cohesion.clampLength(0, 1);

function cubicInterpolate(values, x) {
  const x2 = x * x;
  a0 = values[3] - values[2] - values[0] + values[1];
  a1 = values[0] - values[1] - a0;
  a2 = values[2] - values[0];
  a3 = values[1];

  return a0 * x * x2 + a1 * x2 + a2 * x + a3;
}
