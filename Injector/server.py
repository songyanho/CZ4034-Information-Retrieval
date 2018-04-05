import falcon
from falcon_multipart.middleware import MultipartMiddleware
import json
import pandas as pd
from elasticsearch import Elasticsearch
from elasticsearch import helpers
from textblob import TextBlob, Word
from nltk.stem.porter import PorterStemmer
from nltk.corpus import stopwords

# Default configuration
stopwords = set(stopwords.words('english'))
stemmer = PorterStemmer()

def text_preprocessing(raw_review):
    try:
        review = TextBlob(raw_review.decode('ascii', 'ignore').encode('ascii','ignore'))
        # Tokenization
        # Normalization
        # Stemming
        # Remove stopwords
        clean_tokens = []
        for word in review.words:
            stem = stemmer.stem(word.lower())
            if stem not in stopwords:
                clean_tokens.append(stem)

        return ' '.join(clean_tokens)
    except:
        return ''
    
def sentiment_preprocessing(raw_review):
    try:
        review = TextBlob(raw_review.decode('ascii', 'ignore').encode('ascii','ignore'))
        return review.sentiment
    except:
        return 0

# Index to elasticsearch
es = Elasticsearch(['http://elastic:changeme@localhost:9200/'])

class Injector:
    def on_post(self, req, resp):
        data = req.get_param('dataset')
        
        reviews = pd.DataFrame.from_records(json.loads(data))

        reviews['tokens'] = reviews['review'].apply(text_preprocessing)
        reviews['sentiment'] = reviews['review'].apply(sentiment_preprocessing)
        actions = [{
        "_index": "review",
        "_type": "rottentomato",
        "_source": review.to_dict()} for _, review in reviews.iterrows()]
        helpers.bulk(es, actions)


# falcon.API instances are callable WSGI apps
app = falcon.API(middleware=[MultipartMiddleware()])
app.req_options.auto_parse_form_urlencoded = True

# Resources are represented by long-lived class instances
injector = Injector()

# things will handle all requests to the '/things' URL path
app.add_route('/inject', injector)




