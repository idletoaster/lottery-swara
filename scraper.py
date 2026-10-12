"""
Vedic Lunar Lottery Analytics - Data Ingestion (PWA Version)
"""
import requests, re, pandas as pd, concurrent.futures, os
from urllib.parse import quote_plus

DATA_FILE = 'jackpot_data.json'
STATES_LIST = [
    "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
    "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", 
    "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", 
    "Texas", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", 
    "District of Columbia", "Puerto Rico"
]
HEADERS = {'User-Agent': 'Mozilla/5.0'}

def fetch_state_data(game_name, game_path, state_name=None):
    url = f"https://portalseven.com/lottery/{game_path}_jackpot_winners.jsp" + (f"?state={quote_plus(state_name)}" if state_name else "")
    results = []
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        html = response.content.decode('utf-8', errors='ignore').replace('\xa0', ' ')
        raw_text = re.sub(r'<[^>]+>', ' ', html)
        for chunk in raw_text.split('$')[1:]:
            if 'Winning Numbers' in chunk and 'Date' in chunk:
                amt = re.search(r'^\s*([0-9.,]+\s*(?:Million|Billion|Millions|Billions)?)', chunk, re.IGNORECASE)
                dt = re.search(r'Date\s*:\s*([A-Za-z0-9,\s]+?)\s*(?:Winner|\.)', chunk, re.IGNORECASE)
                loc = re.search(r'Date\s*:.*?(?:Winner|\.)(.*?)(?=Winning Numbers)', chunk, re.IGNORECASE | re.DOTALL)
                st = re.search(r'\b([A-Z]{2})\s*(?:\d{5})?[\s\.]*Winning Numbers', chunk)
                if amt and dt:
                    results.append({
                        'date': dt.group(1).strip().replace('.', ''),
                        'Game': game_name,
                        'amount': f"${amt.group(1).strip()}",
                        'state': state_name if state_name else (st.group(1) if st else "Unknown"),
                        'location': re.sub(r'\s+', ' ', loc.group(1).strip())[:100] if loc else "N/A"
                    })
    except: pass
    return results

def scrape_jackpots():
    existing_df = pd.read_json(DATA_FILE) if os.path.exists(DATA_FILE) else pd.DataFrame()
    new_data = []

    if not existing_df.empty:
        new_data.extend(fetch_state_data('Powerball', 'powerball'))
        new_data.extend(fetch_state_data('Mega Millions', 'megamillions'))
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
            futures = [executor.submit(fetch_state_data, g, p, s) for s in STATES_LIST for g, p in [('Powerball', 'powerball'), ('Mega Millions', 'megamillions')]]
            for future in concurrent.futures.as_completed(futures): new_data.extend(future.result())

    new_df = pd.DataFrame(new_data)
    combined_df = pd.concat([existing_df, new_df], ignore_index=True)
    if combined_df.empty: return
    
    combined_df['date'] = pd.to_datetime(combined_df['date'], errors='coerce')
    combined_df.dropna(subset=['date'], inplace=True)
    combined_df.drop_duplicates(subset=['date', 'Game', 'amount'], keep='first', inplace=True)
    combined_df.sort_values(by='date', ascending=False, inplace=True)
    combined_df['date'] = combined_df['date'].dt.strftime('%Y-%m-%d')
    combined_df.to_json(DATA_FILE, orient='records', indent=4)
    print(f"Saved {DATA_FILE}. Total: {len(combined_df)}")

if __name__ == "__main__":
    scrape_jackpots()
