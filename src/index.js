const { declare } = require('@babel/helper-plugin-utils');
const { default: annotateAsPure } = require('@babel/helper-annotate-as-pure');

// remember to set `cacheDirectory` to `false` when modifying this plugin

const DEFAULT_ALLOWED_CALLEES = {
  react: ['createContext', 'forwardRef', 'memo'],
};

const calleeModuleMapping = new Map(); // Mapping of callee name to module name
const seenDisplayNames = new Set();

function applyAllowedCallees(mapping) {
  Object.entries(mapping).forEach(([moduleName, methodNames]) => {
    methodNames.forEach((methodName) => {
      calleeModuleMapping.set(methodName, moduleName);
    });
  });
}

module.exports = declare((api, options) => {
  api.assertVersion(7);

  calleeModuleMapping.clear();

  applyAllowedCallees(DEFAULT_ALLOWED_CALLEES);

  if (options.allowedCallees) {
    applyAllowedCallees(options.allowedCallees);
  }

  const types = api.types;

  return {
    name: '@probablyup/babel-plugin-react-displayname',
    visitor: {
      Program() {
        // We allow duplicate names across files,
        // so we clear when we're transforming on a new file
        seenDisplayNames.clear();
      },
      'FunctionExpression|ArrowFunctionExpression|ObjectMethod': function (path) {
        // if the parent is a call expression, make sure it's an allowed one
        if (
          path.parentPath && types.isCallExpression(path.parentPath.node)
            ? isAllowedCallExpression(types, path.parentPath)
            : true
        ) {
          if (doesReturnJSX(types, path.node.body)) {
            addDisplayNamesToFunctionComponent(types, path, options);
          }
        }
      },
      CallExpression(path) {
        if (isAllowedCallExpression(types, path)) {
          addDisplayNamesToFunctionComponent(types, path, options);
        }
      },
    },
  };
});

/**
 * Checks if this function returns JSX nodes.
 * It does not do type-checking, which means calling
 * other functions that return JSX will still return `false`.
 *
 * @param {Types} types content of @babel/types package
 * @param {Node} node function node
 */
function doesReturnJSX(types, node) {
  if (!node) return false;

  const body = types.toBlock(node).body;
  if (!body) return false;

  return body.some((statement) => {
    let node;

    if (types.isReturnStatement(statement)) {
      node = statement.argument;
    } else if (
      types.isExpressionStatement(statement) &&
      !types.isCallExpression(statement.expression)
    ) {
      node = statement.expression;
    } else {
      return false;
    }

    if (
      types.isCallExpression(node) &&
      // detect *.createElement and count it as returning JSX
      // this could be improved a lot but will work for the 99% case
      types.isMemberExpression(node.callee) &&
      node.callee.property.name === 'createElement'
    ) {
      return true;
    }

    if (types.isConditionalExpression(node)) {
      return isJSX(types, node.consequent) || isJSX(types, node.alternate);
    }

    if (types.isLogicalExpression(node)) {
      return isJSX(types, node.left) || isJSX(types, node.right);
    }

    if (types.isArrayExpression(node)) {
      return node.elements.some((ele) => isJSX(types, ele));
    }

    return isJSX(types, node);
  });
}

/**
 * Checks if this node is JSXElement or JSXFragment,
 * which are the root nodes of react components.
 *
 * @param {Types} types content of @babel/types package
 * @param {Node} node babel node
 */
function isJSX(types, node) {
  return types.isJSXElement(node) || types.isJSXFragment(node);
}

/**
 * Checks if this path is an allowed CallExpression.
 *
 * @param {Types} types content of @babel/types package
 * @param {Path} path path of callee
 */
function isAllowedCallExpression(types, path) {
  const callee = path.node.callee;
  const calleeName = callee.name || (callee.property && callee.property.name);
  const moduleName = calleeModuleMapping.get(calleeName);

  if (!moduleName) {
    return false;
  }

  // If the callee is an identifier expression, then check if it matches
  // a named import, e.g. `import {createContext} from 'react'`.
  if (types.isIdentifier(callee)) {
    const callee = path.get('callee');
    return callee.referencesImport(moduleName, calleeName);
  }

  // Otherwise, check if the member expression's object matches
  // a default import (e.g. `import React from 'react'`)
  // or namespace import (e.g. `import * as React from 'react')
  if (types.isMemberExpression(callee)) {
    const object = path.get('callee.object');

    return (
      object.referencesImport(moduleName, 'default') || object.referencesImport(moduleName, '*')
    );
  }

  return false;
}

/**
 * Adds displayName to the function component if it is:
 *  - assigned to a variable or object path
 *  - not within other JSX elements
 *  - not called by a react hook or _createClass helper
 *
 * @param {Types} types content of @babel/types package
 * @param {Path} path path of function
 * @param {Object} options
 */
function addDisplayNamesToFunctionComponent(types, path, options) {
  const componentIdentifiers = [];
  if (path.node.key) {
    componentIdentifiers.push({ id: path.node.key });
  }

  let assignmentPath;
  let hasCallee = false;
  let hasObjectProperty = false;

  const scopePath = path.scope.parent && path.scope.parent.path;
  path.find((parentPath) => {
    // we've hit the scope, stop going further up
    if (parentPath === scopePath) {
      return true;
    }

    // Ignore functions within jsx
    if (isJSX(types, parentPath.node)) {
      return true;
    }

    if (parentPath.isCallExpression()) {
      // Ignore immediately invoked function expressions (IIFEs)
      const callee = parentPath.node.callee;
      if (types.isArrowFunctionExpression(callee) || types.isFunctionExpression(callee)) {
        return true;
      }

      // Ignore instances where displayNames are disallowed
      // _createClass(() => <Element />)
      // useMemo(() => <Element />)
      const calleeName = callee.name;
      if (calleeName && (calleeName.startsWith('_') || calleeName.startsWith('use'))) {
        return true;
      }

      hasCallee = true;
    }

    // componentIdentifier = <Element />
    if (parentPath.isAssignmentExpression()) {
      assignmentPath = parentPath.parentPath;
      componentIdentifiers.unshift({ id: parentPath.node.left });
      return true;
    }

    // const componentIdentifier = <Element />
    if (parentPath.isVariableDeclarator()) {
      assignmentPath = parentPath.parentPath;
      componentIdentifiers.unshift({ id: parentPath.node.id });
      return true;
    }

    // if this is not a continuous object key: value pair, stop processing it
    if (hasObjectProperty && !(parentPath.isObjectProperty() || parentPath.isObjectExpression())) {
      return true;
    }

    // { componentIdentifier: <Element /> }
    if (parentPath.isObjectProperty()) {
      hasObjectProperty = true;
      const node = parentPath.node;
      componentIdentifiers.unshift({ id: node.key, computed: node.computed });
    }

    return false;
  });

  if (!assignmentPath || componentIdentifiers.length === 0) {
    return;
  }

  let name = generateDisplayName(types, componentIdentifiers);

  if (options.template) {
    name = options.template.replace(/%s/, name);
  }

  const pattern = `${name}.displayName`;

  // disallow duplicate names if they were assigned in different scopes
  if (seenDisplayNames.has(name) && !hasBeenAssignedPrev(types, assignmentPath, pattern, name)) {
    return;
  }

  // skip unnecessary addition of name if it is reassigned later on
  if (hasBeenAssignedNext(types, assignmentPath, pattern)) return;

  // at this point we're ready to start pushing code

  if (hasCallee) {
    // if we're getting called by some wrapper function,
    // give this function a name
    setInternalFunctionName(types, path, name);
  }

  const displayNameStatement = createDisplayNameStatement(types, componentIdentifiers, name);

  assignmentPath.insertAfter(displayNameStatement);

  seenDisplayNames.add(name);
}

/**
 * Generate a displayName string based on the ids collected.
 *
 * @param {Types} types content of @babel/types package
 * @param {componentIdentifier[]} componentIdentifiers list of { id, computed } objects
 */
function generateDisplayName(types, componentIdentifiers) {
  let displayName = '';
  componentIdentifiers.forEach((componentIdentifier) => {
    const node = componentIdentifier.id;
    if (!node) return;
    const name = generateNodeDisplayName(types, node);
    displayName += componentIdentifier.computed ? `[${name}]` : `.${name}`;
  });

  return displayName.slice(1);
}

/**
 * Generate a displayName string based on the node.
 *
 * @param {Types} types content of @babel/types package
 * @param {Node} node identifier or member expression node
 */
function generateNodeDisplayName(types, node) {
  if (types.isIdentifier(node)) {
    return node.name;
  }

  if (types.isMemberExpression(node)) {
    const objectDisplayName = generateNodeDisplayName(types, node.object);
    const propertyDisplayName = generateNodeDisplayName(types, node.property);

    const res = node.computed
      ? `${objectDisplayName}[${propertyDisplayName}]`
      : `${objectDisplayName}.${propertyDisplayName}`;
    return res;
  }

  return '';
}

/**
 * Checks if this path has been previously assigned to a particular value.
 *
 * @param {Types} types content of @babel/types package
 * @param {Path} assignmentPath path where assignement will take place
 * @param {string} pattern assignment path in string form e.g. `x.y.z`
 * @param {string} value assignment value to compare with
 */
function hasBeenAssignedPrev(types, assignmentPath, pattern, value) {
  return assignmentPath.getAllPrevSiblings().some((sibling) => {
    const expression = sibling.get('expression');
    if (!types.isAssignmentExpression(expression.node, { operator: '=' })) return false;
    if (!types.isStringLiteral(expression.node.right, { value })) return false;
    return expression.get('left').matchesPattern(pattern);
  });
}

/**
 * Checks if this path will be assigned later in the scope.
 *
 * @param {Types} types content of @babel/types package
 * @param {Path} assignmentPath path where assignement will take place
 * @param {string} pattern assignment path in string form e.g. `x.y.z`
 */
function hasBeenAssignedNext(types, assignmentPath, pattern) {
  return assignmentPath.getAllNextSiblings().some((sibling) => {
    const expression = sibling.get('expression');
    if (!types.isAssignmentExpression(expression.node, { operator: '=' })) return false;
    return expression.get('left').matchesPattern(pattern);
  });
}

/**
 * Generate a displayName ExpressionStatement node based on the ids.
 *
 * @param {Types} types content of @babel/types package
 * @param {componentIdentifier[]} componentIdentifiers list of { id, computed } objects
 * @param {string} displayName name of the function component
 */
function createDisplayNameStatement(types, componentIdentifiers, displayName, helperIdentifier) {
  const node = createMemberExpression(types, componentIdentifiers);

  const expression = types.callExpression(
    types.memberExpression(types.identifier('Object'), types.identifier('assign')),
    [
      node,
      types.objectExpression([
        types.objectProperty(types.stringLiteral('displayName'), types.stringLiteral(displayName)),
      ]),
    ]
  );

  annotateAsPure(expression);

  return types.expressionStatement(expression);
}

/**
 * Helper that creates a MemberExpression node from the ids.
 *
 * @param {Types} types content of @babel/types package
 * @param {componentIdentifier[]} componentIdentifiers list of { id, computed } objects
 */
function createMemberExpression(types, componentIdentifiers) {
  let node = componentIdentifiers[0].id;
  if (componentIdentifiers.length > 1) {
    for (let i = 1; i < componentIdentifiers.length; i++) {
      const { id, computed } = componentIdentifiers[i];
      node = types.memberExpression(node, id, computed);
    }
  }
  return node;
}

/**
 * Changes the arrow function to a function expression and gives it a name.
 * `name` will be changed to ensure that it is unique within the scope. e.g. `helper` -> `_helper`
 *
 * @param {Types} types content of @babel/types package
 * @param {string} name name of function to follow after
 */
function setInternalFunctionName(types, path, name) {
  if (!name || path.node.id != null || path.node.key != null) {
    return;
  }

  const id = path.scope.generateUidIdentifier(name);
  if (path.isArrowFunctionExpression()) {
    path.arrowFunctionToExpression();
  }
  path.node.id = id;
}
