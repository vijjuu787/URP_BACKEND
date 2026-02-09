# Assignment Timing Endpoints Documentation

## Overview

Three new endpoints to track assignment timing, including elapsed time, remaining time, and time expiration status.

## Endpoints

### 1. GET Assignment Timing by ID

**Endpoint:** `GET /api/assignment/starts/timing/:assignmentStartId`

**Authentication:** Required (Bearer token)

**Description:** Get detailed timing information for a specific assignment start

**Path Parameters:**

- `assignmentStartId` (string, required) - The ID of the assignment start record

**Response (200 OK):**

```json
{
  "message": "Assignment timing retrieved successfully",
  "data": {
    "assignmentStartId": "abc123",
    "assignmentId": "xyz789",
    "assignmentTitle": "Buffer Overflow Challenge",
    "startedAt": "2026-02-09T10:30:00Z",
    "now": "2026-02-09T11:45:30Z",
    "timing": {
      "totalTimeAllowedHours": 4,
      "totalTimeAllowedMinutes": 240,
      "elapsedMinutes": 75,
      "elapsedHours": 1,
      "elapsedSeconds": 15,
      "remainingMinutes": 165,
      "remainingHours": 2,
      "remainingSeconds": 45,
      "percentageTimeUsed": 31,
      "isTimeExpired": false
    }
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Assignment start record not found"
}
```

---

### 2. GET All Current Assignment Timings

**Endpoint:** `GET /api/assignment/starts/timings/all/current`

**Authentication:** Required (Bearer token)

**Description:** Get timing information for all active assignments for the authenticated user (useful for dashboard/progress tracking)

**Query Parameters:** None

**Response (200 OK):**

```json
{
  "message": "All assignment timings retrieved successfully",
  "count": 3,
  "data": [
    {
      "assignmentStartId": "start-001",
      "assignmentId": "assign-001",
      "assignmentTitle": "Buffer Overflow Challenge",
      "assignmentDifficulty": "HARD",
      "assignmentPoints": 100,
      "startedAt": "2026-02-09T10:30:00Z",
      "timing": {
        "totalTimeAllowedHours": 4,
        "totalTimeAllowedMinutes": 240,
        "elapsedMinutes": 75,
        "remainingMinutes": 165,
        "percentageTimeUsed": 31,
        "isTimeExpired": false
      }
    },
    {
      "assignmentStartId": "start-002",
      "assignmentId": "assign-002",
      "assignmentTitle": "SQL Injection Attack",
      "assignmentDifficulty": "MEDIUM",
      "assignmentPoints": 75,
      "startedAt": "2026-02-09T09:00:00Z",
      "timing": {
        "totalTimeAllowedHours": 2,
        "totalTimeAllowedMinutes": 120,
        "elapsedMinutes": 150,
        "remainingMinutes": -30,
        "percentageTimeUsed": 125,
        "isTimeExpired": true
      }
    }
  ]
}
```

---

## Usage Examples

### JavaScript/Fetch

```javascript
// Get timing for specific assignment
const getAssignmentTiming = async (assignmentStartId, token) => {
  const response = await fetch(
    `http://localhost:5100/api/assignment/starts/timing/${assignmentStartId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();
  if (response.ok) {
    console.log("Timing:", data.data.timing);
  } else {
    console.error("Error:", data.error);
  }
};

// Get all current assignment timings (for dashboard)
const getAllAssignmentTimings = async (token) => {
  const response = await fetch(
    "http://localhost:5100/api/assignment/starts/timings/all/current",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();
  return data.data; // Array of timing info
};
```

### React Component Example

```javascript
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./context/AuthContext";

export function AssignmentTimer({ assignmentStartId }) {
  const { token } = useContext(AuthContext);
  const [timing, setTiming] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTiming = async () => {
      try {
        const response = await fetch(
          `/api/assignment/starts/timing/${assignmentStartId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await response.json();
        setTiming(data.data.timing);
      } catch (error) {
        console.error("Failed to fetch timing:", error);
      } finally {
        setLoading(false);
      }
    };

    // Refresh every second for real-time countdown
    fetchTiming();
    const interval = setInterval(fetchTiming, 1000);
    return () => clearInterval(interval);
  }, [assignmentStartId, token]);

  if (loading) return <div>Loading timer...</div>;
  if (!timing) return <div>No timing data</div>;

  const isExpired = timing.isTimeExpired;
  const timerColor = isExpired
    ? "red"
    : timing.percentageTimeUsed > 75
      ? "orange"
      : "green";

  return (
    <div className="timer" style={{ borderColor: timerColor }}>
      <h3>Time Remaining</h3>
      <p className="time-display">
        {timing.remainingHours}h {timing.remainingMinutes % 60}m{" "}
        {timing.remainingSeconds}s
      </p>
      <p className="percentage">{timing.percentageTimeUsed}% used</p>
      {isExpired && <p className="warning">⚠️ Time Expired!</p>}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(100, timing.percentageTimeUsed)}%` }}
        ></div>
      </div>
    </div>
  );
}
```

### Dashboard Component (Show All Assignments)

```javascript
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./context/AuthContext";

export function AssignmentDashboard() {
  const { token } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllTimings = async () => {
      try {
        const response = await fetch(
          "/api/assignment/starts/timings/all/current",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await response.json();
        setAssignments(data.data);
      } catch (error) {
        console.error("Failed to fetch timings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTimings();
    // Refresh every 30 seconds for dashboard
    const interval = setInterval(fetchAllTimings, 30000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) return <div>Loading assignments...</div>;

  return (
    <div className="dashboard">
      <h2>Active Assignments</h2>
      <table>
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Difficulty</th>
            <th>Points</th>
            <th>Time Remaining</th>
            <th>Time Used</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => (
            <tr key={assignment.assignmentStartId}>
              <td>{assignment.assignmentTitle}</td>
              <td>{assignment.assignmentDifficulty}</td>
              <td>{assignment.assignmentPoints}</td>
              <td>
                {assignment.timing.remainingHours}h{" "}
                {assignment.timing.remainingMinutes % 60}m
              </td>
              <td>{assignment.timing.percentageTimeUsed}%</td>
              <td>
                {assignment.timing.isTimeExpired ? (
                  <span className="badge badge-danger">Expired</span>
                ) : assignment.timing.percentageTimeUsed > 75 ? (
                  <span className="badge badge-warning">Running Out</span>
                ) : (
                  <span className="badge badge-success">In Progress</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Response Fields Explanation

| Field                     | Type    | Description                                      |
| ------------------------- | ------- | ------------------------------------------------ |
| `totalTimeAllowedHours`   | number  | Total time allowed for the assignment in hours   |
| `totalTimeAllowedMinutes` | number  | Total time allowed for the assignment in minutes |
| `elapsedMinutes`          | number  | Time spent on assignment so far in minutes       |
| `elapsedHours`            | number  | Time spent on assignment so far in hours         |
| `elapsedSeconds`          | number  | Seconds component of elapsed time                |
| `remainingMinutes`        | number  | Time left to complete assignment (0 if expired)  |
| `remainingHours`          | number  | Hours component of remaining time                |
| `remainingSeconds`        | number  | Seconds component of remaining time              |
| `percentageTimeUsed`      | number  | Percentage of total time used (0-100+)           |
| `isTimeExpired`           | boolean | True if time limit has been exceeded             |

---

## Use Cases

1. **Real-Time Timer Display**
   - Show countdown timer on assignment page
   - Refresh every 1 second for accuracy
   - Warn user when time is running out (>75%)
   - Show alert when time expires

2. **Dashboard / Progress Tracking**
   - Show all active assignments with remaining time
   - Sort by time remaining (soonest deadline first)
   - Highlight expired assignments
   - Refresh every 30 seconds for dashboard

3. **Backend Validation**
   - Check `isTimeExpired` before accepting submissions
   - Reject submissions after deadline
   - Log time information for analytics

4. **Notifications**
   - Send alert when 30 minutes remaining
   - Send warning when 5 minutes remaining
   - Send alert when time expires

---

## Time Calculation Logic

```javascript
// Frontend-side calculation (optional, for backup)
const calculateTiming = (startedAt, timeLimitHours) => {
  const now = new Date();
  const elapsedMs = now - new Date(startedAt);
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
  const totalMinutes = timeLimitHours * 60;
  const remainingMinutes = totalMinutes - elapsedMinutes;

  return {
    elapsedMinutes,
    remainingMinutes: Math.max(0, remainingMinutes),
    percentageUsed: Math.min(100, (elapsedMinutes / totalMinutes) * 100),
    isExpired: remainingMinutes <= 0,
  };
};
```

---

## Testing with cURL

```bash
# Get timing for specific assignment
curl -X GET "http://localhost:5100/api/assignment/starts/timing/abc123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get all current assignment timings
curl -X GET "http://localhost:5100/api/assignment/starts/timings/all/current" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

- All times are in UTC (returned from database)
- Client should handle timezone conversion for display
- Refresh intervals should be based on use case (1 second for active timer, 30 seconds for dashboard)
- `remainingMinutes` is clamped to 0 minimum (no negative values returned)
- `percentageTimeUsed` can exceed 100 if assignment was submitted late
- Server time is authoritative; client should sync with server time for accuracy
