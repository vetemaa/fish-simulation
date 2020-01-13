var folders = [];
var boundBox;

function datGui() {
  var Variables = function() {
    this.play = true;
    this.playSpeed = 0.8;
    this.maxSpeed = 0.1;
    this.maxForce = 0.46;
    // this.maxForce = 1000;
    this.separationDist = 3.6;
    this.alignmentDist = 7;
    this.cohesionDist = 7;
    this.boundSize = 46;
    // this.boundSize = 2;
    this.animateVertices = true;
    this.showVectors = false;
  };

  variables = new Variables();
  gui = new dat.GUI();
  gui.width = 333;

  folder1 = gui.addFolder("Main");
  // folder1.open();
  folder2 = gui.addFolder("Rules");
  // folder2.open();
  folder3 = gui.addFolder("Vertex Animation");
  // folder2.open();
  folder4 = gui.addFolder("UI");
  folder4.open();

  folder1.add(variables, "play").listen();
  folder1.add(variables, "playSpeed", 0, 1).step(0.01);
  folder1.add(variables, "maxSpeed", 0, 1).step(0.01);
  folder2.add(variables, "maxForce", 0, 1).step(0.01);
  folder2.add(variables, "separationDist", 0, 10).step(0.1);
  folder2.add(variables, "alignmentDist", 0, 100).step(1);
  folder2.add(variables, "cohesionDist", 0, 100).step(1);
  folder2
    .add(variables, "boundSize", 0, 100)
    .step(1)
    .onChange(value => updateBounds(value));
  folder3
    .add(variables, "animateVertices")
    .onChange(value => changeGeometry(value));
  folder4
    .add(variables, "showVectors")
    .onChange(value => changeVectorVisibility(value));

  vertexAnimationGUI(folder3, variables, gui);

  return variables;
}

function initControls() {
  document.body.onkeyup = e => {
    if (e.keyCode == 32) {
      variables.play = !variables.play;
    }
  };
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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

function changeGeometry(value) {
  boids.forEach(boid => {
    boid.coneMesh.visible = !value;
    boid.boxMesh.visible = value;
  });
}

function changeVectorVisibility(value) {
  boids.forEach(boid => {
    boid.helpArrows.forEach(arrow => {
      arrow.visible = value;
    });
  });
}
