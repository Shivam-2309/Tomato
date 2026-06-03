import mongoose, { Schema, Document } from "mongoose";

export interface IRestaurantLike extends Document {
  userId: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IRestaurantLike>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

schema.index(
  {
    userId: 1,
    restaurantId: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model<IRestaurantLike>("RestaurantLike", schema);
