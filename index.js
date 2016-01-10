var CANNON = require('cannon');

// CANNON.World component.
var worldComponent = {
  schema: {
    gravity: {
      // m/s^2
      type: 'vec3',
      default: { x: 0, y: -9.8, z: 0 }
    }
  },

  init: function () {
    this.world = new CANNON.World();
  },

  update: function (oldData) {
    var world = this.world;
    world.gravity.set(this.data.gravity);
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

  init: function () {
    var world = this.world = this.el.sceneEl.components.physics.world;
    var position = this.el.getAttribute('position');
    var body = this.body = new CANNON.Body({
      position: new CANNON.Vec3(position.x, position.y, position.z)
    });
    world.add(body);
  },

  update: function (oldData) {
    var body = this.body;
    var object3D = this.el.object3D;
    body.position.copy(object3D.position);
    body.quaternion.copy(object3D.quaternion);
  }
};

module.exports.components = {
  'physics-body': bodyComponent,
  'physics-world': worldComponent
};
