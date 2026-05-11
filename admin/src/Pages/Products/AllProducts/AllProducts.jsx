import React from 'react';
import ProductsShow from './ProductsShow';

const AllProducts = () => {
    return (
        <div>
            All Products List, where you can see all the products available in your inventory, along with their details and stock levels.
            <ProductsShow></ProductsShow>
        </div>
    );
};

export default AllProducts;