// js/user-status.js
// แสดง "ประวัติการรายงาน" ของ user แบบพับ/กางรายละเอียดได้

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE =
    "https://1pb257oa3g.execute-api.us-east-1.amazonaws.com/prod";
  const S3_BASE =
    "https://tu-emergency-alert-bucket-cp2.s3.amazonaws.com/";

  const statusList = document.getElementById("statusList");
  let allReports = [];

  // ------------------------------------------------------
  // 1) ดึง email ปัจจุบัน (localStorage ก่อน แล้ว fallback Cognito)
  // ------------------------------------------------------
  async function getCurrentUserEmail() {
    const stored = localStorage.getItem("user_email");
    if (stored) {
      console.log("[user-status] use email from localStorage:", stored);
      return stored;
    }

    try {
      if (window.aws_amplify_auth && window.aws_amplify_auth.Auth) {
        const user =
          await window.aws_amplify_auth.Auth.currentAuthenticatedUser();
        const email = user?.attributes?.email;
        console.log("[user-status] use email from Cognito:", email);
        return email || null;
      }
    } catch (e) {
      console.error("[user-status] Cannot load Cognito user:", e);
    }
    return null;
  }

  // ------------------------------------------------------
  // 2) helper: format วันที่/เวลา
  // ------------------------------------------------------
  function formatDateTime(iso) {
    if (!iso) return { date: "-", time: "-" };
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: "-", time: "-" };

    const date = d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const time = d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  }

  // ------------------------------------------------------
  // 3) helper: map status -> label ภาษาไทย + class สี
  // ------------------------------------------------------
  function statusToLabel(st) {
    if (!st) return "ไม่ระบุ";
    st = String(st).toLowerCase();

    switch (st) {
      case "pending_review":
        return "อยู่ระหว่างตรวจสอบ";
      case "approved":
        return "อนุมัติ";
      case "finish":
        return "อนุมัติ";
      case "rejected":
        return "ไม่พบเหตุ";
      case "done":
        return "ตรวจสอบเเล้ว";
      default:
        return st;
    }
  }

  function statusToClass(st) {
    if (!st) return "pending";
    st = String(st).toLowerCase();

    if (st === "pending_review") return "pending";
    if (st === "approved") return "approved";
    if (st === "finish") return "finish";
    if (st === "done") return "done";
    if (st === "rejected") return "rejected";
    return "pending";
  }

  // helper: แปลง key S3 -> URL
  function s3Url(key) {
    if (!key) return null;
    if (/^https?:\/\//i.test(key)) return key;
    return S3_BASE + key.replace(/^\/+/, "");
  }

  // ------------------------------------------------------
  // 4) เรียก Lambda /my/reports
  // ------------------------------------------------------
  async function loadMyReports(email) {
    try {
      const url = `${API_BASE}/my/reports?email=${encodeURIComponent(email)}`;
      console.log("[user-status] fetch:", url);

      const resp = await fetch(url);
      const data = await resp.json();
      console.log("[user-status] API response:", data);

      const rawReports = data.reports || [];

      allReports = rawReports.map((it) => {
        const images = (it.images || []).filter(Boolean);
        const createdAt =
          it.reportedAt || it.createdAt || it.lastUpdatedAt || null;

        return {
          id: it.incidentId || it.id,
          title: it.title || "ไม่ระบุหัวข้อ",
          location: it.location || "-",
          description:
            it.description || it.detail || it.details || "-",
          status: it.status || "-",
          createdAt,
          images,
          reportedBy: it.reportedBy || "-",
        };
      });

      renderReports();
    } catch (err) {
      console.error("[user-status] loadMyReports error:", err);
      statusList.innerHTML =
        `<p style="padding:16px;text-align:center;color:red;">โหลดข้อมูลไม่สำเร็จ: ${err.message}</p>`;
    }
  }

  // ------------------------------------------------------
  // 5) render การ์ดแบบพับ/กาง (ใช้โครงสร้างตาม status.css)
  // ------------------------------------------------------
  function renderReports() {
    statusList.innerHTML = "";

    if (!allReports.length) {
      statusList.innerHTML =
        "<p style='text-align:center;color:#666;margin-top:40px;'>ไม่มีประวัติการรายงาน</p>";
      return;
    }

    allReports.forEach((r) => {
      const { date, time } = formatDateTime(r.createdAt);
      const imgKey = r.images && r.images.length ? r.images[0] : null;
      const imgUrl = s3Url(imgKey);
      const statusLabel = statusToLabel(r.status);
      const statusClass = statusToClass(r.status);

      // โครงหลักของการ์ด (ให้ match กับ status.css)
      const card = document.createElement("div");
      card.className = "status-card";

      // ส่วนหัว (summary กดเพื่อพับ/กาง)
      const header = document.createElement("div");
      header.className = "status-header";

      const preview = document.createElement("div");
      preview.className = "status-preview";

      const titleSection = document.createElement("div");
      titleSection.className = "title-section";

      const dateSpan = document.createElement("span");
      dateSpan.className = "date";
      dateSpan.textContent = `${time}  ${date}`;

      const titleEl = document.createElement("h3");
      titleEl.className = "status-title";
      titleEl.textContent = r.title;

      const reporterP = document.createElement("p");
      reporterP.className = "status-status";
      reporterP.textContent = `ผู้รายงาน: ${r.reportedBy}`;

      const statusP = document.createElement("p");
      statusP.className = "status-status";

      const statusSpan = document.createElement("span");
      statusSpan.className = `status-tag ${statusClass}`;
      statusSpan.textContent = statusLabel;

      statusP.textContent = "สถานะ: ";
      statusP.appendChild(statusSpan);

      titleSection.appendChild(dateSpan);
      titleSection.appendChild(titleEl);
      titleSection.appendChild(reporterP);
      titleSection.appendChild(statusP);

      preview.appendChild(titleSection);
      header.appendChild(preview);

      // ส่วนรายละเอียด (ซ่อน/แสดงด้วย class expanded + CSS)
      const details = document.createElement("div");
      details.className = "status-details";

      const detailsContent = document.createElement("div");
      detailsContent.className = "details-content";

      if (imgUrl) {
        const imgContainer = document.createElement("div");
        imgContainer.className = "image-container";

        const imgEl = document.createElement("img");
        imgEl.className = "report-img";
        imgEl.src = imgUrl;
        imgEl.alt = "report image";

        imgContainer.appendChild(imgEl);
        detailsContent.appendChild(imgContainer);
      }

      const textContent = document.createElement("div");
      textContent.className = "text-content";

      const posP = document.createElement("p");
      posP.innerHTML = `<strong>ตำแหน่ง:</strong> ${r.location}`;

      const descP = document.createElement("p");
      descP.className = "description";
      descP.innerHTML = `<strong>รายละเอียด:</strong> ${r.description}`;

      textContent.appendChild(posP);
      textContent.appendChild(descP);

      detailsContent.appendChild(textContent);
      details.appendChild(detailsContent);

      // ประกอบการ์ด
      card.appendChild(header);
      card.appendChild(details);

      // behavior: กดหัวการ์ดเพื่อพับ/กาง
      header.addEventListener("click", () => {
        card.classList.toggle("expanded");
      });

      statusList.appendChild(card);
    });
  }

  // ------------------------------------------------------
  // 6) init
  // ------------------------------------------------------
  async function init() {
    statusList.innerHTML =
      "<p style='text-align:center;margin-top:40px;'>⏳ กำลังโหลดประวัติการรายงาน...</p>";

    const email = await getCurrentUserEmail();
    console.log("[user-status] current email =", email);

    if (!email) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      statusList.innerHTML = "";
      return;
    }

    await loadMyReports(email);
  }

  init();
});
