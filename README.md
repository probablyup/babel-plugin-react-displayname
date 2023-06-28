# @probablyup/babel-plugin-react-displayname

![Jest test CI](https://github.com/probablyup/babel-plugin-react-displayname/workflows/Jest%20test%20CI/badge.svg)

> Automatically generate display names for React components, while retaining tree-shaking support in bundlers.

## Setup

1. Install the dependency

  ```sh
  yarn add --dev @probablyup/babel-plugin-react-displayname
  ```

2. Add the plugin to your babel configuration

  ```json
  {
    "plugins": ["@probablyup/babel-plugin-react-displayname"]
  }
  ```
## Why use this?

React dev tools infer component names from the name of the function or class that defines the component. However, it does not work when anonymous functions are used.

This plugin fixes that by automatically generating the [displayName](https://reactjs.org/docs/react-component.html#displayname) property for assigned anonymous functions.

## What does it do?

This plugin converts the following:

```tsx
const Linebreak = React.memo(() => {
    return <br />;
});

const Img = function () {
    return <img />;
}
```

into:

```tsx
const Linebreak = React.memo(function _Linebreak() {
  return <br />;
});
Linebreak.displayName = "Linebreak";

const Img = function () {
  return <img />;
};
Img.displayName = "Img";
```

## Options

### `allowedCallees`

`Object.<string, string[]>`, defaults to `{ "react": ["createContext"] }`

Enables generation of displayNames for certain called functions.

```json
{
  "plugins": ["@probablyup/babel-plugin-react-displayname", {
    "allowedCallees": {
      "react": ["createComponent"]
    }
  }]
}
```

#### Example

By default, with `allowedCallees` set to `{ "react": ["createContext"] }`:

```tsx
import React, { createContext } from 'react';
const FeatureContext = createContext();
const AnotherContext = React.createContext();
```

is transformed into:

```tsx
import React, { createContext } from 'react';
const FeatureContext = createContext();
FeatureContext.displayName = "FeatureContext";
const AnotherContext = React.createContext();
AnotherContext.displayName = "AnotherContext";
```

### `template`

Allows for rudimentary templating with the generated `displayName`. For example:

```json
{
  "plugins": ["@probablyup/babel-plugin-react-displayname", {
    "template": "DS.%s",
  }]
}
```

#### Example

from:

```tsx
const Linebreak = React.memo(() => {
    return <br />;
});

const Img = function () {
    return <img />;
}
```

to:

```tsx
const Linebreak = React.memo(function _Linebreak() {
  return <br />;
});
Linebreak.displayName = "DS.Linebreak";

const Img = function () {
  return <img />;
};
Img.displayName = "DS.Img";
```

### `skipPureAnnotations`

Allows you to skip `#__PURE__` annotations for displayName property assignment for tree-shaking support. `false` by default.

#### Example 1: 

```
{
    "plugins": ["@probablyup/babel-plugin-react-displayname", {
       "skipPureAnnotations": false
    }]
}
```

from: 

```jsx
const Img = function () {
  return <img />;
};
```

to:

```jsx
const Img = function () {
  return <img />;
};
/*#__PURE__*/Object.assign(Img, {
    "displayName": "Img"
});
```

#### Example 2:

```
{
    "plugins": ["@probablyup/babel-plugin-react-displayname", {
       "skipPureAnnotations": true
    }]
}
```

from:

```jsx
const Img = function () {
  return <img />;
};
```

to:

```jsx
const Img = function () {
  return <img />;
};
/*#__PURE__*/Object.assign(Img, {
    "displayName": "Img"
});
```
