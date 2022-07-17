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
}

export default new CommentController()