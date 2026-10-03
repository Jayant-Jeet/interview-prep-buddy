import json
import os
import re
import subprocess
import sys

SKILLS = [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "SQL",
    "AWS", "Azure", "Docker", "Kubernetes", "REST APIs", "GraphQL", "Git",
    "CI/CD", "Testing", "Communication", "Leadership", "Agile", "Data Analysis",
    "Machine Learning", "Product Management", "Figma", "UX Research", "Accessibility",
    "Project Management", "TypeScript", "HTML", "CSS", "Next.js", "Vue", "Angular",
    "Go", "Rust", "C#", "C++", "PostgreSQL", "MongoDB", "Redis", "Kafka", "Microservices"
]

EXPERIENCE_PATTERNS = [
    r"(?i)(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)",
    r"(?i)(?:worked|experience)\s*(?:for)?\s*(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:years?|yrs?)",
]

ROLE_HINTS = [
    "software engineer", "frontend engineer", "backend engineer", "full stack engineer",
    "product designer", "product manager", "data analyst", "data scientist", "researcher",
    "engineering manager", "design engineer", "ux designer"
]


def normalize_text(value):
    return re.sub(r"\s+", " ", value or "").strip()


def extract_years(text):
    years = []
    for pattern in EXPERIENCE_PATTERNS:
        for match in re.finditer(pattern, text):
            try:
                years.append(float(match.group(1)))
            except ValueError:
                continue
    return round(max(years), 1) if years else 0.0


def extract_role(text):
    lowered = text.lower()
    for hint in ROLE_HINTS:
        if hint in lowered:
            return hint.title()
    return "General role"


def extract_skills_regex(text):
    normalized = text.lower()
    matches = []
    for skill in SKILLS:
        skill_lower = skill.lower()
        if skill_lower in normalized:
            matches.append(skill)
    return matches


def spaCy_available():
    try:
        import spacy  # noqa: F401
        return True
    except Exception:
        return False


def transformers_available():
    try:
        from transformers import pipeline  # noqa: F401
        return True
    except Exception:
        return False


def run_spacy_like_extraction(text):
    if not spaCy_available():
        return None
    try:
        import spacy
        nlp = spacy.blank("en")
        doc = nlp(text)
        entities = []
        for ent in doc.ents:
            if ent.label_ in {"ORG", "PRODUCT", "SKILL", "GPE", "PERSON"}:
                entities.append(ent.text)
        return {"skills": entities[:25], "experienceYears": extract_years(text), "role": extract_role(text)}
    except Exception:
        return None


def run_transformers_extraction(text):
    if not transformers_available():
        return None
    try:
        from transformers import pipeline
        pipe = pipeline("token-classification", model="dslim/bert-base-NER", aggregation_strategy="simple")
        entities = pipe(text[:2000])
        skills = [item["word"] for item in entities if item.get("entity_group") in {"MISC", "ORG", "PER"}]
        return {"skills": skills[:25], "experienceYears": extract_years(text), "role": extract_role(text)}
    except Exception:
        return None


def extract_profile(text):
    text = normalize_text(text)
    if not text:
        return {"skills": [], "experienceYears": 0.0, "role": "General role"}

    for extractor in (run_spacy_like_extraction, run_transformers_extraction):
        result = extractor(text)
        if result and result.get("skills"):
            return result

    skills = extract_skills_regex(text)
    return {
        "skills": list(dict.fromkeys(skills))[:25],
        "experienceYears": extract_years(text),
        "role": extract_role(text),
    }


if __name__ == "__main__":
    try:
        text = sys.stdin.read()
    except Exception:
        text = ""
    profile = extract_profile(text)
    print(json.dumps(profile))
