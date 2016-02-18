var AFRAME = require('aframe');
var components = require('../src/index.js').components;

Object.keys(components).forEach(function (componentName) {
  AFRAME.registerComponent(componentName, components[componentName]);
});
