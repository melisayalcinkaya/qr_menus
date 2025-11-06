// src/menus/Menu1/Menu1Layout.jsx
import React from "react";
import Menu1Navbar from "../../components/Navbar1/Navbar";
import { Outlet } from "react-router-dom";

const Menu1Layout = () => {
  return (
    <>
      <Menu1Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default Menu1Layout;
