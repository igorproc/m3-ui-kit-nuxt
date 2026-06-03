<template>
  <div class="page-container">
    <main class="content">
      <h1>UI Kit Components</h1>
    </main>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-background-contrast);
}

.content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.component-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background-color: var(--color-surface);
  color: var(--color-surface-contrast);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.button-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.button-row h3 {
  width: 100px;
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-surface-variant-contrast);
}

.interactive-row {
  display: flex;
  align-items: center;
  gap: 2rem;
}
</style>
