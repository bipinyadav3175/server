import mongoose from "mongoose"

const commentSchema = new mongoose.Schema({
    storyId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Number,
        required: true
    },
    editedAt: {
        type: Number,
        default: null
    }
})

export default mongoose.model('comment', commentSchema)