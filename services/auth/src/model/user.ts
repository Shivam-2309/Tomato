import mongoose, {Document, Schema} from "mongoose";

// this thing is for type checking of the typescirpt
export interface IUSER extends Document {
    name : string;
    email : string; 
    image : string; 
    role : string;
}

// this tells that the schema is of the type USER -> checkedby typescript
// and then make the schema which would be used by the model to create a collection
// also note that when a model is created, it is only only stored in emory and not reflected in my DB
// it only reflects after one operation is done
const schema : Schema<IUSER> = new Schema({
    name : {
        type : String, 
        required : true,
    },
    email : {
        type : String, 
        required : true,
        unique : true,
    },
    image : {
        type : String, 
        required : true,
    },
    role : {
        // hm user se aage puchenge ki bhai kya h aapka role
        // abhi hm bs login ke liye user ki details le rhe h
        type : String, 
        default : null,
    },
});

// model ka type btao kya h -> collection jo aaenge uska type kya h 
const User = mongoose.model<IUSER>("User", schema);
export default User;