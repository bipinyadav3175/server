class UtilityService {

    /**
     * Get all the fields that are required by the user in GET request
     * @param {Object} query object
     * @returns Array of required fields by user
     */

    getRequiredFields(query) {
        let reqFields = []

        for (let key in query) {
            let value = Boolean(query[key])

            if (value === true) {
                reqFields.push(key)
            }
        }

        return reqFields
    }

    getRequiredData(fullData, requiredFields) {

        if (requiredFields.length == 0) {
            return fullData
        }

        let reqData = {}

        for (let i = 0; i < requiredFields.length; i++) {
            const field = requiredFields[i]

            if (fullData.hasOwnProperty('id') || fullData.hasOwnProperty('_id')) {
                reqData['id'] = fullData['id'] || fullData['_id']
            }

            if (fullData.hasOwnProperty(field)) {
                reqData[field] = fullData[field]
            }
        }

        return reqData

    }
}

export default new UtilityService()