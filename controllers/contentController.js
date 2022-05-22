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
                    let currentStoryUser = await User.findOne({ _id: story.ownerId }, "avatar username")
                    curated[i] = Object.assign(curated[i], { avatar: currentStoryUser.avatar })
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
                // await sharp(img.destination + img.filename).png({ quality: 95, colors: 128 }).toFile('temp/' + newImgName);
                // fs.unlink(img.destination + img.filename, (err) => {
                //     if (err) {

                //         console.log(err)
                //     }
                // })
                // const upload = await bucket.upload('temp/' + newImgName, {
                //     destination: `postImages/${newImgName}`,
                //     gzip: true,
                //     metadata: {
                //         contentType: "image/png"
                //     }
                // })

                const outputInfo = await imageService.resize_to_png(img.destination + img.filename, 800, newImgName)
                const compressed = await imageService.compressPng('temp/' + newImgName)
                const upload = await imageService.upload(compressed.folder + newImgName, "postImages/" + newImgName)

                const imgLink = `https://firebasestorage.googleapis.com/v0/b/wisdom-dev-1650365156696.appspot.com/o/postImages%2F${newImgName}?alt=media`
                imgUrls.push(imgLink)

                let ind = processedStoryData.findIndex((val) => val.imgName === img.filename)
                // For loop OP 🔥
                processedStoryData[ind].url = imgLink
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
            const user = await User.findOne({ _id: story.ownerId }, "avatar name username likedStories")

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
            storyDto.ownerAvatar = user.avatar


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
            const clickedUser = await User.findById(id, "name username avatar banner bio storyViews followerCount followingCount id")

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
                    avatar: clickedUser.avatar,
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
            const user = await User.findById(id, "stories avatar username")

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
                storiesToSend[i].avatar = user.avatar
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

}

export default new ContentController()