import Sharp from "sharp"
import fs from "fs/promises"

import imagemin from "imagemin"
import imageminOptipng from "imagemin-optipng";

// Firebase
import admin from "firebase-admin"
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url);
const serviceAccount = require("../wisdom-dev-1650365156696-firebase-adminsdk-jiktt-e0ccd5a272.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://wisdom-dev-1650365156696.appspot.com"
});

var bucket = admin.storage().bucket();

class ImageService {
    async resize(buffer, width) {
        try {
            return await Sharp(buffer).resize(width, null).png().toBuffer()
        } catch (err) {
            console.log(err)
            return undefined
        }
    }

    async saveBuffer(buffer, name) {
        try {
            return await Sharp(buffer).toFile('temp/' + name)
        } catch (err) {
            console.log(err)
            return undefined
        }
    }

    async compressPng(buffer) {
        try {
            return await imagemin.buffer(buffer, {
                plugins: [imageminOptipng({
                    bitDepthReduction: true,
                    paletteReduction: true,
                    colorTypeReduction: true,
                })]
            })

        } catch (err) {
            console.log(err)
            return undefined
        }
    }

    async upload(path, destination, makePublic = false) {
        try {
            const upload = await bucket.upload(path, {
                destination,
                gzip: true,
                metadata: {
                    contentType: "image/png"
                },
                // public: makePublic
            })

            await fs.unlink(path)

            return upload
        } catch (err) {
            console.log(err)
            return undefined
        }
    }

}


export default new ImageService()