import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import useRipple from '../hooks/useRipple';

export default function Layout() {
  const { pathname } = useLocation();
  useRipple();

  // Every page change starts at the top
  useEffect(() => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}, [pathname]);

  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
