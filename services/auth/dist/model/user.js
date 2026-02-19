import mongoose, { Schema } from "mongoose";
// this tells that the schema is of the type USER -> checkedby typescript
// and then make the schema which would be used by the model to create a collection
// also note that when a model is created, it is only only stored in emory and not reflected in my DB
// it only reflects after one operation is done
const schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    role: { type: String, default: null },
}, {
    timestamps: true,
});
// model ka type btao kya h -> collection jo aaenge uska type kya h 
const User = mongoose.model("User", schema);
export default User;
