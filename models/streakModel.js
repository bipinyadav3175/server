import mongoose from "mongoose"

const streakSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        unique: true
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    dates: {
        date: {
            timeSpent: {
                type: Number,
                default: 0
            }
        }
    }
})

export default mongoose.model('streak', streakSchema)