class DateTimeService {
    formatDate(raw) {
        if (!raw) {
            raw = new Date()
        }

        const dateObject = new Date(raw)
        const year = dateObject.getUTCFullYear()
        const month = dateObject.getUTCMonth() + 1
        const date = dateObject.getUTCDate()

        const cleanDate = year + '-' + String(month).padStart(2, '0') + '-' + String(date).padStart(2, '0')

        return cleanDate
    }

    splitDate(raw) {
        const dateObject = new Date(raw)
        const year = dateObject.getUTCFullYear()
        const month = dateObject.getUTCMonth() + 1
        const date = dateObject.getUTCDate()

        return {
            year,
            month,
            date
        }
    }

}

export default new DateTimeService()