function addObstacle(animateFunction) {
  const loader = new THREE.GLTFLoader();
  loader.load("rocks.glb", (gltf) => {
    rockModel = gltf.scene.children[0];
    rockModel.position.set(0, 0, 0);
    rockModel.scale.set(1, 1, 1);

    rockModel.geometry = new THREE.Geometry().fromBufferGeometry(
      rockModel.geometry
    );

    obstacle = new THREE.Mesh(
      rockModel.geometry,
      new THREE.MeshNormalMaterial({ wireframe: false })
    );
    obstacle.scale.set(6, 6, 6);
    obstacle.position.set(vars.boundSize / 2, 1, vars.boundSize / 2);
    // obstacle.rotation.y = 4.74;
    obstacle.updateMatrixWorld();
    scene.add(obstacle);

    // findVectorField(cone);
    addVectorField(obstacle);

    animateFunction();
  });
}

var vectorField;

function addVectorField(object) {
  fieldSize = 10;
  vectorField = [];
  for (let index1 = 0.5; index1 < fieldSize; index1++) {
    line1 = [];
    for (let index2 = 0.5; index2 < fieldSize; index2++) {
      line2 = [];
      for (let index3 = 0.5; index3 < fieldSize; index3++) {
        const origin = new THREE.Vector3(index1, index2, index3);
        origin.multiplyScalar(4);
        // const target = new THREE.Vector3(
        //   vars.boundSize / 2,
        //   vars.boundSize / 2,
        //   vars.boundSize / 2
        // );
        const avoidRadius = 8;
        let target = findClosestPosition(origin, object);
        // target.sub(origin);
        target = origin.clone().sub(target);

        let length = target.length();
        if (length > avoidRadius) {
          length = 0;
        } else {
          length = 1 - length / avoidRadius;
          length = Math.pow(length, 3);
          // console.log(length);

          target.normalize();
          arrow = new THREE.ArrowHelper(
            target,
            origin,
            length * 1,
            0xffaaaa,
            0.2,
            0.2
          );
          scene.add(arrow);
        }

        target.setLength(length);
        line2.push(target);
      }
      line1.push(line2);
    }
    vectorField.push(line1);
  }
  // console.log(vectorField);
}

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

  var geometry = object.geometry;
  geometry.faces.forEach(function (face) {
    var normal = face.normal;

    var va = geometry.vertices[face.a].clone();
    var vb = geometry.vertices[face.b].clone();
    var vc = geometry.vertices[face.c].clone();
    va.applyMatrix4(object.matrixWorld);
    vb.applyMatrix4(object.matrixWorld);
    vc.applyMatrix4(object.matrixWorld);
    // va = object.getWorldPosition(va);
    // vb = object.getWorldPosition(vb);
    // vc = object.getWorldPosition(vc);

    var pd = normal.dot(point.clone().sub(va));
    // move p -(pd - td) units in the direction of the normal
    var proj = point.clone().sub(normal.clone().multiplyScalar(pd));
    // closest point of proj and the triangle

    var cp = closestPointToTriangle(proj, va, vb, vc);
    if (cp.distanceTo(point) < closestDistance) {
      closestDistance = cp.distanceTo(point);
      closestPointVec.copy(cp);
    }
  });

  return closestPointVec;
}
