document.addEventListener("DOMContentLoaded", () => {
    const statusList = document.getElementById("statusList");
    
    // แสดง post ที่รอตรวจสอบ
    displayPendingReports();
    
    function displayPendingReports() {
        const pendingReports = JSON.parse(localStorage.getItem("pendingReports")) || [];
        
        if (pendingReports.length === 0) {
            statusList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 50px;">No pending reports to review.</p>';
            return;
        }
        
        const reportsHTML = pendingReports.map((report, index) => `
            <div class="report-card">
                <div class="report-header">
                    <div class="report-meta">
                        <span>${report.date}</span>
                    </div>
                    <h3 class="report-title">${report.title}</h3>
                    <p class="report-status">
                        <strong>Status:</strong> 
                        <span class="status-tag pending">Pending Review</span>
                    </p>
                </div>
                <div class="report-detail-content">
                    <div class="detail-info-wrapper">
                        ${report.image ? `
                            <div class="detail-image-container">
                                <img src="${report.image}" class="report-detail-image" alt="Report image">
                            </div>
                        ` : ''}
                        <div class="detail-text-block">
                            <div class="detail-meta">
                                <span class="detail-location"><strong>Location:</strong> ${report.position}</span>
                                <span class="detail-time"><strong>Time:</strong> ${report.date}</span>
                            </div>
                            <div class="detail-description-box">
                                <strong>Description:</strong><br>
                                ${report.desc}
                            </div>
                            <div class="admin-actions">
                                <button class="approve-btn" data-index="${index}">Approve</button>
                                <button class="done-btn" data-index="${index}">Done</button>
                                <button class="reject-btn" data-index="${index}">Reject</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        statusList.innerHTML = reportsHTML;
    }


    // จัดการปุ่ม approve/done/reject
    statusList.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        if (!index) return;

        if (e.target.tagName === "BUTTON") {
            const pendingReports = JSON.parse(localStorage.getItem("pendingReports")) || [];
            const report = pendingReports[index];
            
            let newStatus = "";
            let statusText = "";
            let statusClass = "";
            
            if (e.target.classList.contains("approve-btn")) {
                newStatus = "Approved";
                statusText = "อยู่ระหว่างการดำเนินการ";
                statusClass = "approved";
            } else if (e.target.classList.contains("done-btn")) {
                newStatus = "Done";
                statusText = "ดำเนินการแล้ว";
                statusClass = "done";
            } else if (e.target.classList.contains("reject-btn")) {
                newStatus = "Rejected";
                statusText = "ไม่สำเร็จ";
                statusClass = "rejected";
            }

            // อัปเดตสถานะใน user reports
            const userReports = JSON.parse(localStorage.getItem("userReports")) || [];
            const updatedUserReports = userReports.map(r => 
                r.id === report.id ? { ...r, status: newStatus } : r
            );
            localStorage.setItem("userReports", JSON.stringify(updatedUserReports));

            // ถ้า approve หรือ done ให้เพิ่มไปยัง approved posts
            if (newStatus === "Approved" || newStatus === "Done") {
                const approvedPosts = JSON.parse(localStorage.getItem("approvedPosts")) || [];
                const approvedPost = { ...report, status: newStatus };
                approvedPosts.push(approvedPost);
                localStorage.setItem("approvedPosts", JSON.stringify(approvedPosts));
            }

            // ลบออกจาก pending reports
            pendingReports.splice(index, 1);
            localStorage.setItem("pendingReports", JSON.stringify(pendingReports));

            // รีเฟรชหน้า
            displayPendingReports();
        }
    });
});