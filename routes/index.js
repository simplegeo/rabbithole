var express = require('express');
var url = require('url');
var fs = require('fs');

var router = express.Router();

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
  for (var key in args) {
    var value = args[key];
    if (value in conversionMap) {
      converted[key] = conversionMap[value];
    } else if (typeof value === "string" && value.match(/^\d+$/)) {
      converted[key] = parseInt(value);
    } else {
      converted[key] = value;
    }
  };
  return converted;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.writeHead(200);
  res.end("rabbithole: ok\n");
  //res.render('index', { title: 'Express' });
});

router.get('/health', function(req, res) {
  res.writeHead(200);
  res.end("rabbithole: ok\n");
});

router.post('/publish/:exchange/:routingKey', function(req, res) {
  var urlObj = url.parse(req.url, true);
  var options = convertArguments(urlObj.query);
  options.exchange = req.params.exchange;
  var payload = options;
  payload['body'] = req.body;
  
  amqpClient.publish(req.params.routingKey, payload, options);
  res.writeHead(200);
  res.end("ok");
});

router.post('/publish/:queue', function(req, res) {
  var urlObj = url.parse(req.url, true);
  var payload = convertArguments(urlObj.query);
  payload['body'] = req.body;
  amqpClient.publish(req.params.queue, payload);
  res.writeHead(200);
  res.end("ok");
});

module.exports = router;
