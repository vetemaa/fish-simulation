var folders = [];

function datGui() {
  var Variables = function() {
    this.maxSpeed = 0.001;
    this.maxForce = 0.003;
    this.separationDist = 6;
    this.neighbourDist = 14;
  };

  variables = new Variables();
  gui = new dat.GUI();

  gui.add(variables, "maxSpeed", 0.0001, 0.01).step(0.001);
  gui.add(variables, "maxForce", -0.1, 0.1).step(0.01);
  gui.add(variables, "separationDist", 0, 100).step(1);
  gui.add(variables, "neighbourDist", 0, 100).step(1);

  return variables;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
