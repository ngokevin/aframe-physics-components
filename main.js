var AFRAME = require('aframe-core');
var components = require('../index.js').components;

Object.keys(components).forEach(function (componentName) {
  AFRAME.registerComponent(componentName, components[componentName]);
});
