# New Features Guide - TrimSalon

This guide provides an overview of the new features added to TrimSalon and how to use them.

## 🎯 Quick Start

All new features are ready to use immediately, except for email notifications and push notifications which require configuration (see Configuration section below).

---

## 📋 Features Overview

### 1. Invoice Auto-Date 📅

**What it does**: Automatically sets the paid date to today when you mark an invoice as "Betaald" (PAID).

**How to use**:

1. Go to an invoice (edit or create new)
2. Change the payment status dropdown to "Betaald"
3. The paid date field automatically fills with today's date
4. If a paid date already exists, it won't be overwritten

**Benefits**:

- Saves time - no manual date entry
- Consistent date tracking
- Prevents forgetting to set the paid date

---

### 2. Invoice Printing 🖨️

**What it does**: Generate a professional, print-friendly invoice document.

**How to use**:

1. Go to the invoices list (Facturen)
2. Find the invoice you want to print
3. Click the printer icon (🖨️) next to the invoice
4. A new window opens with the print-ready invoice
5. Use your browser's print function (Ctrl+P or Cmd+P) to print or save as PDF

**Features**:

- Company branding (TrimSalon header)
- All invoice details: number, dates, client info, amounts
- VAT breakdown
- Payment status indicator
- Optional notes included
- Clean, professional layout

---

### 3. Reports PDF Export 📊

**What it does**: Export your dashboard reports to a professional PDF document.

**How to use**:

1. Go to the Reports page (Rapporten)
2. Select your desired date range
3. Click "Export naar PDF" button
4. PDF file downloads automatically

**What's included in the PDF**:

- Revenue overview (total, appointments, average per appointment)
- Expense overview (total, count, average)
- Profit/Loss analysis (revenue, expenses, net profit, margin)
- Top clients (with appointment count and revenue)
- Popular services (with usage count and revenue)
- Popular packages (with usage count and revenue)
- Calendar occupancy (available hours, booked hours, percentage)

**Benefits**:

- Professional reports for bookkeeping
- Easy to share with accountant
- Archive business performance
- Print for records

---

### 4. Progressive Web App (PWA) 📱

**What it does**: Install TrimSalon as a standalone app on your device.

**How to use**:

**On Desktop (Chrome/Edge)**:

1. Visit the TrimSalon website
2. Look for the install icon in the address bar (⊕ or ⬇)
3. Click it and confirm installation
4. TrimSalon opens in its own window

**On Mobile (Android)**:

1. Visit the TrimSalon website in Chrome
2. Tap the menu (⋮)
3. Tap "Add to Home Screen" or "Install app"
4. Confirm installation
5. TrimSalon appears on your home screen

**On Mobile (iOS)**:

1. Visit the TrimSalon website in Safari
2. Tap the share button (□↑)
3. Scroll down and tap "Add to Home Screen"
4. Confirm
5. TrimSalon appears on your home screen

**Benefits**:

- Works offline (once data is loaded)
- Feels like a native app
- Faster loading
- No browser address bar
- Easy access from home screen

---

### 5. Push Notifications 🔔

**What it does**: Receive notifications about appointments and important updates.

**Status**: Infrastructure ready, requires configuration (see Configuration section)

**How it will work** (once configured):

1. System prompts for notification permission
2. Accept to receive notifications
3. Get notified about:
   - Upcoming appointments
   - Important updates
   - Reminders

**Benefits**:

- Never miss an appointment
- Stay up to date
- Works even when app is closed

---

### 6. Email Notifications 📧

**What it does**: Send professional email reminders to clients about their appointments.

**Status**: Infrastructure ready, requires configuration (see Configuration section)

**How it will work** (once configured):

1. Create or modify an appointment
2. System can automatically send reminder emails
3. Clients receive professional branded email with:
   - Appointment date and time
   - Service details
   - Dog name (if applicable)
   - TrimSalon branding

**Benefits**:

- Reduce no-shows
- Professional communication
- Automated reminders
- Save time on manual calls/messages

---

## ⚙️ Configuration

### For Email Notifications

Email notifications require SMTP configuration. You'll need:

1. An email account (Gmail, Outlook, etc.)
2. SMTP credentials

**Steps to configure**:

```bash
# Set these environment variables in Firebase Functions
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@trimsalon.nl
```

**For Gmail**:

1. Enable 2-factor authentication
2. Generate an "App Password" in Google Account settings
3. Use the app password as EMAIL_PASS

### For Push Notifications

Push notifications require a VAPID key from Firebase:

1. Go to Firebase Console
2. Project Settings > Cloud Messaging
3. Web Push certificates
4. Generate key pair
5. Copy the public key
6. Update `src/app/core/services/notification.service.ts` with the key

---

## 🎨 User Interface Changes

### Invoice List

- New print button (🖨️) added next to edit and delete buttons
- Available on both mobile and desktop views

### Reports Page

- New "Export naar PDF" button at the top
- Existing Excel export button remains (to be implemented)

### Invoice Form

- Payment status dropdown triggers auto-date
- Paid date field shows when status is "Betaald"

### PWA

- Install prompt appears on compatible browsers
- App icon on home screen after installation
- Offline indicator when no connection

---

## 💡 Tips & Best Practices

### Printing Invoices

- Use "Print to PDF" in your browser to save digital copies
- Adjust print scale if needed (usually 100% is perfect)
- Check print preview before printing

### PDF Reports

- Export at end of month for monthly records
- Keep PDFs for tax/accounting purposes
- Name files systematically (e.g., "TrimSalon_Report_Jan_2025.pdf")

### PWA Installation

- Install on main device for best experience
- Update available automatically
- Works great on tablets for on-the-go access

### Email Reminders

- Send 24-48 hours before appointment
- Include all relevant details
- Keep tone professional and friendly

---

## 🔧 Troubleshooting

### PDF Export Not Working

- **Issue**: PDF doesn't download
- **Solution**: Check browser popup blocker, allow downloads from site

### Print Window Doesn't Open

- **Issue**: Print window blocked
- **Solution**: Allow popups from TrimSalon in browser settings

### PWA Won't Install

- **Issue**: No install prompt
- **Solution**: Ensure using HTTPS, try Chrome/Edge browser, check if already installed

### Offline Mode Not Working

- **Issue**: App doesn't work offline
- **Solution**: Must visit site while online first to cache data

---

## 📚 Additional Resources

- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Security Information**: See `SECURITY_SUMMARY.md`
- **Technical Documentation**: See code comments in source files

---

## 🆘 Support

If you encounter any issues:

1. Check this guide for troubleshooting
2. Verify browser compatibility (Chrome/Edge/Firefox/Safari latest versions)
3. Check internet connection for online features
4. Contact development team with specific error messages

---

## 🎉 Enjoy the New Features!

These enhancements are designed to make TrimSalon more efficient and user-friendly. Take some time to explore each feature and integrate them into your workflow.

**Happy grooming!** 🐕✨
