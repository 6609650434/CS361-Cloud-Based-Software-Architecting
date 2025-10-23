const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");

profileBtn.addEventListener("click", () => {
    profileMenu.classList.toggle("active");
});

// ปิด popup ถ้าคลิกนอกเมนู
document.addEventListener("click", (e) => {
    if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove("active");
    }
});