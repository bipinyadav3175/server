import Streak from "../models/streakModel.js"
import userService from "../services/userService.js"
import dateTimeService from "../services/dateTimeService.js"
import utility from "../services/utilityService.js"

class StreakController {

    async update(req, res) {
        const email = req.email
        const read = req?.body?.read

        if (!read) {
            return res.json({ message: "No time spent reading" })
        }


        let streak;
        let newDocument = false;
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
            newDocument = true

            streak = {
                userId: userId,
                currentStreak: 0,
                longestStreak: 0,
                dates: {}
            }

            streak.dates[todaysDate] = {
                timeSpent: read,
                completed: false
            }
        }

        // Update time spent
        if (streak.dates[todaysDate] && streak.dates[todaysDate].timeSpent) {

            streak.dates[todaysDate].timeSpent = streak.dates[todaysDate].timeSpent + read

        } else {
            streak.dates[todaysDate] = {
                timeSpent: read,
                completed: false
            }
        }


        if (!streak.dates[todaysDate].completed) {
            // Todays streak completed or not after sending this request
            if (streak.dates[todaysDate].timeSpent >= 60 * 10) { // 10 minutes
                completed = true
                streak.dates[todaysDate].completed = true
            } else {
                streak.dates[todaysDate].completed = false
            }

            // Check that the streak is continued or broke
            const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // 86400000
            const yesterdaysDate = dateTimeService.formatDate(new Date() - oneDayInMilliseconds)

            if (streak.dates[yesterdaysDate] && streak.dates[yesterdaysDate].completed) {
                if (streak.dates[todaysDate] && streak.dates[todaysDate].completed) {
                    streak.currentStreak = streak.currentStreak + 1
                    if (streak.currentStreak > streak.longestStreak) {
                        streak.longestStreak = streak.currentStreak
                    }
                }
            } else {
                // The streak is broken
                streak.currentStreak = 0

            }

            // For first streak
            if (streak.currentStreak === 0 && streak.dates[todaysDate] && streak.dates[todaysDate].completed) {
                streak.currentStreak = 1

                if (streak.currentStreak > streak.longestStreak) {
                    streak.longestStreak = streak.currentStreak
                }
            }
        } else {
            completed = true
        }


        // Save the streak data
        try {
            if (newDocument) {
                const s = new Streak({
                    userId: userId,
                    dates: streak.dates,
                    currentStreak: streak.currentStreak,
                    longestStreak: streak.longestStreak
                })

                await s.save()
            } else {
                await Streak.findOneAndUpdate({ userId }, {
                    currentStreak: streak.currentStreak,
                    dates: streak.dates,
                    longestStreak: streak.longestStreak
                })
            }

        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        return res.json({
            success: true, streak: {
                completedToday: completed,
                currentStreak: streak.currentStreak
            }
        })

    }

    async getDetails(req, res) {
        const email = req.email
        const requiredFields = utility.getRequiredFields(req?.query)

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
        const dateKeys = Object.keys(streak.dates)

        // Streak for the day is completed or not
        let completed = false;

        for (let i = 0; i < dateKeys.length; i++) {
            let key = dateKeys[i]
            const { month, year, date } = dateTimeService.splitDate(key)
            const { month: currentMonth, year: currentYear, date: currentDate } = dateTimeService.splitDate(new Date())

            if (month === currentMonth && streak.dates[key].timeSpent >= 60 * 10) { // 10 minutes
                currentMonthDates[key] = streak.dates[key]
            }

        }

        const todaysDate = dateTimeService.formatDate(new Date())

        // Check for today streak completion
        if (streak.dates[todaysDate] && streak.dates[todaysDate].completed) {
            completed = true
        }

        // Check for broken streak
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // 86400000
        const yesterdaysDate = dateTimeService.formatDate(new Date() - oneDayInMilliseconds)
        if ((!streak.dates[yesterdaysDate] || !streak.dates[yesterdaysDate].completed) && !completed) {
            streak.currentStreak = 0

            // Save streak Data
            try {
                await Streak.findOneAndUpdate({ userId }, {
                    currentStreak: 0
                })
            } catch (err) {
                console.log(err)
            }
        }


        const rawData = {
            currentStreak: streak.currentStreak,
            dates: currentMonthDates,
            completed,
            longestStreak: streak.longestStreak
        }
        const requiredData = utility.getRequiredData(rawData, requiredFields)

        return res.json({
            success: true,
            streak: requiredData
        })

    }


}

export default new StreakController()