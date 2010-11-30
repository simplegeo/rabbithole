var url = require('url'),
    fs = require('fs');

var connect = require('connect'),
    _ = require('underscore')._;

var AmqpClient = require('./amqp_client');

var configFile = process.env.RABBITHOLE_CONFIG || "/etc/rabbithole.cfg";
var config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

var amqpClient = AmqpClient(config);

var conversionMap = {
  true: true,
  false: false,
  null: null
}

var convertArguments = function(args) {
  var converted = {};

  _.each(args, function(value, key) {
    if (value in conversionMap) {
      converted[key] = conversionMap[value];
    } else if (_.isString(value) && value.match(/^\d+$/)) {
      converted[key] = parseInt(value);
    } else {
      converted[key] = value;
    }
  });

  return args;
}

var server = module.exports = connect.createServer(
  function(req, res, next) {
    var data = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { data += chunk; });
    req.on('end', function() {
      req.body = data;
      next();
    });
  },

  connect.router(function(app) {
    app.get('/health', function(req, res) {
      res.writeHead(200);
      res.end("rabbithole: ok\n");
    });

    app.post('/publish/:exchange/:routingKey', function(req, res) {
      var urlObj = url.parse(req.url, true);
      var options = _.extend({}, convertArguments(urlObj.query));

      options.exchange = req.params.exchange;

      amqpClient.publish(req.params.routingKey, req.body, options);
      res.writeHead(200);
      res.end("ok");
    });

    app.post('/publish/:routingKey', function(req, res) {
      amqpClient.publish(req.params.routingKey, req.body);
      res.writeHead(200);
      res.end("ok");
    });
  })
);
