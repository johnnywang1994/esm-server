<template>
  <div class="home">
    {{ msg }}
    <img src="../assets/logo.png" />
  </div>
</template>

<script>
export default {
  name: 'Home',
  props: {
    msg: {
      type: String,
      default: '',
    },
  },
};
</script>

<style>

</style>