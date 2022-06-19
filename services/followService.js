import User from "../models/UserModel";

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
        const newFollowing = [...user.following, { userId: userToBeFollowed.id.toHexString() }]
        try {
            await User.findByIdAndUpdate(user.id.toHexString(), {
                following: newFollowing,
                followingCount: user.followingCount + 1
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }


        // 2. Increse the followed users follower count, add the user to followers field
        const newFollowers = [...userToBeFollowed.followers, { userId: user.id.toHexString() }]

        try {
            await User.findByIdAndUpdate(userToBeFollowed.id.toHexString(), {
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

        const newFollowing = user.following.filter((value) => value.userId !== userToBeUnfollowed.toHexString())
        try {
            await User.findByIdAndUpdate(user.id.toHexString(), {
                following: newFollowing,
                followingCount: user.followingCount - 1
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }


        // 2. Decrease the followed users follower count, remove the user from followers field
        const newFollowers = userToBeUnfollowed.followers.filter((value) => value.userId !== user.id.toHexString())

        try {
            await User.findByIdAndUpdate(userToBeUnfollowed.id.toHexString(), {
                followers: newFollowers,
                followerCount: userToBeUnfollowed.followerCount + 1
            })
        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }
    }
}

export default new FollowService()