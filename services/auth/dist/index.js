import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoute from './routes/auth.js';
import cors from 'cors';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
// this middleware is redirecting every request of the form of /api/auth to authRoute this way the authRoute does not need to write it the way that
// app.post('/api/auth/login')
// app.post('/api/auth/hello') -> this way it is very messy
// ab bs yeh middleware h jo request ko aage transfer kr rha h
// routes group mn vo saare routes defined h jo fianlly mere API endpoints h jahan se sb kuch fetch ho rha h
app.use('/api/auth', authRoute);
app.listen(PORT, () => {
    console.log(`Auth service is running on port ${PORT}`);
    connectDB();
});
// CommonJS vs ESM Modules ?
// what problem is had we are solving ->
// normal JS files uses global context in the Node enviroment, this means that if i write var x = "a", then this variable is available
// across my different files, now this can create global pollution, and we problem of value over riding is inevitable to avoid
// how to solve them ?
// people say that function scopes themselves, this means that if a variable is scoped in the function, then it is not in the global context
// this means that we ca use something called as IIFE -> Immediately invokded function expressions
// this is a function which is immediately invoked in order to reduce global pollution
// (() => {})() -> invoke the function immediately only okay
// but this is replaced by two concepts which are the commonJS and the ESM modules(relatively newer)
// CommonJS se import kre huye modules synchornously load hote h
// ECMA(ES6) modules async tareeke se load krte h -> better way 
// ECMA(ES6) modules import vagerah use krte h aur commonJS se import kre huye modules require() use krte h 
