const clientModel = require("../../Model/MogooseSchema/clientModel");
const influModel = require("../../Model/MogooseSchema/influModel");
const messageModel = require("../../Model/MogooseSchema/messageModel");

module.exports.addMessage = async (req, res, next) => {
    try {
        const { from, to, message } = req.body;

        // Determine the senderType based on the sender's model
        const senderType = await determineSenderType(from);

        const data = await messageModel.create({
            message: { text: message },
            users: [from, to],
            sender: from,
            senderType: senderType,
        })
        if (data) return res.json({ msg: "Message added successfully.", status: true, });
        else return res.json({ msg: "Failed to add message to the database", status: false, });
    } catch (ex) {
        next(ex);
    }
}

// Determine the senderType based on the sender's model
async function determineSenderType(senderId) {
    const client = await clientModel.findById(senderId);
    if (client) {
        return 'Client';
    }

    const influe = await influModel.findById(senderId);
    if (influe) {
        return 'Influe';
    }

    throw new Error("Sender not found");
}

module.exports.getAllMessage = async (req, res, next) => {
    try {
        const { from, to } = req.body;

        const messages = await messageModel.find({
            users: {
                $all: [from, to],
            },
        }).populate('sender').sort({ updatedAt: 1 });

        console.log("object")

        const projectedMessages = messages.map(async (msg) => {

            const senderInfo = (msg.senderType === 'Client')
                ? await clientModel.findById(msg.sender._id)
                : await influModel.findById(msg.sender._id);


            return {
                fromSelf: msg.sender._id.toString() === from,
                senderInfo: senderInfo,
                message: msg.message.text,
                isSenderInfluencer: msg.senderType === 'Influe',
            };
        });
        const messagesWithSenderInfo = await Promise.all(projectedMessages);
        res.json(messagesWithSenderInfo);
    } catch (ex) {
        next(ex);
    }
}