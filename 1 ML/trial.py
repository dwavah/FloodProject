import requests
import pandas as pd

# URL to fetch data from your script
script_url = "https://script.google.com/macros/s/AKfycbz0aCrDzH6-sqMpsxGcR-I4rXIVDzPDNJL_cnpW7p_qT8jkT0OfpKqmi8bpRJE2CEVhuQ/exec"

response = requests.get(script_url)
data = response.json()  # Assuming the script returns JSON data

# Convert JSON to DataFrame
df = pd.DataFrame(data)

print(df.head())  # Preview the data
