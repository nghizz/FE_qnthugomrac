import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/home";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import NotFound from "./pages/notfound";

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/ban-do" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<NotFound />} /> {/* Trang 404 */}
    </Routes>
  );
};

export default AppRouter;