// ALL BELOW FROM THIS LINK:
// https://stackoverflow.com/questions/38337871/three-js-trying-to-get-nearest-point-vector-3-of-object-from-click-generated

function sameSide(p1, p2, a, b) {
  var ab = b.clone().sub(a);
  var ap1 = p1.clone().sub(a);
  var ap2 = p2.clone().sub(a);
  var cp1 = new THREE.Vector3().crossVectors(ab, ap1);
  var cp2 = new THREE.Vector3().crossVectors(ab, ap2);
  return cp1.dot(cp2) >= 0;
}

function pointInTriangle(p, a, b, c) {
  return sameSide(p, a, b, c) && sameSide(p, b, a, c) && sameSide(p, c, a, b);
}

function closestToSegment(p, a, b) {
  var ab = b.clone().sub(a);
  var nab = ab.clone().normalize();
  var n = nab.dot(p.clone().sub(a));
  if (n < 0) return a;
  if (n > ab.length()) return b;
  return a.clone().add(nab.multiplyScalar(n));
}

function closestToSides(p, sides) {
  var minDist = 1e9;
  var ret;
  sides.forEach(function (side) {
    var ct = closestToSegment(p, side[0], side[1]);
    var dist = ct.distanceTo(p);
    if (dist < minDist) {
      minDist = dist;
      ret = ct;
    }
  });
  return ret;
}

function closestPointToTriangle(p, a, b, c) {
  // if the point is inside the triangle then it's the closest point
  if (pointInTriangle(p, a, b, c)) return p;
  // otherwise it's the closest point to one of the sides
  return closestToSides(p, [
    [a, b],
    [b, c],
    [a, c],
  ]);
}

function findClosestPosition(point, object) {
  var closestDistance = 1e9; // inf
  var closestPointVec = new THREE.Vector3(); // inf
  var closestFaces = [];

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

    if (
      parseFloat(cp.distanceTo(point).toFixed(8)) <=
      parseFloat(closestDistance.toFixed(8))
    ) {
      if (cp.distanceTo(point) == closestDistance) {
        closestFaces.push(face);
      } else closestFaces = [face];
      closestDistance = cp.distanceTo(point);
      closestPointVec.copy(cp);
    }
  });

  isin = true;

  for (let i = 0; i < closestFaces.length; i++) {
    const angle = point
      .clone()
      .sub(closestPointVec)
      .angleTo(closestFaces[i].normal);
    if (angle <= Math.PI / 2) isin = false;
  }

  return [closestPointVec, isin];
}
