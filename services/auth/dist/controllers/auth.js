import User from "../model/user.js";
import jwt from "jsonwebtoken";
import TryCatch from "../middleware/TryCatch.js";
// It is wrapped in a TryCatch block because, the function body has async operations
// these operations can throw errors, and express does not inherently hndle these errors well.
// in order to protect such promise rejection i need to have a mechanism 
// one way is to mannually write try catch for every await -> but this is too code consuming
// so better alternative is to write a middleware for it so that every request that comes is first treated here only.
export const loginUser = TryCatch(async (req, res) => {
    const { email, name, picture } = req.body;
    var user = await User.findOne({ email });
    if (!user) {
        // create that user
        user = await User.create({
            name: name,
            email: email,
            image: picture,
        });
    }
    // sign that user 
    const token = jwt.sign({ user }, process.env.JWT_SEC, {
        expiresIn: "15d",
    });
    res.status(200).json({
        message: "Loggin in successfully",
        token: token,
        user,
    });
});
