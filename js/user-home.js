// ../js/user-home.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE =
    "https://1pb257oa3g.execute-api.us-east-1.amazonaws.com/prod";

  // -----------------------------
  // ข้อมูลผู้ใช้จาก localStorage (ใช้ทั้งแสดงชื่อ & auth header)
  // -----------------------------
  const userEmail = localStorage.getItem("user_email") || "";
  const userRole = localStorage.getItem("user_role") || "";
  const idToken = localStorage.getItem("id_token") || "";

  const authHeader = idToken
    ? {
        Authorization: idToken.startsWith("Bearer ")
          ? idToken
          : `Bearer ${idToken}`,
      }
    : {};

  // แสดง user info (ถ้ามี element ให้แสดง)
  const infoBox = document.getElementById("userInfo");
  if (infoBox && userEmail) {
    infoBox.textContent = `${userEmail} (${userRole || "USER"})`;
  }

  // -----------------------------
  // ส่วนแสดง feed HOME (approved + finish/done)
  // -----------------------------
  const feedList = document.getElementById("feedList");

  const S3_PUBLIC_BASE =
    "https://tu-emergency-alert-bucket-cp2.s3.amazonaws.com/";

  function s3UrlFromKey(key) {
    if (!key) return null;
    if (/^https?:\/\//i.test(key)) return key;
    return S3_PUBLIC_BASE + key.replace(/^\/+/, "");
  }

  function statusLabel(s) {
    const x = (s || "").toLowerCase();
    if (x === "approved") return "กำลังดำเนินการแก้ไข";
    if (x === "finish" || x === "done") return "ดำเนินการแก้ไขเสร็จสิ้น";
    return s || "-";
  }

  // ✅ แก้ให้คืนค่า เวลา + วันที่ + พ.ศ.
  function formatTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    const pad = (n) => String(n).padStart(2, "0");
    const hours = pad(d.getHours());
    const mins  = pad(d.getMinutes());
    const day   = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const yearBE = d.getFullYear() + 543;
    return `${hours}:${mins} ${day}/${month}/${yearBE}`;
  }

  async function loadFeed() {
    if (!feedList) return;
    feedList.innerHTML =
      "<p style='text-align:center;margin-top:20px;color:#666'>กำลังโหลดข้อมูล.</p>";

    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      let items = data.items || data || [];

      // แสดงเฉพาะ approved + finish/done
      items = items.filter((it) => {
        const s = (it.status || "").toLowerCase();
        return s === "approved" || s === "finish" || s === "done";
      });

      // เรียงเวลาล่าสุดก่อน (ใช้ reportedAt เป็นหลัก)
      items.sort((a, b) =>
        (b.reportedAt || "").localeCompare(a.reportedAt || "")
      );

      renderFeed(items);
    } catch (err) {
      console.error(err);
      feedList.innerHTML =
        "<p style='padding:12px;color:#c00'>โหลดรายการไม่สำเร็จ</p>";
    }
  }

  function renderFeed(items) {
    if (!feedList) return;

    if (!items.length) {
      feedList.innerHTML =
        "<p style='text-align:center;margin-top:20px;color:#666'>ยังไม่มีเหตุที่กำลังดำเนินการหรือเสร็จสิ้น</p>";
      return;
    }

    feedList.innerHTML = "";

    items.forEach((r) => {
      const img =
        r.images && r.images.length ? s3UrlFromKey(r.images[0]) : null;
      const timeText = formatTime(r.reportedAt || r.createdAt);
      const title = r.title || "ไม่ระบุหัวข้อ";
      const location = r.location || "-";
      const desc = r.description || "-";
      const descShort =
        desc.length > 70 ? desc.substring(0, 70).trim() + "…" : desc;
      const statusText = statusLabel(r.status);
      const statusLower = (r.status || "").toLowerCase();
      const statusClass =
        statusLower === "finish" || statusLower === "done"
          ? "status-finished"
          : "";

      const card = document.createElement("article");
      card.className = "feed-card";

      card.innerHTML = `
        <div class="feed-body">
          ${
            img
              ? `
          <div class="feed-image-wrap">
            <img src="${img}" class="feed-image"
                 alt="incident image"
                 onerror="this.parentElement.style.display='none';" />
          </div>
          `
              : ""
          }

          <div class="feed-text-wrap">
            <div class="feed-header">
              <h3 class="feed-title">${title}</h3>
              <button class="feed-toggle-btn" aria-label="ดูรายละเอียด">▾</button>
            </div>

            <div class="feed-meta">
              <span>📍 ${location}</span>
              <span>🕒 ${timeText}</span>
            </div>

            <span class="feed-status-chip ${statusClass}">${statusText}</span>

            

            <div class="feed-extra">
              <p><strong>รายละเอียดเต็ม:</strong> ${desc}</p>
              <p><strong>สถานะ:</strong> ${statusText}</p>
            </div>
          </div>
        </div>
      `;

      const extra = card.querySelector(".feed-extra");
      const toggleBtn = card.querySelector(".feed-toggle-btn");
      const statusChip = card.querySelector(".feed-status-chip");
      const descShortEl = card.querySelector(".feed-desc-short");

      toggleBtn.addEventListener("click", () => {
        const isExpanded = extra.classList.contains("expanded");

        if (isExpanded) {
          extra.style.maxHeight = "0";
          extra.classList.remove("expanded");
          toggleBtn.textContent = "▾";
          if (statusChip) statusChip.style.display = "inline-block";
          if (descShortEl) descShortEl.style.display = "block";
        } else {
          extra.classList.add("expanded");
          setTimeout(() => {
            const scrollHeight = extra.scrollHeight;
            extra.style.maxHeight = scrollHeight + "px";
          }, 0);
          toggleBtn.textContent = "▴";
          if (statusChip) statusChip.style.display = "none";
          if (descShortEl) descShortEl.style.display = "none";
        }
      });

      feedList.appendChild(card);
    });
  }

  // โหลด feed ครั้งแรก
  loadFeed();

  // ============================
  // ส่วน popup + การส่งรายงาน (ใช้ presigned URL)
  // ============================
  const addReportBtn = document.getElementById("addReportBtn");
  const popup = document.getElementById("reportPopup");
  const cancelBtn = document.getElementById("cancelBtn");
  const postBtn = document.getElementById("postBtn");
  const imageUpload = document.getElementById("imageUpload");
  const fileName = document.getElementById("fileName");

  // เปิด popup กลางจอ
  if (addReportBtn) {
    addReportBtn.addEventListener("click", (e) => {
      e.preventDefault();
      popup.classList.add("active");
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => popup.classList.remove("active"));
  }

  // แสดงชื่อไฟล์
  if (imageUpload) {
    imageUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        fileName.textContent = `📎 ${file.name}`;
        fileName.classList.add("show");
      } else {
        fileName.classList.remove("show");
        fileName.textContent = "";
      }
    });
  }

  // กดส่งรายงาน (POST /reports + presigned upload)
  if (postBtn) {
    postBtn.addEventListener("click", async () => {
      const title = document.getElementById("titleInput").value.trim();
      const position = document.getElementById("positionInput").value.trim();
      const desc = document.getElementById("descInput").value.trim();
      const file = imageUpload ? imageUpload.files[0] : null;

      if (!title || !position || !desc) {
        alert("กรุณากรอกข้อมูลให้ครบ!");
        return;
      }

      // สร้าง incidentId ให้สอดคล้องกับ Lambda get_presigned_upload
      const today = new Date();
      const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
      const randPart = Math.floor(Math.random() * 9000 + 1000);
      const incidentId = `INC-${datePart}-${randPart}`;

      try {
        let uploadedKey = null;

        // (1) ถ้ามีไฟล์ → ขอ presigned URL จาก Lambda /uploads/presign แล้ว PUT
        if (file) {
          const contentType = file.type || "application/octet-stream";

          const presignRes = await fetch(`${API_BASE}/uploads/presign`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeader,
            },
            body: JSON.stringify({
              incidentId,
              filename: file.name,
              contentType,
            }),
          });

          if (!presignRes.ok) {
            const errTxt = await presignRes.text();
            throw new Error("ขอ presigned URL ไม่สำเร็จ: " + errTxt);
          }

          const { uploadUrl, key } = await presignRes.json();

          const putRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": contentType,
            },
            body: file,
          });

          if (!putRes.ok) {
            const t = await putRes.text();
            throw new Error("อัปโหลดรูปขึ้น S3 ไม่สำเร็จ: " + t);
          }

          uploadedKey = key;
          console.log("✅ Uploaded to S3:", uploadedKey);
        }

        // (2) เรียก POST /reports พร้อมแนบ key ของรูป (ถ้ามี)
        const payload = {
          title,
          location: position,
          description: desc,
          detail: desc,
          category: "ทั่วไป",
          reportedBy: userEmail || "unknown@dome.tu.ac.th",
          images: uploadedKey ? [uploadedKey] : [],
          incidentIdHint: incidentId,
        };

        const resp = await fetch(`${API_BASE}/reports`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify(payload),
        });

        const text = await resp.text();
        console.log("🔍 /reports Response:", text);

        if (!resp.ok) {
          alert("❌ ส่งรายงานไม่สำเร็จ: " + text);
          throw new Error(text);
        }

        alert("✅ ส่งรายงานสำเร็จ!");
        popup.classList.remove("active");

        // ล้างฟอร์ม
        document.getElementById("titleInput").value = "";
        document.getElementById("positionInput").value = "";
        document.getElementById("descInput").value = "";
        if (imageUpload) imageUpload.value = "";
        if (fileName) {
          fileName.textContent = "";
          fileName.classList.remove("show");
        }

        // refresh feed ให้เห็นรายงานใหม่
        loadFeed();
      } catch (err) {
        console.error("🚨 Error:", err);
        alert("❌ เกิดข้อผิดพลาด: " + err.message);
      }
    });
  }
});
