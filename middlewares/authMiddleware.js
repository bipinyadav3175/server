import tokenService from "../services/tokenService.js"

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization

    if (!token) {
        return res.json({ message: "Not authorized!" })
    }

    const verified = tokenService.verify(token)
    if (!verified) {
        return res.json({ message: "Not a valid authorized user" })
    }

    const email = verified.split("^")[0]
    req.email = email

    next()
}

export default authMiddleware