var MAX_DELTA = 0.2;

/**
 * Control an entity with WASD keys.
 */
AFRAME.registerComponent('wasd-physics-controls', {
  dependendencies: ['physics-body'],

  schema: {
    easing: { default: 20 },
    acceleration: { default: 65 },
    enabled: { default: true },
    fly: { default: false },
    wsAxis: { default: 'z', oneOf: [ 'x', 'y', 'z' ] },
    adAxis: { default: 'x', oneOf: [ 'x', 'y', 'z' ] },
    wsInverted: { default: false },
    wsEnabled: { default: true },
    adInverted: { default: false },
    adEnabled: { default: true }
  },

  init: function () {
    this.velocity = new THREE.Vector3();
    // To keep track of the pressed keys
    this.keys = {};
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  },

  update: function (previousData) {
    var data = this.data;
    var acceleration = data.acceleration;
    var easing = data.easing;
    var velocity = this.velocity;
    var prevTime = this.prevTime = this.prevTime || Date.now();
    var time = window.performance.now();
    var delta = (time - prevTime) / 1000;
    var keys = this.keys;
    var movementVector;
    var adAxis = data.adAxis;
    var wsAxis = data.wsAxis;
    var adSign = data.adInverted ? -1 : 1;
    var wsSign = data.wsInverted ? -1 : 1;
    var el = this.el;
    this.prevTime = time;

    // If data changed or FPS too low, reset velocity.
    if (previousData || delta > MAX_DELTA) {
      velocity[adAxis] = 0;
      velocity[wsAxis] = 0;
      return;
    }

    velocity[adAxis] -= velocity[adAxis] * easing * delta;
    velocity[wsAxis] -= velocity[wsAxis] * easing * delta;

    if (data.enabled) {
      if (data.adEnabled) {
        if (keys[65]) { velocity[adAxis] -= adSign * acceleration * delta; } // Left
        if (keys[68]) { velocity[adAxis] += adSign * acceleration * delta; } // Right
      }
      if (data.wsEnabled) {
        if (keys[87]) { velocity[wsAxis] -= wsSign * acceleration * delta; } // Up
        if (keys[83]) { velocity[wsAxis] += wsSign * acceleration * delta; } // Down
      }
    }

    velocity = this.getMovementVector(velocity);
    el.setAttribute('physics-body', 'velocity', {
      x: velocity.x,
      y: velocity.y,
      z: velocity.z
    });
  },

  play: function () {
    this.attachEventListeners();
  },

  pause: function () {
    this.removeEventListeners();
  },

  tick: function (t) {
    this.update();
  },

  remove: function () {
    this.pause();
  },

  attachEventListeners: function () {
    // Keyboard events
    window.addEventListener('keydown', this.onKeyDown, false);
    window.addEventListener('keyup', this.onKeyUp, false);
  },

  removeEventListeners: function () {
    // Keyboard events
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  },

  onKeyDown: function (event) {
    this.keys[event.keyCode] = true;
  },

  onKeyUp: function (event) {
    this.keys[event.keyCode] = false;
  },

  getMovementVector: function (velocity) {
    var direction = new THREE.Vector3(0, 0, 0);
    var rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    var velocity = velocity;
    var elRotation = this.el.getAttribute('rotation');

    direction.copy(velocity);
    if (!elRotation) { return direction; }
    if (!this.data.fly) { elRotation.x = 0; }
    rotation.set(THREE.Math.degToRad(elRotation.x),
                 THREE.Math.degToRad(elRotation.y), 0);
    direction.applyEuler(rotation);
    return direction;
  }
});
