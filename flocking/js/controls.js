var folders = [];
var boundBox;

function datGui() {
  var Variables = function() {
    this.startStop = 1;
    this.maxSpeed = 0.2;
    this.maxForce = 0.03;
    this.separationDist = 4;
    this.neighbourDist = 7;
    this.boundSize = 40;
  };

  variables = new Variables();
  gui = new dat.GUI();

  gui.add(variables, "startStop", 0, 1).step(1);
  gui.add(variables, "maxSpeed", 0, 1).step(0.01);
  gui.add(variables, "maxForce", 0, 1).step(0.01);
  gui.add(variables, "separationDist", 0, 10).step(1);
  gui.add(variables, "neighbourDist", 0, 100).step(1);
  gui
    .add(variables, "boundSize", 0, 100)
    .step(1)
    .onChange(value => {
      updateBounds(value);
    });

  return variables;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function addBounds() {
  boundBox = new THREE.Group();
  var geom = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)); // or WireframeGeometry( geometry )
  var mat = new THREE.LineBasicMaterial({ linewidth: 1 });
  boundBox.add(new THREE.LineSegments(geom, mat));
  scene.add(boundBox);

  updateBounds(variables.boundSize);
}

function updateBounds(size) {
  boundBox.scale.set(size, size, size);
  const pos = size / 2 - 0.2;
  boundBox.position.set(pos, pos, pos);
}
