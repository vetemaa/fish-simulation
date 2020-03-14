var folders = [];
var boundBox;

function datGui() {
  var vars = function() {
    this.play = true;
    this.playSpeed = 10;
    this.chaseCamera = false;

    this.boundSize = 60;

    this.boidCount = boidStartCount;
    this.foodCount = foodStartCount;
    this.ruleScalar = 0.5;
    this.maxSpeed = 0.03;
    this.maxAcceleration = 0.01;
    this.escapeRadius = 24;
    this.escapeScalar = 0.3;
    this.feedRadius = 24;
    this.feedScalar = 0;
    this.alignmentRadius = 8;
    this.alignmentScalar = 0.08;
    this.cohesionRadius = 12;
    this.cohesionScalar = 0.011;
    this.separationRadius = 2.4;
    this.separationScalar = 0.34;
    this.randomScalar = 0.08;
    this.boundsScalar = 0.01;

    this.predatorCount = predatorStartCount;
    this.ruleScalar_p = 0.3;
    this.maxSpeed_p = 0.04;
    this.attackRadius = 24;
    this.attackScalar = 0.03;

    this.showVectors = false;
    this.vectorLenMultiplier = 20;
    this.showBounds = true;
    this.showAxes = true;
    this.drawTail = false;
    this.removeTail = () => removeTail();
    this.shuffleBoids = () => shuffleBoids();
  };

  vars = new vars();
  gui = new dat.GUI();
  gui.width = 333;

  folMain = gui.addFolder("Main");
  folBoids = gui.addFolder("Boids");
  folPredators = gui.addFolder("Predators");
  folVisual = gui.addFolder("UI");

  // folMain.open();
  // folBoids.open();
  // folVisual.open();

  folMain.add(vars, "play").listen();
  folMain.add(vars, "playSpeed", 0, 10).step(0.01);
  folMain
    .add(vars, "chaseCamera")
    .listen()
    .onChange(value => {
      changeCamera(value);
    });
  folMain
    .add(vars, "boundSize", 0, 100)
    .step(1)
    .onChange(value => updateBounds(value));

  folBoids
    .add(vars, "boidCount", 0, boidTotalCount)
    .step(1)
    .onChange(value => hideBoids(boids, value));
  folBoids.add(vars, "ruleScalar", 0, 3).step(0.01);
  folBoids.add(vars, "maxSpeed", 0, 0.1).step(0.001);
  folBoids.add(vars, "maxAcceleration", 0, 0.01).step(0.001);

  folWeights = folBoids.addFolder("Rule Weights");
  folWeights.open();
  folWeights.add(vars, "separationScalar", 0, 1).step(0.01);
  folWeights.add(vars, "alignmentScalar", 0, 1).step(0.01);
  folWeights.add(vars, "cohesionScalar", 0, 0.1).step(0.001);
  folWeights.add(vars, "boundsScalar", 0, 1).step(0.01);
  folWeights.add(vars, "randomScalar", 0, 1).step(0.01);
  folWeights.add(vars, "escapeScalar", 0, 1).step(0.01);
  folWeights.add(vars, "feedScalar", 0, 1).step(0.01);

  folDists = folBoids.addFolder("Rule Radiuses");
  folDists.open();
  folDists.add(vars, "separationRadius", 0, 10).step(0.1);
  folDists.add(vars, "alignmentRadius", 0, 100).step(1);
  folDists.add(vars, "cohesionRadius", 0, 100).step(1);
  folDists.add(vars, "escapeRadius", 0, 100).step(1);
  folDists.add(vars, "feedRadius", 0, 100).step(1);

  // PREDATORS -------------------------- TODO vars asemel mingi muu
  folPredators
    .add(vars, "predatorCount", 0, predatorTotalCount)
    .step(1)
    .onChange(value => hideBoids(predators, value));
  folPredators.add(vars, "ruleScalar_p", 0, 3).step(0.01);
  folPredators.add(vars, "maxSpeed_p", 0, 0.1).step(0.01);

  folWeights = folPredators.addFolder("Rule Weights");
  folWeights.open();
  folWeights.add(vars, "attackScalar", 0, 0.1).step(0.001);

  folDists = folPredators.addFolder("Rule Radiuses");
  folDists.open();
  folDists.add(vars, "attackRadius", 0, 100).step(1);
  // /PREDATORS --------------------------

  folVisual
    .add(vars, "showVectors")
    .onChange(value => changeVectorVisibility(value));
  folVisual
    .add(vars, "vectorLenMultiplier", 0, 20)
    .step(1)
    .onChange(changeArrowLens);
  folVisual
    .add(vars, "showBounds")
    .onChange(value => (boundBox.visible = value));
  folVisual
    .add(vars, "showAxes")
    .onChange(value => (axesHelper.visible = value));
  folVisual.add(vars, "drawTail");
  folVisual.add(vars, "removeTail");

  gui.add(vars, "shuffleBoids");

  gui.domElement.style.opacity = 0.8;

  return vars;
}

function removeTail() {
  const tailLines = boids[0].tailLines;
  tailLines.children = [];
}

function changeCamera(value) {
  vars.chaseCamera = value;
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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  fishCamera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  fishCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function hideBoids(boidArray, boidCount) {
  for (let i = 0; i < boidArray.length; i++) {
    const boid = boidArray[i];
    if (boidCount > i) boid.visible = true;
    else boid.visible = false;
  }
}

function shuffleBoids() {
  boids.forEach(boid => {
    boid.position.set(
      vars.boundSize * ran.nextFloat(),
      vars.boundSize * ran.nextFloat(),
      vars.boundSize * ran.nextFloat()
    );
    boid.velocity.set(
      ran.nextFloat() - 0.5,
      ran.nextFloat() - 0.5,
      ran.nextFloat() - 0.5
    );
    boid.velocity.setLength(0.1);
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

function changeVectorVisibility(value) {
  boids.forEach(boid => {
    boid.helpArrows.visible = value;
  });
}

function changeArrowLens() {
  boids.forEach(boid => {
    boid.helpArrows.children.forEach(arrow => {
      setArrowLen(arrow);
    });
  });
}
