var amqp = require('amqp');

var AmqpClient = module.exports = function(config) {
  var connection,
      ready,
      exchanges = [],
      callbacks = [];

  function connect(config) {
    connection = amqp.createConnection(config);

    connection.on('error', function(err) {
      console.log(new Date() + " - " + err.stack);
    });

    connection.addListener('ready', function() {
      ready = true;
      console.log(new Date() + " - connected: ", config.host);
      if (callbacks.length > 0) {
        callbacks.forEach(function(func) {
          func(connection);
        });
        callbacks = [];
      }
    });

    connection.addListener('close', function() {
      ready = false;
      exchanges = [];
      console.log(new Date() + " - lost connection: ", config.host);
      setTimeout(function() {
        connect(config);
      }, 5000);
    });
  };

  connect(config);

  function withClient(callback) {
    if (ready) {
      callback(connection);
    } else {
      callbacks.push(callback);
    }
  }

  return {
    publish: function(routingKey, message, options) {
      options = options || {};
      var exchange = options.exchange;
      delete options.exchange;

      withClient(function(conn) {
        if (exchange === undefined) {
           console.log("connection.publish: ", routingKey, JSON.stringify(options), message);
          conn.publish(routingKey, message);
        } else {
           console.log("exchange.publish: ", exchange, routingKey, JSON.stringify(options), message);
          var e = exchanges[exchange] || (exchanges[exchange] = conn.exchange(exchange, options));
          e.publish(routingKey, message, options);
        }
      });
    }
  }
}

