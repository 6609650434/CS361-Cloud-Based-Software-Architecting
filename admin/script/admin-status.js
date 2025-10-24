document.addEventListener("DOMContentLoaded", () => {
  const statusList = document.getElementById("statusList");

  let adminReports = JSON.parse(localStorage.getItem("adminReports")) || [];
  let userReports = JSON.parse(localStorage.getItem("userReports")) || [];

  // แสดงทุกโพสต์ของ user
  adminReports.forEach((report, index) => {
    const item = document.createElement("div");
    item.className = "status-card";

    // dropdown (แบบย่อ + ขยาย)
    item.innerHTML = `
      <div class="summary" data-index="${index}">
        <p><strong>เหตุ:</strong> ${report.title}</p>
        <p><strong>สถานที่:</strong> ${report.location || "-"}</p>
        <p><strong>สถานะ:</strong> 
          <span class="status-tag ${report.status.toLowerCase()}">${report.status}</span>
        </p>
      </div>

      <div class="details hidden">
        <p><strong>รายละเอียด:</strong> ${report.detail}</p>
        ${
          report.image
            ? `<img src="${report.image}" alt="report image" class="report-img"/>`
            : ""
        }

        <div class="action-btns">
          <button class="approve-btn" data-index="${index}">Approve ✅</button>
          <button class="done-btn" data-index="${index}">Done 🟩</button>
          <button class="reject-btn" data-index="${index}">Reject ❌</button>
        </div>
      </div>
    `;

    statusList.appendChild(item);
  });

  // กดเพื่อขยาย/ย่อ dropdown
  statusList.addEventListener("click", (e) => {
    if (e.target.classList.contains("summary")) {
      e.target.nextElementSibling.classList.toggle("hidden");
    }
  });

  // ปุ่มเปลี่ยนสถานะ
  statusList.addEventListener("click", (e) => {
    const index = e.target.getAttribute("data-index");
    if (!index) return;

    let newStatus = "";
    if (e.target.classList.contains("approve-btn")) newStatus = "กำลังดำเนินการ";
    else if (e.target.classList.contains("done-btn")) newStatus = "ดำเนินการแล้ว";
    else if (e.target.classList.contains("reject-btn")) newStatus = "ไม่พบเหตุ";
    else return;

    // อัปเดตใน adminReports
    adminReports[index].status = newStatus;
    localStorage.setItem("adminReports", JSON.stringify(adminReports));

    // อัปเดตใน userReports (จับคู่ด้วย title)
    const targetTitle = adminReports[index].title;
    userReports = userReports.map((r) =>
      r.title === targetTitle ? { ...r, status: newStatus } : r
    );
    localStorage.setItem("userReports", JSON.stringify(userReports));

    // รีเฟรชหน้า
    window.location.reload();
  });
});
