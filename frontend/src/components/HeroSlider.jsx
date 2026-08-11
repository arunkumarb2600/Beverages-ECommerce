import React, { useState, useEffect, useCallback } from 'react';
import { FaArrowRight, FaTags, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const HeroSlider = ({ products = [], onShopNow, onBrowseCategories }) => {
  const slides = (products.length > 0
    ? products.slice(0, 4)
    : Array.from({ length: 3 }, (_, i) => ({}))
  ).map((p, i) => ({
    id: p.productId || `fallback-${i}`,
    eyebrow: p.productId ? p.categoryName || 'Premium Selection' : 'Fresh Beverages',
    title: p.productId ? p.productName : 'Fresh Beverages Delivered to Your Doorstep',
    highlight: p.productId ? '' : 'to Your Doorstep',
    subtitle: p.productId
      ? (p.description && p.description.length > 90 ? p.description.slice(0, 90) + '…' : p.description)
      : 'Experience the finest hand-selected ingredients, organic cold-pressed wellness elixirs, and gourmet roasted coffee delivered directly to your doorstep.',
    imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=900&auto=format&fit=crop',
    price: p.price
  }));

  const [index, setIndex] = useState(0);
  const total = slides.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (total === 0) return null;

  return (
    <section className="heroSlider" aria-label="Promotional banner">
      <div className="heroSlidesWrapper">
        {slides.map((slide, i) => (
          <div
            className={`heroSlide ${i === index ? 'heroSlideActive' : ''}`}
            key={slide.id}
            aria-hidden={i !== index}
          >
            <div className="heroSlideContent">
              <div className="heroLeft">
                <span className="heroEyebrow"><FaTags /> {slide.eyebrow}</span>
                <h1 className="heroTitle">
                  {slide.title}
                  {slide.highlight && <span className="heroTitleHighlight"> {slide.highlight}</span>}
                </h1>
                <p className="heroSubtitle">{slide.subtitle}</p>
                {slide.price != null && (
                  <div className="heroPriceRow">
                    <span className="heroPriceText">Starting at ₹{Number(slide.price).toFixed(0)}</span>
                  </div>
                )}
                <div className="heroCtaRow">
                  <button className="heroBtn" onClick={onShopNow}>
                    Shop Now <FaArrowRight />
                  </button>
                  <button className="heroBtnGhost" onClick={onBrowseCategories}>
                    Browse Categories
                  </button>
                </div>
              </div>
              <div className="heroRight heroVisual">
                <img src={slide.imageUrl} alt={slide.title} className="heroSlideImg" loading="lazy" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="heroArrowBtn heroArrowLeft" onClick={prev} aria-label="Previous slide">
        <FaChevronLeft />
      </button>
      <button className="heroArrowBtn heroArrowRight" onClick={next} aria-label="Next slide">
        <FaChevronRight />
      </button>

      <div className="heroDots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`heroDot ${i === index ? 'heroDotActive' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
