import React from "react";
import { FaSearch } from "react-icons/fa";
import "../SearchBar1/SearchBar.css";

const SearchBar = ({ onSearchChange }) => {
  const handleChange = (e) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="search-wrapper">
      <div className="search-bar-1">
        <div className="search-icon-1">
          <FaSearch />
        </div>
        <input
          type="text"
          className="search-input-1"
          placeholder="What would you like to eat?"
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default SearchBar;
