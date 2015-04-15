# rabbithole

Rabbithole provides a simple REST /publish endpoint for AMQP servers.

## How to run

    git clone <repo>
    yum install nodejs npm -y
    cd express-rabbithole
    cp rabbithole.cfg.example /etc/rabbithole.cfg
    npm install
    DEBUG=express-rabbithole PORT=9999 ./bin/www

## Endpoints

### `POST /publish/:routingKey`

Publishes the POST body to the default exchange and the given routingKey.

### `POST /publish/:exchange/:routingKey`

Publishes the POST body to the given exchange and routingKey. This has not been tested since converting to expressjs 
## TODO

* READ PORT number from config
* TEST POST /publish/:exchange/:routingKey
