var CANNON = require('cannon');
require('./wasd-physics-controls');
var coordinates = AFRAME.utils.coordinates;
var diff = AFRAME.utils.diff;

var rad = THREE.Math.degToRad;
var deg = THREE.Math.radToDeg;

// CANNON.World component.
AFRAME.registerComponent('physics-world', {
  schema: {
    gravity: { type: 'vec3', default: { x: 0, y: -9.82, z: 0 } }
  },

  init: function () {
    var el = this.el;
    var world = this.world = new CANNON.World();

    this.fixedTimeStep = 1.0 / 60.0;
    this.maxSubSteps = 3;

    // Artificially bubble physics-world events to entity.
    ['beginContact', 'endContact'].forEach(function (eventName) {
      world.addEventListener(eventName, function (event) {
        el.emit('physics-' + eventName, {
          bodyA: event.bodyA.el,
          bodyB: event.bodyB.el,
          target: event.target,
          bubbles: false
        });
      });
    });
  },

  update: function (oldData) {
    var gravity = this.data.gravity;
    var world = this.world;
    world.broadphase = new CANNON.NaiveBroadphase();
    world.gravity.set(gravity.x, gravity.y, gravity.z);
  },

  tick: function (time) {
    // Simulation loop.
    var fixedTimeStep = this.fixedTimeStep;
    var maxSubSteps = this.maxSubsteps;
    var world = this.world;

    if (this.lastTime !== undefined){
      var timeChange  = (time - this.lastTime) / 1000;
      world.step(fixedTimeStep, timeChange, maxSubSteps);
      world.bodies.forEach(function (body) {
        if (body.tickWorld) { body.tickWorld(); }
      });
    }
    this.lastTime = time;
  }
});

// CANNON.Body component.
AFRAME.registerComponent('physics-body', {
  dependencies: ['position'],

  schema: {
    angularVelocity: { type: 'vec3' },
    angularDamping: { default: 0.01 },
    boundingBox: { type: 'vec3' },
    linearDamping: { default: 0.01 },
    mass: { default: 1 },
    velocity: { type: 'vec3' }
  },

  /**
   * TODO: Don't force physics-world to be on scene to allow for multiple physics worlds.
   */
  init: function () {
    var self = this;
    var sceneEl = this.el.sceneEl;

    this.tickWorldBound = this.tickWorld.bind(this);

    // Wait for scene to load to initialize physics world.
    sceneEl.addEventListener('loaded', function () {
      if (!('physics-world' in sceneEl.components)) {
        console.warn('physics-world must be specified on scene for physics to work.');
      }
      var world = self.world = sceneEl.components['physics-world'].world;
      var body = self.body = self.getBody(self.el, self.data);
      world.add(body);
    });
  },

  update: function (oldData) {
    if (!this.world) { return; }
    var diffData = diff(this.data, oldData);

    if ('velocity' in diffData) {
      this.body.velocity.x = diffData.velocity.x;
      this.body.velocity.y = diffData.velocity.y;
      this.body.velocity.z = diffData.velocity.z;
    }
  },

  applyImpulse: function (forceVec3, pointVec3) {
    pointVec3 = pointVec3 || { x: 0, y: 0, z: 0 };
    this.body.applyImpulse(
      new CANNON.Vec3(forceVec3.x, forceVec3.y, forceVec3.z),
      new CANNON.Vec3(pointVec3.x, pointVec3.y, pointVec3.z)
    );
  },

  getBody: function (el, data) {
    var boundingBox = data.boundingBox;
    var position = el.getAttribute('position');
    var angularVelocity = data.angularVelocity;
    var velocity = data.velocity;

    var bodyProperties = {
      angularDamping: data.angularDamping,
      angularVelocity: new CANNON.Vec3(rad(angularVelocity.x), rad(angularVelocity.y),
                                       rad(angularVelocity.z)),
      linearDamping: data.linearDamping,
      mass: data.mass,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: new CANNON.Box(new CANNON.Vec3(boundingBox.x / 2, boundingBox.y / 2,
                                            boundingBox.z / 2)),
      velocity: new CANNON.Vec3(velocity.x, velocity.y, velocity.z)
    };

    body = new CANNON.Body(bodyProperties);

    // Attach A-Frame stuff.
    body.el = el;
    body.tickWorld = this.tickWorldBound;

    // Artificially bubble physics-body event to entity.
    body.addEventListener('collide', function (event) {
      el.emit('physics-collide', {
        body: event.body,
        contact: event.contact,
        target: event.target,
        bubbles: false
      });
    });

    return body;
  },

  /**
   * Copy CANNON rigid body properties to THREE object3D.
   */
  tickWorld: function () {
    var body = this.body;
    var el = this.el;
    el.setAttribute('position', body.position);

    // Don't rotate camera around.
    if (this.el.components.camera) { return; }

    el.setAttribute('rotation', {
      x: deg(body.quaternion.x),
      y: deg(body.quaternion.y),
      z: deg(body.quaternion.z)
    });
  }
});

// CANNON.Material component.
AFRAME.registerComponent('physics-material', {
  dependencies: ['physics-body'],

  schema: {
    angularVelocity: { type: 'vec3' },
    angularDamping: { default: 0.01 },
    boundingBox: { type: 'vec3' },
    linearDamping: { default: 0.01 },
    mass: { default: 1 },
    velocity: { type: 'vec3' }
  },

  /**
   * TODO: Don't force physics-world to be on scene to allow for multiple physics worlds.
   */
  init: function () {
    var self = this;
    var sceneEl = this.el.sceneEl;

    this.tickWorldBound = this.tickWorld.bind(this);

    // Wait for scene to load to initialize physics world.
    sceneEl.addEventListener('loaded', function () {
      if (!('physics-world' in sceneEl.components)) {
        console.warn('physics-world must be specified on scene for physics to work.');
      }
      var world = self.world = sceneEl.components['physics-world'].world;
      var body = self.body = self.getBody(self.el, self.data);
      world.add(body);
    });
  },

  update: function () {
    if (!this.world) { return; }
  },

  applyImpulse: function (forceVec3, pointVec3) {
    pointVec3 = pointVec3 || { x: 0, y: 0, z: 0 };
    this.body.applyImpulse(
      new CANNON.Vec3(forceVec3.x, forceVec3.y, forceVec3.z),
      new CANNON.Vec3(pointVec3.x, pointVec3.y, pointVec3.z)
    );
  },

  getBody: function (el, data) {
    var boundingBox = data.boundingBox;
    var position = el.getAttribute('position');
    var angularVelocity = data.angularVelocity;
    var velocity = data.velocity;

    var bodyProperties = {
      angularDamping: data.angularDamping,
      angularVelocity: new CANNON.Vec3(rad(angularVelocity.x), rad(angularVelocity.y),
                                       rad(angularVelocity.z)),
      linearDamping: data.linearDamping,
      mass: data.mass,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: new CANNON.Box(new CANNON.Vec3(boundingBox.x / 2, boundingBox.y / 2,
                                            boundingBox.z / 2)),
      velocity: new CANNON.Vec3(velocity.x, velocity.y, velocity.z)
    };

    body = new CANNON.Body(bodyProperties);

    // Attach A-Frame stuff.
    body.el = el;
    body.tick = this.tickWorldBound;

    // Artificially bubble physics-body event to entity.
    body.addEventListener('collide', function (event) {
      el.emit('physics-collide', {
        body: event.body,
        contact: event.contact,
        target: event.target,
        bubbles: false
      });
    });

    return body;
  },

  /**
   * Copy CANNON rigid body properties to THREE object3D.
   */
  tickWorld: function () {
    var body = this.body;
    var el = this.el;
    el.setAttribute('position', body.position);
    el.setAttribute('rotation', {
      x: deg(body.quaternion.x),
      y: deg(body.quaternion.y),
      z: deg(body.quaternion.z)
    });
  }
});
