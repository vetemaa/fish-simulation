var octree;
var sceneCubes;

function initOctree() {
  sceneCubes = new THREE.Group();
  scene.add(sceneCubes);

  updateOctree();
}

function updateOctree() {
  sceneCubes.children = [];

  octree = new Octree(-20, -20, -20, vars.boundSize + 40);
  for (let i = 0; i < vars.boidCount; i++) octree.add(boids[i]);
  if (vars.showOctree) octree.show();
}

class Cube {
  constructor(x, y, z, size, color) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.size = size;
    this.half = size / 2;
    this.color = color;
  }

  show() {
    const rec = new THREE.Mesh(
      new THREE.BoxGeometry(this.size, this.size, this.size)
    );
    rec.position.set(
      this.x + this.half,
      this.y + this.half,
      this.z + this.half
    );

    this.helper = new THREE.BoxHelper(rec, this.color);
    sceneCubes.add(this.helper);
  }

  containsPosition(position) {
    return (
      position.x > this.x &&
      position.x < this.x + this.size &&
      position.y > this.y &&
      position.y < this.y + this.size &&
      position.z > this.z &&
      position.z < this.z + this.size
    );
  }

  containsCube(other) {
    return (
      this.x < other.x + other.size &&
      this.x < other.x &&
      this.x + this.size > other.x &&
      this.x + this.size > other.x + other.size &&
      this.y < other.y + other.size &&
      this.y < other.y &&
      this.y + this.size > other.y &&
      this.y + this.size > other.y + other.size &&
      this.z < other.z + other.size &&
      this.z < other.z &&
      this.z + this.size > other.z &&
      this.z + this.size > other.z + other.size
    );
  }

  intersects(other) {
    return (
      this.x < other.x + other.size &&
      this.x + this.size > other.x &&
      this.y < other.y + other.size &&
      this.y + this.size > other.y &&
      this.z < other.z + other.size &&
      this.z + this.size > other.z
    );
  }
}

class Octree {
  constructor(x, y, z, size, depth = 0) {
    this.points = [];
    this.children = [];
    this.divided = false;
    this.depth = depth;

    this.cube = new Cube(x, y, z, size, 0xff99ff);
  }

  show() {
    if (!this.divided) this.cube.show();
    else {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].show();
      }
    }
  }

  getPoints(foundPoints) {
    if (!this.divided) {
      foundPoints.push(...this.points);
    } else {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].getPoints(foundPoints);
      }
    }
  }

  // getPointsMult(foundPoints) {
  //   if (!this.divided) {
  //     foundPoints[0].push(...this.points);
  //     foundPoints[1].push(...this.points);
  //     foundPoints[2].push(...this.points);
  //   } else {
  //     for (let i = 0; i < this.children.length; i++) {
  //       this.children[i].getPointsMult(foundPoints);
  //     }
  //   }
  // }

  // getPointsInRanges(foundPoints, ranges) {
  //   if (ranges[0].containsCube(this.cube)) {
  //     return this.getPointsMult(foundPoints);
  //   } else if (range.intersects(this.cube)) {
  //     if (!this.divided) {
  //       for (let i = 0; i < this.points.length; i++) {
  //         const point = this.points[i];
  //         if (range.containsPosition(point.position)) foundPoints.push(point);
  //       }
  //     } else {
  //       for (let i = 0; i < this.children.length; i++) {
  //         this.children[i].getPointsInRange(foundPoints, range);
  //       }
  //     }
  //   }
  // }

  getPointsInRange(foundPoints, range) {
    if (range.containsCube(this.cube)) {
      return this.getPoints(foundPoints);
    } else if (range.intersects(this.cube)) {
      if (!this.divided) {
        for (let i = 0; i < this.points.length; i++) {
          const point = this.points[i];
          if (range.containsPosition(point.position)) foundPoints.push(point);
        }
      } else {
        for (let i = 0; i < this.children.length; i++) {
          this.children[i].getPointsInRange(foundPoints, range);
        }
      }
    }
  }

  subdivide() {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        for (let k = 0; k < 2; k++) {
          const oc = new Octree(
            this.cube.x + (i * this.cube.size) / 2,
            this.cube.y + (j * this.cube.size) / 2,
            this.cube.z + (k * this.cube.size) / 2,
            this.cube.size / 2,
            this.depth + 1
          );
          this.children.push(oc);
        }
      }
    }
    for (let i = 0; i < this.points.length; i++) {
      this.addPointToChild(this.points[i]);
    }
    this.divided = true;
    this.points = [];
  }

  addPointToChild(point) {
    const x = point.position.x < this.cube.x + this.cube.size / 2 ? 0 : 1;
    const y = point.position.y < this.cube.y + this.cube.size / 2 ? 0 : 1;
    const z = point.position.z < this.cube.z + this.cube.size / 2 ? 0 : 1;
    this.children[x * 4 + y * 2 + z * 1].add(point);
  }

  add(point) {
    if (!this.cube.containsPosition(point.position)) {
      return false;
    }

    if (this.divided) {
      this.addPointToChild(point);
    } else if (this.points.length < vars.leafCapacity) {
      this.points.push(point);
    } else {
      this.subdivide();
      this.addPointToChild(point);
    }
  }
}
