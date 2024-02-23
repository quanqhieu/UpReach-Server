const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    email: {
        type: String,
    },
    avatarImage: {
        type: String,
    },
    booking: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Influe" }
    ]
})

module.exports = mongoose.model("Client", clientSchema);