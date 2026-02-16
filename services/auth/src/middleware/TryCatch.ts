import {Request, Response, RequestHandler, NextFunction} from 'express'

// I want that any async operation doing file should be wrapped with this middleware because otherwise everytime i need to define the
// type of NextResponse NextRequest and the handler.
const TryCatch = (handler : RequestHandler) : RequestHandler => {
    return async (req : Request, res : Response, next : NextFunction) => {
        try {
            await handler(req, res, next);
        }catch(err : any){
            // internal server error
            res.status(500).json({
                message: err.message,
            })
        }   
    }
}

export default TryCatch;