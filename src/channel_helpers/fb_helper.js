var appConf = require('../../conf/appconf')
function parseIncomingMessage(req) {
    console.log('start of parsing incoming request', JSON.stringify(req.body))
    try {
        let data, valueContext
        data = JSON.parse(JSON.stringify(req.body))
        valueContext = []
        if (data.entry) {
            let entries = data.entry
            entries.forEach((entry) => {
                let messagingEvents = entry.messaging
                if (messagingEvents) {
                    messagingEvents.forEach((event) => {
                        if ((event.message && !event.message.is_echo) || (event.postback && event.postback.payload) || (event.account_linking && event.account_linking.status === 'linked')) {
                            let sender = event.sender.id.toString()
                            let pageId = event.recipient.id.toString()
                            let text
                            if (event.message) {
                                text = event.message.text
                            } else if (event.postback) {
                                text = event.postback.payload
                            } else {
                                // this is to notify user about the features we support for the first time
                                text = '  Hi'
                            }
                            let messageData = {
                                'user': sender,
                                'organization': pageId,
                                'query': text.toLowerCase(),
                                'channel': 'facebook'
                            }
                            if (event.postback) {
                                messageData.type = 'postback'
                            }
                            let valueContextElem = {
                                'messageData': messageData,
                                'appId': req.params['appId']
                            }
                            console.log(valueContextElem, text, sender)
                            valueContext.push(valueContextElem)
                        }
                    })
                }
            })
        }
        return valueContext
    } catch (err) {
        console.error('error while parsing incoming request', err)
    }
}

function sendFBMessage(messageData) {
    console.log('start of sendFBMessage')
    let user, organization, response, messageArray, valueContext
    user = messageData.user
    organization = messageData.organization
    response = messageData.response
    messageArray = typeof (response) === 'string' ? [{
        'text': response
    }] : response
    valueContext = {
        'messageData': messageData
    }

    messageArray.forEach(function (message) {
        request({
            url: appConf.fbUrl,
            qs: {
                access_token: appConf.token
            },
            method: 'POST',
            json: {
                recipient: {
                    id: user
                },
                message: message
            }
        }, (error, response, body) => {
            if (error) {
                console.error(valueContext, 'Error while sending FB message request', error)
            } else {
                console.log(valueContext, "Successfully sent message '%s' to user", JSON.stringify(message))
            }
        })
    })

}

module.exports = {
    parseIncomingMessage,
    sendFBMessage
}