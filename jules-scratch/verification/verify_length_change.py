
import json
import math
from playwright.sync_api import sync_playwright, Page, expect

def verify_length_change_respects_locked_angle(page: Page):
    # a function to set initial state with a predefined polygon
    def set_initial_state(page: Page):
        # A rectangle with one angle locked
        initial_state = {
            "points": [
                {"x": 200, "y": 200},
                {"x": 400, "y": 200},
                {"x": 400, "y": 400},
                {"x": 200, "y": 400},
            ],
            "lockedAngles": [2],  # Lock the 90-degree angle at point (400, 400)
            "lockedEdges": [],
            "isDrawing": False, # Start with a complete polygon
            "showLengths": True,
            "scale": 100 # Makes calculations easier (1m = 100px)
        }
        page.evaluate(f"localStorage.setItem('canvasState', '{json.dumps(initial_state)}')")

    # Navigate to the app and set the initial state
    page.goto("http://localhost:3000/")
    set_initial_state(page)
    page.reload()

    # CRITICAL STEP: Enter "Edit Mode" by clicking the button
    edit_button = page.get_by_role("button", name="Bearbeiten")
    expect(edit_button).to_be_visible()
    edit_button.click()

    # Get a handle to the canvas
    canvas = page.locator('canvas').last
    expect(canvas).to_be_visible()

    # The edge to modify is between point 1 (400, 200) and point 2 (400, 400).
    # Its length label is at the midpoint.
    edge_midpoint = {"x": 400, "y": 300}

    # Click the length label to open the input field.
    # We must wait for the Konva stage to be ready after the mode change.
    page.wait_for_timeout(500)
    canvas.click(position=edge_midpoint, force=True)

    # The input field should now be visible.
    length_input = page.locator('input[type="number"]')
    expect(length_input).to_be_visible(timeout=5000)

    # The original length is 2.00m. Let's change it to 3m.
    length_input.fill("3")
    length_input.press("Enter")

    # Take a screenshot to verify the result.
    page.screenshot(path="jules-scratch/verification/length-change-verification.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    verify_length_change_respects_locked_angle(page)
    browser.close()
