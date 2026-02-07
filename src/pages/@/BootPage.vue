<template>
<q-page-container>
  <q-page class="content">
    <div class="text-center q-pa-xs q-pt-md">
      <h1>Docsector Reader</h1>

      <p class="caption">
        {{ $t('_.home.texts[0]') }}
        <a :href="projectUrl" target="_blank">{{ projectName }}</a>!
      </p>
      <hr />
    </div>

    <div class="q-pa-md" style="max-width: 700px; margin: 0 auto;">
      <h3 class="text-center q-mb-md">Quick Links</h3>

      <q-list bordered separator class="rounded-borders">
        <q-item clickable to="/guide/getting-started/overview">
          <q-item-section avatar>
            <q-icon name="flag" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Getting Started</q-item-label>
            <q-item-label caption>Installation, setup, and project structure</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>

        <q-item clickable to="/guide/configuration/overview">
          <q-item-section avatar>
            <q-icon name="tune" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Configuration</q-item-label>
            <q-item-label caption>docsector.config.js reference</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>

        <q-item clickable to="/guide/pages-and-routing/overview">
          <q-item-section avatar>
            <q-icon name="route" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Pages &amp; Routing</q-item-label>
            <q-item-label caption>Page registry and route generation</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>

        <q-item clickable to="/manual/components/d-page/overview">
          <q-item-section avatar>
            <q-icon name="widgets" color="secondary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Components</q-item-label>
            <q-item-label caption>DPage, DPageSection, DH1–DH6, DMenu, and more</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>

        <q-item clickable to="/manual/composables/use-navigator/overview">
          <q-item-section avatar>
            <q-icon name="navigation" color="accent" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Composables</q-item-label>
            <q-item-label caption>useNavigator — anchor navigation and ToC</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>

        <q-item clickable to="/manual/store/modules/overview">
          <q-item-section avatar>
            <q-icon name="storage" color="deep-orange" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Vuex Store</q-item-label>
            <q-item-label caption>App, I18n, Page, Layout, Settings modules</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</q-page-container>
</template>

<script setup>
import docsectorConfig from 'docsector.config.js'

const projectName = docsectorConfig.branding?.name || 'My Project'
const projectUrl = docsectorConfig.links?.github || '#'
</script>
