import mongoose, { Schema, Types } from "mongoose";


const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId, // one who subscribes the channel
            ref: "User"
        },
        channel: {
            type: Schema.Types.ObjectId, // one who is subscribed
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)



export const Subscription = new mongoose.model("Subscription", subscriptionSchema);