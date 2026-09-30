<script lang="ts">
  import { sanitizeQueryInput } from "@search/shared";

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

  function isTypingShortcut(event: KeyboardEvent): boolean {
    return event.ctrlKey || event.metaKey || event.altKey;
  }

  function handleBeforeInput(event: InputEvent): void {
    if (event.isComposing) {
      return;
    }
    if (event.inputType !== "insertText" || !event.data) {
      return;
    }
    if (/[^A-Za-z0-9 ]/.test(event.data)) {
      event.preventDefault();
    }
  }

  function handleInput(event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    const cleaned = sanitizeQueryInput(target.value);
    if (target.value !== cleaned) {
      target.value = cleaned;
    }
    onInput(cleaned);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
      return;
    }
    if (isTypingShortcut(event) || event.key.length !== 1) {
      return;
    }
    if (/[^A-Za-z0-9 ]/.test(event.key)) {
      event.preventDefault();
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
    inputmode="search"
    pattern="[A-Za-z0-9 ]*"
    title="Use letters, numbers, and spaces only"
    autocomplete="off"
    spellcheck="false"
    onbeforeinput={handleBeforeInput}
    oninput={handleInput}
    onkeydown={handleKeydown}
  />
  <p class="hint">
    Letters, numbers, and spaces only. {remaining} characters left
  </p>
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
