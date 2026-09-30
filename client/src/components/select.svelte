<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    id: string;
    label: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
  }

  let { id, label, value, options, onChange }: Props = $props();

  function handleChange(event: Event): void {
    const target = event.currentTarget as HTMLSelectElement;
    onChange(target.value);
  }
</script>

<div class="field">
  <label for={id}>{label}</label>
  <select {id} {value} onchange={handleChange}>
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
    width: 100%;
  }

  select {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.6rem 0.7rem;
    border: 1px solid #8a8378;
    border-radius: 4px;
    background: #fff;
  }
</style>
