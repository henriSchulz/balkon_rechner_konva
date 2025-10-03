import re
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000", timeout=20000)

        # Get the canvas element
        canvas = page.locator('canvas').first
        expect(canvas).to_be_visible(timeout=10000)

        # Get bounding box of the canvas
        canvas_box = canvas.bounding_box()
        if not canvas_box:
            raise Exception("Canvas bounding box not found")

        # Define points to draw a simple square
        points_to_click = [
            (200, 200),
            (400, 200),
            (400, 400),
            (200, 400),
            (200, 200), # Close the shape
        ]

        # Click on the canvas to draw the shape
        for x, y in points_to_click:
            page.mouse.click(canvas_box['x'] + x, canvas_box['y'] + y)
            page.wait_for_timeout(250)

        page.wait_for_timeout(1000) # Wait for render

        # Take a screenshot to see where the labels are
        page.screenshot(path="jules-scratch/verification/label_position_check.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)