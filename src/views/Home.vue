<template>
  <div class="home">
    Hello Home {{ test }}
    <img src="../assets/logo.png" />
  </div>
</template>

<script>
import Logo from '../assets/logo.png';

export default {
  name: 'Home',
  props: {
    test: {
      type: String,
      default: '',
    },
  },
};
</script>

<style>

</style>