import React from 'react';
import { Download, FileText, Image, Video, Package } from 'lucide-react';
import { formatFileSize, formatDate, downloadFile } from '../services/dataService';

const getFileIcon = (categoryId) => {
    const iconStyle = { width: '32px', height: '32px' };
    const icons = {
        '1': <FileText style={{ ...iconStyle, color: '#3b82f6' }} />,
        '2': <Image style={{ ...iconStyle, color: '#10b981' }} />,
        '3': <Video style={{ ...iconStyle, color: '#f97316' }} />,
        '4': <Package style={{ ...iconStyle, color: '#a855f7' }} />
    };
    return icons[categoryId] || <FileText style={{ ...iconStyle, color: '#6b7280' }} />;
};

const FileCard = ({ file, category }) => {
    const handleDownload = () => {
        downloadFile(file.id, file.name);
    };


    return (
        <div className="card" style={{ borderLeft: `4px solid ${category?.color || '#ccc'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{
                        background: `${category?.color}15`,
                        padding: '12px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {getFileIcon(file.categoryId)}
                    </div>

                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '8px',
                            color: '#1f2937'
                        }}>
                            {file.name}
                        </h3>

                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            fontSize: '14px',
                            color: '#6b7280'
                        }}>
                            <span>📁 {category?.name || '미분류'}</span>
                            <span>📊 {formatFileSize(file.size)}</span>
                            <span>📅 {formatDate(file.uploadDate)}</span>
                        </div>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleDownload}
                    style={{ fontSize: '13px', padding: '8px 16px', flexShrink: 0 }}
                >
                    <Download style={{ width: '16px', height: '16px' }} />
                    다운로드
                </button>
            </div>
        </div>
    );
};

export default FileCard;
