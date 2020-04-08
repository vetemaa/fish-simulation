var plane;
var vectorField;
var distanceField;
var fieldDimension = 12;
var fieldSize = 40;
var voxelSize = fieldSize / (fieldDimension - 1);
var textureSize = 100;

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
    obstacle.scale.set(5, 5, 5);
    obstacle.position.set(20, 8, 20);
    // obstacle.rotation.y = 4.74;
    obstacle.updateMatrixWorld();
    scene.add(obstacle);

    addVectorField(obstacle);

    animateFunction();
  });
}

function addVectorField(object) {
  distanceField = [];
  vectorField = [];

  for (let i1 = 0.0; i1 < fieldDimension; i1++) {
    line1vec = [];
    line1dist = [];
    for (let i2 = 0.0; i2 < fieldDimension; i2++) {
      line2vec = [];
      line2dist = [];
      for (let i3 = 0.0; i3 < fieldDimension; i3++) {
        const origin = new THREE.Vector3(i1, i2, i3);
        origin.multiplyScalar(voxelSize);
        const avoidRadius = 12;

        const result = findClosestPosition(origin, object);
        const inside = result[1];
        let target = result[0];
        // target.sub(origin);

        target = origin.clone().sub(target);
        let length = target.length();

        if (length > avoidRadius) {
          length = 0;
        } else {
          length = 1 - length / avoidRadius;
          length = Math.pow(length, 4);
        }
        if (inside) length = 1;

        target.normalize();
        // addArrow(target, origin, length, inside ? 0xff0000 : 0x00ff00);

        // if (length != 0) addArrow(target, origin, length, 0x00ff00);

        target.setLength(length);
        // if (inside) target = false;

        line2vec.push(target);
        line2dist.push(length);
      }
      line1vec.push(line2vec);
      line1dist.push(line2dist);
    }
    vectorField.push(line1vec);
    distanceField.push(line1dist);
  }

  addGradientField();
  addPlane();
}

function colorFromScalar(scalar) {
  // if (scalar < 0) scalar = Math.abs(scalar);
  if (scalar < 0 || scalar > 1) scalar = 0;
  const r = Math.round(scalar * 255);
  const g = Math.round(0);
  const b = Math.round((1 - scalar) * 255);
  return new THREE.Color(`rgb(${r}, ${g}, ${b})`);
}

function addGradientField() {
  gradientField = [];

  for (let i1 = 0; i1 < fieldDimension; i1++) {
    line1vec = [];
    for (let i2 = 0; i2 < fieldDimension; i2++) {
      line2vec = [];
      for (let i3 = 0; i3 < fieldDimension; i3++) {
        surroundingValues = [];

        const d = fieldDimension;
        for (let x = i1 == 0 ? 0 : -1; x < (i1 + 1 == d ? 1 : 2); x++) {
          for (let y = i2 == 0 ? 0 : -1; y < (i2 + 1 == d ? 1 : 2); y++) {
            for (let z = i3 == 0 ? 0 : -1; z < (i3 + 1 == d ? 1 : 2); z++) {
              surroundingPos = [i1 + x, i2 + y, i3 + z];
              value =
                distanceField[surroundingPos[0]][surroundingPos[1]][
                  surroundingPos[2]
                ];
              surroundingValues.push([x * value, y * value, z * value]);
            }
          }
        }

        vector = new THREE.Vector3(...findMeanPos(surroundingValues));
        vector.multiplyScalar(-1);
        const origin = new THREE.Vector3(i1, i2, i3);
        origin.multiplyScalar(voxelSize);

        // console.log(vector.length());

        dist = distanceField[i1][i2][i3];

        if (dist != 0) {
          // addArrow(vector.clone().normalize(), origin, dist, 0xff0000);
          addArrow(
            vector.clone().normalize(),
            origin,
            1,
            colorFromScalar(dist)
          );
        }

        vector.setLength(dist);

        line2vec.push(vector);
      }
      line1vec.push(line2vec);
    }
    gradientField.push(line1vec);
  }
}

function findMeanPos(positions) {
  mean = [0, 0, 0];
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    for (let i = 0; i < 3; i++) {
      mean[0] += pos[0];
      mean[1] += pos[1];
      mean[2] += pos[2];
    }
  }

  for (let i = 0; i < 3; i++) {
    mean[0] /= positions.length;
    mean[1] /= positions.length;
    mean[2] /= positions.length;
  }
  return mean;
}

function addPlane() {
  const planeSize = vars.boundSize;

  const geom = new THREE.PlaneBufferGeometry(planeSize, planeSize);
  const mat = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
  });
  plane = new THREE.Mesh(geom, mat);
  plane.planeSize = planeSize;
  scene.add(plane);
  plane.position.set(planeSize / 2, planeSize / 2, 0);

  updatePlaneTexture();
  plane.visible = false;
}

function texturePosToWorldPos(pos) {
  for (let i = 0; i < 2; i++) {
    const axisPos = pos[i];
    const worldAxisPos = ((axisPos + 0.0) / textureSize) * fieldSize;
    pos[i] = worldAxisPos;
  }

  return pos;
}

function worldPosToGradientVector(pos, field, deltas = []) {
  voxels = [];

  for (let i = 0; i < 3; i++) {
    const worldAxisPos = pos[i];
    if (worldAxisPos < 0 || worldAxisPos > fieldSize) return false;
    const voxel = worldAxisPos / voxelSize;
    const floorVoxel = Math.floor(voxel);
    deltas.push(voxel - floorVoxel);
    voxels.push(floorVoxel);
  }

  const fieldValues = [];

  for (let x = 0; x < 2; x++) {
    for (let y = 0; y < 2; y++) {
      for (let z = 0; z < 2; z++) {
        let xVal = voxels[0] + x;
        let yVal = voxels[1] + y;
        let zVal = voxels[2] + z;
        fieldValues.push(field[xVal][yVal][zVal]);
      }
    }
  }

  return fieldValues;
}

function worldPosToFieldValues(pos, field, deltas = []) {
  voxels = [];

  for (let i = 0; i < 3; i++) {
    const worldAxisPos = pos[i];
    if (worldAxisPos < 0 || worldAxisPos > fieldSize) return false;
    const voxel = worldAxisPos / voxelSize;
    const floorVoxel = Math.floor(voxel);
    deltas.push(voxel - floorVoxel);
    voxels.push(floorVoxel);
  }

  const fieldValues = [];

  for (let x = 0; x < 2; x++) {
    for (let y = 0; y < 2; y++) {
      for (let z = 0; z < 2; z++) {
        let xVal = voxels[0] + x;
        let yVal = voxels[1] + y;
        let zVal = voxels[2] + z;
        fieldValues.push(field[xVal][yVal][zVal]);
      }
    }
  }

  return fieldValues;
}

function lerp(x, q0, q1) {
  return (1 - x) * q0 + x * q1;
}

function smootherstep(x, q0, q1) {
  // Scale, and clamp x to 0..1 range
  x = clamp((x - q0) / (q1 - q0), 0, 1);
  // Evaluate polynomial
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function clamp(x, lowerlimit, upperlimit) {
  if (x < lowerlimit) x = lowerlimit;
  if (x > upperlimit) x = upperlimit;
  return x;
}

function lerpVecs(x, q0, q1) {
  if (!q0) return q1;
  if (!q1) return q0;
  return new THREE.Vector3().lerpVectors(q0, q1, x);
}

function triLerp(fun, x, y, z, q000, q001, q010, q011, q100, q101, q110, q111) {
  q00 = fun(x, q000, q100);
  q01 = fun(x, q001, q101);
  q10 = fun(x, q010, q110);
  q11 = fun(x, q011, q111);

  q0 = fun(y, q00, q10);
  q1 = fun(y, q01, q11);

  q = fun(z, q0, q1);
  return q;
}

function updatePlaneTexture() {
  plane.position.z =
    vars.boundSize / 2.8 + (Math.sin(Date.now() / 500) * vars.boundSize) / 6;
  plane.position.z = vars.boundSize / 2;
  // plane.position.z = voxelSize * 4;

  const pixelData = [];

  for (let y = 0; y < textureSize; ++y) {
    for (let x = 0; x < textureSize; ++x) {
      worldPos = texturePosToWorldPos([x, y]);
      worldPos[2] = plane.position.z;

      let deltas = [];
      fieldValues = worldPosToFieldValues(worldPos, distanceField, deltas);
      value = triLerp(lerp, ...deltas, ...fieldValues);
      value = fieldValues[0];
      // value = triLerp(smootherstep, ...deltas, ...fieldValues);

      // // fieldVectors = worldPosToFieldValues(worldPos, vectorField, deltas);
      // fieldVectors = worldPosToFieldValues(worldPos, gradientField, deltas);
      // value = triLerp(lerpVecs, ...deltas, ...fieldVectors);
      // // console.log(value);
      // if (!value) value = 1;
      // else value = value.length();
      // // value *= 100;

      pixelData.push(value * 255, 0, 0, 255);
      // pixelData.push(255, 0, 0, value * 255 + 10);
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

function addArrow(target, origin, length = 1, color = 0xffffff) {
  const arrow = new THREE.ArrowHelper(
    target,
    origin,
    length,
    color,
    0.44,
    0.36
  );
  // console.log(arrow);

  arrow.children.forEach((child) => {
    child.material.transparent = true;
    child.material.opacity = 0.5;
  });
  scene.add(arrow);
}
