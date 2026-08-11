import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGlassWhiskey, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import api from '../services/api';
import '../styles/Footer.css';

const Footer = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        const main = (res.data || []).filter((c) => !c.parentId);
        setCategories(main);
      })
      .catch(() => setCategories([]));
  }, []);

  return (
    <footer className="footer">
      <div className="footerContainer">
        {/* Brand Section */}
        <div className="footerBrandCol">
          <Link to="/home" className="footerLogo">
            <FaGlassWhiskey className="footerLogoIcon" />
            <span>Refresh<span className="logoTextGreen">Up</span></span>
          </Link>
          <p className="footerDescription">
            Providing premium organic cold-pressed wellness elixirs, hand-selected craft drinks, and gourmet roasted coffee delivered fresh to your doorstep.
          </p>
          <div className="socialIcons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="socialIcon"><FaFacebook /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="socialIcon"><FaTwitter /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="socialIcon"><FaInstagram /></a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="socialIcon"><FaLinkedin /></a>
          </div>
        </div>

        {/* Categories Column (fetched from API) */}
        <div className="footerLinksCol">
          <h4 className="footerTitle">Categories</h4>
          <ul className="footerLinksList">
            {categories.slice(0, 8).map((c) => (
              <li key={c.categoryId}>
                <Link to={`/home?category=${c.categoryId}`}>{c.categoryName}</Link>
              </li>
            ))}
            <li><Link to="/home">View All Products</Link></li>
          </ul>
        </div>

        {/* Quick Links / About Column */}
        <div className="footerLinksCol">
          <h4 className="footerTitle">Company</h4>
          <ul className="footerLinksList">
            <li><Link to="/home">Home</Link></li>
            <li><a href="#products">Beverage Menu</a></li>
            <li><a href="#why-choose-us">Why RefreshUp</a></li>
            <li><a href="#customer-reviews">Reviews</a></li>
          </ul>
        </div>

        {/* Contact Info Column */}
        <div className="footerLinksCol">
          <h4 className="footerTitle">Contact Info</h4>
          <ul className="footerContactList">
            <li>
              <FaMapMarkerAlt className="contactIcon" />
              <span>123 Beverage Blvd, Suite 100, Bengaluru, India</span>
            </li>
            <li>
              <FaPhone className="contactIcon" />
              <span>+91 98765 43210</span>
            </li>
            <li>
              <FaEnvelope className="contactIcon" />
              <span>support@refreshup.com</span>
            </li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="footerNewsCol">
          <h4 className="footerTitle">Newsletter</h4>
          <p className="newsletterText">Subscribe to receive updates on new products and exclusive subscriber-only deals.</p>
          <form className="newsletterForm" onSubmit={(e) => { e.preventDefault(); }}>
            <input type="email" placeholder="Email address" className="newsletterInput" required />
            <button type="submit" className="newsletterBtn">Subscribe</button>
          </form>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footerBottom">
        <div className="footerBottomContent">
          <p className="copyright">&copy; {new Date().getFullYear()} RefreshUp. All rights reserved.</p>
          <div className="bottomLinks">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
