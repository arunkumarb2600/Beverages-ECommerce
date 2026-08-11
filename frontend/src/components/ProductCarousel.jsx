import React, { useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

const ProductCarousel = ({
  title,
  subtitle,
  products = [],
  loading = false,
  onAdd,
  onBuyNow,
  onView,
  addingProductId,
  wishlistIds,
  onToggleWishlist
}) => {
  const trackRef = useRef(null);

  const scrollBy = (dir) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="carouselSection">
      <div className="sectionHeader carouselHeader">
        <div>
          <h2 className="sectionTitle">{title}</h2>
          {subtitle && <p className="sectionSubtitle">{subtitle}</p>}
        </div>
        {products.length > 0 && (
          <div className="carouselArrows">
            <button className="carouselArrowBtn" onClick={() => scrollBy(-1)} aria-label="Scroll left">
              <FaChevronLeft />
            </button>
            <button className="carouselArrowBtn" onClick={() => scrollBy(1)} aria-label="Scroll right">
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      <div className="carouselTrack" ref={trackRef}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={`cs-${i}`} />)
          : products.map((bev) => (
              <div className="carouselItem" key={bev.productId}>
                <ProductCard
                  product={bev}
                  adding={addingProductId === bev.productId}
                  onAdd={(e, qty) => onAdd(bev, e, qty)}
                  onBuyNow={(qty) => onBuyNow(bev, qty)}
                  onView={() => onView(bev)}
                  wishlisted={wishlistIds.has(bev.productId)}
                  onToggleWishlist={onToggleWishlist}
                />
              </div>
            ))}
      </div>
    </section>
  );
};

export default ProductCarousel;
