import React, { useState } from 'react';
import { FaShoppingCart, FaBolt, FaEye, FaHeart, FaRegHeart, FaStar, FaRegStar, FaMinus, FaPlus, FaGlassWhiskey, FaSpinner } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';

const RatingStars = ({ average, count }) => {
  const avg = average ? Math.round(Number(average)) : 0;
  return (
    <div className="ratingRow">
      <div className="starsRow">
        {[1, 2, 3, 4, 5].map((s) =>
          s <= avg ? <FaStar key={s} className="starFilled" /> : <FaRegStar key={s} className="starEmpty" />
        )}
      </div>
      {count > 0 && <span className="ratingCount">{Number(average).toFixed(1)} ({count})</span>}
    </div>
  );
};

const ProductCard = ({ product, adding = false, onAdd, onBuyNow, onView, wishlisted = false, onToggleWishlist }) => {
  const [qty, setQty] = useState(1);
  const stock = product.stock ?? 0;
  const outOfStock = stock <= 0;

  const increment = () => setQty((q) => Math.min(q + 1, Math.max(stock, 1)));
  const decrement = () => setQty((q) => Math.max(q - 1, 1));

  const renderImage = () => {
    if (product.imageUrl) {
      return (
        <img
          src={product.imageUrl}
          className="productImg"
          alt={product.productName}
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    return <FaGlassWhiskey className="productIcon" style={{ color: '#94a3b8' }} />;
  };

  return (
    <div className="productCard">
      <div className="productImageWrapper">
        {renderImage()}
        {outOfStock ? (
          <span className="stockBadge stockOut">Out of Stock</span>
        ) : stock < 20 ? (
          <span className="stockBadge stockLow">Only {stock} left</span>
        ) : (
          <span className="stockBadge stockOk">In Stock</span>
        )}
        {product.isFeatured && <span className="productTag">Featured</span>}
        <button
          className={`wishlistHeartBtn ${wishlisted ? 'wishlistHeartActive' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) onToggleWishlist(product.productId);
          }}
          title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          {wishlisted ? <FaHeart /> : <FaRegHeart />}
        </button>
      </div>

      <div className="productInfo">
        {product.brand && <span className="productBrand">{product.brand}</span>}
        <span className="productCategory">{product.categoryName}</span>
        <h3 className="productName">{product.productName}</h3>
        <RatingStars average={product.averageRating} count={product.reviewCount} />

        <div className="productFooter">
          <span className="productPrice">{formatPrice(product.price)}</span>
          <div className="productActions">
            <button className="viewBtn" onClick={onView} title="View Details">
              <FaEye />
            </button>
          </div>
        </div>

        <div className="cardQtyAddRow">
          <div className="cardQtySelector">
            <button type="button" className="qtyBtn" onClick={decrement} disabled={qty <= 1} aria-label="Decrease quantity">
              <FaMinus />
            </button>
            <span className="qtyValue">{qty}</span>
            <button type="button" className="qtyBtn" onClick={increment} disabled={outOfStock || qty >= stock} aria-label="Increase quantity">
              <FaPlus />
            </button>
          </div>
          <button
            className="buyBtn addToCartBtn"
            disabled={outOfStock || adding}
            onClick={(e) => onAdd(e, qty)}
            style={outOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {adding ? <FaSpinner className="btnSpinner" /> : <FaShoppingCart />}
            {adding ? 'Adding...' : outOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>

        <button
          className="buyNowBtn"
          disabled={outOfStock}
          onClick={() => onBuyNow(qty)}
          style={outOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <FaBolt /> Buy Now
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
