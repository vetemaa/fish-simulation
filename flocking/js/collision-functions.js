var plane;
var vectorField;
var distanceField;
const fieldDimension = 33;
const fieldSize = 40;
const voxelSize = fieldSize / (fieldDimension - 1);
const textureSize = 120;
const avoidRadius = 9; // 12

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
      new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0x000000,
        opacity: 1,
        transparent: true,
      })
    );
    obstacle.scale.set(5, 5, 5);
    obstacle.position.set(20, 8, 20);
    // obstacle.rotation.y = 4.74;
    obstacle.updateMatrixWorld();
    // obstacle.visible = false;
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

        const result = findClosestPosition(origin, object);
        const closestPos = result[0];
        const inside = result[1];

        const steer = origin.clone().sub(closestPos);
        let length = steer.length();

        if (inside) {
          length = 1;
        } else if (length > avoidRadius) {
          length = 0;
        } else {
          length = 1 - length / avoidRadius;
          length = Math.pow(length, 4); // TODO: add back
        }

        // if (i3 == 6) addArrow(steer, origin, length * 1.5, 0xff0000);

        steer.setLength(length);
        line2vec.push(steer);

        const d = fieldDimension;
        if (i1 == 0 || i2 == 0 || i3 == 0 || i1 == d || i2 == d || i3 == d)
          length = 0;

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

  before = Date.now();
  for (let i1 = 0; i1 < fieldDimension; i1++) {
    line1vec = [];
    for (let i2 = 0; i2 < fieldDimension; i2++) {
      line2vec = [];
      for (let i3 = 0; i3 < fieldDimension; i3++) {
        dist = distanceField[i1][i2][i3];
        gradient = new THREE.Vector3();

        if (dist == 0) {
          line2vec.push(gradient);
          continue;
        }

        const d = fieldDimension;
        for (let x = Math.max(-1, -i1); x < Math.min(2, d - i1); x++)
          for (let y = Math.max(-1, -i2); y < Math.min(2, d - i2); y++)
            for (let z = Math.max(-1, -i3); z < Math.min(2, d - i3); z++) {
              value = distanceField[i1 + x][i2 + y][i3 + z];
              gradient.add(new THREE.Vector3(x * value, y * value, z * value));
            }

        gradient.multiplyScalar(-1);
        gradient.setLength(dist);

        // const origin = new THREE.Vector3(i1, i2, i3);
        // origin.multiplyScalar(voxelSize);
        // if (i3 == 6) addArrow(vector, origin, dist * 1.5, 0xff0000);

        line2vec.push(gradient);
      }
      line1vec.push(line2vec);
    }
    gradientField.push(line1vec);
  }
  console.log("gradient field calc time:", Date.now() - before);
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
  // plane.visible = false;
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

  for (let i = 0; i < 3; i++) {
    const worldAxisPos = pos[i];
    if (worldAxisPos < 0 || worldAxisPos > fieldSize) return false;
    const voxel = worldAxisPos / voxelSize;
    const floorVoxel = Math.floor(voxel);
    deltas.push(voxel - floorVoxel);
    voxels.push(floorVoxel);
  }

  const fieldValues = [];

  for (let x = 0; x < 2; x++)
    for (let y = 0; y < 2; y++)
      for (let z = 0; z < 2; z++) {
        let xVal = voxels[0] + x;
        let yVal = voxels[1] + y;
        let zVal = voxels[2] + z;
        fieldValues.push(field[xVal][yVal][zVal]);
      }

  return fieldValues;
}

function worldPosToFieldValue(pos, field, deltas = []) {
  voxels = [];

  for (let i = 0; i < 3; i++) {
    const worldAxisPos = pos[i];
    if (worldAxisPos < 0 || worldAxisPos > fieldSize) return false;
    const voxel = worldAxisPos / voxelSize;
    const floorVoxel = Math.floor(voxel);
    deltas.push(voxel - floorVoxel);
    voxels.push(floorVoxel);
  }

  return field[voxels[0]][voxels[1]][voxels[2]];
}

function lerp(x, q0, q1) {
  return (1 - x) * q0 + x * q1;
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

  const pixelData = [];

  for (let y = 0; y < textureSize; ++y) {
    for (let x = 0; x < textureSize; ++x) {
      worldPos = texturePosToWorldPos([x, y]);
      worldPos[2] = plane.position.z;
      let deltas = [];

      // interpolated distance field value
      // fieldVectors = worldPosToFieldValues(worldPos, distanceField, deltas);
      // value = triLerp(lerp, ...deltas, ...fieldVectors);

      // interpolated vector field value
      // fieldVectors = worldPosToFieldValues(worldPos, vectorField, deltas);
      fieldVectors = worldPosToFieldValues(worldPos, gradientField, deltas);
      value = triLerp(lerpVecs, ...deltas, ...fieldVectors);
      value = value.length();

      // field value
      // value = worldPosToFieldValue(worldPos, vectorField);
      // value = value.length();

      pixelData.push(255, 255 - value * 255, 255 - value * 255, 255);
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

function addArrow(target, origin, length = 1, color = 0xffffff) {
  if (length === 0) {
    addSphere(origin, 0xff0000);
  } else {
    const arrow = new THREE.ArrowHelper(
      target.clone().normalize(),
      origin,
      length,
      color,
      0.44,
      0.36
    );
    scene.add(arrow);
  }
}

function addSphere(position, color = 0xff00f0) {
  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({ color: color })
  );
  sphere.position.copy(position);
  scene.add(sphere);
}
