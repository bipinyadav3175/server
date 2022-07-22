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
            user = await User.findOne({ email: email }, 'id comments')
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
        return res.json({ message: 'Comment published', success: true })

    }

    async fetchComments(req, res) {
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

        // Now populate the comments
        let comments = [];
        try {
            for (let i = 0; i < commentIds.length; i++) {
                const id = commentIds[i]
                let c = {}
                let a = await Comment.findById(id.toString(), "user text likes createdAt editedAt id")
                c.id = a.id.toString()
                c.user = a.user
                c.text = a.text
                c.createdAt = a.createdAt
                c.editedAt = a.editedAt
                c.stats = { likes: a.likes }
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
        console.log(comments)

        return res.json({ message: "Comments Loaded", success: true, data: comments, hasMore })
    }
}

export default new CommentController()