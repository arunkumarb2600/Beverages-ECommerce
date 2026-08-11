import React, { useState, useEffect } from 'react';
import api from '../services/api';
import formatPrice from '../utils/formatPrice';
import { useToast } from '../context/ToastContext';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCoffee,
  FaCheck,
  FaTimes,
  FaSearch
} from 'react-icons/fa';
import '../styles/Admin.css';

const emptyForm = {
  productId: null,
  productName: '',
  categoryId: '',
  brand: '',
  description: '',
  price: '',
  stock: '',
  imageUrl: '',
  isFeatured: false
};

const AdminProducts = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || String(p.categoryId) === String(filterCategory);
    return matchesSearch && matchesCategory;
  });

  const setField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const startCreate = () => {
    setForm({ ...emptyForm, categoryId: categories[0]?.categoryId || '' });
    setFormOpen(true);
  };

  const startEdit = (p) => {
    setForm({
      productId: p.productId,
      productName: p.productName,
      categoryId: p.categoryId,
      brand: p.brand,
      description: p.description || '',
      price: p.price,
      stock: p.stock,
      imageUrl: p.imageUrl || '',
      isFeatured: p.isFeatured || false
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.productName.trim() || !form.brand.trim() || !form.price || !form.stock || !form.categoryId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    const payload = {
      productName: form.productName.trim(),
      categoryId: parseInt(form.categoryId, 10),
      brand: form.brand.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      imageUrl: form.imageUrl.trim(),
      isFeatured: form.isFeatured
    };
    try {
      if (form.productId) {
        await api.put(`/admin/products/${form.productId}`, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await api.post('/admin/products', payload);
        showToast('Product created successfully', 'success');
      }
      setForm(emptyForm);
      setFormOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product', 'error');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete product "${p.productName}"?`)) return;
    try {
      await api.delete(`/admin/products/${p.productId}`);
      showToast('Product deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
    }
  };

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <h1 className="adminTitle">Products</h1>
        <p className="adminSubtitle">Manage your beverage catalog, stock levels and pricing.</p>
      </header>

      {formOpen && (
        <div className="adminFormSection">
          <h3 className="formSectionTitle">
            {form.productId ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={handleSave} className="adminGridForm">
            <div className="formGroup">
              <label>Product Name *</label>
              <input type="text" value={form.productName} onChange={setField('productName')} className="adminInput" placeholder="e.g. Classic Matcha Latte" required />
            </div>
            <div className="formGroup">
              <label>Category *</label>
              <select value={form.categoryId} onChange={setField('categoryId')} className="adminSelect" required>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                ))}
              </select>
            </div>
            <div className="formGroup">
              <label>Brand *</label>
              <input type="text" value={form.brand} onChange={setField('brand')} className="adminInput" placeholder="e.g. RefreshUp Organic" required />
            </div>
            <div className="formGroup">
              <label>Price (₹) *</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={setField('price')} className="adminInput" placeholder="e.g. 199" required />
            </div>
            <div className="formGroup">
              <label>Stock Quantity *</label>
              <input type="number" min="0" value={form.stock} onChange={setField('stock')} className="adminInput" placeholder="e.g. 100" required />
            </div>
            <div className="formGroup">
              <label>Image URL</label>
              <input type="text" value={form.imageUrl} onChange={setField('imageUrl')} className="adminInput" placeholder="Paste image link here" />
            </div>
            <div className="formGroup spanFull">
              <label>Description</label>
              <textarea value={form.description} onChange={setField('description')} className="adminTextarea" rows="3" placeholder="Detailed flavor notes, ingredients..." />
            </div>
            <div className="formGroup spanFull flexRow">
              <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={setField('isFeatured')} className="adminCheckbox" />
              <label htmlFor="isFeatured" className="checkboxLabel">Feature this product on homepage</label>
            </div>
            <div className="formActions spanFull">
              <button type="submit" className="adminSubmitBtn">
                {form.productId ? 'Update Product' : 'Create Product'}
              </button>
              <button type="button" onClick={() => { setForm(emptyForm); setFormOpen(false); }} className="adminCancelBtn">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="adminTableSection">
        <div className="adminTableToolbar">
          <h3 className="tableSectionTitle">Product Catalog ({filteredProducts.length})</h3>
          <div className="adminToolbarActions">
            <div className="adminSearchBox">
              <FaSearch />
              <input
                type="text"
                placeholder="Search name or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="adminInput"
              />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="adminSelect">
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
              ))}
            </select>
            <button className="adminSubmitBtn" onClick={startCreate}>
              <FaPlus /> Add Product
            </button>
          </div>
        </div>

        {loading ? (
          <div className="adminLoading">
            <div className="spinner"></div> Loading...
          </div>
        ) : (
          <div className="tableWrapper">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.productId}>
                    <td>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} className="tableThumb" alt={p.productName} />
                      ) : (
                        <div className="tableThumbFallback"><FaCoffee /></div>
                      )}
                    </td>
                    <td className="boldText">{p.productName}</td>
                    <td>{p.brand}</td>
                    <td><span className="tableCategoryTag">{p.categoryName}</span></td>
                    <td className="boldText">{formatPrice(p.price)}</td>
                    <td>
                      <span className={`stockStatus ${p.stock <= 0 ? 'out' : p.stock < 20 ? 'low' : 'ok'}`}>
                        {p.stock} left
                      </span>
                    </td>
                    <td>
                      {p.isFeatured ? (
                        <span className="featuredBadgeYes"><FaCheck /> Yes</span>
                      ) : (
                        <span className="featuredBadgeNo"><FaTimes /> No</span>
                      )}
                    </td>
                    <td>
                      <div className="tableActions">
                        <button onClick={() => startEdit(p)} className="actionBtn editBtn" title="Edit"><FaEdit /> Edit</button>
                        <button onClick={() => handleDelete(p)} className="actionBtn deleteBtn" title="Delete"><FaTrash /> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="8" className="adminEmptyRow">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
