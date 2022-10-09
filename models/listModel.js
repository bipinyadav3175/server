import mongoose from "mongoose"

const listSchema = new mongoose.Schema({
    listName: {
        type: String,
        required: true
    },
    noOfStories: {
        type: Number,
        default: 0
    },
    thumb: {
        type: String,
        default: null
    },
    listOwner: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    list: [
        {
            type: mongoose.SchemaTypes.ObjectId,
        }
    ]
})

export default mongoose.model('list', listSchema)