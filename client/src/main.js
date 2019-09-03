import Vue from "vue";
import App from "./App.vue";

import VueSocketio from "vue-socket.io-extended";
import io from "socket.io-client";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";
Vue.use(Vuetify);
Vue.use(VueSocketio, io("localhost:8081"));

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
