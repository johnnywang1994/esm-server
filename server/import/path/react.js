const __REACT = 'react';
const __REACT_DOM = 'react-dom';

const isReact = (pkg) => pkg.name === __REACT;
const isReactDom = (pkg) => pkg.name === __REACT_DOM;

function checkReactPath(pkg) {
  if (isReact(pkg)) {
    return '../@pika/react/source.development.js';
  } else if (isReactDom(pkg)) {
    return '../@pika/react-dom/source.development.js';
  }
  // give default path
  // first get .module, then .main
  return false;
}

module.exports = checkReactPath;
