document.addEventListener("DOMContentLoaded", () => {
  const addReportBtn = document.getElementById("addReportBtn");
  const popup = document.getElementById("reportPopup");
  const cancelBtn = document.getElementById("cancelBtn");
  const postBtn = document.getElementById("postBtn");
  
  // แสดง post ที่ admin approve/done แล้ว
  displayApprovedPosts();

  // เปิด/ปิด popup (toggle) และจัดการตำแหน่ง
  if (addReportBtn) {
    addReportBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // if already open, close it (toggle behavior)
      if (popup.classList.contains("active")) {
        popup.classList.remove("active");
        // remove inline positioning so CSS default is restored next time
        popup.style.position = "";
        popup.style.top = "";
        popup.style.left = "";
        popup.style.right = "";
        popup.style.bottom = "";
        return;
      }

      // otherwise open and position
      try {
        // reset any previously set inline positions
        popup.style.left = "";
        popup.style.top = "";
        popup.style.right = "";
        popup.style.bottom = "";

        const btnRect = addReportBtn.getBoundingClientRect();
        // ensure popup is temporarily visible to measure it
        popup.classList.add("active");
        const popupRect = popup.getBoundingClientRect();

        // preferred: place above the button
        let top = btnRect.top - popupRect.height - 8; // 8px gap
        let left = btnRect.left + (btnRect.width / 2) - (popupRect.width / 2);

        // If placing above would go off the top, place below the button
        if (top < 8) {
          top = btnRect.bottom + 8;
        }

        // Clamp horizontally to viewport with 8px padding
        const pad = 8;
        if (left < pad) left = pad;
        if (left + popupRect.width > window.innerWidth - pad) {
          left = Math.max(pad, window.innerWidth - popupRect.width - pad);
        }

        // Clamp vertically as well
        if (top + popupRect.height > window.innerHeight - pad) {
          top = Math.max(pad, window.innerHeight - popupRect.height - pad);
        }

        // place using fixed positioning
        popup.style.position = "fixed";
        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
      } catch (err) {
        // fallback: simply show popup in its normal (CSS) position
        popup.classList.add("active");
      }
    });
  }

  // ปิด popup
  cancelBtn.addEventListener("click", () => {
    popup.classList.remove("active");
    popup.style.position = "";
    popup.style.top = "";
    popup.style.left = "";
    popup.style.right = "";
    popup.style.bottom = "";
  });

  // ปิด popup เมื่อคลิกนอก
  document.addEventListener("click", (e) => {
    if (popup.classList.contains("active") && !popup.contains(e.target) && !addReportBtn.contains(e.target)) {
      popup.classList.remove("active");
      popup.style.position = "";
      popup.style.top = "";
      popup.style.left = "";
      popup.style.right = "";
      popup.style.bottom = "";
    }
  });

  // ปิดด้วยปุ่ม Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup.classList.contains("active")) {
      popup.classList.remove("active");
      popup.style.position = "";
      popup.style.top = "";
      popup.style.left = "";
      popup.style.right = "";
      popup.style.bottom = "";
    }
  });

  // แสดงชื่อไฟล์เมื่อเลือกไฟล์
  const imageUpload = document.getElementById("imageUpload");
  const fileName = document.getElementById("fileName");
  
  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      fileName.textContent = `📎 ${file.name}`;
      fileName.classList.add("show");
    } else {
      fileName.classList.remove("show");
    }
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
        userId: "current_user" // จำลอง user ID
      };

      // เก็บไว้ใน localStorage ของ user (สำหรับ status page)
      const userReports = JSON.parse(localStorage.getItem("userReports")) || [];
      userReports.push(newReport);
      localStorage.setItem("userReports", JSON.stringify(userReports));

      // ส่งไปยัง admin สำหรับตรวจสอบ
      const pendingReports = JSON.parse(localStorage.getItem("pendingReports")) || [];
      pendingReports.push(newReport);
      localStorage.setItem("pendingReports", JSON.stringify(pendingReports));

      alert("Report submitted successfully!");
      popup.classList.remove("active");

      // เคลียร์ input
      document.getElementById("titleInput").value = "";
      document.getElementById("positionInput").value = "";
      document.getElementById("descInput").value = "";
      document.getElementById("imageUpload").value = "";
      fileName.classList.remove("show");
    };

    if (imageFile) reader.readAsDataURL(imageFile);
    else reader.onload();
  });
  
  // ฟังก์ชันแสดง post ที่ admin approve/done แล้ว
  function displayApprovedPosts() {
    const approvedPosts = JSON.parse(localStorage.getItem("approvedPosts")) || [];
    const homeContainer = document.querySelector('main');

    // defensive: if main is missing, create one at body end
    if (!homeContainer) {
      const newMain = document.createElement('main');
      newMain.innerHTML = approvedPosts.length === 0 ? '<p style="text-align: center; color: #666; margin-top: 50px;">No approved posts yet.</p>' : '';
      document.body.appendChild(newMain);
      return;
    }
    
    if (approvedPosts.length === 0) {
      homeContainer.innerHTML = '<p style="text-align: center; color: #666; margin-top: 50px;">No approved posts yet.</p>';
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
    
    homeContainer.innerHTML = postsHTML;
  }
});
