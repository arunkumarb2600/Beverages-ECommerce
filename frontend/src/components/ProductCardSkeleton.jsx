import React from 'react';

const ProductCardSkeleton = () => (
  <div className="productCard skeletonCard">
    <div className="skeletonBlock skeletonImage"></div>
    <div className="productInfo">
      <div className="skeletonBlock skeletonLine skeletonLineShort"></div>
      <div className="skeletonBlock skeletonLine"></div>
      <div className="skeletonBlock skeletonLine skeletonLineLong"></div>
      <div className="productFooter">
        <div className="skeletonBlock skeletonLine skeletonPrice"></div>
        <div className="skeletonBlock skeletonButton"></div>
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
