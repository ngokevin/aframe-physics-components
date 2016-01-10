var CANNON = require('cannon');

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
    mass: {
      type: 'int',
      default: 1
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

      var position = self.el.getAttribute('position');
      var body = self.body = new CANNON.Body({
        mass: self.data.mass,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        shape: new CANNON.Sphere(1)  // TODO: IMPORT SHAPE FROM GEOMETRY.
      });
      body.aframeUpdate = self.worldTickBehavior;
      world.add(body);
    });
  },

  /**
   * Copy CANNON rigid body properties to THREE object3D.
   */
  worldTick: function () {
    var body = this.body;
    var el = this.el;
    var object3D = this.el.object3D;

    el.setAttribute('position', body.position);
    body.quaternion.copy(object3D.quaternion);
  }
};

module.exports.components = {
  'physics-body': bodyComponent,
  'physics-world': worldComponent
};
