var plane;
var vectorField;
var distanceField;
var fieldDimension = 10;
var fieldSize = 40;
var voxelSize = fieldSize / fieldDimension;
var textureSize = 20;

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
    obstacle.position.set(vars.boundSize / 2, 4, vars.boundSize / 2);
    // obstacle.rotation.y = 4.74;
    obstacle.updateMatrixWorld();
    scene.add(obstacle);

    // findVectorField(cone);
    addVectorField(obstacle);

    animateFunction();
  });
}

function colorFromScalar(scalar) {
  // if (scalar < 0) scalar = Math.abs(scalar);
  if (scalar < 0 || scalar > 1) scalar = 0;
  const r = Math.round(scalar * 255);
  const g = Math.round(0);
  const b = Math.round((1 - scalar) * 255);
  return new THREE.Color(`rgb(${r}, ${g}, ${b})`);
}

function addVectorField(object) {
  distanceField = [];
  vectorField = [];

  for (let index1 = 0.5; index1 < fieldDimension; index1++) {
    line1vec = [];
    line1dist = [];
    for (let index2 = 0.5; index2 < fieldDimension; index2++) {
      line2vec = [];
      line2dist = [];
      for (let index3 = 0.5; index3 < fieldDimension; index3++) {
        const origin = new THREE.Vector3(index1, index2, index3);
        origin.multiplyScalar(voxelSize);
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
          length = Math.pow(length, 1);

          target.normalize();
          arrow = new THREE.ArrowHelper(
            target,
            origin,
            length * 1,
            colorFromScalar(length),
            0.2,
            0.2
          );
          scene.add(arrow);
        }
        target.setLength(length);

        line2vec.push(target);
        line2dist.push(length);
      }
      line1vec.push(line2vec);
      line1dist.push(line2dist);
    }
    vectorField.push(line1vec);
    distanceField.push(line1dist);
  }

  addPlane();
}

function addPlane() {
  const planeSize = vars.boundSize;

  const geom = new THREE.PlaneBufferGeometry(planeSize, planeSize);
  const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  plane = new THREE.Mesh(geom, mat);
  plane.planeSize = planeSize;
  scene.add(plane);
  plane.position.set(planeSize / 2, planeSize / 2, 0);

  updatePlaneTexture();
}

function texturePosToWorldPos(pos) {
  for (let i = 0; i < 2; i++) {
    const axisPos = pos[i];
    const worldAxisPos = ((axisPos + 0.5) / textureSize) * fieldSize;
    pos[i] = worldAxisPos;
  }

  return pos;
}

function worldPosToFieldValue(pos) {
  for (let i = 0; i < 3; i++) {
    const worldAxisPos = pos[i];
    const fieldAxisPos = Math.floor(worldAxisPos / voxelSize);
    pos[i] = fieldAxisPos;
  }

  fieldValue = distanceField[pos[0]][pos[1]][pos[2]];

  return fieldValue;
}

function updatePlaneTexture() {
  plane.position.z =
    vars.boundSize / 4 + (Math.sin(Date.now() / 1000) * vars.boundSize) / 4;

  const pixelData = [];

  for (let y = 0; y < textureSize; ++y) {
    for (let x = 0; x < textureSize; ++x) {
      // r = distanceField[x][y][7] * 255;

      worldPos = texturePosToWorldPos([x, y]);
      // worldPos[2] = vars.boundSize / 2;
      worldPos[2] = plane.position.z;
      value = worldPosToFieldValue(worldPos);
      // color = colorFromScalar(value);
      // pixelData.push(color.r * 255, color.g * 255, color.b * 255, 255);
      // pixelData.push(255, 255 - value * 255, 255 - value * 255, 255);
      pixelData.push(value * 255, 0, 0, 255);
    }
  }

  const dataTexture = new THREE.DataTexture(
    Uint8Array.from(pixelData),
    textureSize,
    textureSize,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
    THREE.UVMapping
  );
  dataTexture.needsUpdate = true;

  plane.material.map = dataTexture;
}

function getFieldValue(field, pos) {
  let x = pos[0];
  let y = pos[1];
  let z = pos[2];
  x = Math.floor(x / voxelSize);
  y = Math.floor(y / voxelSize);
  z = Math.floor(z / voxelSize);

  if (
    0 < x &&
    x < fieldDimension &&
    0 < y &&
    y < fieldDimension &&
    0 < z &&
    z < fieldDimension
  ) {
    return field[x][y][z];
  }
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
