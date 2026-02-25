import mongoose, { Schema, Document } from 'mongoose'

export interface IRestaurant {
    name : string, 
    description?: string, 
    image : string, 
    ownerId : string, 
    phone : number, 
    isVerified : boolean,

    autoLocation : {
        // isme ek type h aur uska type h Point which is an Enum
        type : "Point", 
        coordinates : [number, number], 
        formattedAddress : string, 
    };

    isOpen : boolean, 
    createdAt : Date;
};

const schema = new Schema<IRestaurant>({
    name : {
        type : String, 
        required : true, 
        trim : true, 
    },
    description : String, 
    image : {
        type : String, 
        required : true, 
    },
    ownerId : {
        type : String, 
        required : true, 
    },
    phone : {
        type : Number, 
        required : true, 
    },
    isVerified : {
        type : Boolean, 
        required : true, 
    },
    autoLocation : {
        type : {
            type : String, 
            // type ko lock krne ke liye taaki koi galat format naa aajaye
            enum : ["Point"], 
            required : true, 
        }, 
        coordinates : {
            type : [Number], 
            required : true, 
        },
        formattedAddress : {
            type : String, 
        }
    },
    isOpen : {
        type : Boolean, 
        default : false, 
    }
}, {
        timestamps : true, 
});

schema.index({autoLocation : "2dsphere"});
export default mongoose.model<IRestaurant>("Restaurant", schema);