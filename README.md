# Bdux Universal

A [Bdux](https://github.com/Intai/bdux) middleware for Universal (isomorphic) JavaScript.

[![Build Status](https://travis-ci.org/Intai/bdux-universal.svg?branch=master)](https://travis-ci.org/Intai/bdux-universal)
[![Coverage Status](https://coveralls.io/repos/github/Intai/bdux-universal/badge.svg?branch=master)](https://coveralls.io/github/Intai/bdux-universal?branch=master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/e8a1e446f73441d594db7653367c17e5)](https://www.codacy.com/app/intai-hg/bdux-universal?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Intai/bdux-universal&amp;utm_campaign=Badge_Grade)

## Want to achieve
- Render the same [React](https://facebook.github.io/react/) app on both the client and the server.
- Seamlessly resume states from the server to the client.

## Installation
To install as an [npm](https://www.npmjs.com/) package:
```sh
npm install --save bdux-universal
```

## Usage
```javascript
import * as Universal from 'bdux-universal'
import { applyMiddleware } from 'bdux'

applyMiddleware(
  Universal
)
```
Then place `<UniversalStates />` in root component to render serialised states.
```javascript
import React from 'react'
import { UniversalStates } from 'bdux-universal'

const App = () => (
  <>
    <UniversalStates />
  </>
)

export default App
```

## Server rendering
Server Root can be created using `createRoot(createElement, stores = {})`.
- `createElement` is a function to create the application root element.
- `stores` is an object of dependent stores.

Then use `renderToString` or `renderToNodeStream` function to render the application into HTML through [ReactDOMServer](https://reactjs.org/docs/react-dom-server.html).
```javascript
DefaultRoot.renderToString(req, res)
```

Example of a server root:
```javascript
import React from 'react'
import App from '../components/app-react'
import MessageAction from '../actions/message-action'
import MessageStore from '../stores/message-store'
import { resetLocationHistory, LocationStore } from 'bdux-react-router'
import { createRoot } from 'bdux-universal'

export const createElement = ({ dispatch }, req) => {
  resetLocationHistory(req.path)
  dispatch(MessageAction.message('Message from Server'))
  return <App />
}

export default createRoot(
  createElement, {
    location: LocationStore,
    message: MessageStore
  }
)
```
Please checkout [Universal](https://github.com/Intai/bdux-examples/tree/master/universal) for a example setup with [Express](http://expressjs.com/) and [webpack](https://webpack.github.io/).

## Asynchronous server rendering
Server Root can be created using `createAsyncRoot(createAsyncActions, createElement, stores = {})`.
- `createAsyncActions` is a function to create a [Bacon](https://baconjs.github.io/) stream which produce a single array of asynchronous actions.
- `createElement` is a function to create the application root element.
- `stores` is an object of dependent stores.

Then use `renderToString` or `renderToNodeStream` function to render the application into HTML through [ReactDOMServer](https://reactjs.org/docs/react-dom-server.html) asynchronously.
```javascript
DefaultRoot.renderToString(req, res)
  .map(renderHtml(res))
  .subscribe(() => Bacon.noMore)
```

Example of an asynchronous server root:
```javascript
import R from 'ramda'
import React from 'react'
import Bacon from 'baconjs'
import App from '../components/app-react'
import WeatherAction from '../actions/weather-action'
import WeatherStore from '../stores/weather-store'
import CountryCodesAction from '../actions/country-codes-action'
import CountryCodesStore from '../stores/country-codes-store'
import { createAsyncRoot } from 'bdux-universal'

export const createAsyncActions = () => (
  Bacon.when([
    CountryCodesAction.load(),
    WeatherAction.searchWeather('NZ', 'Auckland').last()
  ],
  // map arguments to an array.
  R.unapply(R.identity))
)

export const createElement = () => (
  <App />
)

export default createAsyncRoot(
  createAsyncActions,
  createElement, {
    countryCodes: CountryCodesStore,
    weather: WeatherStore
  }
)
```
Please checkout [Async](https://github.com/Intai/bdux-examples/tree/master/async) for a example setup with [Express](http://expressjs.com/) and [webpack](https://webpack.github.io/).

## License
[The ISC License](./LICENSE.md)
