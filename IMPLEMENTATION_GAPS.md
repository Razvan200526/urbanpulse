# UrbanPulse Implementation Gaps And Execution Plan

This document compares the current repository against the app requirements shown in `webdev2026_compressed_13c76cb228.pdf` and translates the missing work into practical implementation sprints.

Use this as the source of truth for what still needs to be built.

## 1. What The Repo Already Has

The repository already includes a strong base:

- Monorepo with `client`, `server`, and `shared`
- Postgres + PostGIS backend support
- Better Auth integration and auth-related UI flows
- Data models and repositories for:
  - users
  - pulses
  - resources
  - transactions
  - notifications
  - reports
  - pet alerts / pet matches
  - conversations / messages
  - quiet hours / responses
- Frontend routes for:
  - dashboard
  - map
  - resources
  - messages
  - admin
  - settings
  - profile
- Backend controllers for:
  - auth
  - users
  - avatar
  - pulses
  - notifications
  - resources
  - uploads
  - weather
- WebSocket-related groundwork
- Real Postgres-backed Bun repository tests

## 2. Current High-Risk Gaps

These are the biggest reasons the app is not yet equivalent to the PDF showcase/spec.

- Placeholder or fake frontend data still exists
- Some critical pages are only shells:
  - admin
  - settings
  - profile
- Messaging is not yet a complete inbox/chat product
- Real-time behaviors are not fully complete end-to-end
- Verification, moderation, trust scoring, and RBAC are not fully implemented
- Hero-alert smart matching is not complete as a product workflow
- Some required backend surfaces are still missing or not fully exposed
- AI lost-pet bonus flow is not implemented end-to-end

## 3. Sprint Plan

## Sprint 0: Stabilize The Product Baseline

### Goal
Remove fake data and placeholder-only screens so the app has a real working baseline.

### Priority
`P0`

### Must deliver
- Replace dashboard fake stats with real backend-driven stats
- Replace resources fake data / network fake data with real API-backed views
- Turn `ProfilePage`, `SettingsPage`, and `AdminPage` into real functional pages
- Confirm no challenge-critical screen depends on placeholder-only UI

### Backend
- Add any missing profile/settings/admin endpoints needed by the currently empty screens
- Add any missing aggregate/stat endpoints for dashboard metrics
- Add moderation list/detail endpoints if the admin page needs them immediately

### Frontend
- Replace `fakeStats` on dashboard
- Replace fake resource/network/member data sources
- Build the actual UI for profile, settings, and admin pages
- Remove challenge-critical placeholders and shell-only views

### Data / API
- Define payloads for dashboard metrics
- Define payloads for profile/settings CRUD
- Define admin dashboard data contracts for moderation summaries and flagged content

### Testing
- Add API tests for new dashboard/profile/settings/admin endpoints
- Add frontend tests for pages that currently render only headings
- Add regression tests ensuring fake data is not used in production flows

### Exit criteria
- No fake/demo data in core challenge flows
- No challenge-critical route is just a title/header page

## Sprint 1: Complete The Dashboard And Map Core

### Goal
Ship the Neighborhood Dashboard and map experience required by the challenge.

### Priority
`P0`

### Must deliver
- Dynamic pulse feed
- Location-aware map with local pulse/resource visibility
- Urgency/type/distance filtering
- Weather-aware safety workflow

### Backend
- Finalize pulse retrieval/filtering logic for urgency, type, and distance
- Expose any missing endpoints for dashboard feed and map overlays
- Implement safety check-in creation/pinning workflow triggered by weather conditions

### Frontend
- Make dashboard feed fully backend-driven
- Finish map and feed synchronization
- Finish filters for urgency, type, and distance
- Ensure map UI clearly presents density/local activity as required by the challenge
- Surface severe weather and safety check-in behavior in the dashboard UX

### Data / API
- Normalize pulse query contract for feed and map use
- Define sort/filter model shared between client and server
- Define safety check-in thread/pinned item response shape

### Testing
- Add backend tests for pulse filters and distance queries
- Add frontend tests for filter state and feed rendering
- Add integration tests covering severe weather -> safety check-in behavior

### Exit criteria
- A user can open dashboard/map and clearly see local pulses/resources around them
- Filters work by urgency, type, and distance
- Severe weather causes the required safety behavior

## Sprint 2: Real-Time Layer And Notification Engine

### Goal
Make the app feel live without refresh.

### Priority
`P0`

### Must deliver
- WebSocket-driven pulse updates
- WebSocket-driven notification updates
- Real-time user response updates

### Backend
- Finish socket event broadcasting for pulse create/update/delete and relevant responses
- Finish notification generation and socket delivery pipeline
- Add reconnect-safe subscription strategy on the server side if needed

### Frontend
- Subscribe dashboard/map/messages/notifications to live events
- Update local state correctly on live events without refresh
- Add user-visible fallback behavior for connection loss/reconnect

### Data / API
- Define event names and payload schemas for pulses, notifications, responses, and messages
- Standardize real-time payloads so they align with existing REST models

### Testing
- Add socket integration tests
- Add tests for client-side real-time reducers/state updates
- Add tests for reconnect/failure behavior where practical

### Exit criteria
- New urgent requests appear without refresh
- Notifications and pulse changes propagate to active clients in real time

## Sprint 3: Skills, Resources, And Transactions

### Goal
Deliver the collaborative economy part of the challenge as a real product.

### Priority
`P0`

### Must deliver
- Live skill and resource library
- Borrow/help request lifecycle
- Transaction visibility and status handling

### Backend
- Finish CRUD endpoints/services for skills and resources
- Finish transaction state transitions and guard rules
- Add any missing resource search/listing endpoints

### Frontend
- Make all resource tabs fully live and searchable
- Add UI for managing skills and lendable items
- Finish request/accept/reject/active/complete/cancel UX
- Add status/history displays for borrower/lender flows

### Data / API
- Define search/filter contracts for skills/resources
- Define transaction lifecycle actions and status transitions
- Define feedback-related data if it is needed in later trust-score work

### Testing
- Add endpoint tests for skills/resources/transactions
- Add integration tests for borrower/lender lifecycle
- Add frontend tests for resource upload/list/request flows

### Exit criteria
- Users can publish skills/resources
- Users can request help or borrow items
- Transactions move through a real lifecycle in the UI and backend

## Sprint 4: Messaging And Coordination

### Goal
Turn coordination into a real inbox/chat system.

### Priority
`P0`

### Must deliver
- Conversation routes/controllers/services
- Private/group messaging UI
- Real-time messaging updates

### Backend
- Add missing conversation and message controllers/routes
- Implement conversation creation/fetch/send-message flows
- Enforce conversation membership and access rules

### Frontend
- Build an actual inbox/conversation UI instead of only pending-request handling
- Support one-to-one and pulse-related conversations
- Add real-time message rendering and unread state

### Data / API
- Define conversation list payloads
- Define message pagination model if needed
- Define unread-count and last-message summary contract

### Testing
- Add controller/service tests for conversations/messages
- Add real-time messaging tests where practical
- Add frontend tests for inbox navigation and message sending

### Exit criteria
- Users can open an inbox and exchange messages securely
- Messaging works for request coordination and ongoing conversations

## Sprint 5: Profile Preferences, Quiet Hours, Distance Limits

### Goal
Implement user control over alerts, location context, and discoverability.

### Priority
`P1`

### Must deliver
- Neighborhood/geographic area settings
- Quiet hours settings
- Distance limit settings
- Skill/resource tags in profile

### Backend
- Persist user alert/location preferences
- Enforce quiet-hours and distance-limit logic in downstream alerting/matching code
- Add any missing validation around profile preference updates

### Frontend
- Build settings/profile screens for preference management
- Add UX for neighborhood/geographic context
- Add skill/resource tag editing in profile

### Data / API
- Define preference model for quiet hours, distance limits, neighborhood, and tags
- Ensure shared types exist for preference payloads and validation

### Testing
- Add tests for preference persistence and enforcement
- Add frontend form tests for profile/settings preference editing
- Add edge-case tests for quiet-hour overlap and distance values

### Exit criteria
- User preferences affect what alerts they receive and when

## Sprint 6: Smart Request Matching (“Hero Alerts”)

### Goal
Implement the challenge’s core intelligence feature.

### Priority
`P1`

### Must deliver
- Matching between needs and nearby users
- Hero alerts sent only to relevant users

### Backend
- Implement matching logic based on pulse type, skills/resources, distance, and user preferences
- Add selective notification dispatch to eligible helpers
- Add observability/logging for why matches did or did not happen

### Frontend
- Show hero-alert notifications clearly in the app
- Expose enough detail for users to understand why they received an alert
- Add any helper action flows needed from the alert UI

### Data / API
- Define matching rule inputs and outputs
- Define notification payloads for hero alerts
- Standardize match eligibility reasons if they are surfaced to users/admins

### Testing
- Add backend tests for matching logic permutations
- Add tests ensuring quiet hours/distance limits are respected
- Add notification-generation tests for hero-alert flows

### Exit criteria
- Need pulses trigger selective local matching instead of broad generic alerts

## Sprint 7: Trust Score, Verification, And Community Validation

### Goal
Make the app safe enough for real community usage.

### Priority
`P1`

### Must deliver
- Trust score system
- Verified Neighbor badge system
- Auto-validation flow for eligible community posts

### Backend
- Implement trust-score calculation/update rules
- Implement verified-neighbor eligibility/state
- Implement community-confirmation threshold logic for auto-validation

### Frontend
- Display trust score and verification badge in relevant places
- Add confirmation/upvote UI for eligible content
- Surface verified content state clearly in the feed/map/details views

### Data / API
- Define trust-score update triggers and stored fields
- Define verification state model
- Define confirmation counters and verified-post state transitions

### Testing
- Add tests for trust-score changes after successful interactions
- Add tests for verification rule enforcement
- Add tests for auto-validation threshold behavior

### Exit criteria
- Trust and verification meaningfully affect product behavior

## Sprint 8: Moderation, Reports, And RBAC

### Goal
Build the administrative and safety controls required by the challenge.

### Priority
`P1`

### Must deliver
- Real admin dashboard
- Report review flow
- Role-based access control
- Protection of sensitive data

### Backend
- Finish moderation/report endpoints and actions
- Add RBAC middleware/policy enforcement across sensitive routes
- Protect private messages and private address/location details

### Frontend
- Build flagged-content review and moderation action flows
- Add admin-only navigation and protected experiences
- Show role-aware UI where needed

### Data / API
- Define report status/action model
- Define admin dashboard summary payloads
- Define role/permission model used by client and server

### Testing
- Add RBAC tests for protected routes
- Add moderation workflow tests
- Add tests ensuring sensitive data is not exposed to unauthorized users

### Exit criteria
- Admins can moderate the platform
- Sensitive data is access-controlled

## Sprint 9: Scalability And Resilience

### Goal
Meet the non-functional expectations from the PDF.

### Priority
`P2`

### Must deliver
- Better handling for high traffic and heavy work
- Graceful degradation when secondary services fail

### Backend
- Add caching where appropriate
- Move heavy work off hot request paths if needed
- Harden external-service failure handling
- Optimize slow spatial/database queries

### Frontend
- Add resilient loading/fallback states when secondary services fail
- Ensure the app remains usable when map/weather/AI features are degraded

### Data / API
- Identify expensive queries and outputs that should be cached or denormalized
- Define fallback response shapes for degraded states where needed

### Testing
- Add performance smoke tests where useful
- Add failure-mode tests for weather/maps/uploads/AI dependencies
- Add regression checks for degraded-but-functional behavior

### Exit criteria
- The app remains usable when secondary integrations fail
- Heavy operations do not block core user flows

## Sprint 10: AI Guardian For Lost Pets (Bonus)

### Goal
Implement the bonus feature cleanly if time allows.

### Priority
`P3`

### Must deliver
- Pet photo analysis
- Similarity matching
- Match UI with confidence score

### Backend
- Integrate image-analysis provider
- Extract pet features from uploaded images
- Compare found-pet reports against lost-pet reports
- Store and rank suggested matches

### Frontend
- Build found/lost pet upload and review flows
- Present suggested matches with confidence/similarity score
- Add user actions for confirming or dismissing suggested matches

### Data / API
- Define pet-analysis result model
- Define pet-match scoring payloads
- Define review/confirmation states for suggested matches

### Testing
- Add tests for match scoring and ranking rules
- Add tests for pet-upload and review flows
- Add fixture-based tests for pet match suggestions if feasible

### Exit criteria
- Users can upload/report pets and receive meaningful match suggestions

## 4. Suggested Delivery Sequence

If you want the safest order to maximize challenge completeness:

1. Sprint 0
2. Sprint 1
3. Sprint 2
4. Sprint 3
5. Sprint 4
6. Sprint 5
7. Sprint 6
8. Sprint 7
9. Sprint 8
10. Sprint 9
11. Sprint 10

## 5. Definition Of “Challenge Ready”

The project is challenge-ready when all of the following are true:

- No fake data remains in the main product flows
- Dashboard and map are real-time and location-aware
- Skills/resources/transactions are fully usable
- Messaging is fully usable for coordination
- Hero alerts work with real location/skill matching
- Trust, verification, moderation, and privacy are enforced
- Severe weather triggers the safety check-in experience
- The app is stable enough for demo and judging

## 6. Non-Code Submission Requirements

Also remember the PDF requires more than code:

- Public GitHub repository
- Demo/presentation video of at least 3 minutes
- Any organizer/community submission steps required by the challenge
