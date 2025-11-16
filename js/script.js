// script.js
document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");

  if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", () => {
      profileMenu.classList.toggle("active");
    });

    // คลิกนอก popup เพื่อปิด
    window.addEventListener("click", (e) => {
      if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove("active");
      }
    });
  }

  // 1. ดึงค่าอีเมลจาก localStorage
    // !!! สำคัญ: คุณต้องเปลี่ยน 'emailKey' เป็น "key" 
    // ที่คุณใช้ตอนเก็บอีเมลลงใน localStorage นะครับ
    const storedEmail = localStorage.getItem('user_email');

    // 2. ค้นหา element ที่มี id="profileEmail"
    const emailDisplayElement = document.getElementById('profileEmail');

    // 3. ตรวจสอบว่าหา element เจอ และมีข้อมูลอีเมลที่ดึงมา
    if (emailDisplayElement && storedEmail) {
        // 4. นำค่าอีเมลไปแสดงใน element นั้น
        emailDisplayElement.textContent = storedEmail;
    } else {
        // (Optional) เผื่อไว้ในกรณีที่หา element ไม่เจอ หรือไม่มีอีเมลใน localStorage
        if (emailDisplayElement) {
            emailDisplayElement.textContent = 'ไม่พบข้อมูลอีเมล';
        }
        console.warn('ไม่พบ element "profileEmail" หรือไม่พบอีเมลใน localStorage');
    }
});