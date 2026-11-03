from jarvis.skills import SkillTree, parse_frontmatter


def test_frontmatter_lists_and_escapes():
    meta, body = parse_frontmatter('---\nname: x\ntriggers: ["\\\\bhi\\\\b", \'it\'\'s\']\n---\nBody')
    assert meta == {"name": "x", "triggers": [r"\bhi\b", "it's"]}
    assert body == "Body"


def test_tree_discovers_branches_and_skips_template(cfg):
    tree = SkillTree(cfg["paths"]["skills"])
    assert "ops/daily-brief" in tree.skills
    assert not any(s.startswith("_") for s in tree.skills)
    assert set(tree.branches()) >= {"ops", "research", "clients", "memory"}


def test_body_is_lazy_and_catalog_is_lean(cfg):
    tree = SkillTree(cfg["paths"]["skills"])
    catalog = tree.catalog()
    assert "# Steps" not in catalog          # router never sees skill bodies
    assert "# Goal" in tree.get("ops/daily-brief").body()


def test_claude_code_sync(cfg, tmp_path):
    tree = SkillTree(cfg["paths"]["skills"])
    links = tree.sync_claude_code(tmp_path)
    assert (tmp_path / ".claude/skills/ops-daily-brief/SKILL.md").exists()
    assert len(links) == len(tree.skills)
