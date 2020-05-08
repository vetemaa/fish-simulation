var info = [
  { name: "sep", color: "#e57373", showArr: true },
  { name: "ali", color: "#66bb6a", showArr: true },
  { name: "coh", color: "#5d7ada", showArr: true },
  { name: "bnd", color: "#866144", showArr: true },
  { name: "ran", color: "#ffb74d", showArr: true },
  { name: "fle", color: "#8e64bd", showArr: true },
  { name: "avd", color: "#64c3ec", showArr: true },
  { name: "acc", color: "#aaaaaa", showArr: true },
];

function addArrows(boid) {
  var helpArrows = new THREE.Group();
  helpArrows.visible = vars.showVectors;
  boid.helpArrows = helpArrows;

  for (let i = 0; i < info.length; i++) {
    const infoItem = info[i];
    const arrow = new THREE.ArrowHelper();
    arrow.setColor(infoItem.color);
    arrow.name = infoItem.name;
    arrow.visible = false;
    helpArrows.add(arrow);
  }

  boid.add(helpArrows);
}

function setArrows() {
  boids[0].helpArrows.children.forEach((arrow) => {
    const { showArr, vec } = findInfoByName(arrow.name);
    if (!showArr || vec == undefined) return;

    if (vec.length() <= 0) arrow.visible = false;
    else {
      arrow.setLength(vec.length() * vars.vectorLenMultiplier, 0.1, 0.1);
      arrow.setDirection(vec.clone().normalize());
      arrow.visible = true;
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  boidCamera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  boidCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function addNoiseCurve() {
  noiseLines = new THREE.Group();

  [0xff6666, 0x66ff66, 0x6666ff].forEach((color) => {
    var line = new THREE.Group();
    line.color = color;
    noiseLines.add(line);
  });

  scene.add(noiseLines);
}

function drawNoise() {
  const lines = noiseLines.children;
  time = subject.ownTime * vars.randomWavelenScalar;

  x = noise(time + 0.0, subject, "x") * 10;
  y = noise(time + 0.1, subject, "y") * 10;
  z = noise(time + 0.2, subject, "z") * 10;

  xAxisPos = time * 100;

  addLineSegment(lines[0], new THREE.Vector3(xAxisPos, x, 0));
  addLineSegment(lines[1], new THREE.Vector3(xAxisPos, y, 0));
  addLineSegment(lines[2], new THREE.Vector3(xAxisPos, z, 0));

  noiseLines.position.x = -xAxisPos - 5;
}

function addBoidCamera() {
  boids[0].mesh.add(boidCamera);
  boidCamera.dist = 1.5;
  boidCamera.fov = 90;
  boidCamera.rotation.set(0, Math.PI, 0);
  boidCamera.position.set(0, 0.8 * boidCamera.dist, -2 * boidCamera.dist);
}

function addLineSegment(line, vector) {
  vector = vector.clone();

  if (!line.previous) {
    line.previous = vector;
    return;
  }

  const lineGeom = new THREE.Geometry();
  lineGeom.vertices.push(line.previous.clone());
  lineGeom.vertices.push(vector);

  const segment = new THREE.Line(
    lineGeom,
    new THREE.LineBasicMaterial({
      color: line.color,
      opacity: 0.7,
      transparent: true,
    })
  );

  line.add(segment);
  line.previous.copy(vector);
}

function addBounds() {
  boundBox = new THREE.Group();

  helper = new THREE.BoxHelper(
    new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)),
    "#000"
  );
  helper.material.opacity = 0.2;
  helper.material.transparent = true;
  boundBox.add(helper);
  scene.add(boundBox);

  boundBox.visible = vars.showBounds;
  boundBox.prevSize = vars.boundSize;
  updateBounds(vars.boundSize);
}

function setBoidColor(boid) {
  preys = [];
  if (predators.length != 0)
    for (let i = 0; i < vars.predatorCount; i++) {
      const predator = predators[i];
      if (predator.preyIndex) preys.push(predator.preyIndex);
    }
  let color = 0x0000ff;
  if (boid.predator) {
    if (boid.rest) color = 0xff8866;
    else color = 0xff2222;
  } else {
    if (preys.includes(boid.index)) color = 0x769000;
    else if (boid.subject) color = 0xff00ff;
    else color = 0x00000;
  }
  boid.mesh.material.color.setHex(color);
}

function updateDirection(velClone, boid) {
  boid.mesh.lookAt(velClone.add(boid.position));
}

function setInfo(rules) {
  rules.forEach((rule) => {
    if (rule.name) setInfoItem(rule);
  });
}

function setInfoItem(item) {
  findInfoByName(item.name).vec = item.enabled ? item.vec : undefined;
}

function findInfoByName(name) {
  for (let i = 0; i < info.length; i++)
    if (info[i].name == name) return info[i];
}

function updateInfo() {
  setArrows();

  for (let i = 0; i < info.length; i++) {
    const infoItem = info[i];
    const infoDiv = document.getElementById(infoItem.name);
    const enabled = infoItem.vec !== undefined;

    let text, length;
    if (enabled) {
      text = `${infoItem.name}: ${infoItem.vec.length().toFixed(2)}`;
      length = infoItem.vec.length() * 200;
    } else {
      text = `${infoItem.name}: -`;
      length = 0;
    }

    infoDiv.children[0].style.backgroundColor = infoItem.color;
    infoDiv.children[1].textContent = text;
    infoDiv.children[2].style.width = length + "px";
  }
}

function showLoader(show = true) {
  const elem = document.getElementById("loader");
  if (show) {
    elem.style.display = "inline";
  } else {
    elem.style.display = "none";
  }
}
