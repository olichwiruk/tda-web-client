import Vue from 'vue'

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import axios from 'axios'
import VueSession from 'vue-session'
import VueNoty from 'vuejs-noty'
import 'vuejs-noty/dist/vuejs-noty.css'

import App from './App'
import router from './router'
import store from './store'
import './styles/quasar.sass'
import '@quasar/extras/material-icons/material-icons.css'
import { Quasar } from 'quasar'

Vue.use(VueSession)
Vue.use(VueNoty)
Vue.use(Quasar);
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app');
