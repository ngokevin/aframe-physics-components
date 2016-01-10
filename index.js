var CANNON = require('cannon');
var coordinates = require('aframe-core').utils.coordinates;  // TODO: require('aframe').

var rad = THREE.Math.degToRad;
var deg = THREE.Math.radToDeg;

// CANNON.World component.
var worldComponent = {
  schema: {
    gravity: {
      // m/s^2
      type: 'vec3',
      default: { x: 0, y: -9.82, z: 0 }
    }
  },

  init: function () {
    var self = this;
    var world = this.world = new CANNON.World();

    var fixedTimeStep = 1.0 / 60.0;
    var maxSubSteps = 3;

    // Add simulation loop.
    this.el.addBehavior(function (time) {
      if (self.lastTime !== undefined){
        var timeChange  = (time - self.lastTime) / 1000;
        world.step(fixedTimeStep, timeChange, maxSubSteps);
        world.bodies.forEach(function (body) {
          if (body.aframeUpdate) { body.aframeUpdate(); }
        });
      }
      self.lastTime = time;
    });
  },

  update: function (oldData) {
    var gravity = this.data.gravity;
    var world = this.world;
    world.broadphase = new CANNON.NaiveBroadphase();
    world.gravity.set(gravity.x, gravity.y, gravity.z);
  }
}

// CANNON.Body component.
var bodyComponent = {
  dependencies: ['position'],

  schema: {
    angularVelocity: {
      type: 'vec3'
    },
    boundingBox: {
      type: 'vec3'
    },
    mass: {
      type: 'int',
      default: 1
    },
    velocity: {
      type: 'vec3'
    }
  },

  /**
   * TODO: Don't force physics-world to be on scene to allow for multiple physics worlds.
   */
  init: function () {
    var self = this;
    var sceneEl = this.el.sceneEl;

    this.worldTickBehavior = this.worldTick.bind(this);

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
      angularVelocity: new CANNON.Vec3(rad(angularVelocity.x), rad(angularVelocity.y),
                                       rad(angularVelocity.z)),
      mass: data.mass,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: new CANNON.Box(new CANNON.Vec3(boundingBox.x / 2, boundingBox.y / 2,
                                            boundingBox.z / 2)),
      velocity: new CANNON.Vec3(velocity.x, velocity.y, velocity.z)
    };

    body = new CANNON.Body(bodyProperties);
    body.aframeUpdate = this.worldTickBehavior;
    return body;
  },

  /**
   * Copy CANNON rigid body properties to THREE object3D.
   */
  worldTick: function () {
    var body = this.body;
    var el = this.el;
    el.setAttribute('position', body.position);
    el.setAttribute('rotation', {
      x: deg(body.quaternion.x),
      y: deg(body.quaternion.y),
      z: deg(body.quaternion.z)
    });
  }
};

module.exports.components = {
  'physics-body': bodyComponent,
  'physics-world': worldComponent
};
