import { BrowserRouter, Routes, Route } from "react-router-dom";

import Menu1Layout from "./menus/Menu1/Menu1Layout";
import Menu1CategoryPage from "./menus/Menu1/CategoryPage/CategoryPage";
import Menu1ProductsPage from "./menus/Menu1/ProductsPage/ProductsPage";
import Menu1CommentPage from "./menus/Menu1/CommentPage/CommentPage"; 

import Menu2Layout from "./menus/Menu2/Menu2Layout";
import Menu2CategoriesPage from "./menus/Menu2/CategoriesPage/CategoriesPage";
import Menu2ProductsPage from "./menus/Menu2/CategoryProductPage/CategoryProductPage";
import Menu2CommentPage from "./menus/Menu2/Menu2CommentsPage/Menu2CommentsPage";
import Menu2MakeCommentPage from "./menus/Menu2/MakeCommentPage/MakeCommentPage";

import Menu3Layout from "./menus/Menu3/Menu3Layout";
import Menu3HomePage from "./menus/Menu3/HomePage/HomePage";
import Menu3CommentPage from "./menus/Menu3/Menu3CommentPage/Menu3CommentPage";

import AdminDashboardLayout from "./admin/AdminDashboardLayout";
import AdminLogin from "./admin/Login";
import AdminRegister from "./admin/Register";
import AdminDashboard from "./admin/Dashboard";
import AdminBusinessPage from "./admin/BusinessPage";
import AdminCategoriesPage from "./admin/CategoriesPage";
import AdminProductsPage from "./admin/ProductsPage";
import AdminCommentsPage from "./admin/CommentsPage";
import AdminWiFiSettingsPage from "./admin/WiFiSettingsPage";
import WaiterCallsPage from "./admin/WaiterCallsPage";
import QrCode from "./admin/QrCode";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Menu1 */}
        <Route path="/menu1" element={<Menu1Layout />}>
          <Route index element={<Menu1CategoryPage />} />
          <Route path="categories/:categoryId" element={<Menu1ProductsPage />} />
          <Route path="comments" element={<Menu1CommentPage />} />
        </Route>

        {/* Menu2 */}
        <Route path="/menu2" element={<Menu2Layout />}>
          <Route index element={<Menu2CategoriesPage />} />
          <Route path="categories/:categoryId" element={<Menu2ProductsPage />} />
          <Route path="comments" element={<Menu2CommentPage />} />
          <Route path="make-comment" element={<Menu2MakeCommentPage />} />
        </Route>
        
        {/* Menu3 */}
        <Route path="/menu3" element={<Menu3Layout />}>
          <Route index element={<Menu3HomePage />} />
          <Route path="comments" element={<Menu3CommentPage />} />
        </Route>


        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin/dashboard" element={<AdminDashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="business" element={<AdminBusinessPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path=":businessSlug/products" element={<AdminProductsPage />} />
          <Route path="comments" element={<AdminCommentsPage />} />
          <Route path="wifi" element={<AdminWiFiSettingsPage />} />
          <Route path="qr" element={<QrCode />} />
          <Route path=":businessSlug/waiter-calls" element={<WaiterCallsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
