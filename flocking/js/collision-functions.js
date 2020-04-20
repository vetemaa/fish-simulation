var plane;
var vectorField;
var distanceField;
var gradientField;
var obstacle;
const fieldDimension = 13; // 13 for figures
const fieldSize = 40; // 40 for figures
const voxelSize = fieldSize / (fieldDimension - 1);
const textureSize = 140; // 1080 for figures
const avoidRadius = 12; // 9 for figures

function addObstacle(animateFunction) {
  const loader = new THREE.GLTFLoader();
  loader.load("rocks2.glb", (gltf) => {
    const rocks = new THREE.Mesh(
      new THREE.Geometry().fromBufferGeometry(gltf.scene.children[0].geometry),
      new THREE.MeshNormalMaterial({
        wireframe: true,
        color: 0x333333,
        opacity: 1,
        transparent: true,
      })
    );
    rocks.scale.set(3, 3, 3);
    rocks.position.set(20, 15, 20);
    // rocks.rotation.y = 4.74;
    // rocks.visible = false;

    const torus = new THREE.Mesh(
      // new THREE.TorusGeometry(3, 0.3, 8, 12),
      new THREE.TorusKnotGeometry(10, 0.4, 40, 4),
      new THREE.MeshNormalMaterial({ wireframe: true })
    );
    torus.position.set(20, 20, 20);

    const obstacles = [];
    obstacles.push(rocks);
    // obstacles.push(torus);
    obstacles.forEach((obstacle) => {
      scene.add(obstacle);
    });

    obstacle = rocks;

    addVectorField(obstacles);
    addGradientField();
    addPlane();
    changeObstacles();

    animateFunction();
  });
}

function addVectorField(obstacles) {
  distanceField = [];
  vectorField = [];

  for (let i1 = 0.0; i1 < fieldDimension; i1++) {
    const yArrayVec = [];
    const yArrayDist = [];
    for (let i2 = 0.0; i2 < fieldDimension; i2++) {
      const zArrayVec = [];
      const zArrayDist = [];
      for (let i3 = 0.0; i3 < fieldDimension; i3++) {
        const origin = new THREE.Vector3(i1, i2, i3).multiplyScalar(voxelSize);

        let steer = new THREE.Vector3();
        let length = 1e9;
        let inside;
        for (let i = 0; i < obstacles.length; i++) {
          const obstacle = obstacles[i];
          obstacle.updateMatrixWorld();
          const result = findClosestPosition(origin, obstacle);
          const closestPos = result[0];
          const vec = origin.clone().sub(closestPos);
          if (vec.length() < length) {
            inside = result[1];
            steer = vec;
            length = steer.length();
          }
        }

        const d = fieldDimension - 1;
        if (i1 == 0 || i2 == 0 || i3 == 0 || i1 == d || i2 == d || i3 == d) {
          length = 0;
        } else if (inside) {
          length = 1;
        } else if (length > avoidRadius) {
          length = 0;
        } else {
          length = 1 - length / avoidRadius;
          length = Math.pow(length, 6);
        }
        steer.setLength(length);

        // if (i3 == 6) addArrow(steer, origin, length * 1.5, 0x00ff00);
        // if (i3 == 6)
        // addArrow(steer, origin, length * 1.5, inside ? 0xff0000 : 0x00ff00);

        zArrayVec.push(steer);
        zArrayDist.push(length);
      }
      yArrayVec.push(zArrayVec);
      yArrayDist.push(zArrayDist);
    }
    vectorField.push(yArrayVec);
    distanceField.push(yArrayDist);
  }
}

function addGradientField() {
  gradientField = [];

  for (let i1 = 0; i1 < fieldDimension; i1++) {
    const yArray = [];
    for (let i2 = 0; i2 < fieldDimension; i2++) {
      const zArray = [];
      for (let i3 = 0; i3 < fieldDimension; i3++) {
        dist = distanceField[i1][i2][i3];
        gradient = new THREE.Vector3();

        if (dist == 0) {
          zArray.push(gradient);
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

        // const origin = new THREE.Vector3(i1, i2, i3).multiplyScalar(voxelSize);
        // if (i3 == 6) addArrow(gradient, origin, dist * 1.5, 0xff0000);

        zArray.push(gradient);
      }
      yArray.push(zArray);
    }
    gradientField.push(yArray);
  }
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
  const voxels = [];

  for (let i = 0; i < 3; i++) {
    const worldAxisPos = pos[i];
    if (worldAxisPos < 0 || worldAxisPos > fieldSize) return false;
    const voxel = worldAxisPos / voxelSize;
    const flooredVoxel = Math.floor(voxel);
    deltas.push(voxel - flooredVoxel);
    voxels.push(flooredVoxel);
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

function lerp(x, q0, q1) {
  return (1 - x) * q0 + x * q1;
}

function lerpVecs(x, q0, q1) {
  if (!q0) return q1;
  if (!q1) return q0;
  return new THREE.Vector3().lerpVectors(q0, q1, x);
}

function triLerp(fun, x, y, z, q000, q001, q010, q011, q100, q101, q110, q111) {
  const q00 = fun(x, q000, q100);
  const q01 = fun(x, q001, q101);
  const q10 = fun(x, q010, q110);
  const q11 = fun(x, q011, q111);
  const q0 = fun(y, q00, q10);
  const q1 = fun(y, q01, q11);
  const q = fun(z, q0, q1);
  return q;
}

// Everything below for visualization ---------------------------------
function worldPosToFieldValue(pos, field, deltas = []) {
  const voxels = [];

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

function addPlane() {
  const planeSize = vars.boundSize;

  plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(planeSize, planeSize),
    new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
    })
  );
  plane.position.set(planeSize / 2, planeSize / 2, 0);
  plane.size = planeSize;
  obstacle.plane = plane;
  scene.add(plane);

  updatePlaneTexture();
}

function updatePlaneTexture() {
  if (!plane.visible) return;

  plane.position.z =
    plane.size / 2.8 + (Math.sin(Date.now() / 500) * plane.size) / 6;
  plane.position.z = plane.size / 2;

  const pixelData = [];

  for (let y = 0; y < textureSize; ++y) {
    for (let x = 0; x < textureSize; ++x) {
      worldPos = texturePosToWorldPos([x, y]);
      worldPos[2] = plane.position.z;
      let deltas = [];

      // // distance field
      const field = distanceField;
      const lerpFunc = lerp;
      const valueCalc = (value) => value;

      // vector field
      // // const field = vectorField;
      // const field = gradientField;
      // const lerpFunc = lerpVecs;
      // const valueCalc = (value) => value.length();

      fieldVectors = worldPosToFieldValues(worldPos, field, deltas);
      value = triLerp(lerpFunc, ...deltas, ...fieldVectors);
      value = valueCalc(value);

      // pixelData.push(255, 255 - value * 255, 255 - value * 255, 255);
      pixelData.push(255, 255 - value * 255, 255 - value * 255, value * 255);
    }
  }

  plane.material.map = new THREE.DataTexture(
    Uint8Array.from(pixelData),
    textureSize,
    textureSize,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
    THREE.UVMapping
  );
}

function addArrow(target, origin, length = 1, color = 0x000000) {
  if (length === 0) {
    addSphere(origin, color);
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
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({ color: color })
  );
  sphere.position.copy(position);
  scene.add(sphere);
}
