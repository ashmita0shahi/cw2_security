import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Collapse } from 'reactstrap';

const MobileMenu = ({ menus = [] }) => {
  const [isMenuShow, setIsMenuShow] = useState(false);
  const [isOpen, setIsOpen] = useState(null);

  // Toggle for mobile menu visibility
  const handleMenuToggle = () => {
    setIsMenuShow(!isMenuShow);
  };

  // Toggle for submenu visibility
  const handleSubmenuToggle = (id) => () => {
    setIsOpen(isOpen === id ? null : id);
  };

  // Scroll to top functionality
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-white transform transition-transform duration-300 ease-in-out ${
          isMenuShow ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-600 text-xl"
          onClick={handleMenuToggle}
        >
          Close
        </button>

        {/* Menu List */}
        <ul className="space-y-4 p-6">
          {menus.map((item) => (
            <li key={item.id} className="text-gray-700">
              {/* Menu Item with or without Submenu */}
              {item.submenu ? (
                <div
                  onClick={handleSubmenuToggle(item.id)}
                  className="flex items-center cursor-pointer"
                >
                  <span>{item.title}</span>
                  <i
                    className={`ml-2 transition-transform ${
                      isOpen === item.id ? 'rotate-90' : ''
                    } fa fa-angle-right`}
                  ></i>
                </div>
              ) : (
                <Link
                  to={item.link}
                  className="hover:text-blue-600"
                  onClick={handleScrollToTop}
                >
                  {item.title}
                </Link>
              )}

              {/* Submenu Items */}
              {item.submenu && (
                <Collapse isOpen={isOpen === item.id}>
                  <ul className="ml-4 space-y-2">
                    {item.submenu.map((submenu) => (
                      <li key={submenu.id}>
                        <Link
                          to={submenu.link}
                          className="hover:text-blue-600"
                          onClick={handleScrollToTop}
                        >
                          {submenu.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Collapse>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Menu Toggle Button */}
      <button
        className="text-gray-700 text-xl fixed top-4 left-4"
        onClick={handleMenuToggle}
      >
        <i className="fa fa-bars"></i>
      </button>
    </div>
  );
};

export default MobileMenu;
