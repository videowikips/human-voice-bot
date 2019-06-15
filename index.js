require('dotenv').config({ path: '.env' });
const rabbitmqServer = process.env.RABBITMQ_SERVER;
const botToken = process.env.MEDIAWIKI_ACCESS_TOKEN;
const botSecret = process.env.MEDIAWIKI_ACCESS_TOKEN_SECRET;

const rabbitMQService = require('./vendors/rabbitmq');
const wikiUtils = require('./utils/wiki');
const messageParser = require('./messageParser');
/*
    Params:
        - title: the title of the article
        - wikiSource: the wikipedia of the article
        - user: the name of the user who made the change
        - date: the date of the change
        - type: the type of the change
            - create: for a new human voice export
            - update: for updating specific sections
        - sections: array of section names that have been update with message
            of type update
*/
const createParams = {
    title: 'User:Hassan.m.amin/sandbox',
    wikiSource: 'https://en.wikipedia.org',
    user: 'Hassan.m.amin',
    date: new Date(),
    type: 'create'
}

const updateParams = {
    title: 'User:Hassan.m.amin/sandbox',
    wikiSource: 'https://en.wikipedia.org',
    user: 'Hassan.m.amin',
    date: new Date(),
    type: 'update',
    sections: ['Overview', 'After overview'],
}
const HUMAN_VOICE_QUEUE = 'HUMAN_VOICE_QUEUE';
let channel;

rabbitMQService.createChannel(rabbitmqServer)
.then((ch) => {
    channel = ch;
    ch.prefetch(1);
    ch.assertQueue(HUMAN_VOICE_QUEUE, { durable: true });
    ch.consume(HUMAN_VOICE_QUEUE, onHumanVoiceExport,  { noAck: false });
    setTimeout(() => {
        // ch.sendToQueue(HUMAN_VOICE_QUEUE, new Buffer(JSON.stringify(updateParams)), { persistent: true });
    }, 2000);
})
.catch((err) => {
    throw err;
})

function onHumanVoiceExport(msg) {
    const content = JSON.parse(msg.content.toString());
    let parsedContent = messageParser.parseContentToMessage(content);
    if (!parsedContent.valid) {
        console.log('Invalid content', parsedContent);
        return channel.ack(msg);
    }
    // console.log(content, parsedContent)
    // channel.ack(msg)
    wikiUtils.prependArticleText(title, wikiSource, botToken, botSecret, parsedContent.message)
    .then((res) => {
        console.log('res is', res);
        channel.ack(msg);
    })
    .catch((err) => {
        console.log('error is', err);
        channel.ack(msg);
    })
}
