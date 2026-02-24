import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';
import PublicRoute from './components/publicRoute';
import ProtectedRoute from './components/protectedRoute';
import Home from './pages/Home';
import SelectRole from './pages/SelectRole';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element = {<PublicRoute/>}>
            <Route path = "/login" element = {<Login />} />
          </Route>
          <Route element = {<ProtectedRoute/>}>
            <Route path = "/" element = {<Home />} />
            <Route path = "/select-role" element = {<SelectRole />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </>
  )
}

export default App