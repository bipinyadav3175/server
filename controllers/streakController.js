import Streak from "../models/streakModel.js"
import userService from "../services/userService.js"
import dateTimeService from "../services/dateTimeService.js"

class StreakController {

    async update(req, res) {
        const email = req.email
        const read = req?.body?.read

        if (!read) {
            return res.json({ message: "No time spent reading" })
        }


        let streak;
        let userId = await userService.getAlternate({ email })
        try {
            streak = await Streak.findOne({ userId })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        const todaysDate = dateTimeService.formatDate()
        let completed = false

        if (!streak) {

            streak = {
                userId: userId,
                currentStreak: read >= 60 * 10 ? 1 : 0,
                longestStreak: read >= 60 * 10 ? 1 : 0
            }
            streak[todaysDate] = {
                timeSpent: read
            }
        } else {
            // Check that the streak is continued
            const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // 86400000
            const yesterdaysDate = dateTimeService.formatDate(new Date() - oneDayInMilliseconds)

            if (streak.dates[yesterdaysDate]) {
                if (!streak.dates[todaysDate]) {
                    streak.currentStreak++
                    if (streak.currentStreak > streak.longestStreak) {
                        streak.longestStreak = streak.currentStreak
                    }
                }
            } else {
                // The streak is broken
                streak.currentStreak = 0

            }

            streak.dates[todaysDate] = {
                timeSpent: streak.dates[todaysDate].timeSpent ? streak.dates[todaysDate].timeSpent + read : read
            }
            if (streak.dates[todaysDate].timeSpent >= 60 * 10) { // 10 minutes
                completed = true
            }
        }

        // Save the streak data
        try {
            await Streak.findOneAndUpdate({ userId }, {
                currentStreak: streak.currentStreak,
                dates: streak.dates
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        return res.json({ success: true, completed })

    }

    async getDetails(req, res) {
        const email = req.email

        let streak;
        let userId = await userService.getAlternate({ email })

        try {
            streak = await Streak.findOne({ userId })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        if (!streak) {
            return res.json({ success: true, currentStreak: 0, dates: {} })
        }

        let currentMonthDates = {}
        const dateKeys = streak.dates.keys()

        for (let i = 0; i < dateKeys.length; i++) {
            let key = dateKeys[i]
            const { month } = dateTimeService.splitDate(key)
            const { month: currentMonth } = dateTimeService.splitDate(new Date())

            if (month === currentMonth && streak.dates[key].timeSpent >= 60 * 10) { // 10 minutes
                currentMonthDates[key] = streak.dates[key]
            }
        }

        return res.json({ success: true, currentStreak: streak.currentStreak, dates: currentMonthDates })

    }


}

export default new StreakController()