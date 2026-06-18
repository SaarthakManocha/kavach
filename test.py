import pandas as pd
import json

df = pd.read_pickle('Dataset/violations_clean.pkl')

# Get primary police station per zone
zone_station = (df.groupby('geohash')['police_station']
                .agg(lambda x: x.mode().iloc[0])
                .to_dict())

# Load enforcement anomalies to get rates
with open('outputs/enforcement_anomalies.json') as f:
    enf_data = json.load(f)

station_rates = {s['police_station']: s['enforcement_rate'] 
                 for s in enf_data}

# Add to zone_congestiq.json
with open('outputs/zone_congestiq.json') as f:
    zones = json.load(f)

for z in zones:
    station = zone_station.get(z['zone_id'], 'Unknown')
    z['primary_station'] = station
    z['station_enforcement_rate'] = station_rates.get(station, 0.857)

with open('outputs/zone_congestiq.json', 'w') as f:
    json.dump(zones, f)

# Verify Elite Junction
elite = next(z for z in zones if z['zone_id'] == 'tdr1v6')
print(f"Elite Junction station: {elite['primary_station']}")
print(f"Station enforcement rate: {elite['station_enforcement_rate']:.1%}")