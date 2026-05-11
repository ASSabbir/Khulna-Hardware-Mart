
import { Outlet } from 'react-router-dom';
import Nav from './Components/Nav';
import Footer from './Components/Footer';


const Root = () => {
    return (
        <div className='min-h-screen flex flex-col'>
            <Nav></Nav>
            <Outlet></Outlet>
            <Footer></Footer>
        </div>
    ); 
};

export default Root;