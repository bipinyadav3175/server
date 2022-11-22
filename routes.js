import express from "express"
const router = express.Router()
import multer from "multer"

// Middlewares
import authMiddleware from "./middlewares/authMiddleware.js"

// Controllers
import authController from "./controllers/authController.js"
import profileController from "./controllers/profileController.js"
import contentController from "./controllers/contentController.js"
import commentController from "./controllers/commentController.js"
import listController from "./controllers/listController.js"

// Multer Config

// const storage = multer.diskStorage({
//     destination: (_, __, cb) => {
//         cb(null, "temp/")
//     },
//     filename: (_, file, cb) => {
//         cb(null, file.originalname)
//     }
// })

const storage = multer.memoryStorage()

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
router.get("/like/:id", authMiddleware, contentController.like) // Todo -> add the liked story to user document
router.post("/update-profile", [authMiddleware], profileController.updateProfile)
router.post("/upload-avatar", [authMiddleware, upload.single("avatar")], profileController.uploadAvatar)
router.post("/delete-story", authMiddleware, contentController.delete)
router.post("/follow", authMiddleware, contentController.follow)

router.post("/add-comment", authMiddleware, commentController.publish)
router.post("/fetch-comments", authMiddleware, commentController.fetchComments)
router.post("/fetch-comment", authMiddleware, commentController.fetchComment)
router.post("/like-comment", authMiddleware, commentController.likeComment)

router.post("/create-reading-list", authMiddleware, listController.create)
router.post("/delete-reading-list", authMiddleware, listController.delete)
router.post("/get-lists", authMiddleware, listController.getLists)
router.post("/get-list", authMiddleware, listController.getList)
router.post("/add-story-to-list", authMiddleware, listController.addStory)
router.post("/remove-story-from-list", authMiddleware, listController.removeStory)
router.post("/change-list-name", authMiddleware, listController.changeName)


export default router