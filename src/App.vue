<template>
  <div id="app">
    Hello Vue3, Count: {{ `${count}` }}
    <p>P content</p>
    <button @click="increment">Add</button>
    <hello-home msg="Hello Test Home Text" />
  </div>
</template>

<script>
import HelloHome from './components/Home.vue';

export default {
  components: {
    HelloHome,
  },
  data() {
    return {
      count: 1,
    };
  },
  methods: {
    increment() {
      this.count += 1;
    },
  },
};
</script>

<style lang="scss" scoped>
#app {
  color: red;
  p {
    color: blue;
  }
}
</style>
