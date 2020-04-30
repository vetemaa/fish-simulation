var obs = {};

// TODO: add Advanced folder to main folders
// TODO: fix or remove boidCamera

function datGui() {
  var vars = function () {
    // Main
    this.play = true;
    this.playSpeed = 5;
    this.boidCamera = false;
    this.boundSize = 40;

    // Boids
    this.boidCount = boidStartCount;
    this.separation = true;
    this.alignment = true;
    this.cohesion = true;
    this.bounds = true;
    this.random = true;
    this.flee = true;
    this.obstacle = true;
    this.towardsMesh = true;
    this.fleeRadius = 26;
    this.fleeScalar = 0.22;
    this.alignmentRadius = 9;
    this.alignmentScalar = 0.08;
    this.cohesionRadius = 14;
    this.cohesionScalar = 0.08;
    this.separationRadius = 2.4;
    this.separationScalar = 0.34;
    this.randomScalar = 0.1;
    this.obstacleScalar = 0.9;
    this.boundsScalar = 0.01;
    this.randomWavelenScalar = 0.6;

    this.ruleScalar = 0.5;
    this.maxSpeed = 0.03;

    // Predators
    this.predatorCount = predatorStartCount;
    this.attack = true;
    this.ruleScalar_p = 0.3;
    this.maxSpeed_p = 0.04;
    this.attackRadius = 34;
    this.attackScalar = 1;

    // Obstacles
    this.enabled = true;
    this.showMesh = true;
    this.showPlane = false;
    this.planePosition = 20;

    // UI
    this.showVectors = false;
    this.vectorLenMultiplier = 60;
    this.showBounds = true;
    this.showAxes = false;
    this.drawTail = false;
    this.drawRandomFunction = false;
    this.removeTail = () => removeTail();
    this.shuffleBoids = () => shuffleBoids();
  };

  vars = new vars();
  gui = new dat.GUI({ width: 270 });
  gui.domElement.style.opacity = 0.8;
  prevBoundSize = vars.boundSize;

  folMain = gui.addFolder("Main");
  folBoids = gui.addFolder("Boids");
  folPredators = gui.addFolder("Predators");
  folObstacles = gui.addFolder("Obstacles");
  folVisual = gui.addFolder("UI");
  folBoids.open();

  // Main
  folMain.add(vars, "play").listen();
  folMain.add(vars, "playSpeed", 0, 10).step(0.1);
  folMain
    .add(vars, "boidCamera")
    .listen()
    .onChange((value) => {
      changeCamera(value);
    });
  folMain
    .add(vars, "boundSize", 0, 150)
    .step(1)
    .onChange((value) => updateBounds(value));

  // Boids -----------------------------------------------------------------
  folBoids
    .add(vars, "boidCount", 0, boidTotalCount)
    .step(1)
    .onChange((value) => changeBoidCount(boids, value));
  folBoids.add(vars, "shuffleBoids");
  folBoids.add(vars, "separation");
  folBoids.add(vars, "alignment");
  folBoids.add(vars, "cohesion");
  folBoids.add(vars, "bounds");
  folBoids.add(vars, "random");
  folBoids.add(vars, "flee");
  folBoids.add(vars, "obstacle");
  folBoids.add(vars, "towardsMesh");

  folWeights = folBoids.addFolder("Rule Weights");
  // folWeights.open();
  folWeights.add(vars, "separationScalar", 0, 1).step(0.01);
  folWeights.add(vars, "alignmentScalar", 0, 1).step(0.01);
  folWeights.add(vars, "cohesionScalar", 0, 1).step(0.01);
  folWeights.add(vars, "boundsScalar", 0, 1).step(0.01);
  folWeights.add(vars, "randomScalar", 0, 1).step(0.01);
  folWeights.add(vars, "fleeScalar", 0, 1).step(0.01);
  folWeights.add(vars, "obstacleScalar", 0, 1).step(0.01);

  folDists = folBoids.addFolder("Rule Radiuses");
  // folDists.open();
  folDists.add(vars, "separationRadius", 0, 10).step(0.1);
  folDists.add(vars, "alignmentRadius", 0, 100).step(1);
  folDists.add(vars, "cohesionRadius", 0, 100).step(1);
  folDists.add(vars, "fleeRadius", 0, 100).step(1);

  folBoidsAdvanced = folBoids.addFolder("Advanced");
  folBoidsAdvanced.add(vars, "ruleScalar", 0, 3).step(0.01);
  folBoidsAdvanced.add(vars, "maxSpeed", 0, 0.1).step(0.001);
  folBoidsAdvanced.add(vars, "randomWavelenScalar", 0, 3).step(0.1);

  // Predators -------------------------------------------------------------
  folPredators
    .add(vars, "predatorCount", 0, predatorTotalCount)
    .step(1)
    .onChange((value) => changeBoidCount(predators, value));
  folPredators.add(vars, "attack");
  folPreatorsAdvanced = folPredators.addFolder("Advanced");
  folPreatorsAdvanced.add(vars, "attackScalar", 0, 0.1).step(0.001);
  folPreatorsAdvanced.add(vars, "attackRadius", 0, 100).step(1);
  folPreatorsAdvanced.add(vars, "ruleScalar_p", 0, 3).step(0.01);
  folPreatorsAdvanced.add(vars, "maxSpeed_p", 0, 0.1).step(0.01);

  // Obstacles -------------------------------------------------------------
  folObstacles.add(vars, "enabled").onChange(() => changeObstacles());
  obs.mesh = folObstacles
    .add(vars, "showMesh")
    .onChange((value) => (obstacle.visible = value));
  obs.plane = folObstacles
    .add(vars, "showPlane")
    .onChange((value) => (obstacle.plane.visible = value));
  obs.plane = folObstacles
    .add(vars, "planePosition", 10, 30)
    .step(0.01)
    .onChange((value) => (plane.changePos = true));

  // UI --------------------------------------------------------------------
  folVisual
    .add(vars, "showVectors")
    .onChange((value) => changeVectorVisibility(value));
  folVisual
    .add(vars, "vectorLenMultiplier", 0, 100)
    .step(1)
    .onChange(changeArrowLens);
  folVisual
    .add(vars, "showBounds")
    .onChange((value) => (boundBox.visible = value));
  folVisual
    .add(vars, "showAxes")
    .onChange((value) => (axesHelper.visible = value));
  folVisual.add(vars, "drawTail");
  folVisual.add(vars, "drawRandomFunction");
  folVisual.add(vars, "removeTail");

  return vars;
}

function removeTail() {
  boids.forEach((boid) => {
    const tailLine = boid.tailLine;
    tailLine.previous = null;
    tailLine.children = [];
  });
}

function changeCamera(value) {
  vars.boidCamera = value;
  cameraControls.enabled = !value;
}

function initControls() {
  renderer.domElement.onkeyup = (e) => {
    if (e.keyCode == 32) vars.play = !vars.play;
    if (e.keyCode == 49) changeCamera(true);
    if (e.keyCode == 50) changeCamera(false);
  };

  window.addEventListener(
    "mousewheel",
    (e) => {
      if (vars.boidCamera) {
        if (e.deltaY > 0) fishCameraDist += 0.1;
        else if (e.deltaY < 0 && fishCameraDist > 0.1) fishCameraDist -= 0.1;
        if (fishCameraDist < 0.1) boids[0].visible = false;
        else boids[0].visible = true;

        fishCamera.position.set(0, 0.8 * fishCameraDist, -2 * fishCameraDist);

        // side-scroll
        if (e.deltaX < 0) fishCameraFOV += e.deltaX * 0.01;
        else if (e.deltaX > 0) fishCameraFOV += e.deltaX * 0.01;
        if (fishCameraFOV > 160) fishCameraFOV = 160;
        else if (fishCameraFOV < 30) fishCameraFOV = 30;
        fishCamera.fov = fishCameraFOV;
        fishCamera.updateProjectionMatrix();
      } else if (typeof env !== "undefined");
    },
    true
  );
}

function changeBoidCount(boidArray, boidCount) {
  for (let i = 0; i < boidArray.length; i++) {
    const boid = boidArray[i];
    if (boidCount > i) boid.visible = true;
    else boid.visible = false;
  }
}

function shuffleBoids() {
  boids.forEach((boid) => {
    boid.position.set(
      vars.boundSize * rand(),
      vars.boundSize * rand(),
      vars.boundSize * rand()
    );
    boid.velocity.set(rand() - 0.5, rand() - 0.5, rand() - 0.5);
    boid.velocity.setLength(vars.maxSpeed);
  });
}

function changeVectorVisibility(value) {
  // boids.forEach((boid) => (boid.helpArrows.visible = value));
  subject.helpArrows.visible = value;
}

function changeArrowLens() {
  setArrows();
  // boids.forEach((boid) => {
  //   boid.helpArrows.children.forEach((arrow) => setArrowLen(arrow));
  // });
}

function changeObstacles() {
  const en = vars.enabled;
  obstacle.visible = en ? vars.showMesh : false;
  obstacle.plane.visible = en ? vars.showPlane : false;
  Object.keys(obs).forEach((key) => {
    const parentStyle = obs[key].domElement.parentElement.parentElement.style;
    parentStyle.pointerEvents = en ? "auto" : "none";
    parentStyle.opacity = en ? 1 : 0.82;
  });
}

function updateBounds(size) {
  const ratio = camera.position.length() / prevBoundSize;
  camera.position.setLength(ratio * size);
  prevBoundSize = size;

  boundBox.scale.set(size, size, size);
  const pos = size / 2 - 0.01;
  boundBox.position.set(pos, pos, pos);

  const target = vars.boundSize / 2;
  cameraControls.target.set(target, target / 1.16, target);
}
