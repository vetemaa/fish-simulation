var info = [
  { name: "sep", color: "#e57373", showArr: true },
  { name: "ali", color: "#66bb6a", showArr: true },
  { name: "coh", color: "#5d7ada", showArr: true },
  { name: "bnd", color: "#866144", showArr: true },
  { name: "ran", color: "#ffb74d", showArr: true },
  { name: "fle", color: "#8e64bd", showArr: true },
  { name: "obs", color: "#64c3ec", showArr: true },
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
    const infoItem = findInfoByName(arrow.name);
    const enabled = infoItem.showArr && infoItem.vec !== undefined;
    if (enabled) setArrow(arrow, infoItem.vec);
  });
}

function setArrow(arrow, vec) {
  if (vec.length() <= 0) arrow.visible = false;
  else {
    arrow.setLength(vec.length() * vars.vectorLenMultiplier, 0.1, 0.1);
    arrow.setDirection(vec.clone().normalize());
    arrow.visible = true;
  }
}

function setInfo(rules) {
  rules.forEach((rule) => {
    if (rule.name) setInfoItem(rule);
  });
}

function setInfoItem(item) {
  findInfoByName(item.name).vec = item.vec;
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
      text = `${infoItem.name}: ${infoItem.vec.length().toFixed(4)}`;
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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  fishCamera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  fishCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function addNoiseCurve() {
  const boid = boids[0];
  var lines = new THREE.Group();

  [0xff9999, 0x99ff99, 0x9999ff].forEach((color) => {
    var line = new THREE.Group();
    line.color = color;
    lines.add(line);
  });

  boid.noise.lines = lines;
  scene.add(lines);
}

function animateNoise() {
  const boid = boids[0];
  const lines = boid.noise.lines.children;

  time = boid.ownTime * vars.randomWavelenScalar;
  x = noise(time + 0.0, boid, "x") * 10;
  y = noise(time + 0.1, boid, "y") * 10;
  z = noise(time + 0.2, boid, "z") * 10;
  xAxis = time * 100;

  addLineSegment(lines[0], new THREE.Vector3(xAxis, x, 0));
  addLineSegment(lines[1], new THREE.Vector3(xAxis, y, 0));
  addLineSegment(lines[2], new THREE.Vector3(xAxis, z, 0));

  boid.noise.lines.position.x = -xAxis - 5;
}

function addBoidCamera() {
  boids[0].mesh.add(fishCamera);
  fishCamera.rotation.set(0, Math.PI, 0);
  fishCamera.position.set(0, 0.8 * fishCameraDist, -2 * fishCameraDist);
}

function cameraChase() {
  const relativeCameraOffset = new THREE.Vector3(
    0,
    0.8 * fishCameraDist,
    -2 * fishCameraDist
  );
  // const cameraOffset = relativeCameraOffset.applyMatrix4(
  //   boids[0].mesh.matrixWorld
  // );
  // fishCamera.position.copy(cameraOffset);
  // const velClone = boids[0].velocity.clone();
  // velClone.add(boids[0].position);
  // let yOffset = 0.6;
  // if (fishCameraDist < 1) yOffset *= fishCameraDist;
  // velClone.y += yOffset;
  // fishCamera.lookAt(velClone);
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
  updateBounds(vars.boundSize);
}

function drawCircle(boid, dist, color) {
  const circleGeom = new THREE.Geometry();
  for (let i = 0; i < 2.1 * Math.PI; i += 0.1) {
    circleGeom.vertices.push(new THREE.Vector3(Math.sin(i), 0, Math.cos(i)));
  }
  const circle = new THREE.Line(
    circleGeom,
    new THREE.LineBasicMaterial({ color: color })
  );

  circle.scale.set(dist, dist, dist);
  boid.add(circle);
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
    if (preys.includes(boid.index)) color = 0xdd6100;
    else if (boid.subject) color = 0xff00ff;
    else color = 0x00000;
  }
  boid.mesh.material.color.setHex(color);
}

function boidDirection(velClone, boid) {
  boid.mesh.lookAt(velClone.add(boid.position));
}
