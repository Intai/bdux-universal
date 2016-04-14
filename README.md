# Bdux Universal

A [Bdux](https://github.com/Intai/bdux) middleware for Universal (isomorphic) JavaScript.

## Want to achieve
- Render the same [React](https://facebook.github.io/react/) app on both the client and the server.
- Seamlessly resume states from the server to the client.

## Installation
To install as an [npm](https://www.npmjs.com/) package:
```
npm install --save bdux-universal
```

## Usage
``` javascript
import * as Universal from 'bdux-universal';
import { applyMiddleware } from 'bdux';

applyMiddleware(
  Universal
);
```
Then place `<UniversalStates />` in root component to render serialised states.
``` javascript
import React from 'react';
import { UniversalStates } from 'bdux-universal';

const App = () => (
  <div>
    <UniversalStates />
  </div>
);

export default App;
```

## License
[The ISC License](./LICENSE.md)
