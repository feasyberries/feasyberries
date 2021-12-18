<svelte:head>
  <title>Feasy Berries</title>
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Crete+Round&family=Permanent+Marker&family=Poppins:wght@300;600&display=swap" rel="stylesheet">
  <!-- <script src="http://files.keyes.ie/things/baseliner/baseliner-latest.min.js"></script> -->
  <!-- <script>
    window.onload = function() {
      baseliner = new Baseliner(6);
    }
  </script> -->
  <style>
    body {
      margin: 0;
    }
  </style>
</svelte:head>

<style>
  .root {
    background-color: var(--background-color);
    font-family: var(--sans-serif-font);
    font-weight: 300;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
</style>

<script lang="ts">
  import Home from "../lib/components/Home.svelte"
</script>

<div class="root">
  <Home />
</div>
