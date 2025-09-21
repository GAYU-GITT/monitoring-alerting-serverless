const axios = require('axios')

module.exports.handler = async (event) => {

    try {
        let message = event.Records[0].Sns.Message
        let snsMessage = JSON.parse(message)
        //
        let pipelineName = snsMessage.detail.pipeline
        let state = snsMessage.detail.state
        let stage = snsMessage.detail.stage
        let time = snsMessage.time
        let reason = snsMessage.additionalAttributes.hasOwnProperty('failedActions') ? snsMessage.additionalAttributes.failedActions[0].additionalInformation : ''
        let environment = process.env.environment

        let messageText = `The ${pipelineName} has ${state} in ${stage} stage at ${time} in ${environment} Environment${reason ? ` Reason: ${reason}` : ''}`

        //
        const apiLink = process.env.API_URL
        let apiConfig = {
            method: "POST",
            url: apiLink,
            data: {
                "text": messageText
            }
        }
        if (state === 'FAILED' && stage) {
            await axios(apiConfig).then(function (response) {
            }).catch(function (err) {
                console.log('Error in chat api call', err)
            })
        }
        return 'Notification successfully send'
        
    } catch (err) {
        console.log('Error in sending notification', err)
    }
}