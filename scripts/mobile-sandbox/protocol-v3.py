"""Narrow transport compatibility for the deployed serial V3 API."""
def worker_payload(payload, endpoint=None):
    if endpoint is not None:
        raise RuntimeError('Build compatibility worker cannot access auth sessions')
    action = payload.get('action')
    if action == 'poll':
        return {'action': 'poll', 'worker_version': 3,
                **({'heartbeat': True} if payload.get('heartbeat') is True else {})}
    if action == 'heartbeat':
        return {'action': 'heartbeat', 'busy': True, 'worker_version': 3}
    if action == 'complete':
        keys = ('job_id', 'lease_token', 'exit_code', 'stdout', 'stderr',
                'duration_ms', 'output_truncated')
        return {'action': 'complete', **{key: payload[key] for key in keys}}
    raise RuntimeError('Unsupported V3 action')
