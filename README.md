# Healthcare Fraud Intelligence

Healthcare fraud detection and referral-ring analytics platform using statistical anomaly detection and graph algorithms.

## Architecture

- **Backend**: Express.js server providing REST APIs:
  - `GET /api/health` - Service health status
  - `GET /api/summary` - Statistical and graph analytics summary
  - `GET /api/providers` - Scored provider list with optional `?risk=` filter (CRITICAL, HIGH, MEDIUM, LOW)
  - `GET /api/providers/:id` - Detailed provider fraud indicators and explanation
  - `GET /api/fraud/rings` - Strongly connected components (SCC) referral cycles
- **Core Algorithms**:
  - Specialty-specific Z-score anomaly detection & billing velocity
  - Graph-based referral ring detection using Tarjan's Strongly Connected Components (SCC)
  - Network centrality measurement via PageRank
  - Multi-factor risk scoring engine
- **Frontend**: Responsive analytical dashboard with real-time risk filtering, network ring visualization, and provider investigation pane.
