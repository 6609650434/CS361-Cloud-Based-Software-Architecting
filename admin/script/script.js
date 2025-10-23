function toggleDetail(reportId) {
    const currentItem = document.getElementById(reportId);
    const isActive = currentItem.classList.contains('active');

    // 1. ยุบรายการที่เปิดอยู่ทั้งหมดก่อน (ถ้ามี)
    document.querySelectorAll('.report-item.active').forEach(item => {
        item.classList.remove('active');
    });
    
    // 2. ถ้ารายการที่คลิกยังไม่เปิด ให้เปิดรายการนั้น
    if (!isActive) {
        currentItem.classList.add('active');
    }
}