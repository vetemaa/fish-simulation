function addFood() {
  for (let i = 0; i < foodTotalCount; i++) {
    const mat = new THREE.SpriteMaterial({ color: 0x1dab70 });
    const food = new THREE.Sprite(mat);
    food.index = i;
    food.ownTime = 0;

    food.position.set(
      vars.boundSize * rand(),
      vars.boundSize * rand(),
      vars.boundSize * rand()
    );
    food.orgPos = food.position.clone();
    food.scale.set(0.25, 0.25, 0.25);

    foods.push(food);
    scene.add(food);
  }

  changeFoodCount(foodStartCount);
}

function moveFood(delta) {
  for (let i = 0; i < foodTotalCount; i++) {
    const food = foods[i];
    if (!food.visible) continue;
    const playDelta = vars.playSpeed * delta;

    const steer = new THREE.Vector3();
    const turbulence = new THREE.Vector3(
      simplex.noise2D(food.ownTime, (food.index + 1) * 10),
      simplex.noise2D(food.ownTime, (food.index + 1) * 100),
      simplex.noise2D(food.ownTime, (food.index + 1) * 1000)
    );
    const keepOrg = food.orgPos.clone().sub(food.position);

    steer.add(turbulence.multiplyScalar(2));
    steer.add(keepOrg.multiplyScalar(1));
    steer.multiplyScalar(0.1);
    food.position.add(steer);

    food.ownTime += playDelta * 0.1;
  }
}

function eatFood(index) {
  vars.foodCount -= 1;
  const food = foods[index];
  food.visible = false;
}
