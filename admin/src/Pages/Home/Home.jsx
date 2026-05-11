import React from 'react';

import Products from './Products';
import Why from './Why';
import Slider from './Slider';
import Partners from './Partners';
import Contact from './Contact';

const Home = () => {
    return (
        <div>
            {/* <Banner></Banner> */}
            <Slider></Slider>
            <Products></Products>
            <Why></Why>
            <Partners></Partners>
            <Contact></Contact>
            
        </div>
    );
};

export default Home;