var folders = [];
var boundBox;

function datGui() {
  var vars = function() {
    this.boidCount = boidStartCount;
    this.play = true;
    this.playSpeed = 10;
    this.maxVelocity = 0.03;
    this.chaseCamera = false;
    this.separationDist = 2.4;
    this.alignmentDist = 8;
    this.cohesionDist = 12;
    this.boundSize = 60;
    this.animateVertices = true;
    this.showVectors = false;
    this.showBounds = true;
    this.separationScalar = 0.34;
    this.alignmentScalar = 0.08;
    this.cohesionScalar = 0.11;
    this.boundsScalar = 0.01;
    this.randomScalar = 0.08;
    this.randomSpeedMin = 0.3;
    this.ruleScalar = 0.5;
    // this.floorScalar = 0.1;
    this.shuffleBoids = () => shuffleBoids();
  };

  vars = new vars();
  gui = new dat.GUI();
  gui.width = 333;

  folMain = gui.addFolder("Main");
  folRules = gui.addFolder("Rules");
  folVisual = gui.addFolder("UI");

  // folMain.open();
  // folRules.open();
  // folVisual.open();

  folMain
    .add(vars, "boidCount", 0, boidTotalCount)
    .step(1)
    .onChange(value => hideBoids(value));
  folMain.add(vars, "play").listen();
  folMain.add(vars, "playSpeed", 0, 10).step(0.01);
  folMain.add(vars, "maxVelocity", 0, 0.1).step(0.01);
  folMain
    .add(vars, "chaseCamera")
    .listen()
    .onChange(value => {
      changeCamera(value);
    });

  folRules.add(vars, "ruleScalar", 0, 1).step(0.01);

  folWeights = folRules.addFolder("Rule Weights");
  folWeights.open();
  folWeights.add(vars, "separationScalar", 0, 1).step(0.01);
  folWeights.add(vars, "alignmentScalar", 0, 1).step(0.01);
  folWeights.add(vars, "cohesionScalar", 0, 1).step(0.01);
  folWeights.add(vars, "boundsScalar", 0, 1).step(0.01);
  folWeights.add(vars, "randomScalar", 0, 1).step(0.01);
  // folRules.add(vars, "floorScalar", 0, 10).step(0.01);

  folDists = folRules.addFolder("Rule Distances");
  folDists.open();
  folDists.add(vars, "separationDist", 0, 10).step(0.1);
  folDists.add(vars, "alignmentDist", 0, 100).step(1);
  folDists.add(vars, "cohesionDist", 0, 100).step(1);
  folRules
    .add(vars, "boundSize", 0, 100)
    .step(1)
    .onChange(value => updateBounds(value));
  folRules.add(vars, "randomSpeedMin", 0, 1).step(0.01);

  folVisual
    .add(vars, "showVectors")
    .onChange(value => changeVectorVisibility(value));
  folVisual
    .add(vars, "showBounds")
    .onChange(value => (boundBox.visible = value));

  folVertexAnim = folVisual.addFolder("Vertex Animation (only FishMesh)");
  folVertexAnim.add(vars, "animateVertices");

  gui.add(vars, "shuffleBoids");

  gui.domElement.style.opacity = 0.8;

  return vars;
}

function changeCamera(chaseCamera) {
  if (chaseCamera) {
    vars.chaseCamera = true;
    scene.fog = new THREE.Fog(backColor, 0.1, 100);
  } else {
    vars.chaseCamera = false;
    setFog();
  }
}

function initControls() {
  renderer.domElement.onkeyup = e => {
    if (e.keyCode == 32) vars.play = !vars.play;
    if (e.keyCode == 49) {
      changeCamera(true);
    }
    if (e.keyCode == 50) {
      changeCamera(false);
    }
  };

  window.addEventListener(
    "mousewheel",
    e => {
      if (vars.chaseCamera) {
        if (e.deltaY > 0) fishCameraDist += 0.1;
        else if (e.deltaY < 0 && fishCameraDist > 0.1) fishCameraDist -= 0.1;
        if (fishCameraDist < 0.1) boids[0].visible = false;
        else boids[0].visible = true;

        if (e.deltaX < 0) fishCameraFOV += e.deltaX * 0.01;
        else if (e.deltaX > 0) fishCameraFOV += e.deltaX * 0.01;
        if (fishCameraFOV > 160) fishCameraFOV = 160;
        else if (fishCameraFOV < 30) fishCameraFOV = 30;
        fishCamera.fov = fishCameraFOV;
        fishCamera.updateProjectionMatrix();
      } else if (typeof env !== "undefined") setFog();
    },
    true
  );
}

function setFog() {
  camDist = camera.position.length();
  camDist = Math.pow(camDist, 0.96);
  // console.log(camDist);
  scene.fog = new THREE.Fog(backColor, -60 + camDist, 480 + camDist);
  // scene.fog = new THREE.FogExp2(backColor, 0.0035);
  // scene.fog = new THREE.Fog(backColor, 0 + camDist, 460 + camDist);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  fishCamera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  fishCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function hideBoids(boidCount) {
  for (let i = 0; i < boids.length; i++) {
    const boid = boids[i];
    if (boidCount > i) boid.visible = true;
    else boid.visible = false;
  }
}

function shuffleBoids() {
  boids.forEach(boid => {
    boid.position.set(
      vars.boundSize * Math.random(),
      vars.boundSize * Math.random(),
      vars.boundSize * Math.random()
    );
    boid.velocity.set(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
  });
}

function addBounds() {
  boundBox = new THREE.Group();

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial()
  );
  box.visible = false;
  boundBox.add(box);

  var helper = new THREE.BoxHelper(boundBox, "#ffffff");
  boundBox.add(helper);
  helper.material.opacity = 0.25;
  helper.material.transparent = true;

  boundBox.boundBox3 = new THREE.Box3();

  scene.add(boundBox);
  boundBox.visible = vars.showBounds;
  updateBounds(vars.boundSize);
}

function updateBounds(size) {
  boundBox.scale.set(size, size, size);
  const pos = size / 2 - 0.01;
  boundBox.position.set(pos, pos, pos);

  boundBox.boundBox3.setFromObject(boundBox);
  const target = vars.boundSize / 2;
  cameraControls.target.set(target, target / 1.26, target);
}

function changeMesh(value) {
  boids.forEach(boid => {
    boid.meshTypes.forEach(mesh => (mesh.visible = false));
    boid.meshTypes[value].visible = true;
  });
}

function changeVectorVisibility(value) {
  boids.forEach(boid => {
    // boid.helpArrows.forEach(arrow => {
    //   arrow.visible = value;
    // });
    boid.helpArrows.visible = value;
  });
}
