module.exports = {
  hmr: {
    interval: 1000,
  }, // hot reload(bool/object)
  autoTransform: true, // transform node_modules packages from es5 => es6
  jsx: true, // use jsx for module
  rules: [], // array
  static: './public',
  checkModulePath: () => {}, // function
};
