document.addEventListener("DOMContentLoaded", () => {
    const statusList = document.getElementById("statusList");

    let adminReports = JSON.parse(localStorage.getItem("adminReports")) || [];
    let userReports = JSON.parse(localStorage.getItem("userReports")) || [];

    // **[เพิ่ม]** ฟังก์ชันแปลงชื่อสถานะเป็นคลาส CSS
    const getStatusClass = (status) => {
        if (status === "กำลังดำเนินการ") return "in-progress";
        if (status === "ดำเนินการแล้ว") return "done";
        if (status === "ไม่พบเหตุ") return "rejected";
        return "pending"; // ใช้สำหรับ "รอการตรวจสอบ" หรือสถานะเริ่มต้น
    };

    // แสดงทุกโพสต์
    adminReports.forEach((report, index) => {
        const item = document.createElement("div");
        item.className = "status-card";
        
        // **[แก้ไข]** ใส่คลาสสถานะลงใน span
        const statusClass = getStatusClass(report.status);

        item.innerHTML = `
            <div class="summary" data-index="${index}">
                <p><strong>เหตุ:</strong> ${report.title}</p>
                <p><strong>สถานที่:</strong> ${report.location || "-"}</p>
                <p><strong>สถานะ:</strong> 
                    <span class="status-tag ${statusClass}">${report.status}</span>
                </p>
            </div>

            <div class="details hidden">
                <p><strong>รายละเอียด:</strong> ${report.detail}</p>
                ${report.image ? `<img src="${report.image}" alt="report image" class="report-img"/>` : ""}
                <div class="action-btns">
                    <button class="approve-btn" data-index="${index}">Approve</button>
                    <button class="done-btn" data-index="${index}">Done</button>
                    <button class="reject-btn" data-index="${index}">Reject</button>
                </div>
            </div>
        `;

        statusList.appendChild(item);
    });

    // กดเพื่อขยาย/ย่อรายละเอียด
    statusList.addEventListener("click", (e) => {
        if (e.target.classList.contains("summary")) {
            e.target.nextElementSibling.classList.toggle("hidden");
        }
    });

    // ปุ่ม hover/active สี
    statusList.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        if (!index) return;

        const parent = e.target.closest(".action-btns");

        if (e.target.tagName === "BUTTON") {
            parent.querySelectorAll("button").forEach(btn => btn.classList.remove("active"));
            e.target.classList.add("active");

            let newStatus = "";
            if (e.target.classList.contains("approve-btn")) newStatus = "กำลังดำเนินการ";
            else if (e.target.classList.contains("done-btn")) newStatus = "ดำเนินการแล้ว";
            else if (e.target.classList.contains("reject-btn")) newStatus = "ไม่พบเหตุ";

            // อัปเดตข้อมูล
            adminReports[index].status = newStatus;
            localStorage.setItem("adminReports", JSON.stringify(adminReports));

            const targetTitle = adminReports[index].title;
            userReports = userReports.map(r => 
                r.title === targetTitle ? { ...r, status: newStatus } : r
            );
            localStorage.setItem("userReports", JSON.stringify(userReports));

            // **[แก้ไข]** อัปเดตข้อความและคลาสสถานะทันที
            const statusTag = document.querySelector(`.summary[data-index="${index}"] .status-tag`);
            if (statusTag) {
                statusTag.textContent = newStatus;
                // **ใส่คลาสสีใหม่**
                statusTag.className = `status-tag ${getStatusClass(newStatus)}`; 
            }
        }
    });
});