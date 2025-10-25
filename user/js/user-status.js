// Function to toggle status details
function toggleStatusDetails(header) {
    const card = header.closest('.status-card');
    card.classList.toggle('expanded');
}

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
                <div class="status-header" onclick="toggleStatusDetails(this)">
                    <div class="status-preview">
                        <div class="title-section">
                            <span class="date">${report.date}</span>
                            <h3 class="status-title">${report.title}</h3>
                        </div>
                        <span class="status-tag ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="status-details">
                    <div class="details-content">
                        ${report.image ? `
                            <div class="image-container">
                                <img src="${report.image}" class="report-img" alt="Report image">
                            </div>
                        ` : ''}
                        <div class="text-content">
                            <p><strong>ตำแหน่ง:</strong> ${report.position}</p>
                            <p class="description"><strong>รายละเอียด:</strong> ${report.desc}</p>
                        </div>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    }
    
    // แสดงรายการเมื่อโหลดหน้า
    displayUserReports();
});