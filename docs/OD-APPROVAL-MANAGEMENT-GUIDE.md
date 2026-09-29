# OD Approval Management - Implementation Guide

## Overview

The OD (On-Duty) Approval Management system has been fully implemented with an admin interface that allows administrators to manage OD approvals by event, view teams, and handle requests efficiently.

## What's New

### 1. **Event-Based OD Management Page**
- **Location**: Admin → On Duty Management (`/admin/on-duty-management`)
- Shows all events with OD statistics
- Click on any event to view teams and their OD requests

### 2. **OD Proof Requirement Configuration**
- Added `od_proof_required` field to event rounds
- Admins can specify whether proof is mandatory for each round
- Round 1 typically optional, Round 2+ typically required

### 3. **Admin Interface Features**

#### Events List View
Shows cards for all events with:
- Event code and name
- Event organizer
- Total OD requests count
- Pending OD requests count
- Total rounds
- Event status badge

#### Event Details View
After clicking an event, displays:
- **Event Summary**: Code, organizer, status, dates
- **Round Configuration**: Shows each round with:
  - Round number and name
  - Round mode (Online/Offline)
  - OD proof requirement badge (Required/Optional)
  - Round dates
- **Teams & Requests**: Lists all event teams with:
  - Team name and code
  - Team status
  - Number of OD requests
  - Each OD request with status badges and actions

#### OD Review Modal
Click "Review" on any OD request to:
- View request details (team, student, dates, days)
- View/preview proof documents
- Update approval statuses:
  - Faculty Status
  - HOD Status
  - Admin Status
- Add notes for each approver
- Track who reviewed and when

## Database Changes

### Schema Update
File: `server/modules/event/event.schema.sql`

```sql
ALTER TABLE event_rounds 
ADD COLUMN od_proof_required BOOLEAN NOT NULL DEFAULT FALSE
```

This column is now populated when creating event rounds. You can update existing rounds using:

```sql
UPDATE event_rounds 
SET od_proof_required = true 
WHERE round_order > 1;
```

## API Endpoints

### Get All Events with OD Details
```
GET /api/on-duty/admin/events
Authorization: Admin/System Admin only

Response:
{
  "event_id": 1,
  "event_code": "EVT001",
  "event_name": "Tech Summit 2024",
  "event_organizer": "Tech Club",
  "status": "ACTIVE",
  "start_date": "2024-05-15",
  "end_date": "2024-05-20",
  "registration_mode": "TEAM",
  "round_count": 3,
  "total_od_requests": 45,
  "pending_od_requests": 12,
  "rounds": [
    {
      "round_id": 101,
      "round_order": 1,
      "round_name": "Screening",
      "round_date": "2024-05-15",
      "round_end_date": "2024-05-15",
      "round_mode": "ONLINE",
      "status": "SCHEDULED",
      "od_proof_required": false
    },
    {
      "round_id": 102,
      "round_order": 2,
      "round_name": "Presentation",
      "round_date": "2024-05-17",
      "round_end_date": "2024-05-18",
      "round_mode": "OFFLINE",
      "status": "SCHEDULED",
      "od_proof_required": true
    }
  ]
}
```

### Get Teams and OD Requests for Specific Event
```
GET /api/on-duty/admin/events/:eventId/teams
Authorization: Admin/System Admin only

Response:
{
  "teams": [
    {
      "team_id": 5,
      "team_code": "TEAM001",
      "team_name": "Innovation Squad",
      "status": "ACTIVE",
      "rounds_cleared": 1,
      "od_requests_count": 2,
      "od_requests": [
        {
          "od_request_id": 201,
          "round_id": 101,
          "round_order": 1,
          "round_name": "Screening",
          "requested_from_date": "2024-05-15",
          "requested_to_date": "2024-05-15",
          "requested_day_count": 1,
          "requested_by_student_name": "John Doe",
          "faculty_status": "APPROVED",
          "hod_status": "PENDING",
          "admin_status": "PENDING",
          "shortlist_proof_path": "/uploads/on-duty-proofs/proof-5-101-123456789.pdf",
          "shortlist_proof_type": "application/pdf",
          "created_at": "2024-05-10T10:30:00Z"
        }
      ]
    }
  ]
}
```

## Using the Admin Interface

### Step 1: Access the Page
Navigate to: **Admin Dashboard → Event Services → On Duty Management**

### Step 2: View Events
- See all events with OD request statistics
- Events are sorted by status and date
- Shows pending requests count for quick action

### Step 3: Select an Event
Click on any event card to view:
- Event configuration details
- Round setup and OD requirements
- All teams registered for that event

### Step 4: Review Team Requests
For each team, see all OD requests with:
- Request dates and duration
- Current approval status
- Submitted by (student name)

### Step 5: Update OD Request
Click "Review" button on any request to:

1. **View Request Details**
   - Team and student information
   - OD dates and duration
   - View/download proof

2. **Update Statuses**
   - Set Faculty approval (Pending/Approved/Rejected)
   - Set HOD approval (Pending/Approved/Rejected)
   - Set Admin approval (Pending/Approved/Rejected/Cancelled)

3. **Add Notes**
   - Faculty notes (max 255 characters)
   - HOD notes (max 255 characters)
   - Admin notes (unlimited)

4. **Save Changes**
   - Click "Update Request" to save
   - System validates that Faculty and HOD approval is required before Admin approval
   - Changes are immediately reflected in the system

## Workflow Example

**Scenario**: Tech Summit 2024 has 3 rounds, students need OD approval starting Round 2

1. **Event Setup**: 
   - Round 1 (Screening - Online): `od_proof_required = false`
   - Round 2 (Presentation - Offline): `od_proof_required = true`
   - Round 3 (Finals - Offline): `od_proof_required = true`

2. **Student Process**:
   - After Round 1 shortlist, students register teams
   - For Round 2, students submit OD requests with proof documents
   - Faculty reviews and approves
   - HOD reviews and approves
   - Admin provides final approval

3. **Admin Review**:
   - Admin opens "On Duty Management"
   - Clicks on "Tech Summit 2024"
   - Sees all 50 teams and their OD requests
   - Filters by pending requests
   - Reviews proof documents
   - Updates approval statuses
   - Adds admin notes if needed

## Status Options

### Approval Statuses

**Faculty Status**:
- PENDING: Awaiting faculty review
- APPROVED: Faculty approved the request
- REJECTED: Faculty rejected the request

**HOD Status**:
- PENDING: Awaiting HOD review
- APPROVED: HOD approved the request
- REJECTED: HOD rejected the request

**Admin Status**:
- PENDING: Awaiting admin review
- APPROVED: Admin approved (requires Faculty and HOD approval first)
- REJECTED: Admin rejected the request
- CANCELLED: Request was cancelled

## Important Notes

1. **Proof Requirements**
   - Set `od_proof_required = true` for challenging rounds
   - Students can resubmit with new proofs after rejection
   - Supports PDF, JPG, PNG, WEBP formats
   - Max file size: 5 MB

2. **Approval Chain**
   - Faculty must approve before HOD
   - Both must approve before Admin approval
   - Admin cannot approve if Faculty or HOD rejected
   - System prevents invalid status combinations

3. **Team Eligibility**
   - Teams must clear previous round to request OD for next round
   - Only ACTIVE event teams can request OD
   - Only OFFLINE rounds allow OD requests

4. **Performance**
   - Event list is cached (medium TTL)
   - Teams view is cached per event
   - Consider filtering by status for large events

## Troubleshooting

**Issue**: No events showing in the list
- Check if events have status 'ACTIVE' or 'CLOSED'
- Ensure teams are registered for events as type 'EVENT'
- Check if OD requests exist for the event

**Issue**: Teams not showing for an event
- Verify teams have `team_type = 'EVENT'`
- Check if teams have `event_id` set
- Teams must be in 'ACTIVE' status

**Issue**: OD requests not showing for a team
- Ensure requests have been submitted by students
- Check request status (PENDING, APPROVED, etc.)
- Verify round is OFFLINE mode

## Next Steps

1. **Configure Event Rounds**
   - Update existing event rounds with `od_proof_required` values
   - Set to `true` for rounds that require proof

2. **Monitor Pending Requests**
   - Regularly check pending OD requests count
   - Review and update statuses timely

3. **Provide Feedback**
   - Use notes to communicate decisions to students
   - Track reasons for rejections

4. **Generate Reports**
   - OD data can be exported for analysis
   - Track approval rates and bottlenecks

---

For additional help or issues, refer to the OD request history or contact system admin.
