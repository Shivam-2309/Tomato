import TryCatch from "../middlewares/trycatch.js";
import Address from "../models/Address.js";
export const addAddress = TryCatch(async (req, res) => {
    const user = req.user;
    console.log("USER: ", user);
    if (!user) {
        return res.status(401).json({
            message: "Please login to add address.",
        });
    }
    const { mobile, formattedAddress, latitude, longitude } = req.body;
    if (!mobile ||
        !formattedAddress ||
        latitude === undefined ||
        longitude === undefined) {
        return res.status(400).json({
            message: "Please give all fields.",
        });
    }
    const newAddress = await Address.create({
        userId: user._id.toString(),
        mobile,
        formattedAddress,
        location: {
            type: "Point",
            coordinates: [Number(latitude), Number(longitude)],
        },
    });
    return res.status(200).json({
        message: "The new address is successfully added",
        addredd: newAddress,
    });
});
export const deleteAddress = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            message: "Please login to delete the current address",
        });
    }
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({
            message: "Id is required",
        });
    }
    const address = Address.findOne({
        _id: id,
        userId: user._id.toString(),
    });
    if (!address) {
        res.status(404).json({
            message: "Address not found!",
        });
    }
    await address.deleteOne();
    return res.status(200).json({
        message: "Address has been deleted successfully",
    });
});
export const getMyAddress = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            message: "Please login to delete the current address",
        });
    }
    const addresses = await Address.find({
        userId: user._id.toString(),
    }).sort({
        createdAt: -1,
    });
    res.json(addresses);
});
