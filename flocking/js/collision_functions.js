var plane;
var vectorField;
var distanceField;
var fieldDimension = 10;
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
      new THREE.MeshNormalMaterial({ wireframe: true })
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

  for (let index1 = 0.0; index1 < fieldDimension; index1++) {
    line1vec = [];
    line1dist = [];
    for (let index2 = 0.0; index2 < fieldDimension; index2++) {
      line2vec = [];
      line2dist = [];
      for (let index3 = 0.0; index3 < fieldDimension; index3++) {
        const origin = new THREE.Vector3(index1, index2, index3);
        origin.multiplyScalar(voxelSize);
        // const target = new THREE.Vector3(
        //   vars.boundSize / 2,
        //   vars.boundSize / 2,
        //   vars.boundSize / 2
        // );
        const avoidRadius = 9;
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
          length = Math.pow(length, 1);
        }
        if (inside) length = 0;

        target.normalize();
        arrow = new THREE.ArrowHelper(
          target,
          origin,
          length * 1,
          // colorFromScalar(length),
          inside ? 0xff0000 : 0x00ff00,
          0.2,
          0.2
        );
        scene.add(arrow);

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

function addGradientField() {
  gradientField = [];

  for (let index1 = 0; index1 < fieldDimension; index1++) {
    line1vec = [];
    for (let index2 = 0; index2 < fieldDimension; index2++) {
      line2vec = [];
      for (let index3 = 0; index3 < fieldDimension; index3++) {
        surroundingValues = [];

        for (
          let x = index1 == 0 ? 0 : -1;
          x < (index1 + 1 == fieldDimension ? 1 : 2);
          x++
        ) {
          for (
            let y = index2 == 0 ? 0 : -1;
            y < (index2 + 1 == fieldDimension ? 1 : 2);
            y++
          ) {
            for (
              let z = index3 == 0 ? 0 : -1;
              z < (index3 + 1 == fieldDimension ? 1 : 2);
              z++
            ) {
              surroundingPos = [index1 + x, index2 + y, index3 + z];
              // console.log(x, y, z);
              value =
                distanceField[surroundingPos[0]][surroundingPos[1]][
                  surroundingPos[2]
                ];
              surroundingValues.push([x * value, y * value, z * value]);
            }
          }
        }

        vector = new THREE.Vector3(...findMeanPos(surroundingValues));
        // vector.normalize();

        const origin = new THREE.Vector3(index1, index2, index3);
        origin.multiplyScalar(voxelSize);
        arrow = new THREE.ArrowHelper(
          vector.clone().normalize(),
          origin,
          distanceField[index1][index2][index3] * 10,
          0xffff00,
          0.2,
          0.2
        );
        // scene.add(arrow);

        line2vec.push(vector);
      }
      line1vec.push(line2vec);
    }
    gradientField.push(line1vec);
  }

  console.log(gradientField);
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
  // lerpTest();
}

function texturePosToWorldPos(pos) {
  for (let i = 0; i < 2; i++) {
    const axisPos = pos[i];
    const worldAxisPos = ((axisPos + 0.0) / textureSize) * fieldSize;
    pos[i] = worldAxisPos;
  }

  return pos;
}

function worldPosToFieldValues(pos, field, deltas = []) {
  voxels = [];
  // deltas = [];

  for (let i = 0; i < 3; i++) {
    const worldAxisPos = pos[i];
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

function dotProduct(vector1, vector2) {
  let result = 0;
  for (let i = 0; i < 3; i++) {
    result += vector1[i] * vector2[i];
  }
  return result;
}

function lerp(x, q0, q1) {
  return (1 - x) * q0 + x * q1;
}

function lerpVecs(x, q0, q1) {
  if (!q0) return q1;
  if (!q1) return q0;
  return new THREE.Vector3().lerpVectors(q0, q1, x);
}

function triLerp(
  lerpFunc,
  x,
  y,
  z,
  q000,
  q001,
  q010,
  q011,
  q100,
  q101,
  q110,
  q111
) {
  q00 = lerpFunc(x, q000, q100);
  q01 = lerpFunc(x, q001, q101);
  q10 = lerpFunc(x, q010, q110);
  q11 = lerpFunc(x, q011, q111);

  q0 = lerpFunc(y, q00, q10);
  q1 = lerpFunc(y, q01, q11);

  q = lerpFunc(z, q0, q1);
  return q;
}

// function gradientOfValues(fieldVectors, deltas) {
//   for (let axis = 0; axis < 3; axis++) {
//     const element = array[axis];
//   }
// }

// var qwe = 0;

// function interPolateVectors(fieldValues, deltas) {
//   dotProducts = [];
//   if (qwe == 0) {
//     deltaPos = new THREE.Vector3(...deltas);
//     console.log(fieldValues);
//   }
//   qwe += 1;
// }

// function worldPosToGradientVector(pos, field, deltas = []) {
//   voxels = [];
//   // deltas = [];
//   fieldPos = [];

//   for (let i = 0; i < 3; i++) {
//     const worldAxisPos = pos[i];
//     const voxel = worldAxisPos / voxelSize;
//     fieldPos.push(voxel);
//     const floorVoxel = Math.floor(voxel);
//     deltas.push(voxel - floorVoxel);
//     voxels.push(floorVoxel);
//   }

//   const positions = [];
//   const fieldValues = [];
//   const vectors = [];

//   for (let x = 0; x < 2; x++) {
//     for (let y = 0; y < 2; y++) {
//       for (let z = 0; z < 2; z++) {
//         let xVal = voxels[0] + x;
//         let yVal = voxels[1] + y;
//         let zVal = voxels[2] + z;
//         positions.push([x, y, z]);
//         fieldValues.push(field[xVal][yVal][zVal]);
//       }
//     }
//   }

//   const steer = new THREE.Vector3();

//   for (let i = 0; i < positions.length; i++) {
//     const valuePos = positions[i];
//     const value = fieldValues[i];
//     // console.log(valuePos);

//     let vector = new THREE.Vector3(
//       valuePos[0] - deltas[0],
//       valuePos[1] - deltas[1],
//       valuePos[2] - deltas[2]
//     );
//     // vector = new THREE.Vector3(
//     //   deltas[0] - valuePos[0],
//     //   deltas[1] - valuePos[1],
//     //   deltas[2] - valuePos[2]
//     // );
//     console.log(vector);

//     let len = vector.length();
//     len = 1 - len / Math.sqrt(3);
//     // len *= value;

//     // vector.sub(new THREE.Vector3());
//     // vector = new THREE.Vector3().sub(vector);

//     arrow = new THREE.ArrowHelper(
//       vector.normalize(),
//       new THREE.Vector3(...pos),
//       len * 1 * voxelSize,
//       0xffffff,
//       0.4,
//       0.4
//     );
//     scene.add(arrow);

//     // console.log(len);
//     // console.log(len);
//     // vector.multiplyScalar(value);
//     vector.setLength(len);

//     steer.add(vector);
//   }

//   let len = steer.length();

//   arrow = new THREE.ArrowHelper(
//     steer.normalize(),
//     new THREE.Vector3(...pos),
//     len * 1 * voxelSize,
//     0x00ff00,
//     0.4,
//     0.4
//   );
//   scene.add(arrow);

//   const length = steer.length();

//   return steer;
// }

// function gradientVector(fieldVectors, deltas) {

// }

function updatePlaneTexture() {
  plane.position.z =
    vars.boundSize / 2.8 + (Math.sin(Date.now() / 500) * vars.boundSize) / 6;
  plane.position.z = vars.boundSize / 2;

  const pixelData = [];
  // plane.visible = false;

  // worldPosToGradientVector([6, 6, 6], distanceField, []);

  for (let y = 0; y < textureSize; ++y) {
    for (let x = 0; x < textureSize; ++x) {
      worldPos = texturePosToWorldPos([x, y]);
      worldPos[2] = plane.position.z;

      let deltas = [];
      // fieldValues = worldPosToFieldValues(worldPos, distanceField, deltas);
      // value = triLerp(lerp, ...deltas, ...fieldValues);

      fieldVectors = worldPosToFieldValues(worldPos, vectorField, deltas);
      // fieldVectors = worldPosToFieldValues(worldPos, gradientField, deltas);
      value = triLerp(lerpVecs, ...deltas, ...fieldVectors);
      // console.log(value);
      if (!value) value = 1;
      else value = value.length();
      // value *= 100;

      // gradientVector(fieldVectors, deltas);
      // value = worldPosToGradientVector(worldPos, distanceField, deltas);
      // value = value.length() / 3;

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
    // va = object.getWorldPosition(va);
    // vb = object.getWorldPosition(vb);
    // vc = object.getWorldPosition(vc);

    var pd = normal.dot(point.clone().sub(va));
    // move p -(pd - td) units in the direction of the normal
    var proj = point.clone().sub(normal.clone().multiplyScalar(pd));
    // closest point of proj and the triangle

    var cp = closestPointToTriangle(proj, va, vb, vc);

    if (
      point.x == 40 &&
      point.y == 4.444444444444445 &&
      point.z == 22.22222222222222
    ) {
      if (cp.distanceTo(point) < 6.7) {
        console.log(cp.distanceTo(point));
        console.log(face);
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        mesh.position.copy(cp);
        console.log(mesh);
        scene.add(mesh);
      }
    }

    // console.log(cp.distanceTo(point).toFixed(4) <= closestDistance.toFixed(4));

    if (
      parseFloat(cp.distanceTo(point).toFixed(8)) <=
      parseFloat(closestDistance.toFixed(8))
    ) {
      // console.log("aa");
      if (cp.distanceTo(point) == closestDistance) {
        closestFaces.push(face);
        // console.log("a");
      } else closestFaces = [face];
      closestDistance = cp.distanceTo(point);
      closestPointVec.copy(cp);
      // closestFaces = face;
    }
  });

  // if (point.y = 10)

  // console.log(point.y == 5.714285714285714);
  isin = false;

  for (let i = 0; i < closestFaces.length; i++) {
    const angle = point
      .clone()
      .sub(closestPointVec)
      .angleTo(closestFaces[i].normal);
    if (angle <= Math.PI / 2) isin = true;
  }

  // console.log(isin);

  // if (closestFaces[0] == undefined) console.log(point);
  const angle = point
    .clone()
    .sub(closestPointVec)
    .angleTo(closestFaces[0].normal);
  // .angleTo(closestFaces[closestFaces.length - 1].normal);

  if (!isin && point.x === 40) {
    // console.log(point);
    closestFaces.forEach((face) => {
      if (angle >= Math.PI / 2) {
        console.log("a");
        arrow = new THREE.ArrowHelper(
          point.clone().sub(closestPointVec).normalize(),
          closestPointVec,
          10,
          // colorFromScalar(length),
          0xffffff,
          0.2,
          0.2
        );
        scene.add(arrow);

        arrow = new THREE.ArrowHelper(
          face.normal.normalize(),
          closestPointVec,
          10,
          // colorFromScalar(length),
          0x00ffff,
          0.2,
          0.2
        );
        scene.add(arrow);
      }
    });
    console.log(closestFaces);
  }

  // if (angle >= Math.PI / 2) return [closestPointVec, true];
  // else return [closestPointVec, false];
  return [closestPointVec, !isin];
}
