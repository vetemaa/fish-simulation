function vertexAnimationInit(boid) {
  boid.speedTime = 0;
  boid.geometry.OrigVertices = [];
  boid.geometry.vertices.forEach(vert =>
    boid.geometry.OrigVertices.push(vert.clone())
  );
}

function vertexAnimation(boid, acceleration) {
  // boid.speedTime += delta * 0.75 * 0.01 * acceleration.length();
  // boid.speedTime += delta * acceleration.length();
  boid.speedTime += acceleration.length();
  time = boid.speedTime;
  time *= vars.speed;
  time %= Math.PI * 2; // animatsiooni soovi korral salvestamiseks

  // let oscillation = Math.sin(time + Math.PI * 0.5);
  let s2sOscillation = Math.sin(
    time + Math.PI * 0.5 + THREE.Math.degToRad(vars.s2sOffset)
  );
  let linearYawOscillation = Math.sin(
    time + Math.PI * 0.5 + THREE.Math.degToRad(vars.linearYawOffset)
  );

  boid.geometry.vertices.forEach((vert, i) => {
    var orgVert = boid.geometry.OrigVertices[i];
    let xOrg = orgVert.x;

    let undulation = Math.sin(xOrg * Math.PI * vars.undulationWaveLen + time);

    var newVert = orgVert.clone();
    newVert.x -= 0.25;

    if (vars.yaw) {
      angle =
        THREE.Math.degToRad(vars.yawAngle) *
        undulation *
        sinMask(xOrg, -1, 1, vars.yawMaskWavLen, vars.yawMaskOffset);
      newVert.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      // newVert.z = orgVert.z * Math.cos(angle) + orgVert.x * -Math.sin(angle);
      // newVert.x = orgVert.z * Math.sin(angle) + orgVert.x * Math.cos(angle);
    }

    if (vars.linearYaw) {
      angle =
        THREE.Math.degToRad(vars.linearYawAngle) *
        linearYawOscillation *
        sinMask(
          xOrg,
          -1,
          1,
          vars.linearYawMaskWavLen,
          vars.linearYawMaskOffset
        );
      newVert.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      // newVert.z = orgVert.z * Math.cos(angle) + orgVert.x * -Math.sin(angle);
      // newVert.x = orgVert.z * Math.sin(angle) + orgVert.x * Math.cos(angle);
    }

    if (vars.roll) {
      angle =
        THREE.Math.degToRad(vars.rollAngle) *
        undulation *
        sinMask(xOrg, -1, 1, vars.rollMaskWavLen, vars.rollMaskOffset);
      newVert.applyAxisAngle(new THREE.Vector3(1, 0, 0), angle);
      //   newVert.z = orgVert.z * Math.cos(angle) + orgVert.y * -Math.sin(angle);
      //   newVert.y = orgVert.z * Math.sin(angle) + orgVert.y * Math.cos(angle);
    }

    // //squeeze
    // if (vars.squeeze)
    // {zNew *= sinMask(vert.x,-1,1,vars.squeezeMaskWavLen,vars.squeezeMaskOffset)
    // ;}

    //sinwave
    if (vars.sinWav) {
      newVert.z +=
        undulation *
        sinMask(xOrg, -1, 1, vars.sinWavMaskWavLen, vars.sinWavMaskOffset);
    }

    //side-to-side
    if (vars.s2s) {
      newVert.z += s2sOscillation * vars.s2sAmplitude;
      // sinMask(orgVert.x, -1, 1, vars.s2sMaskWavLen, vars.s2sMaskOffset) / 3;
    }

    newVert.x += 0.25;

    vert.x = newVert.x;
    vert.y = newVert.y;
    vert.z = newVert.z;
  });

  boid.geometry.verticesNeedUpdate = true;
}

let oldCount = 0;
function vertexAnimationOld(delta, boid, acceleration) {
  // boid.speedTime += delta * 0.75 * 0.01 * acceleration.length();
  boid.speedTime += delta * acceleration.length() * 4;
  time = boid.speedTime;
  time *= vars.speed;
  // boid.position.x += 0.01;
  // boid.position.y += 0.01;

  // let oscillation = Math.sin(time + Math.PI * 0.5);
  let s2sOscillation = Math.sin(
    time + Math.PI * 0.5 + THREE.Math.degToRad(vars.s2sOffset)
  );
  let linearYawOscillation = Math.sin(
    time + Math.PI * 0.5 + THREE.Math.degToRad(vars.linearYawOffset)
  );

  boid.geometry.vertices.forEach((vert, i) => {
    var orgVert = boid.geometry.OrigVertices[i];
    let xOrg = orgVert.x;

    let undulation = Math.sin(xOrg * Math.PI * vars.undulationWaveLen + time);

    var newVert = orgVert.clone();
    newVert.x -= 0.25;

    if (vars.yaw) {
      angle =
        THREE.Math.degToRad(vars.yawAngle) *
        undulation *
        sinMask(xOrg, -1, 1, vars.yawMaskWavLen, vars.yawMaskOffset);
      newVert.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      // newVert.z = orgVert.z * Math.cos(angle) + orgVert.x * -Math.sin(angle);
      // newVert.x = orgVert.z * Math.sin(angle) + orgVert.x * Math.cos(angle);
    }

    if (vars.linearYaw) {
      angle =
        THREE.Math.degToRad(vars.linearYawAngle) *
        linearYawOscillation *
        sinMask(
          xOrg,
          -1,
          1,
          vars.linearYawMaskWavLen,
          vars.linearYawMaskOffset
        );
      newVert.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      // newVert.z = orgVert.z * Math.cos(angle) + orgVert.x * -Math.sin(angle);
      // newVert.x = orgVert.z * Math.sin(angle) + orgVert.x * Math.cos(angle);
    }

    if (vars.roll) {
      angle =
        THREE.Math.degToRad(vars.rollAngle) *
        undulation *
        sinMask(xOrg, -1, 1, vars.rollMaskWavLen, vars.rollMaskOffset);
      newVert.applyAxisAngle(new THREE.Vector3(1, 0, 0), angle);
      //   newVert.z = orgVert.z * Math.cos(angle) + orgVert.y * -Math.sin(angle);
      //   newVert.y = orgVert.z * Math.sin(angle) + orgVert.y * Math.cos(angle);
    }

    // //squeeze
    // if (vars.squeeze)
    // {zNew *= sinMask(vert.x,-1,1,vars.squeezeMaskWavLen,vars.squeezeMaskOffset)
    // ;}

    //sinwave
    if (vars.sinWav) {
      newVert.z +=
        undulation *
        sinMask(xOrg, -1, 1, vars.sinWavMaskWavLen, vars.sinWavMaskOffset);
    }

    //side-to-side
    if (vars.s2s) {
      newVert.z += s2sOscillation * vars.s2sAmplitude;
      // sinMask(orgVert.x, -1, 1, vars.s2sMaskWavLen, vars.s2sMaskOffset) / 3;
    }

    newVert.x += 0.25;

    vert.x = newVert.x;
    vert.y = newVert.y;
    vert.z = newVert.z;

    if (oldCount === 0) {
      console.log("old:", vert);
      console.log("");
      oldCount++;
    }
  });

  boid.geometry.verticesNeedUpdate = true;
}

function mask(value, start, end) {
  maskedValue = (value - start) / (end - start);
  return maskedValue;
}

function sinMask(value, start, end, maskWavLen, maskOffset, offset = 0) {
  if (vars.masks) {
    maskedValue = mask(value, start, end) + maskOffset;
    piValue = (maskedValue * Math.PI) / 2 + THREE.Math.degToRad(offset);
    sinValue = Math.sin(piValue / maskWavLen);
    return (sinValue + 1) / 2;
  }
  return 1;
}
