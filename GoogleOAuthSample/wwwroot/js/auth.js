let currentUser = null; // 登入成功後的用戶信息
let google_client_id = ''; // Google OAuth 2.0 用戶端ID
let handleGoogleCredentialResponse = null; // Google登入成功後的callback函數
let loginSucceedCallback = null; // 讓其他模塊設置登入成功後的callback函數
let signUI = null; // 讓其他模塊設置登入UI的函數

/**
 * 初始化Google登入功能
 */
function initializeGoogleSignIn() {
    google.accounts.id.initialize({
        client_id: google_client_id,
        callback: handleGoogleCredentialResponse
    });

    if (!checkStoredToken()) {
        if (signUI) {
            signUI(); // 顯示登入UI
        }
    }
    else {
        if (loginSucceedCallback) {
            loginSucceedCallback(); // 登入成功後的回調函數
        }
    }
}

/**
 * 解碼Base64Url編碼的字符串
 * @param {string} base64Url - Base64Url編碼的字符串
 * @returns {string} 解碼後的字符串
 */
function decodeBase64Url(base64Url) {
    const padding = '='.repeat((4 - base64Url.length % 4) % 4);
    const base64 = (base64Url + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    return decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

/**
 * 檢查存儲的令牌
 * @returns {boolean} 令牌是否有效
 */
function checkStoredToken() {
    const storedToken = localStorage.getItem('googleToken');
    if (storedToken) {
        try {
            const parts = storedToken.split('.');
            if (parts.length !== 3) {
                throw new Error('Stored token does not appear to be a valid JWT');
            }

            const payload = JSON.parse(decodeBase64Url(parts[1]));
            const expirationTime = payload.exp * 1000;

            if (Date.now() < expirationTime) {
                currentUser = {
                    name: payload.name,
                    email: payload.email,
                    imageUrl: payload.picture
                };
                return true;
            } else {
                console.log('Token expired');
                localStorage.removeItem('googleToken');
            }
        } catch (error) {
            console.error('Error checking stored token:', error);
            localStorage.removeItem('googleToken');
        }
    }
    return false;
}

/**
* 登出
*/
function signOut() {
    currentUser = null;
    localStorage.removeItem('googleToken');
    if (signUI) {
        signUI(); // 顯示登入UI
    }
    initializeGoogleSignIn();
}

function loadGoogleAPI() {
    return new Promise((resolve, reject) => {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            resolve();
        } else {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        }
    });
}

/**
 * 保存令牌到本地存儲
 * @param {string} token - 要保存的令牌
 */
function saveTokenToLocalStorage(token) {
    localStorage.setItem('googleToken', token);
}

/**
* 初始化應用
*/
function initializeGoogleAuth() {
    loadGoogleAPI()
        .then(() => {
            initializeGoogleSignIn();
            document.getElementById('signOutButton').addEventListener('click', signOut);
        })
        .catch(error => {
            console.error('Failed to load Google API:', error);
            // 在這裡處理錯誤，例如顯示一個錯誤消息給用戶
        });
}