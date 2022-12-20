import User from "../models/UserModel.js"

class UserService {
    async getAlternate({ email, id }) {
        if (!email && !id) {
            return undefined
        }

        if (!email) {
            try {
                const user = await User.findById(id.toString(), 'email')
                return user.email
            } catch (err) {
                console.log(err)
            }
        }

        if (!id) {
            try {
                const user = await User.findOne({ email: email }, 'id')
                return user.id.toString()
            } catch (err) {
                console.log(err)
            }
        }

    }
}

export default new UserService()