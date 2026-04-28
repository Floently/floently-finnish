from engine.validator.rules import validate_level_band

def test_validate_level_band_accepts_known_values():
    assert validate_level_band('B1_B2') is True
