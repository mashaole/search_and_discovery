<script lang="ts">
  function throwOnRender(): never {
    throw new Error("demo card render");
  }
</script>

{throwOnRender()}
