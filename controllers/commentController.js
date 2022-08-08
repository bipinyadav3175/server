import Comment from "../models/CommentModel.js"
import Story from "../models/StoryModel.js"
import User from "../models/UserModel.js"

class CommentController {
    async publish(req, res) {
        const email = req.email
        const commentText = req.body?.text?.trim()
        const storyId = req.body?.storyId

        if (!commentText || !storyId) {
            return res.json({ message: "No content to publish comment" })
        }

        // 1. add comment in the comment collection
        // 2. add the comment id in the story document
        // 3. add the comment id in the user document

        // Checking that the story exists or not
        let story;
        try {
            story = await Story.findById(storyId, 'id commentCount comments')
            if (!story) {
                return res.json({ message: 'No story found' })
            }

        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Step 1
        let user;
        let userId;
        try {
            user = await User.findOne({ email: email }, 'id comments name username avatar_50 avatar_200')
            if (!user) {
                return res.json({ message: "You do not exist!" })
            }

            userId = user.id
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        let commentId;
        try {
            const comment = new Comment({
                storyId,
                text: commentText,
                user: userId,
                createdAt: Date.now()
            })

            const savedComment = await comment.save()
            commentId = savedComment.id
        } catch (err) {
            console.log(err)
            return res.json({ message: 'Something went wrong' })
        }

        // Step 2
        try {
            await Story.findByIdAndUpdate(storyId, {
                comments: [...story.comments, commentId],
                commentsCount: story.commentsCound + 1
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: 'Something went wrong' })
        }

        // Step 3
        try {
            await User.findByIdAndUpdate(user.id.toString(), {
                comments: [...user.comments, commentId]
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Success
        return res.json({ message: 'Comment published', success: true, comment: { storyId, text: commentText, user: { id: userId, username: user.username, avatar_50: user.avatar_50, avatar_200: user.avatar_200, name: user.name }, stats: { likes: 0 } } })

    }

    async fetchComments(req, res) {
        const email = req.email
        const storyId = req.body?.storyId
        const loaded = req.body.loaded ? req.body.loaded : 0

        if (!storyId) {
            return res.json({ message: "No story Id to fetch comments" })
        }

        let commentIds;
        let hasMore = false
        try {
            const story = await Story.findById(storyId, 'id comments')
            if (!story) {
                return res.json({ message: "No such story exists" })
            }

            commentIds = story.comments

            if (loaded + 10 < commentIds.length) {
                hasMore = true
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        commentIds = commentIds.reverse().slice(loaded, loaded + 10)

        // Get the user id
        let user;
        try {
            user = await User.findOne({ email: email }, 'id')
            if (!user) {
                return res.json({ message: "Opps! You don't exist in Wisdomverse" })
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Now populate the comments
        let comments = [];
        try {
            for (let i = 0; i < commentIds.length; i++) {
                const id = commentIds[i]
                let c = {}
                let a = await Comment.findById(id.toString(), "user text likes createdAt editedAt id likedBy")
                c.id = a.id.toString()
                c.user = a.user
                c.text = a.text
                c.createdAt = a.createdAt
                c.editedAt = a.editedAt
                c.stats = { likes: a.likes }

                // Is the comment like by the user
                let isLikedByYou = false;

                if (a.likedBy) {
                    for (let i = 0; i < a.likedBy.length; i++) {
                        const id = a.likedBy[i]

                        if (id.toString() === user.id.toString()) {
                            isLikedByYou = true
                        }
                    }

                }

                c.isLikedByYou = isLikedByYou

                comments.push(c)
            }

            for (let i = 0; i < comments.length; i++) {
                let c = comments[i]
                const user = await User.findById(c.user.toString(), 'avatar_50 avatar_200 id name username')
                c.user = user
                c.user.id = user.id.toString()
                comments[i] = c
            }

        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        return res.json({ message: "Comments Loaded", success: true, data: comments, hasMore })
    }

    async fetchComment(req, res) {
        const email = req.email
        const commentId = req?.body?.commentId

        if (!commentId) {
            return res.json({ message: "Opps! No comment id" })
        }

        let user;
        try {
            user = await User.findOne({ email: email }, 'id')
            if (!user) {
                return res.json({ message: "Opps! You don't exist in Wisdomverse" })
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        let comment = {};
        let usrId;
        let likedBy;
        try {
            const rawComment = await Comment.findById(commentId, 'user text likes createdAt editedAt id likedBy')
            if (!rawComment) {
                return res.json({ message: 'The particular comment does not exist in our Wisdomverse' })
            }
            usrId = rawComment.user
            likedBy = rawComment.likedBy

            comment.text = rawComment.text
            comment.id = rawComment.id
            comment.stats = { likes: rawComment.likes }
            comment.createdAt = rawComment.createdAt
            comment.editedAt = rawComment.editedAt
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        try {
            const user = await User.findById(usrId.toString(), 'avatar_50 avatar_200 id name username')
            if (!user) {
                return res.json({ message: "Opps! The comment owner left Wisdomverse" })
            }
            comment.user = user
            comment.user.id = user.id.toString()
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Is the comment like by the user
        let isLikedByYou = false;

        if (likedBy) {
            for (let i = 0; i < likedBy.length; i++) {
                const id = likedBy[i]

                if (id.toString() === user.id.toString()) {
                    isLikedByYou = true
                }
            }

        }

        return res.json({ message: 'Loaded', success: true, data: comment, isLikedByYou })


    }

    async likeComment(req, res) {
        const email = req.email
        const commentId = req.body.commentId

        if (!commentId) {
            return res.json({ message: "Please specify a comment" })
        }

        let comment;
        try {
            comment = await Comment.findById(commentId.toString(), 'id likes likedBy')
            if (!comment) {
                return res.json({ message: "No such comment found" })
            }
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        let userId;
        try {
            const user = await User.findOne({ email: email }, 'id')
            if (!user) {
                return res.json({ message: 'No such user found' })
            }
            userId = user.id.toString()
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // Check what to do- like or dislike
        let shouldLike = true;

        if (comment.likedBy) {
            for (let i = 0; i < comment.likedBy.length; i++) {
                const id = comment.likedBy[i]

                if (id.toString() === userId) {
                    shouldLike = false
                }
            }

        }

        // Make a new array of new liked by users
        let likedBy = []
        if (shouldLike) {
            likedBy = comment.likedBy ? comment.likedBy : []
            likedBy.push(userId)
        } else {
            likedBy = comment.likedBy.filter((val) => val.toString() !== userId)
        }

        // Do changes in the comment document
        try {
            await Comment.findByIdAndUpdate(commentId.toString(), {
                likes: shouldLike ? comment.likes + 1 : comment.likes - 1,
                likedBy
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        return res.json({ message: shouldLike ? "Comment Liked" : "Comment unliked", success: true, stats: { likes: shouldLike ? comment.likes + 1 : comment.likes - 1 }, isLikedByYou: shouldLike ? true : false })
    }
}

export default new CommentController()