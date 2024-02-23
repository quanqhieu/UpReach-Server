const mongoose = require("mongoose");

const influeSchema = new mongoose.Schema({
    nickname: {
        type: String,
    },
    email: {
        type: String,
    },
    avatarImage: {
        type: String,
    }
})

module.exports = mongoose.model("Influe", influeSchema);