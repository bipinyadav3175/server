import User from "../models/UserModel.js";

class FollowService {
    /**
     * A functions to follow a user
     * @param {User} user The user that is sending the request
     * @param {User} userToBeFollowed The user that should be followed
     * @param {response} res The response object
     * @returns undefined
     */
    async follow(user, userToBeFollowed, res) {
        // 1. Add the followed user to User document, increase the users following count

        // Update the DB
        const newFollowing = [...user.following, userToBeFollowed.id.toString()]
        try {
            await User.findByIdAndUpdate(user.id.toString(), {
                following: newFollowing,
                followingCount: user.followingCount + 1
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }


        // 2. Increse the followed users follower count, add the user to followers field
        const newFollowers = [...userToBeFollowed.followers, user.id.toString()]

        try {
            await User.findByIdAndUpdate(userToBeFollowed.id.toString(), {
                followers: newFollowers,
                followerCount: userToBeFollowed.followerCount + 1
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }
    }

    /**
     * A function to unfollow a user
     * @param {User} user The user that is sending request
     * @param {User} userToBeUnfollowed The user that should be unfollowed
     * @param {response} res The response object
     * @returns undefined
     */
    async unfollow(user, userToBeUnfollowed, res) {
        // 1. Remove the followed user from User document, decrease the users following count

        const newFollowing = user.following.filter((userId) => userId.toString() !== userToBeUnfollowed.id.toString())
        try {
            await User.findByIdAndUpdate(user.id.toString(), {
                following: newFollowing,
                followingCount: user.followingCount - 1
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }


        // 2. Decrease the followed users follower count, remove the user from followers field
        const newFollowers = userToBeUnfollowed.followers.filter((userId) => userId.toString() !== user.id.toString())

        try {
            await User.findByIdAndUpdate(userToBeUnfollowed.id.toString(), {
                followers: newFollowers,
                followerCount: userToBeUnfollowed.followerCount - 1
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }
    }

    /**
     * Check that the user (userId) follows the creator (creatorId)
     * @param {object} userId_or_email Id or Email (at least one) of the user sending request
     * @param {string} creatorId Id of the user to check followership
     * @returns boolean | undefined
     */

    async checkFollowerShip({ userId, email } = { userId: null, email: null }, creatorId) {
        if (!userId && !email) {
            return undefined
        }

        let isFollowedByYou = false;
        let user;
        try {
            if (userId) {
                user = await User.findById(userId.toString(), "following")
            } else {
                user = await User.findOne({ email }, "following")
            }

            if (!user) {
                return undefined
            }
        } catch (err) {
            console.log(err)
            return undefined
        }

        for (let i = 0; i < user.following.length; i++) {
            const userId = user.following[i]
            if (userId.toString() === creatorId.toString()) {
                isFollowedByYou = true
                break
            }
        }
        return isFollowedByYou
    }
}

export default new FollowService()