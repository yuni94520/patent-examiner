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

    def test_search_formula_validation_and_generation(self):
        valid = '\n'.join([
            'A標準式：IC=(H04L OR H04W) AND (資源分配 OR resource allocation) AND (觸發回報 OR triggered reporting) AND (參考信號 OR reference signal)',
            'A放寬式：IC=(H04L OR H04W) AND (資源分配 OR resource allocation) AND (參考信號 OR reference signal)',
            'B標準式：IC=(H04L OR H04W) AND (使用者設備 OR user equipment OR UE) AND (基地台 OR base station OR gNB) AND (控制訊息 OR control message)',
            'B放寬式：IC=(H04L OR H04W) AND (使用者設備 OR user equipment OR UE) AND (控制訊息 OR control message)'])
        self.assertEqual(app.validate_search_formula(valid), valid)
        with self.assertRaises(ValueError): app.validate_search_formula(valid + '\n說明：完成')
        with self.assertRaises(ValueError): app.validate_search_formula(valid.replace('IC=(H04L OR H04W)', 'IC=(IPC1 OR nonsense)', 1))
        with patch.object(app, 'call_llm', return_value=(valid, 'gpt-test')) as mocked:
            result = app.generate_search_formula({'claim': 'a claim', 'ipc': 'H04L', 'keyword_count': 8})
            self.assertEqual(result['result'], valid);self.assertEqual(result['model'], 'gpt-test')
            messages = mocked.call_args.args[0]
            self.assertIn('待分析資料', messages[1]['content'])

    def test_search_formula_repairs_once_then_validates(self):
        valid = '\n'.join([
            'A標準式：IC=(G06F) AND (資料 OR data) AND (模型 OR model) AND (分類 OR classification)',
            'A放寬式：IC=(G06F) AND (模型 OR model) AND (分類 OR classification)',
            'B標準式：IC=(G06F) AND (處理器 OR processor) AND (記憶體 OR memory) AND (分類器 OR classifier)',
            'B放寬式：IC=(G06F) AND (處理器 OR processor) AND (分類器 OR classifier)'])
        with patch.object(app, 'call_llm', side_effect=[('bad output', 'gpt-test'), (valid, 'gpt-test')]) as mocked:
            self.assertEqual(app.generate_search_formula({'claim':'claim','keyword_count':8})['result'], valid)
            self.assertEqual(mocked.call_count, 2)
        with patch.object(app, 'call_llm', side_effect=[('bad','gpt-test'), ('still bad','gpt-test')]):
            with self.assertRaises(ValueError): app.generate_search_formula({'claim':'claim','keyword_count':8})

if __name__=='__main__':unittest.main()
