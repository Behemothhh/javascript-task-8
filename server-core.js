'use strict';

const server = require('express')();
const bodyParser = require('body-parser');
const shortid = require('shortid');

const jsonParser = bodyParser.json();

const messages = {};

server.route('/messages')
    .get(sendMessages)
    .post(jsonParser, getMessage);

server.route('/messages/:id')
    .delete(deleteMessage)
    .patch(jsonParser, editMessage);


function editMessage({ body, params }, res) {
    const message = messages[params.id];
    if (!message) {
        return res.sendStatus(404);
    }
    if (!body.text) {
        return res.sendStatus(400);
    }
    message.text = body.text;
    message.edited = true;

    res.json(message);
}

function deleteMessage({ params }, res) {
    if (!messages[params.id]) {
        return res.sendStatus(404);
    }
    delete messages[params.id];

    return res.json({ status: 'ok' });
}

function sendMessages({ query }, res) {
    res.json(Object.values(messages)
        .filter(message => {
            const isToEqual = !query.to || query.to === message.to;
            const isFromEqual = !query.from || query.from === message.from;

            return isToEqual && isFromEqual;
        }));
}

function getMessage({ body, query }, res) {
    if (!body.text) {
        return res.sendStatus(400);
    }
    const id = shortid.generate();
    const newMessage = { id, text: body.text };
    if (query.from) {
        newMessage.from = query.from;
    }
    if (query.to) {
        newMessage.to = query.to;
    }

    messages[id] = newMessage;

    res.json(newMessage);
}

module.exports = server;
