function datGui() {
  vars = function () {
    // Main
    this.play = true;
    this.playSpeed = 5;
    this.boidCamera = false;
    this.boundSize = 40;
    this.reset = () => location.reload();

    // Boids
    this.boidCount = boidStartCount;
    this.shuffleBoids = () => shuffleBoids();
    this.separation = true;
    this.alignment = true;
    this.cohesion = true;
    this.bounds = true;
    this.random = true;
    this.flee = true;
    this.avoidance = true;
    this.towardsMesh = true;

    this.separationRadius = 2.4;
    this.cohesionRadius = 14;
    this.alignmentRadius = 9;
    this.fleeRadius = 26;

    this.separationScalar = 0.34;
    this.alignmentScalar = 0.07;
    this.cohesionScalar = 0.08;
    this.boundsScalar = 0.01;
    this.randomScalar = 0.1;
    this.fleeScalar = 0.22;
    this.avoidanceScalar = 0.26;
    this.randomWavelenScalar = 0.6; //TODO: test 0.6, 0.4

    this.ruleScalar = 0.5;
    this.maxSpeed = 0.03;

    // Predators
    this.predatorCount = predatorStartCount;
    this.attack = true;
    this.ruleScalar_p = 0.3;
    this.maxSpeed_p = 0.04;
    this.attackRadius = 34;
    this.attackScalar = 0.5;

    // Obstacles
    this.enabled = true;
    this.showMesh = true;
    this.showPlane = false;
    this.planePosition = 20;

    this.resoultion = 15;
    this.avoidRadius = 10;
    this.raisedTo = 2;
    this.generate = () => {
      showLoader(true);
      setTimeout(() => generateAvoidanceField(), 500);
    };

    // UI
    this.showVectors = false;
    this.vectorLenMultiplier = 60;
    this.showBounds = true;
    this.showAxes = false;
    this.drawTail = false;
    this.removeTail = () => {
      boids.forEach((boid) => {
        boid.tailLine.previous = null;
        boid.tailLine.children = [];
      });
    };
    this.drawNoiseFunction = false;

    this.startRecording = () => capturer.start();
    this.stopRecording = () => {
      capturer.stop();
      capturer.save();
    };
  };

  vars = new vars();
  gui = new dat.GUI({ width: 270 });
  gui.domElement.style.opacity = 0.8;

  folMain = gui.addFolder("Main");
  folBoids = gui.addFolder("Boids");
  folPredators = gui.addFolder("Predators");
  folObstacles = gui.addFolder("Obstacles");
  folUI = gui.addFolder("UI");
  folBoids.open();

  // Main ------------------------------------------------------------------
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
  folMain.add(vars, "reset");

  // Boids -----------------------------------------------------------------
  folBoids
    .add(vars, "boidCount", 0, boidTotalCount)
    .step(1)
    .onChange((value) => changeBoidCount(boids, value));
  folBoids.add(vars, "shuffleBoids");
  const rules = [
    ["separation", 10],
    ["alignment", 100],
    ["cohesion", 100],
    ["flee", 100],
    ["bounds"],
    ["random"],
    ["avoidance"],
  ];
  rules.forEach((rule) => {
    folBoids.add(vars, rule[0]);
  });
  folBoids.add(vars, "towardsMesh");

  folWeights = folBoids.addFolder("Rule Weights");
  folDists = folBoids.addFolder("Rule Radiuses");
  rules.forEach((rule) => {
    folWeights.add(vars, rule[0] + "Scalar", 0, 0.5).step(0.01);
    if (rule[1])
      folDists.add(vars, rule[0] + "Radius", 0, rule[1]).step(rule[2] / 100);
  });

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
  folObstacles.add(vars, "enabled").onChange(changeObstacles);
  folObstacles.add(vars, "showMesh").onChange(changeObstacles);
  folObstacles.add(vars, "showPlane").onChange(changeObstacles);
  folObstacles
    .add(vars, "planePosition", 10, 30)
    .step(0.1)
    .onChange(() => (plane.changePos = true));

  folObstaclesGenerate = folObstacles.addFolder("Generate Field");
  folObstaclesGenerate.add(vars, "resoultion", 0, 25).step(1);
  folObstaclesGenerate.add(vars, "avoidRadius", 0, 20).step(1);
  folObstaclesGenerate.add(vars, "raisedTo", 1, 5).step(0.1);
  folObstaclesGenerate.add(vars, "generate");

  // UI --------------------------------------------------------------------
  folUI
    .add(vars, "showVectors")
    .onChange((value) => (subject.helpArrows.visible = value));
  folUI.add(vars, "vectorLenMultiplier", 0, 100).step(1).onChange(setArrows);
  folUI.add(vars, "showBounds").onChange((value) => (boundBox.visible = value));
  folUI.add(vars, "drawTail");
  folUI.add(vars, "removeTail");

  folUIAdvanced = folUI.addFolder("Advanced");
  folUIAdvanced.add(vars, "startRecording");
  folUIAdvanced.add(vars, "stopRecording");
  folUIAdvanced.add(vars, "drawNoiseFunction");
  folUIAdvanced
    .add(vars, "showAxes")
    .onChange((value) => (axesHelper.visible = value));

  return vars;
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
        if (e.deltaY > 0) fishCamera.dist += 0.1;
        else if (e.deltaY < 0 && fishCamera.dist > 0.1) fishCamera.dist -= 0.1;
        if (fishCamera.dist < 0.1) boids[0].visible = false;
        else boids[0].visible = true;

        fishCamera.position.set(0, 0.8 * fishCamera.dist, -2 * fishCamera.dist);

        // side-scroll
        if (e.deltaX < 0) fishCamera.fov += e.deltaX * 0.01;
        else if (e.deltaX > 0) fishCamera.fov += e.deltaX * 0.01;
        if (fishCamera.fov > 160) fishCamera.fov = 160;
        else if (fishCamera.fov < 30) fishCamera.fov = 30;

        fishCamera.updateProjectionMatrix();
      }
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
    const velocity = new THREE.Vector3(
      rand() - 0.5,
      rand() - 0.5,
      rand() - 0.5
    );
    velocity.setLength(vars.maxSpeed);
    boid.velocity.copy(velocity);
    boidDirection(velocity, boid);
  });
}

function changeObstacles() {
  const enabled = vars.enabled;
  obstacles.forEach((obstacle) => {
    obstacle.visible = enabled ? vars.showMesh : false;
  });
  plane.visible = enabled ? vars.showPlane : false;

  const controllers = [
    ...folObstacles.__controllers.slice(1),
    ...folObstacles.__folders["Generate Field"].__controllers,
  ];
  controllers.forEach((item) => {
    const parentStyle = item.domElement.parentElement.parentElement.style;
    parentStyle.pointerEvents = enabled ? "auto" : "none";
    parentStyle.opacity = enabled ? 1 : 0.82;
  });
}

function updateBounds(size) {
  const ratio = camera.position.length() / boundBox.prevSize;
  camera.position.setLength(ratio * size);
  boundBox.prevSize = size;

  boundBox.scale.set(size, size, size);
  const pos = size / 2 - 0.01;
  boundBox.position.set(pos, pos, pos);

  const target = vars.boundSize / 2;
  // cameraControls.target.set(target, target / 1.16, target);
  cameraControls.target.set(target - 4, target / 1.1, target); //TODO:
}
