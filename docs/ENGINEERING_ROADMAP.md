# Veda Engineering Roadmap & Strategy

This document outlines industry-standard improvements and technical initiatives to elevate Veda's quality, efficiency, and developer experience. These items are prioritized for future implementation.

## 1. End-to-End (E2E) Automation (Priority: High)
**Concept**: "Real User" Simulation.
**Tools**: [Maestro](https://maestro.mobile.dev/) (Recommended) or Detox.
**Action Plan**:
- [ ] Install Maestro.
- [ ] Create a "Smoke Test" suite: Login -> Create Activity -> Verify History.
- [ ] Integrate into CI pipeline to block regressions before merge.
**Value**: Replaces manual QA and catches integration bugs that unit tests miss.

## 2. Over-the-Air (OTA) Updates (Priority: High)
**Concept**: Instant Bug Fixes.
**Tools**: [Expo EAS Update](https://docs.expo.dev/eas-update/introduction/) or Microsoft CodePush.
**Action Plan**:
- [ ] Configure EAS Update in the project.
- [ ] Create `staging` and `production` release channels.
**Value**: fix critical JS bugs in minutes without waiting for App Store/Play Store review cycles (days).

## 3. Advanced Observability (Priority: Medium)
**Concept**: Performance Tracing & Real-time Monitoring.
**Tools**: [Sentry](https://sentry.io/for/react-native/) (Recommended) or Datadog.
**Action Plan**:
- [ ] Replace basic crash reporting with Sentry.
- [ ] Instrument key transactions: `App Launch`, `LogActivityModal Open`, `Database Query`.
**Value**: "Performance is a feature." Identifies slow queries or UI freezes on specific user devices.

## 4. Visual Regression Testing (Priority: Medium)
**Concept**: Pixel Perfection Guardrails.
**Tools**: Percy, Chromatic, or Loki.
**Action Plan**:
- [ ] Set up screenshot testing for critical screens.
- [ ] Configure CI to flag visual diffs automatically.
**Value**: Prevents accidental UI breakages (collapsed margins, font changes) during refactors.

## 5. Feature Flags (Priority: Low - Growth Stage)
**Concept**: Decouple Deployment from Release.
**Tools**: LaunchDarkly, Statsig, or Firebase Remote Config.
**Action Plan**:
- [ ] Wrap new risky features (e.g., "Recurring Activities v2") in logic flags.
**Value**: Allows testing in production with 10% of users and instant kill-switch if bugs are found.

## 6. Component Lab / Design System (Priority: Low)
**Concept**: Component Isolation & Documentation.
**Tools**: [Storybook](https://storybook.js.org/).
**Action Plan**:
- [ ] Create a Storybook environment.
- [ ] Document atomic components (Buttons, Pickers) in isolation.
**Value**: Speeds up UI development and enforces consistency across the app.

## 7. Automated Accessibility (A11y) (Priority: Ongoing)
**Concept**: Inclusive Design Enforcement.
**Tools**: `eslint-plugin-react-native-a11y`.
**Action Plan**:
- [ ] specific linting rules for accessibility labels and hit slops.
**Value**: Ensures the app is usable by everyone and improves general touch usability.

## 8. Dependency Visualization & Enforced Boundaries (Priority: Medium)
**Concept**: Automated Architecture Validation.
**Tools**: [Dependency-Cruiser](https://github.com/sverweij/dependency-cruiser).
**Action Plan**:
- [ ] Install dependency-cruiser.
- [ ] Define forbidden rules (e.g., "UI cannot import Services directly", "Features cannot import other Features").
- [ ] Generate visual architecture graphs (SVG/HTML) in CI.
**Value**: Prevents "spaghetti code" and enforces modular boundaries automatically.

## 9. Architecture Decision Records (ADR) (Priority: High)
**Concept**: Visual Knowledge Base for Decisions.
**Tools**: [Log4brains](https://github.com/thomvaill/log4brains).
**Action Plan**:
- [ ] Create `docs/adr` directory.
- [ ] Document past key decisions (e.g., "Why SQLite?", "Why Zustand?").
- [ ] Setup Log4brains to visualize decision timeline and impact.
**Value**: Keeps architectural context alive and searchable for new team members.

## 10. Code Health Visualization (Priority: Low - Scale Phase)
**Concept**: Technical Debt Heatmaps.
**Tools**: [SonarQube](https://www.sonarqube.org/) or CodeScene.
**Action Plan**:
- [ ] Integrate static analysis visualization.
- [ ] Identify "Hotspots" (files with high complexity + high churn).
**Value**: visually identifies "God Classes" and areas needing refactoring before they become unmaintainable.
