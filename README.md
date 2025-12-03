# Anchor Institution Engagement Tool
Author: Zhanchao Yang <br>
Master of City Planning and Master of Urban Spatial Analytics

MUSA JavaScript Engagement Project

Target Date 2025.12.18

## Purpose & Primary Users

This project is a lightweight engagement tool designed to make it simple for Penn students, staff, faculty, and nearby community members to share quick feedback about places on and around the Penn campus. The intended primary users are:
- Penn Facilities staff and managers who need actionable reports about building conditions, maintenance requests, and community sentiment.
- University City management officials who use community input to prioritize neighborhood improvements and coordinate with campus partners.
- Campus community members (students, staff, faculty, neighbors) who want an easy way to report problems, praise spaces, or suggest improvements.

The audience is specific and operational — not the general public — because submissions are routed to institutional clients who act on the feedback.


## What the tool does (how it meets user needs)

- Let users select a location on an interactive map and submit a short feedback form (issue, compliment, suggestion).
- Allow simple text feedback and optional metadata (photo attachment, category tags such as "cleanliness", "lighting", "accessibility", "safety").
- Provide a searchable map and list view for managers to filter and prioritize submissions by location, date, or category.
- Enable lightweight reporting for Penn Facilities and University City managers: exportable CSV, simple dashboards, and aggregated trends.


## Datasets and user-provided data

- Campus buildings GeoJSON: polygon features for campus buildings (used for snapping clicks to building footprints and attributing feedback to a building).
- University City boundary GeoJSON: polygon for spatial filtering and context.
- User submissions: each feedback item will include at minimum: timestamp, location (lat/lng and/or matched building id), category, short text comment, and optional photo or contact info (if the user chooses). These user-submitted records will be stored in a database or spreadsheet for clients to review.


## Technical implementation (high-level)

- Frontend: static HTML/CSS/JS using Mapbox GL JS for the interactive map (`index.html`, `js/index.js`). Mobile-first responsive UI.
- Mapping data: load GeoJSON files (buildings, boundary) client-side for quick interaction. Optionally host GeoJSON on a lightweight static asset server or CDN.
- Feedback UI: a short modal or side-panel form that appears after clicking the map. Form validates required fields and packages submission as JSON.
- Exports & reporting: CSV export endpoint or client-side CSV generation; simple dashboard charts (counts by category, time series).

## Checklist (next implementation steps)

- [x] Draft user-facing description and project purpose (this README).
- [ ] Design the feedback form (fields, validation, optional photo upload).
- [ ] Add map click behavior: allow users to select a location and open the feedback form.
- [ ] Integrate GeoJSON building/boundary layers and implement snapping from click to building.
- [ ] Implement search by place name or address.
- [ ] Prototype a submission backend (start with Google Sheets or a serverless function).
- [ ] Build a basic dashboard for clients: list view, filters, and CSV export.
- [ ] Add privacy notice and optional anonymization controls for users.
- [ ] Improve styling and accessibility (WCAG checks, keyboard navigation, aria attributes).
- [ ] Add tests and basic CI for deployment (linting, build checks).