// แปลงสถานะเป็นภาษาไทย
function getThaiStatus(status) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'รอการตรวจสอบ';
    case 'approved':
      return 'อยู่ระหว่างดำเนินการ';
    case 'done':
      return 'ดำเนินการเสร็จสิ้น';
    case 'rejected':
      return 'ไม่อนุมัติ';
    default:
      return status;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const addReportBtn = document.getElementById("addReportBtn");
  const popup = document.getElementById("reportPopup");
  const cancelBtn = document.getElementById("cancelBtn");
  const postBtn = document.getElementById("postBtn");
  
  // แสดง post ที่ admin approve/done แล้ว
  displayApprovedPosts();

  // เปิด/ปิด popup (toggle) - *** ลบส่วนคำนวณตำแหน่งออกแล้ว ***
  if (addReportBtn) {
    addReportBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // แค่สลับ class 'active' อย่างเดียว
      popup.classList.toggle("active"); 
    });
  }

  // ปิด popup
  if (cancelBtn) { // เพิ่มการตรวจสอบเผื่อ element ไม่มี
    cancelBtn.addEventListener("click", () => {
      popup.classList.remove("active");
    });
  }

  // ปิด popup เมื่อคลิกนอก
  document.addEventListener("click", (e) => {
    // เพิ่มการตรวจสอบว่า addReportBtn มีอยู่จริง ก่อนเรียก .contains
    if (popup.classList.contains("active") && !popup.contains(e.target) && addReportBtn && !addReportBtn.contains(e.target)) {
      popup.classList.remove("active");
    }
  });

  // ปิดด้วยปุ่ม Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup.classList.contains("active")) {
      popup.classList.remove("active");
    }
  });

  // แสดงชื่อไฟล์เมื่อเลือกไฟล์
  const imageUpload = document.getElementById("imageUpload");
  const fileName = document.getElementById("fileName");
  
  if (imageUpload) { // เพิ่มการตรวจสอบ
    imageUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && fileName) { // เพิ่มการตรวจสอบ fileName
        fileName.textContent = `📎 ${file.name}`;
        fileName.classList.add("show");
      } else if (fileName) {
        fileName.classList.remove("show");
      }
    });
  }

  // ปุ่ม POST
  if (postBtn) { // เพิ่มการตรวจสอบ
    postBtn.addEventListener("click", () => {
      const titleInput = document.getElementById("titleInput");
      const positionInput = document.getElementById("positionInput");
      const descInput = document.getElementById("descInput");
      const imageUploadInput = document.getElementById("imageUpload"); // เปลี่ยนชื่อตัวแปร
      
      // เพิ่มการตรวจสอบ element ก่อน .value / .files
      if (!titleInput || !positionInput || !descInput || !imageUploadInput) {
          alert("Error: Some form elements are missing.");
          return;
      }

      const title = titleInput.value.trim();
      const position = positionInput.value.trim();
      const desc = descInput.value.trim();
      const imageFile = imageUploadInput.files[0];

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
          status: "Pending", // สถานะเริ่มต้น
          date: new Date().toLocaleString(),
          userId: "current_user" // *** ต้องเปลี่ยนเป็น User ID จริงจาก Cognito ***
        };

        // เก็บไว้ใน localStorage ของ user (สำหรับ status page)
        try {
            const userReports = JSON.parse(localStorage.getItem("userReports")) || [];
            userReports.push(newReport);
            localStorage.setItem("userReports", JSON.stringify(userReports));
        } catch (error) {
            console.error("Error saving user report to localStorage:", error);
            alert("Could not save your report locally.");
            return; // หยุดถ้าเซฟไม่ได้
        }


        // ส่งไปยัง admin สำหรับตรวจสอบ (ต้องเปลี่ยนไปใช้ API จริง)
        try {
            const pendingReports = JSON.parse(localStorage.getItem("pendingReports")) || [];
            pendingReports.push(newReport);
            localStorage.setItem("pendingReports", JSON.stringify(pendingReports));
        } catch (error) {
            console.error("Error saving pending report to localStorage:", error);
            // ไม่จำเป็นต้องหยุด user แค่ admin อาจจะไม่เห็น
        }


        alert("Report submitted successfully!");
        popup.classList.remove("active");

        // เคลียร์ input
        titleInput.value = "";
        positionInput.value = "";
        descInput.value = "";
        imageUploadInput.value = ""; // ใช้ Input element โดยตรง
        if (fileName) {
          fileName.classList.remove("show");
          fileName.textContent = ""; // เคลียร์ข้อความด้วย
        }
      };
      
      reader.onerror = function() {
          alert("Error reading image file.");
      };

      if (imageFile) {
          reader.readAsDataURL(imageFile);
      } else {
          // ถ้าไม่มีรูป ก็เรียก onload() โดยตรงเลย ไม่ต้องรออ่านไฟล์
          reader.onload(); 
      }
    });
  }
  
  // ฟังก์ชันแสดง post ที่ admin approve/done แล้ว
  function displayApprovedPosts() {
    let approvedPosts = [];
    try {
        approvedPosts = JSON.parse(localStorage.getItem("approvedPosts")) || [];
    } catch (error) {
        console.error("Error reading approved posts from localStorage:", error);
        approvedPosts = []; // ใช้ค่าว่างถ้าอ่านไม่ได้
    }
    
    const reportList = document.getElementById('reportList') || document.querySelector('main');
    
    if (!reportList) {
      console.error('Report list container not found');
      return;
    }

    // ล้างเนื้อหาเก่าก่อนแสดงผลใหม่
    reportList.innerHTML = ''; 

    if (approvedPosts.length === 0) {
      reportList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 50px;">ยังไม่มีรายงานที่อนุมัติ</p>';
      return;
    }
    
    // ฟังก์ชัน toggle ย้ายเข้ามาข้างใน เพื่อไม่ให้เป็น global
    function toggleDescription(buttonElement) {
        const card = buttonElement.closest('.report-card');
        if (!card) return;
        
        const descContainer = card.querySelector('.preview-description');
        const descText = descContainer.querySelector('.description-text');
        const seeMoreBtn = descContainer.querySelector('.see-more-btn');
        
        if (descText.classList.contains('truncated')) {
            descText.classList.remove('truncated');
            seeMoreBtn.textContent = 'ดูน้อยลง';
        } else {
            descText.classList.add('truncated');
            seeMoreBtn.textContent = 'ดูเพิ่มเติม';
        }
    }

    approvedPosts.forEach(post => {
      // สร้าง div container สำหรับ report card
      const cardElement = document.createElement('div');
      cardElement.className = 'report-card';
      
      const needsTruncation = post.desc && post.desc.length > 250;
      
      cardElement.innerHTML = `
        <div class="report-header">
          <div class="report-preview">
            ${post.image ? `
              <div class="preview-image-container">
                <img src="${post.image}" class="preview-image" alt="${post.title || 'Report Image'}" loading="lazy"/>
              </div>
            ` : ''}
            <div class="preview-content">
              <div class="report-title">${post.title || 'ไม่มีหัวข้อ'}</div>
              <div class="preview-description">
                <div class="description-text${needsTruncation ? ' truncated' : ''}">${post.desc || ''}</div>
                ${needsTruncation ? `
                  <button class="see-more-btn">
                    ดูเพิ่มเติม
                  </button>
                ` : ''}
              </div>
              <div class="report-info">
                <div class="report-meta">
                  <div><strong>ตำแหน่ง:</strong> ${post.position || '-'}</div>
                  <div><strong>เวลา:</strong> ${post.date || '-'}</div>
                </div>
                <span class="status-value ${post.status ? post.status.toLowerCase() : ''}">${getThaiStatus(post.status || '')}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // เพิ่ม Event Listener ให้ปุ่ม "ดูเพิ่มเติม" (ถ้ามี)
      const seeMoreBtn = cardElement.querySelector('.see-more-btn');
      if (seeMoreBtn) {
          seeMoreBtn.addEventListener('click', (event) => {
              event.stopPropagation(); // ป้องกัน event อื่นๆ ที่อาจจะติดมากับ card
              toggleDescription(seeMoreBtn); // เรียกฟังก์ชัน toggle
          });
      }
      
      // เพิ่ม card element ลงใน list container
      reportList.appendChild(cardElement);
    });
  } // จบฟังก์ชัน displayApprovedPosts

}); // จบ DOMContentLoaded