
(function() {
  var TimeStatistics, app, express, port, timesPerEvent;

  express = require('express');

  TimeStatistics = (function() {
    function TimeStatistics() {
      this.count = 0;
      this.sum = 0;
      this.min = 2e308;
      this.max = 0;
    }

    TimeStatistics.prototype.update = function(sample) {
      this.count += 1;
      this.sum += sample;
      this.min = Math.min(sample, this.min);
      return this.max = Math.max(sample, this.max);
    };

    TimeStatistics.prototype.toString = function() {
      var avg;
      avg = this.sum / this.count;
      return this.count + " messages received, avg: " + (avg.toFixed(1)) + " ms (min: " + (this.min.toFixed(1)) + ", max: " + (this.max.toFixed(1)) + ")";
    };

    return TimeStatistics;

  })();

  timesPerEvent = {};

  app = express();

  app.use(express.bodyParser());

  app.post(/^\/log\/(\w+)$/, function(req, res) {
    var body, diff, event, receivedTime, ref, sentTime;
    receivedTime = Date.now() / 1000.0;
    if (((ref = req.body.message) != null ? ref["default"] : void 0) == null) {
      console.log('No default message!');
      res.send(400);
    }
    body = JSON.parse(req.body.message["default"]);
    if ((body != null ? body.timestamp : void 0) == null) {
      console.log('No timestamp in the body!');
      res.send(400);
    }
    event = req.body.event;
    sentTime = body.timestamp;
    diff = (receivedTime - sentTime) * 1000;
    if (timesPerEvent[event] == null) {
      timesPerEvent[event] = new TimeStatistics();
    }
    timesPerEvent[event].update(diff);
    console.log((event + " ") + timesPerEvent[event].toString());
    return res.send(200);
  });

  port = 5001;

  console.log("Listening on port " + port);

  app.listen(port);

}).call(this);
