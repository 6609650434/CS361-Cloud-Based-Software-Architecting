document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("statusList");
    
    // ฟังก์ชันแสดงรายการ post ของ user
    function displayUserReports() {
        const userReports = JSON.parse(localStorage.getItem("userReports")) || [];
        
        if (userReports.length === 0) {
            list.innerHTML = "<p style='text-align: center; color: #666; margin-top: 50px;'>No reports submitted yet.</p>";
            return;
        }

        list.innerHTML = ""; // เคลียร์รายการเก่า
        
        userReports.forEach(report => {
            const div = document.createElement("div");
            div.className = "status-card";
            
            // กำหนดสีสถานะ
            let statusClass = "pending";
            let statusText = "อยู่ระหว่างตรวจสอบ";
            
            if (report.status === "Approved") {
                statusClass = "approved";
                statusText = "อยู่ระหว่างการดำเนินการ";
            } else if (report.status === "Done") {
                statusClass = "done";
                statusText = "ดำเนินการแล้ว";
            } else if (report.status === "Rejected") {
                statusClass = "rejected";
                statusText = "ไม่สำเร็จ";
            }
            
            div.innerHTML = `
                <div class="status-header">
                    <div class="status-meta">
                        <span>${report.date}</span>
                    </div>
                    <h3 class="status-title">${report.title}</h3>
                    <p class="status-status">
                        <strong>Status:</strong> 
                        <span class="status-tag ${statusClass}">${statusText}</span>
                    </p>
                </div>
                <div class="details">
                    <p><strong>Location:</strong> ${report.position}</p>
                    <p><strong>Description:</strong> ${report.desc}</p>
                    ${report.image ? `<img src="${report.image}" class="report-img" alt="Report image">` : ""}
                </div>
            `;
            list.appendChild(div);
        });
    }
    
    // แสดงรายการเมื่อโหลดหน้า
    displayUserReports();
});