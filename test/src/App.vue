<script setup>
import BabylonScene from './components/BabylonScene.vue'; 
</script>

<template>
  <div id="app-container">

    <BabylonScene /> 

  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  background-color: #000;
}

#app {
  width: 100%;
  height: 100%;
}
</style>