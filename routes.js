import express from "express"
const router = express.Router()
import multer from "multer"

// Middlewares
import authMiddleware from "./middlewares/authMiddleware.js"

// Controllers
import authController from "./controllers/authController.js"
import profileController from "./controllers/profileController.js"
import contentController from "./controllers/contentController.js"

// Multer Config

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, "temp/")
    },
    filename: (_, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 15 } }) // 15 MB

router.get("/", (req, res) => {
    return res.send("Hello from the server")
})

router.post("/google-login", authController.googleLogin)
router.get("/username-available/:username", authMiddleware, profileController.usernameAvailable)
router.get("/save-username/:username", authMiddleware, profileController.saveUsername)
router.get("/feed", authMiddleware, contentController.homeFeed) // yet to be done
router.post("/post", [authMiddleware, upload.array("postImages")], contentController.post)
router.get("/story/:id", authMiddleware, contentController.loadStory)
router.get("/user/:id", authMiddleware, contentController.user)
router.get("/user-recent-stories/:id", authMiddleware, contentController.userRecentStories)
router.get("/like/:id", authMiddleware, contentController.like)


export default router