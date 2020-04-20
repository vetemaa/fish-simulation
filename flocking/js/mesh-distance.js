function findClosestPosition(point, object) {
  var closestDistance = 1e9; // inf
  var closestPoint = new THREE.Vector3(); // inf
  var closestFaces = [];
  var largestDot = -1e9;
  var smallestDot = 1e9;
  var closestFace;

  var geometry = object.geometry;
  geometry.faces.forEach((face) => {
    var normal = face.normal;

    var vertexApos = geometry.vertices[face.a].clone();
    var vertexBpos = geometry.vertices[face.b].clone();
    var vertexCpos = geometry.vertices[face.c].clone();
    vertexApos.applyMatrix4(object.matrixWorld);
    vertexBpos.applyMatrix4(object.matrixWorld);
    vertexCpos.applyMatrix4(object.matrixWorld);

    // project point to face normal
    const pointProjectedOnNormal = projectVecOnVec(point, normal);
    // vector from previous vec to point
    const pointProjectedOnFace = point.clone().sub(pointProjectedOnNormal);

    // closest point of projectedPoint and the triangle
    const closestPointOnFace = closestPointToTriangle(
      pointProjectedOnFace,
      vertexApos,
      vertexBpos,
      vertexCpos
    );
    const pointOnFaceDist = round(closestPointOnFace.distanceTo(point));
    // const pointOnFaceDist = closestPointOnFace.distanceTo(point);

    if (pointOnFaceDist <= closestDistance) {
      if (pointOnFaceDist == closestDistance) {
        closestFaces.push(face);
      } else {
        closestFaces = [face];
      }
      closestDistance = pointOnFaceDist;
      closestPoint.copy(closestPointOnFace);
      closestFace = face;

      let dot = face.normal.dot(
        point.clone().sub(closestPointOnFace).normalize()
      );
      if (dot > largestDot) largestDot = dot;
      if (dot < smallestDot) smallestDot = dot;
    }
  });

  let dot = closestFace.normal.dot(point.clone().sub(closestPoint).normalize());
  // to avoid imprecision issues with digital numbers round to 3 decimal points
  // dot = Math.round(dot * 1000) / 1000;

  // TODO: face with smallest dot should be the correct face??!!

  insideMesh = round(dot) == -1; // TODO: do this comparison for each face in closestFaces
  // insideMesh = round(dot) <= 0;

  // insideMesh = dot < 0;
  // if (insideMesh && closestFaces.length > 1) {
  //   insideMesh = false;
  // }

  if (dot < 0) {
    // console.log("");
    // console.log(dot);
    // console.log(round(dot));
  }

  // if (insideMesh) {
  //   // console.log("a", largestDot);
  //   console.log("a", smallestDot);
  //   // console.log(closestFaces);
  //   // console.log(closestFaces.length);
  // }

  // if (
  //   // insideMesh &&
  //   point.x == 13.333333333333334 &&
  //   point.y < 13 &&
  //   point.y > 0 &&
  //   point.z == 20
  // ) {
  //   console.log("");
  //   console.log(dot, closestFaces, smallestDot);
  //   console.log(
  //     closestFaces[0].normal.dot(point.clone().sub(closestPoint).normalize())
  //   );
  //   console.log(
  //     closestFaces[1].normal.dot(point.clone().sub(closestPoint).normalize())
  //   );
  //   console.log("");
  // }

  return [closestPoint, insideMesh];
}

function projectVecOnVec(a, b) {
  var dotProduct = a.dot(b);
  var projectionLength = dotProduct / b.length();
  return b.clone().setLength(projectionLength);
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

  if (snom <= 0 && tnom <= 0) return a; // Voronoi region early out
  if (sdenom <= 0 && unom <= 0) return b; // Voronoi region early out
  if (tdenom <= 0 && udenom <= 0) return c; // Voronoi region early out

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
