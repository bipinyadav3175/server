class CalculateService {
    timeToRead(storyData) {
        var time = 0 // in Minutes
        var totalLetters = 0
        var totalImages = 0

        const averageReadingSpeed = 250 // wpm
        const averageImgViewTime = 1 / 6 // in minutes

        for (let i = 0; i < storyData.length; i++) {
            const story = storyData[i]

            if (story.type === "P") {
                totalLetters = totalLetters + story.content.length
            }
            if (story.type === "IMG") {
                totalImages++
            }
        }

        var totalWords = totalLetters / 5
        time = (totalWords / averageReadingSpeed) + (averageImgViewTime * totalImages) // Time to read words + time to view the images
        time = Math.floor(time)

        if (time === 0) {
            return 1
        }

        return time

    }
}

export default new CalculateService()