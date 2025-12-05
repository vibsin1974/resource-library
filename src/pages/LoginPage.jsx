import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const LoginPage = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'Hee150603!') {
            sessionStorage.setItem('isAuthenticated', 'true');
            navigate('/admin');
        } else {
            setError('비밀번호가 올바르지 않습니다.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: '#e0e7ff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: '#4338ca'
                    }}>
                        <Lock size={30} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>관리자 로그인</h1>
                    <p style={{ color: '#6b7280', marginTop: '8px', whiteSpace: 'nowrap' }}>관리자 페이지 접근을 위해 비밀번호를 입력하세요</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호"
                            className="input"
                            style={{ width: '100%', padding: '12px' }}
                            autoFocus
                        />
                        {error && (
                            <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>
                                {error}
                            </p>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                    >
                        로그인
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
