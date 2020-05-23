var plane, avoidanceField;
let voxelSize;

const obstacles = [];
const fieldSize = 40;
const textureSize = 180;

function addObstacles(animate) {
  generateAndAnimate = () => {
    addPlane();
    generateAvoidanceField();
    updateObstacles();
    animate();
    document.getElementById("loaderbg").style.display = "none";
  };

  // CORS-policy restrictions
  const { protocol } = window.location;
  if (protocol == "http:" || protocol == "https:") {
    importModel(generateAndAnimate);
  } else {
    const torus = new THREE.Mesh(
      // new THREE.TorusKnotGeometry(10, 0.4, 40, 4),
      new THREE.TorusGeometry(11, 1.8, 6, 20),
      new THREE.MeshNormalMaterial({})
    );
    torus.position.set(20, 20 - 2.857, 20);
    torus.updateMatrixWorld();

    obstacles.push(torus);
    scene.add(torus);

    generateAndAnimate();
  }
}

function importModel(generateAndAnimate) {
  new THREE.GLTFLoader().load("rocks.glb", (gltf) => {
    const rocks = new THREE.Mesh(
      new THREE.Geometry().fromBufferGeometry(gltf.scene.children[0].geometry),
      new THREE.MeshNormalMaterial({})
    );
    rocks.scale.set(3, 3, 3);
    rocks.position.set(21, 15, 20);
    rocks.updateMatrixWorld();

    obstacles.push(rocks);
    scene.add(rocks);

    generateAndAnimate();
  });
}

function generateDistanceField() {
  voxelSize = fieldSize / (vars.resoultion - 1);

  const distanceField = [];
  let yArray = [];
  let zArray = [];

  for (let i = 0; i < vars.resoultion; i++) {
    for (let j = 0; j < vars.resoultion; j++) {
      for (let k = 0; k < vars.resoultion; k++) {
        const origin = new THREE.Vector3(i, j, k).multiplyScalar(voxelSize);

        // finding the closest point vector
        let length = Infinity;
        let inside;
        for (let i = 0; i < obstacles.length; i++) {
          const obstacle = obstacles[i];

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

        // distance field changes
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

  return distanceField;
}

function generateAvoidanceField() {
  distanceField = generateDistanceField();

  avoidanceField = [];
  let yArray = [];
  let zArray = [];

  for (let i = 0; i < vars.resoultion; i++) {
    for (let j = 0; j < vars.resoultion; j++) {
      for (let k = 0; k < vars.resoultion; k++) {
        dist = distanceField[i][j][k];
        avoidanceVector = new THREE.Vector3();

        // not boundary case
        if (
          i != 0 &&
          j != 0 &&
          k != 0 &&
          i != vars.resoultion - 1 &&
          j != vars.resoultion - 1 &&
          k != vars.resoultion - 1
        ) {
          // 26-point stencil
          for (let x = -1; x < 2; x++) {
            for (let y = -1; y < 2; y++) {
              for (let z = -1; z < 2; z++) {
                const vec = new THREE.Vector3(x, y, z);
                vec.setLength(distanceField[i + x][j + y][k + z]);
                avoidanceVector.add(vec);
              }
            }
          }

          // avoidance vector changes
          avoidanceVector.setLength(Math.pow(1 - dist, vars.raisedTo));
        }
        zArray.push(avoidanceVector);
      }
      yArray.push(zArray);
      zArray = [];
    }
    avoidanceField.push(yArray);
    yArray = [];
  }

  updatePlaneTexture();
  showLoader(false);
}

function avoidanceFieldValue(pos) {
  const steer = new THREE.Vector3();
  const voxelPos = [];
  const voxelDeltas = [];

  // world pos to field array pos
  for (let i = 0; i < 3; i++) {
    const worldAxisPos = pos[i];
    if (worldAxisPos < 0 || worldAxisPos > fieldSize) return steer;

    const voxel = worldAxisPos / voxelSize;
    const flooredVoxel = Math.floor(voxel);
    voxelPos.push(flooredVoxel);
    voxelDeltas.push(voxel - flooredVoxel);
  }

  // neighbouring points in field
  const fieldValues = [];
  for (let x = 0; x < 2; x++)
    for (let y = 0; y < 2; y++)
      for (let z = 0; z < 2; z++) {
        let xVal = voxelPos[0] + x;
        let yVal = voxelPos[1] + y;
        let zVal = voxelPos[2] + z;
        fieldValues.push(avoidanceField[xVal][yVal][zVal]);
      }

  steer.copy(triLinearLerp(...voxelDeltas, ...fieldValues));
  return steer;
}

function lerpVectors(x, q0, q1) {
  if (!q0) return q1;
  if (!q1) return q0;
  return new THREE.Vector3().lerpVectors(q0, q1, x);
}

function triLinearLerp(
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
  const q00 = lerpVectors(x, q000, q100);
  const q01 = lerpVectors(x, q001, q101);
  const q10 = lerpVectors(x, q010, q110);
  const q11 = lerpVectors(x, q011, q111);
  const q0 = lerpVectors(y, q00, q10);
  const q1 = lerpVectors(y, q01, q11);
  return lerpVectors(z, q0, q1);
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

// everything below for visualizations
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

      const value = avoidanceFieldValue(worldPos).length();
      pixelData.push(255, 0, 0, value * 255);
    }
  }

  plane.material.map.image.data.set(Uint8Array.from(pixelData));
  plane.material.map.needsUpdate = true;
  plane.changePos = false;
}
