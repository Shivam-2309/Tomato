import multer from 'multer';
// agr server pr hi upload krna hota -> multr.discstorage
// agr cloud pr krna h -> multer.memoryStorage
const storage = multer.memoryStorage();
const uploadFile = multer({ storage }).single("file");
export default uploadFile;
