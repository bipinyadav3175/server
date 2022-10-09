import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    googleSub: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        unique: true,
        default: null
    },
    usernameLastUpdated: {
        type: Number,
        default: null
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: null
    },
    stories: [
        {
            storyId: mongoose.Schema.Types.ObjectId,
            title: {
                type: String,
                required: true
            },
            thumb: {
                type: String,
                default: null
            },
            dateCreated: {
                type: Date,
                default: Date.now
            }
        }
    ],
    noOfStories: {
        type: Number,
        default: 0
    },
    followerCount: {
        type: Number,
        default: 0
    },
    followingCount: {
        type: Number,
        default: 0
    },
    likeCount: {
        type: Number,
        default: 0
    },
    storyViews: {
        type: Number,
        default: 0
    },
    rank: {
        type: String,
        enum: ["Starter", "Champ", "Achiever", "Player", "Coach", "Pro", "Star", "Intel", "Wise", null],
        default: null
    },
    rankIndex: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, null],
        default: null
    },
    avatar_50: {
        type: String,
        default: null
    },
    avatar_200: {
        type: String,
        default: null
    },
    history: [
        {
            storyId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            title: {
                type: String,
                required: true
            },
            thumb: {
                type: String,
                default: null
            },
            ownerName: {
                type: String,
                required: true
            },
            ownerId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            category: {
                type: String,
                required: true
            }
        }
    ],
    likedStories: [
        {
            storyId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            title: {
                type: String,
                required: true
            },
            thumb: {
                type: String,
                default: null
            },
            ownerId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            category: {
                type: String,
                required: true
            }
        }
    ],
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
        }
    ],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId
        }
    ],
    lists: [
        {
            type: mongoose.Schema.Types.ObjectId
        }
    ]
}, { timestamps: true })

export default mongoose.model("user", userSchema)