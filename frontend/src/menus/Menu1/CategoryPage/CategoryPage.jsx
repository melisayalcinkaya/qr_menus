import React, { useState } from 'react';
import SearchBar from "../../../components/SearchBar1/SearchBar";
import CategoryPageCard from "../../../components/CategoryPageCard/CategoryPageCard";
import './CategoryPage.css';

const CategoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className='category-page-menu1'>
      <SearchBar onSearchChange={setSearchTerm} />
      <CategoryPageCard searchTerm={searchTerm} />
    </div>
  );
};

export default CategoryPage;