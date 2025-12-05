const API_BASE_URL = '/api';

// Category operations
export const getCategories = async () => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    return response.json();
};

export const addCategory = async (category) => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
    });
    return response.json();
};

export const updateCategory = async (id, updates) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    return response.json();
};

export const deleteCategory = async (id) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE'
    });
    return response.json();
};

// Post operations
export const getPosts = async (categoryId = null) => {
    let url = `${API_BASE_URL}/posts`;
    if (categoryId) {
        url += `?category_id=${categoryId}`;
    }
    const response = await fetch(url);
    const posts = await response.json();

    return posts.map(post => ({
        id: post.id.toString(),
        title: post.title,
        categoryId: post.category_id?.toString(),
        createdDate: post.created_date,
        attachmentCount: post.attachment_count,
        totalSize: post.total_size
    }));
};

export const getPost = async (id) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`);
    return response.json();
};

export const createPost = async (title, categoryId, files) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category_id', categoryId);

    files.forEach(file => {
        formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        body: formData
    });
    return response.json();
};

export const updatePost = async (id, title, categoryId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category_id: categoryId })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(error.error || 'Failed to update post');
    }

    return response.json();
};

export const deletePost = async (id) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'DELETE'
    });
    return response.json();
};

// Download operations
export const downloadPostAsZip = (id, title) => {
    const url = `${API_BASE_URL}/posts/${id}/download`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const downloadAttachment = (id, filename) => {
    const url = `${API_BASE_URL}/attachments/${id}/download`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Attachment management
export const addAttachment = async (postId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/posts/${postId}/attachments`, {
        method: 'POST',
        body: formData
    });
    return response.json();
};

export const deleteAttachment = async (attachmentId) => {
    const response = await fetch(`${API_BASE_URL}/attachments/${attachmentId}`, {
        method: 'DELETE'
    });
    return response.json();
};

// Utility functions
export const formatFileSize = (bytes) => {
    if (bytes === 0 || bytes === null || bytes === undefined) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const removeExtension = (filename) => {
    if (!filename) return '';
    return filename.replace(/\.[^/.]+$/, "");
};
