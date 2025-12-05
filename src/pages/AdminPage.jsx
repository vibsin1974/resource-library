import React, { useState, useEffect } from 'react';
import { Home, BarChart3, Trash2, Upload, X, Edit2, Paperclip, Plus } from 'lucide-react';
import CategoryManager from '../components/CategoryManager';
import { getCategories, getPosts, getPost, createPost, updatePost, deletePost, addAttachment, deleteAttachment, formatFileSize, formatDate, removeExtension } from '../services/dataService';

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('upload');
    const [categories, setCategories] = useState([]);
    const [posts, setPosts] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        categoryId: ''
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [editFormData, setEditFormData] = useState({ title: '', categoryId: '' });
    const [editAttachments, setEditAttachments] = useState([]);
    const [newAttachmentFile, setNewAttachmentFile] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const categoriesData = await getCategories();
            const postsData = await getPosts();
            setCategories(categoriesData);
            setPosts(postsData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (selectedFiles.length + files.length > 5) {
            alert('최대 5개의 파일만 업로드할 수 있습니다.');
            return;
        }
        setSelectedFiles([...selectedFiles, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.categoryId) {
            alert('제목과 카테고리를 입력해주세요.');
            return;
        }
        if (selectedFiles.length === 0) {
            alert('최소 1개의 파일을 선택해주세요.');
            return;
        }

        setIsUploading(true);
        try {
            await createPost(formData.title, formData.categoryId, selectedFiles);
            setFormData({ title: '', categoryId: '' });
            setSelectedFiles([]);
            loadData();
            alert('게시물이 업로드되었습니다!');
        } catch (error) {
            console.error('Error creating post:', error);
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('이 게시물을 삭제하시겠습니까?')) {
            try {
                await deletePost(id);
                loadData();
                alert('게시물이 삭제되었습니다.');
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('삭제 중 오류가 발생했습니다.');
            }
        }
    };

    const handleEdit = async (post) => {
        setEditingPost(post);
        setEditFormData({ title: post.title, categoryId: post.categoryId.toString() });

        try {
            const postDetail = await getPost(post.id);
            setEditAttachments(postDetail.attachments || []);
        } catch (error) {
            console.error('Error loading attachments:', error);
            setEditAttachments([]);
        }
    };

    const handleAddAttachment = async () => {
        if (!newAttachmentFile) {
            alert('파일을 선택해주세요.');
            return;
        }

        if (editAttachments.length >= 5) {
            alert('최대 5개의 첨부파일만 추가할 수 있습니다.');
            return;
        }

        try {
            const newAttachment = await addAttachment(editingPost.id, newAttachmentFile);
            setEditAttachments([...editAttachments, newAttachment]);
            setNewAttachmentFile(null);
            const fileInput = document.getElementById('edit-file-input');
            if (fileInput) fileInput.value = '';
            alert('첨부파일이 추가되었습니다!');
            loadData();
        } catch (error) {
            console.error('Error adding attachment:', error);
            alert('첨부파일 추가 중 오류가 발생했습니다.');
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!confirm('이 첨부파일을 삭제하시겠습니까?')) {
            return;
        }

        try {
            await deleteAttachment(attachmentId);
            setEditAttachments(editAttachments.filter(a => a.id !== attachmentId));
            alert('첨부파일이 삭제되었습니다!');
            loadData();
        } catch (error) {
            console.error('Error deleting attachment:', error);
            alert('첨부파일 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editFormData.title || !editFormData.categoryId) {
            alert('제목과 카테고리를 입력해주세요.');
            return;
        }

        try {
            await updatePost(editingPost.id, editFormData.title, editFormData.categoryId);
            setEditingPost(null);
            setEditFormData({ title: '', categoryId: '' });
            setEditAttachments([]);
            setNewAttachmentFile(null);
            loadData();
            alert('게시물이 수정되었습니다!');
        } catch (error) {
            console.error('Error updating post:', error);
            alert('수정 중 오류가 발생했습니다.');
        }
    };

    // Fix: Use loose equality to handle type mismatch between string and number IDs
    const getCategoryById = (id) => categories.find(c => c.id == id);

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            {/* Header */}
            <header style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                padding: '20px 0'
            }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            🔐 관리자 페이지
                        </h1>
                        <a href="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                            <Home style={{ width: '16px', height: '16px' }} /> 사용자 페이지
                        </a>
                    </div>
                </div>
            </header>

            <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
                {/* Tabs */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '32px',
                    display: 'flex',
                    gap: '12px'
                }}>
                    <button
                        className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <Upload style={{ width: '16px', height: '16px' }} /> 게시물 업로드
                    </button>
                    <button
                        className={`btn ${activeTab === 'manage' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('manage')}
                    >
                        <BarChart3 style={{ width: '16px', height: '16px' }} /> 게시물 관리
                    </button>
                    <button
                        className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        📁 카테고리 관리
                    </button>
                </div>

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                    <div className="card">
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>게시물 업로드</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                        제목
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="게시물 제목을 입력하세요"
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
                                        첨부파일 (최대 5개)
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                        id="file-upload"
                                        disabled={selectedFiles.length >= 5}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        style={{
                                            display: 'block',
                                            padding: '40px',
                                            border: '2px dashed #d1d5db',
                                            borderRadius: '12px',
                                            textAlign: 'center',
                                            cursor: selectedFiles.length >= 5 ? 'not-allowed' : 'pointer',
                                            background: '#f9fafb',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Upload style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#9ca3af' }} />
                                        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
                                            {selectedFiles.length >= 5 ? '최대 5개까지 업로드 가능합니다' : '파일을 선택하거나 드래그하세요'}
                                        </p>
                                        <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                                            {selectedFiles.length}개 / 5개 선택됨
                                        </p>
                                    </label>
                                </div>

                                {/* Selected Files List */}
                                {selectedFiles.length > 0 && (
                                    <div style={{
                                        background: '#f9fafb',
                                        padding: '16px',
                                        borderRadius: '8px'
                                    }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>선택된 파일</h3>
                                        <div style={{ display: 'grid', gap: '8px' }}>
                                            {selectedFiles.map((file, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '12px',
                                                        background: 'white',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '14px', color: '#374151' }}>
                                                        📎 {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        style={{
                                                            background: '#fee2e2',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: '4px 8px',
                                                            cursor: 'pointer',
                                                            color: '#dc2626'
                                                        }}
                                                    >
                                                        <X style={{ width: '14px', height: '14px' }} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isUploading && (
                                    <div style={{
                                        background: '#eff6ff',
                                        border: '2px solid #3b82f6',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        textAlign: 'center',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{
                                            display: 'inline-block',
                                            width: '40px',
                                            height: '40px',
                                            border: '4px solid #e5e7eb',
                                            borderTop: '4px solid #3b82f6',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite',
                                            marginBottom: '12px'
                                        }}></div>
                                        <p style={{
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#3b82f6',
                                            margin: 0
                                        }}>
                                            📤 업로드 중입니다...
                                        </p>
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#6b7280',
                                            marginTop: '8px',
                                            marginBottom: 0
                                        }}>
                                            잠시만 기다려주세요
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    disabled={isUploading}
                                >
                                    <Upload style={{ width: '16px', height: '16px' }} />
                                    {isUploading ? '업로드 중...' : '게시물 업로드'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Manage Tab - Same structure as UserPage */}
                {activeTab === 'manage' && (
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        {posts.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px'
                            }}>
                                <p style={{ fontSize: '18px', color: '#6b7280' }}>
                                    등록된 게시물이 없습니다.
                                </p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white'
                                    }}>
                                        <th style={{
                                            padding: '16px 20px',
                                            textAlign: 'center',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            width: '60px'
                                        }}>No.</th>
                                        <th style={{
                                            padding: '16px 20px',
                                            textAlign: 'left',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>제목</th>
                                        <th style={{
                                            padding: '16px 20px',
                                            textAlign: 'left',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            width: '150px'
                                        }}>카테고리</th>
                                        <th style={{
                                            padding: '16px 20px',
                                            textAlign: 'left',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            width: '250px'
                                        }}>첨부파일</th>
                                        <th style={{
                                            padding: '16px 20px',
                                            textAlign: 'left',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            width: '150px'
                                        }}>업로드 날짜</th>
                                        <th style={{
                                            padding: '16px 20px',
                                            textAlign: 'center',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            width: '120px'
                                        }}>관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.map((post, index) => {
                                        const category = getCategoryById(post.categoryId);
                                        const serialNumber = posts.length - index;
                                        return (
                                            <tr
                                                key={post.id}
                                                style={{
                                                    borderBottom: '1px solid #f3f4f6',
                                                    background: index % 2 === 0 ? 'white' : '#fafafa'
                                                }}
                                            >
                                                <td style={{
                                                    padding: '16px 20px',
                                                    textAlign: 'center',
                                                    fontSize: '14px',
                                                    color: '#6b7280',
                                                    fontWeight: '500'
                                                }}>
                                                    {serialNumber}
                                                </td>
                                                <td style={{
                                                    padding: '16px 20px',
                                                    fontSize: '15px',
                                                    fontWeight: '500',
                                                    color: '#1f2937'
                                                }}>
                                                    {removeExtension(post.title)}
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        background: `${category?.color}20`,
                                                        color: category?.color || '#6b7280'
                                                    }}>
                                                        {category?.icon} {category?.name}
                                                    </span>
                                                </td>
                                                <td style={{
                                                    padding: '16px 20px',
                                                    fontSize: '14px',
                                                    color: '#6b7280'
                                                }}>
                                                    <Paperclip style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                                                    {post.attachmentCount}개 파일 ({post.totalSize ? formatFileSize(post.totalSize) : '0 B'})
                                                </td>
                                                <td style={{
                                                    padding: '16px 20px',
                                                    fontSize: '14px',
                                                    color: '#6b7280'
                                                }}>
                                                    {formatDate(post.createdDate)}
                                                </td>
                                                <td style={{
                                                    padding: '16px 20px',
                                                    textAlign: 'center'
                                                }}>
                                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                        <button
                                                            className="btn btn-secondary"
                                                            onClick={() => handleEdit(post)}
                                                            style={{ padding: '6px 10px', fontSize: '12px' }}
                                                        >
                                                            <Edit2 style={{ width: '14px', height: '14px' }} />
                                                        </button>
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() => handleDelete(post.id)}
                                                            style={{ padding: '6px 10px', fontSize: '12px' }}
                                                        >
                                                            <Trash2 style={{ width: '14px', height: '14px' }} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )
                        }
                    </div >
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && <CategoryManager />}
            </div >

            {/* Edit Modal */}
            {
                editingPost && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '32px',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '600' }}>게시물 수정</h2>
                                <button
                                    onClick={() => {
                                        setEditingPost(null);
                                        setEditAttachments([]);
                                        setNewAttachmentFile(null);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    <X style={{ width: '24px', height: '24px' }} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate}>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                            제목
                                        </label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={editFormData.title}
                                            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                            placeholder="게시물 제목을 입력하세요"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                            카테고리
                                        </label>
                                        <select
                                            className="input"
                                            value={editFormData.categoryId}
                                            onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
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

                                    {/* Attachments Section */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                            첨부파일 ({editAttachments.length}/5)
                                        </label>

                                        {/* Current Attachments */}
                                        <div style={{
                                            background: '#f9fafb',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            marginBottom: '12px'
                                        }}>
                                            {editAttachments.length === 0 ? (
                                                <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
                                                    첨부파일이 없습니다
                                                </p>
                                            ) : (
                                                <div style={{ display: 'grid', gap: '8px' }}>
                                                    {editAttachments.map((attachment) => (
                                                        <div
                                                            key={attachment.id}
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '10px',
                                                                background: 'white',
                                                                borderRadius: '6px',
                                                                border: '1px solid #e5e7eb'
                                                            }}
                                                        >
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '2px' }}>
                                                                    📎 {attachment.file_name}
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                                    {formatFileSize(attachment.file_size)}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteAttachment(attachment.id)}
                                                                style={{
                                                                    background: '#fee2e2',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    padding: '6px 10px',
                                                                    cursor: 'pointer',
                                                                    color: '#dc2626',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                <Trash2 style={{ width: '14px', height: '14px' }} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Add New Attachment */}
                                        {editAttachments.length < 5 && (
                                            <div style={{
                                                border: '2px dashed #d1d5db',
                                                borderRadius: '8px',
                                                padding: '12px'
                                            }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <input
                                                        type="file"
                                                        id="edit-file-input"
                                                        onChange={(e) => setNewAttachmentFile(e.target.files[0])}
                                                        style={{ flex: 1, fontSize: '13px' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleAddAttachment}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                                        disabled={!newAttachmentFile}
                                                    >
                                                        <Plus style={{ width: '14px', height: '14px' }} /> 추가
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setEditingPost(null);
                                                setEditAttachments([]);
                                                setNewAttachmentFile(null);
                                            }}
                                            style={{ flex: 1 }}
                                        >
                                            취소
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            style={{ flex: 1 }}
                                        >
                                            수정
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminPage;
