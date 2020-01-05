var stats, scene, renderer, composer;
var camera, cameraControls;
var geom, mat, mesh;

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setClearColor(0x222222222);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);
  stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.bottom = "0px";
  document.body.appendChild(stats.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(0, 0, 5);
  scene.add(camera);

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);

  geom = new THREE.BoxGeometry(2, 1, 0.5, 16, 8, 4);
  // geom = new THREE.ConeGeometry(0.3, 2);
  // geom.rotateZ(THREE.Math.degToRad(-90));

  mat = new THREE.MeshNormalMaterial({ wireframe: true });
  mesh = new THREE.Mesh(geom, mat);
  scene.add(mesh);

  scene.add(new THREE.AxesHelper(10));

  locomotionInit();
  animate();
}

function locomotionInit() {
  var origVertices = [];

  geom.vertices.forEach(vert => {
    origVertices.push(vert.clone());
  });

  geom._origVertices = origVertices;
}

function toRad(degree) {
  return (Math.PI * 2 * degree) / 360;
}

function locomotion() {
  let time = Date.now();
  let oscillation = Math.sin(time * vars.speed + Math.PI * 0.5);
  console.log(oscillation);

  geom.vertices.forEach((vert, i) => {
    var orgVert = geom._origVertices[i];
    let xOrg = orgVert.x;
    let yOrg = orgVert.y;
    let zOrg = orgVert.z;
    let undulation = Math.sin(
      xOrg * Math.PI * vars.undulationWaveLen + time * vars.speed
    );

    var newVert = orgVert.clone();
    newVert.x -= 0.5;

    //yaw
    if (vars.yaw) {
      angle =
        toRad(vars.yaw_angle) *
        undulation *
        sinMask(orgVert.x, -1, 1, vars.yaw_maskWavLen, vars.yaw_maskOffset);
      newVert.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      // newVert.z = orgVert.z * Math.cos(angle) + orgVert.x * -Math.sin(angle);
      // newVert.x = orgVert.z * Math.sin(angle) + orgVert.x * Math.cos(angle);
    }

    if (vars.linearYaw) {
      angle =
        toRad(vars.linearYaw_angle) *
        oscillation *
        sinMask(
          orgVert.x,
          -1,
          1,
          vars.linearYaw_maskWavLen,
          vars.linearYaw_maskOffset
        );
      newVert.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      // newVert.z = orgVert.z * Math.cos(angle) + orgVert.x * -Math.sin(angle);
      // newVert.x = orgVert.z * Math.sin(angle) + orgVert.x * Math.cos(angle);
    }

    //roll
    if (vars.roll) {
      angle =
        toRad(vars.roll_angle) *
        undulation *
        sinMask(orgVert.x, -1, 1, vars.roll_maskWavLen, vars.roll_maskOffset);
      newVert.applyAxisAngle(new THREE.Vector3(1, 0, 0), angle);
      //   newVert.z = orgVert.z * Math.cos(angle) + orgVert.y * -Math.sin(angle);
      //   newVert.y = orgVert.z * Math.sin(angle) + orgVert.y * Math.cos(angle);
    }

    // //squeeze
    // if (vars.squeeze) {
    // zNew *= sinMask(
    //   vert.x,
    //   -1,
    //   1,
    //   vars.squeeze_maskWavLen,
    //   vars.squeeze_maskOffset
    // );
    // }

    //sinwave
    if (vars.sinWav) {
      newVert.z +=
        undulation *
        sinMask(
          orgVert.x,
          -1,
          1,
          vars.sinWav_maskWavLen,
          vars.sinWav_maskOffset
        );
    }

    //side-to-side
    if (vars.s2s) {
      newVert.z += oscillation / 3;
      // sinMask(orgVert.x, -1, 1, vars.s2s_maskWavLen, vars.s2s_maskOffset) / 3;
    }

    vert.x = newVert.x;
    vert.y = newVert.y;
    vert.z = newVert.z;
  });

  geom.verticesNeedUpdate = true;
}

function mask(value, start, end) {
  maskedValue = (value - start) / (end - start);
  return maskedValue;
}

function sinMask(value, start, end, maskWavLen, maskOffset) {
  if (vars.masks) {
    maskedValue = mask(value, start, end) + maskOffset;
    piValue = (maskedValue * Math.PI) / 2;
    sinValue = Math.sin(piValue / maskWavLen);
    return (sinValue + 1) / 2;
  }
  return 1;
}

function animate() {
  requestAnimationFrame(animate);
  render();
  stats.update();
}

function colorVert() {
  if (!currentMask || !vars.masks) {
    mesh.material = new THREE.MeshNormalMaterial({});
    geom.elementsNeedUpdate = true;
    geom.normalsNeedUpdate = true;
    return;
  }

  mesh.material = new THREE.MeshBasicMaterial({
    vertexColors: THREE.VertexColors
  });
  geom.faces.forEach(face => {
    ["a", "b", "c"].forEach((vert, indx) => {
      xPos = geom.vertices[face[vert]].x;
      //   maskedValue = mask(xPos, -1, 1);
      maskedValue = sinMask(
        xPos,
        -1,
        1,
        vars[currentMask + "_maskWavLen"],
        vars[currentMask + "_maskOffset"]
      );
      face.vertexColors[indx] = new THREE.Color(
        maskedValue,
        maskedValue,
        maskedValue
      );
    });
  });
  geom.elementsNeedUpdate = true;
}

let count = 0;
function render() {
  var PIseconds = Date.now() * Math.PI;

  cameraControls.update();

  colorVert();
  locomotion();

  //   scene.traverse(function(object3d, i) {
  //     if (object3d instanceof THREE.Mesh === false) return;
  //     object3d.rotation.y =
  //       vars.speed * PIseconds * 0.0003 * (i % 2 ? 1 : -1);
  //     object3d.rotation.x =
  //       vars.speed * PIseconds * 0.0002 * (i % 2 ? 1 : -1);
  //   });

  renderer.render(scene, camera);
}
