// src/menus/Menu1/Menu1Layout.jsx
import React from "react";
import Menu3Navbar from "../../components/Navbar3/Menu3Navbar";
import { Outlet } from "react-router-dom";

const Menu3Layout = () => {
  return (
    <>
      <Menu3Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default Menu3Layout;
