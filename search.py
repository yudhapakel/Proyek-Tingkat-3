import urllib.request
import urllib.parse
import re
import json

def search(query):
    url = 'https://html.duckduckgo.com/html/?q=' + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        match = re.search(r'class="result__url" href="([^"]+)"', html)
        if match: 
            return match.group(1)
    except Exception as e:
        return str(e)
    return 'Not found'

results = {
    "1": search('Polemik Belum Tuntas, Dinas Perikanan Tanjab Timur Tancap Gas Anggarkan Lagi Kapal 10 GT Rp 1,7 Miliar!'),
    "2": search('Korporasi Perikanan Pelaku Illegal Fishing Nyaris tak Tersentuh Proses Hukum, Mengapa?'),
    "3": search('Pertukaran Yang Tidak Setara Dan Eksploitasi Tenaga Kerja: Pekerja Migran Indonesia Di Industri Perikanan Taiwan')
}

print(json.dumps(results, indent=2))
