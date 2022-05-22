import express from "express"
import router from "./routes.js"
import dbConnect from "./dbConnect.js"
import dotenv from 'dotenv'
dotenv.config()


const app = express()
const PORT = process.env.PORT || 5000

dbConnect()
app.use(express.json({ limit: "8mb" }))
app.use(express.urlencoded({ extended: true }))

app.use(router)
app.listen(PORT, () => console.log("Server booming on port:", PORT))