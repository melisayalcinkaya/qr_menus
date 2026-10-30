// src/menus/Menu1/Menu1Layout.jsx
import React from "react";
import Menu2Navbar from "../../components/Navbar2/BottomNavBar";
import { Outlet } from "react-router-dom";

const Menu2Layout = () => {
  return (
    <>
      <Menu2Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default Menu2Layout;
