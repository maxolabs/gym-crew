**Build a mobile-first PWA web app called “Gym Crew” for me and my friends to track gym attendance in groups and gamify consistency.**

## **Core Context**

* Small private app for me and a few friends.
* Users authenticate via **email + password** using Supabase Auth (Google login can be added later, but not now).
* A user can belong to **multiple gym groups**.
* Each gym group has **Admins** and **Members** (role-based permissions).
* The app must be **mobile-first**, fast, and simple to operate.

---

# **Product Requirements**

## **Authentication**

* Use **Supabase email/password authentication**.
* On account creation, store a user profile: name, avatar (optional), createdAt.

---

# **Gym Groups**

* Any authenticated user can create a **Gym Group** and automatically becomes its **Admin**.
* Admin can invite members using a **shareable join link** (tokenized).
* A user can belong to multiple groups.
* A Gym Group contains:

  * Name
  * Description (optional)
  * Timezone
  * List of members & roles
  * Gym locations (one or many)
  * **Gym Routine file (PDF or image)** — see “Gym Routine” section below.

---

# **Gym Routine (New Feature)**

Each Gym Group must allow uploading and viewing of a **routine**, which can be:

* A **PDF** file
* An **image** (PNG/JPEG)

Requirements:

* Store the file in **Supabase Storage** inside a folder `/routines/{groupId}/routine.pdf` (or image).
* Only Admins can upload or replace the routine.
* Members can view or download it.
* If no routine exists, show a placeholder and prompt Admins to upload one.
* Display inline on mobile if possible (PDF viewer or image viewer).

---

# **Gym Locations & Geo Validation**

* Each gym group can define **one or more gym locations**:

  * Name
  * Latitude
  * Longitude
  * Radius (default 500 meters)
* Check-ins require:

  * User within radius
  * User not already checked in that day
* If outside radius, show nearest gym and distance.

---

# **Check-ins (Assistances)**

### **Valid Check-In Rules**

* Only **one check-in per user per day per group**.
* Store:

  * userId, groupId
  * `checkin_date` (normalized to group timezone)
  * method: `GEO` or `MANUAL`
  * status: `APPROVED`, `PENDING`, or `REJECTED`
  * lat/lng (if GEO)
  * createdAt

### **Check-In Flow**

* Members tap a large “Check In” button on group dashboard.
* Geo check-ins auto-approve.
* Manual check-ins require approval from at least **one other member** (not self).

---

# **Manual Override Approval System**

* User can request a manual check-in if GPS fails or wasn't available.
* Requirements:

  * Starts as `PENDING`
  * Any other group member can approve
  * Once approved → becomes a valid check-in
  * Optional: allow rejection with reason
* Show pending requests in the **Group Dashboard**.

---

# **Gamification (Medium Level)**

### **Group Leaderboard**

* Monthly ranking based on approved check-ins.
* Show top performers.

### **Streaks**

* Track consecutive-day check-in streaks (per group).

### **Badges**

* Monthly winner badge awarded automatically to the member with the most check-ins.
* Visible:

  * In the Group Dashboard (current month)
  * In the Personal Profile (full badge history)

---

# **Pages / Screens (Must Implement)**

1. **Login / Registration (email + password)**
2. **My Groups**

   * List of user's groups
   * Quick stats per group
   * Create group button
3. **Create Group**

   * Name, description
   * Upload gym routine (optional)
4. **Group Dashboard**

   * Group overview
   * Gym routine viewer
   * Members & roles
   * Gym locations list
   * Monthly leaderboard
   * Streak & monthly count
   * Check-In button
   * Manual request approvals
5. **Gym Location Management (Admin only)**
6. **Routine Upload / Replace (Admin only)**
7. **Personal Dashboard**

   * Global stats
   * Badge history

---

# **UI Guidelines**

* Mobile-first responsive layout.
* Bottom tab navigation:

  * Groups
  * Current Group
  * Profile
* Use cards, clear buttons, and strong feedback for errors & permissions.
* Friendly handling of geolocation failure.

---

# **Data Model (Supabase Tables)**

### **users**

* id (uuid)
* name
* avatar_url
* created_at

### **gym_groups**

* id
* name
* description
* timezone
* created_by
* routine_url (PDF or image URL)  ← **NEW**
* created_at

### **group_members**

* group_id
* user_id
* role (`ADMIN`, `MEMBER`)
* joined_at

### **gym_locations**

* id
* group_id
* name
* lat
* lng
* radius_m
* created_at

### **check_ins**

* id
* group_id
* user_id
* checkin_date
* method (`GEO`, `MANUAL`)
* status (`PENDING`, `APPROVED`, `REJECTED`)
* lat
* lng
* created_at

### **manual_approvals**

* id
* check_in_id
* approver_user_id
* created_at
* unique(check_in_id, approver_user_id)

### **badges**

* id
* group_id
* user_id
* badge_type (`MONTH_WINNER`)
* period_start
* period_end
* created_at

---

# **Non-Functional Requirements**

* Must support **PWA installation**.
* Provide install banner on mobile.
* Use skeleton loaders for data fetching.
* Handle geolocation permission failure with clear UI.

---

# **Output**

Generate the full UI, component structure, API endpoints, and state management flow for a **Next.js + Supabase + Vercel PWA** that implements the above features.
