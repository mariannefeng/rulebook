from flask import Flask
from flask import request
from flask import abort
from flask import Response
import requests
from flask import jsonify
from bs4 import BeautifulSoup
import re
import pymupdf 
import pymupdf4llm
from io import BytesIO

app = Flask(__name__)

game_id_to_pdf = {}

@app.route('/games')
def games():
    search = request.args.get('search')

    if not search:
        return jsonify([])

    url = f'https://en.1jour-1jeu.com/rules/search?q={search}'
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    results = []
    for a in soup.find_all('a', class_='dark-link'):
        name = a.get_text(strip=True)
        href = a.get('href', '')
        if href.endswith('.pdf'):
            id = re.sub(r'[^a-z0-9\-]', '', name.lower().replace(' ', '-').replace('-rulebook', ''))
            link = href
            game_id_to_pdf[id] = link
            results.append({
                'id': id,
                'name': name,
                'link': link
            })
    return jsonify(results)    

@app.route('/games/<game_id>/rules')
def rules(game_id):
    if game_id not in game_id_to_pdf:
        abort(404)
    
    pdf_link = game_id_to_pdf[game_id]
    response = requests.get(pdf_link)

    return Response(
        response.content,
        mimetype='application/pdf',
        headers={
            'Content-Type': 'application/pdf',
            'Content-Disposition': f'inline; filename={game_id}.pdf'
        }
    )