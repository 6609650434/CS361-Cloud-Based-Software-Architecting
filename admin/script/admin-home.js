document.addEventListener("DOMContentLoaded", () => {
  const adminReportList = document.getElementById("adminReportList");

  // ดึงข้อมูลจาก localStorage
  let adminReports = JSON.parse(localStorage.getItem("adminReports")) || [];
  let userReports = JSON.parse(localStorage.getItem("userReports")) || [];

  // แสดงรายงานทั้งหมด
  adminReports.forEach((report, index) => {
    const card = document.createElement("div");
    card.className = "report-card";

    card.innerHTML = `
      <h3>${report.title}</h3>
      <p><strong>Detail:</strong> ${report.detail}</p>
      <p><strong>Status:</strong> <span class="status ${report.status.toLowerCase()}">${report.status}</span></p>
      <div class="admin-actions">
        <button class="approve-btn" data-index="${index}">Approve ✅</button>
        <button class="reject-btn" data-index="${index}">Reject ❌</button>
      </div>
    `;

    adminReportList.appendChild(card);
  });

  // เมื่อกดปุ่ม Approve / Reject
  adminReportList.addEventListener("click", (e) => {
    if (e.target.classList.contains("approve-btn") || e.target.classList.contains("reject-btn")) {
      const index = e.target.getAttribute("data-index");
      const newStatus = e.target.classList.contains("approve-btn") ? "Approved" : "Rejected";

      // อัปเดตใน adminReports
      adminReports[index].status = newStatus;
      localStorage.setItem("adminReports", JSON.stringify(adminReports));

      // อัปเดตใน userReports ให้ตรงกัน (อ้างจาก title)
      const targetTitle = adminReports[index].title;
      userReports = userReports.map((r) =>
        r.title === targetTitle ? { ...r, status: newStatus } : r
      );
      localStorage.setItem("userReports", JSON.stringify(userReports));

      // Refresh หน้า
      window.location.reload();
    }
  });
});
