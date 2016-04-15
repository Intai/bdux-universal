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

## Server rendering
Server Root can be created using `createRoot(createElement, stores = {})`.
- `createElement` is a function to create the application root element.
- `stores` is an object of dependent stores.

Then use `renderToString` function to render the application into an HTML string through [ReactDOMServer](https://facebook.github.io/react/docs/top-level-api.html#reactdomserver.rendertostring).
``` javascript
DefaultRoot.renderToString(req, res)
```

Example of a server root:
``` javascript
import React from 'react';
import App from '../components/app-react';
import MessageAction from '../actions/message-action';
import MessageStore from '../stores/message-store';
import { resetLocationHistory, LocationStore } from 'bdux-react-router';
import { createRoot } from 'bdux-universal';

export const createElement = (req) => {
  resetLocationHistory(req.path);
  MessageAction.message('Message from Server');
  return (<App />);
};

export default createRoot(
  createElement, {
    location: LocationStore,
    message: MessageStore
  }
);
```
Please checkout [Universal](https://github.com/Intai/bdux-examples/tree/master/universal) for a example setup with [Express](http://expressjs.com/) and [webpack](https://webpack.github.io/).

## License
[The ISC License](./LICENSE.md)
