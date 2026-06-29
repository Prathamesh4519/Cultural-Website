import express from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Feedback from '../models/Feedback.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get dashboard analytics
// @route   GET /api/analytics/stats
// @access  Private (Admin/Owner)
router.get('/stats', protect, restrictTo('admin', 'owner'), async (req, res) => {
  try {
    let query = {};
    if (req.role === 'owner') {
      query.room = { $in: req.user.managedRooms };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Today's Bookings
    const todayBookingsCount = await Booking.countDocuments({
      ...query,
      date: { $gte: today, $lt: tomorrow },
      status: 'Approved'
    });

    // 2. Pending Approvals
    const pendingCount = await Booking.countDocuments({
      ...query,
      status: 'Pending'
    });

    // 3. Room utilization %
    // We compute: (Approved Booking Duration Hours in current month) / (Total capacity hours for all rooms)
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const approvedBookingsThisMonth = await Booking.find({
      ...query,
      status: 'Approved',
      date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });

    let totalBookedMinutes = 0;
    approvedBookingsThisMonth.forEach(b => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      const duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration > 0) totalBookedMinutes += duration;
    });

    const activeRoomsCount = await Room.countDocuments(
      req.role === 'owner' ? { _id: { $in: req.user.managedRooms }, isActive: true } : { isActive: true }
    );

    // Working hours per day = 10 (e.g. 09:00 to 19:00)
    // Days in month = ~30
    const workingHoursPerMonth = activeRoomsCount * 10 * 30;
    const bookedHours = totalBookedMinutes / 60;
    const utilizationRate = workingHoursPerMonth > 0 
      ? Math.min(Math.round((bookedHours / workingHoursPerMonth) * 100), 100) 
      : 0;

    // 4. Most active clubs
    const allApprovedBookings = await Booking.find({ ...query, status: 'Approved' });
    const clubCounts = {};
    allApprovedBookings.forEach(b => {
      if (b.clubName && b.clubName.trim() !== '') {
        const club = b.clubName.trim();
        clubCounts[club] = (clubCounts[club] || 0) + 1;
      }
    });
    const activeClubs = Object.entries(clubCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Peak booking hours
    const hourCounts = {};
    // Seed standard hours for fallback chart visualization
    for (let h = 8; h <= 20; h++) {
      hourCounts[`${h.toString().padStart(2, '0')}:00`] = 0;
    }
    allApprovedBookings.forEach(b => {
      const hour = b.startTime.split(':')[0] + ':00';
      if (hourCounts[hour] !== undefined) {
        hourCounts[hour]++;
      } else {
        hourCounts[hour] = 1;
      }
    });
    const peakHours = Object.entries(hourCounts).map(([time, count]) => ({ time, count }));

    // 6. Monthly bookings (Last 6 months)
    const monthlyBookings = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthName = d.toLocaleString('default', { month: 'short' });

      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const count = await Booking.countDocuments({
        ...query,
        date: { $gte: start, $lte: end },
        status: 'Approved'
      });

      monthlyBookings.push({ month: monthName, bookings: count });
    }

    // 7. Room-wise utilization count
    const roomCounts = [];
    const roomsList = await Room.find(
      req.role === 'owner' ? { _id: { $in: req.user.managedRooms } } : {}
    );
    for (const r of roomsList) {
      const count = await Booking.countDocuments({
        room: r._id,
        status: 'Approved'
      });
      roomCounts.push({ room: r.name, count });
    }

    // Fines list for analytics overview
    const feedbacksWithFines = await Feedback.find({
      fineStatus: 'Pending'
    }).populate('student', 'name').populate('room', 'name');

    const totalFinesPending = feedbacksWithFines.reduce((sum, f) => sum + f.fineAmount, 0);

    res.json({
      todayBookingsCount,
      pendingCount,
      utilizationRate,
      activeClubs,
      peakHours,
      monthlyBookings,
      roomCounts,
      totalFinesPending
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving analytics' });
  }
});

// @desc    Export bookings to Excel
// @route   GET /api/analytics/export/excel
// @access  Private (Admin/Owner)
router.get('/export/excel', protect, restrictTo('admin', 'owner'), async (req, res) => {
  try {
    let query = {};
    if (req.role === 'owner') {
      query.room = { $in: req.user.managedRooms };
    }

    const bookings = await Booking.find(query).populate('room', 'name');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bookings Report');

    worksheet.columns = [
      { header: 'Booking ID', key: 'id', width: 25 },
      { header: 'Student Name', key: 'studentName', width: 20 },
      { header: 'Roll Number', key: 'rollNumber', width: 15 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Club Name', key: 'clubName', width: 15 },
      { header: 'Room Name', key: 'roomName', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time Slot', key: 'timeSlot', width: 15 },
      { header: 'Purpose', key: 'purpose', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Checked-In', key: 'checkedIn', width: 12 }
    ];

    bookings.forEach(b => {
      worksheet.addRow({
        id: b._id.toString(),
        studentName: b.studentName,
        rollNumber: b.rollNumber,
        department: b.department,
        clubName: b.clubName || 'N/A',
        roomName: b.room?.name || 'N/A',
        date: new Date(b.date).toLocaleDateString(),
        timeSlot: `${b.startTime} - ${b.endTime}`,
        purpose: b.purpose,
        status: b.status,
        checkedIn: b.checkedIn ? 'Yes' : 'No'
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' } // Dark blue
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'CultureSpace_Booking_Report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error exporting Excel' });
  }
});

// @desc    Export bookings summary report to PDF
// @route   GET /api/analytics/export/pdf
// @access  Private (Admin/Owner)
router.get('/export/pdf', protect, restrictTo('admin', 'owner'), async (req, res) => {
  try {
    let query = {};
    if (req.role === 'owner') {
      query.room = { $in: req.user.managedRooms };
    }

    const bookings = await Booking.find(query).populate('room', 'name');

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'CultureSpace_Booking_Report.pdf'
    );

    doc.pipe(res);

    // Header
    doc.fillColor('#0f172a').fontSize(24).text('CultureSpace Report', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary Details
    const totalCount = bookings.length;
    const approvedCount = bookings.filter(b => b.status === 'Approved').length;
    const pendingCount = bookings.filter(b => b.status === 'Pending').length;
    const rejectedCount = bookings.filter(b => b.status === 'Rejected').length;
    
    doc.fillColor('#0f172a').fontSize(14).text('Executive Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#334155');
    doc.text(`Total Booking Requests: ${totalCount}`);
    doc.text(`Approved Bookings: ${approvedCount}`);
    doc.text(`Pending Requests: ${pendingCount}`);
    doc.text(`Rejected Requests: ${rejectedCount}`);
    doc.moveDown(2);

    // Table Header
    doc.fillColor('#0f172a').fontSize(14).text('Recent Booking Transactions', { underline: true });
    doc.moveDown(1);

    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    
    // Draw columns headers
    doc.text('Date', 30, tableTop);
    doc.text('Student', 100, tableTop);
    doc.text('Room', 220, tableTop);
    doc.text('Slot', 320, tableTop);
    doc.text('Purpose', 400, tableTop);
    doc.text('Status', 510, tableTop);

    doc.moveTo(30, tableTop + 15).lineTo(570, tableTop + 15).strokeColor('#cbd5e1').stroke();
    
    let yPosition = tableTop + 25;
    doc.font('Helvetica');

    // Only print first 25 bookings to keep PDF readable within single/double pages
    const printableBookings = bookings.slice(0, 25);

    printableBookings.forEach((b) => {
      // Check for page break
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50; // top of new page
        // redraw header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Date', 30, yPosition);
        doc.text('Student', 100, yPosition);
        doc.text('Room', 220, yPosition);
        doc.text('Slot', 320, yPosition);
        doc.text('Purpose', 400, yPosition);
        doc.text('Status', 510, yPosition);
        doc.moveTo(30, yPosition + 15).lineTo(570, yPosition + 15).strokeColor('#cbd5e1').stroke();
        yPosition += 25;
        doc.font('Helvetica');
      }

      const dateStr = new Date(b.date).toLocaleDateString();
      const studentName = b.studentName.length > 20 ? b.studentName.substring(0, 18) + '..' : b.studentName;
      const roomName = b.room?.name || 'N/A';
      const slot = `${b.startTime}-${b.endTime}`;
      const purpose = b.purpose.length > 20 ? b.purpose.substring(0, 18) + '..' : b.purpose;
      
      doc.text(dateStr, 30, yPosition);
      doc.text(studentName, 100, yPosition);
      doc.text(roomName, 220, yPosition);
      doc.text(slot, 320, yPosition);
      doc.text(purpose, 400, yPosition);
      doc.text(b.status, 510, yPosition);

      yPosition += 20;
    });

    doc.end();
  } catch (error) {
    console.error(error);
    // Write plain message
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error generating PDF report' });
    }
  }
});

export default router;
