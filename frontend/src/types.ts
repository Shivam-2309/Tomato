export interface User {
    _id : string,
    name : string, 
    email : string, 
    picture : string, 
    role : string,
};

export interface LocationData{
    latitude : number, 
    longitude : number,
    formattedAddress : string,
};

export interface AppContextType {
    user : User | null,
    loading : Boolean,
    isAuth : Boolean, 
    setUser : React.Dispatch<React.SetStateAction<User | null>>,
    setIsAuth : React.Dispatch<React.SetStateAction<boolean>>,
    setLoading : React.Dispatch<React.SetStateAction<boolean>>,
};