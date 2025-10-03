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
        ]

        # Click on the canvas to draw the shape
        for x, y in points_to_click:
            page.mouse.click(canvas_box['x'] + x, canvas_box['y'] + y)
            page.wait_for_timeout(250)

        # Click the length label of the top edge to edit and lock it.
        # The top edge is between (200, 200) and (400, 200). Its midpoint is (300, 200).
        # The label is rendered slightly above the line. We click its approximate position.
        top_edge_label_x = 300
        top_edge_label_y = 185 # Corrected Y-coordinate to be on the label
        page.mouse.click(canvas_box['x'] + top_edge_label_x, canvas_box['y'] + top_edge_label_y)
        page.wait_for_timeout(250)

        # Use a specific locator to find the input field within the editing dialog
        length_input = page.locator("div").filter(has_text=re.compile(r"^Neue Länge eingeben:.*mOKAbbrechen$")).get_by_role("spinbutton")
        expect(length_input).to_be_visible()
        length_input.fill("4.50")
        page.keyboard.press("Enter")
        page.wait_for_timeout(500) # Wait for state update and lock to apply

        # Now, the top edge is locked. Attempt to drag the top-right point (point 1 at 400, 200)
        # It should not move from its original position.
        page.mouse.move(canvas_box['x'] + 400, canvas_box['y'] + 200)
        page.mouse.down()
        page.mouse.move(canvas_box['x'] + 450, canvas_box['y'] + 150, steps=10)
        page.mouse.up()
        page.wait_for_timeout(250)

        # Now, drag the bottom-right point (point 2 at 400, 400), which is unlocked.
        # This one should move, and the lines should follow.
        page.mouse.move(canvas_box['x'] + 400, canvas_box['y'] + 400)
        page.mouse.down()
        page.mouse.move(canvas_box['x'] + 480, canvas_box['y'] + 480, steps=10)
        page.mouse.up()

        # Take a screenshot to verify the final state
        page.screenshot(path="jules-scratch/verification/verification_final_drag_and_lock_fix.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)