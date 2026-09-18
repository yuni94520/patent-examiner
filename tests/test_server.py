import importlib.util
import json
import os
from pathlib import Path
import threading
import unittest
import urllib.request
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('semantic_app', Path(__file__).parents[1]/'server/app.py')
app = importlib.util.module_from_spec(spec);spec.loader.exec_module(app)

class Encoder:
    def encode(self, texts, **kwargs):
        return [[1., float(len(t)%7+1), 0.5] for t in texts]

class Response:
    def __init__(self, value): self.value=value
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def read(self, size): return json.dumps({'choices':[{'message':{'content':json.dumps(self.value)}}]}).encode()

class Tests(unittest.TestCase):
    def setUp(self):
        self.s = app.Service(Encoder());self.s.model='test-model';self.s.revision='test-revision'
    def test_embedding_shape_and_norm(self):
        r=self.s.dispatch('/embed',{'texts':['beam','layer']})
        self.assertEqual(len(r['embeddings']),2)
        self.assertAlmostEqual(sum(x*x for x in r['embeddings'][0]),1)
    def test_invalid_batch(self):
        for value in (None,[],[''],[2],['x']*129):
            with self.assertRaises(ValueError):self.s.dispatch('/embed',{'texts':value})
    def test_expansion_bounded_and_reproducible(self):
        a=self.s.dispatch('/expand',{'term':'beam','top_k':5});b=self.s.dispatch('/expand',{'term':'beam','top_k':5})
        self.assertEqual(a,b);self.assertLessEqual(len(a['neighbors']),5)
        self.assertTrue(all(x in self.s.terms for x in a['neighbors']))
    def test_extraction_source_validation_utf16(self):
        with patch.dict(os.environ,{'LLM_URL':'http://localhost/mock','LLM_MODEL':'mock'}):
            with patch.object(app.urllib.request,'urlopen',return_value=Response({'elements':['A😀;','tail']})):
                r=app.extract('A😀;tail');self.assertEqual(r['elements'],[{'start':0,'end':4},{'start':4,'end':8}])
            with patch.object(app.urllib.request,'urlopen',return_value=Response({'elements':['A😀;']})):
                with self.assertRaises(ValueError):app.extract('A😀;tail')
    def test_http_embed_and_cors(self):
        server=app.ThreadingHTTPServer(('127.0.0.1',0),app.Handler)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            with patch.object(app,'SERVICE',self.s):
                url='http://127.0.0.1:'+str(server.server_port)+'/embed'
                req=urllib.request.Request(url,data=b'{"texts":["beam"]}',headers={'Content-Type':'application/json','Origin':'http://localhost:8080'})
                with urllib.request.urlopen(req) as res:
                    self.assertEqual(res.status,200);self.assertEqual(json.load(res)['model'],'test-model')
                req.add_header('Origin','https://untrusted.example')
                with self.assertRaises(urllib.error.HTTPError) as err:urllib.request.urlopen(req)
                self.assertEqual(err.exception.code,403)
        finally:server.shutdown();server.server_close();thread.join()

if __name__=='__main__':unittest.main()
