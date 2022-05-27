import { nanoid } from "nanoid"
// const sharp = require("sharp")
// const fs = require("fs")

import User from "../models/UserModel.js"
import Story from "../models/StoryModel.js"

// Data transform objects
import StoryItemDto from "../dtos/StoryItemDto.js"
import StoryDto from "../dtos/StoryDto.js"

// Services
import imageService from "../services/imageService.js"
import calculateService from "../services/calculateService.js"

// Firebase
// var admin = require("firebase-admin");
// var serviceAccount = require("../wisdom-dev-1650365156696-firebase-adminsdk-jiktt-e0ccd5a272.json");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     storageBucket: "gs://wisdom-dev-1650365156696.appspot.com"
// });

// var bucket = admin.storage().bucket();


class ContentController {
    async homeFeed(req, res) {
        const email = req.email

        try {
            // User data
            const user = await User.findOne({ email: email }, 'stories history id')
            const userCreatedStories = user.stories
            const userHistory = user.userHistory

            // All stories in the data base
            const stories = await Story.find()

            // Create a new array of curated stories
            var curated = []
            const limit = 7 // Number of stories to be sent to the client per request

            for (let i = 0; curated.length < limit; i++) {
                // Genearate a random index
                const random = Math.floor(Math.random() * stories.length)
                var randomStory = new Object(stories[random])

                // Check the existence of random story in userCreatedStories
                // var userCreatedStoryIds = []
                // for (let i = 0; i < userCreatedStories.length; i++) {
                //     const story = userCreatedStories[i]

                //     userCreatedStoryIds.push(story.storyId.toHexString())
                // }


                // if (userCreatedStoryIds.includes(randomStory.id)) {
                //     continue
                // }

                // Check the existence of random story in userhistory
                var historyStoryIds = []

                if (userHistory) {
                    for (let i = 0; i < userHistory.length; i++) {
                        const story = userHistory[i]

                        historyStoryIds.push(story.storyId.toHexString)
                    }
                }

                if (historyStoryIds.includes(randomStory.id)) {
                    continue
                }


                // All clear -> Push into Curated Array with only required fields
                const storyItemDto = new StoryItemDto(randomStory)

                curated.push(storyItemDto)

            }


            for (let i = 0; i < curated.length; i++) {
                let story = curated[i]

                try {
                    let currentStoryUser = await User.findOne({ _id: story.ownerId }, "avatar_50 avatar_200 username")
                    curated[i] = Object.assign(curated[i], { avatar_50: currentStoryUser.avatar_50 })
                    curated[i] = Object.assign(curated[i], { avatar_200: currentStoryUser.avatar_200 })
                    curated[i] = Object.assign(curated[i], { ownerUsername: currentStoryUser.username })
                } catch (err) {
                    console.log(err)
                    return res.json({ message: "Unable to load Profile pictures" })
                }

            }

            return res.json({ feed: curated, success: true })



        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong!" })
        }


    }

    async post(req, res) {
        let storyData = JSON.parse(req.body.storyData)
        let storyMetaData = JSON.parse(req.body.storyMetaData)
        let allImages = req.files

        const email = req.email


        if (!storyData || !storyMetaData) {
            return res.json({ message: "Information Incomplete" })
        }

        var processedStoryData = []
        var bodyPreview = ''

        for (let i = 0; i < storyData.length; i++) {
            const item = storyData[i]

            processedStoryData.push({ ...item, itemId: nanoid(6) })

            if (item.type === "P" && bodyPreview.length <= 100) {
                bodyPreview = bodyPreview + item.content.trim()
            }
        }


        var imgUrls = []

        for (let i = 0; i < allImages.length; i++) {
            const img = allImages[i]

            let newImgName = nanoid() + "_" + Date.now() + '.png'
            try {
                let buffer = img.buffer

                // 1. Resize the buffer
                buffer = await imageService.resize(buffer, 800)

                // 2. Compress the buffer
                buffer = await imageService.compressPng(buffer)

                // 3. Save buffer in temp folder
                await imageService.saveBuffer(buffer, newImgName)

                // 4. Upload the image to firebase
                await imageService.upload('temp/' + newImgName, "postImages/" + newImgName, true)

                const imgLink = `https://firebasestorage.googleapis.com/v0/b/wisdom-dev-1650365156696.appspot.com/o/postImages%2F${newImgName}?alt=media`
                imgUrls.push(imgLink)

                // Update the details of the image in processedStoryData

                // Find the object to update
                let ind = processedStoryData.findIndex((val) => val.imgName === img.originalname)
                processedStoryData[ind].url = imgLink
                // Delete unnessary fields
                delete processedStoryData[ind].imgName
                delete processedStoryData[ind].imgType

            } catch (err) {
                console.log(err)
                return res.json({ message: "Unable to process images" })
            }


        }



        try {
            const user = await User.findOne({ email: email }, "id name stories noOfStories")
            const timeToRead = calculateService.timeToRead(processedStoryData)

            const story = new Story({
                ownerId: user.id,
                ownerName: user.name,
                title: storyMetaData.title,
                dateCreated: Date.now(),
                data: processedStoryData,
                tags: storyMetaData.tags,
                category: storyMetaData.category,
                thumb: imgUrls.length > 0 ? imgUrls[0] : null,
                bodyPreview: bodyPreview ? bodyPreview : null,
                timeToRead: timeToRead
            })

            const savedStory = await story.save()

            let allStories = user.stories
            allStories.push({ storyId: savedStory.id, title: savedStory.title, thumb: savedStory.thumb })

            await User.findByIdAndUpdate(user.id, { stories: allStories, noOfStories: user.noOfStories + 1 })

        } catch (err) {
            return res.json({ message: "Unable to post Story", success: false })
            console.log(err)
        }

        return res.json({ success: true, message: "Story published" })
    }

    async loadStory(req, res) {
        const storyId = req.params.id


        if (!storyId) {
            return res.json({ message: "Story Id not found", success: false })
        }

        try {
            const story = await Story.findOne({ _id: storyId })
            const user = await User.findOne({ _id: story.ownerId }, "avatar_50 avatar_200 name username likedStories")

            var likedStoriesIds = []
            for (let i = 0; i < user.likedStories.length; i++) {
                const story = user.likedStories[i]

                likedStoriesIds.push(story.storyId.toHexString())
            }


            var isLiked = false
            if (likedStoriesIds.includes(storyId)) {
                isLiked = true
            }

            let storyDto = new StoryDto(story)

            // Transforming story Dto
            storyDto.ownerName = user.name
            storyDto.ownerUsername = user.ownerUsername
            storyDto.avatar_50 = user.avatar_50
            storyDto.avatar_200 = user.avatar_200


            return res.json({ story: storyDto, success: true, isLiked })

        } catch (err) {
            console.log(err)
            return res.json({ message: "No such story", success: false })
        }

        return res.end()
    }

    async user(req, res) {
        const id = req.params.id
        const email = req.email

        if (!id) {
            return res.json({ message: "No id specified" })
        }

        try {
            const clickedUser = await User.findById(id, "name username avatar_50 avatar_200 banner bio storyViews followerCount followingCount id")

            if (!clickedUser) {
                return res.json({ message: "No such user exists" })
            }

            const user = await User.findOne({ email: email }, "followers")

            var isFollowedByYou = false
            var followerIds = []
            for (let i = 0; i < user.followers.length; i++) {
                const follower = user.followers[i]
                followerIds.push(follower.userId)
            }

            if (clickedUser.id in followerIds) {
                isFollowedByYou = true
            }

            return res.json({
                success: true, data: {
                    id: clickedUser.id,
                    name: clickedUser.name,
                    username: clickedUser.username,
                    avatar_50: clickedUser.avatar_50,
                    avatar_200: clickedUser.avatar_200,
                    banner: clickedUser.banner,
                    bio: clickedUser.bio,
                    storyViews: clickedUser.storyViews,
                    followerCount: clickedUser.followerCount,
                    followingCount: clickedUser.followingCount,
                    isFollowedByYou
                }
            })

        } catch (err) {
            return res.json({ message: "Something went wrong" })
        }
    }

    async userRecentStories(req, res) {
        const id = req.params.id
        const loaded = req.query.loaded

        if (!id) {
            return res.json({ message: "No id specified" })
        }

        try {
            const user = await User.findById(id, "stories avatar_50 avatar_200 username")

            if (!user) {
                return res.json({ message: "No such user" })
            }

            const stories = user.stories.reverse()
            const storiesLength = stories.length
            var storiesToSend = []

            var hasMore = true
            if (loaded + 7 >= storiesLength) {

                storiesToSend = stories.slice(loaded, storiesLength)
                hasMore = false
            } else {

                storiesToSend = stories.slice(loaded, loaded + 7)
            }

            for (let i = 0; i < storiesToSend.length; i++) {
                const mini_story = storiesToSend[i]

                const story = await Story.findById(mini_story.storyId)

                storiesToSend[i] = new StoryItemDto(story)
                storiesToSend[i].avatar_50 = user.avatar_50
                storiesToSend[i].avatar_200 = user.avatar_200
                storiesToSend[i].ownerUsername = user.username
            }


            return res.json({ success: true, stories: storiesToSend, hasMore })

        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }
    }

    async like(req, res) {
        const email = req.email
        const id = req.params.id

        if (!id) {
            return res.json("No id specified")
        }

        try {
            const user = await User.findOne({ email: email }, "likedStories")
            const story = await Story.findById(id, "likes title thumb ownerId category")

            var likedStoriesIds = []

            for (let i = 0; i < user.likedStories.length; i++) {
                const story = user.likedStories[i]

                likedStoriesIds.push(story.storyId.toHexString())
            }

            // Unlike the story
            if (likedStoriesIds.includes(id)) {
                var likedStories = user.likedStories
                const updatedLikedStories = likedStories.filter((story) => {
                    return story.storyId.toHexString() !== id
                })

                await User.findOneAndUpdate({ email: email }, { likedStories: updatedLikedStories })
                await Story.findByIdAndUpdate(id, { likes: story.likes - 1 })

                return res.json({ success: true, liked: false })
            }

            // Like the story
            var likedStories = user.likedStories
            likedStories.push({
                storyId: id,
                title: story.title,
                thumb: story.thumb,
                category: story.category
            })

            await User.findOneAndUpdate({ email: email }, { likedStories: likedStories })
            await Story.findByIdAndUpdate(id, { likes: story.likes + 1 })

            return res.json({ success: true, liked: true })

        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }
    }

    async delete(req, res) {
        const email = req.email
        const id = req.body.id // The id of the story to delete

        if (!id) {
            return res.json({ message: "Please specify a story id to delete" })
        }


        // 1. Check that the user owns the story or not

        // Get the user
        let user;
        try {
            user = await User.findOne({ email: email }, "stories noOfStories")
            if (!user) {
                return res.json({ message: "No user found" })
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Checking ownership
        let userStories = user.stories
        let userStoryIds = []

        for (let i = 0; i < userStories.length; i++) {
            let story = userStories[i]
            userStoryIds.push(story.storyId.toHexString())
        }

        if (!(id in userStoryIds)) {
            return res.json({ message: "You cannot delete this story as you don't own it" })
        }

        // Get the story to be deleted (so that we can get the image urls and we can delete them)
        let story;
        try {
            story = await Story.findById(id, 'data')

            if (!story) {
                return res.json({ message: "No such story found" })
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Delete the images in the cloud
        let data = story.data

        try {
            for (let i = 0; i < data.length; i++) {
                let item = data[i]
                if (item.type === "IMG") {
                    const deleteRes = await imageService.delete('postImages/' + item.url)
                    console.log(deleteRes)
                }
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Error deleting images" })
        }


        // Delete the story in the story collection
        try {
            await Story.findByIdAndDelete(id)
        } catch (err) {
            console.log(err)
            return res.json({ message: "Unable to delete the story" })
        }

        // Delete the story in the users document
        userStories = userStories.filter((story) => story.storyId.toHexString() !== id)
        try {
            await User.findOneAndUpdate({ email: email }, { userStories: userStories, noOfStories: user.noOfStories - 1 })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Unable to delete the story" })
        }

        // Successfully deleted the story
        // Send confirmation to the user

        return res.json({ message: "Story deleted", success: true, deletedStoryId: id })

    }

}

export default new ContentController()