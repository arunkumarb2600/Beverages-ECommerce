import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { FaPlus, FaEdit, FaTrash, FaFolder } from 'react-icons/fa';
import '../styles/Admin.css';

const emptyForm = { categoryId: null, categoryName: '', parentId: '' };

const AdminCategories = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const parentCategories = categories.filter((c) => c.parentId === null && c.categoryId !== form.categoryId);
  const mainCategories = categories.filter((c) => c.parentId === null);
  const subCategories = categories.filter((c) => c.parentId !== null);

  const getParentName = (id) => {
    const parent = categories.find((c) => c.categoryId === id);
    return parent ? parent.categoryName : '—';
  };

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const startCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const startEdit = (cat) => {
    setForm({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      parentId: cat.parentId ?? ''
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.categoryName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }
    const payload = {
      categoryName: form.categoryName.trim(),
      parentId: form.parentId === '' ? null : parseInt(form.parentId, 10)
    };
    try {
      if (form.categoryId) {
        await api.put(`/admin/categories/${form.categoryId}`, payload);
        showToast('Category updated successfully', 'success');
      } else {
        await api.post('/admin/categories', payload);
        showToast('Category created successfully', 'success');
      }
      setForm(emptyForm);
      setFormOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save category', 'error');
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.categoryName}"?`)) return;
    try {
      await api.delete(`/admin/categories/${cat.categoryId}`);
      showToast('Category deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete category', 'error');
    }
  };

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <h1 className="adminTitle">Categories</h1>
        <p className="adminSubtitle">Organize products into main and sub categories.</p>
      </header>

      {formOpen && (
        <div className="adminFormSection">
          <h3 className="formSectionTitle">
            {form.categoryId ? 'Edit Category' : 'Add New Category'}
          </h3>
          <form onSubmit={handleSave} className="adminGridForm">
            <div className="formGroup">
              <label>Category Name *</label>
              <input
                type="text"
                value={form.categoryName}
                onChange={setField('categoryName')}
                className="adminInput"
                placeholder="e.g. Iced Teas"
                required
              />
            </div>
            <div className="formGroup">
              <label>Parent Category (optional)</label>
              <select value={form.parentId} onChange={setField('parentId')} className="adminSelect">
                <option value="">— Main Category —</option>
                {parentCategories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                ))}
              </select>
            </div>
            <div className="formActions spanFull">
              <button type="submit" className="adminSubmitBtn">
                {form.categoryId ? 'Update Category' : 'Create Category'}
              </button>
              <button type="button" onClick={() => { setForm(emptyForm); setFormOpen(false); }} className="adminCancelBtn">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="adminTableSection">
        <div className="adminTableToolbar">
          <h3 className="tableSectionTitle">All Categories ({categories.length})</h3>
          <button className="adminSubmitBtn" onClick={startCreate}>
            <FaPlus /> Add Category
          </button>
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
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Parent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mainCategories.map((cat) => (
                  <React.Fragment key={cat.categoryId}>
                    <tr>
                      <td>{cat.categoryId}</td>
                      <td className="boldText">
                        <FaFolder className="categoryIcon" /> {cat.categoryName}
                      </td>
                      <td><span className="badge badgeMain">Main</span></td>
                      <td>—</td>
                      <td>
                        <div className="tableActions">
                          <button onClick={() => startEdit(cat)} className="actionBtn editBtn"><FaEdit /> Edit</button>
                          <button onClick={() => handleDelete(cat)} className="actionBtn deleteBtn"><FaTrash /> Delete</button>
                        </div>
                      </td>
                    </tr>
                    {subCategories
                      .filter((sub) => sub.parentId === cat.categoryId)
                      .map((sub) => (
                        <tr key={sub.categoryId} className="subRow">
                          <td>{sub.categoryId}</td>
                          <td className="boldText subName">↳ {sub.categoryName}</td>
                          <td><span className="badge badgeSub">Sub</span></td>
                          <td>{getParentName(sub.parentId)}</td>
                          <td>
                            <div className="tableActions">
                              <button onClick={() => startEdit(sub)} className="actionBtn editBtn"><FaEdit /> Edit</button>
                              <button onClick={() => handleDelete(sub)} className="actionBtn deleteBtn"><FaTrash /> Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
                {mainCategories.length === 0 && (
                  <tr>
                    <td colSpan="5" className="adminEmptyRow">No categories found.</td>
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

export default AdminCategories;
