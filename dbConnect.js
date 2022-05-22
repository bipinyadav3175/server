import mongoose from "mongoose"

const dbConnect = () => {
    mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log("Database connected :)"))
        .catch((err) => console.error(err))
}

export default dbConnect