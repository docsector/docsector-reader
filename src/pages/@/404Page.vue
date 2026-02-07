<template>
<q-page-container>
  <q-page class="row" padding>
    <q-scroll-area class="content col text-center">
      <p>
        <img src="sad.svg" style="width:30vw;max-width:150px;" />
      </p>
      <p class="text-faded">Sorry, nothing here...
        <strong>(404)</strong>
      </p>
      <q-btn color="secondary" style="width:200px;" @click="$router.go(-1)">Go back</q-btn>
    </q-scroll-area>
  </q-page>
</q-page-container>
</template>
