var folders = [];
var boundBox;

function datGui() {
  var Variables = function() {
    this.boidCount = boidStartCount;
    this.play = true;
    this.playSpeed = 0.8;
    this.maxVelocity = 0.1;
    this.chaseCamera = false;
    this.separationDist = 2.8;
    this.alignmentDist = 6;
    this.cohesionDist = 8;
    this.boundSize = 36;
    this.animateVertices = false;
    this.meshType = 0;
    this.showVectors = true;
  };

  variables = new Variables();
  gui = new dat.GUI();
  gui.width = 333;

  folMain = gui.addFolder("Main");
  folRules = gui.addFolder("Rules");
  folVisual = gui.addFolder("UI");

  // folMain.open();
  // folRules.open();
  folVisual.open();

  folMain
    .add(variables, "boidCount", 0, boidTotalCount)
    .step(1)
    .onChange(value => hideBoids(value));
  folMain.add(variables, "play").listen();
  folMain.add(variables, "playSpeed", 0, 3).step(0.01);
  folMain.add(variables, "maxVelocity", 0, 1).step(0.01);
  folMain.add(variables, "chaseCamera").listen();

  folRules.add(variables, "separationDist", 0, 10).step(0.1);
  folRules.add(variables, "alignmentDist", 0, 100).step(1);
  folRules.add(variables, "cohesionDist", 0, 100).step(1);
  folRules
    .add(variables, "boundSize", 0, 100)
    .step(1)
    .onChange(value => updateBounds(value));

  folVisual
    .add(variables, "showVectors")
    .onChange(value => changeVectorVisibility(value));
  folVisual
    .add(variables, "meshType", { ConeMesh: 0, BoxMesh: 1, FishMesh: 2 })
    .onChange(value => changeMesh(value));

  folVertexAnim = folVisual.addFolder("Vertex Animation (only FishMesh)");
  folVertexAnim.add(variables, "animateVertices");
  vertexAnimationGUI(folVertexAnim, variables, gui);

  return variables;
}

function initControls() {
  renderer.domElement.onkeyup = e => {
    if (e.keyCode == 32) variables.play = !variables.play;
    if (e.keyCode == 49) variables.chaseCamera = true;
    if (e.keyCode == 50) variables.chaseCamera = false;
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
      }
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

function hideBoids(boidCount) {
  for (let i = 0; i < boids.length; i++) {
    const boid = boids[i];
    if (boidCount > i) boid.visible = true;
    else boid.visible = false;
  }
}

function addBounds() {
  boundBox = new THREE.Group();

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial()
  );
  box.visible = false;
  boundBox.add(box);

  var helper = new THREE.BoxHelper(boundBox, 0x777777);
  boundBox.add(helper);

  boundBox.boundBox3 = new THREE.Box3();

  scene.add(boundBox);
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
  // console.log(variables.meshType);

  boids.forEach(boid => {
    boid.meshTypes.forEach(mesh => (mesh.visible = false));
    boid.meshTypes[value].visible = true;

    // boid.coneMesh.visible = !value;
    // boid.boxMesh.visible = value;
  });
}

function changeVectorVisibility(value) {
  boids.forEach(boid => {
    boid.helpArrows.forEach(arrow => {
      arrow.visible = value;
    });
  });
}
