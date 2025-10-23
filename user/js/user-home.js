document.addEventListener("DOMContentLoaded", () => {
  const addReportBtn = document.getElementById("addReportBtn");
  const popup = document.getElementById("reportPopup");
  const cancelBtn = document.getElementById("cancelBtn");

  addReportBtn.addEventListener("click", () => {
    popup.classList.add("active");
  });

  cancelBtn.addEventListener("click", () => {
    popup.classList.remove("active");
  });

  // คลิกนอก popup เพื่อปิด
  window.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.classList.remove("active");
    }
  });
});
