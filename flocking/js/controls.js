var folders = [];

function datGui() {
  var Variables = function() {
    this.speed = 0.0;
  };

  variables = new Variables();
  gui = new dat.GUI();

  gui.add(variables, "speed", -0.01, 0.01).step(0.001);

  return variables;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
