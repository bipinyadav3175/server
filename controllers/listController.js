import User from "../models/UserModel.js"
import List from "../models/listModel.js"

class ListController {
    async create(req, res) {
        const email = req.email
        const name = req.body?.name

        if (!name) {
            return res.json({ message: "Name is required to create a list" })
        }

        // User
        let user;
        try {
            user = await User.findOne({ email: email }, "id lists")

            if (!user) {
                return res.json({ message: "You doesn't exist in wisdomverse" })
            }

        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Populate all lists
        let lists = [];
        if (user.lists) {
            for (let i = 0; i < user.lists.length; i++) {
                const listId = user.lists[i].toString()

                try {
                    const lst = await List.findById(listId, "id listName")
                    lists.push(lst)
                } catch (err) {
                    console.log(err)
                    return res.json({ message: "Something went wrong" })
                }
            }
        }

        // Check if the user has already creted a list with the same name
        // If created, then inform the user
        for (let i = 0; i < lists.length; i++) {
            const listName = lists[i].listName

            if (name === listName) {
                return res.json({ message: "You have already created a list with this name" })
            }
        }

        // Create a new list
        let createdList;
        try {
            const unsavedList = new List({
                listName: name,
                listOwner: user.id.toString()
            })

            createdList = await unsavedList.save()
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Add the creatd list in users document

        try {
            await User.findByIdAndUpdate(user.id.toString(), {
                lists: user.lists ? [...user.lists, createdList.id] : []
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        return res.json({ message: "List created", success: true, listId: createdList.id })



    }
}

export default new ListController()