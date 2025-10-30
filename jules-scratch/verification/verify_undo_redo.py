
import json
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")

        # Define canvas and initial points
        canvas_selector = "canvas"
        points_to_draw = [(300, 200), (500, 200), (500, 400), (300, 400)]

        # Clear localStorage to ensure a clean state
        page.evaluate("localStorage.clear()")
        page.reload()

        # 1. Draw a polygon
        canvas = page.locator(canvas_selector).first
        for x, y in points_to_draw:
            canvas.click(position={'x': x, 'y': y}, force=True)

        # Close the polygon by clicking the first point
        # A hover is required to trigger the closing mechanism
        page.locator(".konvajs-content > canvas").nth(1).hover(position={'x': 300, 'y': 200}, force=True)
        canvas.click(position={'x': 300, 'y': 200}, force=True)

        # 2. Finish drawing to enter editing mode
        page.get_by_text("Zeichnung fertigstellen").click()
        page.get_by_text("Zeichnung bearbeiten").click()

        # 3. Verify Undo/Redo buttons are visible in editing mode
        expect(page.get_by_text("Rückgängig")).to_be_visible()
        expect(page.get_by_text("Wiederholen")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/editing_mode_buttons.png")

        # 4. Perform Undo
        page.get_by_text("Rückgängig").click()
        page.screenshot(path="jules-scratch/verification/after_undo.png")

        # 5. Perform Redo
        page.get_by_text("Wiederholen").click()
        page.screenshot(path="jules-scratch/verification/after_redo.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
