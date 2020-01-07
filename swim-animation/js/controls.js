var folders = [];

function datGui() {
  var Variables = function() {
    this.speed = 0.2;
    this.undulationWaveLen = 0.2;
    this.masks = true;
  };

  variables = new Variables();
  gui = new dat.GUI();
  gui.width = 333;

  folder4 = gui.addFolder("Vertex animation");
  folder4.add(variables, "speed", 0, 1).step(0.001);
  folder4.add(variables, "undulationWaveLen", -5, 5).step(0.1);
  folder4.add(variables, "masks");
  folder4.open();

  animationRules = [
    {
      name: "s2s",
      folderName: "Side-to-side",
      enabled: false,
      amplitude: 0.1,
      maskWavLen: 0.7,
      maskOffset: -1.3
    },
    {
      name: "roll",
      folderName: "Roll",
      enabled: true,
      angle: 12,
      maskWavLen: 0.7,
      maskOffset: 0.9
    },
    {
      name: "linearYaw",
      folderName: "Linear Yaw",
      enabled: true,
      angle: 30,
      maskWavLen: 2,
      maskOffset: 2
    },
    {
      name: "yaw",
      folderName: "Yaw",
      enabled: true,
      angle: 30,
      maskWavLen: 0.7,
      maskOffset: 1.3
    }
  ];

  animationRules.forEach(rule => {
    fol = folder4.addFolder(rule.folderName);
    addVariable(fol, rule.name, rule.enabled);
    rule.angle !== undefined &&
      addVariable(fol, rule.name + "Angle", rule.angle, 0, 90);
    rule.amplitude !== undefined &&
      addVariable(fol, rule.name + "Amplitude", rule.amplitude, 0, 1);
    rule.maskWavLen !== undefined &&
      addVariableMask(fol, rule.name, rule.maskWavLen, rule.maskOffset);
  });

  return variables;
}

function addVariable(folder, variableName, enabled, min, max) {
  variables[variableName] = enabled;
  if (min === undefined) folder.add(variables, variableName);
  else folder.add(variables, variableName, min, max);
}

function addVariableMask(folder, name, maskWavLen, maskOffset) {
  variables[name + "MaskWavLen"] = maskWavLen;
  variables[name + "MaskOffset"] = maskOffset;
  folder
    .add(variables, name + "MaskWavLen", -2, 2)
    .step(0.1)
    .onChange(() => {
      currentMask = name;
    });
  folder
    .add(variables, name + "MaskOffset", -2, 2)
    .step(0.1)
    .onChange(() => {
      currentMask = name;
    });
}
