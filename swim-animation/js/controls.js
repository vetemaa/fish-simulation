var folders = [];

function datGui() {
  var Variables = function() {
    this.speed = 0.002;
    this.undulationWaveLen = 0.2;
    this.masks = true;
    this.wavLen = 0.7;
    this.offset = -0.4;
  };

  variables = new Variables();
  gui = new dat.GUI();

  gui.add(variables, "speed", 0, 0.01);
  gui.add(variables, "undulationWaveLen", -5, 5).step(0.1);
  gui.add(variables, "masks");

  addVariable("s2s", false);
  addVariableMask("s2s", 0.7, -1.3);
  // addVariable("sinWav", 0.7, -0.4, false);
  // addVariable("squeeze", 0.2, -0.3, false);
  addVariable("roll", false);
  addVariableAngle("roll", 30);
  addVariableMask("roll", 0.7, 0.9);
  addVariable("linearYaw", true);
  addVariableAngle("linearYaw", 30);
  addVariableMask("linearYaw", 2, 2);
  addVariable("yaw", true);
  addVariableAngle("yaw", 30);
  addVariableMask("yaw", 0.7, 1.3);

  return variables;
}

function addVariable(name, active) {
  variables[name] = active;
  gui.add(variables, name);
}

function addVariableMask(name, maskWavLen, maskOffset) {
  variables[name + "_maskWavLen"] = maskWavLen;
  variables[name + "_maskOffset"] = maskOffset;
  gui
    .add(variables, name + "_maskWavLen", -2, 2)
    .step(0.1)
    .onChange(() => {
      currentMask = name;
    });
  gui
    .add(variables, name + "_maskOffset", -2, 2)
    .step(0.1)
    .onChange(() => {
      currentMask = name;
    });
}

function addVariableAngle(name, angle) {
  variables[name + "_angle"] = angle;
  gui.add(variables, name + "_angle", 0, 90).step(1);
}
