document.addEventListener("DOMContentLoaded", () => {
  const addReportBtn = document.getElementById("addReportBtn");
  const popup = document.getElementById("reportPopup");
  const cancelBtn = document.getElementById("cancelBtn");
  const postBtn = document.getElementById("postBtn");

  // เปิด popup
  addReportBtn.addEventListener("click", () => {
    popup.classList.add("active");
  });

  // ปิด popup
  cancelBtn.addEventListener("click", () => {
    popup.classList.remove("active");
  });

  // ปิด popup เมื่อคลิกนอก
  window.addEventListener("click", (e) => {
    if (e.target === popup) popup.classList.remove("active");
  });

  // ปุ่ม POST
  postBtn.addEventListener("click", () => {
    const title = document.getElementById("titleInput").value.trim();
    const position = document.getElementById("positionInput").value.trim();
    const desc = document.getElementById("descInput").value.trim();
    const imageFile = document.getElementById("imageUpload").files[0];

    if (!title || !position || !desc) {
      alert("Please fill in all fields!");
      return;
    }

    // อ่านรูปภาพเป็น Base64 (ถ้ามี)
    const reader = new FileReader();
    reader.onload = function () {
      const imageData = imageFile ? reader.result : null;

      const newReport = {
        id: Date.now(),
        title,
        position,
        desc,
        image: imageData,
        status: "Pending",
        date: new Date().toLocaleString(),
      };

      // เก็บไว้ใน localStorage ของ user
      const userReports = JSON.parse(localStorage.getItem("userReports")) || [];
      userReports.push(newReport);
      localStorage.setItem("userReports", JSON.stringify(userReports));

      // ส่งไปยัง admin ด้วย (จำลอง database กลาง)
      const adminReports = JSON.parse(localStorage.getItem("adminReports")) || [];
      adminReports.push(newReport);
      localStorage.setItem("adminReports", JSON.stringify(adminReports));

      alert("Report submitted successfully!");
      popup.classList.remove("active");

      // เคลียร์ input
      document.getElementById("titleInput").value = "";
      document.getElementById("positionInput").value = "";
      document.getElementById("descInput").value = "";
      document.getElementById("imageUpload").value = "";
    };

    if (imageFile) reader.readAsDataURL(imageFile);
    else reader.onload();
  });
});
