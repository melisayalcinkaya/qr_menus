// import { useSearchParams, useLocation } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import Menu1 from '../menus/Menu1/CategoryPage/CategoryPage';
// import Menu2 from '../menus/Menu2/CategoriesPage/CategoriesPage';
// import Menu3 from '../menus/Menu3/HomePage/HomePage';

// const MenuRouter = () => {
//   const [searchParams] = useSearchParams();
//   const [business, setBusiness] = useState(null);

//   const businessSlug = searchParams.get('business'); // query'den al
//   const location = useLocation();
//   const path = location.pathname.replace('/', ''); // örn: "menu1", "menu2", "menu3"

//   useEffect(() => {
//     if (!businessSlug) return;
//     axios.get(`http://localhost:8000/api/businesses/${businessSlug}/`)
//       .then(res => setBusiness(res.data))
//       .catch(err => console.error("İşletme bulunamadı", err));
//   }, [businessSlug]);

//   if (!business) return <div>Yükleniyor...</div>;

//   if (path === 'menu1') return <Menu1 />;
//   if (path === 'menu2') return <Menu2 />;
//   if (path === 'menu3') return <Menu3 />;

//   return <div>Geçersiz menü seçimi</div>;
// };

// export default MenuRouter;
