// -----------------------------------------------------------------
// 💡 ฟังก์ชันใหม่: "ตัวตรวจสอบ" (บังคับให้รอ)
// -----------------------------------------------------------------
function checkAmplifyLoaded() {
    // เราต้องรอให้ไฟล์ 2 ตัว (core และ auth) โหลดเสร็จ
    if (window.aws_amplify_core && window.aws_amplify_auth) {
        // ถ้าโหลดเสร็จแล้ว...
        mainLoginLogic();
    } else {
        // ถ้ายังไม่เสร็จ...
        console.log("Waiting for Amplify libraries (core & auth) to load...");
        setTimeout(checkAmplifyLoaded, 100);
    }
}

// -----------------------------------------------------------------
// 🚀 ฟังก์ชันหลัก (แก้ไข! ใช้ไวยากรณ์ที่ถูกต้อง)
// -----------------------------------------------------------------
function mainLoginLogic() {
    console.log("Amplify Core and Auth libraries are loaded.");

    // 1. ดึง "Amplify" object หลัก จาก core
    const { Amplify } = window.aws_amplify_core;

    /* ==============================================
       1. ⚙️ ตั้งค่าการเชื่อมต่อ COGNITO
       ============================================== */
    const amplifyConfig = {
        Auth: {
            region: 'us-east-1',
            userPoolId: 'us-east-1_RE0kj54Gi',
            userPoolWebClientId: '1prj6p09jum8gd6rsfv0mju3v6'
        }
    };
    Amplify.configure(amplifyConfig);

    /* ==============================================
       2. 👂 เพิ่มตัวดักฟัง (Event Listener)
       ============================================== */
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        errorMessage.style.display = 'none';

        // ✅ ตรวจสอบโดเมน email
        if (!email.endsWith('@dome.tu.ac.th')) {
            errorMessage.innerText = 'โปรดใส่ Email @dome.tu.ac.th ที่ลงทะเบียนไว้.';
            errorMessage.style.display = 'block';
            return;
        }

        try {
            /* ==============================================
               3. 🚀 ส่งข้อมูลไปให้ COGNITO
               ============================================== */
            console.log('Attempting to sign in (Correct V5 Syntax)...');
            const user = await Amplify.Auth.signIn(email, password);
            console.log('Sign in successful!', user);

            // ตรวจสอบรหัสผ่านชั่วคราว
            if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
                alert('คุณต้องตั้งรหัสผ่านใหม่ (ยังไม่ได้ทำหน้านี้)');
                return;
            }

            /* ==============================================
               4. 🚦 แยกหน้า ADMIN / USER + เก็บ Token
               ============================================== */
            const session = await Amplify.Auth.currentSession();
            const idToken = session.getIdToken().getJwtToken();
            const idTokenPayload = session.getIdToken().payload;
            const groups = idTokenPayload['cognito:groups'] || [];

            const role = groups.includes('Admins') ? 'ADMIN' : 'USER';
            const emailFromToken = idTokenPayload.email;

            // ✅ เก็บข้อมูลผู้ใช้ลง localStorage
            localStorage.setItem('id_token', idToken);
            localStorage.setItem('user_email', emailFromToken);
            localStorage.setItem('user_role', role);

            console.log(`✅ Logged in as: ${emailFromToken} (${role})`);

            // ✅ redirect ไปตาม role
            if (role === 'ADMIN') {
                window.location.href = '/html/admin-home.html';
            } else {
                window.location.href = '/html/user-home.html';
            }

        } catch (error) {
            /* ==============================================
               5. ❌ จัดการ ERROR
               ============================================== */
            console.error('Error signing in:', error);
            errorMessage.innerText = error.message;
            errorMessage.style.display = 'block';
        }
    });
}

// -----------------------------------------------------------------
// 🏁 จุดเริ่มต้น:
// เริ่ม "ตัวตรวจสอบ" ทันที
// -----------------------------------------------------------------
checkAmplifyLoaded();
