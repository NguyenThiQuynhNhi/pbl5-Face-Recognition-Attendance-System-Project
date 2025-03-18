document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    if (username === 'admin' && password === '123456') {
        window.location.href = 'dashboard.html';
    } else {
        errorMessage.style.display = 'block';
        document.getElementById('username').classList.add('error');
        document.getElementById('password').classList.add('error');
    }
});

document.getElementById('register-link').addEventListener('click', function() {
    window.location.href = 'register.html';
});

document.getElementById('forgot-password-link').addEventListener('click', function() {
    window.location.href = 'forgot-password.html';
});