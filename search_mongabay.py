from duckduckgo_search import DDGS
import json

queries = [
    "illegal fishing site:mongabay.co.id",
    "kapal perikanan site:mongabay.co.id",
    "pekerja migran perikanan site:mongabay.co.id"
]

results = []
with DDGS() as ddgs:
    for q in queries:
        try:
            r = list(ddgs.text(q, max_results=1))
            if r:
                results.append({"title": r[0]['title'], "url": r[0]['href']})
        except Exception as e:
            print(e)

print(json.dumps(results, indent=2))
