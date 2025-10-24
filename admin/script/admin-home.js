document.addEventListener("DOMContentLoaded", () => {
  const adminReportList = document.getElementById("adminReportList");
  
  // แสดง post ที่ admin approve/done แล้ว
  displayApprovedPosts();
  
  function displayApprovedPosts() {
    const approvedPosts = JSON.parse(localStorage.getItem("approvedPosts")) || [];
    
    if (approvedPosts.length === 0) {
      adminReportList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 50px;">No approved posts yet.</p>';
      return;
    }
    
    const postsHTML = approvedPosts.map(post => `
      <div class="report-card">
        <div class="report-header">
          <div class="report-meta">
            <span>${post.date}</span>
          </div>
          <h3 class="report-title">${post.title}</h3>
          <p class="report-status">
            <strong>Status:</strong> 
            <span class="status-tag ${post.status.toLowerCase()}">${post.status}</span>
          </p>
        </div>
        <div class="report-detail-content">
          <div class="detail-info-wrapper">
            ${post.image ? `
              <div class="detail-image-container">
                <img src="${post.image}" class="report-detail-image" alt="Report image">
              </div>
            ` : ''}
            <div class="detail-text-block">
              <div class="detail-meta">
                <span class="detail-location"><strong>Location:</strong> ${post.position}</span>
                <span class="detail-time"><strong>Time:</strong> ${post.date}</span>
              </div>
              <div class="detail-description-box">
                <strong>Description:</strong><br>
                ${post.desc}
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    adminReportList.innerHTML = postsHTML;
  }
});
