import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../services/dataService';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', icon: '', color: '#3b82f6' });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const cats = await getCategories();
        setCategories(cats);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateCategory(editingId, formData);
                setEditingId(null);
            } else {
                await addCategory(formData);
                setIsAdding(false);
            }
            setFormData({ name: '', icon: '', color: '#3b82f6' });
            await loadCategories();
        } catch (error) {
            console.error('Failed to save category:', error);
            alert('저장 실패: ' + error.message);
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setFormData({ name: category.name, icon: category.icon, color: category.color });
        setIsAdding(false);
    };

    const handleDelete = async (e, id) => {
        // Prevent double clicks
        if (e.currentTarget.disabled) return;

        // Visual feedback
        const btn = e.currentTarget;
        const originalContent = btn.innerHTML;
        btn.innerHTML = '...';
        btn.disabled = true;

        try {
            // Direct fetch to bypass potential service issues
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
                mode: 'cors'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server responded with error');
            }

            // Refresh the list without reloading the page
            await loadCategories();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('삭제 실패: ' + error.message);
            // Restore button state on error
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', icon: '', color: '#3b82f6' });
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600' }}>카테고리 관리</h2>
                {!isAdding && !editingId && (
                    <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                        <Plus style={{ width: '16px', height: '16px' }} /> 카테고리 추가
                    </button>
                )}
            </div>

            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
                <form onSubmit={handleSubmit} style={{
                    background: '#f9fafb',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <input
                            type="text"
                            placeholder="카테고리 이름"
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="아이콘 (Win + .)"
                            className="input"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            maxLength={2}
                        />
                        <input
                            type="color"
                            className="input"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className="btn btn-primary">
                            <Save style={{ width: '16px', height: '16px' }} /> 확인
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                            <X style={{ width: '16px', height: '16px' }} /> 취소
                        </button>
                    </div>
                </form>
            )}

            {/* Category List */}
            <div style={{ display: 'grid', gap: '12px' }}>
                {categories.map(category => (
                    <div
                        key={category.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            borderLeft: `4px solid ${category.color}`
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{category.icon}</span>
                            <span style={{ fontSize: '16px', fontWeight: '500' }}>{category.name}</span>
                            <div
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '4px',
                                    background: category.color
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => handleEdit(category)}
                                style={{ padding: '8px 12px' }}
                            >
                                <Edit2 style={{ width: '16px', height: '16px' }} />
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={(e) => handleDelete(e, category.id)}
                                style={{ padding: '8px 12px' }}
                            >
                                <Trash2 style={{ width: '16px', height: '16px' }} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryManager;
