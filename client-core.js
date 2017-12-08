
'use strict';

module.exports.execute = execute;
module.exports.isStar = true;

const got = require('got');
const ArgumentParser = require('argparse').ArgumentParser;
const chalk = require('chalk');
const parser = new ArgumentParser();
const url = 'http://localhost/messages/';

parser.addArgument('command', {
    help: 'command name',
    choices: ['list', 'send', 'delete', 'edit']
});

parser.addArgument('--from', { help: 'message sender' });
parser.addArgument('--to', { help: 'message recipient' });
parser.addArgument('--text', { help: 'message text' });
parser.addArgument('--id', { help: 'message id' });
parser.addArgument('-v', { help: 'show message details', action: 'storeTrue' });

function execute() {
    // Внутри этой функции нужно получить и обработать аргументы командной строки
    const args = parser.parseArgs();
    console.info(args);
    switch (args.command) {
        case 'list':
            return listFunction(args);
        case 'send':
            return sendFunction(args);
        case 'delete':
            return deleteFunction(args);
        case 'edit':
            return editFunction(args);
        default:
            break;
    }

}

function listFunction(args) {
    const options = { json: true, port: 8080 };
    if (args.from || args.to) {
        options.query = createQuery(args);
    }

    return got(url, options)
        .then(response => response.body
            .reduce((answer, element) => answer.concat(prepareText(element, args)), [])
            .join('\n\n'));
}

function sendFunction(args) {
    const options = {
        method: 'POST',
        json: true,
        port: 8080,
        body: { text: args.text }
    };
    if (args.from || args.to) {
        options.query = createQuery(args);
    }

    return got(url, options)
        .then(response => prepareText(response.body, args));
}

function deleteFunction(args) {
    if (!args.id) {
        return Promise.reject(new Error('No id'));
    }

    return got(url + args.id, {
        method: 'DELETE',
        port: 8080,
        json: true
    })
        .then(response => {
            if (response.body.status === 'ok') {
                return 'DELETED';
            }
        });
}

function editFunction(args) {
    if (!args.id || !args.text) {
        return Promise.reject(new Error('No id or text'));
    }

    return got(url + args.id, {
        method: 'PATCH',
        port: 8080,
        json: true,
        body: { text: args.text }
    })
        .then(response => prepareText(response.body, args));
}

function prepareText(data, { v }) {
    let tempAnswer = '';
    if (v && data.id) {
        tempAnswer += (chalk.hex('#FF0')('ID') + ': ' + data.id + '\n');
    }
    if (data.from) {
        tempAnswer += (chalk.hex('#F00')('FROM') + ': ' + data.from + '\n');
    }
    if (data.to) {
        tempAnswer += (chalk.hex('#F00')('TO') + ': ' + data.to + '\n');
    }
    if (data.text) {
        const editedText = data.edited ? chalk.hex('#777')('(edited)') : '';
        tempAnswer += (chalk.hex('#0F0')('TEXT') + ': ' + data.text + editedText);
    }

    return tempAnswer;
}

function createQuery(args) {
    const tempQuery = {};
    if (args.from) {
        tempQuery.from = args.from;
    }
    if (args.to) {
        tempQuery.to = args.to;
    }

    return tempQuery;
}
