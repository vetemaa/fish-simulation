function findClosestPosition(point, object) {
  var closestDistance = 1e9; // inf
  var closestPoint = new THREE.Vector3();
  var closestFace;

  var geometry = object.geometry;
  geometry.faces.forEach((face) => {
    var normal = face.normal;

    // project point to face normal
    const pointProjectedOnNormal = projectVecOnVec(point, normal);
    // project point to face
    const pointProjectedOnFace = point.clone().sub(pointProjectedOnNormal);

    // closest point of projectedPoint and the triangle
    const closestPointOnFace = closestPointToTriangle(
      pointProjectedOnFace,
      geometry.vertices[face.a].clone().applyMatrix4(object.matrixWorld),
      geometry.vertices[face.b].clone().applyMatrix4(object.matrixWorld),
      geometry.vertices[face.c].clone().applyMatrix4(object.matrixWorld)
    );
    const pointOnFaceDist = round(closestPointOnFace.distanceTo(point));
    // const pointOnFaceDist = closestPointOnFace.distanceTo(point);

    if (pointOnFaceDist <= closestDistance) {
      closestDistance = pointOnFaceDist;
      closestPoint.copy(closestPointOnFace);
      closestFace = face;
    }
  });

  let dot = closestFace.normal.dot(point.clone().sub(closestPoint).normalize());
  const insideMesh = round(dot) == -1;

  return { closestPoint, insideMesh };
}

function projectVecOnVec(a, b) {
  var dotProduct = a.dot(b);
  var projectionLength = dotProduct / b.length();
  return b.clone().setLength(projectionLength);
}

function round(x) {
  return Math.round((x + Number.EPSILON) * 1000) / 1000;
}

// from the book Real-Time Collision Detection
function closestPointToTriangle(p, a, b, c) {
  const ab = b.clone().sub(a);
  const ac = c.clone().sub(a);
  const ap = p.clone().sub(a);
  const ba = a.clone().sub(b);
  const bc = c.clone().sub(b);
  const bp = p.clone().sub(b);
  const ca = a.clone().sub(c);
  const cb = b.clone().sub(c);
  const cp = p.clone().sub(c);
  const pa = a.clone().sub(p);
  const pb = b.clone().sub(p);
  const pc = c.clone().sub(p);
  const normal = new THREE.Vector3().crossVectors(ab, ac);

  // Compute parametric position s for projection P’ of P on AB,
  // P’ = A + s * AB, s = snom / (snom + sdenom)
  snom = ap.dot(ab);
  sdenom = bp.dot(ba);

  // Compute parametric position t for projection P’ of P on AC,
  // P’ = A + t * AC, t = tnom / (tnom + tdenom)
  tnom = ap.dot(ac);
  tdenom = cp.dot(ca);

  // Compute parametric position u for projection P’ of P on BC,
  // P’ = B + u * BC, u = unom / (unom + udenom)
  unom = bp.dot(bc);
  udenom = cp.dot(cb);

  if (snom <= 0 && tnom <= 0) return a; // Voronoi region early out
  if (sdenom <= 0 && unom <= 0) return b; // Voronoi region early out
  if (tdenom <= 0 && udenom <= 0) return c; // Voronoi region early out

  // P is outside (or on) AB if the triple scalar product [N PA PB] <= 0
  vc = normal.dot(new THREE.Vector3().crossVectors(pa, pb));
  // If P outside AB and within feature region of AB,
  // return projection of P onto AB
  if (vc <= 0 && snom >= 0 && sdenom >= 0)
    return a.add(ab.multiplyScalar(snom / (snom + sdenom)));

  // P is outside (or on) BC if the triple scalar product [N PB PC] <= 0
  va = normal.dot(new THREE.Vector3().crossVectors(pb, pc));
  // If P outside BC and within feature region of BC,
  // return projection of P onto BC
  if (va <= 0 && unom >= 0 && udenom >= 0)
    return b.add(bc.multiplyScalar(unom / (unom + udenom)));

  // P is outside (or on) AC if the triple scalar product [N PC PA] <= 0
  vb = normal.dot(new THREE.Vector3().crossVectors(pc, pa));
  // If P outside AC and within feature region of AC,
  // return projection of P onto AC
  if (vb <= 0 && tnom >= 0 && tdenom >= 0)
    return a.add(ac.multiplyScalar(tnom / (tnom + tdenom)));

  // P must project inside face region. Compute Q using barycentric coordinates
  u = va / (va + vb + vc);
  v = vb / (va + vb + vc);
  w = 1 - u - v; // = vc/(va + vb + vc)
  return a.multiplyScalar(u).add(b.multiplyScalar(v).add(c.multiplyScalar(w)));
}
