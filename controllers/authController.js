import { OAuth2Client } from "google-auth-library"
import User from "../models/UserModel.js"
import tokenService from "../services/tokenService.js"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

import { createRequire } from "module"
const require = createRequire(import.meta.url)
const nanoid = require("nanoid")

class AuthController {
    async googleLogin(req, res) {
        const { idToken } = req.body

        try {
            const ticket = await client.verifyIdToken({
                idToken,
                requiredAudience: process.env.ANDROID_CLIENT_ID
            })
            const payload = ticket.getPayload()

            if (!payload.email_verified) {
                return res.json({ message: "Unable to log you in" })
            }

            const foundUser = await User.findOne({ email: payload.email }, 'name email username id')

            const token = tokenService.generateToken(payload.email)

            if (foundUser) {
                return res.json({ success: true, name: foundUser.name, token, email: foundUser.email, username: foundUser.username, id: foundUser.id })
            }

            // const avatar = `https://avatars.dicebear.com/api/big-smile/${nanoid(5)}.svg`

            const user = new User({
                name: payload.name,
                firstName: payload.given_name,
                googleSub: payload.sub,
                email: payload.email,
                avatar: payload.picture,
            })

            const savedUser = await user.save()

            return res.json({ success: true, name: payload.name, token, email: payload.email, username: null, id: savedUser.id })

        } catch (err) {
            console.log(err)
            return res.json({ message: "Something went wrong" })
        }

    }

}

export default new AuthController()