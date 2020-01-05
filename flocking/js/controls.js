var folders = [];
var boundBox;

function datGui() {
  var Variables = function() {
    this.play = true;
    this.playSpeed = 0.8;
    this.maxSpeed = 0.2;
    this.maxForce = 0.03;
    // this.maxForce = 1000;
    this.separationDist = 4;
    this.alignmentDist = 7;
    this.cohesionDist = 7;
    this.boundSize = 34;
  };

  variables = new Variables();
  gui = new dat.GUI();

  folder1 = gui.addFolder("Main");
  folder1.open();
  folder2 = gui.addFolder("Rules");
  folder2.open();

  folder1.add(variables, "play").listen();
  folder1.add(variables, "playSpeed", 0, 1).step(0.1);
  folder1.add(variables, "maxSpeed", 0, 1).step(0.01);
  folder1.add(variables, "maxForce", 0, 1).step(0.01);
  folder2.add(variables, "separationDist", 0, 10).step(1);
  folder2.add(variables, "alignmentDist", 0, 100).step(1);
  folder2.add(variables, "cohesionDist", 0, 100).step(1);
  folder2
    .add(variables, "boundSize", 0, 100)
    .step(1)
    .onChange(value => {
      updateBounds(value);
    });

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

  var helper = new THREE.BoxHelper(boundBox, 0xffffff);
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
  // console.log(boundBox.boundBox3);
}
