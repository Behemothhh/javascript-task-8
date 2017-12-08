'use strict';

const server = require('express')();
const bodyParser = require('body-parser');

const jsonParser = bodyParser.json();

const messages = {};

let idCounter = 0;

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

    res.json(prepareResponse(message, params.id));
}

function deleteMessage({ params }, res) {
    if (!messages[params.id]) {
        return res.sendStatus(404);
    }
    delete messages[params.id];

    return res.json({ status: 'ok' });
}

function sendMessages({ query }, res) {
    res.json(Object.entries(messages)
        .filter(message => {
            const isToEqual = !query.to || query.to === message[1].to;
            const isFromEqual = !query.from || query.from === message[1].from;

            return isToEqual && isFromEqual;
        })
        .map(message => prepareResponse(message[1], message[0])));
}

function getMessage({ body, query }, res) {
    if (!body.text) {
        return res.sendStatus(400);
    }
    const newMessage = { text: body.text };
    if (query.from) {
        newMessage.from = query.from;
    }
    if (query.to) {
        newMessage.to = query.to;
    }
    const id = idCounter++;

    messages[id] = newMessage;

    res.json(prepareResponse(newMessage, id));
}

function prepareResponse(message, id) {
    return Object.assign({ id }, message);
}

module.exports = server;
