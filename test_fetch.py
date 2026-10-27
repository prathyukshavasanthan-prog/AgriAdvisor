import urllib.request
import json
import time

url = 'https://archive-api.open-meteo.com/v1/archive?latitude=30.90&longitude=75.85&start_date=2021-01-01&end_date=2023-12-31&daily=temperature_2m_mean,precipitation_sum,et0_fao_evapotranspiration&timezone=Asia%2FKolkata'
t0 = time.time()
req = urllib.request.Request(url, headers={'User-Agent': 'AgriAdvisor/1.0'})
with urllib.request.urlopen(req, timeout=15) as res:
    data = json.loads(res.read().decode('utf-8'))
days = len(data['daily']['time'])
print(f"Fetched {days} daily records for Ludhiana in {time.time()-t0:.2f}s")
print(f"Sample: Date={data['daily']['time'][0]}, Temp={data['daily']['temperature_2m_mean'][0]}, Rain={data['daily']['precipitation_sum'][0]}, ET0={data['daily']['et0_fao_evapotranspiration'][0]}")
