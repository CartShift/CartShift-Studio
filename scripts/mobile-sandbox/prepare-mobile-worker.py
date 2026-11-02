#!/usr/bin/env python3
"""Build a deterministic single-file, build-only V3 worker from owner-pinned bytes."""
import argparse
import base64
import hashlib
from pathlib import Path

TEMPLATE = '''#!/usr/bin/env python3
# Generated from reviewed source pins; contains no credentials.
import base64, hashlib, json, os, sys
WORKER_PIN = {worker_pin!r}
ADAPTER_PIN = {adapter_pin!r}
WORKER_SOURCE = {worker_source!r}
ADAPTER_SOURCE = {adapter_source!r}
def load_worker():
    if os.environ.get('SANDBOX_WORKER_ROLE') != 'build' or os.environ.get('SANDBOX_WORKER_SLOT', '0') != '0':
        raise RuntimeError('Mobile supports only the isolated serial build role')
    source = base64.b64decode(WORKER_SOURCE, validate=True)
    adapter = base64.b64decode(ADAPTER_SOURCE, validate=True)
    if hashlib.sha256(source).hexdigest() != WORKER_PIN or hashlib.sha256(adapter).hexdigest() != ADAPTER_PIN:
        raise RuntimeError('Mobile source pin mismatch')
    ns = {{'__name__': 'verified_mobile_worker', '__file__': __file__ if '__file__' in globals() else '<mobile>'}}
    compat = {{}}
    exec(compile(source, '<verified-worker>', 'exec'), ns)
    exec(compile(adapter, '<verified-v3-transport>', 'exec'), compat)
    if ns['ROLE'] != 'build' or ns['PARALLEL_SLOT']:
        raise RuntimeError('Unexpected worker role')
    ns['worker_payload'] = compat['worker_payload']
    original_activity = ns['activity']
    def activity(event, **fields):
        if 'worker_version' in fields: fields['worker_version'] = 3
        return original_activity(event, **fields)
    ns['activity'] = activity
    return ns
if __name__ == '__main__':
    worker = load_worker()
    if '--identity-only' in sys.argv:
        worker['TOKEN'] = 'A' * 48
        worker['verify_identity']()
        print(json.dumps({{'offline_identity_verified': True, 'role': 'build', 'worker_version': 3,
                          'worker_sha256': WORKER_PIN, 'adapter_sha256': ADAPTER_PIN}}))
    else:
        sys.exit(worker['main']())
'''

def build(worker, worker_pin, adapter, adapter_pin):
    for data, pin in [(worker, worker_pin), (adapter, adapter_pin)]:
        if not data or len(data) > 256000 or hashlib.sha256(data).hexdigest() != pin:
            raise ValueError('Reviewed source SHA-256 mismatch')
        compile(data, '<source-pin>', 'exec')
    result = TEMPLATE.format(worker_pin=worker_pin, adapter_pin=adapter_pin,
        worker_source=base64.b64encode(worker).decode('ascii'),
        adapter_source=base64.b64encode(adapter).decode('ascii')).encode('utf8')
    compile(result, '<mobile-wrapper>', 'exec')
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['worker', 'worker-sha256', 'adapter', 'adapter-sha256', 'output']:
        parser.add_argument('--'+name, required=True)
    args = parser.parse_args()
    result = build(Path(args.worker).read_bytes(), args.worker_sha256,
                   Path(args.adapter).read_bytes(), args.adapter_sha256)
    with Path(args.output).open('xb') as output:
        output.write(result)
    print(hashlib.sha256(result).hexdigest())

if __name__ == '__main__': main()
