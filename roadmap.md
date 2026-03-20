# UrbanPulse Implementation Roadmap

This roadmap outlines the chronological implementation of features and tasks for the UrbanPulse project, based on the current state of the codebase and the `todo.md` requirements.

## Phase 1: Authentication & Identity Foundation
*Goal: Solidify the core user experience and account security.*

- [ ] **1.1 Complete Auth UI Flows**
  - Implement `SignInPage` with "Remember Me" and "Forgot Password" functionality.
  - Finalize `SignupOTPVerificationStep` to handle backend verification.
  - Add "Sign Out" functionality in the frontend.
- [ ] **1.2 Advanced Profile Management**
  - Implement `UserController` endpoints for Profile CRUD (Bio, Skill Tags, Neighborhood).
  - Integrate `AvatarController` with the `InputAvatar` component for S3-based uploads.
  - Build the `/profile` page on the frontend for users to manage their identity and data.
- [ ] **1.3 Localization & Privacy Settings**
  - Implement "Quiet Hours" and "Distance Limits" UI in the profile settings.
  - Create backend logic in `UserRepository` to store and retrieve these preferences.

## Phase 2: The Neighborhood Pulse Engine
*Goal: Build the real-time core of the application - the dynamic feed and map.*

- [ ] **2.1 Pulse Creation & Management**
  - Build `PulseController` and `PulseService` with Zod validation.
  - Create the "Post a Pulse" UI (Modal or Side Panel) with urgency selection (Emergency, Skill, Item).
  - Implement geolocation picking for new pulses.
- [ ] **2.2 Interactive Visualization (The Map)**
  - Enhance `HomePage` Mapbox integration with custom markers (using `PulseMarker.tsx`).
  - Implement marker clustering for high-density areas.
  - Add "Pulse Info Windows" to show snippets of content on marker click.
- [ ] **2.3 Dynamic Feed UI**
  - Build a list-view feed alongside the map that synchronizes with the visible map area.
  - Implement sorting and filtering by Urgency, Type, and Distance (using Haversine/PostGIS).
- [ ] **2.4 Live Updates (WebSockets)**
  - Integrate `Socket.ts` on the client and set up a WebSocket server on the backend.
  - Broadcast new Pulses to nearby users in real-time.

## Phase 3: Collaborative Economy & Resource Sharing
*Goal: Enable neighbors to share skills and physical items.*

- [ ] **3.1 Resource & Skill Library**
  - Implement `ResourceController` and `SkillController`.
  - Build UI for listing "Items I Can Lend" and "Skills I Can Offer".
  - Create a searchable library interface for users to discover local resources.
- [ ] **3.2 Transaction & Request Flow**
  - Implement logic for requesting to borrow an item or ask for help.
  - Build `TransactionRepository` to track the lifecycle of a "Lend" or "Help" event.
- [ ] **3.3 Smart Request Matching ("Hero Alerts")**
  - Implement backend logic to analyze new "Need" pulses and match them with nearby users' skill sets.
  - Send "Hero Alerts" (notifications) to matched users.

## Phase 4: Direct Communication & Notifications
*Goal: Facilitate secure coordination between neighbors.*

- [ ] **4.1 Real-Time Messaging**
  - Implement `ConversationController` and `MessageController`.
  - Build the "Inbox" UI for private 1-on-1 and pulse-related group chats.
  - Synchronize messages via WebSockets.
- [ ] **4.2 Notification Engine**
  - Implement `NotificationController` to manage system alerts.
  - Build the "Notification Bell" and pop-over UI.
  - Add support for Push Notifications (Web Push API).

## Phase 5: Trust, Moderation & Resilience
*Goal: Ensure the community remains safe, verified, and high-quality.*

- [ ] **5.1 Reputation & Verification**
  - Implement the "Trust Score" calculation logic (increase after 3 successful interactions).
  - Build the "Verified Neighbor" badge system and verification requirements.
  - Implement "Auto-Validation" (3+ upvotes/confirmations for certain pulse types).
- [ ] **5.2 Administrative Section**
  - Build the `Admin Dashboard` for moderators.
  - Implement `ReportRepository` and UI for flagging/reviewing content.
  - Add role-based access control (RBAC) middleware for sensitive operations.
- [ ] **5.3 Data Privacy & Export**
  - Ensure users can delete all their data (GDPR/privacy compliance).
  - Implement strict data isolation for private addresses in messages.

## Phase 6: Advanced Integrations & Optimization
*Goal: Polish the experience with external data and AI.*

- [ ] **6.1 Weather & Safety Integration**
  - Integrate OpenWeatherMap API for local weather alerts.
  - Implement "Safety Check-in" automatic pinning logic for severe weather.
- [ ] **6.2 AI "Guardian" for Lost Pets**
  - Integrate AI Vision API to analyze pet photos.
  - Implement similarity matching logic between "Lost" and "Found" pulses.
  - Build the "Confidence Score" UI for potential pet matches.
- [ ] **6.3 Scalability & Performance**
  - Implement Redis caching for high-traffic Pulse feeds.
  - Optimize spatial queries and database indexing.
  - Conduct final security audits and performance profiling.
