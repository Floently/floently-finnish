from src.features.practice_content.pipeline.build_phrase_cards import main as build_phrase_cards
from src.features.practice_content.pipeline.build_card_index import main as build_card_index
from src.features.practice_content.pipeline.publish_to_material_bank import main as publish

if __name__ == '__main__':
    build_phrase_cards()
    build_card_index()
    publish()
