var folders = [];
var boundBox;

function datGui() {
  var Variables = function() {
    this.boidCount = boidStartCount;
    this.play = true;
    this.playSpeed = 1;
    this.maxVelocity = 0.03;
    this.chaseCamera = false;
    this.separationDist = 2.4;
    this.alignmentDist = 8;
    this.cohesionDist = 12;
    this.boundSize = 36;
    this.animateVertices = true;
    this.meshType = 2;
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

  variables = new Variables();
  gui = new dat.GUI();
  gui.width = 333;

  folMain = gui.addFolder("Main");
  folRules = gui.addFolder("Rules");
  folVisual = gui.addFolder("UI");

  // folMain.open();
  // folRules.open();
  // folVisual.open();

  folMain
    .add(variables, "boidCount", 0, boidTotalCount)
    .step(1)
    .onChange(value => hideBoids(value));
  folMain.add(variables, "play").listen();
  folMain.add(variables, "playSpeed", 0, 10).step(0.01);
  folMain.add(variables, "maxVelocity", 0, 0.1).step(0.01);
  folMain
    .add(variables, "chaseCamera")
    .listen()
    .onChange(value => {
      changeCamera(value);
    });

  folRules.add(variables, "ruleScalar", 0, 1).step(0.01);

  folWeights = folRules.addFolder("Rule Weights");
  folWeights.open();
  folWeights.add(variables, "separationScalar", 0, 1).step(0.01);
  folWeights.add(variables, "alignmentScalar", 0, 1).step(0.01);
  folWeights.add(variables, "cohesionScalar", 0, 1).step(0.01);
  folWeights.add(variables, "boundsScalar", 0, 1).step(0.01);
  folWeights.add(variables, "randomScalar", 0, 1).step(0.01);
  // folRules.add(variables, "floorScalar", 0, 10).step(0.01);

  folDists = folRules.addFolder("Rule Distances");
  folDists.open();
  folDists.add(variables, "separationDist", 0, 10).step(0.1);
  folDists.add(variables, "alignmentDist", 0, 100).step(1);
  folDists.add(variables, "cohesionDist", 0, 100).step(1);
  folRules
    .add(variables, "boundSize", 0, 100)
    .step(1)
    .onChange(value => updateBounds(value));
  folRules.add(variables, "randomSpeedMin", 0, 1).step(0.01);

  folVisual
    .add(variables, "showVectors")
    .onChange(value => changeVectorVisibility(value));
  folVisual
    .add(variables, "showBounds")
    .onChange(value => (boundBox.visible = value));
  folVisual
    .add(variables, "meshType", { ConeMesh: 0, BoxMesh: 1, FishMesh: 2 })
    .onChange(value => changeMesh(value));

  folVertexAnim = folVisual.addFolder("Vertex Animation (only FishMesh)");
  folVertexAnim.add(variables, "animateVertices");
  vertexAnimationGUI(folVertexAnim, variables, gui);

  gui.add(variables, "shuffleBoids");

  gui.domElement.style.opacity = 0.8;
  gui.__folders.UI.__folders[
    "Vertex Animation (only FishMesh)"
  ].domElement.style.opacity = 0.4;

  return variables;
}

function changeCamera(chaseCamera) {
  if (chaseCamera) {
    variables.chaseCamera = true;
    scene.fog = new THREE.Fog(backColor, 0.1, 100);
  } else {
    variables.chaseCamera = false;
    setFog();
  }
}

function initControls() {
  renderer.domElement.onkeyup = e => {
    if (e.keyCode == 32) variables.play = !variables.play;
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
      if (variables.chaseCamera) {
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
      variables.boundSize * Math.random(),
      variables.boundSize * Math.random(),
      variables.boundSize * Math.random()
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
  boundBox.visible = variables.showBounds;
  updateBounds(variables.boundSize);
}

function updateBounds(size) {
  boundBox.scale.set(size, size, size);
  const pos = size / 2 - 0.01;
  boundBox.position.set(pos, pos, pos);

  boundBox.boundBox3.setFromObject(boundBox);
  const target = variables.boundSize / 2;
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
    boid.helpArrows.forEach(arrow => {
      arrow.visible = value;
    });
  });
}