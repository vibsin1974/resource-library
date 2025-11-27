import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Download, Paperclip } from 'lucide-react';
import { getCategories, getPosts, getPost, formatFileSize, formatDate, downloadPostAsZip, downloadAttachment, removeExtension } from '../services/dataService';

const UserPage = () => {
    const [categories, setCategories] = useState([]);
    const [posts, setPosts] = useState([]);
    const [postsWithAttachments, setPostsWithAttachments] = useState({});
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchTerm]);

    const loadData = async () => {
        try {
            const categoriesData = await getCategories();
            const postsData = await getPosts();
            setCategories(categoriesData);
            setPosts(postsData);

            // Load attachments for each post
            const attachmentsMap = {};
            for (const post of postsData) {
                const postDetail = await getPost(post.id);
                attachmentsMap[post.id] = postDetail.attachments || [];
            }
            setPostsWithAttachments(attachmentsMap);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const filteredPosts = posts.filter(post => {
        const matchesCategory = !selectedCategory || post.categoryId == selectedCategory;
        const matchesSearch = !searchTerm || post.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    // Fix: Use loose equality to handle type mismatch between string and number IDs
    const getCategoryById = (id) => categories.find(c => c.id == id);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDownloadAttachment = (attachmentId, filename) => {
        downloadAttachment(attachmentId, filename);
    };

    const handleDownloadAll = (postId, postTitle) => {
        downloadPostAsZip(postId, postTitle);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            {/* Header */}
            <header style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                padding: '20px 0',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '4px'
                            }}>
                                📚 자료실
                            </h1>
                            <p style={{ color: '#6b7280', fontSize: '14px' }}>
                                필요한 자료를 검색하고 다운로드하세요
                            </p>
                        </div>

                        <a
                            href="/admin"
                            className="btn btn-secondary"
                            style={{ textDecoration: 'none' }}
                        >
                            🔐 관리자
                        </a>
                    </div>
                </div>
            </header>

            <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
                {/* Search and Filter */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '32px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '16px',
                        alignItems: 'center'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <Search
                                style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af',
                                    width: '20px',
                                    height: '20px'
                                }}
                            />
                            <input
                                type="text"
                                placeholder="게시물 제목으로 검색..."
                                className="input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '48px' }}
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '20px',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSelectedCategory(null)}
                            style={{ fontSize: '13px', padding: '8px 16px' }}
                        >
                            전체
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSelectedCategory(cat.id)}
                                style={{ fontSize: '13px', padding: '8px 16px' }}
                            >
                                {cat.icon} {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Info */}
                {filteredPosts.length > 0 && (
                    <div style={{
                        marginBottom: '16px',
                        color: 'white',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>
                            총 {filteredPosts.length}개 게시물 중 {startIndex + 1}-{Math.min(endIndex, filteredPosts.length)}개 표시
                        </span>
                        <span>
                            페이지 {currentPage} / {totalPages}
                        </span>
                    </div>
                )}

                {/* Posts List - Table Format */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                    {filteredPosts.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px'
                        }}>
                            <p style={{ fontSize: '18px', color: '#6b7280' }}>
                                {searchTerm || selectedCategory ? '검색 결과가 없습니다' : '등록된 게시물이 없습니다'}
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
                                    }}>다운로드</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPosts.map((post, index) => {
                                    const category = getCategoryById(post.categoryId);
                                    const attachments = postsWithAttachments[post.id] || [];

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
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Paperclip style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                                                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
                                                            {attachments.length}개 파일
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        {attachments.slice(0, 3).map((attachment) => (
                                                            <button
                                                                key={attachment.id}
                                                                onClick={() => handleDownloadAttachment(attachment.id, attachment.file_name)}
                                                                style={{
                                                                    padding: '4px 10px',
                                                                    fontSize: '12px',
                                                                    background: '#f3f4f6',
                                                                    border: '1px solid #e5e7eb',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    color: '#4b5563',
                                                                    transition: 'all 0.2s',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    maxWidth: '100%'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.background = '#e5e7eb';
                                                                    e.currentTarget.style.borderColor = '#d1d5db';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = '#f3f4f6';
                                                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                                                }}
                                                                title={`${attachment.file_name} (${formatFileSize(attachment.file_size)})`}
                                                            >
                                                                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {attachment.file_name}
                                                                </span>
                                                            </button>
                                                        ))}
                                                        {attachments.length > 3 && (
                                                            <span style={{ fontSize: '11px', color: '#9ca3af', alignSelf: 'center', paddingLeft: '4px' }}>
                                                                +{attachments.length - 3}개 더보기
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
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
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleDownloadAll(post.id, post.title)}
                                                    disabled={attachments.length === 0}
                                                    style={{
                                                        fontSize: '13px',
                                                        padding: '8px 16px',
                                                        opacity: attachments.length === 0 ? 0.5 : 1,
                                                        cursor: attachments.length === 0 ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    <Download style={{ width: '14px', height: '14px' }} />
                                                    전체
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        marginTop: '32px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                opacity: currentPage === 1 ? 0.5 : 1,
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <ChevronLeft style={{ width: '16px', height: '16px' }} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`btn ${page === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => handlePageChange(page)}
                                style={{
                                    minWidth: '40px',
                                    padding: '8px 12px'
                                }}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            className="btn btn-secondary"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{
                                opacity: currentPage === totalPages ? 0.5 : 1,
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <ChevronRight style={{ width: '16px', height: '16px' }} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserPage;
