# OD Approval Management - Quick Reference Card

## 🎯 What's New

### Admin Page
- **Path**: `/admin/on-duty-management`
- **Features**: Events list → Click to view teams → Review OD requests
- **Access**: Admin/System Admin only

### Database Change
```sql
ALTER TABLE event_rounds ADD COLUMN od_proof_required BOOLEAN DEFAULT FALSE;
```

---

## 🚀 Quick Start for Admins

### 1. Access the Page
Admin → Event Services → **On Duty Management**

### 2. View Events
See all events with:
- Total OD requests
- Pending requests count
- Event status

### 3. Click Event
View:
- Round configuration
- Team list
- OD requests per team

### 4. Review Request
Click **Review** to:
- See request details
- View proof documents
- Update approval statuses
- Add notes

---

## 📋 Approval Workflow

```
Status Flow:
PENDING → APPROVED/REJECTED/CANCELLED

Levels:
1. Faculty Status
2. HOD Status  
3. Admin Status (requires 1 & 2 approved)

Notes:
- Faculty notes (255 chars max)
- HOD notes (255 chars max)
- Admin notes (unlimited)
```

---

## 🔗 API Endpoints

### List Events
```
GET /api/on-duty/admin/events
Response: Array of events with rounds and statistics
```

### Get Team OD Requests
```
GET /api/on-duty/admin/events/:eventId/teams
Response: Array of teams with OD requests
```

---

## ✅ Configuration Checklist

- [ ] Database migration applied
- [ ] Set `od_proof_required` for event rounds
- [ ] Verify event teams have `team_type = 'EVENT'`
- [ ] Check team `event_id` is set
- [ ] Confirm team status is 'ACTIVE'

---

## 🛠️ Configuration Commands

### Update Proof Requirements
```sql
-- Require proof for Round 2+
UPDATE event_rounds 
SET od_proof_required = true 
WHERE round_order > 1;

-- Optional for Round 1
UPDATE event_rounds 
SET od_proof_required = false 
WHERE round_order = 1;
```

---

## 📁 Files Modified

```
Backend (5 files):
✓ event/event.schema.sql
✓ event/event.repository.js
✓ onDuty/onDuty.service.js
✓ onDuty/onDuty.controller.js
✓ onDuty/onDuty.routes.js

Frontend (3 files):
✓ service/onDuty.api.js
✓ admin/adminRoutes.jsx
✓ admin/pages/onDutyEventManagement.jsx (NEW)

Docs (3 files):
✓ OD-APPROVAL-MANAGEMENT-GUIDE.md
✓ OD-IMPLEMENTATION-SUMMARY.md
✓ OD-IMPLEMENTATION-DETAILS.md
```

---

## 📊 Data Structure

### Event Object
```javascript
{
  event_id: 1,
  event_code: "EVT001",
  event_name: "Tech Summit",
  event_organizer: "Tech Club",
  status: "ACTIVE",
  round_count: 3,
  total_od_requests: 45,
  pending_od_requests: 12,
  rounds: [{
    round_id: 101,
    round_order: 1,
    round_name: "Screening",
    od_proof_required: false,
    status: "SCHEDULED"
  }]
}
```

### Team Object
```javascript
{
  team_id: 5,
  team_code: "TEAM001",
  team_name: "Squad A",
  status: "ACTIVE",
  od_requests_count: 2,
  od_requests: [{
    od_request_id: 201,
    round_order: 1,
    requested_day_count: 1,
    faculty_status: "APPROVED",
    hod_status: "PENDING",
    admin_status: "PENDING"
  }]
}
```

---

## 🔐 Security

- Admin/System Admin only
- Authentication required
- Role authorization checked
- Input validation on all fields
- Status transition validation

---

## ⚡ Performance Tips

1. Events list is cached (refresh available)
2. Team data cached per event
3. No N+1 query issues
4. Optimized JOINs in queries

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No events showing | Check event status (ACTIVE/CLOSED) |
| Teams not visible | Verify team_type = 'EVENT' |
| Can't update status | Check Faculty & HOD approved first |
| Proof not loading | Check file format (PDF/JPG/PNG/WEBP) |
| Unauthorized error | Verify Admin role |

---

## 📖 Documentation

| Doc | Purpose |
|-----|---------|
| GUIDE.md | How to use (user guide) |
| SUMMARY.md | Technical overview |
| DETAILS.md | Complete implementation |

---

## 🎯 Key Points

✅ Event-based organization
✅ Multi-level approval workflow
✅ Document proof management
✅ Intuitive admin interface
✅ Complete audit trail
✅ Backward compatible

---

## 🚀 Deployment

1. Apply database migration
2. Restart Node backend
3. Rebuild React frontend
4. Verify endpoints work
5. Test workflow end-to-end

---

## 📞 Support

For issues, refer to the detailed guides or check:
- Console errors (browser dev tools)
- Network tab (API responses)
- Database integrity

---

**Status**: ✅ Complete & Ready
**Last Updated**: May 7, 2026
