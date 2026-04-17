import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Chatbot from './Chatbot';
import { Toaster } from '../ui/sonner';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <Footer />
      <Chatbot />
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Layout;
