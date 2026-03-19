# UrbanPulse Implementation TODO List

This document outlines the detailed implementation requirements for the UrbanPulse project based on the project specifications and the current state of the codebase.

## 1. The Neighborhood Dashboard (Real-Time Connectivity)
- [ ] **Dynamic Feed UI**: Implement the main Dashboard feed for "Pulses" (short-form updates) with varying urgency levels (Emergency, Skill, Item).
- [ ] **Live Updates (WebSockets)**: Implement a real-time notification system (using WebSockets or similar) so urgent requests appear instantly without requiring a page refresh.
- [ ] **Weather Integration**: Integrate the **OpenWeatherMap API** to fetch and display local weather alerts.
- [ ] **Safety Check-in**: Implement backend logic to automatically pin a "Safety Check-in" thread at the top of the dashboard if a "Severe Weather" warning is issued.
- [ ] **Notification Engine**: Implement system-wide alerts for urgent local emergencies or direct responses to a user's request.
- [ ] **Interactive Visualization**: Implement a map interface using **Mapbox or Google Maps API** that displays the location and density of local needs or resources (utilize the existing `PulseMarker.tsx` component).

## 2. The Skill & Resource Library (Collaborative Economy)
- [ ] **Collaborative Database**: Create endpoints and UI to list items users are willing to lend (tools, gear) and skills they can offer.
- [ ] **Dynamic Reliability Rating**: Implement backend logic to calculate "Trust Scores". A user's score must increase after three successful "Lend" or "Help" events (transactions) that receive positive feedback from the recipient.
- [ ] **Localization (Profile Settings)**: Build profile settings UI allowing users to define their neighborhood/geographic area and list "Skill Tags" or resources.
- [ ] **Account Management (CRUD)**: Implement full CRUD endpoints for user profiles, allowing updates to bios/skills and ensuring users have the ability to delete their data completely.

## 3. Smart Request Matching
- [ ] **Request Routing ("Hero Alerts")**: Implement matching logic so when a user posts a "Need" (e.g., physical help), the backend analyzes profiles of nearby users and sends a "Hero Alert" to those who have listed matching skills.
- [ ] **Location Filtering**: Implement efficient spatial database queries (e.g., PostGIS or Haversine formula) allowing users to filter the feed based on a specific radius from their location.
- [ ] **Quiet Hours & Distance Limits**: Implement UI and backend logic allowing users to set "Quiet Hours" or "Distance Limits" in their profile to control how and when they receive alerts.
- [ ] **Direct Communication**: Implement integrated messaging (private or group) using WebSockets to allow neighbors to coordinate logistics securely. Create Inbox UI on the frontend.

## 4. Verification & Moderation (Administrative Section)
- [ ] **"Verified Neighbor" Badge**: Implement logic and UI for a "Verified Neighbor" badge required for certain high-trust actions (e.g., borrowing expensive tools).
- [ ] **Auto-Validation**: Implement logic to automatically mark a specific post (e.g., "Stray Dog Spotted") as "Verified Info" if it is upvoted/confirmed by three or more independent neighbors.
- [ ] **Admin Dashboard**: Build a central interface for moderators to review flagged content (`ReportEntity`), merge duplicates, and manage user access.
- [ ] **Complete Secure Auth**: Finalize registration and login flows ensuring unique credentials, password encryption, and secure session management (finish BetterAuth setup). Add SignIn page to router.
- [ ] **Strict Input Validation**: Ensure strict server-side validation (using Zod) is present on all community post endpoints to ensure they are complete and safe.
- [ ] **Data Privacy & Access Control**: Implement robust role-based access control (RBAC) middleware to protect sensitive information like private addresses and direct messages.

## 5. Technical Foundation & Architecture
- [ ] **Frontend Routing**: Add frontend routes for Dashboard, Profile, Inbox, and Admin panels in `client/src/router.tsx`.
- [ ] **Controllers & Services**: Build out the missing REST API controllers and services for Pulses, Resources, Skills, Notifications, and Conversations.
- [ ] **Scalability & Resilience**: Ensure the backend architecture handles traffic efficiently (statelessness, caching) and utilizes asynchronous processing for heavy tasks (like mass notifications). Ensure graceful degradation if secondary services fail.

## 6. Advanced Bonus: AI "Guardian" for Lost Pets
- [ ] **Automated Identification**: Implement system (AI vision API integration) to analyze uploaded photos of found pets to identify key characteristics (species, color, etc.).
- [ ] **Smart Similarity Matching**: Implement logic to compare "Found" pet images against a "Lost" database (`PetAlertEntity`) to suggest potential matches to the user.
- [ ] **Match Interface**: Build a UI component that presents these pet matches with a calculated confidence or similarity score.
