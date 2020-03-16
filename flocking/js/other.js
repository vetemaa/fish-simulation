function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  fishCamera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  fishCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateBounds(size) {
  boundBox.scale.set(size, size, size);
  const pos = size / 2 - 0.01;
  boundBox.position.set(pos, pos, pos);

  boundBox.boundBox3.setFromObject(boundBox);
  const target = vars.boundSize / 2;
  cameraControls.target.set(target, target / 1.26, target);
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

    let text = `${key}: ${ruleInf.vec.length().toFixed(4)}`;
    if (!ruleInf.enabled) text = `${key}: disabled`;

    let colorIndex = ruleInf.arr;
    let color;
    if (colorIndex == undefined) color = "#fff";
    else if (colorIndex == 0) color = "#111";
    else color = colors[colorIndex];

    infoDiv.children[0].style.backgroundColor = color;
    infoDiv.children[1].textContent = text;
  }
}
