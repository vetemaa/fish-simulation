// green, red, indigo, yellow, orange, grey
const colors = [
  "#fff",
  "#e57373",
  "#66bb6a",
  "#5d7ada",
  "#dce775",
  "#6f4b2e",
  "#ffb74d",
  "#64c3ec"
];

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

  [0xff9999, 0x99ff99, 0x9999ff].forEach(color => {
    var line = new THREE.Group();
    line.color = color;
    lines.add(line);
  });

  boid.noise.lines = lines;
  scene.add(lines);
}

function animateNoise() {
  if (!vars.drawRandomFunction) return;

  const boid = boids[0];
  const lines = boid.noise.lines.children;

  time = boid.ownTime * vars.randomWavelenScalar;
  // x = simplex.noise2D(time, (boid.index + 1) * 10);
  // y = simplex.noise2D(time, (boid.index + 1) * 100);
  // z = simplex.noise2D(time, (boid.index + 1) * 1000) * 10;
  x = noise(time, boid, "x") * 10;
  y = noise(time, boid, "y") * 10;
  z = noise(time, boid, "z") * 10;
  xAxis = time * 100;

  // rapos += (Math.random() * 2 - 1) / 40;
  // addLineSegment(lines[0], new THREE.Vector3(xAxis, rapos * 10, 0));

  addLineSegment(lines[0], new THREE.Vector3(xAxis, x, 0));
  addLineSegment(lines[1], new THREE.Vector3(xAxis, y, 0));
  addLineSegment(lines[2], new THREE.Vector3(xAxis, z, 0));

  boid.noise.lines.position.x = -xAxis - 5;
}

function cameraChase() {
  var relativeCameraOffset = new THREE.Vector3(
    0,
    0.8 * fishCameraDist,
    -2 * fishCameraDist
  );

  var cameraOffset = relativeCameraOffset.applyMatrix4(
    boids[0].mesh.matrixWorld
  );

  fishCamera.position.copy(cameraOffset);

  const velClone = boids[0].velocity.clone();
  velClone.add(boids[0].position);
  let yOffset = 0.6;
  if (fishCameraDist < 1) yOffset *= fishCameraDist;
  velClone.y += yOffset;
  fishCamera.lookAt(velClone);
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
      color: line.color
    })
  );

  line.add(segment);
  line.previous.copy(vector);
}

function addBounds() {
  boundBox = new THREE.Group();

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial()
  );
  box.visible = false;
  boundBox.add(box);

  var helper = new THREE.BoxHelper(boundBox, "#ffffff");
  boundBox.add(helper);
  helper.material.opacity = 0.25;
  helper.material.transparent = true;

  boundBox.boundBox3 = new THREE.Box3();

  scene.add(boundBox);
  boundBox.visible = vars.showBounds;
  updateBounds(vars.boundSize);
}

var info = {};

function setInfo(rules, acc) {
  info.sep = rules[0];
  info.ali = rules[1];
  info.coh = rules[2];
  info.bnd = rules[3];
  info.ran = rules[4];
  info.avd = rules[5];
  info.fed = rules[6];
  info.acc = { vec: acc, arr: undefined, enabled: true };
}

function updateInfo() {
  for (key in info) {
    ruleInf = info[key];
    infoDiv = document.getElementById(key);

    let text;
    if (ruleInf == undefined || !ruleInf.enabled) text = `${key}: disabled`;
    else text = `${key}: ${ruleInf.vec.length().toFixed(4)}`;

    let colorIndex = ruleInf == undefined ? undefined : ruleInf.arr;
    let color;
    if (colorIndex == undefined) color = "#fff";
    else if (colorIndex == 0) color = "#111";
    else color = colors[colorIndex];

    let length = ruleInf == undefined ? 0 : ruleInf.vec.length() * 200;

    infoDiv.children[0].style.backgroundColor = color;
    infoDiv.children[1].textContent = text;
    infoDiv.children[2].style.width = length + "px";
  }
}

function setArrowLen(arrow) {
  const len = arrow.len * vars.vectorLenMultiplier;
  arrow.setLength(len, 0.1, 0.1);
}

function drawCircle(boid, dist) {
  const circleGeom = new THREE.Geometry();
  for (let i = 0; i < 2.1 * Math.PI; i += 0.1) {
    circleGeom.vertices.push(new THREE.Vector3(Math.sin(i), 0, Math.cos(i)));
  }
  const circle = new THREE.Line(
    circleGeom,
    new THREE.LineBasicMaterial({
      color: 0x66bb6a
    })
  );

  circle.scale.set(dist, dist, dist);
  boid.add(circle);
}

function setArrow(arrow, vec) {
  if (vec.length() <= 0) {
    arrow.visible = false;
  } else {
    arrow.len = vec.length();
    setArrowLen(arrow);
    arrow.setDirection(vec.clone().normalize());
    arrow.visible = true;
  }
}
