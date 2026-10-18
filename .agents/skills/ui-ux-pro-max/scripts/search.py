#!/usr/bin/env python3
"""
UI/UX Pro Max - Design System Search Engine for SIIA
Usage: python search.py "<query>" [--design-system] [-p "ProductName"]
"""
import sys, json, re

STYLES = {
    "enterprise": "Dense data layouts, sidebar nav, compact tables. Best for: ERP, Inventory, Admin.",
    "minimal-dark": "High contrast dark theme, clean whitespace, monochromatic. Best for: Data tables, lists.",
    "glass": "Glassmorphism - frosted glass cards, backdrop-blur, subtle borders. Best for: KPI cards, dashboards.",
    "aurora": "Gradient mesh backgrounds, glowing accents. Best for: AI panels, hero sections.",
    "bento": "Irregular bento grid layout. Best for: Overview dashboards.",
}

PALETTES = {
    "siia": {
        "primary": "#4F46E5", "primary_dark": "#1E1B4B", "ai": "#06B6D4",
        "success": "#10B981", "warning": "#F59E0B", "danger": "#EF4444",
        "bg_dark": "#0B1020"
    }
}

COMPONENTS = {
    "dashboard": ["KPI cards (glassmorphism)", "Bar chart (monthly movements)", "Alert table (low stock)", "AI widget (turquoise)"],
    "catalog":   ["Resource cards with photo", "Filter sidebar", "Search bar", "Status badge grid"],
    "table":     ["Sticky header", "Sort columns", "Row hover", "Bulk actions", "Pagination"],
    "form":      ["Labeled inputs", "Inline validation", "Multi-step wizard", "Confirmation step"],
    "ai panel":  ["Chat bubbles", "Action proposal card", "Confirm/Cancel buttons", "Thinking indicator"],
}

def search(query):
    q = query.lower()
    results = {"query": query, "recommended_styles": [], "components": [], "palette": "siia", "notes": []}

    for style, desc in STYLES.items():
        if any(word in desc.lower() for word in q.split()):
            results["recommended_styles"].append({"style": style, "description": desc})

    for comp, items in COMPONENTS.items():
        if comp in q or any(word in q for word in comp.split()):
            results["components"].append({"type": comp, "elements": items})

    if not results["recommended_styles"]:
        results["recommended_styles"] = [
            {"style": "enterprise", "description": STYLES["enterprise"]},
            {"style": "minimal-dark", "description": STYLES["minimal-dark"]},
        ]
    if not results["components"]:
        results["components"] = [{"type": "general", "elements": ["Use design-system/MASTER.md as reference"]}]

    results["palette_colors"] = PALETTES["siia"]
    results["notes"].append("SIIA uses enterprise + minimal-dark + glass accents. Palette is fixed by AGENTS.md.")
    return results

if __name__ == "__main__":
    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "dashboard"
    result = search(query)
    print(json.dumps(result, indent=2, ensure_ascii=False))
