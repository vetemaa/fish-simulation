function findClosestPosition(point, object) {
  var closestDistance = 1e9; // inf
  var closestPointVec = new THREE.Vector3(); // inf
  // var closestFaces = [];
  var closestFace;

  var geometry = object.geometry;
  geometry.faces.forEach((face) => {
    var normal = face.normal;

    var va = geometry.vertices[face.a].clone();
    var vb = geometry.vertices[face.b].clone();
    var vc = geometry.vertices[face.c].clone();
    va.applyMatrix4(object.matrixWorld);
    vb.applyMatrix4(object.matrixWorld);
    vc.applyMatrix4(object.matrixWorld);

    var pd = normal.dot(point.clone().sub(va));
    var proj = point.clone().sub(normal.clone().multiplyScalar(pd));

    var cp = closestPointToTriangle(proj, va, vb, vc);

    if (cp.distanceTo(point) <= closestDistance) {
      closestDistance = cp.distanceTo(point);
      closestPointVec.copy(cp);
      closestFace = face;
    }
  });

  dot = closestFace.normal.dot(point.clone().sub(closestPointVec).normalize());
  // to avoid imprecision issues with digital numbers round to 3 decimal points
  dot = Math.round(dot * 1000) / 1000;
  insideMesh = dot == -1; // TODO: do this comparison for each face in closestFaces

  return [closestPointVec, insideMesh];
}

function round(x) {
  return Math.round((x + Number.EPSILON) * 1000) / 1000;
}

// from book Real-Time Collision Detection
function closestPointToTriangle(p, a, b, c) {
  a = a.clone();
  b = b.clone();
  c = c.clone();
  ab = b.clone().sub(a);
  ac = c.clone().sub(a);
  ap = p.clone().sub(a);
  ba = a.clone().sub(b);
  bc = c.clone().sub(b);
  bp = p.clone().sub(b);
  ca = a.clone().sub(c);
  cb = b.clone().sub(c);
  cp = p.clone().sub(c);
  pa = a.clone().sub(p);
  pb = b.clone().sub(p);
  pc = c.clone().sub(p);
  normal = new THREE.Vector3().crossVectors(ab, ac);

  // Compute parametric position s for projection P’ of P on AB,
  // P’ = A + s * AB, s = snom / (snom + sdenom)
  snom = ap.dot(ab);
  sdenom = bp.dot(ba);

  // Compute parametric position t for projection P’ of P on AC,
  // P’ = A + t * AC, t = tnom / (tnom + tdenom)
  tnom = ap.dot(ac);
  tdenom = cp.dot(ca);

  // console.log(tnom, tdenom);

  // Compute parametric position u for projection P’ of P on BC,
  // P’ = B + u * BC, u = unom / (unom + udenom)
  unom = bp.dot(bc);
  udenom = cp.dot(cb);

  if (snom <= 0 && tnom <= 0) return a; // Vertex region early out
  if (sdenom <= 0 && unom <= 0) return b; // Vertex region early out
  if (tdenom <= 0 && udenom <= 0) return c; // Vertex region early out

  // P is outside (or on) AB if the triple scalar product [N PA PB] <= 0
  vc = normal.dot(new THREE.Vector3().crossVectors(pa, pb)); // !!! Basically same as sameside!!
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
