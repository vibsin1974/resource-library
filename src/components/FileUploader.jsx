import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { getCategories, uploadFile } from '../services/dataService';

const FileUploader = ({ onUploadComplete }) => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        size: 0
    });
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            const cats = await getCategories();
            setCategories(cats);
        };
        loadCategories();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.categoryId) {
            alert('파일명과 카테고리를 선택해주세요.');
            return;
        }

        uploadFile({
            ...formData,
            downloadUrl: '#' // In real app, this would be actual file URL
        });

        setFormData({ name: '', categoryId: '', size: 0 });
        if (onUploadComplete) onUploadComplete();
        alert('파일이 업로드되었습니다!');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            setFormData({
                ...formData,
                name: file.name,
                size: file.size
            });
        }
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>파일 업로드</h2>

            <form onSubmit={handleSubmit}>
                {/* Drag and Drop Area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        border: `2px dashed ${isDragging ? '#667eea' : '#d1d5db'}`,
                        borderRadius: '12px',
                        padding: '40px',
                        textAlign: 'center',
                        background: isDragging ? '#f0f4ff' : '#f9fafb',
                        marginBottom: '24px',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                    }}
                >
                    <Upload style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#9ca3af' }} />
                    <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
                        파일을 드래그하여 놓거나 클릭하여 선택하세요
                    </p>
                    <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                        {formData.name || '선택된 파일 없음'}
                    </p>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                            파일명
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="파일명을 입력하세요"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                            카테고리
                        </label>
                        <select
                            className="input"
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            required
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="">카테고리 선택</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                            파일 크기 (bytes)
                        </label>
                        <input
                            type="number"
                            className="input"
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) || 0 })}
                            placeholder="파일 크기"
                            min="0"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        <Upload style={{ width: '16px', height: '16px' }} /> 업로드
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FileUploader;
