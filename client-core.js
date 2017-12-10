
'use strict';

module.exports.execute = execute;
module.exports.isStar = true;

const got = require('got');
const ArgumentParser = require('argparse').ArgumentParser;
const chalk = require('chalk');
const parser = new ArgumentParser();
const URL = 'http://localhost/messages/';
const PORT = 8080;

parser.addArgument('command', {
    help: 'command name',
    choices: ['list', 'send', 'delete', 'edit']
});
parser.addArgument('--from', { help: 'set message sender' });
parser.addArgument('--to', { help: 'set message recipient' });
parser.addArgument('--text', { help: 'set message text' });
parser.addArgument('--id', { help: 'set message id' });
parser.addArgument('-v', { help: 'show message id', action: 'storeTrue' });

function execute() {
    // Внутри этой функции нужно получить и обработать аргументы командной строки
    const args = parser.parseArgs();
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
            Promise.reject('Bad command');
            break;
    }
}

function listFunction(args) {
    return got(URL, setOptions('GET', args))
        .then(response => response.body
            .reduce((answer, element) => answer.concat(prepareText(element, args)), [])
            .join('\n\n'));
}

function sendFunction(args) {
    return got(URL, setOptions('POST', args))
        .then(response => prepareText(response.body, args));
}

function deleteFunction(args) {
    if (!args.id) {
        return Promise.reject(new Error('No id'));
    }

    return got(URL + args.id, setOptions('DELETE'))
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

    return got(URL + args.id, setOptions('PATCH', args))
        .then(response => prepareText(response.body, args));
}

function prepareText(data, { v }) {
    let tempAnswer = '';
    if (v) {
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

function setOptions(method, { text, to, from }) {
    const tempOptions =
    {
        method,
        json: true,
        port: PORT,
        query: to || from ? {} : undefined
    };
    if (to) {
        tempOptions.query.to = to;
    }
    if (from) {
        tempOptions.query.from = from;
    }
    if (text) {
        tempOptions.body = { text };
    }

    return tempOptions;
}
