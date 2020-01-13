var folders = [];

function initDatGui() {
  var Variables = function() {};

  variables = new Variables();
  gui = new dat.GUI();
  gui.width = 333;

  folder = gui.addFolder("Vertex Animation");

  vertexAnimationGUI(folder, variables, gui);

  return variables;
}

function vertexAnimationGUI(folder, variables, gui) {
  variables["vertexAnimation"] = true;
  variables["speed"] = 1.2;
  variables["undulationWaveLen"] = 1.4;
  variables["masks"] = true;

  // folder = gui.addFolder("Vertex animation");
  // folder.add(variables, "vertexAnimation");
  folder.add(variables, "speed", 0, 3);
  folder.add(variables, "undulationWaveLen", -5, 5).step(0.1);
  folder.add(variables, "masks");
  // folder.open();

  animationRules = [
    {
      name: "s2s",
      folderName: "Side-to-side",
      offset: 180,
      enabled: true,
      amplitude: 0.03
    },
    {
      name: "roll",
      folderName: "Roll",
      offset: 0,
      enabled: true,
      angle: 9,
      maskWavLen: 0.7,
      maskOffset: 0.3
    },
    {
      name: "linearYaw",
      folderName: "Linear Yaw",
      offset: 180,
      enabled: true,
      angle: 12,
      maskWavLen: 1.2,
      maskOffset: 2
    },
    {
      name: "yaw",
      folderName: "Yaw",
      offset: 0,
      enabled: true,
      angle: 30,
      maskWavLen: 0.7,
      maskOffset: 1.3
    }
  ];

  animationRules.forEach(rule => {
    fol = folder.addFolder(rule.folderName);
    // fol.open();
    addVariable(fol, rule.name, rule.enabled);
    rule.offset !== undefined &&
      addVariable(fol, rule.name + "Offset", rule.offset, 0, 360);
    rule.angle !== undefined &&
      addVariable(fol, rule.name + "Angle", rule.angle, 0, 90);
    rule.amplitude !== undefined &&
      addVariable(fol, rule.name + "Amplitude", rule.amplitude, 0, 1);
    rule.maskWavLen !== undefined &&
      addVariableMask(fol, rule.name, rule.maskWavLen, rule.maskOffset);
  });
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
