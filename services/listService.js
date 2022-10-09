import List from "../models/listModel.js"
import Story from "../models/StoryModel.js";
import User from "../models/UserModel.js";

class ListService {
    async chooseThumb(listId, storyToBeAdded = undefined) {

        let thumb = null

        let list;
        try {
            const l = await List.findById(listId.toString(), "id list")
            if (!l) {
                return null
            }
            list = l.list
        } catch (err) {
            console.log(err)
            return null
        }

        // Add the story to list
        let newList = []
        if (storyToBeAdded) {
            newList = [...list, storyToBeAdded]
        } else {
            newList = list
        }


        for (let i = 0; i < newList.length; i++) {
            const storyId = newList[i].toString()

            let story;
            try {
                story = await Story.findById(storyId, "thumb")

            } catch (err) {
                console.log(err)
            }

            if (!story) {
                continue
            }

            if (story.thumb) {
                thumb = story.thumb
                break
            }
        }

        return thumb

    }

    async isAddedToList({ email, userId } = { email: null, userId: null }, storyId) {
        if (!storyId) {
            return false
        }
        if (!email && !userId) {
            return false
        }

        let l = [];
        try {
            let u;
            if (email) {
                u = await User.findOne({ email: email }, "lists")
            } else {
                u = await User.findById(userId.toString(), "lists")
            }

            if (!u || !u.lists) {
                return false
            }

            for (let i = 0; i < u.lists.length; i++) {
                const lId = u.lists[i]

                const a = await List.findById(lId.toString(), "list")

                for (let g = 0; g < a.list.length; g++) {
                    const id = a.list[g]
                    l.push(id.toString())
                }
            }

        } catch (err) {
            console.log(err)
            return false
        }

        if (l.includes(storyId.toString())) {
            return true
        }

        return false
    }
}

export default new ListService()