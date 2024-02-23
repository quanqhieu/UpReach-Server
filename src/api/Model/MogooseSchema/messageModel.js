const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
    {
        message: {
            text: { type: String, required: true },
        },
        users: Array,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "senderType",
            ref: "User",
            required: true,
        },
        senderType: {
            type: String,
            required: true,
            enum: ["Client", "Influe"], // Use the correct enum values based on your models
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Messages", MessageSchema);