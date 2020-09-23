const __VUE = 'vue';
const __VUE_ROUTER = 'vue-router';

const isVue2 = (pkg) => pkg.name === __VUE && pkg.version.startsWith('2.');
const isVue2Router = (pkg) => pkg.name === __VUE_ROUTER &&
  pkg.version.startsWith('3.');

function checkVuePath(pkg) {
  if (isVue2(pkg)) {
    return 'dist/vue.esm.browser.min.js';
  } else if (isVue2Router(pkg)) {
    return 'dist/vue-router.esm.browser.min.js';
  }
  // give default path
  // first get .module, then .main
  return false;
}

module.exports = checkVuePath;
