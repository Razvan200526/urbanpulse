<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the UrbanPulse client. PostHog is initialized in `src/main.tsx` using environment variables and the `RouterProvider` is wrapped with `PostHogProvider`. Users are identified on sign-in and after email verification (sign-up), with `posthog.reset()` called on sign-out and account deletion. Error tracking is wired into the global `ErrorFallback` component. Fifteen custom events are captured across auth, pulse, resource, profile, and settings flows.

| Event | Description | File |
|---|---|---|
| `user_signed_in` | User successfully signs in with email/password | `src/pages/signin/hooks.ts` |
| `user_signed_in_social` | User initiates social sign-in (GitHub/Google) | `src/pages/signin/hooks.ts` |
| `user_signed_up` | User successfully creates an account | `src/pages/signup/hooks.ts` |
| `email_verified` | User verifies email via OTP after sign-up | `src/pages/signup/hooks.ts` |
| `pulse_created` | User creates a community pulse (emergency, skill, or item) | `src/pages/map/hooks.ts` |
| `help_offered` | User offers help in response to a pulse | `src/pages/map/hooks.ts` |
| `help_offer_accepted` | Pulse owner accepts a help offer | `src/pages/map/hooks.ts` |
| `help_offer_rejected` | Pulse owner rejects a help offer | `src/pages/map/hooks.ts` |
| `resource_uploaded` | User uploads a resource to the community | `src/pages/resources/hooks.ts` |
| `borrow_requested` | User sends a borrow request for a resource | `src/pages/resources/hooks.ts` |
| `borrow_request_responded` | Resource owner accepts or rejects a borrow request | `src/pages/resources/hooks.ts` |
| `profile_updated` | User saves display name, bio, or avatar | `src/pages/profile/ProfilePage.tsx` |
| `skill_tags_updated` | User saves their skill tags | `src/pages/profile/ProfilePage.tsx` |
| `quiet_hours_saved` | User saves notification quiet hours | `src/pages/settings/SettingsPage.tsx` |
| `account_deleted` | User confirms and deletes their account | `src/pages/settings/SettingsPage.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://us.posthog.com/project/218293/dashboard/1429069)
- **Insight**: [Sign-up to first pulse funnel](https://us.posthog.com/project/218293/insights/voU5CJqy)
- **Insight**: [Community engagement funnel](https://us.posthog.com/project/218293/insights/nNfbo6il)
- **Insight**: [Daily sign-ups and sign-ins](https://us.posthog.com/project/218293/insights/hcwzQoZs)
- **Insight**: [Pulse creation by type](https://us.posthog.com/project/218293/insights/0lMF4XJz)
- **Insight**: [Account deletions (churn signal)](https://us.posthog.com/project/218293/insights/p7ltLVqg)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
