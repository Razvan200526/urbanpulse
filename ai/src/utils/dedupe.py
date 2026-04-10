from collections.abc import Iterable


def dedupe(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    unique: list[str] = []

    for value in values:
        if value in seen:
            continue
        seen.add(value)
        unique.append(value)

    return unique
