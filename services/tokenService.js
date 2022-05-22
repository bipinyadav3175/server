import jwt from "jsonwebtoken"

class TokenService {
    generateToken(email) {
        const token = jwt.sign(email + "^" + Date.now(), process.env.JWT_SECRET)
        return token
    }

    verify(token) {
        return jwt.verify(token, process.env.JWT_SECRET, (err, token) => {
            if (!token) {
                return false
            }

            return token
        })
    }
}

export default new TokenService()