"""Read every delivered file; check required files, UTF-8/JSON and local Markdown links.

Run: python3 evidence/verify-kit.py
Writes nothing. Exit 0 verifies structural integrity, not substantive correctness.
"""
from pathlib import Path
import hashlib
import json
import re

root = Path(__file__).resolve().parent.parent
required = [
    'README.md', '00-DIAGNOSIS.md', 'CLAUDE.md',
    'governance/01-ENVIRONMENT.md', 'governance/02-DISPATCH.md',
    'governance/03-RUBRIC.md', 'templates/04-DELEGATION.md',
    'governance/05-MAINTENANCE.md', 'governance/06-LESSONS.md',
    'governance/07-NEXT-SESSION.md', 'evidence/SECURITY-REVIEW.md',
    'evidence/PUBLIC-API.md', 'evidence/SOURCE-MANIFEST.md',
    'evidence/REPOSITORY-IDENTITY.md', 'evidence/BASELINE-RESULTS.json',
    'evidence/diagnose-v310.cjs', 'sources/v3.10.html',
    'evidence/FINAL-REVIEW.md', 'evidence/SECURITY-SECOND-OPINION.md',
]
errors = [f'Missing: {name}' for name in required if not (root/name).is_file()]
files = []
for p in sorted(root.rglob('*')):
    if not p.is_file() or '__pycache__' in p.parts:
        continue
    data = p.read_bytes()
    rel = p.relative_to(root).as_posix()
    if not data:
        errors.append(f'Empty: {rel}')
    files.append({'path': rel, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    if p.suffix in {'.md', '.json', '.cjs', '.py', '.html', '.txt'}:
        content = data.decode('utf-8')
        if p.suffix == '.json':
            json.loads(content)
        if p.suffix == '.md' and 'backups' not in p.parts:
            for link in re.findall(r'\[[^\]]*\]\(([^)]+)\)', content):
                if '://' in link or link.startswith('#'):
                    continue
                dest = (p.parent/link.split('#')[0]).resolve()
                if not dest.exists():
                    errors.append(f'Broken local link: {rel} -> {link}')
source_hash = hashlib.sha256((root/'sources/v3.10.html').read_bytes()).hexdigest() if (root/'sources/v3.10.html').exists() else ''
if source_hash and source_hash not in (root/'evidence/SOURCE-MANIFEST.md').read_text():
    errors.append('Source hash not recorded in manifest')
print(json.dumps({'status': 'PASS' if not errors else 'FAIL',
                  'scope': 'Full byte read-back, required files, source hash, UTF-8/JSON, local Markdown links; not a security test',
                  'errors': errors, 'files': files}, ensure_ascii=False, indent=2))
raise SystemExit(bool(errors))
