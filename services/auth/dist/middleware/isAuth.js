import jwt from 'jsonwebtoken';
;
// this is a middleware which validated an isAuth functionality and then return a promise with no return value
export const isAuth = async (req, res, next) => {
    try {
        // 1:17:25
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                message: "Please login - No Auth header",
            });
            return;
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            // no token found
            res.status(401).json({
                message: "Please login - Token missing",
            });
            return;
        }
        const decodedValue = jwt.verify(token, process.env.JWT_SEC);
        if (!decodedValue || !decodedValue.user) {
            // Token found but not correct
            res.status(401).json({
                message: "Please login - Token not right",
            });
            return;
        }
        req.user = decodedValue.user;
        next();
    }
    catch (err) {
        res.status(500).json({
            message: "Please Login - Jwt Error",
        });
    }
};
