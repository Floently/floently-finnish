from api_contract import DiagnoseRequest, SessionIdentity


def test_diagnose_request_builds():
    payload = DiagnoseRequest(identity=SessionIdentity(user_id='u1', mode='learn'))
    assert payload.identity.mode == 'learn'
