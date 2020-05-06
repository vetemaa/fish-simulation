var plane, distanceField, avoidanceField;
var obstacles = [];
let voxelSize;

const fieldSize = 40; // 40 for figures
const textureSize = 180; // 1080 for figures

function addObstacles(animateFunction) {
  const torus = new THREE.Mesh(
    // new THREE.TorusKnotGeometry(10, 0.4, 40, 4),
    new THREE.TorusGeometry(11, 1.8, 6, 20),
    new THREE.MeshNormalMaterial({})
  );
  torus.position.set(20, 20 - 2.857, 20);

  generateAndAnimate = () => {
    addPlane();
    generateAvoidanceField();
    changeObstacles();
    animateFunction();
  };

  const server = true;
  if (server) {
    // obstacles.push(torus);
    // scene.add(torus);
    importModel(generateAndAnimate); // NB! only works on a server
  } else {
    obstacles.push(torus);
    scene.add(torus);
    generateAndAnimate();
  }
}

function importModel(animateFunction) {
  new THREE.GLTFLoader().load("rocks.glb", (gltf) => {
    const rocks = new THREE.Mesh(
      new THREE.Geometry().fromBufferGeometry(gltf.scene.children[0].geometry),
      new THREE.MeshNormalMaterial({})
    );
    rocks.scale.set(3, 3, 3);
    rocks.position.set(21, 15, 20);
    obstacles.push(rocks);
    scene.add(rocks);

    animateFunction();
  });
}

function generateDistanceField(obstacles) {
  voxelSize = fieldSize / (vars.resoultion - 1);

  distanceField = [];
  let yArray = [];
  let zArray = [];

  for (let i = 0; i < vars.resoultion; i++) {
    for (let j = 0; j < vars.resoultion; j++) {
      for (let k = 0; k < vars.resoultion; k++) {
        const origin = new THREE.Vector3(i, j, k).multiplyScalar(voxelSize);

        let length = Infinity;
        let inside;
        for (let i = 0; i < obstacles.length; i++) {
          const obstacle = obstacles[i];
          obstacle.updateMatrixWorld();

          const { closestPoint, insideMesh } = findClosestPosition(
            origin,
            obstacle
          );
          const closestPointVec = origin.clone().sub(closestPoint);

          if (closestPointVec.length() < length) {
            inside = insideMesh;
            length = closestPointVec.length();
          }
        }

        if (length > vars.avoidRadius) {
          length = 1;
        } else if (inside) {
          length = 0;
        } else {
          length = length / vars.avoidRadius;
        }

        zArray.push(length);
      }
      yArray.push(zArray);
      zArray = [];
    }
    distanceField.push(yArray);
    yArray = [];
  }
}

function generateAvoidanceField() {
  generateDistanceField(obstacles);

  avoidanceField = [];
  let yArray = [];
  let zArray = [];

  for (let i = 0; i < vars.resoultion; i++) {
    for (let j = 0; j < vars.resoultion; j++) {
      for (let k = 0; k < vars.resoultion; k++) {
        dist = distanceField[i][j][k];
        gradient = new THREE.Vector3();

        if (
          i != 0 &&
          j != 0 &&
          k != 0 &&
          i != vars.resoultion - 1 &&
          j != vars.resoultion - 1 &&
          k != vars.resoultion - 1
        ) {
          for (let x = -1; x < 2; x++) {
            for (let y = -1; y < 2; y++) {
              for (let z = -1; z < 2; z++) {
                const vec = new THREE.Vector3(x, y, z);
                value = distanceField[i + x][j + y][k + z];
                vec.setLength(value);
                gradient.add(vec);
              }
            }
          }
          gradient.setLength(Math.pow(1 - dist, vars.raisedTo));
        }
        zArray.push(gradient);
      }
      yArray.push(zArray);
      zArray = [];
    }
    avoidanceField.push(yArray);
    yArray = [];
  }

  updatePlaneTexture();
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

function avoidanceFieldValue(pos) {
  const voxels = [];
  const deltas = [];
  const steer = new THREE.Vector3();
  const positionArray = pos.toArray();

  for (let i = 0; i < 3; i++) {
    const worldAxisPos = positionArray[i];
    if (worldAxisPos < 0 || worldAxisPos > fieldSize) return steer;
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
        fieldValues.push(avoidanceField[xVal][yVal][zVal]);
      }

  steer.copy(triLerp(lerpVecs, ...deltas, ...fieldValues));
  return steer;
}

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

// everything below here is for visualizations
function addPlane() {
  plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(fieldSize, fieldSize),
    new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      map: new THREE.DataTexture(
        new Uint8Array(textureSize * textureSize * 4),
        textureSize,
        textureSize
      ),
    })
  );
  plane.position.set(fieldSize / 2, fieldSize / 2, fieldSize / 2);
  scene.add(plane);

  plane.changePos = true;
}

function updatePlaneTexture() {
  if (!plane.visible) return;
  plane.position.z = vars.planePosition;

  const pixelData = [];
  for (let y = 0; y < textureSize; ++y) {
    for (let x = 0; x < textureSize; ++x) {
      worldPos = [
        (x / textureSize) * fieldSize,
        (y / textureSize) * fieldSize,
        plane.position.z,
      ];

      let deltas = [];

      // show vector field
      // const field = vectorField;
      let field = avoidanceField;
      let lerpFunc = lerpVecs;
      let valueCalc = (value) => value.length();

      // show distance field
      const showDistanceField = false;
      if (showDistanceField) {
        field = distanceField;
        lerpFunc = lerp;
        valueCalc = (value) => value;
      }

      fieldVectors = worldPosToFieldValues(worldPos, field, deltas);
      value = valueCalc(triLerp(lerpFunc, ...deltas, ...fieldVectors));

      pixelData.push(255, 0, 0, value * 255);
    }
  }

  plane.material.map.image.data.set(Uint8Array.from(pixelData));
  plane.material.map.needsUpdate = true;
  plane.changePos = false;
}

//
// helper functions
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
  return fun(z, q0, q1);
}

// arrows for avoidance visuals
function addArrow(target, origin, length = 1, color = 0x000000) {
  if (length === 0) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: color })
    );
    sphere.position.copy(origin);
    scene.add(sphere);
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
