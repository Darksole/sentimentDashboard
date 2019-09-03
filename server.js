"use strict";
require("dotenv").config();
const fs = require("fs");
const path = require("path");
var http = require("http");
var HttpDispatcher = require("httpdispatcher");
var WebSocketServer = require("websocket").server;
const Speech = require("@google-cloud/speech");
const language = require("@google-cloud/language");
const client = new language.LanguageServiceClient();
var dispatcher = new HttpDispatcher();
var wsserver = http.createServer(handleRequest);
let app = require("express");
const HTTP_SERVER_PORT = 80;

var http = require("http");
var server = http.createServer(app).listen(8081);
var io = require("socket.io")(server);
const speech = new Speech.SpeechClient();

var mediaws = new WebSocketServer({
  httpServer: wsserver,
  autoAcceptConnections: true
});

function handleRequest(request, response) {
  try {
    dispatcher.dispatch(request, response);
  } catch (err) {
    console.log(err);
  }
}

dispatcher.onPost("/twiml", function(req, res) {
  console.log(new Date() + "POST TwiML");

  var filePath = path.join(__dirname + "/templates", "streams.xml");
  var stat = fs.statSync(filePath);

  res.writeHead(200, {
    "Content-Type": "text/xml",
    "Content-Length": stat.size
  });

  var readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

mediaws.on("connect", function(connection) {
  console.log(new Date() + "Media WS: Connection accepted");
  new TranscriptionStream(connection);
});

class TranscriptionStream {
  constructor(connection) {
    this.streamCreatedAt = null;
    this.stream = null;

    connection.on("message", this.processMessage.bind(this));
    connection.on("close", this.close.bind(this));
  }

  processMessage(message) {
    if (message.type === "utf8") {
      var data = JSON.parse(message.utf8Data);
      if (data.sequenceNumber == 1) {
        console.log(
          new Date() +
            "Media WS: received media and metadata: " +
            JSON.stringify(data)
        );
      }
      this.getStream().write(data.payload);
    } else if (message.type === "binary") {
      console.log(
        new Date() + "Media WS: binary message received (not supported)"
      );
    }
  }

  close() {
    console.log(new Date() + "Media WS: closed");

    if (this.stream) {
      this.stream.destroy();
    }
  }

  newStreamRequired() {
    if (!this.stream) {
      return true;
    } else {
      const now = new Date();
      const timeSinceStreamCreated = now - this.streamCreatedAt;
      return timeSinceStreamCreated / 1000 > 60;
    }
  }

  getStream() {
    if (this.newStreamRequired()) {
      if (this.stream) {
        this.stream.destroy();
      }

      var request = {
        config: {
          encoding: "MULAW",
          sampleRateHertz: 8000,
          languageCode: "en-US",
          alternativeLanguageCodes: [`es-ES`, `en-US`]
        },
        interimResults: false
      };

      this.streamCreatedAt = new Date();
      this.stream = speech
        .streamingRecognize(request)
        .on("error", console.error)
        .on("data", this.onTranscription.bind(this));
    }

    return this.stream;
  }

  onTranscription(data) {
    var result = data.results[0];
    if (result === undefined || result.alternatives[0] === undefined) {
      return;
    }

    var transcription = result.alternatives[0].transcript;

    // Prepares a document, representing the provided text
    const document = {
      content: transcription,
      type: "PLAIN_TEXT"
    };

    // Detects the sentiment of the document
    client.analyzeEntitySentiment({ document: document }).then(results => {
      console.log(results[0]);
      io.emit("hello", {
        results: results[0],
        transcription
      });
    });
    console.log(new Date() + "Transcription: " + transcription);
  }
}

wsserver.listen(HTTP_SERVER_PORT, function() {
  console.log("Server listening on: http://localhost:%s", HTTP_SERVER_PORT);
  io.on("connect", socket => {});
});
