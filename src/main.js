// import { createApp } from 'vue';
import Vue from 'vue';
import App from './App.vue';
import store from './store';
// import router from './router';
import './index.scss';

// createApp(App)
//   .use(store)
//   .use(router)
//   .mount('#app');
new Vue({
  store,
  // router,
  render: h => h(App),
}).$mount('#app');
