<script lang="ts">
  interface Props {
    id: string;
    label: string;
    value: string;
    maxlength: number;
    remaining: number;
    onInput: (value: string) => void;
    onSubmit: () => void;
  }

  let {
    id,
    label,
    value,
    maxlength,
    remaining,
    onInput,
    onSubmit,
  }: Props = $props();

  function handleInput(event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    onInput(target.value);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  }
</script>

<div class="field">
  <label for={id}>{label}</label>
  <input
    {id}
    type="search"
    {value}
    {maxlength}
    autocomplete="off"
    spellcheck="false"
    oninput={handleInput}
    onkeydown={handleKeydown}
  />
  <p class="hint">{remaining} characters left</p>
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
    width: 100%;
  }

  input {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.6rem 0.7rem;
    border: 1px solid #8a8378;
    border-radius: 4px;
    background: #fff;
  }

  .hint {
    margin: 0;
    font-size: 0.85rem;
    color: #4a4a4a;
  }
</style>
