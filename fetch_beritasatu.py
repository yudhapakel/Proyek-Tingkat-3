import urllib.request, re, urllib.parse
query = urllib.parse.quote('Polemik Belum Tuntas, Dinas Perikanan Tanjab Timur Tancap Gas')
url = 'https://www.beritasatu.com/search?q=' + query
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    links = set(re.findall(r'href="(https://www.beritasatu.com/[^"]+)"', html))
    for link in links:
        if 'tanjab' in link.lower() or 'kapal' in link.lower() or 'polemik' in link.lower():
            print(link)
except Exception as e:
    print(e)
