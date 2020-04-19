var obs = {};

function datGui() {
  var vars = function () {
    this.play = true;
    this.playSpeed = 5;
    this.chaseCamera = false;
    this.boundSize = 40;

    this.boidCount = boidStartCount;
    this.foodCount = foodStartCount;
    this.ruleScalar = 0.5;
    this.maxSpeed = 0.03;
    this.maxAcceleration = 0.01;

    this.avoidRadius = 32;
    this.escapeScalar = 0.3;
    this.feedRadius = 28;
    this.feedScalar = 1;
    this.alignmentRadius = 9;
    this.alignmentScalar = 0.08;
    this.cohesionRadius = 14; // 14 is normal
    this.cohesionScalar = 0.08;
    this.separationRadius = 2.4;
    this.separationScalar = 0.34; // 0.44 in graph simulation
    this.randomScalar = 0.12;
    this.randomWavelenScalar = 0.5;
    this.obstacleScalar = 0.9;
    this.boundsScalar = 0.01;

    this.predatorCount = predatorStartCount;
    this.ruleScalar_p = 0.3;
    this.maxSpeed_p = 0.04;
    this.attackRadius = 34;
    this.attackScalar = 1;

    this.enabled = true;
    this.showMesh = true;
    this.showPlane = true;
    this.directTowards = true;

    this.showVectors = true;
    this.vectorLenMultiplier = 1;
    this.showBounds = true;
    this.showAxes = true;
    this.drawTail = false;
    this.drawRandomFunction = false;
    this.removeTail = () => removeTail();
    this.shuffleBoids = () => shuffleBoids();
  };

  vars = new vars();
  gui = new dat.GUI();
  gui.width = 333;
  prevBoundSize = vars.boundSize;

  folMain = gui.addFolder("Main");
  folBoids = gui.addFolder("Boids");
  folPredators = gui.addFolder("Predators");
  folVisual = gui.addFolder("UI");
  folObstacles = gui.addFolder("Obstacles");

  folObstacles.open();

  folMain.add(vars, "play").listen();
  folMain.add(vars, "playSpeed", 0, 10).step(0.1);
  folMain
    .add(vars, "chaseCamera")
    .listen()
    .onChange((value) => {
      changeCamera(value);
    });
  folMain
    .add(vars, "boundSize", 0, 150)
    .step(1)
    .onChange((value) => updateBounds(value));

  folBoids
    .add(vars, "boidCount", 0, boidTotalCount)
    .step(1)
    .onChange((value) => changeBoidCount(boids, value));
  folBoids.add(vars, "ruleScalar", 0, 3).step(0.01);
  folBoids.add(vars, "maxSpeed", 0, 0.1).step(0.001);
  folBoids.add(vars, "maxAcceleration", 0, 0.01).step(0.001);

  folWeights = folBoids.addFolder("Rule Weights");
  // folWeights.open();
  folWeights.add(vars, "separationScalar", 0, 1).step(0.01);
  folWeights.add(vars, "alignmentScalar", 0, 1).step(0.01);
  folWeights.add(vars, "cohesionScalar", 0, 1).step(0.01);
  folWeights.add(vars, "boundsScalar", 0, 1).step(0.01);
  folWeights.add(vars, "randomScalar", 0, 1).step(0.01);
  folWeights.add(vars, "randomWavelenScalar", 0, 10).step(0.1);
  folWeights.add(vars, "escapeScalar", 0, 1).step(0.01);
  folWeights.add(vars, "feedScalar", 0, 1).step(0.01);
  folWeights.add(vars, "obstacleScalar", 0, 1).step(0.01);

  folDists = folBoids.addFolder("Rule Radiuses");
  // folDists.open();
  folDists.add(vars, "separationRadius", 0, 10).step(0.1);
  folDists.add(vars, "alignmentRadius", 0, 100).step(1);
  folDists.add(vars, "cohesionRadius", 0, 100).step(1);
  folDists.add(vars, "avoidRadius", 0, 100).step(1);
  folDists.add(vars, "feedRadius", 0, 100).step(1);

  folFood = folBoids.addFolder("Food");
  // folFood.open();
  folFood
    .add(vars, "foodCount", 0, foodTotalCount)
    .listen()
    .step(1)
    .onChange((value) => changeFoodCount(value));

  // PREDATORS -------------------------- TODO: vars. asemel mingi muu
  folPredators
    .add(vars, "predatorCount", 0, predatorTotalCount)
    .step(1)
    .onChange((value) => changeBoidCount(predators, value));
  folPredators.add(vars, "ruleScalar_p", 0, 3).step(0.01);
  folPredators.add(vars, "maxSpeed_p", 0, 0.1).step(0.01);

  folWeights = folPredators.addFolder("Rule Weights");
  // folWeights.open();
  folWeights.add(vars, "attackScalar", 0, 0.1).step(0.001);

  folDists = folPredators.addFolder("Rule Radiuses");
  // folDists.open();
  folDists.add(vars, "attackRadius", 0, 100).step(1);
  // /PREDATORS --------------------------

  // folObstacles.add(variables, "obstacle", { Stonehenge: 0, Knot: 1 })
  // .onChange(value => changeObstacle(value));
  folObstacles.add(vars, "enabled").onChange(() => changeObstacles());
  obs.mesh = folObstacles
    .add(vars, "showMesh")
    .onChange((value) => (obstacle.visible = value));
  obs.plane = folObstacles
    .add(vars, "showPlane")
    .onChange((value) => (obstacle.plane.visible = value));
  obs.direct = folObstacles.add(vars, "directTowards");

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

  gui.add(vars, "shuffleBoids");

  gui.domElement.style.opacity = 0.8;

  return vars;
}

function removeTail() {
  const tailLine = boids[0].tailLine;
  tailLine.children = [];
}

function changeCamera(value) {
  vars.chaseCamera = value;
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
      if (vars.chaseCamera) {
        if (e.deltaY > 0) fishCameraDist += 0.1;
        else if (e.deltaY < 0 && fishCameraDist > 0.1) fishCameraDist -= 0.1;
        if (fishCameraDist < 0.1) boids[0].visible = false;
        else boids[0].visible = true;

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

function changeFoodCount(value) {
  let visibleCount = 0;

  for (let i = 0; i < foods.length; i++) {
    const food = foods[i];
    if (food.visible) visibleCount++;
  }

  const addFood = value > visibleCount;

  let i = 0;
  while (visibleCount != value) {
    const food = foods[i];
    if (food.visible == !addFood) {
      food.visible = addFood;
      visibleCount += addFood ? 1 : -1;
    }
    i++;
  }

  vars.foodCount = visibleCount;
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
