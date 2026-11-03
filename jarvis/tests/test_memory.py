from jarvis.memory import Vault


def test_search_follows_wikilinks(cfg):
    v = Vault(cfg["paths"]["vault"])
    titles = [n.title for n in v.search("analytics access launch")]
    assert titles[0] == "Example Project"
    assert "Example Client" in titles  # pulled in via [[Example Client]] link


def test_graph_and_backlinks(cfg):
    v = Vault(cfg["paths"]["vault"])
    g = v.graph()
    assert {"source": "Example Project", "target": "Example Client"} in g["edges"]
    assert "Home" in v.backlinks("Home") or "Skill Map" in v.backlinks("Home")


def test_report_lands_in_vault_and_is_searchable(cfg):
    v = Vault(cfg["paths"]["vault"])
    p = v.write_report("Zebra pricing brief", "Zebras cost more in Q3.", skill="research/web-brief",
                       query='price of "zebras"', sources=["Example Project"])
    text = p.read_text()
    assert p.parent.name == "Reports"
    assert "[[Home]]" in text and "[[Example Project]]" in text
    assert "skill/research-web-brief" in text
    assert v.search("zebra pricing")[0].path == p.relative_to(v.root)
    assert v.stats()["reports"] == 1


def test_capture(cfg):
    p = Vault(cfg["paths"]["vault"]).capture("Call Dana about the renewal")
    assert p.parent.name == "Inbox" and "Call Dana" in p.read_text()
