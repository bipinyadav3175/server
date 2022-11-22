import { nanoid } from "nanoid"
import User from "../models/UserModel.js"
import imageService from "../services/imageService.js"

class ProfileController {
    async usernameAvailable(req, res) {
        const userEmail = req.email
        const username = req.params.username

        if (!username) {
            return res.json({ message: "No username specified" })
        }

        try {
            const someUser = await User.findOne({ username }, "email")

            if (!someUser) {
                return res.json({ available: true })
            }

            if (someUser === userEmail) {
                return res.json({ available: true })
            }

            return res.json({ available: false })

        } catch (err) {
            console.log(err)
            return res.json({ message: "something went wrong" })
        }
    }

    async saveUsername(req, res) {
        const userEmail = req.email
        const username = req.params.username

        if (!username) {
            return res.json({ message: "No username specified" })
        }

        try {
            const someUser = await User.findOne({ username }, "email")

            if (!someUser || someUser === userEmail) {

                await User.findOneAndUpdate({ email: userEmail }, { username: username, usernameLastUpdated: Date.now() })

                return res.json({ success: true, username: username })
            }


            return res.json({ success: false, message: "Unable to save the username. Please try with a different one." })

        } catch (err) {
            console.log(err)
            return res.json({ message: "something went wrong" })
        }

    }

    async updateProfile(req, res) {
        const email = req.email
        const { name, username, bio } = req.body

        if (!name || !username) {
            return res.json({ message: "Name and Username are required" })
        }

        // user
        let user;
        try {
            user = await User.findOne({ email: email }, 'username name bio usernameLastUpdated')

            if (!user) {
                return res.json({ message: "No user found" })
            }

        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

        // check for username availability if a new username

        let shouldUpdateUsername = false; // See various factors and update this boolean to determine that the username should be updated or not

        if (username !== user.username) {
            try {
                const matched = await User.findOne({ username: username }, "id")

                if (matched) {
                    return res.json({ message: "Username already taken" })
                }
            } catch (err) {
                console.log(err)
                return res.json({ message: "Something went wrong" })
            }

            // Check the username last updated time stamp
            // If updated less than 7d ago -> do not update and notify user

            const time_7d = 100 * 60 * 60 * 24 * 7 // ms * sec * min * hours * days
            const time_now = Date.now()

            if (user.usernameLastUpdated + time_7d < time_now) {
                shouldUpdateUsername = true
            }

        }


        // update the name, username, bio in the DB

        try {
            await User.findOneAndUpdate({ email: email }, {
                name: name,
                bio: bio ? bio : null,
                username: shouldUpdateUsername ? username : user.username, // username -> new username | user.username -> old username
                usernameLastUpdated: shouldUpdateUsername ? Date.now() : user.usernameLastUpdated
            })
        } catch (err) {
            conosle.log(err)
            return res.json({ message: "Something went wrong" })
        }

        return res.json({
            success: true,
            message: username === user.username ? 'Profile updated' : shouldUpdateUsername ? "Profile Updated" : "You can only change your username after 7 days of last updating",
            profile: {
                username: shouldUpdateUsername ? username : user.username,
                name,
                bio: bio ? bio : ''
            }
        })
    }

    async uploadAvatar(req, res) {
        const email = req.email


        if (!req.file) {
            return res.json({ message: "No avatar found" })
        }

        // Old avatars to delete them
        let oldAvatar_50;
        let oldAvatar_200;
        try {
            const user = await User.findOne({ email: email }, "avatar_50 avatar_200")
            if (!user || (!user.avatar_50 && !user.avatar_200)) {
                return res.json({ message: "Unable to process" })
            }

            oldAvatar_200 = user.avatar_200
            oldAvatar_50 = user.avatar_50

        } catch (err) {
            console.log(err)
        }

        // Resize & Compress avatar
        let url50; // Variable for 50x50 avatar's uploaded url
        let url200;

        try {
            const { buffer, originalname: originalName } = req.file

            const name50 = nanoid() + '_' + Date.now() + '.png'
            const name200 = nanoid() + '_' + Date.now() + '.png'

            // Avatar 50x50
            var buffer50 = await imageService.resize(buffer, 50)
            buffer50 = await imageService.compressPng(buffer50)

            // Avatar 200x200
            var buffer200 = await imageService.resize(buffer, 200)
            buffer200 = await imageService.compressPng(buffer200)

            // Save both buffers to disk so that it could be uploaded
            await imageService.saveBuffer(buffer50, name50)
            await imageService.saveBuffer(buffer200, name200)


            // Upload Both
            const uploaded50 = await imageService.upload('temp/' + name50, 'avatars/' + name50, true)
            const uploaded200 = await imageService.upload('temp/' + name200, 'avatars/' + name200, true)

            url50 = `https://firebasestorage.googleapis.com/v0/b/wisdom-dev-1650365156696.appspot.com/o/avatars%2F${name50}?alt=media`
            url200 = `https://firebasestorage.googleapis.com/v0/b/wisdom-dev-1650365156696.appspot.com/o/avatars%2F${name200}?alt=media`

        } catch (err) {
            console.log(err)
            return res.json({ message: "Unable to process Avatar" })
        }

        // Delete old avatars
        const img_200 = oldAvatar_200.split('avatars%2F')[1].split('?alt=media')[0]
        const img_50 = oldAvatar_50.split('avatars%2F')[1].split('?alt=media')[0]
        try {
            await imageService.delete('avatars/' + img_200)
            await imageService.delete('avatars/' + img_50)
        } catch (err) {
            console.log(err)
            return res.json({ message: "Unable to delete images" })
        }

        // update the avatar in db
        try {
            await User.findOneAndUpdate({ email: email }, {
                avatar_50: url50,
                avatar_200: url200,
            })
        } catch (err) {
            conosle.log(err)
            return res.json({ message: "Something went wrong" })
        }

        return res.json({
            success: true,
            profile: {
                avatar_50: url50,
                avatar_200: url200
            }
        })
    }
}

export default new ProfileController()