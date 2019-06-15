const amqp = require('amqplib/callback_api');
let connection = {};

function createChannel(address, callback = () => {}) {
  return new Promise((resolve, reject) => {

    if (!connection[address]) {
      amqp.connect(address, (err, conn) => {
        if (err) {
          reject(err);
          return callback(err);
        }
        connection[address] = conn;
        conn.createChannel((err, ch) => {
          if (err) {
            reject(err);
            return callback(err);
          }
          resolve(ch);
          // ch.sendToQueue(CONVERT_QUEUE, new Buffer(JSON.stringify({videoId: '5c98f40f3fe26b11ed1a50aa'})))
          return callback(null, ch)
        })
      })
    } else {
      connection[address].createChannel((err, ch) => {
        if (err) {
          reject(err);
          return callback(err);
        }
        resolve(ch);
        // ch.sendToQueue(CONVERT_QUEUE, new Buffer(JSON.stringify({videoId: '5c98f40f3fe26b11ed1a50aa'})))
        return callback(null, ch)
      })
    }
  })
}

module.exports = {
  createChannel,
}