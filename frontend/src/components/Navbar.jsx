import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { FaGlassWhiskey, FaHome, FaCoffee, FaSignOutAlt, FaSearch, FaUserShield, FaShoppingCart, FaTags, FaBoxOpen, FaTimes } from 'react-icons/fa';
import CartDrawer from './CartDrawer';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount, cartBump, isCartOpen, openCart, closeCart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cartBtnAnimate, setCartBtnAnimate] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const searchBoxRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync search input with URL search parameter
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchTerm(q);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [searchParams]);

  // Close suggestion dropdown when clicking outside
  useEffect(() => {
    const onClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Bounce + highlight the cart icon whenever an item is added
  useEffect(() => {
    if (cartBump === 0) return;
    setCartBtnAnimate(true);
    const t = setTimeout(() => setCartBtnAnimate(false), 1200);
    return () => clearTimeout(t);
  }, [cartBump]);

  const handleLogout = () => {
    logout();
    setIsUserDropdownOpen(false);
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      navigate(`/home?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/home');
    }
  };

  // Live search suggestions (matches product name, brand, and category names via the backend filter)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await api.get('/products/filter', {
          params: { search: value.trim(), page: 0, size: 6 }
        });
        setSuggestions(response.data.content || []);
        setShowSuggestions(true);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleSuggestionClick = (product) => {
    setSearchTerm(product.productName);
    setShowSuggestions(false);
    navigate(`/home?search=${encodeURIComponent(product.productName)}`);
  };

  const scrollToHomeSection = (id) => {
    if (location.pathname !== '/home') {
      navigate('/home');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="navbar">
      {/* Brand logo */}
      <Link to="/home" className="navLogo">
        <FaGlassWhiskey className="logoIcon" />
        <span>Refresh<span className="logoTextGreen">Up</span></span>
      </Link>

      {/* Search Input Form in the middle */}
      <form onSubmit={handleSearchSubmit} className="navSearchForm" ref={searchBoxRef}>
        <div className="searchBarWrapper">
          <input
            type="text"
            placeholder="Search beverages, brands, categories..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="navSearchInput"
          />
          {searchLoading && <span className="searchInlineSpinner" />}
          {searchTerm && (
            <button type="button" className="searchClearBtn" onClick={() => { setSearchTerm(''); setSuggestions([]); setShowSuggestions(false); }} aria-label="Clear search">
              <FaTimes />
            </button>
          )}
          <button type="submit" className="searchBtn">
            <FaSearch />
          </button>
        </div>

        {/* Live search suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="searchSuggestionsDropdown">
            {suggestions.map((p) => (
              <button
                type="button"
                key={p.productId}
                className="searchSuggestionItem"
                onClick={() => handleSuggestionClick(p)}
              >
                <img
                  src={p.imageUrl || 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=60'}
                  alt={p.productName}
                  className="suggestionImg"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="suggestionMeta">
                  <span className="suggestionName">{p.productName}</span>
                  <span className="suggestionSub">{p.brand} • {p.categoryName}</span>
                </div>
                <span className="suggestionPrice">{formatPrice(p.price)}</span>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Right nav actions */}
      <div className="navRight">
        <ul className="navLinks">
          <li>
            <Link
              to="/home"
              className={`navLink ${location.pathname === '/home' && !searchParams.get('search') ? 'navLinkActive' : ''}`}
            >
              <FaHome /> Home
            </Link>
          </li>
          <li>
            <button type="button" className="navLink navLinkBtn" onClick={() => scrollToHomeSection('categories')}>
              <FaTags /> Categories
            </button>
          </li>
          {user && (
            <li>
              <Link to="/orders" className={`navLink ${location.pathname === '/orders' ? 'navLinkActive' : ''}`}>
                <FaBoxOpen /> My Orders
              </Link>
            </li>
          )}
          {user && user.role === 'ADMIN' && (
            <li>
              <Link
                to="/admin"
                className={`navLink ${location.pathname === '/admin' ? 'navLinkActive' : ''}`}
              >
                <FaUserShield /> Admin
              </Link>
            </li>
          )}
          <li>
            <a href="#products" className="navLink">
              <FaCoffee /> Products
            </a>
          </li>
        </ul>

        {/* Dynamic Cart Button Icon */}
        {user && (
          <button
            className={`cartToggleBtn ${cartBtnAnimate ? 'cartToggleBtnAnimate' : ''}`}
            onClick={openCart}
            title="View Cart"
          >
            <FaShoppingCart />
            {cartCount > 0 && <span className="cartBadge cartBadgeAnimate">{cartCount}</span>}
          </button>
        )}

        {/* User Account Dropdown */}
        {user ? (
          <div className="navUserDropdownWrapper">
            <button
              className="navUserBtn"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            >
              <span className="welcomeText">Hello, <span className="userName">{user.name.split(' ')[0]}</span></span>
              <span className="dropdownArrow">▼</span>
            </button>
            {isUserDropdownOpen && (
              <div className="userDropdownMenu">
                <Link to="/orders" className="dropdownItem" onClick={() => setIsUserDropdownOpen(false)}>My Orders</Link>
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="dropdownItem" onClick={() => setIsUserDropdownOpen(false)}>Admin Dashboard</Link>
                )}
                <button onClick={handleLogout} className="dropdownItem logoutItem">
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/" className="loginLink">Sign In</Link>
        )}
      </div>

      {/* Cart Drawer Component */}
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </nav>
  );
};

export default Navbar;
