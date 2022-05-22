import mongoose from "mongoose"

const storySchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
    },
    ownerName: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    dateCreated: {
        type: Number,
        required: true
    },
    data: [
        {
            type: { type: String },
            markup: {
                type: Array,
                default: null
            },
            content: {
                type: String,
                default: null
            },
            url: {
                type: String,
                default: null
            },
            aspectRatio: {
                type: Number,
                default: null
            },
            itemId: {
                type: String
            }
        }
    ],
    tags: [String],
    category: {
        type: String,
        required: true
    },
    thumb: {
        type: String,
        default: null
    },
    likes: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    impressions: {
        type: Number,
        default: 0
    },
    bodyPreview: {
        type: String,
        default: null
    },
    timeToRead: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

export default mongoose.model("story", storySchema)