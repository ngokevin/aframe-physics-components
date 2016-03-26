## aframe-physics-components

Experimental physics components for [A-Frame](https://aframe.io) VR using [cannon.js](http://schteppe.github.io/cannon.js/).

![physics2](https://cloud.githubusercontent.com/assets/674727/12221506/a6345502-b752-11e5-8d9c-3a7245d24994.gif)

### Usage

#### Browser Installation

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.2.0/aframe.min.js"></script>
  <script src="https://github.com/ngokevin/aframe-physics-components/blob/master/dist/aframe-physics-components.min.js"></script>
</head>

<body>
  <a-scene physics-world="gravity: 0 -9.8 0">
    <a-entity physics-body="boundingBox: 1 1 1; mass: 5; velocity: 0.2 0 0"
              geometry="primitive: box" material="color: red"></a-entity>
  </a-scene>
</body>
```

#### NPM Installation

Install via NPM:

```bash
npm install aframe-physics-component
```

Then register and use.

```js
require('aframe');
require('aframe-physics-components');
```

### API

#### physics-body Component

| Property        | Description           | Type   | Default Value |
| --------        | -----------           | ----   | ------------- |
| angularVelocity | (in deg/s)            | vec3   | 0 0 0         |
| boundingBox     | Collision box (in m). | vec3   | 0 0 0         |
| mass            | (in kg)               | number | 1             |
| velocity        | (in m/s)              | vec3   | 0 0 0         |

| Event Name | Description
| ---------- | -----------
| collide    | Emitted when entity collides with another entity. Event contains `contact`.

##### applyImpulse (impulseVec3, positionVec3)

Applies an impulse (indicated by `impulseVec3`) at the body's local point
(indicated by `positionVec3`). `forceVec3` is in Force / Time (Newtons /
Seconds).

```js
// Applies a small force from left-to-right to the top-left of the body.
var hitMeBody = document.querySelector('#hit-me-entity').components['physics-body'];
hitMeBody.applyImpulse({ x: 10, y: 0, z: 0 }, { x: -1, y: 1, z: 0 });
```

#### physics-world Component

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| gravity  | vec3        | 0 -9.8 0      |

| Event Name   | Description
| ----------   | -----------
| beginContact | Emitted when an entity in the world begins contact with another entity. Event contains `bodyA` and `bodyB`.
| endContact   | Emitted when an entity in the world ends contact with another entity. Event contains `bodyA` and `bodyB`.
