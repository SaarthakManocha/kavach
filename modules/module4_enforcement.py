"""
Module 4 — Enforcement Anomaly Detector
KAVACH — Parking Congestion Cascade Intelligence Platform

Identifies police stations with suspiciously low enforcement rates relative
to their violation volume using Isolation Forest for unsupervised anomaly detection.

Input:  Dataset/violations_clean.pkl
Output: outputs/enforcement_anomalies.json

Run with: python modules/module4_enforcement.py
"""

import pandas as pd
import numpy as np
import json
import warnings
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import shap

warnings.filterwarnings('ignore')


# Paths relative to project root
PROJECT_ROOT = Path(__file__).parent.parent
DATASET_DIR = PROJECT_ROOT / "Dataset"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"


def load_data() -> pd.DataFrame:
    """Load violations data from cleaned pickle or fall back to raw CSV."""
    pkl_path = DATASET_DIR / "violations_clean.pkl"
    csv_path = DATASET_DIR / "jan to may police violation_anonymized791b166.csv"

    if pkl_path.exists():
        print(f"Loading cleaned data from {pkl_path}")
        return pd.read_pickle(pkl_path)
    elif csv_path.exists():
        print(f"WARNING: violations_clean.pkl not found, falling back to raw CSV")
        df = pd.read_csv(csv_path)
        # Basic cleaning: ensure required columns exist
        df['data_sent_to_scita'] = df['data_sent_to_scita'].fillna(False).astype(bool)
        df['validation_status'] = df['validation_status'].fillna('unknown').str.lower().str.strip()
        df['police_station'] = df['police_station'].fillna('Unknown').str.strip()
        return df
    else:
        raise FileNotFoundError(
            f"No data file found. Expected:\n"
            f"  {pkl_path}\n"
            f"  {csv_path}"
        )


def aggregate_per_station(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate violation statistics per police station."""
    stats = df.groupby('police_station').agg(
        total_violations=('id', 'count'),
        enforced=('data_sent_to_scita', 'sum'),
        approved=('validation_status', lambda x: (x == 'approved').sum()),
        rejected=('validation_status', lambda x: (x == 'rejected').sum()),
    ).reset_index()

    stats['enforcement_rate'] = stats['enforced'] / stats['total_violations']
    stats['approval_rate'] = stats['approved'] / (stats['approved'] + stats['rejected']).clip(lower=1)

    return stats


FEATURE_COLS = ['total_violations', 'enforcement_rate', 'approval_rate']

FEATURE_LABELS = {
    'total_violations': 'Violation Volume',
    'enforcement_rate': 'Enforcement Rate',
    'approval_rate': 'Approval Rate',
}


def detect_anomalies(stats: pd.DataFrame) -> tuple:
    """Run Isolation Forest to detect enforcement anomalies + SHAP explanations."""
    features = stats[FEATURE_COLS].values

    # Standardize features
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)

    # Isolation Forest — contamination=0.15 means ~15% of stations flagged as anomalous
    iso = IsolationForest(contamination=0.15, random_state=42, n_estimators=200)
    stats['anomaly_label'] = iso.fit_predict(features_scaled)
    stats['anomaly_score'] = iso.decision_function(features_scaled)
    stats['is_anomaly'] = stats['anomaly_label'] == -1

    # Rank by anomaly_score ascending (most anomalous = rank 1, most negative score)
    stats['rank'] = stats['anomaly_score'].rank(method='min').astype(int)

    # --- SHAP Explanations ---
    print("  Computing SHAP explanations ...")
    # Use KernelExplainer for IsolationForest (unsupervised model)
    # We explain the decision_function (anomaly score)
    explainer = shap.KernelExplainer(
        iso.decision_function, features_scaled,
        link="identity"
    )
    shap_values = explainer.shap_values(features_scaled, nsamples=100)

    # Compute per-station SHAP reasons
    avg_values = stats[FEATURE_COLS].mean()
    shap_reasons = []
    for i in range(len(stats)):
        reasons = []
        # Get indices sorted by absolute SHAP value (most impactful first)
        sorted_indices = np.argsort(-np.abs(shap_values[i]))
        for idx in sorted_indices[:3]:  # top 3 reasons
            col = FEATURE_COLS[idx]
            sv = shap_values[i][idx]
            actual = stats.iloc[i][col]
            avg = avg_values[col]

            # Direction: is this feature pushing toward anomaly or normal?
            if col == 'enforcement_rate':
                direction = 'low' if actual < avg else 'high'
                diff = abs(actual - avg)
                if col in ('enforcement_rate', 'approval_rate'):
                    detail = f"{diff*100:.0f}pp {'below' if actual < avg else 'above'} average ({avg*100:.0f}%)"
                else:
                    detail = f"{actual/avg:.1f}x the average ({avg:,.0f})"
            elif col == 'approval_rate':
                direction = 'low' if actual < avg else 'high'
                diff = abs(actual - avg)
                detail = f"{diff*100:.0f}pp {'below' if actual < avg else 'above'} average ({avg*100:.0f}%)"
            else:  # total_violations
                direction = 'high' if actual > avg else 'low'
                detail = f"{actual/avg:.1f}x the average ({avg:,.0f})"

            reasons.append({
                'factor': FEATURE_LABELS[col],
                'feature': col,
                'direction': direction,
                'detail': detail,
                'shap_value': round(float(sv), 4),
                'actual_value': round(float(actual), 4),
            })
        shap_reasons.append(reasons)

    print(f"  SHAP explanations computed for {len(stats)} stations")
    return stats, shap_reasons


def format_output(stats: pd.DataFrame, shap_reasons: list) -> list:
    """Format output with SHAP explanations."""
    # Sort by rank ascending (most anomalous first)
    sort_order = stats['rank'].argsort().values
    stats = stats.sort_values('rank').reset_index(drop=True)
    sorted_reasons = [shap_reasons[i] for i in sort_order]

    output = []
    for idx, (_, row) in enumerate(stats.iterrows()):
        entry = {
            "police_station": row['police_station'],
            "total_violations": int(row['total_violations']),
            "enforcement_rate": round(float(row['enforcement_rate']), 4),
            "approval_rate": round(float(row['approval_rate']), 4),
            "anomaly_score": round(float(row['anomaly_score']), 4),
            "is_anomaly": bool(row['is_anomaly']),
            "rank": int(row['rank']),
            "anomaly_reasons": sorted_reasons[idx],
        }
        output.append(entry)

    return output


def print_summary(stats: pd.DataFrame):
    """Print anomaly summary to stdout."""
    avg_enforcement = stats['enforcement_rate'].mean()
    anomalies = stats[stats['is_anomaly']].sort_values('anomaly_score')

    print("\n" + "=" * 70)
    print("KAVACH — Enforcement Anomaly Detection Summary")
    print("=" * 70)
    print(f"Total police stations analyzed: {len(stats)}")
    print(f"Average enforcement rate: {avg_enforcement:.1%}")
    print(f"Anomalous stations detected: {len(anomalies)}")
    print("-" * 70)

    if len(anomalies) > 0:
        print("\nFLAGGED ANOMALIES:")
        for _, row in anomalies.iterrows():
            print(
                f"  ANOMALY: {row['police_station']} — "
                f"{int(row['total_violations']):,} violations, "
                f"{row['enforcement_rate']:.0%} enforcement rate "
                f"(avg is {avg_enforcement:.0%})"
            )
    else:
        print("\nNo anomalies detected.")

    print("=" * 70 + "\n")


def main():
    """Main execution pipeline for Module 4."""
    # 1. Load data
    df = load_data()
    print(f"Loaded {len(df):,} records")

    # 2. Aggregate per station
    stats = aggregate_per_station(df)
    print(f"Aggregated stats for {len(stats)} police stations")

    # 3. Detect anomalies + SHAP explanations
    stats, shap_reasons = detect_anomalies(stats)

    # 4. Print summary
    print_summary(stats)

    # 5. Save output
    output = format_output(stats, shap_reasons)
    OUTPUTS_DIR.mkdir(exist_ok=True)
    output_path = OUTPUTS_DIR / "enforcement_anomalies.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"Output saved to {output_path}")
    print(f"Total entries: {len(output)}")
    print(f"Anomalies: {sum(1 for e in output if e['is_anomaly'])}")


if __name__ == '__main__':
    main()
