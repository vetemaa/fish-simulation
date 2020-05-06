// https://stackoverflow.com/questions/38337871/three-js-trying-to-get-nearest-point-vector-3-of-object-from-click-generated

function sameSide(a1, a2, b1, b2) {
  var b1a1 = a1.clone().sub(b1);
  var b1a2 = a2.clone().sub(b1);
  var b1b2 = b2.clone().sub(b1);
  var c1 = new THREE.Vector3().crossVectors(b1b2, b1a1);
  var c2 = new THREE.Vector3().crossVectors(b1b2, b1a2);
  return c1.dot(c2) >= 0;
}

// https://www.youtube.com/watch?v=HYAgJN3x4GAs
// https://blackpawn.com/texts/pointinpoly/default.html
function pointInTriangleBarycentic(p, a, b, c) {
  v0 = c.clone().sub(a);
  v1 = b.clone().sub(a);
  v2 = p.clone().sub(a);

  dot00 = v0.dot(v0);
  dot01 = v0.dot(v1);
  dot02 = v0.dot(v2);
  dot11 = v1.dot(v1);
  dot12 = v1.dot(v2);

  // Compute barycentric coordinates
  invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
  u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  v = (dot00 * dot12 - dot01 * dot02) * invDenom;

  // Check if point is in triangle
  return u >= 0 && v >= 0 && u + v < 1;
}

function pointInTriangleSameSide(point, a, b, c) {
  return (
    sameSide(point, a, b, c) &&
    sameSide(point, b, a, c) &&
    sameSide(point, c, a, b)
  );
}

function projectVecOnVec(a, b) {
  var dotProduct = a.dot(b);
  var projectionLength = dotProduct / b.length();
  return b.clone().setLength(projectionLength);
}

function findClosesPointToSide(p, a, b) {
  // addSphere(p, 0x00ffff);
  var vecAtoB = b.clone().sub(a);
  // addArrow(vecAtoB, a, 0x00ffff);
  var vecAtoP = p.clone().sub(a);
  // addArrow(vecAtoP, a, 0x00ffff);
  var vecAtoPprojectedOnAtoB = projectVecOnVec(vecAtoP, vecAtoB);
  // addArrow(vecAtoPprojectedOnAtoB, a, 0x00ff00);
  return a.clone().add(vecAtoPprojectedOnAtoB);
}

function closestToSegment(p, a, b) {
  // addSphere(p, 0x00ffff);
  var ab = b.clone().sub(a);
  var normalized_ab = ab.clone().normalize();
  // addArrow(normalized_ab, a);
  var n = normalized_ab.dot(p.clone().sub(a));
  // addArrow(p.clone().sub(a), a);
  // console.log(n);
  if (n < 0) return a;
  if (n > ab.length()) return b;
  return a.clone().add(normalized_ab.multiplyScalar(n));
}

function closestToSides(p, sides) {
  var minDist = 1e9;
  var ret;
  sides.forEach(function (side) {
    var ct = findClosesPointToSide(p, side[0], side[1]);
    var dist = ct.distanceTo(p);
    if (dist < minDist) {
      minDist = dist;
      ret = ct;
    }
  });
  return ret;
}

function closestPointToTriangleNew(p, a, b, c) {
  // Check if P in vertex region outside A
  a = a.clone();
  b = b.clone();
  c = c.clone();
  ab = b.clone().sub(a);
  ac = c.clone().sub(a);
  ap = p.clone().sub(a);
  d1 = ab.dot(ap);
  d2 = ac.dot(ap);
  if (d1 <= 0 && d2 <= 0) return a; // barycentric coordinates (1,0,0)

  // Check if P in vertex region outside B
  bp = p.clone().sub(b);
  d3 = ab.dot(bp);
  d4 = ac.dot(bp);
  if (d3 >= 0 && d4 <= d3) return b; // barycentric coordinates (0,1,0)

  // Check if P in edge region of AB, if so return projection of P onto AB
  vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    v = d1 / (d1 - d3);
    return a.add(ab.multiplyScalar(v)); // barycentric coordinates (1-v, v,0)
  }

  // Check if P in vertex region outside C
  cp = p.clone().sub(c);
  d5 = ab.dot(cp);
  d6 = ac.dot(cp);
  if (d6 >= 0 && d5 <= d6) return c; // barycentric coordinates (0,0,1)

  // Check if P in edge region of AC, if so return projection of P onto AC
  vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    w = d2 / (d2 - d6);
    return a.add(ac.multiplyScalar(w)); // barycentric coordinates (1-w, 0, w)
  }

  // Check if P in edge region of BC, if so return projection of P onto BC
  va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    w = (d4 - d3) / (d4 - d3 + (d5 - d6));
    return b.add(c.clone().sub(b).multiplyScalar(w)); // barycentric coordinates (0,1-w, w)
  }

  // P inside face region. Compute Q through its barycentric coordinates (u, v, w)
  denom = 1 / (va + vb + vc);
  v = vb * denom;
  w = vc * denom;
  return a.add(ab.multiplyScalar(v) + ac.multiplyScalar(w)); //=u*a+v*b+w*c,u=va* denom=1-v−w
}

function closestPointToTriangle(point, a, b, c) {
  // if the point is inside the triangle then it's the closest point
  // if (pointInTriangleSameSide(point, a, b, c)) return point;
  if (pointInTriangleBarycentic(point, a, b, c)) return point;
  // otherwise it's the closest point to one of the sides
  findClosesPointToSide(point, a, c);
  return closestToSides(point, [
    [a, b],
    [b, c],
    [a, c],
  ]);
}

asd = 0;

function findClosestPosition(point, object) {
  // console.log(point);
  var closestDistance = 1e9; // inf
  var closestPointVec = new THREE.Vector3(); // inf

  var geometry = object.geometry;
  // console.log(geometry);

  for (let i = 0; i < 1; i++) {
    const face = geometry.faces[i];

    var normal = face.normal;
    // addArrow(normal, new THREE.Vector3(0, -0.2, 0));

    var vertexApos = geometry.vertices[face.a];
    var vertexBpos = geometry.vertices[face.b];
    var vertexCpos = geometry.vertices[face.c];

    // addSphere(vertexApos, 0x0000ff);
    // addSphere(vertexBpos, 0x0000ff);
    // addSphere(vertexCpos, 0x0000ff);

    // project point to face normal
    var pointProjectedOnNormal = projectVecOnVec(point, normal);
    // vector from previous vec to point
    var pointProjectedOnFace = point.clone().sub(pointProjectedOnNormal);
    // addArrow(
    //   pointProjectedOnFace.multiplyScalar(1),
    //   new THREE.Vector3(0, 0, 0),
    //   0x00ffff
    // );

    // closest point of projectedPoint and the triangle
    var cp = closestPointToTriangleNewNew(
      pointProjectedOnFace,
      vertexApos,
      vertexBpos,
      vertexCpos
    );

    if (cp.distanceTo(point) < closestDistance) {
      closestDistance = cp.distanceTo(point);
      closestPointVec.copy(cp);
    }
  }

  // console.log("Speedtest:");

  // pointProjectedOnFace = new THREE.Vector3(0.5, 0.7, 0);
  // vertexApos = new THREE.Vector3(-1, 0.5, 0);
  // vertexBpos = new THREE.Vector3(-1, -0.5, 0);
  // vertexCpo = new THREE.Vector3(1, 0.5, 0);

  // a = Date.now();
  // for (let i = 0; i < 100000; i++) {
  //   closestPointToTriangle(
  //     pointProjectedOnFace.clone(),
  //     vertexApos.clone(),
  //     vertexBpos.clone(),
  //     vertexCpos.clone()
  //   );
  // }
  // console.log(Date.now() - a);

  // b = Date.now();
  // for (let i = 0; i < 100000; i++) {
  //   closestPointToTriangleNewNew(
  //     pointProjectedOnFace.clone(),
  //     vertexApos.clone(),
  //     vertexBpos.clone(),
  //     vertexCpos.clone()
  //   );
  // }
  // console.log(Date.now() - b);

  return closestPointVec;
}

function closestPointToTriangleNew(p, a, b, c) {
  a = a.clone();
  b = b.clone();
  c = c.clone();
  ab = b.clone().sub(a);
  ac = c.clone().sub(a);
  ap = p.clone().sub(a);
  bp = p.clone().sub(b);
  cp = p.clone().sub(c);

  // Check if P in vertex region outside A
  d1 = ab.dot(ap);
  d2 = ac.dot(ap);
  if (d1 <= 0 && d2 <= 0) return a; // barycentric coordinates (1,0,0)

  // Check if P in vertex region outside B
  d3 = ab.dot(bp);
  d4 = ac.dot(bp);
  if (d3 >= 0 && d4 <= d3) return b; // barycentric coordinates (0,1,0)

  // Check if P in vertex region outside C
  d5 = ab.dot(cp);
  d6 = ac.dot(cp);
  if (d6 >= 0 && d5 <= d6) return c; // barycentric coordinates (0,0,1)

  // Check if P in edge region of AB, if so return projection of P onto AB
  vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    v = d1 / (d1 - d3);
    return a.add(ab.multiplyScalar(v)); // barycentric coordinates (1-v, v,0)
  }

  // Check if P in edge region of AC, if so return projection of P onto AC
  vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    w = d2 / (d2 - d6);
    return a.add(ac.multiplyScalar(w)); // barycentric coordinates (1-w, 0, w)
  }

  // Check if P in edge region of BC, if so return projection of P onto BC
  va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    w = (d4 - d3) / (d4 - d3 + (d5 - d6));
    return b.add(c.clone().sub(b).multiplyScalar(w)); // barycentric coordinates (0,1-w, w)
  }

  // P inside face region. Compute Q through its barycentric coordinates (u, v, w)
  denom = 1 / (va + vb + vc);
  v = vb * denom;
  w = vc * denom;
  return a.add(ab.multiplyScalar(v).add(ac.multiplyScalar(w))); //=u*a+v*b+w*c,u=va* denom=1−v−w
}

function closestPointToTriangleNewNew(p, a, b, c) {
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
