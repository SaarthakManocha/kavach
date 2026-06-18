<p align="center">
  <img src="https://img.shields.io/badge/KAVACH-Traffic%20Intelligence%20Platform-blue?style=for-the-badge&logo=shield" alt="KAVACH Badge"/>
</p>

<h1 align="center">🛡️ KAVACH — AI-Powered Traffic Violation Intelligence Platform</h1>

<p align="center">
  <em>Predictive congestion modeling, smart patrol deployment, and data-driven traffic enforcement for Bengaluru</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?logo=python" alt="Python"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/LightGBM-4.6-green?logo=microsoft" alt="LightGBM"/>
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite" alt="Vite"/>
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Data Pipeline](#data-pipeline)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Module Details](#module-details)
- [API Reference](#api-reference)
- [Dashboard Pages](#dashboard-pages)
- [Project Structure](#project-structure)

---

## Overview

**KAVACH** is an end-to-end traffic intelligence platform built for Bengaluru Police, processing **298,277 traffic violations** across **789 geohash zones** and **54 police stations** to deliver:

- **CongestIQ Score** — A composite congestion-impact metric per zone, weighted by vehicle type, time-of-day, and downstream cascade reach
- **Temporal Predictions** — LightGBM-powered hourly violation forecasting across all zones
- **PatrolOpt Engine** — Optimal deployment of 30 patrol units with Google Maps-calibrated travel times
- **Cascade Simulation** — Real road-network propagation modeling using OpenStreetMap graph data
- **Counterfactual Analysis** — What-if scenarios for enforcement rate changes
- **AI Daily Briefing** — Automated operational intelligence synthesis

---

## Key Features

| Feature | Description |
|---|---|
| 🗺️ **Live Heatmap** | 789-zone interactive heatmap with real-time CongestIQ scores |
| 📊 **Deployment Grid** | 24-hour × 15-zone patrol schedule with ML-predicted unit demand |
| 🚔 **Unit Itineraries** | Per-unit route plans with calibrated distances (±7% vs Google Maps) |
| 🌧️ **Weather Correlation** | Rainfall-violation analysis with zone-specific sensitivity scores |
| ⚖️ **Enforcement Audit** | Per-station enforcement rate anomaly detection |
| 🔮 **Counterfactual Slider** | Interactive what-if analysis: "What if enforcement improved by X%?" |
| 🧬 **Junction Archetypes** | Behavioral clustering of 164 junction types |
| 📋 **AI Briefing** | Auto-generated daily operations briefing for command staff |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     KAVACH Architecture                      │
├──────────────┬──────────────────────┬───────────────────────┤
│  RAW DATA    │    PROCESSING        │    PRESENTATION       │
│              │                      │                       │
│  violations  │  data_cleaning.py    │   React Dashboard     │
│  .csv        │       │              │   (14 pages)          │
│  (298K rows) │       ▼              │       ▲               │
│              │  Module 1: Cascade   │       │               │
│  OSM Road    │  Module 2: CongestIQ │   FastAPI Server      │
│  Network     │  Module 3: PatrolOpt │   (11 endpoints)      │
│  (.graphml)  │  Module 4: Enforce   │       ▲               │
│              │  Module 5: Temporal  │       │               │
│              │  Module 6: Counter   │   outputs/*.json      │
│              │  Module 7: Archetype │   (9 files)           │
│              │  Module W: Weather   │                       │
└──────────────┴──────────────────────┴───────────────────────┘
```

---

## Data Pipeline

```
Raw CSV (298,277 violations)
    │
    ▼
data_cleaning.py → violations_clean.pkl
    │
    ├──► module1_cascade.py    → cascade_data.json (road network propagation)
    ├──► module2_congestiq.py  → zone_congestiq.json (789 zones scored)
    ├──► temporal_prediction.py → zone_temporal_predictions.json (LightGBM)
    ├──► module3_patrolopt.py  → patrol_plan.json (30 units, 24h schedule)
    ├──► module4_enforcement.py → enforcement_anomalies.json (54 stations)
    ├──► module_weather.py     → weather_sensitivity.json
    ├──► module6_counterfactual.py → counterfactual.json
    └──► module7_archetypes.py → junction_archetypes.json
```

---

## Tech Stack

### Backend
| Component | Technology | Version |
|---|---|---|
| Language | Python | 3.10+ |
| API Framework | FastAPI | 0.115 |
| ASGI Server | Uvicorn | 0.30 |
| Data Processing | Pandas / NumPy | 2.3 / 2.4 |
| ML Model | LightGBM | 4.6 |
| ML Toolkit | scikit-learn | 1.8 |
| Graph Analysis | NetworkX | 3.6 |
| Geospatial | geohash2, GeoPandas | 1.1 |
| HTTP Client | Requests | 2.32 |

### Frontend
| Component | Technology | Version |
|---|---|---|
| Framework | React | 19 |
| Build Tool | Vite | 8.0 |
| Routing | React Router | 7.17 |
| Charts | Recharts | 3.8 |
| Maps | Leaflet + React-Leaflet | 1.9 / 5.0 |
| Icons | Lucide React | 1.20 |

---

## Quick Start

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm
- ~500 MB disk space for outputs

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/kavach.git
cd kavach
```

### 2. Install Python Dependencies

```bash
pip install pandas numpy fastapi uvicorn geohash2 networkx scikit-learn lightgbm requests geopandas
```

### 3. Install Dashboard Dependencies

```bash
cd dashboard
npm install
cd ..
```

### 4. Run the Data Pipeline (Optional)

> **Note:** Pre-computed outputs are included in `outputs/`. Only run these if you want to regenerate from raw data.

```bash
# Step 1: Clean raw data (requires raw CSV in Dataset/)
python modules/data_cleaning.py

# Step 2: Generate CongestIQ scores
python modules/module2_congestiq.py

# Step 3: Run cascade simulation (requires bengaluru_roads.graphml)
python modules/module1_cascade.py

# Step 4: Generate temporal predictions (LightGBM)
python modules/temporal_prediction.py

# Step 5: Generate patrol plan with travel-time calibrated itineraries
python modules/module3_patrolopt.py

# Step 6: Enforcement anomaly detection
python modules/module4_enforcement.py

# Step 7: Weather sensitivity analysis
python modules/module_weather.py

# Step 8: Counterfactual analysis
python modules/module6_counterfactual.py

# Step 9: Junction archetypes
python modules/module7_archetypes.py
```

### 5. Start the API Server

```bash
python -m uvicorn api.main:app --port 8000
```

The API will be available at `http://localhost:8000`

### 6. Start the Dashboard

```bash
cd dashboard
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Module Details

### Module 1: CascadeNet (`module1_cascade.py`)
Simulates traffic congestion propagation through Bengaluru's real road network (OpenStreetMap). Uses BFS traversal at 15/30/60-minute horizons to compute downstream impact reach for each zone.

- **Input:** `violations_clean.pkl`, `bengaluru_roads.graphml`
- **Output:** `cascade_data.json` (200 zones with propagation frames)

### Module 2: CongestIQ (`module2_congestiq.py`)
Computes the composite CongestIQ score per zone:

```
CongestIQ = Σ(vehicle_weight × time_multiplier) × log₂(1 + cascade_reach)
```

Multi-horizon cascade weighting: 50% × 15min + 35% × 30min + 15% × 60min

- **Input:** `violations_clean.pkl`, `cascade_data.json`
- **Output:** `zone_congestiq.json` (789 zones with scores, severity, metadata)

### Module 3: PatrolOpt (`module3_patrolopt.py`)
Greedy patrol deployment engine with travel-time constraints:

- Assigns 30 patrol units across 8 × 2-hour shift blocks
- Distance-dependent road factor: 1.3× (<5km), 1.2× (5-15km), 1.1× (>15km)
- Speed model: 18-22 km/h peak, 25-30 km/h off-peak
- Calibrated within **±7% of Google Maps** real distances
- Feasibility threshold: 45-minute maximum transit time

- **Input:** `zone_congestiq.json`, `zone_temporal_predictions.json`
- **Output:** `patrol_plan.json` (211 plan entries, 30 unit itineraries, fleet summary)

### Module 4: Enforcement Audit (`module4_enforcement.py`)
Detects per-station enforcement rate anomalies against the city-wide average (85.7%).

- **Input:** `violations_clean.pkl`
- **Output:** `enforcement_anomalies.json` (54 police stations)

### Module 5: Temporal Prediction (`temporal_prediction.py`)
LightGBM model predicting hourly violation counts per zone. Features include hour, day-of-week, historical averages, and zone characteristics.

- **Input:** `violations_clean.pkl`
- **Output:** `zone_temporal_predictions.json` (15,312 predictions: 638 zones × 24 hours)

### Module 6: Counterfactual (`module6_counterfactual.py`)
What-if scenario modeling: estimates violation reduction under different enforcement rates (70%, 85%, 95%).

- **Input:** `zone_congestiq.json`, `violations_clean.pkl`
- **Output:** `counterfactual.json` (3 enforcement scenarios)

### Module 7: Junction Archetypes (`module7_archetypes.py`)
Behavioral clustering of junctions based on violation patterns, vehicle mix, and temporal profiles.

- **Input:** `violations_clean.pkl`, `zone_congestiq.json`
- **Output:** `junction_archetypes.json` (164 junction archetypes)

### Module W: Weather (`module_weather.py`)
Correlates rainfall data with violation patterns to identify weather-sensitive zones.

- **Input:** `violations_clean.pkl`, weather data
- **Output:** `weather_sensitivity.json` (zone-level weather impact scores)

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Server health check |
| `/api/heatmap` | GET | All 789 zones with CongestIQ scores and metadata |
| `/api/zone-action/{zone_id}` | GET | Detailed zone analysis with recommendations |
| `/api/cascade/{zone_id}` | GET | Congestion cascade propagation data |
| `/api/patrol-plan?hour=N` | GET | Patrol deployment grid (optional hour filter) |
| `/api/patrol-itineraries` | GET | Per-unit itineraries with fleet summary |
| `/api/weather-sensitivity` | GET | Weather-violation correlation analysis |
| `/api/enforcement` | GET | Per-station enforcement anomalies |
| `/api/counterfactual?enforcement_rate=X` | GET | What-if scenario analysis |
| `/api/archetypes` | GET | Junction behavioral archetypes |
| `/api/daily-briefing` | GET | AI-generated daily operations briefing |

---

## Dashboard Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Project showcase with key statistics |
| Dashboard | `/dashboard` | Interactive heatmap with zone detail panel |
| Deployment | `/deployment` | Patrol grid, unit itineraries, and fleet KPIs |
| High Risk Zones | `/high-risk` | Searchable table of high-priority zones |
| Enforcement | `/enforcement` | Station-level enforcement analysis |
| Weather | `/weather` | Weather-violation correlation charts |
| Impact | `/impact` | Counterfactual what-if analysis |
| Briefing | `/briefing` | AI daily operations briefing |
| Archetypes | `/archetypes` | Junction behavioral pattern clusters |
| Operations | `/operations` | Fleet operations overview |
| Analytics | `/analytics` | Key analytics summary |
| Live Map | `/live` | Real-time map visualization |

---

## Project Structure

```
KAVACH/
├── api/
│   └── main.py                 # FastAPI server (11 endpoints)
│
├── modules/
│   ├── data_cleaning.py        # Raw CSV → clean DataFrame
│   ├── module1_cascade.py      # Road network congestion cascade
│   ├── module2_congestiq.py    # CongestIQ composite scoring
│   ├── module3_patrolopt.py    # Patrol deployment optimization
│   ├── module4_enforcement.py  # Enforcement anomaly detection
│   ├── module6_counterfactual.py # What-if scenario analysis
│   ├── module7_archetypes.py   # Junction behavioral clustering
│   ├── module_weather.py       # Weather sensitivity analysis
│   ├── temporal_prediction.py  # LightGBM hourly forecasting
│   └── enrich_predicted_scores.py # Prediction enrichment
│
├── outputs/                    # Pre-computed JSON outputs
│   ├── zone_congestiq.json     # 789 zones with scores
│   ├── zone_temporal_predictions.json  # 15,312 hourly predictions
│   ├── patrol_plan.json        # Deployment grid + itineraries
│   ├── enforcement_anomalies.json  # 54 station audits
│   ├── weather_sensitivity.json
│   ├── counterfactual.json
│   ├── junction_archetypes.json
│   ├── cascade_data.json       # Road network propagation
│   └── spillover_data.json     # Inter-zone spillover
│
├── dashboard/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── pages/          # 14 page components
│   │   │   ├── live/           # Heatmap & zone panel
│   │   │   ├── patrol/         # Deployment grid & counterfactual
│   │   │   ├── analytics/      # Charts & visualizations
│   │   │   ├── common/         # Shared components
│   │   │   └── layout/         # Navigation & layout
│   │   ├── utils/              # API helpers & zone name resolution
│   │   ├── App.jsx
│   │   └── index.css           # Design system
│   └── package.json
│
├── Dataset/                    # Raw data (gitignored)
│   └── dataset.md              # Dataset documentation
│
├── models/                     # Trained models (gitignored)
├── .gitignore
├── PROJECT_STATUS.md
└── README.md
```

---

## Key Metrics

| Metric | Value |
|---|---|
| Total violations processed | 298,277 |
| Geohash zones scored | 789 |
| Police stations audited | 54 |
| Temporal predictions | 15,312 (638 zones × 24h) |
| Patrol units optimized | 30 |
| Zones in deployment grid | 59 |
| Fleet efficiency | 75.1% |
| Travel distance accuracy | ±7% vs Google Maps |
| Dashboard pages | 14 |
| API endpoints | 11 |

---

## Disclaimer

Unit numbers, distances, and travel times are mathematical calculations based on geohash centroid coordinates and calibrated road-distance models — not real-time GPS predictions. This system represents a scenario-based optimization framework demonstrating how data-driven patrol deployment could improve traffic enforcement efficiency in Bengaluru.

---

<p align="center">
  <strong>Built for Smart India Hackathon 2024</strong><br/>
  <em>Team KAVACH — Bengaluru Traffic Intelligence</em>
</p>
