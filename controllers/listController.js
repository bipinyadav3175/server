import User from "../models/UserModel.js"
import List from "../models/listModel.js"
import Story from "../models/StoryModel.js"

import listService from "../services/listService.js"

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
                lists: user.lists ? [...user.lists, createdList.id] : [createdList.id]
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        return res.json({ message: "List created", success: true, listId: createdList.id })



    }

    async getLists(req, res) {
        const email = req.email

        // Get user
        let user;
        try {
            user = await User.findOne({ email: email }, "id lists")

            if (!user) {
                return res.json({ message: "You don't exist in our wisdomverse" })
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        const rawList = user.lists ? user.lists : []

        // Populate the raw List
        let lists = [];

        for (let i = 0; i < rawList.length; i++) {
            const id = rawList[i]

            let l;
            try {
                l = await List.findById(id.toString(), "id listName noOfStories thumb")

                // In case if l is undefined (No such list exists)
                if (!l) {
                    continue
                }

                let c = {}
                c.id = id.toString();
                c.listName = l.listName;
                c.noOfStories = l.noOfStories;
                c.thumb = l.thumb
                lists.push(c)
            } catch (err) {
                console.log(err)
                return res.json({ message: "Something went wrong" })
            }
        }

        return res.json({ success: true, data: lists })

    }

    async getList(req, res) {
        const email = req.email
        const id = req.body?.id

        if (!id) {
            return res.json({ message: "No list id specified!" })
        }

        // Get the list
        let list
        try {
            list = await List.findById(id.toString(), "id listName noOfStories thumb list")

            if (!list) {
                return res.json({ message: "That list doesn't exist" })
            }

        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Populate the list
        let listItems = [];

        // The following loop runs in reverse
        // So that the most recent item be at the top
        for (let i = list.list.length - 1; i >= 0; i--) {
            const sId = list.list[i]

            let s;
            try {
                s = await Story.findById(sId.toString(), "id thumb title ownerId")

                const owner = await User.findById(s.ownerId.toString(), "id name avatar_50 avatar_200")

                let o = {}
                o.id = owner.id.toString()
                o.name = owner.name
                o.avatar_50 = owner.avatar_50
                o.avatar_200 = owner.avatar_200

                let a = {}
                a.user = o
                a.id = sId.toString()
                a.thumb = s.thumb
                a.title = s.title

                listItems.push(a)
            } catch (err) {
                console.log(err)
                return res.json({ message: "Something went wrong" })
            }
        }

        // Modify the list
        // list.list = listItems
        // list.id = id.toString()

        return res.json({
            success: true, data: {
                id: id.toString(),
                listName: list.listName,
                thumb: list.thumb,
                noOfStories: list.noOfStories,
                list: listItems
            }
        })

    }

    async addStory(req, res) {
        const email = req.email
        const storyId = req.body.storyId
        const listId = req.body.listId
        console.log('email', email)
        console.log('storyId', storyId)
        console.log('listId', listId)

        if (!storyId || !listId) {
            return res.json({ message: "Please specify id" })
        }

        // Get the list
        let list;
        try {
            list = await List.findById(listId.toString(), "id listOwner list noOfStories listName")

            if (!list) {
                return res.json({ message: "No such list exists" })
            }

        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Get the user
        let user;
        try {
            user = await User.findOne({ email: email }, "id")

            if (!user) {
                return res.json({ message: "You don't exist in wisdomverse" })
            }

        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Check that if the user owns that list or not
        if (user.id.toString() !== list.listOwner.toString()) {
            return res.json({ message: "You don't own that list" })
        }

        // Check that if the story is already added to the list or not
        let isAlreadyAdded = false
        for (let i = 0; i < list.list.length; i++) {
            const sId = list.list[i].toString()

            if (sId === storyId.toString()) {
                isAlreadyAdded = true
                break
            }
        }

        let newList = []

        if (isAlreadyAdded) {
            newList = list.list.filter((id) => id.toString() !== storyId.toString())
            newList.push(storyId)
        } else {
            newList = [...list.list, storyId]
        }

        // Add that storyId to the list
        const thumb = await listService.chooseThumb(list.id.toString(), storyId)


        try {
            await List.findByIdAndUpdate(list.id.toString(), {
                list: newList,
                noOfStories: isAlreadyAdded ? list.noOfStories : list.noOfStories + 1,
                thumb
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        console.log('success')
        return res.json({ success: true, listName: list.listName })


    }

    async delete(req, res) {
        const email = req.email
        const id = req.body?.id

        if (!id) {
            return res.json({ message: "Please specify a list to delete" })
        }

        // check that if the user owns that list or not

        // geting the user
        let user;
        try {
            user = await User.findOne({ email: email }, "id lists")

            if (!user) {
                return res.json({ message: "You don't exist in our wisdomverse" })
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // get the list document
        let list;
        try {
            list = await List.findById(id.toString(), "id listOwner")

            if (!list) {
                return res.json({ message: "No such list exists" })
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Checking the ownership
        if (user.id.toString() !== list.listOwner.toString()) {
            return res.json({ message: "You don't own the list" })
        }


        // Delete the list
        //    1. Delete the list itself
        try {
            await List.findByIdAndDelete(id.toString())
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        //    2. Delete the list from the users document
        const newLists = user.lists.filter((listId) => listId.toString() !== id.toString())

        try {
            await User.findByIdAndUpdate(user.id.toString(), {
                lists: newLists
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        return res.json({ success: true, deletedId: id.toString() })
    }

    async removeStory(req, res) {
        const email = req.email
        const storyId = req.body?.storyId
        const listId = req.body?.listId

        if (!storyId || !listId) {
            return res.json({ message: "Please specify id" })
        }

        // geting the user
        let user;
        try {
            user = await User.findOne({ email: email }, "id lists")

            if (!user) {
                return res.json({ message: "You don't exist in our wisdomverse" })
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // get the list document
        let list;
        try {
            list = await List.findById(listId.toString(), "id listOwner list")

            if (!list) {
                return res.json({ message: "No such list exists" })
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Checking the ownership
        if (user.id.toString() !== list.listOwner.toString()) {
            return res.json({ message: "You don't own the list" })
        }

        // Removing the story from the list
        const newListItems = list.list.filter((sId) => sId.toString() !== storyId.toString())

        try {
            await List.findByIdAndUpdate(list.id.toString(), {
                list: newListItems,
                noOfStories: newListItems.length
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        return res.json({ success: true, removedId: storyId.toString() })

    }

    async changeName(req, res) {
        const email = req.email
        const listId = req.body?.listId
        const name = req.body?.name

        if (!listId || !name) {
            return res.json({ message: "Required fields are missing" })
        }

        // Check character limit for list name
        if (name.length > 30) {
            return res.json({ message: "List name is too long. Limit is 30 characters" })
        }

        // Check that the list is owned by the user or not
        let user;
        try {
            user = await User.findOne({ email: email }, 'id lists')

            if (!user) {
                return res.json({ message: "No such user exists in out wisdomverse" })
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        if (!user.lists.includes(listId.toString())) {
            return res.json({ message: "You don't own such list in wisdomverse" })
        }

        // Change name of the list
        try {
            await List.findByIdAndUpdate(listId.toString(), {
                listName: name
            })
        } catch (err) {
            console.log(err)
        }

        return res.json({ success: true, listName: name })

    }
}

export default new ListController()