<template>
  <div class="page-container">
    <m-app-bar />

    <main class="content">
      <h1>UI Kit Components</h1>

      <section class="component-section">
        <h2>Buttons</h2>
        
        <div class="button-row">
          <h3>Filled</h3>
          <m-button variant="filled" color="primary">Primary</m-button>
          <m-button variant="filled" color="accent">Accent</m-button>
          <m-button variant="filled" color="warn">Warn</m-button>
          <m-button variant="filled" disabled>Disabled</m-button>
        </div>

        <div class="button-row">
          <h3>Elevated</h3>
          <m-button variant="elevated" color="primary">Primary</m-button>
          <m-button variant="elevated" color="accent">Accent</m-button>
          <m-button variant="elevated" color="warn">Warn</m-button>
          <m-button variant="elevated" disabled>Disabled</m-button>
        </div>

        <div class="button-row">
          <h3>Tonal</h3>
          <m-button variant="tonal" color="primary">Primary</m-button>
          <m-button variant="tonal" color="accent">Accent</m-button>
          <m-button variant="tonal" color="warn">Warn</m-button>
          <m-button variant="tonal" disabled>Disabled</m-button>
        </div>

        <div class="button-row">
          <h3>Outlined</h3>
          <m-button variant="outlined" color="primary">Primary</m-button>
          <m-button variant="outlined" color="accent">Accent</m-button>
          <m-button variant="outlined" color="warn">Warn</m-button>
          <m-button variant="outlined" disabled>Disabled</m-button>
        </div>

        <div class="button-row">
          <h3>Text</h3>
          <m-button variant="text" color="primary">Primary</m-button>
          <m-button variant="text" color="accent">Accent</m-button>
          <m-button variant="text" color="warn">Warn</m-button>
          <m-button variant="text" disabled>Disabled</m-button>
        </div>
      </section>
      
      <section class="component-section">
        <h2>Interactive Elements</h2>
        <div class="interactive-row">
          <m-checkbox />
          <m-switch />
          <m-radio />
        </div>
      </section>
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
