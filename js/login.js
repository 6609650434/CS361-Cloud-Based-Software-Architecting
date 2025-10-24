const form = document.getElementById('loginForm');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // --- ตัวอย่างบัญชีทดลอง ---
    const userAccount = {
        email: "user@dome.tu.ac.th",
        password: "1234"
    };

    const adminAccount = {
        email: "admin@dome.tu.ac.th",
        password: "1234"
    };

    // --- ตรวจสอบอีเมลและรหัสผ่าน ---
    if (email === userAccount.email && password === userAccount.password) {
        alert("Welcome, User!");
        window.location.href = "user/user-home.html";
    }
    else if (email === adminAccount.email && password === adminAccount.password) {
        alert("Welcome, Admin!");
        window.location.href = "admin/html/admin-home.html";
    }
    else {
        alert("Invalid email or password. Try again.");
    }
});