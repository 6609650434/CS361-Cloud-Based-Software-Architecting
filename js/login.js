// -----------------------------------------------------------------
// 💡 ฟังก์ชันใหม่: "ตัวตรวจสอบ" (บังคับให้รอ)
// -----------------------------------------------------------------
function checkAmplifyLoaded() {
    // เราต้องรอให้ไฟล์ 2 ตัว (core และ auth) โหลดเสร็จ
    if (window.aws_amplify_core && window.aws_amplify_auth) {
        // ถ้าโหลดเสร็จแล้ว...
        // ...ค่อยสั่งให้โค้ดหลักทำงาน
        mainLoginLogic();
    } else {
        // ถ้ายังไม่เสร็จ...
        // ...ให้รอ 100ms แล้วเช็กใหม่
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
        Auth: { // ⭐️ 'Auth' key นี้ สำคัญมาก
            region: 'us-east-1', 
            userPoolId: 'us-east-1_z05l0nRXU',
            userPoolWebClientId: '68n3a1dburaqlok0o4rel7g3bg'
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

        // 
        // ⭐️⭐️⭐️ นี่คือโค้ดใหม่ที่คุณขอ ⭐️⭐️⭐️
        // (เราตรวจสอบก่อนส่งไป Cognito)
        if (!email.endsWith('@dome.tu.ac.th')) {
            console.error('Invalid email domain:', email);
            errorMessage.innerText = 'โปรดใส่ Email @dome.tu.ac.th ที่ลงทะเบียนไว้.';
            errorMessage.style.display = 'block';
            return; // 👈 หยุดการทำงาน (ไม่ Login)
        }
        // ⭐️⭐️⭐️ จบส่วนโค้ดใหม่ ⭐️⭐️⭐️
        // 

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
               4. 🚦 แยกหน้า ADMIN / USER
               ============================================== */
            
            const session = await Amplify.Auth.currentSession();
            const idTokenPayload = session.getIdToken().payload;
            const groups = idTokenPayload['cognito:groups']; 

            if (groups && groups.includes('Admins')) {
                console.log('User is an Admin. Redirecting to admin page...');
                window.location.href = 'admin-home.html'; 
            } else {
                console.log('User is a regular User. Redirecting to user page...');
                window.location.href = 'user-home.html'; 
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