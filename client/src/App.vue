<template>
  <div id="app">
    <v-app>
      <v-toolbar color="primary" app>
        <v-toolbar-title class="white--text">Demo App</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn outline @click="clear()">CLEAR</v-btn>
      </v-toolbar>
      <v-content>
        <v-container fluid>
          <v-layout column>
            <v-card v-for="(msg, indx) in messages" :key="indx">
              <v-card-text class="title">{{ msg.transcription }}</v-card-text>
              <v-layout row wrap>
                <v-card
                  class="ma-1"
                  xs3
                  v-for="(ent, ind) in msg.results.entities"
                  :key="ind"
                  :color="getSentColor(ent.sentiment.score)"
                >
                  <v-card-title>{{ ent.name }}</v-card-title>

                  <v-layout class="ma-1" column>
                    <v-chip :color="getColor(ent.type)">
                      {{ ent.type }}
                    </v-chip>
                    <div class="subheading">Salience: {{ ent.salience }}</div>
                    <div class="subheading">
                      Sentiment: {{ ent.sentiment.score }}
                    </div>
                  </v-layout>
                </v-card>
              </v-layout>
            </v-card>
          </v-layout>
        </v-container>
      </v-content>
      <v-footer app></v-footer>
    </v-app>
  </div>
</template>

<script>
export default {
  name: "app",
  components: {},
  data() {
    return {
      msg: "",
      entity: [],
      messages: []
    };
  },
  methods: {
    clear() {
      this.messages = [];
    },
    getColor(type) {
      if (type === "ORGANIZATION") {
        return "deep-purple lighten-3";
      } else if (type === "PERSON") {
        return "blue lighten-3";
      } else if (type === "CONSUMER_GOOD") {
        return "yellow lighten-3";
      } else if (type === "LOCATION") {
        return "green lighten-3";
      } else if (type === "ADDRESS") {
        return "orange lighten-3";
      } else if (type === "OTHER") {
        return "teal lighten-3";
      } else if (type === "ADDRESS") {
        return "brown lighten-3";
      } else {
        return "";
      }
    },
    getSentColor(score) {
      if (score < 0) {
        return "error";
      } else if (score > 0 && score < 0.3) {
        return "green lighten-3";
      } else if (score === 0) {
        return "warning";
      } else if (score > 0.3) {
        return "success";
      } else {
        return "";
      }
    }
  },
  sockets: {
    hello(data) {
      // eslint-disable-next-line
      console.log(data);
      this.messages.unshift(data);
      this.msg = data.transcription;
      this.entity = data.results.entities;
    }
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
