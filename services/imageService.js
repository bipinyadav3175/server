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

    /**
     * Resizes images of any format and converts to Png
     * @param {Buffer} buffer The image buffer (any format)
     * @param {number} width Width of the processed image (height will be auto calculated)
     * @returns A buffer of resized Png image
     */

    async resize(buffer, width) {

        try {
            return await Sharp(buffer).resize(width, null).png().toBuffer()
        } catch (err) {
            console.log(err)
            return undefined
        }
    }

    /**
     * Saves the buffer in the 'temp/' folder
     * @param {Buffer} buffer The image buffer to save
     * @param {string} name The name to be assigned to the file
     * @returns A promise that fulfills with an object containing information on the resulting file
     */

    async saveBuffer(buffer, name) {
        try {
            return await Sharp(buffer).toFile('temp/' + name)
        } catch (err) {
            console.log(err)
            return undefined
        }
    }

    /**
     * A function that uses imagemin and imageminOptipng plugin to compress png buffer
     * @param {Buffer} buffer A png image buffer
     * @returns The compressed buffer
     */

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

    /**
     * A function to upload png files to firebase storage
     * @param {string} path Path of the png file to be uploaded
     * @param {string} destination Destination of the png file on the cloud to be uploaded (with file name and extension)
     * @param {boolean} makePublic Make the image public or not (optional)(default: false)
     * @returns UploadResponse : Details of the file uploaded by google cloud
     */

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

    /**
     * Delete the image in the firebase storage
     * @param {string} name Name of the image including the folder
     * @returns Promise of api response (by google cloud)
     */

    async delete(name) {
        try {
            return await bucket.file(name).delete()
        } catch (err) {
            console.log(err)
            return undefined
        }
    }

}


export default new ImageService()