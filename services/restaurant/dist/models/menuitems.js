import mongoose, { Schema } from "mongoose";
;
const schema = new Schema({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
        index: true, // isse hoga ki agr restaurant delete to item delete hojaega
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    isAvailable: {
        type: Boolean,
        required: true,
    },
}, {
    timestamps: true,
});
export default mongoose.model("MenuItem", schema);
