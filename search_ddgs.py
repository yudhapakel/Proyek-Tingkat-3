from duckduckgo_search import DDGS
import json

queries = [
    "Polemik Belum Tuntas, Dinas Perikanan Tanjab Timur Tancap Gas Anggarkan Lagi Kapal 10 GT Rp 1,7 Miliar!",
    "Korporasi Perikanan Pelaku Illegal Fishing Nyaris tak Tersentuh Proses Hukum, Mengapa?"
]

results = {}
with DDGS() as ddgs:
    for q in queries:
        try:
            r = list(ddgs.text(q, max_results=1))
            if r:
                results[q] = r[0]['href']
            else:
                results[q] = 'Not found'
        except Exception as e:
            results[q] = str(e)

print(json.dumps(results, indent=2))
