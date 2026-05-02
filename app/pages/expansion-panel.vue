<script setup lang="ts">
const panel1 = ref(false)
const panel2 = ref(true)
const panel3 = ref(false)
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-expansion-panel
      </h2>
      <p class="ui-test-section__description">
        Expansion panels contain creation flows and allow lightweight editing of an element.
      </p>
    </header>

    <div class="ui-test-section__panels">
      <ui-expansion-panel
        v-model="panel1"
        title="Personal Information"
        description="Name, birthdate, and avatar"
      >
        <p>
          This is the content of the expansion panel. It can contain any arbitrary HTML or components.
          For example, a form to edit your personal details could go here.
        </p>
      </ui-expansion-panel>

      <ui-expansion-panel
        v-model="panel2"
        title="Security Settings"
        description="Password and 2FA (Default Open)"
      >
        <p>
          Security settings are crucial for your account safety.
        </p>
        <ui-button variant="text">
          Change Password
        </ui-button>
      </ui-expansion-panel>

      <ui-expansion-panel
        v-model="panel3"
        title="Disabled Panel"
        description="This panel cannot be opened"
        disabled
      >
        <p>Hidden content.</p>
      </ui-expansion-panel>
    </div>
  </section>
</template>

<style lang="scss">
.ui-test-section__panels {
  display: flex;
  flex-direction: column;
  gap: 8rem; // Gap between panels
}
</style>
