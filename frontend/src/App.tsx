import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';
import PublicRoute from './components/publicRoute';
import ProtectedRoute from './components/protectedRoute';
import Home from './pages/Home';
import SelectRole from './pages/SelectRole';
import Navbar from './components/navbar';
import Account from './pages/Account';

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route element = {<PublicRoute/>}>
            <Route path = "/login" element = {<Login />} />
          </Route>
          <Route element = {<ProtectedRoute/>}>
            <Route path = "/" element = {<Home />} />
            <Route path = "/select-role" element = {<SelectRole />} />
            <Route path = "/account" element = {<Account />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </>
  )
}

export default App