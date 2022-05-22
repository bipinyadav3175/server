import User from "../models/UserModel.js"

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
}

export default new ProfileController()