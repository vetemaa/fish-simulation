var folders = [];

function datGui() {
  var Variables = function() {
    this.speed = 0.0;
  };

  variables = new Variables();
  gui = new dat.GUI();

  gui.add(variables, "speed", -0.1, 0.1).step(0.01);

  return variables;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
