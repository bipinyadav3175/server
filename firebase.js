const { initializeApp } = require("firebase/app")
const { getStorage } = require("firebase/storage")


const config = {
    storageBucket: process.env.FIREBASE_BUCKET,
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountId: process.env.FIREBASE_CLIENT_ID,
}

const app = initializeApp(config)

const storage = getStorage(app, config.storageBucket)

module.exports = storage
