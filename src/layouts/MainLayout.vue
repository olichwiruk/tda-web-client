<template>
  <q-layout
    view="hHh lpR fFf"
    class="bg-grey-1"
  >
    <q-header
      elevated
      class="text-white q-py-xs"
      height-hint="58"
    >
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
          icon="menu"
        />

        <q-toolbar-title shrink>
          {{ connection.label }}
        </q-toolbar-title>

        <q-space />

        <q-btn
          flat
          no-caps
          no-wrap
          class="q-ml-xs"
          v-if="$q.screen.gt.xs"
        >
          <q-toolbar-title
            shrink
            class="text-weight-bold"
          >
            Trusted Digital Assistant
          </q-toolbar-title>
        </q-btn>

        <q-space />

        <div class="q-gutter-sm row items-center no-wrap">
          <q-btn
            round
            dense
            flat
            color="white"
            icon="message"
            v-if="$q.screen.gt.sm"
          >
            <q-tooltip>Messages</q-tooltip>
          </q-btn>

          <!-- <q-btn -->
          <!--   round -->
          <!--   dense -->
          <!--   flat -->
          <!--   color="white" -->
          <!--   icon="notifications" -->
          <!--   @click="isRightDrawerOpen = !isRightDrawerOpen" -->
          <!--   > -->
          <!--   <q-badge -->
          <!--     v-if="pendingRequests.length > 0" -->
          <!--     color="red" -->
          <!--     text-color="white" -->
          <!--     floating -->
          <!--     > -->
          <!--     {{pendingRequests.length}} -->
          <!--   </q-badge> -->
          <!--     <q-tooltip>Notifications</q-tooltip> -->
          <!-- </q-btn> -->
          <q-btn
            round
            flat
          >
            <q-avatar size="26px">
              <img src="https://cdn.quasar.dev/img/boy-avatar.png">
            </q-avatar>
            <q-tooltip>Account</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- <notification-drawer -->
    <!--   :isOpen="isRightDrawerOpen" -->
    <!--   @toggleDrawer="(val) => isRightDrawerOpen = val" -->
    <!--   @refreshRequests="(req) => pendingRequests = req" -->
    <!--   /> -->

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-blue-2"
      :width="240"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <div
            v-for="(modulesBlock, i) in modules"
            :key="i"
          >
            <q-item
              v-for="module in modulesBlock"
              :key="module.title"
              :to="module.path"
              v-ripple
              clickable
            >
              <q-item-section avatar>
                <q-icon
                  color="white"
                  :name="module.icon"
                />
              </q-item-section>
              <q-item-section class="text-white">
                <q-item-label>{{ module.title }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator class="q-my-md" />
          </div>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { ref } from 'vue'
import { Vue, setup } from 'vue-class-component'
import { connectionFromStore } from '../connection_detail'
import Storage from '../storage'

export default class MainLayout extends Vue {
  leftDrawerOpen = false
  connection = { label: 'loading...' }

  created () {
    const agentConnection = Storage.get(Storage.Record.AgentConnection)
    if (agentConnection) {
      this.connection = connectionFromStore(JSON.parse(agentConnection))
    }
  }

  modules = setup(() => {
    const basePath = '/agent'

    return ref([
      [
        {
          title: 'My Documents',
          icon: 'subscriptions',
          path: `${basePath}/my-credentials`
        },
        {
          title: 'Address Book',
          icon: 'contacts',
          path: `${basePath}/connections`
        }
      ],
      [
        {
          title: 'Services',
          icon: 'store',
          path: `${basePath}/services`
        },
        {
          title: 'Consent management',
          icon: 'health_and_safety',
          path: `${basePath}/consents`
        }
      ],
      [
        {
          title: 'Settings',
          icon: 'settings',
          path: `${basePath}/settings`
        },
        {
          title: 'Help', icon: 'help', path: '/help'
        }
      ]
    ])
  })
}
</script>
