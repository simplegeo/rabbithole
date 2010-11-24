var amqp = require('amqp');

var AmqpClient = module.exports = function(host) {
  var connection,
      ready,
      exchanges = [],
      callbacks = [];

  function connect(host) {
    connection = amqp.createConnection({host: host});

    connection.on('error', function(err) {
      console.log(err.stack);
    });

    connection.addListener('ready', function() {
      ready = true;
      console.log("connected: ", host);
      if (callbacks.length > 0) {
        callbacks.forEach(function(func) {
          func(c);
        });
        callbacks = [];
      }
    });

    connection.addListener('close', function() {
      ready = false;
      exchanges = [];
      console.log("lost connection: ", host);
      setTimeout(function() {
        connect(host);
      }, 5000);
    });
  };

  connect(host);

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
          // console.log("connection.publish: ", routingKey, JSON.stringify(options), message);
          conn.publish(routingKey, message);
        } else {
          // console.log("exchange.publish: ", exchange, routingKey, JSON.stringify(options), message);
          var e = exchanges[exchange] || (exchanges[exchange] = conn.exchange(exchange, options));
          e.publish(routingKey, message, options);
        }
      });
    }
  }
}

