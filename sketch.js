let walls = [];
let particle;
let sounds = [];
let soundIndex = 0;

function preload() {
  for (let i = 1; i <= 9; i++) {
    sounds.push(loadSound(`sound${i}.wav`));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight); // Pantalla completa
  createRings();
  particle = new Particle();
  noCursor();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Redimensionar al cambiar el tamaño de la ventana
  walls = []; // Reiniciar las paredes
  createRings(); // Recrear los anillos centrados
}

function createRings() {
  let centerX = width / 2;
  let centerY = height / 2;
  let rings = 18; // Número de círculos concéntricos
  let radiusStep = 18;

  for (let i = 1; i <= rings; i++) {
    let radius = i * radiusStep;
    let points = 9; // Número de puntos en el círculo

    for (let j = 0; j < points; j++) {
      let angle1 = TWO_PI / points * j;
      let angle2 = TWO_PI / points * (j + 1);

      let x1 = centerX + cos(angle1) * radius;
      let y1 = centerY + sin(angle1) * radius;
      let x2 = centerX + cos(angle2) * radius;
      let y2 = centerY + sin(angle2) * radius;

      let boundary = new Boundary(x1, y1, x2, y2);
      walls.push(boundary);
    }
  }

  // Límites de la pantalla
  walls.push(new Boundary(0, 0, width, 0));
  walls.push(new Boundary(width, 0, width, height));
  walls.push(new Boundary(width, height, 0, height));
  walls.push(new Boundary(0, height, 0, 0));
}

function draw() {
  background(0);
  for (let wall of walls) {
    wall.show();
  }
  particle.update(mouseX, mouseY);
  particle.show();
  particle.look(walls);
}

class Boundary {
  constructor(x1, y1, x2, y2) {
    this.a = createVector(x1, y1);
    this.b = createVector(x2, y2);
    this.touched = false;
    this.lastTouchedTime = null;
  }

  show() {
    stroke(this.touched ? [255, 0, 0] : [0, 0, 255]);
    line(this.a.x, this.a.y, this.b.x, this.b.y);
  }

  toggleTouched() {
    if (!this.touched) {
      this.touched = true;
      this.lastTouchedTime = millis();
      if (sounds[soundIndex]) {
        sounds[soundIndex].play();
        soundIndex = (soundIndex + 1) % sounds.length;
      }
    }
  }

  update() {
    if (this.touched && millis() - this.lastTouchedTime > 3000) {
      this.touched = false;
    }
  }
}

class Particle {
  constructor() {
    this.pos = createVector(width / 2, height / 2);
    this.rays = [];
    for (let a = 0; a < 360; a += 2) {
      this.rays.push(new Ray(this.pos, radians(a)));
    }
  }

  update(x, y) {
    this.pos.set(x, y);
  }

  look(walls) {
    for (let ray of this.rays) {
      let closest = null;
      let record = Infinity;
      let touchedWall = null;
      for (let wall of walls) {
        wall.update();
        const pt = ray.cast(wall);
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record) {
            record = d;
            closest = pt;
            touchedWall = wall;
          }
        }
      }

      if (closest) {
        if (touchedWall) touchedWall.toggleTouched();
        stroke(255, 0, 0, 100);
        line(this.pos.x, this.pos.y, closest.x, closest.y);
      }
    }
  }

  show() {
    fill(255, 0, 0);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 8);
    for (let ray of this.rays) {
      ray.show();
    }
  }
}

class Ray {
  constructor(pos, angle) {
    this.pos = pos;
    this.dir = p5.Vector.fromAngle(angle);
  }

  lookAt(x, y) {
    this.dir.x = x - this.pos.x;
    this.dir.y = y - this.pos.y;
    this.dir.normalize();
  }

  show() {
    stroke(0);
    push();
    translate(this.pos.x, this.pos.y);
    line(0, 0, this.dir.x * 3, this.dir.y * 3);
    pop();
  }

  cast(wall) {
    const x1 = wall.a.x;
    const y1 = wall.a.y;
    const x2 = wall.b.x;
    const y2 = wall.b.y;
    const x3 = this.pos.x;
    const y3 = this.pos.y;
    const x4 = this.pos.x + this.dir.x;
    const y4 = this.pos.y + this.dir.y;
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (den === 0) return;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

    if (t > 0 && t < 1 && u > 0) {
      return createVector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
    }
  }
}

