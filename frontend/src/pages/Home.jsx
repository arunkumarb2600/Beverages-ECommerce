import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroSlider from '../components/HeroSlider';
import ProductCarousel from '../components/ProductCarousel';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import {
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaSortAmountDown,
  FaInfoCircle,
  FaChevronDown,
  FaShoppingCart,
  FaSpinner,
  FaLeaf,
  FaTruck,
  FaShieldAlt,
  FaHeadset,
  FaQuoteLeft,
  FaStar,
  FaRegStar
} from 'react-icons/fa';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import '../styles/Home.css';

const categoryEmoji = {
  1: '🥤',
  2: '🧃',
  3: '🍵',
  4: '☕',
  5: '💧',
  6: '⚡'
};

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { addToCart, openCartPreview, closeCart } = useContext(CartContext);
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const catalogRef = useRef(null);

  // Add-to-cart UX states
  const [addingProductId, setAddingProductId] = useState(null);
  const [flyingItems, setFlyingItems] = useState([]);
  const flyCounterRef = useRef(0);

  // Catalog States
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [expandedMainId, setExpandedMainId] = useState(null);

  // Pagination & Filtering & Sorting States
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLastPage, setIsLastPage] = useState(true);
  const pageSize = 8;

  const [sortOption, setSortOption] = useState('productName,asc');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [minPriceApplied, setMinPriceApplied] = useState('');
  const [maxPriceApplied, setMaxPriceApplied] = useState('');
  const [brandInput, setBrandInput] = useState('');
  const [brandApplied, setBrandApplied] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Home collection states (hero carousels, offers, reviews)
  const [bestSellers, setBestSellers] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [brands, setBrands] = useState([]);
  const [homeLoading, setHomeLoading] = useState(true);

  // Wishlist
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // UI States
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Derived: main categories + their subcategories
  const mainCategories = categories.filter((c) => !c.parentId);
  const subcategoriesOf = (mainId) => categories.filter((c) => c.parentId === mainId);

  const activeCategory = categories.find((c) => c.categoryId === activeCategoryId) || null;

  // Fetch static page elements on load (categories and featured products)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catResponse, featResponse] = await Promise.all([
          api.get('/categories'),
          api.get('/products/featured')
        ]);
        setCategories(catResponse.data);
        setFeaturedProducts(featResponse.data);
      } catch (error) {
        console.error('Error loading metadata:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch home collections (carousels, offers, reviews, brands) in parallel
  useEffect(() => {
    const fetchHomeCollections = async () => {
      try {
        const [best, trend, newArr, offersP, off, rev, br] = await Promise.all([
          api.get('/products/best-sellers'),
          api.get('/products/trending'),
          api.get('/products/new-arrivals'),
          api.get('/products/offers'),
          api.get('/offers'),
          api.get('/reviews/recent', { params: { limit: 6 } }),
          api.get('/products/brands')
        ]);
        setBestSellers(best.data || []);
        setTrending(trend.data || []);
        setNewArrivals(newArr.data || []);
        setOfferProducts(offersP.data || []);
        setOffers(off.data || []);
        setRecentReviews(rev.data || []);
        setBrands(br.data || []);
      } catch (error) {
        console.error('Error loading home collections:', error);
      } finally {
        setHomeLoading(false);
      }
    };
    fetchHomeCollections();
  }, []);

  // Load wishlist for the current user
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/wishlist')
      .then((res) => setWishlistIds(new Set((res.data || []).map((w) => w.productId))))
      .catch((err) => console.error('Error loading wishlist:', err));
  }, [isAuthenticated]);

  // Fetch paginated, filtered, and sorted catalog whenever filter criteria updates
  useEffect(() => {
    const fetchCatalog = async () => {
      setCatalogLoading(true);
      try {
        const [sortBy, sortDir] = sortOption === 'popularity' ? ['popularity', 'desc'] : sortOption.split(',');

        const params = {
          page: currentPage,
          size: pageSize,
          sortBy,
          sortDir,
          search: searchQuery || undefined,
          categoryId: activeCategoryId || undefined,
          minPrice: minPriceApplied || undefined,
          maxPrice: maxPriceApplied || undefined,
          brand: brandApplied || undefined,
          inStock: inStockOnly || undefined
        };

        const response = await api.get('/products/filter', { params });
        setProducts(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
        setIsLastPage(response.data.last);
      } catch (error) {
        console.error('Error loading catalog products:', error);
      } finally {
        setCatalogLoading(false);
      }
    };

    fetchCatalog();
  }, [currentPage, activeCategoryId, minPriceApplied, maxPriceApplied, brandApplied, inStockOnly, sortOption, searchQuery]);

  // Reset pagination on category, search, sort, or filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeCategoryId, minPriceApplied, maxPriceApplied, brandApplied, inStockOnly, sortOption, searchQuery]);

  // Auto-expand the main category of an active subcategory
  useEffect(() => {
    if (activeCategory && activeCategory.parentId) {
      setExpandedMainId(activeCategory.parentId);
    }
  }, [activeCategoryId]);

  // Honor ?category= deep links (e.g. from the footer category links)
  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam && categories.length > 0) {
      const id = Number(catParam);
      const target = categories.find((c) => c.categoryId === id);
      if (target) {
        setActiveCategoryId(id);
        setExpandedMainId(target.parentId || id);
      }
    }
  }, [searchParams, categories]);

  const handleSelectAll = () => {
    setActiveCategoryId(null);
    setExpandedMainId(null);
  };

  const handleMainCategoryClick = (main) => {
    setActiveCategoryId(main.categoryId);
    setExpandedMainId((prev) => (prev === main.categoryId ? null : main.categoryId));
  };

  const handleSubcategoryClick = (sub) => {
    setActiveCategoryId(sub.categoryId);
    setExpandedMainId(sub.parentId);
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleChipClick = (main) => {
    setActiveCategoryId(main.categoryId);
    setExpandedMainId(main.categoryId);
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleApplyPriceFilter = (e) => {
    e.preventDefault();
    setMinPriceApplied(minPriceInput);
    setMaxPriceApplied(maxPriceInput);
  };

  const handleClearPriceFilter = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    setMinPriceApplied('');
    setMaxPriceApplied('');
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

  // Shared add-to-cart handler with spinner, fly-to-cart animation, and drawer preview
  const handleAddToCart = async (bev, event, closeModal, qty = 1) => {
    if (bev.stock <= 0) return;
    const source = event?.currentTarget || null;
    setAddingProductId(bev.productId);

    if (source) {
      const cartBtn = document.querySelector('.cartToggleBtn');
      const start = source.getBoundingClientRect();
      const end = cartBtn ? cartBtn.getBoundingClientRect() : null;
      const id = ++flyCounterRef.current;
      setFlyingItems((prev) => [
        ...prev,
        {
          id,
          src: bev.imageUrl,
          startX: start.left + start.width / 2 - 24,
          startY: start.top + start.height / 2 - 24,
          endX: end ? end.left + end.width / 2 - 24 : window.innerWidth - 72,
          endY: end ? end.top + end.height / 2 - 24 : 40
        }
      ]);
    }

    const ok = await addToCart(bev.productId, qty);
    setAddingProductId(null);
    if (closeModal) closeModal();
    if (ok) openCartPreview();
  };

  const handleBuyNow = async (bev, qty = 1) => {
    if (bev.stock <= 0) return;
    setAddingProductId(bev.productId);
    const ok = await addToCart(bev.productId, qty);
    setAddingProductId(null);
    if (ok) {
      closeCart();
      navigate('/checkout');
    }
  };

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      showToast('Please login to save items to your wishlist', 'error');
      return;
    }
    const isWished = wishlistIds.has(productId);
    try {
      if (isWished) {
        await api.delete(`/wishlist/remove/${productId}`);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        showToast('Removed from wishlist');
      } else {
        await api.post(`/wishlist/add/${productId}`);
        setWishlistIds((prev) => new Set(prev).add(productId));
        showToast('Added to wishlist');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update wishlist', 'error');
    }
  };

  // Callback ref that launches the flying image toward the cart icon
  const flyRef = (node, item) => {
    if (!node) return;
    requestAnimationFrame(() => {
      node.style.transform = `translate(${item.endX - item.startX}px, ${item.endY - item.startY}px) scale(0.3)`;
    });
  };

  const clearFlyingItem = (id) => {
    setFlyingItems((prev) => prev.filter((f) => f.id !== id));
  };

  const scrollToCatalog = () => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToCategories = () => {
    const el = document.getElementById('categories');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="homeContainer">
        <Navbar />
        <div className="pageLoader">
          <div className="spinner"></div>
          Loading Refreshing Catalog...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="homeContainer">
      <Navbar />

      {/* Hero Slider (hidden when searching for cleaner focus) */}
      {!searchQuery && (
        <HeroSlider
          products={featuredProducts.length > 0 ? featuredProducts : newArrivals}
          onShopNow={scrollToCatalog}
          onBrowseCategories={scrollToCategories}
        />
      )}

      {/* Quick Category Chips (hidden while searching) */}
      {!searchQuery && mainCategories.length > 0 && (
        <section className="categoryChipsSection">
          <button
            className={`categoryChip ${!activeCategoryId ? 'categoryChipActive' : ''}`}
            onClick={handleSelectAll}
          >
            <span className="categoryChipEmoji">🛒</span>
            <span className="categoryChipName">All</span>
          </button>
          {mainCategories.map((main) => (
            <button
              key={main.categoryId}
              className={`categoryChip ${activeCategoryId === main.categoryId ? 'categoryChipActive' : ''}`}
              onClick={() => handleChipClick(main)}
            >
              <span className="categoryChipEmoji">{categoryEmoji[main.categoryId] || '🥤'}</span>
              <span className="categoryChipName">{main.categoryName}</span>
            </button>
          ))}
        </section>
      )}

      {/* Why Choose Us (hidden while searching) */}
      {!searchQuery && (
        <section id="why-choose-us" className="whyChooseUsSection">
          <div className="sectionHeader">
            <h2 className="sectionTitle">Why Choose RefreshUp?</h2>
            <p className="sectionSubtitle">Quality you can taste, service you can trust</p>
          </div>
          <div className="whyChooseGrid">
            <div className="whyCard">
              <div className="whyIconWrapper"><FaLeaf /></div>
              <h3>100% Fresh & Natural</h3>
              <p>Hand-picked ingredients, cold-pressed juices, and artisan brews with no artificial additives.</p>
            </div>
            <div className="whyCard">
              <div className="whyIconWrapper"><FaTruck /></div>
              <h3>Fast Doorstep Delivery</h3>
              <p>Lightning-fast delivery in temperature-controlled packaging to keep every sip perfectly chilled.</p>
            </div>
            <div className="whyCard">
              <div className="whyIconWrapper"><FaShieldAlt /></div>
              <h3>Quality Guaranteed</h3>
              <p>Every batch is lab-tested and quality-checked. Not satisfied? Get a full refund, no questions asked.</p>
            </div>
            <div className="whyCard">
              <div className="whyIconWrapper"><FaHeadset /></div>
              <h3>24/7 Customer Support</h3>
              <p>Our beverage experts are always available to help you pick the perfect drink for any occasion.</p>
            </div>
          </div>
        </section>
      )}

      {/* Horizontal Product Carousels (hidden while searching) */}
      {!searchQuery && (
        <>
          <div className="carouselsContainer">
            <ProductCarousel
              title="Best Sellers"
              subtitle="Most-loved drinks our customers reorder again and again"
              products={bestSellers}
              loading={homeLoading}
              onAdd={(bev, e, qty) => handleAddToCart(bev, e, null, qty)}
              onBuyNow={(bev, qty) => handleBuyNow(bev, qty)}
              onView={setSelectedProduct}
              addingProductId={addingProductId}
              wishlistIds={wishlistIds}
              onToggleWishlist={toggleWishlist}
            />

            <ProductCarousel
              title="Trending Now"
              subtitle="What everyone is drinking this week"
              products={trending}
              loading={homeLoading}
              onAdd={(bev, e, qty) => handleAddToCart(bev, e, null, qty)}
              onBuyNow={(bev, qty) => handleBuyNow(bev, qty)}
              onView={setSelectedProduct}
              addingProductId={addingProductId}
              wishlistIds={wishlistIds}
              onToggleWishlist={toggleWishlist}
            />

            <ProductCarousel
              title="New Arrivals"
              subtitle="Fresh from our shelves — be the first to try"
              products={newArrivals}
              loading={homeLoading}
              onAdd={(bev, e, qty) => handleAddToCart(bev, e, null, qty)}
              onBuyNow={(bev, qty) => handleBuyNow(bev, qty)}
              onView={setSelectedProduct}
              addingProductId={addingProductId}
              wishlistIds={wishlistIds}
              onToggleWishlist={toggleWishlist}
            />

            <ProductCarousel
              title="Today's Offers"
              subtitle="Beverages on special, straight from active deals"
              products={offerProducts}
              loading={homeLoading}
              onAdd={(bev, e, qty) => handleAddToCart(bev, e, null, qty)}
              onBuyNow={(bev, qty) => handleBuyNow(bev, qty)}
              onView={setSelectedProduct}
              addingProductId={addingProductId}
              wishlistIds={wishlistIds}
              onToggleWishlist={toggleWishlist}
            />
          </div>

          {/* Offer Promo Cards */}
          {offers.length > 0 && (
            <section className="offersPromoSection">
              <div className="sectionHeader">
                <h2 className="sectionTitle">Exclusive Deals</h2>
                <p className="sectionSubtitle">Grab these limited-time promotions before they run out</p>
              </div>
              <div className="offersPromoGrid">
                {offers.map((offer) => (
                  <div
                    key={offer.offerId}
                    className="offerPromoCard"
                    style={{
                      background: `linear-gradient(135deg, ${offer.gradientFrom || '#10b981'}, ${offer.gradientTo || '#0d9488'})`
                    }}
                    onClick={() => {
                      if (offer.categoryId) {
                        const target = categories.find((c) => c.categoryId === offer.categoryId) || null;
                        setActiveCategoryId(offer.categoryId);
                        setExpandedMainId(target ? target.parentId : offer.categoryId);
                        scrollToCatalog();
                      }
                    }}
                  >
                    <span className="offerBadge">{offer.badge || 'Limited Offer'}</span>
                    <h3 className="offerTitle">{offer.title}</h3>
                    <p className="offerSubtitle">{offer.subtitle}</p>
                    {offer.discountPercent != null && (
                      <div className="offerDiscountWrap">
                        <span className="offerDiscountText">Save {offer.discountPercent}%</span>
                        {offer.categoryId && <span className="offerShopLink">Shop now →</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Main Browse Catalog Section */}
      <section id="products" ref={catalogRef} className="catalogSection mainCatalogContainer">

        {/* Search header indicator */}
        {searchQuery && (
          <div className="searchHeaderRow">
            <h2 className="searchTitleText">
              <FaSearch className="searchTitleIcon" />
              Search Results for: <span className="searchQueryHighlight">"{searchQuery}"</span>
            </h2>
            <button onClick={handleClearSearch} className="clearSearchBtn">
              <FaTimes /> Clear Search
            </button>
          </div>
        )}

        <div className="catalogLayout">
          {/* Category Accordion Sidebar (hidden while searching) */}
          {!searchQuery && (
            <aside id="categories" className="categorySidebar">
              <div className="sidebarHeader">
                <h2 className="sidebarTitle">Browse Categories</h2>
                <button
                  onClick={handleSelectAll}
                  className={`allCategoriesBtn ${!activeCategoryId ? 'allCategoriesBtnActive' : ''}`}
                >
                  All Products
                </button>
              </div>

              <div className="categoryAccordion">
                {mainCategories.map((main) => {
                  const subs = subcategoriesOf(main.categoryId);
                  const isExpanded = expandedMainId === main.categoryId;
                  const isActive = activeCategoryId === main.categoryId;
                  return (
                    <div key={main.categoryId} className={`categoryItem ${isActive ? 'categoryItemActive' : ''}`}>
                      <button
                        className={`categoryItemHeader ${isActive ? 'categoryItemHeaderActive' : ''}`}
                        onClick={() => handleMainCategoryClick(main)}
                      >
                        <span className="categoryItemEmoji">{categoryEmoji[main.categoryId] || '🥤'}</span>
                        <span className="categoryItemName">{main.categoryName}</span>
                        <span className="categoryItemCount">{subs.length}</span>
                        <FaChevronDown className={`categoryItemChevron ${isExpanded ? 'categoryItemChevronOpen' : ''}`} />
                      </button>
                      {isExpanded && subs.length > 0 && (
                        <ul className="subcategoryList">
                          {subs.map((sub) => (
                            <li key={sub.categoryId}>
                              <button
                                className={`subcategoryItem ${activeCategoryId === sub.categoryId ? 'subcategoryItemActive' : ''}`}
                                onClick={() => handleSubcategoryClick(sub)}
                              >
                                <span className="subcategoryDot"></span>
                                {sub.categoryName}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>
          )}

          {/* Main Catalog Area */}
          <div className="catalogMain">
            {/* Active category header */}
            <div className="catalogHeading">
              <h2 className="catalogHeadingTitle">
                {searchQuery ? 'Results' : activeCategory ? activeCategory.categoryName : 'All Products'}
              </h2>
              <span className="catalogHeadingMeta">
                {totalElements} {totalElements === 1 ? 'item' : 'items'}
                {activeCategory ? ` in ${activeCategory.categoryName}` : ''}
              </span>
            </div>

            {/* Filter and Sorting Control Bar */}
            <div className="catalogControlBar">
              <div className="filterGroupWrap">
                <span className="controlLabel"><FaFilter /> Brand:</span>
                <select
                  value={brandInput}
                  onChange={(e) => {
                    setBrandInput(e.target.value);
                    setBrandApplied(e.target.value);
                  }}
                  className="sortSelect"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <label className="inStockToggle" title="Show only in-stock items">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span>In Stock Only</span>
              </label>

              <form onSubmit={handleApplyPriceFilter} className="priceFilterForm">
                <span className="controlLabel"><FaFilter /> Price:</span>
                <input
                  type="number"
                  placeholder="Min (₹)"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="filterPriceInput"
                />
                <span className="inputSeparator">-</span>
                <input
                  type="number"
                  placeholder="Max (₹)"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="filterPriceInput"
                />
                <button type="submit" className="applyFilterBtn">Apply</button>
                {(minPriceApplied || maxPriceApplied) && (
                  <button type="button" onClick={handleClearPriceFilter} className="clearFilterBtn">Clear</button>
                )}
              </form>

              <div className="sortSelectorWrapper">
                <span className="controlLabel"><FaSortAmountDown /> Sort:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="sortSelect"
                >
                  <option value="popularity">Popularity</option>
                  <option value="productName,asc">Name: A to Z</option>
                  <option value="productName,desc">Name: Z to A</option>
                  <option value="price,asc">Price: Low to High</option>
                  <option value="price,desc">Price: High to Low</option>
                  <option value="createdAt,desc">New Arrivals</option>
                </select>
              </div>
            </div>

            {/* Grid Loading or Content display */}
            {catalogLoading ? (
              <div className="productsGrid">
                {Array.from({ length: pageSize }).map((_, i) => <ProductCardSkeleton key={`sk-${i}`} />)}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="productsGrid">
                  {products.map((bev) => (
                    <ProductCard
                      key={bev.productId}
                      product={bev}
                      adding={addingProductId === bev.productId}
                      onAdd={(e, qty) => handleAddToCart(bev, e, null, qty)}
                      onBuyNow={(qty) => handleBuyNow(bev, qty)}
                      onView={() => setSelectedProduct(bev)}
                      wishlisted={wishlistIds.has(bev.productId)}
                      onToggleWishlist={toggleWishlist}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="paginationContainer">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                      disabled={currentPage === 0}
                      className="paginateBtn"
                    >
                      <FaChevronLeft /> Previous
                    </button>

                    <span className="paginationInfo">
                      Page <span className="bold">{currentPage + 1}</span> of <span className="bold">{totalPages}</span>
                    </span>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                      disabled={isLastPage}
                      className="paginateBtn"
                    >
                      Next <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="emptyCatalogState">
                <FaInfoCircle className="emptyCatalogIcon" />
                <h3>No Beverages Found</h3>
                <p>We couldn't find any drinks matching your selected filters. Try resetting your filters or category selection.</p>
                <button
                  onClick={() => { handleClearPriceFilter(); handleClearSearch(); handleSelectAll(); setBrandInput(''); setBrandApplied(''); setInStockOnly(false); }}
                  className="heroBtn mt-4"
                >
                  Reset Catalog Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section (hidden while searching) */}
      {!searchQuery && (
        <section id="customer-reviews" className="reviewsSection">
          <div className="sectionHeader">
            <h2 className="sectionTitle">What Our Customers Say</h2>
            <p className="sectionSubtitle">Real reviews from verified buyers</p>
          </div>
          {recentReviews.length > 0 ? (
            <div className="reviewsGrid">
              {recentReviews.map((review) => (
                <div key={review.reviewId} className="testimonialCard">
                  <FaQuoteLeft className="testimonialQuoteIcon" />
                  <div className="testimonialStars">
                    {[1, 2, 3, 4, 5].map((s) =>
                      s <= review.rating ? <FaStar key={s} className="starFilled" /> : <FaRegStar key={s} className="starEmpty" />
                    )}
                  </div>
                  <p className="testimonialText">"{review.comment}"</p>
                  <div className="testimonialAuthor">
                    <div className="testimonialAvatar">{review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}</div>
                    <div>
                      <p className="testimonialName">{review.userName}</p>
                      <p className="testimonialProduct">on {review.productName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="reviewsEmpty">No reviews yet — be the first to review a product!</p>
          )}
        </section>
      )}

      {/* Product Details Modal Component */}
      {selectedProduct && (
        <div className="productModalOverlay" onClick={() => setSelectedProduct(null)}>
          <div className="productModalContent" onClick={(e) => e.stopPropagation()}>
            <button className="modalCloseBtn" onClick={() => setSelectedProduct(null)}>
              <FaTimes />
            </button>

            <div className="modalGrid">
              <div className="modalLeft">
                <div className="modalImageContainer">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      className="productImg"
                      alt={selectedProduct.productName}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="productIcon modalFallbackIcon">🥤</span>
                  )}
                </div>
              </div>
              <div className="modalRight">
                <span className="modalCategoryTag">{selectedProduct.categoryName}</span>
                <h2 className="modalProductName">{selectedProduct.productName}</h2>
                <p className="modalBrandName">By {selectedProduct.brand}</p>

                <div className="modalDivider"></div>

                <p className="modalDescription">
                  {selectedProduct.description || 'Enjoy a perfectly mixed, curated recipe made from pure hand-selected ingredients. No artificial colors or preservatives. Rich flavor elixirs prepared daily for optimal wellness benefits.'}
                </p>

                <div className="modalMetaRow">
                  <div className="modalMetaItem">
                    <span className="metaLabel">Availability:</span>
                    <span className={`metaValue stockPill ${selectedProduct.stock <= 0 ? 'out' : selectedProduct.stock < 20 ? 'low' : 'ok'}`}>
                      {selectedProduct.stock <= 0 ? 'Out of Stock' : `${selectedProduct.stock} units available`}
                    </span>
                  </div>
                </div>

                <div className="modalFooter">
                  <div className="modalPriceBlock">
                    <span className="priceLabel">Unit Price</span>
                    <span className="modalPriceText">{formatPrice(selectedProduct.price)}</span>
                  </div>
                  <button
                    className="modalOrderBtn"
                    disabled={selectedProduct.stock <= 0 || addingProductId === selectedProduct.productId}
                    onClick={(e) => {
                      handleAddToCart(selectedProduct, e, () => setSelectedProduct(null), 1);
                    }}
                  >
                    {addingProductId === selectedProduct.productId ? <FaSpinner className="btnSpinner" /> : <FaShoppingCart />} {selectedProduct.stock <= 0 ? 'Sold Out' : 'Add to Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fly-to-cart animation overlays */}
      {flyingItems.map((f) => (
        <img
          key={f.id}
          ref={(node) => flyRef(node, f)}
          src={f.src || 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=120'}
          className="flyToCartImg"
          style={{ left: f.startX, top: f.startY }}
          alt=""
          onTransitionEnd={() => clearFlyingItem(f.id)}
        />
      ))}

      <Footer />
    </div>
  );
};

export default Home;
