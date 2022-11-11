import path from 'path';
import { transformSync } from '@babel/core';

const plugin = path.join(__dirname, './index.js');

const transform = (code, pluginOptions) =>
  transformSync(code, {
    babelrc: false,
    configFile: false,
    plugins: [[plugin, pluginOptions]],
    presets: [['@babel/preset-react', { pure: false }]],
  }).code;

const transformWithAllowedCallees = (code) =>
  transform(code, {
    allowedCallees: {
      'react-fela': ['createComponent', 'createComponentWithProxy'],
    },
  });

const transformWithTemplate = (code) =>
  transform(code, {
    template: 'Foo.%s',
  });

describe('babelDisplayNamePlugin', () => {
  it('should add display name to function expression components', () => {
    expect(
      transform(`
      foo.bar = function() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      foo.bar = function () {
        return React.createElement("img", null);
      };
      /*#__PURE__*/_applyDisplayName(foo.bar, "foo.bar");"
    `);

    expect(
      transform(`
      const Test = function() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Test = function () {
        return React.createElement("img", null);
      };
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);
  });

  it('should add display name to named function expression components', () => {
    expect(
      transform(`
      foo.bar = function Foo() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      foo.bar = function Foo() {
        return React.createElement("img", null);
      };
      /*#__PURE__*/_applyDisplayName(foo.bar, "foo.bar");"
    `);

    expect(
      transform(`
      const Test = function Foo() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Test = function Foo() {
        return React.createElement("img", null);
      };
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);
  });

  it('should add display name to arrow function components', () => {
    expect(
      transform(`
      foo.bar = () => {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      foo.bar = () => {
        return React.createElement("img", null);
      };
      /*#__PURE__*/_applyDisplayName(foo.bar, "foo.bar");"
    `);

    expect(
      transform(`
      const Test = () => {
        return <img/>;
      };`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Test = () => {
        return React.createElement("img", null);
      };
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);

    expect(
      transform(`
      const Test = () => <img/>;`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Test = () => React.createElement("img", null);
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);

    expect(
      transform(`
      const Test = () => () => <img/>;`)
    ).toMatchInlineSnapshot(`"const Test = () => () => React.createElement("img", null);"`);
  });

  it('should add display name to call expressions', () => {
    expect(
      transform(`
      import React from 'react'
      const Test = React.memo(() => {
        return <img/>;
      })`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import React from 'react';
      const Test = React.memo(() => {
        return React.createElement("img", null);
      });
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);

    expect(
      transform(`
      import React from 'react'
      const foo = {
        bar: React.memo(() => {
          return <img/>;
        })
      };`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import React from 'react';
      const foo = {
        bar: React.memo(() => {
          return React.createElement("img", null);
        })
      };
      /*#__PURE__*/_applyDisplayName(foo.bar, "foo.bar");"
    `);

    expect(
      transform(`
      import React from 'react'
      const Test = React.memo(React.createRef((props, ref) => {
        return <img/>;
      }))`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import React from 'react';
      const Test = React.memo(React.createRef((props, ref) => {
        return React.createElement("img", null);
      }));
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);

    expect(
      transform(`
      import React from 'react'
      const Test = React.memo(function _Test(props, ref) {
        return <img/>;
      })`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import React from 'react';
      const Test = React.memo(function _Test(props, ref) {
        return React.createElement("img", null);
      });
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);

    expect(
      transform(`
      import React from 'react'
      export const Test = React.memo(() => {
        return <img/>;
      })`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import React from 'react';
      export const Test = React.memo(() => {
        return React.createElement("img", null);
      });
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);
  });

  it('should add display name to allowed call expressions', () => {
    expect(
      transform(`
      import { createContext } from 'react';
      const FeatureContext = createContext();
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import { createContext } from 'react';
      const FeatureContext = createContext();
      /*#__PURE__*/_applyDisplayName(FeatureContext, "FeatureContext");"
    `);

    expect(
      transform(`
      import React from 'react';
      const FeatureContext = React.createContext();
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import React from 'react';
      const FeatureContext = React.createContext();
      /*#__PURE__*/_applyDisplayName(FeatureContext, "FeatureContext");"
    `);

    expect(
      transform(`
      import * as React from 'react';
      const FeatureContext = React.createContext();
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import * as React from 'react';
      const FeatureContext = React.createContext();
      /*#__PURE__*/_applyDisplayName(FeatureContext, "FeatureContext");"
    `);

    expect(
      transform(
        `
      import React from 'path/to/react';
      const FeatureContext = React.createContext();
      `,
        {
          allowedCallees: {
            'path/to/react': ['createContext'],
          },
        }
      )
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import React from 'path/to/react';
      const FeatureContext = React.createContext();
      /*#__PURE__*/_applyDisplayName(FeatureContext, "FeatureContext");"
    `);

    expect(
      transformWithAllowedCallees(`
      import { createComponent, createComponentWithProxy } from 'react-fela';
      foo.bar = createComponent();
      foo.bar1 = createComponentWithProxy();
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName2 from "@probablyup/babel-plugin-react-displayname/apply";
      import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import { createComponent, createComponentWithProxy } from 'react-fela';
      foo.bar = createComponent();
      /*#__PURE__*/_applyDisplayName(foo.bar, "foo.bar");
      foo.bar1 = createComponentWithProxy();
      /*#__PURE__*/_applyDisplayName2(foo.bar1, "foo.bar1");"
    `);

    expect(
      transformWithAllowedCallees(`
      import { createComponent } from 'react-fela';
      foo = { bar: createComponent() }
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import { createComponent } from 'react-fela';
      foo = {
        bar: createComponent()
      };
      /*#__PURE__*/_applyDisplayName(foo.bar, "foo.bar");"
    `);

    expect(
      transformWithAllowedCallees(`
      import { createComponent } from 'react-fela';
      const Test = createComponent();
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import { createComponent } from 'react-fela';
      const Test = createComponent();
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);
  });

  it('should add display name to object property components', () => {
    expect(
      transform(`
      const Components = {
        path: {
          test: () => <img/>
        }
      };`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Components = {
        path: {
          test: () => React.createElement("img", null)
        }
      };
      /*#__PURE__*/_applyDisplayName(Components.path.test, "Components.path.test");"
    `);

    expect(
      transform(`
      const pathStr = 'path';
      const Components = {
        [pathStr]: {
          test: () => <img/>
        }
      };`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const pathStr = 'path';
      const Components = {
        [pathStr]: {
          test: () => React.createElement("img", null)
        }
      };
      /*#__PURE__*/_applyDisplayName(Components[pathStr].test, "Components[pathStr].test");"
    `);

    expect(
      transform(`
      const Components = {
        test: function() { return <img/> }
      };`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Components = {
        test: function () {
          return React.createElement("img", null);
        }
      };
      /*#__PURE__*/_applyDisplayName(Components.test, "Components.test");"
    `);

    expect(
      transform(`
      const Components = {
        test: function Foo() { return <img/> }
      };`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Components = {
        test: function Foo() {
          return React.createElement("img", null);
        }
      };
      /*#__PURE__*/_applyDisplayName(Components.test, "Components.test");"
    `);
  });

  it('should add display name to object methods', () => {
    expect(
      transform(`
      const Components = {
        path: {
          test(props) {
            return <img/>;
          },
        }
      };
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Components = {
        path: {
          test(props) {
            return React.createElement("img", null);
          }
        }
      };
      /*#__PURE__*/_applyDisplayName(Components.path.test, "Components.path.test");"
    `);

    expect(
      transform(`
      const Components = {
        [foo[bar.foobar].baz]: {
          test(props) {
            return <img/>;
          },
        }
      };
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Components = {
        [foo[bar.foobar].baz]: {
          test(props) {
            return React.createElement("img", null);
          }
        }
      };
      /*#__PURE__*/_applyDisplayName(Components[foo[bar.foobar].baz].test, "Components[foo[bar.foobar].baz].test");"
    `);
  });

  it('should add display name to fragments', () => {
    expect(
      transform(`
      const Component = (props) => <><img {...props} /></>;
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Component = props => React.createElement(React.Fragment, null, React.createElement("img", props));
      /*#__PURE__*/_applyDisplayName(Component, "Component");"
    `);
  });

  it('should add display name to various expressions', () => {
    expect(
      transform(`
      const Component = () => false ? <img/> : null;
      const Component1 = () => <img/> || null;
      const Component2 = () => [<img/>];
      const Component3 = () => { return <img/> };

      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName4 from "@probablyup/babel-plugin-react-displayname/apply";
      import _applyDisplayName3 from "@probablyup/babel-plugin-react-displayname/apply";
      import _applyDisplayName2 from "@probablyup/babel-plugin-react-displayname/apply";
      import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Component = () => false ? React.createElement("img", null) : null;
      /*#__PURE__*/_applyDisplayName(Component, "Component");
      const Component1 = () => React.createElement("img", null) || null;
      /*#__PURE__*/_applyDisplayName2(Component1, "Component1");
      const Component2 = () => [React.createElement("img", null)];
      /*#__PURE__*/_applyDisplayName3(Component2, "Component2");
      const Component3 = () => {
        return React.createElement("img", null);
      };
      /*#__PURE__*/_applyDisplayName4(Component3, "Component3");"
    `);
  });

  it('should add display name for various kinds of assignments', () => {
    expect(
      transform(`
      var Test = () => <img/>
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      var Test = () => React.createElement("img", null);
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);

    expect(
      transform(`
      let Test = () => <img/>
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      let Test = () => React.createElement("img", null);
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);

    expect(
      transform(`
      export const Test = () => <img/>
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      export const Test = () => React.createElement("img", null);
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);
  });

  it('should not add display names for nameless functions', () => {
    expect(
      transformWithAllowedCallees(`
      export default () => <img/>
      `)
    ).toMatchInlineSnapshot(`"export default (() => React.createElement("img", null));"`);

    expect(
      transformWithAllowedCallees(`
      (() => <img/>)()
      `)
    ).toMatchInlineSnapshot(`"(() => React.createElement("img", null))();"`);

    expect(
      transformWithAllowedCallees(`
      {() => <img/>}
      `)
    ).toMatchInlineSnapshot(`
      "{
        () => React.createElement("img", null);
      }"
    `);

    expect(
      transformWithAllowedCallees(`
      (function() { return <img/> })()
      `)
    ).toMatchInlineSnapshot(`
      "(function () {
        return React.createElement("img", null);
      })();"
    `);

    expect(
      transformWithAllowedCallees(`
      (function test() { return <img/> })()
      `)
    ).toMatchInlineSnapshot(`
      "(function test() {
        return React.createElement("img", null);
      })();"
    `);

    expect(
      transformWithAllowedCallees(`
      export default function() { return <img/> }
      `)
    ).toMatchInlineSnapshot(`
      "export default function () {
        return React.createElement("img", null);
      }"
    `);
  });

  it('should not move elements out of their current scope', () => {
    expect(
      transformWithAllowedCallees(`
      const Component = (props) => <>{() => <img {...props} />}</>;
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Component = props => React.createElement(React.Fragment, null, () => React.createElement("img", props));
      /*#__PURE__*/_applyDisplayName(Component, "Component");"
    `);

    expect(
      transformWithAllowedCallees(`
      styledComponents.withTheme = (Component) => {
        const WithDefaultTheme = (props) => {
          return <div {...props} />;
        }
        return WithDefaultTheme;
      };
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      styledComponents.withTheme = Component => {
        const WithDefaultTheme = props => {
          return React.createElement("div", props);
        };
        /*#__PURE__*/_applyDisplayName(WithDefaultTheme, "WithDefaultTheme");
        return WithDefaultTheme;
      };"
    `);

    expect(
      transformWithAllowedCallees(`
      const Component = (options) => {
        return {
          test: function test(props) {
            return <img/>
          },
        };
      };
      `)
    ).toMatchInlineSnapshot(`
      "const Component = options => {
        return {
          test: function test(props) {
            return React.createElement("img", null);
          }
        };
      };"
    `);

    expect(
      transformWithAllowedCallees(`
      const Component = (props) => ({ test: <img {...props} /> });
      `)
    ).toMatchInlineSnapshot(`
      "const Component = props => ({
        test: React.createElement("img", props)
      });"
    `);

    expect(
      transformWithAllowedCallees(`
      const Component = (props) => {
        const LookUp = ((innerProps) => ({ a: () => <img {...innerProps} /> }))(props);
        return <div>{() => LookUp.a}</div>
      };
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Component = props => {
        const LookUp = (innerProps => ({
          a: () => React.createElement("img", innerProps)
        }))(props);
        return React.createElement("div", null, () => LookUp.a);
      };
      /*#__PURE__*/_applyDisplayName(Component, "Component");"
    `);
  });

  it('should add not overwrite existing display names', () => {
    expect(
      transformWithAllowedCallees(`
      foo.bar = () => <img/>;
      foo.bar.displayName = 'test';
      `)
    ).toMatchInlineSnapshot(`
      "foo.bar = () => React.createElement("img", null);
      foo.bar.displayName = 'test';"
    `);

    expect(
      transformWithAllowedCallees(`
      foo.bar = () => <img/>;
      foo.bar.displayName = 'test';
      foo.bar = () => <img/>;
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      foo.bar = () => React.createElement("img", null);
      foo.bar.displayName = 'test';
      foo.bar = () => React.createElement("img", null);
      /*#__PURE__*/_applyDisplayName(foo.bar, "foo.bar");"
    `);

    expect(
      transformWithAllowedCallees(`
      foo.bar = () => <img/>;
      foo.bar.displayName = 'foo.bar';
      foo.bar = () => <img/>;
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      foo.bar = () => React.createElement("img", null);
      foo.bar.displayName = 'foo.bar';
      foo.bar = () => React.createElement("img", null);
      /*#__PURE__*/_applyDisplayName(foo.bar, "foo.bar");"
    `);
  });

  it('should not add duplicate display names', () => {
    expect(
      transformWithAllowedCallees(`
      () => {
        const Test = () => <img/>;
      }
      const Test = () => <img/>;
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      () => {
        const Test = () => React.createElement("img", null);
        /*#__PURE__*/_applyDisplayName(Test, "Test");
      };
      const Test = () => React.createElement("img", null);"
    `);
  });

  it('should not change assignment orders', () => {
    expect(
      transformWithAllowedCallees(`
      foo.bar = () => <img/>;
      foo.bar = () => <br/>;
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      foo.bar = () => React.createElement("img", null);
      /*#__PURE__*/_applyDisplayName(foo.bar, "foo.bar");
      foo.bar = () => React.createElement("br", null);"
    `);

    expect(
      transformWithAllowedCallees(`
      foo.bar = () => <img/>;
      delete foo.bar;
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      foo.bar = () => React.createElement("img", null);
      /*#__PURE__*/_applyDisplayName(foo.bar, "foo.bar");
      delete foo.bar;"
    `);

    expect(
      transformWithAllowedCallees(`
      foo.bar = () => <img/>;
      function irrelvant() {};
      foo = null;
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      foo.bar = () => React.createElement("img", null);
      /*#__PURE__*/_applyDisplayName(foo.bar, "foo.bar");
      function irrelvant() {}
      ;
      foo = null;"
    `);
  });

  it('should not add display name to object properties', () => {
    expect(
      transformWithAllowedCallees(`
      const Components = {
        path: {
          test: <img/>
        }
      };`)
    ).toMatchInlineSnapshot(`
      "const Components = {
        path: {
          test: React.createElement("img", null)
        }
      };"
    `);

    expect(
      transformWithAllowedCallees(`
      const Components = () => ({
        path: {
          test: <img/>
        }
      });`)
    ).toMatchInlineSnapshot(`
      "const Components = () => ({
        path: {
          test: React.createElement("img", null)
        }
      });"
    `);

    expect(
      transformWithAllowedCallees(`
      const Components = callee({ foo: () => <img/> });
      `)
    ).toMatchInlineSnapshot(`
      "const Components = callee({
        foo: () => React.createElement("img", null)
      });"
    `);

    expect(
      transformWithAllowedCallees(`
      const Components = () => <div>{() => <img/>}</div>;
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Components = () => React.createElement("div", null, () => React.createElement("img", null));
      /*#__PURE__*/_applyDisplayName(Components, "Components");"
    `);
  });

  it('should not add display name to createClass', () => {
    expect(
      transformWithAllowedCallees(`
      const Component2 = _createClass(() => <img/>);
      `)
    ).toMatchInlineSnapshot(
      `"const Component2 = _createClass(() => React.createElement("img", null));"`
    );
  });

  it('should not add display name to hooks', () => {
    expect(
      transformWithAllowedCallees(`
      const Component = useMemo(() => <img/>);
      `)
    ).toMatchInlineSnapshot(`"const Component = useMemo(() => React.createElement("img", null));"`);
  });

  it('should not add display name to class components', () => {
    expect(
      transformWithAllowedCallees(`
      class Test extends React.Component {
        render() {
          return <img/>;
        }
      }`)
    ).toMatchInlineSnapshot(`
      "class Test extends React.Component {
        render() {
          return React.createElement("img", null);
        }
      }"
    `);

    expect(
      transformWithAllowedCallees(`
      class Test extends React.Component {
        notRender() {
          return <img/>;
        }
      }`)
    ).toMatchInlineSnapshot(`
      "class Test extends React.Component {
        notRender() {
          return React.createElement("img", null);
        }
      }"
    `);

    expect(
      transformWithAllowedCallees(`
      export class Test extends React.Component {
        render() {
          return <img/>;
        }
      }`)
    ).toMatchInlineSnapshot(`
      "export class Test extends React.Component {
        render() {
          return React.createElement("img", null);
        }
      }"
    `);

    expect(
      transformWithAllowedCallees(`
      export default class Test extends React.Component {
        render() {
          return <img/>;
        }
      }`)
    ).toMatchInlineSnapshot(`
      "export default class Test extends React.Component {
        render() {
          return React.createElement("img", null);
        }
      }"
    `);
  });

  it('should not add display name to function components', () => {
    expect(
      transformWithAllowedCallees(`
      function Test() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "function Test() {
        return React.createElement("img", null);
      }"
    `);

    expect(
      transformWithAllowedCallees(`
      export function Test() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "export function Test() {
        return React.createElement("img", null);
      }"
    `);

    expect(
      transformWithAllowedCallees(`
      export default function Test() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "export default function Test() {
        return React.createElement("img", null);
      }"
    `);

    expect(
      transformWithAllowedCallees(`
      export default function() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "export default function () {
        return React.createElement("img", null);
      }"
    `);
  });

  it('should not add display name to unknown call expressions', () => {
    expect(
      transformWithAllowedCallees(`
      import { createDirectionalComponent } from 'react-fela';
      foo.bar = createDirectionalComponent();
      `)
    ).toMatchInlineSnapshot(`
      "import { createDirectionalComponent } from 'react-fela';
      foo.bar = createDirectionalComponent();"
    `);

    expect(
      transformWithAllowedCallees(`
      import fela from 'react-fela';
      foo.bar = fela.createDirectionalComponent();
      `)
    ).toMatchInlineSnapshot(`
      "import fela from 'react-fela';
      foo.bar = fela.createDirectionalComponent();"
    `);

    expect(
      transformWithAllowedCallees(`
      import * as fela from 'react-fela';
      foo.bar = fela.createDirectionalComponent();
      `)
    ).toMatchInlineSnapshot(`
      "import * as fela from 'react-fela';
      foo.bar = fela.createDirectionalComponent();"
    `);
  });

  it('should not add display name to immediately invoked function expressions', () => {
    expect(
      transformWithAllowedCallees(`
      const Test = (function () {
        return <img/>;
      })()`)
    ).toMatchInlineSnapshot(`
      "const Test = function () {
        return React.createElement("img", null);
      }();"
    `);

    expect(
      transformWithAllowedCallees(`
      const Test = (function test() {
        return <img/>;
      })()`)
    ).toMatchInlineSnapshot(`
      "const Test = function test() {
        return React.createElement("img", null);
      }();"
    `);

    expect(
      transformWithAllowedCallees(`
      const Test = (() => {
        return <img/>;
      })()`)
    ).toMatchInlineSnapshot(`
      "const Test = (() => {
        return React.createElement("img", null);
      })();"
    `);
  });

  it('should not add display name to functions within jsx elements', () => {
    expect(
      transformWithAllowedCallees(`
      const Test = callee(<div>{() => <img/>}</div>);
      `)
    ).toMatchInlineSnapshot(
      `"const Test = callee(React.createElement("div", null, () => React.createElement("img", null)));"`
    );

    expect(
      transformWithAllowedCallees(`
      const Test = () => <img foo={{ bar: () => <img/> }} />;
      `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Test = () => React.createElement("img", {
        foo: {
          bar: () => React.createElement("img", null)
        }
      });
      /*#__PURE__*/_applyDisplayName(Test, "Test");"
    `);
  });

  it('should not add display name to non react components', () => {
    expect(
      transformWithAllowedCallees(`
      // foo.bar = createComponent();
      const Component = '';
      const Component1 = null;
      const Component2 = undefined;
      const Component3 = 0;
      let Component4;
      var Component5;
      const Component6 = ['foo', 5, null, undefined];
      const Component7 = { foo: 'bar' };
      const Component8 = new Wrapper();
      const Component9 = () => {};
      `)
    ).toMatchInlineSnapshot(`
      "// foo.bar = createComponent();
      const Component = '';
      const Component1 = null;
      const Component2 = undefined;
      const Component3 = 0;
      let Component4;
      var Component5;
      const Component6 = ['foo', 5, null, undefined];
      const Component7 = {
        foo: 'bar'
      };
      const Component8 = new Wrapper();
      const Component9 = () => {};"
    `);
  });

  it('should not add display name to other assignments', () => {
    expect(
      transformWithAllowedCallees(`
      const Component = <img/>;
      const Component1 = [<img/>];
      const Component2 = new Wrapper(<img/>);
      const Component3 = async (props) => await <img/>;
      const Component4 = callee(<img/>);
      `)
    ).toMatchInlineSnapshot(`
      "const Component = React.createElement("img", null);
      const Component1 = [React.createElement("img", null)];
      const Component2 = new Wrapper(React.createElement("img", null));
      const Component3 = async props => await React.createElement("img", null);
      const Component4 = callee(React.createElement("img", null));"
    `);
  });

  it('should handle things returning React.createElement and not direct JSX', () => {
    expect(
      transformWithAllowedCallees(`
        import React from 'react';

        const Foo = React.forwardRef(
          (props, ref) => {
            return React.createElement('div', {...props, ref})
          }
        )
    `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import React from 'react';
      const Foo = React.forwardRef((props, ref) => {
        return React.createElement('div', {
          ...props,
          ref
        });
      });
      /*#__PURE__*/_applyDisplayName(Foo, "Foo");"
    `);
  });

  it('should handle multiple wrappers', () => {
    expect(
      transformWithAllowedCallees(`
        import React from 'react';

        const Foo = React.memo(
          React.forwardRef(
            (props, ref) => {
              return React.createElement('div', {...props, ref})
            }
          )
        )
    `)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      import React from 'react';
      const Foo = React.memo(React.forwardRef((props, ref) => {
        return React.createElement('div', {
          ...props,
          ref
        });
      }));
      /*#__PURE__*/_applyDisplayName(Foo, "Foo");"
    `);
  });

  it('should apply a template if provided', () => {
    expect(
      transformWithTemplate(`
      const Test = function() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "import _applyDisplayName from "@probablyup/babel-plugin-react-displayname/apply";
      const Test = function () {
        return React.createElement("img", null);
      };
      /*#__PURE__*/_applyDisplayName(Test, "Foo.Test");"
    `);
  });
});
