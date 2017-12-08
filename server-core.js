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
    const id = params.id;
    if (typeof body.text !== 'string' || !messages[id]) {
        return res.sendStatus(400);
    }
    messages[id].text = body.text;
    messages[id].edited = true;

    res.json(prepareResponse(messages[id], id));
}

function deleteMessage({ params }, res) {
    if (!messages[params.id]) {
        return res.sendStatus(400);
    }
    delete messages[params.id];

    return res.json({ status: 'ok' });
}

function sendMessages({ query }, res) {
    res.json(Object.entries(messages)
        .filter(message => {
            const isToEqual = !query.to || low(query.to) === low(message[1].to);
            const isFromEqual = !query.from || low(query.from) === low(message[1].from);

            return isToEqual && isFromEqual;
        })
        .map(message => prepareResponse(message[1], message[0])));
}

function getMessage({ body, query }, res) {
    if (typeof body.text !== 'string') {
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

function low(text) {
    if (typeof text !== 'string') {
        return false;
    }

    return text.toLowerCase();
}

function prepareResponse(message, id) {
    return Object.assign({ id }, message);
}

module.exports = server;
