import { useLocation, useSearchParams } from 'react-router-dom';
import { useAppData } from '../context/AppProvider'
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CgShoppingCart } from 'react-icons/cg';
import { BiMapPin, BiSearch } from 'react-icons/bi';

// useCallback vs useMemo
// useCallback memoises the function definition
// useMemo memoises the result value

const Navbar = () => {
    const { isAuth, city } = useAppData();
    const currLocation = useLocation();

    const isHomePage = (currLocation.pathname === "/");

    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || "");

    // debounce logic implemented 
    // it takes 400ms after typing to finally update the query parameter
    // so basically the timer is assigned an id
    // if a person types -> "hello"
    // after -> "h" -> a timer id is obtained
    // after 100ms, "e" is types, 
    const updateSearchParams = useCallback((value : string) => {
        if (value) {
            setSearchParams({ search: value });  
        } else {
            setSearchParams({});  
        }
    }, [setSearchParams]);
    /*
    GOOD TO KNOW
    React effect queue ek internal mechanism hai jo React useEffect callbacks ko batch aur schedule karta hai. Ye officially documented nahi hai lekin previous explanation ke context mein samjhaata hun:

    Effect Queue Kaam Kaise Karta Hai:
    text
    1. Component render hota hai
    2. useEffect callbacks collect hote hain "pending effects queue" mein  
    3. Browser repaint ke BAAD ye queue process hoti hai
    4. Har effect run hota hai (cleanup first, then effect)

    */

    // basically jaise hi searh change hua 
    // to pichle wale ka return function run hojaega jo effect queue mn store tha
    // aur yeh jb 400ms ka gap aaega sirf tbhi internal updateSearchParams fire hoga and URL change hojaega

    // in short -> 
    // Jab bhi naya render hoga aur useEffect ke dependencies change hongi, 
    // to pehle saare previous cleanup functions run honge, phir naya effect chalega.
    useEffect(() => {
        // immediately timerId return hojaati h aur code block nhi hota jaise vo baakio mn hota h 
        const timer = setTimeout(() => {
            updateSearchParams(search);
        }, 400)
        return ()=>clearTimeout(timer);
    }, [search, updateSearchParams]);


  return (
    <div className='w-full bg-white shadow-sm'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3'>
            <Link to = {"/"} className='text-2xl font-bold text-[#E23744] cursor-pointer'>Tomato</Link>
                    <div className='flex items-center gap-4'>
            <Link to = {"/cart"} className='relative'>
                <CgShoppingCart className='h-6 w-6 text-[#E23744]' />
                <span className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#E23744] text-xs font-semibold text-white'>0</span>
            </Link>
            
            {isAuth ? (
                <Link to = "/account" className='font-medium text-[#E23744]'>
                    Account
                </Link>
            ) : (
                <Link to = "/Login" className='font-medium text-[#E23744]'>
                    Login
                </Link>
            )}
            </div>
        </div>

        { /* Search Bar Implementation */}
        {
            isHomePage && (
                <div className='border-t px-4 py-3'>
                    <div className='mx-auto flex max-w-7xl items-center rounder-lg border shadow-sm'>
                        <div className='flex items-center text-gray-700 border-r px-3 gap-2'>
                            <BiMapPin className='h-4 w-4 text-[#E23744]' />
                            <span className='text-sm truncate max-w-35'>{city}</span>
                        </div>
                        <div className='flex items-center gap-2 px-3'>
                            <BiSearch className='h-4 w-4 text-gray-400' />
                            <input type="text" placeholder='Search for restaurant...' value = {search}
                            onChange={(e) => setSearch(e.target.value)} className='w-full py-2 text-sm outline-none'/>
                        </div>
                    </div>
                </div>
            )
        }
    </div>
  )
}

export default Navbar