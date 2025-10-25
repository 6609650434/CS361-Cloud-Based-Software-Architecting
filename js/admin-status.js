// คอมเมนต์ทั้งหมดเป็นภาษาไทย
// โค้ดนี้ใช้ <template> ใน HTML แล้ว clone เพื่อเติมข้อมูล — ไม่สร้าง HTML ด้วย string

document.addEventListener("DOMContentLoaded", () => {
  const statusList = document.getElementById("statusList");
  const searchInput = document.getElementById("searchInput");
  const reportTpl = document.getElementById("report-template");
  const placeholderTpl = document.getElementById("placeholder-template");

  // โหลดรายการ pending จาก localStorage (คืนค่าเป็น array)
  function loadPendingReports() {
    try {
      return JSON.parse(localStorage.getItem("pendingReports")) || [];
    } catch (e) {
      return [];
    }
  }

  // บันทึกรายการ pending กลับลง localStorage
  function savePendingReports(list) {
    localStorage.setItem("pendingReports", JSON.stringify(list));
  }

  // คืนข้อความสถานะภาษาไทย (ถ้ามี statusText ให้ใช้นั้น)
  function getStatusText(report) {
    return report.statusText || "อยู่ระหว่างตรวจสอบ";
  }

  // ฟังก์ชันแสดงรายการโดย clone template (ไม่ใช้ innerHTML สตริง)
  function displayPendingReports(filter = "") {
    const pending = loadPendingReports();
    const q = (filter || "").toLowerCase();

    // กรองตามคำค้น
    const filtered = pending.filter(r => {
      if (!q) return true;
      return (r.title || "").toLowerCase().includes(q) ||
             (r.position || "").toLowerCase().includes(q) ||
             (r.desc || "").toLowerCase().includes(q);
    });

    // เคลียร์รายการเดิม
    statusList.innerHTML = "";

    // ถ้าไม่มีรายการ ให้แสดง placeholder (class empty)
    if (filtered.length === 0) {
      const ph = placeholderTpl.content.cloneNode(true);
      statusList.appendChild(ph);
      return;
    }

    // สร้างแต่ละการ์ดโดย clone template
    filtered.forEach((report, idx) => {
      const node = reportTpl.content.cloneNode(true);
      const article = node.querySelector("article.status-card");

      // เติมข้อความใน field ต่าง ๆ
      const setFieldText = (selector, value) => {
        const el = node.querySelector(selector);
        if (el) el.textContent = value ?? "";
      };

      setFieldText("[data-field='title']", report.title || "ไม่มีหัวข้อ");
      setFieldText("[data-field='time']", report.time || "");
      setFieldText("[data-field='date']", report.date || "");
      setFieldText("[data-field='position']", report.position || "-");
      setFieldText("[data-field='status']", getStatusText(report));
      setFieldText("[data-field='desc']", report.desc || "-");
      setFieldText("[data-field='time2']", (report.time || "") + (report.date ? " " + report.date : "") );

      // จัดการรูป: ถ้าไม่มีรูป ให้ซ่อน container
      const imgEl = node.querySelector("[data-field='image']");
      const imgContainer = node.querySelector("[data-image-container]");
      if (report.image && imgEl && imgContainer) {
        imgEl.src = report.image;
        imgEl.alt = report.title || "report image";
        imgContainer.style.display = ""; // แสดง
      } else if (imgContainer) {
        imgContainer.style.display = "none"; // ซ่อนถ้าไม่มีรูป
      }

      // เก็บ id/index ไว้ใน article และปุ่ม
      if (article) {
        article.dataset.id = report.id;
        article.dataset.index = idx;
        article.setAttribute("aria-expanded", "false");

        // ปุ่ม: หาใน clone แล้วผูก listener (stopPropagation เพื่อไม่ให้ trigger toggle)
        const approveBtn = node.querySelector("button.approve-btn");
        const doneBtn = node.querySelector("button.done-btn");
        const rejectBtn = node.querySelector("button.reject-btn");

        if (approveBtn) {
          approveBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            updateReportStatus(report.id, "approve");
          });
        }
        if (doneBtn) {
          doneBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            updateReportStatus(report.id, "done");
          });
        }
        if (rejectBtn) {
          rejectBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            updateReportStatus(report.id, "reject");
          });
        }

        // คลิกที่ article => toggle ขยาย/ยุบ (ผูกตรงกับ element clone)
        article.addEventListener("click", () => toggleCard(article));
        // คีย์บอร์ด: Enter เพื่อขยาย
        article.addEventListener("keydown", (e) => {
          if (e.key === "Enter") toggleCard(article);
        });
      }

      // append ไปยัง list
      statusList.appendChild(node);
    });
  }

  // toggle การ์ด: เพิ่ม/ลบ class expanded และจัด aria
  function toggleCard(card) {
    if (!card) return;
    const isExpanded = card.classList.toggle("expanded");
    card.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    const detailEl = card.querySelector(".report-detail-content");
    if (detailEl) detailEl.setAttribute("aria-hidden", !isExpanded);
    if (isExpanded) {
      setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    }
  }

  // อัพเดทสถานะเมื่อกดปุ่ม Approve / Done / Reject
  function updateReportStatus(reportId, action) {
    const pending = loadPendingReports();
    const idx = pending.findIndex(r => String(r.id) === String(reportId));
    if (idx === -1) return;

    const report = pending[idx];
    let newStatus = "";
    let newStatusText = "";

    if (action === "approve") { newStatus = "Approved"; newStatusText = "อนุมัติ"; }
    if (action === "done")    { newStatus = "Done";     newStatusText = "เสร็จแล้ว"; }
    if (action === "reject")  { newStatus = "Rejected"; newStatusText = "ไม่อนุมัติ"; }

    // อัพเดท userReports (ถ้ามี)
    const userReports = JSON.parse(localStorage.getItem("userReports")) || [];
    const updatedUserReports = userReports.map(r => r.id === report.id ? { ...r, status: newStatus, statusText: newStatusText } : r);
    localStorage.setItem("userReports", JSON.stringify(updatedUserReports));

    // ถ้าอนุมัติ/เสร็จ ให้ย้ายไป approvedPosts
    if (newStatus === "Approved" || newStatus === "Done") {
      const approved = JSON.parse(localStorage.getItem("approvedPosts")) || [];
      approved.push({ ...report, status: newStatus, statusText: newStatusText });
      localStorage.setItem("approvedPosts", JSON.stringify(approved));
    }

    // ลบจาก pending และบันทึก
    pending.splice(idx, 1);
    savePendingReports(pending);

    // รีเฟรช UI (รักษาคำค้นถ้ามี)
    const q = (searchInput && searchInput.value) ? searchInput.value.trim() : "";
    displayPendingReports(q);
  }

  // ให้เรียกได้จาก inline onclick ถ้าจำเป็น (fallback)
  window.handleAction = (reportId, action) => {
    if (!reportId || !action) return;
    updateReportStatus(reportId, action);
  };

  // search realtime (ถ้ามี input)
  if (searchInput) {
    searchInput.addEventListener("input", () => displayPendingReports(searchInput.value.trim()));
  }

  // แสดงครั้งแรก
  displayPendingReports();
});