
function generateCreateMessage({ user, date }) {
    return `{{ReadShow|read=|show=Human voice added by [[User:${user}]] on ${date} }} <br /> \n`
}

function generateUpdateMessage({ user, date, sections }) {
    return `{{ReadShow|read=|show=Human voice updated by [[User:${user}]] for sections ${sections.join(',')} on ${date}}} <br />\n`;
}

function validateMessageContent({title, wikiSource, user, date, type, sections}) {
    if (!title || !wikiSource || !user || !date || !type) {
        return { valid: false, message: 'title, wikiSource, user, date and type fields are required' };
    }
    if (type === 'update' && !sections) {
        return { valid: false, message: 'sections field is required with update operation' };
    }
    if (type !== 'create' && type !== 'update') {
        return { valid: false, message: 'type should be only create and update' };
    }
    return { valid: true };
}

function parseContentToMessage(content) {
    let validateResult = validateMessageContent(content);
    if (!validateResult.valid) {
        return validateResult;
    }

    if (content.type === 'create') {
        return { valid: true, message: generateCreateMessage(content) };
    } else if (content.type === 'update') {
        return { valid: true, message: generateUpdateMessage(content) };
    } else {
        return { valid: false, message: 'Invalid type' };
    }
}

module.exports = {
    parseContentToMessage,
}