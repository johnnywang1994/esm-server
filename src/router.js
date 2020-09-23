import Vue from 'vue';
// import { createRouter, createWebHistory } from 'vue-router';
import Router from 'vue-router';
import Home from './views/Home.vue';
import About from './views/About.vue';

Vue.use(Router);

export default new Router({
  // history: createWebHistory('/'),
  mode: 'history',
  routes: [
    {
      name: 'Home',
      path: '/',
      component: Home,
    },
    {
      name: 'About',
      path: '/about',
      component: About,
    },
  ],
})